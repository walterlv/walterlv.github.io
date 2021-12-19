---
title: "System.InvalidOperationException:“BuildWindowCore 无法返回寄宿的子窗口句柄。”"
date: 2019-08-14 16:32:42 +0800
tags: wpf windows dotnet csharp
position: problem
coverImage: /static/posts/2019-08-14-16-08-13.png
---

当试图在 WPF 窗口中嵌套显示 Win32 子窗口的时候，你有可能出现错误：“`BuildWindowCore 无法返回寄宿的子窗口句柄。`”。

这是很典型的 Win32 错误，本文介绍如何修复此错误。

---

<div id="toc"></div>

我们在 `MainWindow` 中嵌入一个其他的窗口来承载新的 WPF 控件。一般情况下我们当然不会这么去做，但是如果我们要跨越进程边界来完成 WPF 渲染内容的融合的时候，就需要嵌入一个新的窗口了。

WPF 中可以使用 `HwndSource` 来包装一个 WPF 控件到 Win32 窗口，使用自定义的继承自 `HwndHost` 的类可以把 Win32 窗口包装成 WPF 控件。由于窗口句柄是可以跨越进程边界传递的，所以这样的方式可以完成跨进程的 WPF 控件显示。

## 问题

你有可能在调试嵌入窗口代码的时候遇到错误：

![错误](/static/posts/2019-08-14-16-08-13.png)

> System.InvalidOperationException:“BuildWindowCore 无法返回寄宿的子窗口句柄。”

英文是：

> BuildWindowCore failed to return the hosted child window handle.

## 原因和解决办法

此异常的原因非常简单，是 `HwndSource` 的 `BuildWindowCore` 的返回值有问题。具体来说，就是子窗口的句柄返回了 0。

也就是下面这段代码中 `return new HandleRef(this, IntPtr.Zero)` 这句，第二个参数是 0。

```csharp
protected override HandleRef BuildWindowCore(HandleRef hwndParent)
{
    const int WS_CHILD = 1073741824;
    const int WS_CLIPCHILDREN = 33554432;
    var parameters = new HwndSourceParameters("demo")
    {
        ParentWindow = hwndParent.Handle,
        WindowStyle = (int)(WS_CHILD | WS_CLIPCHILDREN),
        TreatAncestorsAsNonClientArea = true,
    };
    var source = new HwndSource(parameters);
    source.RootVisual = new Button();
    return new HandleRef(this, _handle);
}
```

要解决，就需要传入正确的句柄值。当然上面的代码为了示例，故意传了一个不知道哪里的 `_handle`，实际上应该传入 `source.Handle` 才是正确的。

