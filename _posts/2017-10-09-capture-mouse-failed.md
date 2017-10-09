---
title: "CaptureMouse/CaptureStylus 可能会失败"
date: 2017-10-09 19:05:56 +0800
categories: wpf
tags: CaptureMouse CaptureStylus
description: 
---

在 WPF 中，如果我们要做拖动效果，通常会调用一下 `CaptureMouse`/`CaptureStylus` 以便当鼠标或手指离开控件的时候依然能够响应 `Move` 和 `Up` 事件。不知有没有注意到这两个函数其实是有 `bool` 返回值的？——是的，它们可能会失败。

---

在调试一个项目代码的时候，我就发现了这种失败，观察返回值确实是 `false`，然而为什么呢？

查看 [.Net Framework 的源码](http://referencesource.microsoft.com/#PresentationCore/Core/CSharp/System/Windows/Input/Mouse.cs,679caaf70ff0c397) 我们发现，`CaptureMouse` 最终调到了 `Mouse.Capture` 方法：

```csharp
public static bool Capture(IInputElement element)
{
    return Mouse.PrimaryDevice.Capture(element);
}
```

然后一步步调到了 [`bool Capture(IInputElement element, CaptureMode captureMode)`](http://referencesource.microsoft.com/#PresentationCore/Core/CSharp/System/Windows/Input/MouseDevice.cs,35f00e7026f6c3d7)，而其中对是否可 `Capture` 的关键性影响代码就在这个方法内部。为了便于理解，我把他改成了下面这样，是等价的：

```csharp
[Pure]
private static bool CanCapture(IInputElement element)
{
    if (element is UIElement e)
    {
        return e.IsVisible && e.IsEnabled;
    }
    if (element is ContentElement ce)
    {
        return ce.IsEnabled;
    }
    if (element is UIElement3D e3D)
    {
        return e3D.IsVisible && e3D.IsEnabled;
    }
    return true;
}
```

*这段代码感兴趣可以拿走，以便在 `Capture` 之前可以进行预判。*

从这段代码可以很清楚地知道，如果元素已不可见 (`IsVisible` 为 `false`) 或者不可用（`IsEnabled` 为 `false`），则不可 `Capture`。

以此为线索，果然发现调试的项目中在 `MouseDown` 事件里把元素隐藏了。

总结：

- 如果元素不可见或不可用，则 `Mouse.Capture` 会失败。

---

顺便还发现一个问题，`Stylus.Capture(IInputElement)` 中居然直接调用的是 `Mouse.Capture(IInputElement)`。
