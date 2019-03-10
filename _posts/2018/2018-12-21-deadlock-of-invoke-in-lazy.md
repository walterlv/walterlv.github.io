---
title: "不要使用 Dispatcher.Invoke，因为它可能在你的延迟初始化 Lazy<T> 中导致死锁"
publishDate: 2018-12-21 14:47:30 +0800
date: 2018-12-23 15:17:02 +0800
categories: dotnet wpf
position: knowledge
---

WPF 中为了 UI 的跨线程访问，提供了 `Dispatcher` 线程模型。其 `Invoke` 方法，无论在哪个线程调用，都可以让传入的方法回到 UI 线程。

然而，如果你在 Lazy<T> 上下文中使用了 `Invoke`，那么当这个 `Lazy<T>` 跨线程并发时，极有可能导致死锁。本文将具体说说这个例子。

---

<div id="toc"></div>

## 一段死锁的代码

请先看一段非常简单的 WPF 代码：

```csharp
private Lazy<Walterlv> _walterlvLazy = new Lazy<Walterlv>(() => new Walterlv());

private void OnLoaded(object sender, RoutedEventArgs e)
{
    Task.Run(() =>
    {
        // 在后台线程通过 Lazy 获取。
        var backgroundWalterlv = _walterlvLazy.Value;
    });

    // 等待一个时间，这样可以确保后台线程先访问到 Lazy，并且在完成之前，UI 线程也能访问到 Lazy。
    Thread.Sleep(50);

    // 在主线程通过 Lazy 获取。
    var walterlv = _walterlvLazy.Value;
}
```

而其中的 `Walterlv` 类的定义也是非常简单的：

```csharp
class Walterlv
{
    public Walterlv()
    {
        // 等待一段时间，是为了给我么的测试程序一个准确的时机。
        Thread.Sleep(100);

        // Invoke 到主线程执行，里面什么都不做是为了证明绝不是里面代码带来的影响。
        Application.Current.Dispatcher.Invoke(() =>
        {
        });
    }
}
```

这里的 `Application.Current.Dispatcher` 并不一定必须是 `Application.Current`，只要是两个不同线程拿到的 `Dispatcher` 的实例是同一个，就会死锁。

## 此死锁的触发条件

1. `Lazy<T>` 的线程安全参数设置为默认的，也就是 `LazyThreadSafetyMode.ExecutionAndPublication`；
1. 后台线程和主 UI 线程并发访问这个 `Lazy<T>`，且后台线程先于主 UI 线程访问这个 `Lazy<T>`；
1. `Lazy<T>` 内部的代码包含主线程的 `Invoke`。

## 此死锁的原因

1. 后台线程访问到 Lazy，于是 Lazy 内部获得同步锁；
1. 主 UI 线程访问到 Lazy，于是主 UI 线程等待同步锁完成，并进入阻塞状态（以至于不能处理消息循环）；
1. 后台线程的初始化调用到 `Invoke` 需要到 UI 线程完成指定的任务后才会返回，但 UI 线程此时阻塞不能处理消息循环，以至于无法完成 `Invoke` 内的任务；

于是，后台线程在等待 UI 线程处理消息以便让 `Invoke` 完成，而主 UI 线程由于进入 Lazy 的等待，于是不能完成 `Invoke` 中的任务；于是发生死锁。

## 此死锁的解决方法

`Invoke` 改为 `InvokeAsync` 便能解锁。

这么做能解决的原因是：后台线程能够及时返回，这样 UI 线程便能够继续执行，包括执行 `InvokeAsync` 中传入的任务。

实际上，以上可能是最好的解决办法了。因为：

1. 我们使用 Lazy 并且设置线程安全，一定是因为这个初始化过程会被多个线程访问；
1. 我们会在 Lazy 的初始化代码中使用回到主线程的 `Invoke`，也是因为我们预料到这份初始化代码可能在后台线程执行。

所以，这段初始化代码既然不可避免地会并发，那么就应该阻止并发造成的死锁问题。也就是不要使用 `Invoke` 而是改用 `InvokeAsync`。

如果需要使用 `Invoke` 的返回值，那么改为 `InvokeAsync` 之后，可以使用 `await` 异步等待返回值。

## 更多死锁问题

死锁问题：

- [使用 Task.Wait()？立刻死锁（deadlock） - walterlv](/post/deadlock-in-task-wait.html)
- [不要使用 Dispatcher.Invoke，因为它可能在你的延迟初始化 Lazy<T> 中导致死锁 - walterlv](/post/deadlock-of-invoke-in-lazy.html)
- [在有 UI 线程参与的同步锁（如 AutoResetEvent）内部使用 await 可能导致死锁](/post/deadlock-if-await-in-ui-lock-context.html)
- [.NET 中小心嵌套等待的 Task，它可能会耗尽你线程池的现有资源，出现类似死锁的情况 - walterlv](/post/task-wait-may-cause-long-time-waiting.html)

解决方法：

- [在编写异步方法时，使用 ConfigureAwait(false) 避免使用者死锁 - walterlv](/post/using-configure-await-to-avoid-deadlocks.html)
- [将 async/await 异步代码转换为安全的不会死锁的同步代码（使用 PushFrame） - walterlv](/post/convert-async-to-sync-by-push-frame.html)
