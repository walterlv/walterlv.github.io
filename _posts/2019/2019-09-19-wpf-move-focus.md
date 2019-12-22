---
title: "WPF 程序如何移动焦点到其他控件"
date: 2019-09-19 11:41:12 +0800
categories: wpf dotnet csharp
position: knowledge
---

WPF 中可以使用 `UIElement.Focus()` 将焦点设置到某个特定的控件，也可以使用 `TraversalRequest` 仅仅移动焦点。本文介绍如何在 WPF 程序中控制控件的焦点。

---

<div id="toc"></div>

## `UIElement.Focus`

仅仅需要在任何一个控件上调用 `Focus()` 方法即可将焦点设置到这个控件上。

但是需要注意，要使 `Focus()` 能够工作，这个元素必须满足两个条件：

- `Focusable` 设置为 `true`
- `IsVisible` 是 `true`

## `TraversalRequest`

如果你并不是将焦点设置到某个特定的控件，而是希望将焦点转移，可以考虑使用 `TraversalRequest` 类。

比如，以下代码是将焦点转移到下一个控件，也就是按下 Tab 键时焦点会去的控件。

```csharp
var traversalRequest = new TraversalRequest(FocusNavigationDirection.Next);
// view 是可视化树中的一个控件。
view.MoveFocus(traversalRequest);
```

## 关于逻辑焦点和键盘焦点

键盘焦点就是你实际上按键输入和快捷键会生效的焦点，也就是当前正在工作的控件的焦点。

而 WPF 有多个焦点范围（Focus Scope），按下 Tab 键切换焦点的时候只会在当前焦点范围切焦点，不会跨范围。那么一旦跨范围切焦点的时候，焦点会去哪里呢？答案是逻辑焦点。

每个焦点范围内都有一个逻辑焦点，记录如果这个焦点范围一旦获得焦点后应该在哪个控件获得键盘焦点。

比如默认情况下 WPF 每个 `Window` 就是一个焦点范围，那么每个 `Window` 中的当前焦点就是逻辑焦点。而一旦这个 `Window` 激活，那么这个窗口中的逻辑焦点就会成为键盘焦点，另一个窗口当中的逻辑焦点保留，而键盘焦点则丢失。

## 跨窗口/跨进程切换焦点

参见我的另一篇博客：

- [WPF 程序如何跨窗口/跨进程设置控件焦点](/post/move-focus-to-win32-window.html)

---

**参考资料**

- [winapi - Win32: C++: How do I re-focus on Parent Window after clicking in a child window? - Stack Overflow](https://stackoverflow.com/a/31570683/6233938)
