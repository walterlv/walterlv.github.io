---
layout: post
title: "深入了解 WPF Dispatcher 的工作原理（Invoke/InvokeAsync/PushFrame）"
date: 2017-09-25 22:12:15 +0800
categories: post dotnet
keywords: dotnet dispatcher Invoke InvokeAsync PushFrame
description: 
---

深耕 WPF 开发的各位程序员大大们一定避不开使用 Dispatcher。跨线程访问 UI 当然免不了用到它，将某个任务延迟到当前任务之后执行也会用到它。Dispatcher.Invoke、Dispatcher.BeginInvoke 是过去大家经常使用的方法，而 .Net Framework 4.5 中微软为我们带来了 Dispatcher.InvokeAsync 方法，它和前面两个有何不同？极端情况下我们会见到的 Dispatcher.PushFrame 背后又做了哪些事情使得不卡死当前线程的情况下好像阻塞了一个方法一样。

阅读本文将更深入地了解 Dispatcher 的工作机制。

---

### 回顾老旧的 BeginInvoke，看看新的 InvokeAsync

微软自 .Net Framework 3.0 为我们引入了 `Dispatcher` 之后，`BeginInvoke` 方法就已存在。不过，看这名字的 `Begin` 前缀，有没有一种年代感？没错！这是微软在 .Net Framework 1.1 时代就推出的 `Begin`/`End` 异步编程模型（APM，[Asynchronous Programming Model](https://docs.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/asynchronous-programming-model-apm)）。虽说 `Dispatcher.BeginInvoke` 并不完全按照 APM 模型来实现（毕竟没有对应的 `End`，也没有返回 `IAsyncResult`），但这个类型毕竟也是做线程相关的事情，而且这个方法的签名明显还带着那个年代的影子。不止名字上带着 `Begin` 表示异步的执行，而且参数列表中还存在着 `Delegate` 和 `object` 这样古老的类型。要知道，现代化的方法可是 `Action`/`Func` 加泛型啊！

大家应该还对 .Net Framework 4.5 带给我们的重磅更新——`async`/`await` 异步模式感到兴奋，因为它让我们的异步代码变得跟同步代码一样写了。这是微软新推荐的异步编程模式，叫做 TAP（[Task-based Asynchronous Pattern]((https://docs.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/task-based-asynchronous-pattern-tap))）。既然异步编程模式都换了，同为线程服务的 `Dispatcher.BeginInvoke` 怎能不改呢？于是，微软真的改了，就是从 .Net Framework 4.5 版本开始。

**它叫做——`Dispatcher.InvokeAsync`。**

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

### InvokeAsync 的实现原理



#### 参考资料

- 异步编程模型
  - [Asynchronous Programming Model (APM) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/asynchronous-programming-model-apm)
  - [Asynchronous Design Pattern Overview](https://msdn.microsoft.com/en-us/library/aa719595(v=vs.71).aspx)
  - [Interop with Other Asynchronous Patterns and Types - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/interop-with-other-asynchronous-patterns-and-types)
  - [Task-based Asynchronous Pattern (TAP) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/task-based-asynchronous-pattern-tap)
- InvokeAsync
  - [Dispatcher.cs](http://referencesource.microsoft.com/#WindowsBase/Base/System/Windows/Threading/Dispatcher.cs)
  - 