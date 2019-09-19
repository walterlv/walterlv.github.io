---
title: "WPF 程序如何移动焦点到其他控件"
date: 2019-09-19 11:33:07 +0800
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

---

**参考资料**

- [winapi - Win32: C++: How do I re-focus on Parent Window after clicking in a child window? - Stack Overflow](https://stackoverflow.com/a/31570683/6233938)
