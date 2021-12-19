---
title: "准确判断一个 WPF 控件 / UI 元素当前是否显示在屏幕内"
date: 2020-06-11 17:40:47 +0800
tags: wpf csharp
position: starter
coverImage: /static/posts/2020-06-11-11-56-53.png
permalink: /post/detect-whether-a-wpf-visual-is-inside-screen.html
---

你的 WPF 窗口是可以拖到屏幕外面去的，所以拉几个元素到屏幕外很正常。你的屏幕可能有多个。你的多个屏幕可能有不同的 DPI。你检测的元素可能带有旋转。

各种各样奇怪的因素可能影响你检查此元素是否在屏幕内，本文包你一次性解决，绝对准确判断。

---

本文将说三种不同的判定方法，分偷懒版、日常版和苛刻版：

- 如果你只是写个 demo 啥的，用偷懒版就够了，代码少性能高。
- 如果你在项目/产品中使用，使用日常版就好。
- 如果你的用户群体天天喷你 bug 多，那么用苛刻版更好。

<div id="toc"></div>

## 偷懒版

如果你只想写个 demo，那么此代码足以。

判断 UI 元素的位置，其右侧是否在屏幕最左侧，其底部是否在屏幕最上面；或者其左侧是否在屏幕最右侧，其顶部是否在屏幕最下面。

![偷懒版](/static/posts/2020-06-11-11-56-53.png)

```csharp
private static bool IsOutsideOfScreen(FrameworkElement target)
{
    var topLeft = target.PointToScreen(new Point());
    var bottomRight = target.PointToScreen(new Point(target.ActualWidth, target.ActualHeight));
    return bottomRight.X < SystemParameters.VirtualScreenLeft
        || bottomRight.Y < SystemParameters.VirtualScreenTop
        || topLeft.X > SystemParameters.VirtualScreenLeft + SystemParameters.VirtualScreenWidth
        || topLeft.Y > SystemParameters.VirtualScreenTop + SystemParameters.VirtualScreenHeight;
}
```

## 日常版（推荐）

如果你检测的元素自带了旋转，那么以上方法就不能准确判断了。

现在，我们需要检查这个元素的整个边界区域，即便是旋转后。于是，现在，我们要判断元素边界点所在的矩形区域了。

![日常版](/static/posts/2020-06-11-12-00-25.png)

```csharp
/// <summary>
/// 判断一个可视化对象是否在屏幕外面无法被看见。
/// </summary>
/// <param name="target">要判断的可视化元素。</param>
/// <returns>如果元素在屏幕外面，则返回 true；如果元素在屏幕里或者部分在屏幕里面，则返回 false。</returns>
private static bool IsOutsideOfScreen(FrameworkElement target)
{
    try
    {
        var bounds = GetPixelBoundsToScreen(target);
        var screenBounds = GetScreenPixelBounds();
        var intersect = screenBounds;
        intersect.Intersect(bounds);
        return intersect.IsEmpty;
    }
    catch (InvalidOperationException)
    {
        // 此 Visual 未连接到 PresentationSource。
        return true;
    }

    Rect GetPixelBoundsToScreen(FrameworkElement visual)
    {
        var pixelBoundsToScreen = Rect.Empty;
        pixelBoundsToScreen.Union(visual.PointToScreen(new Point(0, 0)));
        pixelBoundsToScreen.Union(visual.PointToScreen(new Point(visual.ActualWidth, 0)));
        pixelBoundsToScreen.Union(visual.PointToScreen(new Point(0, visual.ActualHeight)));
        pixelBoundsToScreen.Union(visual.PointToScreen(new Point(visual.ActualWidth, visual.ActualHeight)));
        return pixelBoundsToScreen;
    }

    Rect GetScreenPixelBounds()
    {
        return new Rect(SystemParameters.VirtualScreenLeft, SystemParameters.VirtualScreenTop, SystemParameters.VirtualScreenWidth, SystemParameters.VirtualScreenHeight);
    }
}
```

## 苛刻版

现在，更复杂的场景来了。

如果用户有多台显示器，而且大小还不一样，那么依前面的判定方法，下图中 C 控件虽然人眼看在屏幕外，但计算所得是在屏幕内。

更复杂的，是多台显示器还不同 DPI 时，等效屏幕尺寸的计算更加复杂。更恐怖的是，WPF 程序声明支持的 DPI 级别不同，计算也会有一些差别。想要写一种支持所有支持级别的代码更加复杂。但本文可以。

![苛刻版](/static/posts/2020-06-11-14-45-08.png)

```csharp
/// <summary>
/// 判断一个可视化对象是否在屏幕外面无法被看见。
/// </summary>
/// <param name="target">要判断的可视化元素。</param>
/// <returns>如果元素在屏幕外面，则返回 true；如果元素在屏幕里或者部分在屏幕里面，则返回 false。</returns>
private bool IsOutsideOfScreen(FrameworkElement target)
{
    var hwndSource = (HwndSource)PresentationSource.FromVisual(target);
    if (hwndSource is null)
    {
        return true;
    }
    var hWnd = hwndSource.Handle;
    var targetBounds = GetPixelBoundsToScreen(target);

    var screens = System.Windows.Forms.Screen.AllScreens;
    return !screens.Any(x => x.Bounds.IntersectsWith(targetBounds));

    System.Drawing.Rectangle GetPixelBoundsToScreen(FrameworkElement visual)
    {
        var pixelBoundsToScreen = Rect.Empty;
        pixelBoundsToScreen.Union(visual.PointToScreen(new Point(0, 0)));
        pixelBoundsToScreen.Union(visual.PointToScreen(new Point(visual.ActualWidth, 0)));
        pixelBoundsToScreen.Union(visual.PointToScreen(new Point(0, visual.ActualHeight)));
        pixelBoundsToScreen.Union(visual.PointToScreen(new Point(visual.ActualWidth, visual.ActualHeight)));
        return new System.Drawing.Rectangle(
            (int)pixelBoundsToScreen.X, (int)pixelBoundsToScreen.Y,
            (int)pixelBoundsToScreen.Width, (int)pixelBoundsToScreen.Height);
    }
}
```

在下面这段代码中，即便是 WPF 项目，我们也需要引用 Windows Forms，用于获取屏幕相关的信息。

如果是 SDK 风格的项目，则在 csproj 中添加如下代码：

```diff
    <Project Sdk="Microsoft.NET.Sdk.WindowsDesktop">

    <PropertyGroup>
        <OutputType>WinExe</OutputType>
        <TargetFramework>net5.0</TargetFramework>
        <UseWPF>true</UseWPF>
++      <UseWindowsForms>true</UseWindowsForms>
    </PropertyGroup>

    </Project>
```

如果是传统风格的项目，则直接添加 System.Windows.Forms 程序集的引用就好。

因为 WPF 的坐标单位是“设备无关单位”（我更倾向于叫有效像素，见 [有效像素（Effective Pixels）](https://blog.walterlv.com/post/introduce-uwp-effective-pixels-into-wpf.html)），所以在系统对窗口有缩放行为的时候，多屏不同 DPI 的计算相当复杂，所以这里我们使用纯 Win32 / Windows Forms 方法在来计算屏幕与 UI 元素之间的交叉情况，并且避免在任何时候同时将多个屏幕的坐标进行加减乘除（避免单位不一致的问题）。所以这段代码对任何 WPF 的 DPI 配置都是有效且准确的。

关于 DPI 感知设置的问题，可阅读我的其他博客：

- [Windows 下的高 DPI 应用开发（UWP / WPF / Windows Forms / Win32） - walterlv](https://blog.walterlv.com/post/windows-high-dpi-development.html)
- [支持 Windows 10 最新 PerMonitorV2 特性的 WPF 多屏高 DPI 应用开发 - walterlv](https://blog.walterlv.com/post/windows-high-dpi-development-for-wpf.html)
- [Windows 系统上使用任务管理器查看进程的各项属性（命令行、DPI、管理员权限等） - walterlv](https://blog.walterlv.com/post/view-process-info-using-task-manager.html)

此代码的唯一的缺点是，在 WPF 项目里面要求引用 Windows Forms。

## 功能比较

不知道用哪个？看下表吧！

| 代码版本                              | 偷懒版 | 日常版 | 苛刻版 |
| ------------------------------------- | ------ | ------ | ------ |
| 基础判断屏幕内外                      | ✔️      | ✔️      | ✔️      |
| 高分屏（非 96 DPI）                   | ✔️      | ✔️      | ✔️      |
| 整齐排列的多屏                        | ✔️      | ✔️      | ✔️      |
| 元素带有旋转                          | ❌      | ✔️      | ✔️      |
| 多屏尺寸不统一                        | ❌      | ❌      | ✔️      |
| 多屏有不同 DPI（WPF 感知系统 DPI）    | ❌      | ❌      | ✔️      |
| 多屏有不同 DPI（WPF 感知屏幕 DPI）    | ❌      | ❌      | ✔️      |
| 多屏有不同 DPI（WPF 感知屏幕 DPI V2） | ❌      | ❌      | ✔️      |
| 纯 WPF 代码（无需引用 Windows Forms） | ✔️      | ✔️      | ❌      |
| 元素形状不规则                        | ❌      | ❌      | ❌      |
| 性能                                  | 好     | 较好   | 一般   |


