---
title: "使用 Task.Wait()？立刻死锁（deadlock）"
publishDate: 2017-10-27 23:54:46 +0800
date: 2018-12-21 16:37:39 +0800
categories: dotnet csharp
---

最近读到一篇异步转同步的文章，发现其中没有考虑到异步转同步过程中发生的死锁问题，所以特地在本文说说异步转同步过程中的死锁问题。

---

文章作者 [林德熙](https://lindexi.gitee.io/lindexi/) 已经修复了描述：
- [win10 uwp 异步转同步](https://lindexi.gitee.io/lindexi/post/win10-uwp-%E5%BC%82%E6%AD%A5%E8%BD%AC%E5%90%8C%E6%AD%A5.html)

---

### 什么情况下会产生死锁？

调用 `Task.Wait()` 或者 `Task.Result` 立刻产生死锁的充分条件：
1. 调用 `Wait()` 或 `Result` 的代码位于 UI 线程；
1. `Task` 的实际执行在其他线程，且需要返回 UI 线程。

死锁的原因：

UWP、WPF、Windows Forms 程序的 UI 线程都是单线程的。为了让使用了 `async`/`await` 的代码像使用同步代码一样简单，WPF 程序的 `Application` 类在构造的时候会将主 UI 线程 `Task` 的同步上下文设置为 `DispatcherSynchronizationContext` 的实例，这在我的另一篇文章 [Task.Yield](/post/yield-in-task-dispatcher.html#taskyield) 中也有过说明。

当 `Task` 的任务结束时，会从 `AsyncMethodStateMachine` 中调用 `Awaiter` 的 `OnComplete()` 方法，而 `await` 后续方法的执行靠的就是 `OnComplete()` 方法中一层层调用到 `DispatcherSynchronizationContext` 里的 `Post` 方法：

```csharp
/// <summary>
///     Asynchronously invoke the callback in the SynchronizationContext.
/// </summary>
public override void Post(SendOrPostCallback d, Object state)
{
    // Call BeginInvoke with the cached priority.  Note that BeginInvoke
    // preserves the behavior of passing exceptions to
    // Dispatcher.UnhandledException unlike InvokeAsync.  This is
    // desireable because there is no way to await the call to Post, so
    // exceptions are hard to observe.
    _dispatcher.BeginInvoke(_priority, d, state);
}
```

这里就是问题的关键！！！

如果 `_dispatcher.BeginInvoke(_priority, d, state);` 这句代码在后台线程，那么此时 UI 线程处于 `Wait()`/`Result` 调用中的阻塞状态，`BeginInvoke` 中的任务是无论如何也无法执行到的！于是无论如何都无法完成这个 `Post` 任务，即无论如何也无法退出此异步任务的执行，于是 `Wait()` 便无法完成等待……死锁……

这里给出最简复现的例子代码：

```csharp
DoAsync().Wait();

async Task DoAsync()
{
    await Task.Run(() => { });
}
```

无论是 WPF 还是 UWP，只要在 UI 线程上调用上述代码，必然死锁！

### 什么情况下不会产生死锁？

阅读了本文一开始说的那篇文章 [win10 uwp 异步转同步](https://lindexi.gitee.io/lindexi/post/win10-uwp-%E5%BC%82%E6%AD%A5%E8%BD%AC%E5%90%8C%E6%AD%A5.html) 后，你一定好奇为什么此文的情况不会产生死锁。

那是因为，它不满足本文提到的充分条件——`StorageFolder.GetFolderFromPathAsync("")` 和 `StorageFolder.GetFolderFromPathAsync("")` 这两个方法**并不会在后台线程执行**！

逗我？？？不在后台线程执行怎么做到的异步等待！！！

是的，读写文件，访问网络，这些 IO 阻塞的操作执行时，里面**根本就没有线程**，详情请阅读：[There Is No Thread](http://blog.stephencleary.com/2013/11/there-is-no-thread.html)。

还有另一些操作，也没有后台线程的参与，于是也不存在从后台线程回到主线程导致死锁的情况。如 [Task.Yield](/post/yield-in-task-dispatcher.html#taskyield)，还有 [InvokeAsync](/post/dotnet/2017/09/26/dispatcher-invoke-async.html)，它们也不会造成死锁。

另外，如果是控制台程序，或者一个普通的非 UI 线程，其 `SynchronizationContext` 为 null，那么异步任务执行完后不需要回到原有线程，也不会造成死锁。

总结不会造成死锁的充分条件：
1. 异步操作执行完后不需要回到原有线程（例如非 UI 线程和控制台线程）；
1. 异步操作不需要单独的线程执行任务。

### 如何避免死锁？

明确了会造成死锁的条件和不会造成死锁的条件后，我们只需要做到以下几点即可避免死锁了：

1. 在 UI 线程，如果使用了 `async`/`await`，就尽量不要再使用 `Task.Wait()`/`Task.Result` 了，就一直异步一条路走到黑好了（微软称其为 Async All the Way）。
1. 如果可能，尽量在异步任务后添加 `.ConfigureAwait(false)`；这样，异步任务后面继续执行的代码就不会回到原 UI 线程了，而是直接从线程池中再取出一个线程执行；这样，即便 UI 线程后续可能有别的原因造成阻塞，也不会产生死锁了。

把原来的代码改成这样，就不会死锁了：

```csharp
await DoAsync();

async Task DoAsync()
{
    await Task.Run(() => { });
}
```

没错！只能是一路 `async`/`await`。微软将其描述为：`async`/`await` 会像病毒一样在你的代码中传播。

> Others have also noticed the spreading behavior of asynchronous programming and have called it “contagious” or compared it to a zombie virus.

这句话的原文参见：[Async/Await - Best Practices in Asynchronous Programming](https://msdn.microsoft.com/en-us/magazine/jj991977.aspx)

为了防止真的有代码的调用者使用 `Wait()`，我们也得写出防 SB 的代码来：

```csharp
async Task DoAsync()
{
    await Task.Run(() => { }).ConfigureAwait(false);
}
```

这一句的目的是防止执行上下文切换回 UI 线程。

这样，即便真的使用 `DoAsync().Wait()` 也不会发生死锁。注意，**整个方法调用链都需要使用** `.ConfigureAwait(false)` **才能够防止线程切换时，在调用方的** `Wait()` **方法中发生死锁**。详见我的另一篇博客 [在编写异步方法时，使用 ConfigureAwait(false) 避免使用者死锁](/post/using-configure-await-to-avoid-deadlocks.html)。）

### 更多死锁问题

死锁问题：

- [使用 Task.Wait()？立刻死锁（deadlock） - walterlv](/post/deadlock-in-task-wait.html)
- [不要使用 Dispatcher.Invoke，因为它可能在你的延迟初始化 Lazy<T> 中导致死锁 - walterlv](/post/deadlock-of-invoke-in-lazy.html)
- [在有 UI 线程参与的同步锁（如 AutoResetEvent）内部使用 await 可能导致死锁](/post/deadlock-if-await-in-ui-lock-context.html)
- [.NET 中小心嵌套等待的 Task，它可能会耗尽你线程池的现有资源，出现类似死锁的情况 - walterlv](/post/task-wait-may-cause-long-time-waiting.html)

解决方法：

- [在编写异步方法时，使用 ConfigureAwait(false) 避免使用者死锁 - walterlv](/post/using-configure-await-to-avoid-deadlocks.html)
- [将 async/await 异步代码转换为安全的不会死锁的同步代码（使用 PushFrame） - walterlv](/post/convert-async-to-sync-by-push-frame.html)

#### 参考资料

- [There Is No Thread](http://blog.stephencleary.com/2013/11/there-is-no-thread.html)
- [Async/Await - Best Practices in Asynchronous Programming](https://msdn.microsoft.com/en-us/magazine/jj991977.aspx)
