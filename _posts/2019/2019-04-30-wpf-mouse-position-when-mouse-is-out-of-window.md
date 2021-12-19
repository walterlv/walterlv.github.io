---
title: "WPF 程序鼠标在窗口之外的时候，控件拿到的鼠标位置在哪里？"
date: 2019-04-30 14:53:52 +0800
tags: wpf dotnet csharp
position: knowledge
---

在 WPF 程序中，我们有 `Mouse.GetPosition(IInputElement relativeTo)` 方法可以拿到鼠标当前相对于某个 WPF 控件的位置，也可以通过在 `MouseMove` 事件中通过 `e.GetPosition(IInputElement relativeTo)` 方法拿到同样的信息。不过，在任意时刻去获取鼠标位置的时候，如果鼠标在窗口之外，将获取到什么点呢？

本文将介绍鼠标在窗口之外时获取到的鼠标位置。

---

<div id="toc"></div>

## 可用于演示的 DEMO 

直接使用 Visual Studio 2019 创建一个空的 WPF 应用程序。默认 .NET Core 版本的 WPF 会带一个文本框和一个按钮。我们现在就用这两个按钮来显示 `Mouse.GetPosition` 获取到的值。

```csharp
using System;
using System.Windows;
using System.Windows.Input;
using System.Windows.Media;

namespace Walterlv.Demo
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            CompositionTarget.Rendering += OnRendering; 
        }

        private void OnRendering(object sender, EventArgs e)
        {
            DebugTextBlock.Text = Mouse.GetPosition(DebugTextBlock).ToString();
            DebugButton.Content = Mouse.GetPosition(DebugButton).ToString();
        }
    }
}
```

## 观察现象

我们运行这个最简单的 Demo，然后不断移动鼠标，可以观察到一旦鼠标脱离窗口客户区，获取到的坐标点将完全固定。

![鼠标在各处时获取到的点坐标](/static/posts/2019-04-30-mouse-get-position.gif)

如果不知道客户区是什么，可以阅读下面我的另一篇博客：

- [WPF 使用 WindowChrome，在自定义窗口标题栏的同时最大程度保留原生窗口样式（类似 UWP/Chrome）](/post/wpf-simulate-native-window-style-using-window-chrome)

在以上图中，我拖动改变了窗口的位置，这时将鼠标移动至离开客户区后，获取到的坐标点又被固定为另一个数值。

## 推断结论

从上面的动图中以及我实际的测量发现，当鼠标移出窗口的客户区之后，获取鼠标的坐标的时候始终拿到的是屏幕的 `(0, 0)` 点。如果有多个屏幕，是所有屏幕组合起来的虚拟屏幕的 `(0, 0)` 点。

验证这一点，我们把窗口移动到屏幕的左上角后，将鼠标移出客户区，左上角的控件其获取到的鼠标位置已经变成了 `(0, 31)`，而这个是窗口标题栏非客户区的高度。

![将窗口移至屏幕的左上角](/static/posts/2019-04-30-14-41-36.png)

## 原理

`Mouse.GetPosition` 获取鼠标相对于控件的坐标点的方法在内部的最终实现是 user32.dll 中的 `ClientToScreen`。

```csharp
[DllImport("user32.dll")]
static extern bool ClientToScreen(IntPtr hWnd, ref Point lpPoint);
```

此方法需要使用到一个窗口句柄参数，此参数的含义：

> A handle to the window whose client area is used for the conversion.

用于转换坐标点的窗口句柄，坐标会被转换到窗口的客户区部分。

> If the function succeeds, the return value is nonzero.  
> If the function fails, the return value is zero.

如果此方法成功，将返回非零的坐标值；如果失败，将返回 0。

而鼠标在窗口客户区之外的时候，此方法将返回 0，并且经过后面的 `ToPoint()` 方法转换到控件的坐标下。于是这才得到了我们刚刚观察到的坐标值。

```csharp
[SecurityCritical, SecurityTreatAsSafe]
public static Point ClientToScreen(Point pointClient, PresentationSource presentationSource)
{
    // For now we only know how to use HwndSource.
    HwndSource inputSource = presentationSource as HwndSource;
    if(inputSource == null)
    {
        return pointClient;
    }
    HandleRef handleRef = new HandleRef(inputSource, inputSource.CriticalHandle);

    NativeMethods.POINT ptClient            = FromPoint(pointClient);
    NativeMethods.POINT ptClientRTLAdjusted = AdjustForRightToLeft(ptClient, handleRef);

    UnsafeNativeMethods.ClientToScreen(handleRef, ptClientRTLAdjusted);

    return ToPoint(ptClientRTLAdjusted);
}
```

---

**参考资料**

- [How do I get the current mouse screen coordinates in WPF? - Stack Overflow](https://stackoverflow.com/a/4232281/6233938)
- [pinvoke.net: clienttoscreen (user32)](https://www.pinvoke.net/default.aspx/user32.clienttoscreen)
- [c# - ClientToScreen unexpected return values? - Stack Overflow](https://stackoverflow.com/q/34534279/6233938)
- [ClientToScreen function (winuser.h) - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/api/winuser/nf-winuser-clienttoscreen)
