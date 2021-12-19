---
title: "修复 WPF 窗口在启动期间短暂的白底显示"
date: 2017-11-03 23:08:46 +0800
tags: wpf
permalink: /posts/fix-white-screen-when-wpf-window-launching.html
---

不管你做的 WPF 窗口做得多么简单，是否总感觉启动的那一瞬间窗口内是白白的一片？是否试过无数偏方黑科技，但始终无法解决？

本文将介绍一种简单的方法来彻底解决这个问题。

---

看看下面这张图，你便能知道本文要解决的问题是否跟你希望解决的是同一个问题：

![启动期间显示白色](/static/posts/2017-11-03-wpf-window-show-with-white.gif)

是否发现窗口启动期间，窗口中的内容是白色的呢？

然而我的 `Window` 超级简单：

```xml
<Window x:Class="Walterlv.Demo.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        xmlns:local="clr-namespace:Walterlv.Demo"
        mc:Ignorable="d" Title="星i">
    <Border Background="Teal">
        <TextBlock Text="walterlv's demo" Foreground="White" FontSize="24" FontWeight="Thin"
                   TextAlignment="Center" VerticalAlignment="Center"></TextBlock>
    </Border>
</Window>
```

---

这个问题在网上 Google 搜索结果上已发现有很多讨论：
- [WPF Window with black background flashes white when first shown](https://social.msdn.microsoft.com/Forums/vstudio/en-US/bdb414fe-9abb-408c-8935-486e1795755b/wpf-window-with-black-background-flashes-white-when-first-shown?forum=wpf)
- [White screen before loading main window contents](https://social.msdn.microsoft.com/Forums/vstudio/en-US/dd8477a6-a7bc-4171-9547-f86ed722d95d/white-screen-before-loading-main-window-contents?forum=wpf)
- [How can I avoid flicker in a WPF fullscreen app?](https://stackoverflow.com/a/35120487/6233938)

然而基本上观点都是相似的：
- 这是 WPF 的已知 BUG（this is a known issue in WPF）
- 可以先设置窗口 `WindowState="Minimized"`，然后等 `Loaded` 或 `ContentRendered` 之后再设回 `Normal`/`Maximized`。

经过多次尝试，甚至都改掉了 `Window` 的 `Template` 都无法解决这个问题。

```xml
<Window x:Class="Walterlv.Demo.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        xmlns:local="clr-namespace:Walterlv.Demo"
        mc:Ignorable="d" Title="星i">
    <Window.Template>
        <ControlTemplate TargetType="Window">
            <ContentPresenter/>
        </ControlTemplate>
    </Window.Template>
    <Border Background="Teal">
        <TextBlock Text="walterlv's demo" Foreground="White" FontSize="24" FontWeight="Thin"
                   TextAlignment="Center" VerticalAlignment="Center"></TextBlock>
    </Border>
</Window>
```

---

**但是！！！**发现使用 `WindowChrome` 定制窗口非客户区的时候，此问题就不再出现了！！！

也就是说，此问题在微软彻底解决之前，也是有规避方案的！——那就是 `WindowChrome`！

这是效果：

![启动期间没有显示白色](/static/posts/2017-11-03-wpf-window-show-without-white.gif)

做法就是给 `Window` 设置 `WindowChrome` 附加属性：

```xml
<WindowChrome.WindowChrome>
    <WindowChrome/>
</WindowChrome.WindowChrome>
```

无需额外设置任何值，即可修复此问题（不过此时在 Visual Studio 中调试可能发现启动动画丢失）。

但是，由于此时开始能够在非客户区（NonClientArea）显示控件了，所以可能需要自己调整一下视觉效果。

```xml
<WindowChrome.WindowChrome>
    <WindowChrome GlassFrameThickness="0 31 0 0" CornerRadius="0" UseAeroCaptionButtons="True"/>
</WindowChrome.WindowChrome>
```

