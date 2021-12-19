---
title: "使 WPF 支持触摸板的横向滚动"
publishDate: 2017-11-23 21:25:40 +0800
date: 2018-08-12 16:02:51 +0800
tags: windows wpf
version:
  current: 中文
versions:
  - 中文: #
  - English: /post/handle-horizontal-scrolling-of-touchpad-en.html
coverImage: /static/posts/2017-11-23-21-19-52.png
permalink: /posts/handle-horizontal-scrolling-of-touchpad.html
---

微软终于开始学苹果一样好好做触摸板了*（就是键盘空格键下面那一大块）*。然而鉴于以前没有好好做，以至于 WPF 程序甚至都没有对触摸板的横向滚动提供支持*（竖向滚动是直接使用了 `MouseWheel`，汗……）*。但有些功能真希望能够支持横向滚动！

本文将介绍让触摸板支持横向滚动的方法，本质上也是用 `MouseWheel`，但却支持了横向。

---

{% include post-version-selector.html %}

![](/static/posts/2017-11-23-21-19-52.png)  
▲ 精确式触摸板

我们需要从 Windows 的窗口消息中获取 `WM_MOUSEHWHEEL` 消息。对，就是鼠标滚轮消息！以前我们只取了纵向数据，现在我们要取横向数据。

首先，我们需要能够监听得到消息才行。重写 `Window` 的 `OnSourceInitialized` 方法可以开始监听消息；如果代码没办法写到 `Window` 中，可以通过 `Window.GetWindow(DependencyObject)` 获取到窗口实例后监听它的 `SourceInitialized` 事件。如果拿不到这样的时机，则只要在任何 `SourceInitialized` 之后的时机（比如 `Loaded`）都可以写下面方法内部的两行代码。

```csharp
protected override void OnSourceInitialized(EventArgs e)
{
    var source = PresentationSource.FromVisual(_board);
    ((HwndSource) source)?.AddHook(Hook);
}

private IntPtr Hook(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
{
    // 在这里添加消息的处理。
    return IntPtr.Zero;
}
```

接下来，我们开始处理 `WM_MOUSEHWHEEL`：

```csharp
const int WM_MOUSEHWHEEL = 0x020E;

private IntPtr Hook(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
{
    switch (msg)
    {
        case WM_MOUSEHWHEEL:
            int tilt = (short) HIWORD(wParam);
            OnMouseTilt(tilt);
            return (IntPtr) 1;
    }
    return IntPtr.Zero;
}

/// <summary>
/// 取指针所在高位数值。
/// </summary>
private static int HIWORD(IntPtr ptr)
{
    var val32 = ptr.ToInt32();
    return ((val32 >> 16) & 0xFFFF);
}

/// <summary>
/// 取指针所在低位数值。
/// </summary>
private static int LOWORD(IntPtr ptr)
{
    var val32 = ptr.ToInt32();
    return (val32 & 0xFFFF);
}

private void OnMouseTilt(int tilt)
{
    // 这里就是触摸板横向滚动的时机，参数是横向滚动的数值，就像鼠标滚轮纵向滚动的数值一样。
}
```

`OnMouseTilt` 中就可以写我们触摸板横向滚动的处理代码。

以上代码都可以封装成通用的方法，在 `OnMouseTilt` 中抛出一个类似于 `MouseWheel` 一样的事件是非常好的选择。

微软的 Microsoft Sculpt Comfort Mouse 鼠标滚轮也是支持横向滚动的，以上方法也可以支持。

![](https://blogswin.blob.core.windows.net/win/sites/2/2013/05/2_5F00_77B60B43.jpg)


