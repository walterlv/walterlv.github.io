---
title: "C#/.NET 中 Thread.Sleep(0), Task.Delay(0), Thread.Yield(), Task.Yield() 不同的执行效果和用法建议"
publishDate: 2018-11-27 13:14:07 +0800
date: 2019-08-29 16:34:41 +0800
tags: dotnet csharp
---

在 C#/.NET 中，有 `Thread.Sleep(0)`, `Task.Delay(0)`, `Thread.Yield()`, `Task.Yield()` 中，有几种不同的让当前线程释放执行权的方法。他们的作用都是放弃当前线程当前的执行权，让其他线程得以调度。但是他们又不太一样。

本文说说他们的原理区别和用法区别。

---

<div id="toc"></div>

## 原理区别

### Thread.Sleep(0)

`Thread.Sleep(int millisecondsTimeout)` 的代码贴在下面，其内部实际上是在调用 `SleepInternal`，而 `SleepInternal` 由 CLR 内部实现。其目的是将当前线程挂起一个指定的时间间隔。

如果将超时时间设置为 0，即 `Thread.Sleep(0)`，那么这将强制当前线程放弃剩余的 CPU 时间片。

放弃当前线程剩余的 CPU 时间片就意味着其他比此线程优先级高且可以被调度的线程将会在此时被调度。然而此方法只是放弃当前 CPU 执行的时间片，如果当前系统环境下其他可以被调度的其他线程的优先级都比这个线程的优先级低，实际上此线程依然还是会优先执行。

如果你的方法不会被其他线程影响，那么不会有执行上的区别，但如果你的方法涉及到多个线程的调用，那么 `Thread.Sleep(0)` 的调用可能导致其他线程也进入此方法（而不是等此线程的当前时间片执行完后再进入）。当然，CPU 对单个线程的执行时间片是纳秒级别的，所以实际上你因为此方法调用获得的多线程重入效果是“纯属巧合”的。

```csharp
/*=========================================================================
** Suspends the current thread for timeout milliseconds. If timeout == 0,
** forces the thread to give up the remainer of its timeslice.  If timeout
** == Timeout.Infinite, no timeout will occur.
**
** Exceptions: ArgumentException if timeout < 0.
**             ThreadInterruptedException if the thread is interrupted while sleeping.
=========================================================================*/
[System.Security.SecurityCritical]  // auto-generated
[ResourceExposure(ResourceScope.None)]
[MethodImplAttribute(MethodImplOptions.InternalCall)]
private static extern void SleepInternal(int millisecondsTimeout);

[System.Security.SecuritySafeCritical]  // auto-generated
public static void Sleep(int millisecondsTimeout)
{
    SleepInternal(millisecondsTimeout);
    // Ensure we don't return to app code when the pause is underway
    if(AppDomainPauseManager.IsPaused)
        AppDomainPauseManager.ResumeEvent.WaitOneWithoutFAS();
}
```

### Thread.Yield()

`Thread.Yield()` 的代码贴在下面，其内部调用 `YieldInternal`，实际上也是由 CLR 内部实现。

此方法也是放弃当前线程的剩余时间片，所以其效果与 `Thread.Sleep(0)` 是相同的。

```csharp
[System.Security.SecurityCritical]  // auto-generated
[ResourceExposure(ResourceScope.None)]
[DllImport(JitHelpers.QCall, CharSet = CharSet.Unicode)]
[SuppressUnmanagedCodeSecurity]
[HostProtection(Synchronization = true, ExternalThreading = true),
    ReliabilityContract(Consistency.WillNotCorruptState, Cer.Success)]
private static extern bool YieldInternal();

[System.Security.SecuritySafeCritical]  // auto-generated
[HostProtection(Synchronization = true, ExternalThreading = true),
    ReliabilityContract(Consistency.WillNotCorruptState, Cer.Success)]
public static bool Yield()
{
    return YieldInternal();
}
```

### Thread.Sleep(1)

`Thread.Sleep(1)` 与 `Thread.Sleep(0)` 虽然只有参数上的微小差别，但实际上做了不同的事情。

`Thread.Sleep(1)` 会使得当前线程挂起一个指定的超时时间，这里设置为 1ms。于是，在这个等待的超时时间段内，你的当前线程处于不可被调度的状态。那么即便当前剩余的可以被调度的线程其优先级比这个更低，也可以得到调度。

下面是针对这三个方法执行时间的一个实验结果：

![Thread 不同方法的耗时实验结果](/static/posts/2018-11-27-11-10-43.png)  
▲ Thread 不同方法的耗时实验结果

其中，Nothing 表示没有写任何代码。

测量使用的是 `Stopwatch`，你可以通过阅读 [.NET/C# 在代码中测量代码执行耗时的建议（比较系统性能计数器和系统时间）](/post/dotnet-high-precision-performance-counting) 了解 `Stopwatch` 测量的原理和精度。

```csharp
var stopwatch = Stopwatch.StartNew();
Thread.Sleep(0);
var elapsed = stopwatch.Elapsed;
Console.WriteLine($"Thread.Sleep(0) : {elapsed}");
```

### Task.Delay(0)

`Task.Delay` 是 `Task` 系列的线程模型（TAP）中的方法。关于 TAP 可参见 [Task-based Asynchronous Pattern (TAP)  Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/task-based-asynchronous-pattern-tap?wt.mc_id=MVP)。

这是一套基于异步状态机（AsyncStateMachine）实现的线程模型，这也是与 `Thread` 系列方法最大的不同。

当传入参数 0 的时候，会直接返回 `Task.CompletedTask`。这意味着你在 `Task.Delay(0)` 后面写的代码会被立刻调用（如果还有剩余 CPU 时间片的话）。

```csharp
/// <summary>
/// Creates a Task that will complete after a time delay.
/// </summary>
/// <param name="millisecondsDelay">The number of milliseconds to wait before completing the returned Task</param>
/// <param name="cancellationToken">The cancellation token that will be checked prior to completing the returned Task</param>
/// <returns>A Task that represents the time delay</returns>
/// <exception cref="T:System.ArgumentOutOfRangeException">
/// The <paramref name="millisecondsDelay"/> is less than -1.
/// </exception>
/// <exception cref="T:System.ObjectDisposedException">
/// The provided <paramref name="cancellationToken"/> has already been disposed.
/// </exception>        
/// <remarks>
/// If the cancellation token is signaled before the specified time delay, then the Task is completed in
/// Canceled state.  Otherwise, the Task is completed in RanToCompletion state once the specified time
/// delay has expired.
/// </remarks>        
public static Task Delay(int millisecondsDelay, CancellationToken cancellationToken)
{
    // Throw on non-sensical time
    if (millisecondsDelay < -1)
    {
        throw new ArgumentOutOfRangeException("millisecondsDelay", Environment.GetResourceString("Task_Delay_InvalidMillisecondsDelay"));
    }
    Contract.EndContractBlock();

    // some short-cuts in case quick completion is in order
    if (cancellationToken.IsCancellationRequested)
    {
        // return a Task created as already-Canceled
        return Task.FromCancellation(cancellationToken);
    }
    else if (millisecondsDelay == 0)
    {
        // return a Task created as already-RanToCompletion
        return Task.CompletedTask;
    }

    // Construct a promise-style Task to encapsulate our return value
    var promise = new DelayPromise(cancellationToken);

    // Register our cancellation token, if necessary.
    if (cancellationToken.CanBeCanceled)
    {
        promise.Registration = cancellationToken.InternalRegisterWithoutEC(state => ((DelayPromise)state).Complete(), promise);
    }

    // ... and create our timer and make sure that it stays rooted.
    if (millisecondsDelay != Timeout.Infinite) // no need to create the timer if it's an infinite timeout
    {
        promise.Timer = new Timer(state => ((DelayPromise)state).Complete(), promise, millisecondsDelay, Timeout.Infinite);
        promise.Timer.KeepRootedWhileScheduled();
    }

    // Return the timer proxy task
    return promise;
}
```


### Task.Yield()

`Task.Yield()` 的最大作用实际上是让一个异步方法立刻返回，让后面其他代码的调用进入下一个异步上下文。

```csharp
public async Task Foo()
{
    // 执行某些操作。
    await Task.Yield();
    // 执行另一些操作。
}
```

如果外面的代码使用 `await` 来等待 `Foo`，那么 `Task.Yield` 的作用可能不太明显，但是如果外面并没有 `await` 或者任何一层更外层的调用没有 `await`，那么就有区别了。对于没有异步等待的调用，那个方法就会在此 `Task.Yield()` 这一句执行后返回。而此后的代码将在那些没有异步等待的方法之后执行。

`Task.Yield()` 实际上只是返回一个 `YieldAwaitable` 的新实例，而 `YieldAwaitable.GetAwaiter` 方法返回一个 `YieldAwaiter` 的新实例。也就是说，后续的执行效果完全取决于 `YieldAwaiter` 是如何实现这个异步过程的（异步状态机会执行这个过程）。我有另一篇博客说明 `Awaiter` 是如何实现的：[如何实现一个可以用 await 异步等待的 Awaiter](/post/write-custom-awaiter)。

`YieldAwaiter` 靠 `QueueContinuation` 来决定后续代码的执行时机。此方法的核心代码贴在了下面。

有两个分支，如果指定了 `SynchronizationContext`，那么就会使用 `SynchronizationContext` 自带的 `Post` 方法来执行异步任务的下一个步骤。调用 `continuation` 就是执行异步状态机中的下一个步骤以进入下一个异步状态；不过，为了简化理解，你可以认为这就是调用 `await` 后面的那段代码。

WPF UI 线程的 `SynchronizationContext` 被设置为了 `DispatcherSynchronizationContext`，它的 `Post` 方法本质上是用消息循环来实现的。其他线程如果没有特殊设置，则是 `null`。这一部分知识可以看参见：[出让执行权：Task.Yield, Dispatcher.Yield](/post/yield-in-task-dispatcher)。

如果没有指定 `SynchronizationContext` 或者当前的 `SynchronizationContext` 就是 `SynchronizationContext` 类型基类，那么就会执行后面 `else` 中的逻辑。主要就是在线程池中寻找一个线程然后执行代码，或者再次启动一个 `Task` 任务并加入队列；这取决于 `TaskScheduler.Current` 的设置。

```csharp
// Get the current SynchronizationContext, and if there is one,
// post the continuation to it.  However, treat the base type
// as if there wasn't a SynchronizationContext, since that's what it
// logically represents.
var syncCtx = SynchronizationContext.CurrentNoFlow;
if (syncCtx != null && syncCtx.GetType() != typeof(SynchronizationContext))
{
    syncCtx.Post(s_sendOrPostCallbackRunAction, continuation);
}
else
{
    // If we're targeting the default scheduler, queue to the thread pool, so that we go into the global
    // queue.  As we're going into the global queue, we might as well use QUWI, which for the global queue is
    // just a tad faster than task, due to a smaller object getting allocated and less work on the execution path.
    TaskScheduler scheduler = TaskScheduler.Current;
    if (scheduler == TaskScheduler.Default)
    {
        if (flowContext)
        {
            ThreadPool.QueueUserWorkItem(s_waitCallbackRunAction, continuation);
        }
        else
        {
            ThreadPool.UnsafeQueueUserWorkItem(s_waitCallbackRunAction, continuation);
        }
    }
    // We're targeting a custom scheduler, so queue a task.
    else
    {
        Task.Factory.StartNew(continuation, default(CancellationToken), TaskCreationOptions.PreferFairness, scheduler);
    }
}
```

### Task.Delay(1)

与 `Thread` 一样，`Task.Delay(1)` 与 `Task.Delay(0)` 虽然只有参数上的微小差别，但实际上也做了不同的事情。

`Task.Delay(1)` 实际上是启动了一个 `System.Threading.Timer`，然后订阅时间抵达之后的回调函数。

会从 `Timer.TimerSetup` 设置，到使用 `TimerHolder` 并在内部使用 `TimerQueueTimer` 来设置回调；内部实际使用 `TimerQueue.UpdateTimer` 来完成时间等待之后的回调通知，最终通过 `EnsureAppDomainTimerFiresBy` 调用到 `ChangeAppDomainTimer` 来完成时间抵达之后的回调。

而 `await` 之后的那段代码会被异步状态机封装，传入上面的回调中。

```csharp
[System.Security.SecurityCritical]
[ResourceExposure(ResourceScope.None)]
[DllImport(JitHelpers.QCall, CharSet = CharSet.Unicode)]
[SuppressUnmanagedCodeSecurity]
static extern bool ChangeAppDomainTimer(AppDomainTimerSafeHandle handle, uint dueTime);
```

相比于 `Thread` 相关方法仅涉及到当前线程的调度，`Task` 相关的方法会涉及到线程池的调度，并且使用 `System.Threading.Timer` 来进行计时，耗时更加不可控：

![Task 不同方法的耗时实验结果](/static/posts/2018-11-27-12-51-30.png)  
▲ Task 不同方法的耗时实验结果（三次不同的实验结果）

其中，Nothing 表示没有写任何代码。

测量使用的是 `Stopwatch`，你依然可以通过阅读 [.NET/C# 在代码中测量代码执行耗时的建议（比较系统性能计数器和系统时间）](/post/dotnet-high-precision-performance-counting) 了解 `Stopwatch` 测量的原理和精度。

```csharp
var stopwatch = Stopwatch.StartNew();
await Task.Delay(0);
var elapsed = stopwatch.Elapsed;
Console.WriteLine($"Thread.Sleep(0) : {elapsed}");
```

在 [c# - Task.Delay(<ms>).Wait(); sometimes causing a 15ms delay in messaging system - Stack Overflow](https://stackoverflow.com/q/41830216/6233938) 上有个说法，说操作系统的时钟中断有时间间隔，而 Windows 操作系统上这个时间间隔的默认值大约在 15ms，所以实际上你写等待 1ms，实际等待时间也会接近 15ms。

> You're seeing an artifact of the Windows interrupt rate, which is (by default) approx every 15ms. Thus if you ask for 1-15ms, you'll get an approx 15ms delay. ~16-30 will yield 30ms... so on.

## 用法区别

`Thread.Sleep(0)` 和 `Thread.Yield` 在线程调度的效果上是相同的，`Thread.Sleep(int)` 是带有超时的等待，本质上也是线程调度。如果你希望通过放弃当前线程时间片以便给其他线程一些执行实际，那么考虑 `Thread.Sleep(0)` 或者 `Thread.Yield`；如果希望进行线程调度级别的等待（效果类似于阻塞线程），那么使用 `Thread.Sleep(int)`。

如果你允许有一个异步上下文，可以使用 `async/await`，那么可以使用 `Task.Delay(0)` 或者 `Task.Yield()`。另外，如果等待时使用 `Task.Delay` 而不是 `Thread.Sleep`，那么你可以节省一个线程的资源，尤其是在一个线程池的线程中 `Sleep` 的话，会使得线程池中更多的线程被进行无意义的占用，对其他任务在线程池中的调度不利。

---

**参考资料**

- [Thread.Sleep(0) vs Sleep(1) vs Yeild - stg609 - 博客园](http://www.cnblogs.com/stg609/p/3857242.html)
- [c# - Task.Delay(<ms>).Wait(); sometimes causing a 15ms delay in messaging system - Stack Overflow](https://stackoverflow.com/q/41830216/6233938)
- [c# - When to use Task.Delay, when to use Thread.Sleep? - Stack Overflow](https://stackoverflow.com/q/20082221/6233938)
- [c# - Should I always use Task.Delay instead of Thread.Sleep? - Stack Overflow](https://stackoverflow.com/q/29356139/6233938)
- [What's the difference between Thread.Sleep(0) and Thread,Yield()?](https://social.msdn.microsoft.com/Forums/en-US/d7071ba4-8962-43c6-975a-28cdbce51548/whats-the-difference-between-threadsleep0-and-threadyield?forum=csharplanguage)
