---
title: "Support Horizontal Scrolling of TouchPad in WPF Application"
publishDate: 2017-11-23 22:09:42 +0800
date: 2018-08-12 16:02:37 +0800
tags: windows wpf
version:
  current: English
versions:
  - 中文: /post/handle-horizontal-scrolling-of-touchpad.html
  - English: #
coverImage: /static/posts/2017-11-23-21-52-22.png
---

Finally, Microsoft started to support touchpad like Apple did years ago. As Microsoft never do well in touchpad, WPF application even doesn't support horizontal scrolling of touchpad. Also, WPF uses `MouseWheel` to handle vertical scrolling, not a particular method.

This article contains my method to support horizontal scrolling of touchpad in a WPF application. It uses `MouseWheel` indeed, but horizontals and verticals are all supported.

---

{% include post-version-selector.html %}

![](/static/posts/2017-11-23-21-52-22.png)  
▲ Precision Touchpad

We need to fetch `WM_MOUSEHWHEEL` message from our WPF window. Yes! That mouse wheel message. We fetch vertical data from it before, but we now fetch horizontal data from it.

At first, we should hook the window message.

- override `OnSourceInitialized` method of a `Window`.
- If you could not write code in `Window`, `SourceInitialized` event of a `Window` is also a choice. (You can get the `Window` instance by using `Window.GetWindow(DependencyObject)` method.)
- If you cannot get the opportune moment, you can also write code after `SourceInitialized` event such as `Loaded` event or others.

```csharp
protected override void OnSourceInitialized(EventArgs e)
{
    var source = PresentationSource.FromVisual(_board);
    ((HwndSource) source)?.AddHook(Hook);
}

private IntPtr Hook(IntPtr hwnd, int msg, IntPtr wParam, IntPtr lParam, ref bool handled)
{
    // Handle window message here.
    return IntPtr.Zero;
}
```

Next, let's handle `WM_MOUSEHWHEEL`:

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
/// Gets high bits values of the pointer.
/// </summary>
private static int HIWORD(IntPtr ptr)
{
    var val32 = ptr.ToInt32();
    return ((val32 >> 16) & 0xFFFF);
}

/// <summary>
/// Gets low bits values of the pointer.
/// </summary>
private static int LOWORD(IntPtr ptr)
{
    var val32 = ptr.ToInt32();
    return (val32 & 0xFFFF);
}

private void OnMouseTilt(int tilt)
{
    // Write your horizontal handling codes here.
}
```

You can write horizontal scrolling code in `OnMouseTilt` method.

Better yet, you could pack all the codes above in a more common class and raise a `MouseTilt` event just like raising `MouseWheel` event.

By the way, Microsoft Sculpt Comfort Mouse support horizontal scrolling also, and my codes above here support this kind of mouse.

![](https://blogswin.blob.core.windows.net/win/sites/2/2013/05/2_5F00_77B60B43.jpg)

### References

- [c# - WPF - Two Finger Horizontal scrolling on Macbook pro trackpad - Stack Overflow](https://stackoverflow.com/questions/21146183/wpf-two-finger-horizontal-scrolling-on-macbook-pro-trackpad/47457389#47457389)  
That's my answer!

