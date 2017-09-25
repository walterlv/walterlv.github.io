---
layout: post
title: "深入了解 WPF Dispatcher 的工作原理（PushFrame 部分）"
date: 2017-09-26 02:08:46 +0800
categories: post dotnet
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

首先我们需要拿出本文一开始的结论——调用 `DispatcherPushFrame` 可以在不阻塞 UI 线程的情况下等待。

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

1. `while` 循环部分。
1. `_frameDepth` 字段。

```csharp
while(frame.Continue)
{
    if (!GetMessage(ref msg, IntPtr.Zero, 0, 0))
        break;

    TranslateAndDispatchMessage(ref msg);
}
```

还记得 `DoEvents` 节里我们说到的开关吗？就是这里的 `frame.Continue`。看到这段代码是不是很明确了？如果设置为 `false`，则退出循环，于是 `PushFrame` 方法返回，同时 `_frameDepth` 字段减 1。多个 `PushFrame` 之间可能会互相嵌套（在 `PushFrame` 的等待期间又执行了一次 `PushFrame`），每嵌套一次，`_frameDepth` 字段增 1。在一个个的 `frame.Continue` 都设置为 `false` 后，程序将从 `Main` 函数退出。

如果 `frame.Continue` 一直保持为 `true` 呢？那就进入了“死循环”。可是这里我们需要保持清醒，因为“死循环”意味着阻塞，意味着无法在中间插入其它的 UI 代码。所以要么是 `GetMessage` 让我们能继续处理窗口消息，要么是 `TranslateAndDispatchMessage` 让我们能继续处理窗口消息。（至于为什么只要能处理消息就够了，我们上一篇说到过，`Dispatcher` 任务队列的处理就是利用了 Windows 的消息机制。）

然而，这两个方法内部都调用到了非托管代码，很难通过阅读代码了解到它处理消息的原理。但是通过 .Net Framework 源码调试技术我发现 `TranslateAndDispatchMessage` 方法似乎并没有被调用到，`GetMessage` 始终在执行。我们有理由相信用于实现非阻塞等待的关键在 `GetMessage` 方法内部。.Net Framework 源码调试技术请参阅：[调试 ms 源代码 - 林德熙](http://lindexi.oschina.io/lindexi//post/%E8%B0%83%E8%AF%95-ms-%E6%BA%90%E4%BB%A3%E7%A0%81/)。

于是去 `GetMessage` 方法内，找到了 `UnsafeNativeMethods.ITfMessagePump` 类型的变量 `messagePump`。这是 Windows 消息循环中的重要概念。看到这里，似乎需要更了解消息循环才能明白实现非阻塞等待的关键。

### Windows 消息循环



#### 参考资料

- PushFrame/DispatcherFrame
  - [Dispatcher.cs](http://referencesource.microsoft.com/#WindowsBase/Base/System/Windows/Threading/Dispatcher.cs)
  - [c# - WPF DispatcherFrame magic - how and why this works? - Stack Overflow](https://stackoverflow.com/questions/33002966/wpf-dispatcherframe-magic-how-and-why-this-works)
  - [c# - For what is PushFrame needed? - Stack Overflow](https://stackoverflow.com/questions/41759665/for-what-is-pushframe-needed)
  - [multithreading - WPF - Dispatcher PushFrame() - Stack Overflow](https://stackoverflow.com/questions/2665191/wpf-dispatcher-pushframe)
  - [DispatcherFrame Class (System.Windows.Threading)](https://msdn.microsoft.com/en-us/library/system.windows.threading.dispatcherframe.aspx)
- Windows 消息循环
  - [Message loop in Microsoft Windows - Wikipedia](https://en.wikipedia.org/wiki/Message_loop_in_Microsoft_Windows)
  - [c# - Understanding the Dispatcher Queue - Stack Overflow](https://stackoverflow.com/questions/11417216/understanding-the-dispatcher-queue/11419762)
- 调试 .Net Framework 源码
  - [调试 ms 源代码 - 林德熙](http://lindexi.oschina.io/lindexi//post/%E8%B0%83%E8%AF%95-ms-%E6%BA%90%E4%BB%A3%E7%A0%81/)
