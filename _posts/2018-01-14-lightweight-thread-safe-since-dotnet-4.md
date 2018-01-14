---
title: ".NET 中的轻量级线程安全"
date: 2018-01-14 20:46:22 +0800
categories: dotnet
---

对线程安全有要求的代码中，通常会使用锁（lock）。自 .NET 诞生以来就有锁，然而从 .NET Framework 4.0 开始，又诞生了 6 个轻量级的线程安全方案：`SpinLock`, `SpinWait`, `CountdownEvent`, `SemaphoreSlim`, `ManualResetEventSlim`, `Barrier`。

---

### SpinLock, SpinWait

SpinLock 被称之为“自旋锁”，SpinWait 称为“自旋等待”，适合在非常轻量的计算中使用。它与普通 lock 的区别在于普通 lock 使用 Win32 内核态对象来实现等待，[Overview of Synchronization Primitives](https://docs.microsoft.com/en-us/dotnet/standard/threading/overview-of-synchronization-primitives) 中描述为：

> you can use synchronization primitives that provide fast performance by avoiding expensive reliance on Win32 kernel objects such as wait handles whenever possible.

在这个过程中，调用线程会挂起，并造成线程的上下文切换，而这是一部分不算小的开销。

自旋等待则是继续让 CPU 执行此线程，直到锁释放。在这个过程中，此线程会持续占用 CPU 资源，但避免了线程上下文切换。所以，对于短时间的计算采用 SpinLock 实现线程安全会更加高效；而长时间的任务执行会导致占用 CPU 资源从而导致其他任务执行所需的资源减少。

### CountdownEvent

并行执行一些任务之后，通常还会继续执行一些代码。初始化时设置信号量次数，随后在每一个子任务结束之后设置一个信号量（调用其 `Signal` 方法）可以使计数减 1.这样，在调用 `Wait` 等待的地方就会等计数为 0 后继续执行。

## SemaphoreSlim, ManualResetEventSlim

`SemaphoreSlim`、`ManualResetEventSlim` 是此前 `Semaphore` 和 `ManualResetEvent` 的轻量级版本，从其名字“slim”便能看出来。

## 如何轻量

这些轻量级线程同步方案因为没有使用到 Win32 内核对象，而是在 .NET 内部完成，所以只能进行线程之间的同步，不能进行跨进程同步。如果要完成跨进程的同步，需要使用 `Monitor`、`Mutex` 这样的方案。

---

#### 参考资料

- [Overview of Synchronization Primitives - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/threading/overview-of-synchronization-primitives)
- [Thread-Safe Collections - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/collections/thread-safe/)
- [.net 4.0新特性-自旋锁(SpinLock) - CSDN博客](http://blog.csdn.net/clingingboy/article/details/5662735)
- [.net 4.0新特性-CountDownEvent - CSDN博客](http://blog.csdn.net/clingingboy/article/details/5662734)
- [Atomicity, volatility and immutability are different, part three – Fabulous Adventures In Coding](https://blogs.msdn.microsoft.com/ericlippert/2011/06/16/atomicity-volatility-and-immutability-are-different-part-three/)
- [How to: Enable Thread-Tracking Mode in SpinLock - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/threading/how-to-enable-thread-tracking-mode-in-spinlock)
- [C# SpinWait 实现 - 程序园](http://www.voidcn.com/article/p-pbnmpkmu-bqz.html)
- [C#并行编程 (Barrier,CountdownEvent,ManualResetEventSlim,SemaphoreSlim,SpinLock,SpinWait )--Thread,Ant,ICP,index,ConsoleWriteLine,CookTasks,cook,particpants](http://www.bijishequ.com/detail/359812?p=13-67)
