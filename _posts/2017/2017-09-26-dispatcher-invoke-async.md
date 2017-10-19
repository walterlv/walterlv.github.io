---
layout: post
title: "深入了解 WPF Dispatcher 的工作原理（Invoke/InvokeAsync 部分）"
date_published: 2017-09-26 02:02:24 +0800
date: 2017-10-19 21:13:30 +0800
categories: dotnet
permalink: /post/dotnet/2017/09/26/dispatcher-invoke-async.html
keywords: dotnet dotnet dispatcher Invoke BeginInvoke InvokeAsync
description: 了解 Dispatcher.BeginInvoke 和 Dispatcher.InvokeAsync 的不同之处，并且学习它们的工作原理。
---

深耕 WPF 开发的各位程序员大大们一定避不开使用 Dispatcher。跨线程访问 UI 当然免不了用到它，将某个任务延迟到当前任务之后执行也会用到它。Dispatcher.Invoke、Dispatcher.BeginInvoke 是过去大家经常使用的方法，而 .Net Framework 4.5 中微软为我们带来了 Dispatcher.InvokeAsync 方法，它和前面两个有何不同？

阅读本文将更深入地了解 Dispatcher 的工作机制。

---

本文是**深入了解 WPF Dispatcher 的工作原理**系列文章的一部分：

1. [Invoke/InvokeAsync 部分](/post/dotnet/2017/09/26/dispatcher-invoke-async.html)（本文）
1. [PushFrame 部分](/post/dotnet/2017/09/26/dispatcher-push-frame.html)

### 回顾老旧的 BeginInvoke，看看新的 InvokeAsync

微软自 .Net Framework 3.0 为我们引入了 `Dispatcher` 之后，`BeginInvoke` 方法就已存在。不过，看这名字的 `Begin` 前缀，有没有一种年代感？没错！这是微软在 .Net Framework 1.1 时代就推出的 `Begin`/`End` 异步编程模型（APM，[Asynchronous Programming Model](https://docs.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/asynchronous-programming-model-apm)）。虽说 `Dispatcher.BeginInvoke` 并不完全按照 APM 模型来实现（毕竟没有对应的 `End`，也没有返回 `IAsyncResult`），但这个类型毕竟也是做线程相关的事情，而且这个方法的签名明显还带着那个年代的影子。不止名字上带着 `Begin` 表示异步的执行，而且参数列表中还存在着 `Delegate` 和 `object` 这样古老的类型。要知道，现代化的方法可是 `Action`/`Func` 加泛型啊！

大家应该还对 .Net Framework 4.5 带给我们的重磅更新——`async`/`await` 异步模式感到兴奋，因为它让我们的异步代码变得跟同步代码一样写了。这是微软新推荐的异步编程模式，叫做 TAP（[Task-based Asynchronous Pattern](https://docs.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/task-based-asynchronous-pattern-tap)）。既然异步编程模式都换了，同为线程服务的 `Dispatcher.BeginInvoke` 怎能不改呢？于是，微软真的改了，就是从 .Net Framework 4.5 版本开始。

**它叫做——`Dispatcher.InvokeAsync`。**

---

### BeginInvoke 和 InvokeAsync 有什么不同？

这个还真得扒开微软的源码看一看呢！

```csharp
[Browsable(false), EditorBrowsable(EditorBrowsableState.Never)]
public DispatcherOperation BeginInvoke(DispatcherPriority priority, Delegate method);

[Browsable(false), EditorBrowsable(EditorBrowsableState.Never)]
public DispatcherOperation BeginInvoke(DispatcherPriority priority, Delegate method, object arg);

[Browsable(false), EditorBrowsable(EditorBrowsableState.Never)]
public DispatcherOperation BeginInvoke(DispatcherPriority priority, Delegate method, object arg, params object[] args);

public DispatcherOperation BeginInvoke(Delegate method, params object[] args);

public DispatcherOperation BeginInvoke(Delegate method, DispatcherPriority priority, params object[] args);
```

一共五个重载，前面三个都被微软做了标记，让你在智能感知列表中看不见。（这里吐槽一下 ReSharper，明明微软已经不让显示了嘛，干嘛还把人家显示出来……）后面两个暂时还看得见，但那又如何？！根本没啥区别好吗！！！

为什么会像上面那样吐槽，是因为我发现这五个不同的重载里面其实都调用了同一个内部方法：

```csharp
[SecuritySafeCritical]
private DispatcherOperation LegacyBeginInvokeImpl(DispatcherPriority priority, Delegate method, object args, int numArgs)
{
    ValidatePriority(priority, "priority");
    if(method == null)
    {
        throw new ArgumentNullException("method");
    }
    DispatcherOperation operation = new DispatcherOperation(this, method, priority, args, numArgs);
    InvokeAsyncImpl(operation, CancellationToken.None);
    return operation;
}
```

这里让我忍不住吐槽的是两点：

1. `Legacy` 是个什么鬼！词典上说这是“遗产，老化的”意思啊！很明显这是近乎被微软遗弃的代码啊！
1. 既然这五个重载都用了被遗弃的方法，为什么只有前面三个看不见，后面两个看得见啊！还有，微软你干嘛不标记为 `[Obsolete]` 呢！

好，吐槽结束。我们再来看看 `InvokeAsync` 方法。

```csharp
public DispatcherOperation InvokeAsync(Action callback);

public DispatcherOperation InvokeAsync(Action callback, DispatcherPriority priority);

[SecuritySafeCritical]
public DispatcherOperation InvokeAsync(Action callback, DispatcherPriority priority, CancellationToken cancellationToken);

public DispatcherOperation<TResult> InvokeAsync<TResult>(Func<TResult> callback);

public DispatcherOperation<TResult> InvokeAsync<TResult>(Func<TResult> callback, DispatcherPriority priority);

[SecuritySafeCritical]
public DispatcherOperation<TResult> InvokeAsync<TResult>(Func<TResult> callback, DispatcherPriority priority, CancellationToken cancellationToken);
```

看吧，这才像微软新的 TAP 异步模式的代码啊。

不带 `CancellationToken` 的四个重载会汇聚到带 `CancellationToken` 的两个重载中，这两个重载代码除了泛型返回值以外几乎一模一样。所以我们拿第三个当研究对象看看：

```csharp
[SecuritySafeCritical]
public DispatcherOperation InvokeAsync(Action callback, DispatcherPriority priority, CancellationToken cancellationToken)
{
    if(callback == null)
    {
        throw new ArgumentNullException("callback");
    }
    ValidatePriority(priority, "priority");
    DispatcherOperation operation = new DispatcherOperation(this, priority, callback);
    InvokeAsyncImpl(operation, cancellationToken);
    return operation;
}
```

你发现了什么？这与那个被遗弃的 `LegacyBeginInvokeImpl` 长得非常像。不，就是一模一样！你总不能说参数名称不同也要算吧……甚至……返回值类型也是一样的。

既然这样，我们总算是明白微软到底在做些什么了。其实微软在 .Net Framework 4.5 中已经把 `BeginInvoke` 的实现改造成了 TAP 异步模式，但方法名字和老旧的参数列表却始终是微软的一块心病，于是痛下决心新增了 6 个更加现代的方法免得产生兼容性问题。不过由于里面的实现一模一样，并没有额外带来什么 BUG，所以微软也不好意思标记为 `[Obsolete]` 已过时了。

既然两个方法一样，后文我也就没必要两个都说了，一切以新款的 `InvokeAsync` 为主。

---

### InvokeAsync 的实现原理

前面一节几乎告诉我们，`InvokeAsync` 的关键就在 `InvokeAsyncImpl` 方法中。

1. 用一个 `DispatcerOperation` 把我们传入的 `Action`/`Func` 包装起来。这样，我们传入的任务和优先级将在一起处理。
1. 将 `DispatcherOperation` 加入到一个 `PriorityQueue<DispatcherOperation>` 类型的队列中。这个队列内部实现是一个 `SortedList`，于是每次入队之后，出队的时候一定是按照优先级出队的。
1. 调用 `RequestProcessing`，直至最后向**某个隐藏窗口**发送了一条消息。
1. **那个隐藏窗口**接收到了这条消息，然后从 `PriorityQueue<DispatcherOperation>` 队列中取出一条任务执行（真实情况复杂一点，后面会谈到）。

![InvokeAsync 的实现原理图](/static/posts/2017-09-26-01-20-05.png)

上面第 3 点的消息是这样发的：

```csharp
UnsafeNativeMethods.TryPostMessage(new HandleRef(this, _window.Value.Handle), _msgProcessQueue, IntPtr.Zero, IntPtr.Zero);
```

等等，这句代码里面的 `_window` 是哪儿来的？为什么凭空出现了一个可以用来发送消息的窗口？于是，在 `Dispatcher` 构造函数中发现了这个窗口。这并不是我们平时所熟知的那个 `Window` 类，而是一个用于发送和接收 `Dispatcher` 调度器调度任务消息的 Win32 隐藏窗口。不信它是一个窗口？请进入 `MessageOnlyHwndWrapper` 类看，它的基类 `HwndWrapper` 中直接使用了方法 `UnsafeNativeMethods.CreateWindowEx` 创建了这个窗口，然后拿到了它的句柄 `Handle`。

既然会向窗口发消息，自然而然可以 `Hook` 它的消息处理函数，就像下面这样：

```csharp
// Create the message-only window we use to receive messages
// that tell us to process the queue.
MessageOnlyHwndWrapper window = new MessageOnlyHwndWrapper();
_window = new SecurityCriticalData<MessageOnlyHwndWrapper>( window );

_hook = new HwndWrapperHook(WndProcHook);
_window.Value.AddHook(_hook);
```

而这里处理的消息类型只有三种：

1. 关掉这个隐藏窗口；
1. 处理 `Dispatcher` 调度的任务（这个消息是在 `Dispatcher` 的静态构造函数中注册的）；
1. 定时器。

前面两个不难理解，但是为什么这里与定时器有关？！

继续调查，我们发现微软在 `Dispatcher` 中把所有不同种类的优先级分成了三个大类：

1. 前台优先级（对应 `DispatcherPriority.Loaded` 到 `DispatcherPriority.Send`，也就是数字 6~10）
1. 后台优先级（对应 `DispatcherPriority.Background` 到 `DispatcherPriority.Input`，也就是数字 4~5）
1. 空闲优先级（对应 `DispatcherPriority.SystemIdle` 到 `DispatcherPriority.ApplicationIdle`，也就是数字 1~3）

在这里微软又开始逗我们玩了……因为在他的处理中，后面两个是完全相同的！所以严格意义上只分了两种——前台优先级和非前台优先级。而区分他们的一个分界点就是——用户的输入。

如果有用户的输入发生，那么会开启一个定时器，在定时器时间到达之前，所有的后台优先级任务都不会去执行。但前台优先级任务不受用户输入的影响。在这样的设定下，用户的输入不会随随便便被饿死，WPF 程序也就不会从输入层面开始卡顿了。

研究到这里，似乎 `InvokeAsync` 的执行原理差不多都清楚了。但是不要忘了这可是 TAP 异步模式的一项实践啊，这方法是要支持 `await` 并附带返回值的。

但这里就没有更多底层的内容了。我们注意到 `InvokeAsync` 的返回值是 `DispatcherOperation` 类型的，而这就是 `InvokeAsync` 方法中我们前面看到的代码中直接 `new` 出来的。`DispatcherOperation` 中有一个 `Invoke` 方法，这是无返回值的，但是它执行完后会置 `Task` 的 `Result` 值。另外 `DispatcherOperation` 实现了 `GetAwaiter` 方法，于是就可以使用 `await`。对于如何自己实现一个可以 `await` 的类，我可能会专门写一篇文章，但如果你现在就希望了解，可以阅读：[How to write a custom awaiter – Lucian's VBlog](https://blogs.msdn.microsoft.com/lucian/2012/12/11/how-to-write-a-custom-awaiter/)。

而被我们遗弃的 `BeginInvoke`，由于内部调用了同一个函数，所以实现原理是完全一样的。而且，这么古老的函数也允许 `await`。

### Invoke 的实现原理

也许你会觉得奇怪。我们连“异步”的 `InvokeAsync` 的实现原理都了解了，同步的 `Invoke` 还有何难！

如果你这么认为，你一定忽略了一个很重要的问题——死锁！

如果是另一个线程调用到此线程的 `Invoke`，那么同步等待一下当然不会有问题。但是如果调用线程就是此线程本身呢？如果依然采用“同步等待”的方式，那么 UI 线程就会因为 `Invoke` 的调用而阻塞，然而 `Invoke` 中传入的 `Action` 是插入到 UI 线程执行的，如果 UI 线程正在等待 `Invoke`，还怎么插入得进去？！

所以，它一定有另外一套实现方式！而微软为这套实现方式做了两条路径：

1. 如果是 10 的最高优先级，则直接调用 `Invoke` 里传入的任务；
1. 如果是其他，则调用 `DispatcherOperation` 的 `Wait` 方法进行等待。

等等，这不还是 `Wait` 吗！然而进去 `Wait` 方法查看，你会发现，根本不是！

```csharp
public DispatcherOperationStatus Wait(TimeSpan timeout)
{
    // 省略一些前面的代码。
            
    // We are the dispatching thread for this operation, so
    // we can't block.  We will push a frame instead.
    DispatcherOperationFrame frame = new DispatcherOperationFrame(this, timeout);
    Dispatcher.PushFrame(frame);
        
    // 省略一些后面的代码。
    
    return _status;
}
```

它用了 `Dispatcher.PushFrame`。这样保证了在不阻塞线程的情况下进行“等待”。至于如何做到“不阻塞地等待”，请参阅本系列的第二篇文章 [深入了解 WPF Dispatcher 的工作原理（PushFrame 部分）](/post/dotnet/2017/09/26/dispatcher-push-frame.html)。

### 总结

1. 进入了 .Net Framework 4.5 及以上的开发者们，建议使用 `InvokeAsync` 代替 `BeginInvoke`；
1. `Dispatcher` 通过创建一个隐藏的消息窗口来让一个个 `Invoke` 到此线程的任务按照优先级执行；
1. `Invoke` 使用 `PushFrame` 做到了不阻塞 UI 线程的等待。

#### 参考资料

- 异步编程模型
  - [Asynchronous Programming Model (APM) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/asynchronous-programming-model-apm)
  - [Asynchronous Design Pattern Overview](https://msdn.microsoft.com/en-us/library/aa719595(v=vs.71).aspx)
  - [Interop with Other Asynchronous Patterns and Types - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/interop-with-other-asynchronous-patterns-and-types)
  - [Task-based Asynchronous Pattern (TAP) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/task-based-asynchronous-pattern-tap)
- InvokeAsync
  - [Dispatcher.cs](http://referencesource.microsoft.com/#WindowsBase/Base/System/Windows/Threading/Dispatcher.cs)
- WPF 消息机制
  - [WPF的消息机制（二）- WPF内部的5个窗口之隐藏消息窗口 - 葡萄城控件技术团队博客 - CSDN博客](http://blog.csdn.net/powertoolsteam/article/details/6109036)
- Awaiter
  - [How to write a custom awaiter – Lucian's VBlog](https://blogs.msdn.microsoft.com/lucian/2012/12/11/how-to-write-a-custom-awaiter/)
