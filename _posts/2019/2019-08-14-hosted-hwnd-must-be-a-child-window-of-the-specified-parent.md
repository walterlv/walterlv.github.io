---
title: "System.InvalidOperationException:“寄宿的 HWND 必须是指定父级的子窗口。”"
date: 2019-08-14 16:32:16 +0800
tags: wpf windows dotnet csharp
position: problem
coverImage: /static/posts/2019-08-14-16-17-50.png
permalink: /post/hosted-hwnd-must-be-a-child-window-of-the-specified-parent.html
---

当试图在 WPF 窗口中嵌套显示 Win32 子窗口的时候，你有可能出现错误：“`寄宿的 HWND 必须是指定父级的子窗口。`”。

这是很典型的 Win32 错误，本文介绍如何修复此错误。

---

<div id="toc"></div>

我们在 `MainWindow` 中嵌入一个其他的窗口来承载新的 WPF 控件。一般情况下我们当然不会这么去做，但是如果我们要跨越进程边界来完成 WPF 渲染内容的融合的时候，就需要嵌入一个新的窗口了。

WPF 中可以使用 `HwndSource` 来包装一个 WPF 控件到 Win32 窗口，使用自定义的继承自 `HwndHost` 的类可以把 Win32 窗口包装成 WPF 控件。由于窗口句柄是可以跨越进程边界传递的，所以这样的方式可以完成跨进程的 WPF 控件显示。

## 问题

你有可能在调试嵌入窗口代码的时候遇到错误：

![错误](/static/posts/2019-08-14-16-17-50.png)

> System.InvalidOperationException:“寄宿的 HWND 必须是指定父级的子窗口。”

英文是：

> Hosted HWND must be a child window of the specified parent.

## 原因和解决办法

出现此错误，是因为同一个子窗口被两次设置为同一个窗口的子窗口。

具体来说，就是 A 窗口使用 `HwndHost` 设置成了 B 的子窗口，随后 A 又通过一个新的 `HwndHost` 设置成了新子窗口。

要解决，则必须确保一个窗口只能使用 `HwndHost` 设置一次子窗口。


