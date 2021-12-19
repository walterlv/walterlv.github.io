---
title: "了解 .NET 的默认 TaskScheduler 和线程池（ThreadPool）设置，避免让 Task.Run 的性能急剧降低"
publishDate: 2018-12-13 18:41:33 +0800
date: 2018-12-23 15:16:55 +0800
tags: dotnet
position: knowledge
coverImage: /static/posts/2018-12-23-14-53-33.png
permalink: /post/default-task-scheduler-and-thread-pool.html
---

.NET Framework 4.5 开始引入 `Task.Run`，它可以很方便的帮助我们使用 `async` / `await` 语法，同时还使用线程池来帮助我们管理线程。以至于我们编写异步代码可以像编写同步代码一样方便。

不过，如果滥用，也可能导致应用的性能急剧下降。本文将说明在默认线程池配置（`ThreadPoolTaskScheduler`）的情况下，应该如何使用 `Task.Run` 来避免性能的急剧降低。

---

<div id="toc"></div>

## 如何使用 Task.Run？

1. 对于 IO 操作，尽量使用原生提供的 `Async` 方法（不要自己使用 `Task.Run` 调用一个同步的版本占用线程池资源）；
1. 对于没有 `Async` 版本的 IO 操作，如果可能耗时很长，则指定 `CreateOptions` 为 `LongRunning`。
1. 其他短时间执行的任务才推荐使用 `Task.Run`。

接下来分析原因：

## 示例程序和示例代码

在开始之前，我们先准备一个测试程序。这个程序一开始就使用 `Task.Run` 跑起来 10 个异步任务，每一个里面都等待 5 秒。

![使用 Task.Run 跑起来的异步代码](/static/posts/2018-12-23-14-53-33.png)

可以发现，虽然我们是同一时间启动的 10 个异步任务，但任务的实际开始时间并不相同 —— 前面 8 个任务立刻开始了，而后面每隔一秒才会启动一个新的异步任务。

示例程序的代码如下：

```csharp
class Program
{
    static async Task Main(string[] args)
    {
        Console.Title = "walterlv task demo";

        var task = Enumerable.Range(0, 10).Select(i => Task.Run(() => LongTimeTask(i))).ToList();
        await Task.WhenAll(task);

        Console.Read();
    }

    private static void LongTimeTask(int index)
    {
        var threadId = Thread.CurrentThread.ManagedThreadId.ToString().PadLeft(2, ' ');
        var line = index.ToString().PadLeft(2, ' ');
        Console.WriteLine($"[{line}] [{threadId}] [{DateTime.Now:ss.fff}] 异步任务已开始……");

        // 这一句才是关键，等待。其他代码只是为了输出。
        Thread.Sleep(5000);

        Console.ForegroundColor = ConsoleColor.Green;
        Console.WriteLine($"[{line}] [{threadId}] [{DateTime.Now:ss.fff}] 异步任务已结束……");
        Console.ForegroundColor = ConsoleColor.White;
    }
}
```

## TaskScheduler

造成以上异步任务不马上开始的原因，与 `Task` 使用的 `TaskScheduler` 有关。默认情况下，`Task.Run` 使用的是 .NET 提供的默认 Scheduler，可以通过 `TaskScheduler.Default` 获取到。

Task 使用 `TaskScheduler` 来决定何时执行一个异步任务，如果你不设置，默认的实现是 `ThreadPoolTaskScheduler`。

你可以前往 .NET Core 的源码页面查看源码：[ThreadPoolTaskScheduler.QueueTask](https://source.dot.net/#System.Private.CoreLib/src/System/Threading/Tasks/ThreadPoolTaskScheduler.cs,33cd274e06874569,references)。

于是，你在线程池中的设置将决定一个 Task 将在何时开启一个线程执行。

## ThreadPool

通过 `ThreadPool.GetMinThreads` 可以获得最小的线程数和异步 IO 完成线程数；通过 `ThreadPool.GetMaxThreads` 来获得其最大值。通过对应的 `set` 方法来设置最小值和最大值。

在 [ThreadPool.GetMinThreads(Int32, Int32) Method (System.Threading) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/system.threading.threadpool.getminthreads?wt.mc_id=MVP)

- 线程池按需提供新的工作线程或 I/O 完成线程直到它达到每个类别的最小值。
- 默认情况下，最小线程数设置为在系统上的处理器数。
- 当达到最小值时，线程池可以创建该类别中的其他线程或等待，直到一些任务完成。
- 需求较低时，线程池线程的实际数量可以低于最小值。

于是便会出现我们在本文一开始运行时出现的结果图。在我的计算机上（八核），最小线程数是 8，于是开始的 8 个任务可以立即开始执行。当达到数量 8 而依然没有线程完成执行的时候，线程池会尝试等待任务完成。但是，1 秒后依然没有任务完成，于是线程池创建了一个新的线程来执行新的任务；接下来是每隔一秒会开启一个新的线程来执行现有任务。当有任务完成之后，就可以直接使用之前完成了任务的线程继续完成新的任务。

不过，每个类别创建线程的总数量受到最大线程数限制。

## 推荐的使用方法

了解到 `ThreadPoolTaskScheduler` 的默认行为之后，我们可以做这些事情来充分利用线程池带来的优势：

1. 对于 IO 操作，尽量使用原生提供的 `Async` 方法，这些方法使用的是 IO 完成端口，占用线程池中的 IO 线程而不是普通线程（不要自己使用 `Task.Run` 占用线程池资源）；
1. 对于没有 `Async` 版本的 IO 操作，如果可能耗时很长，则指定 `CreateOptions` 为 `LongRunning`（这样便会直接开一个新线程，而不是使用线程池）。
1. 其他短时间执行的任务才推荐使用 `Task.Run`。

---

**参考资料**

- [TaskScheduler Class (System.Threading.Tasks) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/system.threading.tasks.taskscheduler?wt.mc_id=MVP)
- [TaskCreationOptions Enum (System.Threading.Tasks) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/system.threading.tasks.taskcreationoptions?wt.mc_id=MVP)
- [Parallel Tasks - Microsoft Docs](https://docs.microsoft.com/en-us/previous-versions/msp-n-p/ff963549(v=pandp.10)?wt.mc_id=MVP)
- [Attached and Detached Child Tasks - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/parallel-programming/attached-and-detached-child-tasks?wt.mc_id=MVP)
- 在 [ThreadPool.GetMinThreads(Int32, Int32) Method (System.Threading) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/system.threading.threadpool.getminthreads?wt.mc_id=MVP)
- [Managed Threading Best Practices - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/threading/managed-threading-best-practices?wt.mc_id=MVP)


