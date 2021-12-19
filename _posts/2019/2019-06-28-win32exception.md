---
title: "System.ComponentModel.Win32Exception (0x80004005): 无效的窗口句柄。"
publishDate: 2019-06-28 07:50:24 +0800
date: 2019-10-22 14:13:45 +0800
tags: dotnet csharp wpf
position: problem
permalink: /post/win32exception.html
---

在 WPF 获取鼠标当前坐标的时候，可能会得到一个异常：`System.ComponentModel.Win32Exception:“无效的窗口句柄。”`。

本文解释此异常的原因和解决方法。

---

## 异常

获取鼠标当前相对于元素 `element` 的坐标的代码：

```csharp
var point = Mouse.GetPosition(element);
```

或者，还有其他的代码：

```csharp
var point1 = e.PointFromScreen(new Point());
var point2 = e.PointToScreen(new Point());
```

如果在按下窗口关闭按钮的时候调用以上代码，则会引发异常：

```
System.ComponentModel.Win32Exception (0x80004005): 无效的窗口句柄。
   at Point MS.Internal.PointUtil.ClientToScreen(Point pointClient, PresentationSource presentationSource)
   at Point System.Windows.Input.MouseDevice.GetScreenPositionFromSystem()
```

## 原因

将窗口上的点转换到控件上的点的方法是这样的：

```csharp
/// <summary>
///     Convert a point from "client" coordinate space of a window into
///     the coordinate space of the screen.
/// </summary>
/// <SecurityNote>
///     SecurityCritical: This code causes eleveation to unmanaged code via call to GetWindowLong
///     SecurityTreatAsSafe: This data is ok to give out
///     validate all code paths that lead to this.
/// </SecurityNote>
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

最关键的是 `UnsafeNativeMethods.ClientToScreen`，此方法要求窗口句柄依然有效，然而此时窗口已经关闭，句柄已经销毁。

## 解决


