---
title: "在有 UI 线程参与的同步锁（如 AutoResetEvent）内部使用 await 可能导致死锁"
date: 2018-12-21 16:37:18 +0800
categories: dotnet wpf
position: knowledge
---

`AutoResetEvent`、`ManualResetEvent`、`Monitor`、`lock` 等等这些用来做同步的类，如果在异步上下文（await）中使用，需要非常谨慎。

本文将说一个在同步上下文中非常常见的一种用法，换成异步上下文中会产生死锁的问题。

---

<div id="toc"></div>

### 一段正常的同步上下文的代码

先看看一段非常简单的代码：

```csharp
private void OnLoaded(object sender, RoutedEventArgs e)
{
    ThreadPool.SetMinThreads(100, 100);

    // 全部在后台线程，不会死锁。
    for (var i = 0; i < 100; i++)
    {
        Task.Run(() => Do());
    }

    // 主线程执行与后台线程并发竞争，也不会死锁。
    for (var i = 0; i < 100; i++)
    {
        Do();
    }
}

private void Do()
{
    _resetEvent.WaitOne();

    try
    {
        // 这个 ++ 在安全的线程上下文中，所以不需要使用 Interlocked.Increment(ref _count);
        _count++;
        DoCore();
    }
    finally
    {
        _resetEvent.Set();
    }
}

private void DoCore()
{
    Console.WriteLine($"[{_count.ToString().PadLeft(3, ' ')}] walterlv is a 逗比");
}
```

以上代码运行会输出 200 个 “walterlv is a 逗比”：

```csharp
[  1] walterlv is a 逗比
[  2] walterlv is a 逗比
[  3] walterlv is a 逗比
[  4] walterlv is a 逗比
[  5] walterlv is a 逗比
[  6] walterlv is a 逗比
[  7] walterlv is a 逗比
[  8] walterlv is a 逗比
[  9] walterlv is a 逗比
[ 10] walterlv is a 逗比
// 有 200 个，但是不需要再在这里占用行数了。[197] walterlv is a 逗比
[200] walterlv is a 逗比
```

以上代码最关键的使用锁进行同步的地方是 `Do` 函数，采用了非常典型的防止方法重入的措施：

```csharp
// 获得锁
try
{
    // 执行某个需要线程安全的操作。
}
finally
{
    // 释放锁
}
```

我们设置了线程池最小线程数为 100，这样在使用 `Task.Run` 进行并发的时候，一次能够开启 100 个线程来执行 `Do` 方法。同时 UI 线程也执行 100 次，与后台线程竞争输出。

### 一个微调即会死锁

现在我们微调一下刚刚的代码：

```csharp
private void OnLoaded(object sender, RoutedEventArgs e)
{
    ThreadPool.SetMinThreads(100, 100);

    // 全部在后台线程，不会死锁。
    for (var i = 0; i < 100; i++)
    {
        Task.Run(() => DoAsync());
    }

    // 主线程执行与后台线程并发竞争，也不会死锁。
    for (var i = 0; i < 100; i++)
    {
        DoAsync();
    }
}

private async Task DoAsync()
{
    _resetEvent.WaitOne();

    try
    {
        _count++;
        await DoCoreAsync();
    }
    finally
    {
        _resetEvent.Set();
    }
}

private async Task DoCoreAsync()
{
    await Task.Run(async () =>
    {
        Console.WriteLine($"[{_count.ToString().PadLeft(3, ' ')}] walterlv is a 逗比");
    });
}
```

为了直观看出差别，我只贴出不同之处：

```diff
        {
--          Task.Run(() => Do());
++          Task.Run(() => DoAsync());
        }
    ...
        {
--          Do();
++          DoAsync();
        }

--  private void Do()
++  private async Task DoAsync()
    {
    ...
            _count++;
--          await DoCore();
++          await DoCoreAsync();
        }
    ...
    }

--  private void DoCore()
++  private async Task DoCoreAsync()
    {
--      Console.WriteLine($"[{_count.ToString().PadLeft(3, ' ')}] walterlv is a 逗比");
++      await Task.Run(async () =>
++      {
++          Console.WriteLine($"[{_count.ToString().PadLeft(3, ' ')}] walterlv is a 逗比");
++      });
    }
```

现在再运行代码，只输出几次程序就停下来了：

```log
[  0] walterlv is a 逗比
[  1] walterlv is a 逗比
[  2] walterlv is a 逗比
[  3] walterlv is a 逗比
[  4] walterlv is a 逗比
[  5] walterlv is a 逗比
```

每次运行时，停下来的次数都不相同，这也正符合多线程坑的特点。

### 此死锁的触发条件

实际上，以上这段代码如果没有 WPF / UWP 的 UI 线程的参与，是 **不会出现死锁** 的。

但是，如果有 UI 线程参与，即便只有 UI 线程调用，也会直接死锁。例如：

```csharp
DoAsync();
DoAsync();
```

只是这样的调用，你会看到值输出一次 —— 这就已经死锁了！

### 此死锁的原因

WPF / UWP 等 UI 线程会使用 `DispatcherSynchronizationContext` 作为线程同步上下文，我在 [出让执行权：Task.Yield, Dispatcher.Yield - walterlv](/post/yield-in-task-dispatcher.html) 一问中有说到它的原理。

在 `await` 等待完成之后，会调用 `BeginInvoke` 回到 UI 线程。然而，此时 UI 线程正卡死在 `_resetEvent.WaitOne();`，于是根本没有办法执行 `BeginInvoke` 中的操作，也就是 `await` 之后的代码。然而释放锁的代码 `_resetEvent.Set();` 就在 `await` 之后，所以不会执行，于是死锁。

### 更多死锁问题

死锁问题：

- [使用 Task.Wait()？立刻死锁（deadlock） - walterlv](/post/deadlock-in-task-wait.html)
- [不要使用 Dispatcher.Invoke，因为它可能在你的延迟初始化 Lazy<T> 中导致死锁 - walterlv](/post/deadlock-of-invoke-in-lazy.html)
- [在有 UI 线程参与的同步锁（如 AutoResetEvent）内部使用 await 可能导致死锁](/post/deadlock-if-await-in-ui-lock-context.html)
- [.NET 中小心嵌套等待的 Task，它可能会耗尽你线程池的现有资源，出现类似死锁的情况 - walterlv](/post/task-wait-may-cause-long-time-waiting.html)

解决方法：

- [在编写异步方法时，使用 ConfigureAwait(false) 避免使用者死锁 - walterlv](/post/using-configure-await-to-avoid-deadlocks.html)
- [将 async/await 异步代码转换为安全的不会死锁的同步代码（使用 PushFrame） - walterlv](/post/convert-async-to-sync-by-push-frame.html)
