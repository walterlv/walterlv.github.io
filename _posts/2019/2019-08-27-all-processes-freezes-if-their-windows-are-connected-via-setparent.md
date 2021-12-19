---
title: "使用 SetParent 跨进程设置父子窗口时的一些问题（小心卡死）"
date: 2019-08-27 08:49:06 +0800
tags: dotnet wpf csharp windows
position: problem
permalink: /post/all-processes-freezes-if-their-windows-are-connected-via-setparent.html
---

在微软的官方文档中，说 `SetParent` 可以在进程内设置，也可以跨进程设置。当使用跨进程设置窗口的父子关系时，你需要注意本文提到的一些问题，避免踩坑。

---

<div id="toc"></div>

## 跨进程设置 `SetParent`

关于 `SetParent` 函数设置窗口父子关系的文档可以看这个：

- [SetParent function (winuser.h) - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setparent)

在这篇文章的 DPI 感知一段中明确写明了在进程内以及跨进程设置父子关系时的一些行为。虽然没有明确说明支持跨进程设置父子窗口，不过这段文字就几乎说明 Windows 系统对于跨进程设置窗口父子关系还是支持的。

但 Raymond Chen 在 [Is it legal to have a cross-process parent/child or owner/owned window relationship?](https://devblogs.microsoft.com/oldnewthing/?p=4683) 一文中有另一段文字：

> If I remember correctly, the documentation for `Set­Parent` used to contain a stern warning that it is not supported, but that remark does not appear to be present any more. I have a customer who is reparenting windows between processes, and their application is experiencing intermittent instability.  
> 如果我没记错的话，`SetParent` 的文档曾经包含一个严厉的警告表明它不受支持，但现在这段备注似乎已经不存在了。我就遇到过一个客户跨进程设置窗口之间的父子关系，然后他们的应用程序间歇性不稳定。

这里表明了 Raymond Chen 对于跨进程设置父子窗口的一些担忧，但从文档趋势来看，还是支持的。只是这种担忧几乎说明跨进程设置 `SetParent` 存在一些坑。

那么本文就说说跨进程设置父子窗口的一些坑。

## 消息循环强制同步

### 消息循环

我们会感觉到 Windows 中某个窗口有响应（比如鼠标点击有反应），是因为这个窗口在处理 Windows 消息。窗口进行消息循环不断地处理消息使得各种各样的用户输入可以被处理，并正确地在界面上显示。

一个典型的消息循环大概像这样：

```csharp
while(GetMessage(ref msg, IntPtr.Zero, 0, 0))
{
    TranslateMessage(ref msg);
    DispatchMessage(ref msg);
}
```

对于显示了窗口的某个线程调用了 `GetMessage` 获取了消息，Windows 系统就会认为这个线程有响应。相反，如果长时间不调用 `GetMessage`，Windows 就会认为这个线程无响应。`TranslateMessage` 则是翻译一些消息（比如从按键消息翻译成字符消息）。真正处理 `GetMessage` 中的内容则是后面的调度消息 `DispatchMessage`，是这个函数的调用使得我们 UI 界面上的内容可以有可见的反映。

一般来说，每个创建了窗口的线程都有自己独立的消息循环，且不会互相影响。然而一旦这些窗口之间建立了父子关系之后就会变得麻烦起来。

### 强制同步

Windows 会让具有父子关系的所有窗口的消息循环强制同步。具体指的是，所有具有父子关系的窗口消息循环，其消息循环会串联成一个队列（这样才可以避免消息循环的并发）。

也就是说，如果你有 A、B、C、D 四个窗口，分属不同进程，A 是 B、C、D 窗口的父窗口，那么当 A 在处理消息的时候，B、C、D 的消息循环就会卡在 `GetMessage` 的调用。同样，无论是 B、C 还是 D 在处理消息的时候，其他窗口也会同样卡在 `GetMessage` 的调用。这样，所有进程的 UI 线程实际上会互相等待，所有通过消息循环执行的代码都不会同时执行。然而实际上 Windows GUI 应用程序的开发中基本上 UI 代码都是通过消息循环来执行的，所以这几乎等同于所有进程的 UI 线程强制同步成类似一个 UI 线程的效果了。

带来的副作用也就相当明显，任何一个进程卡了 UI，其他进程的 UI 将完全无响应。当然，不依赖消息循环的代码不会受此影响，比如 WPF 应用程序的动画和渲染。

## 如何解决

对于 `SetParent` 造成的这些问题，实际上没有官方的解决方案，你需要针对你不同的业务采用不同的解决办法。

正如 Raymond Chen 所说：

>  (It’s one of those “if you don’t already know what the consequences are, then you are not smart enough to do it correctly” things. You must first become the master of the rules before you can start breaking them.)  
> 正如有些人说的“如果你不知道后果，那么你也不足以正确地完成某件事情”。在开始破坏规则之前，您必须先成为规则的主人。

你必须清楚跨进程设置父子窗口带来的各种副作用，然后针对性地给出解决方案：

1. 比如所有窗口会强制串联成一个队列，那么可以考虑将暂时不显示的窗口断开父子关系；
1. 比如设置窗口的位置大小等操作，必须考虑此窗口不是顶层窗口的问题，需要跨越进程到顶层窗口来操作；

---

**参考资料**

- [windows - Good or evil - SetParent() win32 API between different processes - Stack Overflow](https://stackoverflow.com/questions/3459874/good-or-evil-setparent-win32-api-between-different-processes)
- [Hosting WPF UI cross-thread and cross-process – Diaries of a Software Plumber](https://blogs.msdn.microsoft.com/changov/2009/10/26/hosting-wpf-ui-cross-thread-and-cross-process/)
- [Is it legal to have a cross-process parent/child or owner/owned window relationship? | The Old New Thing](https://devblogs.microsoft.com/oldnewthing/?p=4683)
- [winapi - Why are "TranslateMessage" and "DispatchMessage" separate calls? - Stack Overflow](https://stackoverflow.com/questions/3152011/why-are-translatemessage-and-dispatchmessage-separate-calls)

