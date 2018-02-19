---
title: "出让执行权：Task.Yield, Dispatcher.Yield"
date_published: 2017-10-14 17:18:49 +0800
date: 2018-02-20 06:31:28 +0800
categories: dotnet csharp wpf uwp
description: 一个耗时的任务，可以通过 Task.Yield 或者 Dispatcher.Yield 来中断以便分割成多个小的任务片段执行。
---

`Yield` 这个词很有意思，叫做“屈服”“放弃”“让步”，字面意义上是让出当前任务的执行权，转而让其他任务可以插入执行。`Task`、`Dispatcher`、`Thread` 都有 `Yield()` 方法，看起来都可以让出当前任务的执行权。

---

<p id="toc"></p>

如果在阅读中发现对本文涉及到的一些概念不太明白，可以阅读：

- [深入了解 WPF Dispatcher 的工作原理（Invoke/InvokeAsync 部分）](/post/dotnet/2017/09/26/dispatcher-invoke-async.html)
- [深入了解 WPF Dispatcher 的工作原理（PushFrame 部分）](/post/dotnet/2017/09/26/dispatcher-push-frame.html)

### Dispatcher.Yield

如果一个方法的实现比较耗时，为了不影响 UI 的响应，你会选择用什么方法呢？我之前介绍过的 [Invoke 和 InvokeAsync](/post/dotnet/2017/09/26/dispatcher-invoke-async.html) 可以解决，将后续耗时的任务分割成一个个小的片段以低于用户输入和渲染的优先级执行。

`Dispatcher.Yield` 也可以，其行为更加类似于 `Dispatcher.InvokeAsync`（即采用 `Dispatcher` 调度的方式，事实上后面会说到其实就是调用了 `InvokeAsync`），而非 `Dispatcher.Invoke`（即采用 `PushFrame` 新开消息循环的方式）。

使用时需要 `await`：

```csharp
foreach(var item in collection)
{
    DoWorkWhichWillTakeHalfASecond();
    await Dispatcher.Yield();
}
```

这样，这个 `foreach` 将在每遍历到一个集合项的时候中断一次，让 UI 能够响应用户的交互输入和渲染。

`Yield` 方法可以传入一个优先级参数，指示继续执行后续任务的优先级。默认是 `DispatcherPriority.Background`，低于用户输入 `DispatcherPriority.Input`、 UI 逻辑 `DispatcherPriority.Loaded` 和渲染 `DispatcherPriority.Render`。

`Dispatcher.Yield` 是如何做到出让执行权的呢？

查看源码，发现 `DispatcherYield` 的返回值是 `DispatcherPriorityAwaiter`，而它的 `OnCompleted` 方法是这样的：

```csharp
public void OnCompleted(Action continuation)
{
    if(_dispatcher == null)
        throw new InvalidOperationException(SR.Get(SRID.DispatcherPriorityAwaiterInvalid));
    _dispatcher.InvokeAsync(continuation, _priority);
}
```

所以，其实真的就是 `InvokeAsync`。如果希望了解为何是 `OnCompleted` 方法，可以阅读 [【C#】【多线程】【05-使用C#6.0】08-自定义awaitable类型 - L.M](http://liujiajia.me/blog/details/csharp-multi-threading-05-csharp6-08-customize-awaitable)。

#### 需要注意

`Dispatcher.Yield` 是 `Dispatcher` 类型的静态方法，而不是像 `InvokeAsync` 一样是实例方法。不过 C# 有一个神奇的特性——静态方法和实例方法可以在同一上下文中调用，而不用担心产生歧义。

例如：

```csharp
using System.Windows.Threading;

class Demo : DispatcherObject
{
    void Test()
    {
        // 调用静态方法 Yield。
        await Dispatcher.Yield();
        // 调用实例方法 InvokeAsync。
        await Dispatcher.InvokeAsync(() => { });
    }
}
```

注意需要引用命名空间 `System.Windows.Threading`。

### Task.Yield

拿前面 `Dispatcher.Yield` 的例子，我们换成 `Task.Yield`：

```csharp
foreach(var item in collection)
{
    DoWorkWhichWillTakeHalfASecond();
    await Task.Yield();
}
```

效果与 `Dispatcher.Yield(DispatcherPriority.Normal)` 是一样的。因为 `Task` 调度回到线程上下文靠的是 `SynchronizationContext`，WPF UI 线程的 `SynchronizationContext` 被设置为了 `DispatcherSynchronizationContext`，使用 `Dispatcher` 调度；而 `DispatcherSynchronizationContext` 构造时传入的优先级默认是 `Normal`，WPF 并没有特殊传入一个别的值，所以 WPF UI 线程上使用 `Task.Yield()` 出让执行权后，恢复时使用的是 `Normal` 优先级，相当于 Dispatcher.Yield(DispatcherPriority.Normal)。

希望了解 `Dispatcher` 和 `SynchronizationContext` 的区别可以阅读 [c# - Difference between Synchronization Context and Dispatcher - Stack Overflow](https://stackoverflow.com/a/24672061/6233938)。

`DispatcherSynchronizationContext` 执行 `await` 后续任务的上下文代码：

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

既然是 `Normal` 优先级，那么在 UI 线程上的效果自然不如 `Dispatcher.Yield`。但是，`Task.Yield` 适用于任何线程，因为 `SynchronizationContext` 本身是与 `Dispatcher` 无关的，适用于任何线程。这样，于如果一个 `Task` 内部的任务太耗时，用 `Task.Yield` 则可以做到将此任务分成很多个片段执行。

---

#### 参考资料
- [c# - Task.Yield - real usages? - Stack Overflow](chrome-extension://klbibkeccnjlkjkiokjodocebajanakg/suspended.html#ttl=c%23%20-%20Task.Yield%20-%20real%20usages%3F%20-%20Stack%20Overflow&uri=https://stackoverflow.com/questions/23431595/task-yield-real-usages)
- [Task.Yield Method (System.Threading.Tasks)](https://msdn.microsoft.com/en-us/library/system.threading.tasks.task.yield%28v=vs.110%29.aspx?f=255&MSPPError=-2147217396)
- [c# - Difference between Synchronization Context and Dispatcher - Stack Overflow](https://stackoverflow.com/questions/24671883/difference-between-synchronization-context-and-dispatcher)
