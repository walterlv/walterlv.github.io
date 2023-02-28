---
title: "WPF 的 Dispatcher 为什么要创建一个隐藏窗口？"
date: 2023-02-28 10:18:05 +0800
categories: wpf windows
position: knowledge
coverImage: /static/posts/2023-02-28-10-17-59.png
---

在[深入了解 WPF Dispatcher 的工作原理（Invoke/InvokeAsync 部分）](/post/dotnet/2017/09/26/dispatcher-invoke-async.html)中，我提到 `Dispatcher` 在构造函数中创建了一个隐藏窗口专门用来接收消息，以处理通过 `Invoke` 系列方法调用的那些操作。然而 C 不满足于只看到这个结论，他更期望知道为什么 WPF 一定要创建这个隐藏的窗口。其实对这个问题我也不知道答案，但在和他深入的探讨以及不断寻找资料的过程中，我们逐渐得知了缘由。

本文记录了这一次探讨，给希望了解 Windows、WPF 底层机制的人一些可供参考的思路和结论。当然，要特别感谢 C 提出了这个问题，并在讨论过程中给出了关键性的推理。

---

<div id="toc"></div>

## 隐藏窗口的疑问

先来回顾一下 Dispatcher 构造函数中与创建窗口相关的部分：

```csharp
// Create the message-only window we use to receive messages
// that tell us to process the queue.
MessageOnlyHwndWrapper window = new MessageOnlyHwndWrapper();
_window = new SecurityCriticalData<MessageOnlyHwndWrapper>( window );

_hook = new HwndWrapperHook(WndProcHook);
_window.Value.AddHook(_hook);
```

它创建了一个 Message-Only 窗口，专门监听此窗口收到的消息。然而，试问这个问题：

> **一定需要此隐藏窗口吗？**
>
> 消息循环不一定需要窗口来参与啊！没有窗口，消息循环依旧能持续进行并处理消息。

## 所需知识的梳理

为了能让阅读这篇博客的所有人都能理解这个问题，我们需要简单了解一下 Windows 消息循环机制。

从本质上说，消息循环就是在某个线程上执行了以下代码：

```csharp
while( (bRet = GetMessage( &msg, NULL, 0, 0 )) != 0)
{ 
    if (bRet == -1)
    {
        // handle the error and possibly exit
    }
    else
    {
        TranslateMessage(&msg); 
        DispatchMessage(&msg); 
    }
}
```

在这段代码里，`GetMessage` 是从此线程的消息队列中取得消息，`TranslateMessage` 将按键消息转换为字符消息并重新发送到此消息队列，`DispatchMessage` 则将消息调度到窗口过程。

可以发现，全程是不需要任何窗口参与的。我们已经在这个循环中拿到了发往此线程的所有的消息，一个都没有漏掉。既然如此，`Invoke` 相关的自定义消息也可以发给这个线程的消息队列（而不是发给特定的窗口），这样也不会漏掉任何消息。也就是说，不需要创建任何窗口也能收到并处理所需的任何消息。

对于没有接触过 Windows 消息机制的 WPF 开发者来说，可能会认为上面那段代码是 Windows 系统提供的某种机制，是自己不能控制和扩展的代码。其实不是这样的，这段代码是需要由开发者开发的应用程序中手动处理的。WPF 框架只是帮助我们处理好了这件琐事而已。既然 WPF 框架已经处理了这件琐事，那就意味着同在框架内的 `Invoke` 的那些操作也能放到这里一并处理了，并不需要创建一个隐藏消息窗口（Hidden Message-Only Window）来绕着圈子处理。再大不了觉得这样在消息循环中耦合了 `Dispatcher` 内的机制的话，可以利用一下“依赖倒置”原则将这种依赖抽象一下，在解决代码可维护性的问题的同时，依然能可以避免额外创建一个窗口。所以综合来看，似乎创建隐藏消息窗口真的显得没有必要。

## 可供参考的资料

在我和 C 探讨的过程中，我找到了一些对此问题有帮助的资料：

1. Message-Only Window
    - [Window Features - Win32 apps - Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/winmsg/window-features#message-only-windows)
2. 发送消息到窗口
    - [SendMessageA function (winuser.h) - Win32 apps - Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-sendmessagea)
    - [PostMessageA function (winuser.h) - Win32 apps - Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-postmessagea)
3. 发送消息到线程
    - [PostThreadMessageA function (winuser.h) - Win32 apps - Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-postthreadmessagea)

其中 1、2 可以帮助对 Windows 消息循环机制不太熟悉的小伙伴了解更多解答此问题的背景知识：

1. 从第一篇资料中我们可知，Message-Only Window 是 Windows 中一项很重要的机制，甚至专门为开发者创建此窗口准备了一个常量 ` HWND_MESSAGE`。虽然不能正面证明前面 WPF 创建隐藏消息窗口的必要性，但可以知道这至少是一个常用做法。既然常用，那一定有其存在的必要性。
2. 从第二篇资料中我们可知，在 `SendMessage` 函数中将窗口句柄参数传入 `NULL` 将会失败，而在 `PostMessage` 函数中将窗口句柄参数传入 `NULL` 的效果将和 `PostThreadMessage` 的效果完全相同。而 `PostThreadMessage` 则一样会正常将消息加入到此线程的消息队列中。

而当我们仔细再去阅读 `PostThreadMessage` 文档中的注解部分时，就会注意到下面这段话：

> Messages sent by `PostThreadMessage` are not associated with a window. As a general rule, messages that are not associated with a window cannot be dispatched by the `DispatchMessage` function. Therefore, if the recipient thread is in a modal loop (as used by MessageBox or DialogBox), the messages will be lost. To intercept thread messages while in a modal loop, use a thread-specific hook.
>
> PostThreadMessage 发送的消息与窗口不关联。作为一般规则，与窗口不关联的消息不能由 `DispatchMessage` 函数调度。 因此，如果收件人线程处于模式循环中， (MessageBox 或 DialogBox) ，则消息将丢失。 若要在模式循环中截获线程消息，请使用特定于线程的挂钩。

按文中的说法，如果我们使用 `PostThreadMessage` 来发送消息给这个线程的消息队列，那么当此线程处于模态时，消息将丢失，除非使用特定于线程的挂钩。

看起来这是在描述一个现象：如果我们不使用隐藏的消息窗口而是直接将消息发给线程，那么此消息将在线程处于模态时丢失。可是，为什么会丢失呢？

## 隐藏窗口的解答

我和 C 的探讨差点在上述阶段终止时，C 猛然意识到了上述现象的本质原因。是的，这就是本文疑问的最本质解答！

```csharp
// 消息循环
while( (bRet = GetMessage( &msg, NULL, 0, 0 )) != 0)
{ 
    if (bRet == -1)
    {
        // handle the error and possibly exit
    }
    else
    {
        TranslateMessage(&msg); 
        DispatchMessage(&msg); 
    }
}
```

1. `DispatchMessage` 的作用就是将消息循环中窗口相关的消息转发给对应的窗口进行调度。
    - 如果使用 Message-Only 窗口，那么无论谁来写消息循环，只要写消息循环的这名开发者在消息处理中调用了 `DispatchMessage` 函数，那么窗口就可以正常处理消息。
    - 然而，如果 WPF 的 `Invoke` 机制没有使用 Message-Only 窗口，那么 `DispatchMessage` 的转发将没有其他途径可以调用到 `Invoke` 中的那些操作；唯一能处理 `Invoke` 那些操作的地方就是正在处理消息循环的这个循环本环里！
2. 设想，有一个开发者在处理某条消息的时候自己创建了一个新的消息循环（即嵌套的消息循环），那么那个开发者必须在自己的消息循环里调用一下 `Invoke` 中的那些操作，否则那些操作将没有任何机会被执行！
    - 而开发者们为什么要自己去开消息循环呢？这不就是众所周知的“模态”吗？？？弹模态对话框的本质就是开了一个新的消息循环处理消息的同时，阻塞原来的消息循环。另外，拖拽文件、拖拽窗口，本质上都是开了一个新的消息循环处理消息。
    - 由于内外层的消息循环都是调用的 `GetMessage` 函数取得消息，内层的消息循环退出后，对于外层消息循环来说消息已经被消费了，再也回不来了，这不就是丢失了吗？！

综上所述，WPF 在 `Dispatcher` 的机制里创建隐藏的消息窗口，其目的就是为了解决消息循环嵌套问题，只要所有实现了消息循环的开发者能记得调用 `DispatchMessage` 函数，`Dispatcher` 就能完成 `Invoke` 那些操作的处理，而开发者们绝对不会忘了调用这个函数（否则你的程序根本无法工作）。反之，如果 `Dispatcher` 直接使用线程本身的消息循环，那么就必须指望所有消息循环的开发者主动来调用 `Dispatcher` 提供的某种方法，这显然是不利于代码的高质量维护的。

实际上在我们分析完原因后，会发现 Windows 本身提供的 Message-Only Window 机制的出现也是为了解决相同的问题。这也是本文贴出的代码是 C++ 代码，而非 WPF 源码的原因。

探讨结束了，特别感谢 C 在这个过程中提出的关键的分析逻辑。

![C](/static/posts/2023-02-28-10-17-59.png)

---

**参考资料**

- [Using Messages and Message Queues - Win32 apps - Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/winmsg/using-messages-and-message-queues)
- [TranslateMessage function (winuser.h) - Win32 apps - Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-translatemessage)
- [DispatchMessage function (winuser.h) - Win32 apps - Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-dispatchmessage)
- [Window Features - Win32 apps - Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/winmsg/window-features#message-only-windows)
- [SendMessageA function (winuser.h) - Win32 apps - Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-sendmessagea)
- [PostMessageA function (winuser.h) - Win32 apps - Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-postmessagea)
- [PostThreadMessageA function (winuser.h) - Win32 apps - Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-postthreadmessagea)

