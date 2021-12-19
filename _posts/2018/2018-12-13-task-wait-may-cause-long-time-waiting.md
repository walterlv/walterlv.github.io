---
title: ".NET 中小心嵌套等待的 Task，它可能会耗尽你线程池的现有资源，出现类似死锁的情况"
publishDate: 2018-12-13 19:21:25 +0800
date: 2019-03-15 15:54:00 +0800
tags: dotnet
position: problem
---

一个简单的 `Task` 不会消耗多少时间，但如果你不合适地将 `Task` 转为同步等待，那么也可能很快耗尽线程池的所有资源，出现类似死锁的情况。

本文将以一个最简单的例子说明如何出现以及避免这样的问题。

---

<div id="toc"></div>

## 耗时的 Task.Run

谁都不会认为 `Task.Run(() => 1)` 这个异步任务执行会消耗多少时间。

但实际上，如果你的代码写得不清真，它真的能消耗大量的时间，这种时间消耗有点像死锁。

下图分别是 7 个这样的任务、8 个这样的任务和 16 个这样的任务的耗时：

![简单异步任务的耗时](/static/posts/2018-12-15-15-08-59.png)

可以发现，8 个任务和 16 个任务的耗时很不正常。

在实际的测试当中，1~7 个任务的耗时几乎相同，而到后面每增加一个任务会增加大量时间。

| 任务个数 | 耗时 (ms) |
| -------- | --------- |
| 1        | 39        |
| 2        | 54        |
| 3        | 58        |
| 4        | 50        |
| 5        | 49        |
| 6        | 45        |
| 7        | 54        |
| 8        | 1027      |
| 9        | 2030      |
| 10       | 3027      |
| 11       | 4027      |
| 12       | 5032      |
| 13       | 6027      |
| 14       | 7029      |
| 15       | 8025      |
| 16       | 9025      |

任务计时采用的是 Stopwatch，关于为什么要使用这种计时方式，可以阅读 [.NET/C# 在代码中测量代码执行耗时的建议（比较系统性能计数器和系统时间）](/post/dotnet-high-precision-performance-counting)

![统计图表](/static/posts/2018-12-15-15-17-59.png)

从图中，我们可以很直观地观察到，每多一个任务，就会多花 1 秒的事件。这可以认为默认情况下线程池在增加线程的时候，发现如果线程不够，会等待 1 秒之后才会创建新的线程。

## 最简复现代码

```csharp
class Program
{
    static async Task Main(string[] args)
    {
        Console.Title = "walterlv task demo";

        var stopwatch = Stopwatch.StartNew();

        var task = Enumerable.Range(0, 8).Select(i => Task.Run(() => DoAsync(i).Result)).ToList();
        await Task.WhenAll(task);

        Console.WriteLine($"耗时: {stopwatch.Elapsed}");
        Console.Read();
    }

    private static async Task<int> DoAsync(int index)
    {
        return await Task.Run(() => 1);
    }
}
```

## 原因

你可以阅读 [.NET 默认的 TaskScheduler 和线程池（ThreadPool）设置](/post/default-task-scheduler-and-thread-pool) 了解线程池创建新工作线程的规则。这里其实真的是类似于死锁的一个例子。

1. 一开始，我们创建了 n 个 Task，然后分别安排在线程池中执行，并在每个 Task 中等待任务执行完毕；
2. 随后这 n 个 Task 分别再创建了 n 个子 Task，并继续安排在线程池中执行；
3. 这时问题来了，由于前面 n 个 Task 在等待中，所以占用了线程池的线程资源：
   - 如果 n < 线程池最小线程数，那么当前线程池中还有剩余工作线程帮助完成子 Task；
   - 但如果 n >= 线程池最小线程数，那么当前线程池中便没有新的工作线程来完成子 Task；于是一开始的等待也不会完成；必须等线程池开启新的工作线程后，任务才可以继续。

带线程池开启新的线程之前，以上那些线程就是处于死锁的状态！由于线程池开启新的工作线程需要等待一段时间（例如每秒最多开启一个新的线程），所以每增加一个这样的任务，那么消耗的时间便会持续增加。

## 解决

去掉这里本来多余的 `Task.Run` 问题便可以解决。或者一直 `async`/`await` 中间不要转换为同步代码，那么问题也能解决。

我会遇到以上代码，是因为在库中写了类似 `DoAsync` 那样的方法。同时为了方便使用，封装了一个同步等待的属性。在业务使用方，觉得获取此属性可能比较耗时，于是用了 `Task.Run` 在后台线程调用。同时由于这是一个可能大量并发的操作，于是造成了以上悲剧。

## 更多死锁问题

死锁问题：

- [使用 Task.Wait()？立刻死锁（deadlock） - walterlv](/post/deadlock-in-task-wait)
- [不要使用 Dispatcher.Invoke，因为它可能在你的延迟初始化 `Lazy<T>` 中导致死锁 - walterlv](/post/deadlock-of-invoke-in-lazy)
- [在有 UI 线程参与的同步锁（如 AutoResetEvent）内部使用 await 可能导致死锁](/post/deadlock-if-await-in-ui-lock-context)
- [.NET 中小心嵌套等待的 Task，它可能会耗尽你线程池的现有资源，出现类似死锁的情况 - walterlv](/post/task-wait-may-cause-long-time-waiting)

解决方法：

- [在编写异步方法时，使用 ConfigureAwait(false) 避免使用者死锁 - walterlv](/post/using-configure-await-to-avoid-deadlocks)
- [将 async/await 异步代码转换为安全的不会死锁的同步代码（使用 PushFrame） - walterlv](/post/convert-async-to-sync-by-push-frame)
