---
layout: post
title: "深入了解 WPF Dispatcher 的工作原理（PushFrame 部分）"
publishDate: 2017-09-26 03:49:41 +0800
date: 2018-11-27 13:08:55 +0800
categories: dotnet
permalink: /post/dotnet/2017/09/26/dispatcher-push-frame.html
keywords: dotnet dotnet dispatcher PushFrame
description: 了解 Dispatcher.PushFrame 方法的作用和背后的实现原理。
---

在上一篇文章 [深入了解 WPF Dispatcher 的工作原理（Invoke/InvokeAsync 部分）](/post/dotnet/2017/09/26/dispatcher-invoke-async.html) 中我们发现 `Dispatcher.Invoke` 方法内部是靠 `Dispatcher.PushFrame` 来确保“不阻塞地等待”的。然而它是怎么做到“不阻塞地等待”的呢？

阅读本文将更深入地了解 Dispatcher 的工作机制。

---

本文是**深入了解 WPF Dispatcher 的工作原理**系列文章的一部分：

1. [Invoke/InvokeAsync 部分](/post/dotnet/2017/09/26/dispatcher-invoke-async.html)
1. [PushFrame 部分](/post/dotnet/2017/09/26/dispatcher-push-frame.html)（本文）

### Dispatcher.PushFrame 是什么？

如果说上一篇文章 [深入了解 WPF Dispatcher 的工作原理（Invoke/InvokeAsync 部分）](/post/dotnet/2017/09/26/dispatcher-invoke-async.html) 中的 `Invoke` 算是偏冷门的写法，那 `ShowDialog` 总该写过吧？有没有好奇过为什么写 `ShowDialog` 的地方可以等新开的窗口返回之后继续执行呢？

```csharp
var w = new FooWindow();
w.ShowDialog();
Debug.WriteLine(w.Bar);
```

看来我们这次有必要再扒开 `Dispatcher.PushFrame` 的源码看一看了。不过在看之前，我们先看一看 Windows Forms 里面 `DoEvents` 的实现，这将有助于增加我们对源码的理解。

### DoEvents

Windows Forms 里面的 `DoEvents` 允许你在执行耗时 UI 操作的过程中插入一段 UI 的渲染过程，使得你的界面看起来并没有停止响应。

```csharp
[SecurityPermissionAttribute(SecurityAction.Demand, Flags = SecurityPermissionFlag.UnmanagedCode)]
public void DoEvents()
{
    DispatcherFrame frame = new DispatcherFrame();
    Dispatcher.CurrentDispatcher.BeginInvoke(DispatcherPriority.Background,
        new DispatcherOperationCallback(ExitFrame), frame);
    Dispatcher.PushFrame(frame);
}

public object ExitFrame(object f)
{
    ((DispatcherFrame)f).Continue = false;

    return null;
}
```

首先我们需要拿出本文一开始的结论——调用 `Dispatcher.PushFrame` 可以在不阻塞 UI 线程的情况下等待。

在此基础之上，我们仔细分析此源码的原理，发现是这样的：

1. 添加了一个 `Background`（4） 优先级的 `DispatcherOperation`，执行的操作就是调用 `ExitFrame` 方法。（如果不明白这句话，请回过头再看看 [Invoke/InvokeAsync 这部分](/post/dotnet/2017/09/26/dispatcher-invoke-async.html) 。）
1. 调用 `Dispatcher.PushFrame` 以便在不阻塞 UI 线程的情况下等待。
1. 由于用户输入的优先级是 `Input`（5），UI 响应的优先级是 `Loaded`（6），渲染的优先级是 `Render`（7），每一个都比 `Background`（4）高，于是只要有任何 UI 上的任务，都会先执行，直到没有任务时才会执行 `ExiteFrame` 方法。（如果不知道为什么，依然请回过头再看看 [Invoke/InvokeAsync 这部分](/post/dotnet/2017/09/26/dispatcher-invoke-async.html) 。）
1. 当 `ExitFrame` 被执行时，它会设置 `DispatcherFrame.Continue` 为 `false`。

为了让 `DoEvents` 实现它的目标，它必须能够在中间插入了 UI 和渲染逻辑之后继续执行后续代码才行。于是，我们可以大胆猜想，设置 `DispatcherFrame.Continue` 为 `false` 的目标是让 `Dispatcher.PushFrame(frame);` 这一句的等待结束，这样才能继续后面代码的执行。

好了，现在我们知道了一个不阻塞等待的开关：

- 调用 `Dispatcher.PushFrame(frame);` 来不阻塞地等待；
- 设置 `frame.Continue = false` 来结束等待，继续执行代码。

知道了这些，再扒 `Dispatcher.PushFrame` 代码会显得容易许多。

### PushFrame 的源码

这真是一项神奇的技术。以至于这一次我需要毫无删减地贴出全部源码：

```csharp
[SecurityCritical, SecurityTreatAsSafe ]
private void PushFrameImpl(DispatcherFrame frame)
{
    SynchronizationContext oldSyncContext = null;
    SynchronizationContext newSyncContext = null;
    MSG msg = new MSG();
 
    _frameDepth++;
    try
    {
        // Change the CLR SynchronizationContext to be compatable with our Dispatcher.
        oldSyncContext = SynchronizationContext.Current;
        newSyncContext = new DispatcherSynchronizationContext(this);
        SynchronizationContext.SetSynchronizationContext(newSyncContext);
 
        try
        {
            while(frame.Continue)
            {
                if (!GetMessage(ref msg, IntPtr.Zero, 0, 0))
                    break;
 
                TranslateAndDispatchMessage(ref msg);
            }
 
            // If this was the last frame to exit after a quit, we
            // can now dispose the dispatcher.
            if(_frameDepth == 1)
            {
                if(_hasShutdownStarted)
                {
                    ShutdownImpl();
                }
            }
        }
        finally
        {
            // Restore the old SynchronizationContext.
            SynchronizationContext.SetSynchronizationContext(oldSyncContext);
        }
    }
    finally
    {
        _frameDepth--;
        if(_frameDepth == 0)
        {
            // We have exited all frames.
            _exitAllFrames = false;
        }
    }
}
```

这里有两个点值得我们研究：

1. `_frameDepth` 字段。
1. `while` 循环部分。

我们先看看 `_frameDepth` 字段。每调用一次 `PushFrame` 就需要传入一个 `DispatcherFrame`，在一次 `PushFrame` 期间再调用 `PushFrame` 则会导致 `_frameDepth` 字段增 1。于是，一个个的 `DispatcherFrame` 就这样一层层嵌套起来。

再看看 `while` 循环。

```csharp
while(frame.Continue)
{
    if (!GetMessage(ref msg, IntPtr.Zero, 0, 0))
        break;

    TranslateAndDispatchMessage(ref msg);
}
```

还记得 `DoEvents` 节里我们说到的开关吗？就是这里的 `frame.Continue`。看到这段代码是不是很明确了？如果设置为 `false`，则退出循环，于是 `PushFrame` 方法返回，同时 `_frameDepth` 字段减 1。在一个个的 `frame.Continue` 都设置为 `false` 以至于后，程序将从 `Main` 函数退出。

如果 `frame.Continue` 一直保持为 `true` 呢？那就进入了“死循环”。可是这里我们需要保持清醒，因为“死循环”意味着阻塞，意味着无法在中间插入其它的 UI 代码。所以要么是 `GetMessage` 让我们能继续处理窗口消息，要么是 `TranslateAndDispatchMessage` 让我们能继续处理窗口消息。（至于为什么只要能处理消息就够了，我们上一篇说到过，`Dispatcher` 任务队列的处理就是利用了 Windows 的消息机制。）

![消息循环](/static/posts/2017-09-26-03-33-28.png)

然而，这两个方法内部都调用到了非托管代码，很难通过阅读代码了解到它处理消息的原理。但是通过 .NET Framework 源码调试技术我发现 `TranslateAndDispatchMessage` 方法似乎并没有被调用到，`GetMessage` 始终在执行。我们有理由相信用于实现非阻塞等待的关键在 `GetMessage` 方法内部。.NET Framework 源码调试技术请参阅：[调试 ms 源代码 - 林德熙](http://blog.lindexi.com/lindexi//post/%E8%B0%83%E8%AF%95-ms-%E6%BA%90%E4%BB%A3%E7%A0%81/)。

于是去 `GetMessage` 方法内，找到了 `UnsafeNativeMethods.ITfMessagePump` 类型的变量 `messagePump`。这是 Windows 消息循环中的重要概念。看到这里，似乎需要更了解消息循环才能明白实现非阻塞等待的关键。不过我们可以再次通过调试 .NET Framework 的源码来了解消息循环在其中做的重要事情。

---

### 调试源码以研究 PushFrame 不阻塞等待的原理

为了开始调试，我为主窗口添加了触摸按下的事件处理函数：

```csharp
private void OnStylusDown(object sender, StylusDownEventArgs e)
{
    Dispatcher.Invoke(() =>
    {
        Console.WriteLine();
        new MainWindow().ShowDialog();
    }, DispatcherPriority.Background);
}
```

其中 `Dispatcher.Invoke` 和 `ShowDialog` 都是为了执行 `PushFrame` 而写的代码。`Console.WriteLine()` 只是为了让我打上一个用于观察的断点。

运行程序，在每一次触摸主窗口的时候，我们都会命中一次断点。观察 Visual Studio 的调用堆栈子窗口，我们会发现每触摸一次命中断点时调用堆栈中会多一次 `PushFrame`，继续执行，由于 `ShowDialog` 又会多一次 `PushFrame`。于是，我们每触摸一次，调用堆栈中会多出两个 `PushFrame`。

每次 `PushFrame` 之后，都会经历一次托管到本机和本机到托管的转换，随后是消息处理。我们的触摸消息就是从消息处理中调用而来。

于是可以肯定，每一次 `PushFrame` 都将开启一个新的消息循环，由非托管代码开启。当 `ShowDialog` 出来的窗口关掉，或者 `Invoke` 执行完毕，或者其它会导致 `PushFrame` 退出循环的代码执行时，就会退出一次 `PushFrame` 带来的消息循环。于是，在上一次消息处理中被 `while` 阻塞的代码得以继续执行。一层层退出，直到最后 `Main` 函数退出时，程序结束。

![PushFrame 的嵌套](/static/posts/2017-09-26-03-47-20.png)

上图使用的是我在 GitHub 上的一款专门研究 WPF 触摸原理的测试项目：[https://github.com/walterlv/ManipulationDemo](https://github.com/walterlv/ManipulationDemo)。

至此，`PushFrame` 能够做到不阻塞 UI 线程的情况下继续响应消息的原理得以清晰地梳理出来。

如果希望更详细地了解 WPF 中的 Dispatcher 对消息循环的处理，可以参考：[详解WPF线程模型和Dispatcher - 踏雪无痕 - CSDN博客](http://blog.csdn.net/royyeah/article/details/4785473)。

### 结论

1. 每一次 `PushFrame` 都会开启一个新的消息循环，记录 `_frameDepth` 加 1；
1. 在新的消息循环中，会处理各种各样的 Windows 消息，其中有的以事件的形式转发，有的是执行加入到 `PriorityQueue<DispatcherOperation>` 队列中的任务；
1. 在显式地退出 `PushFrame` 时，新开启的消息循环将退出，并继续此前 `PushFrame` 处的代码执行；
1. 当所有的 `PushFrame` 都退出后，程序结束。
1. `PushFrame` 的 `while` 循环是真的阻塞着主线程，但循环内部会处理消息循环，以至于能够不断地处理新的消息，看起来就像没有阻塞一样。（这与我们平时随便写代码阻塞主线程导致无法处理消息还是有区别的。）

### PushFrame 的已知缺陷

`PushFrame` 使用通过开启一个新的消息循环使得 UI 线程能够在新的消息循环中处理消息，以便 UI “不卡”，同时使得调用 `PushFrame` 的代码能够 “阻塞”。

这种实现方式也带来了一些问题：

1. 调用代码被虽然被阻塞，但又不像常规线程阻塞一样 —— 它会发生 “意料之外” 的重入问题，即单个线程也会遇到并发问题。
    - 关于重入，可以阅读：[异步任务中的重新进入（Reentrancy）](/post/reentrancy-in-async-method.html)
1. `PushFrame` 使用 Windows 消息循环机制，而多重消息循环机制可能出现其他 Bug，例如：
    - 当你在用鼠标拖拽窗口调整位置或大小的时候，如果触发了一次 `PushFrame`，那么此窗口会卡住
        - [c# - PushFrame locks up WPF window when user is moving window - Stack Overflow](https://stackoverflow.com/q/19411613/6233938)

---

#### 参考资料

- PushFrame/DispatcherFrame
    - [Dispatcher.cs](http://referencesource.microsoft.com/#WindowsBase/Base/System/Windows/Threading/Dispatcher.cs)
    - [c# - WPF DispatcherFrame magic - how and why this works? - Stack Overflow](https://stackoverflow.com/questions/33002966/wpf-dispatcherframe-magic-how-and-why-this-works)
    - [c# - For what is PushFrame needed? - Stack Overflow](https://stackoverflow.com/questions/41759665/for-what-is-pushframe-needed)
    - [multithreading - WPF - Dispatcher PushFrame() - Stack Overflow](https://stackoverflow.com/questions/2665191/wpf-dispatcher-pushframe)
    - [DispatcherFrame Class (System.Windows.Threading)](https://msdn.microsoft.com/en-us/library/system.windows.threading.dispatcherframe.aspx)
    - [DispatcherFrame. Look in-Depth - CodeProject](https://www.codeproject.com/Articles/152137/DispatcherFrame-Look-in-Depth)
- Windows 消息循环
    - [Message loop in Microsoft Windows - Wikipedia](https://en.wikipedia.org/wiki/Message_loop_in_Microsoft_Windows)
    - [c# - Understanding the Dispatcher Queue - Stack Overflow](https://stackoverflow.com/questions/11417216/understanding-the-dispatcher-queue/11419762)
    - [详解WPF线程模型和Dispatcher - 踏雪无痕 - CSDN博客](http://blog.csdn.net/royyeah/article/details/4785473)
- 调试 .NET Framework 源码
    - [调试 ms 源代码 - 林德熙](http://blog.lindexi.com/lindexi//post/%E8%B0%83%E8%AF%95-ms-%E6%BA%90%E4%BB%A3%E7%A0%81/)
- 已知缺陷
    - [c# - PushFrame locks up WPF window when user is moving window - Stack Overflow](https://stackoverflow.com/q/19411613/6233938)
