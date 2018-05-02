---
title: "UWP 流畅设计中的光照效果（容易的 RevealBorderBrush 和不那么容易的 RevealBackgroundBrush）"
date: 2018-04-15 09:37:14 +0800
categories: uwp xaml
---

在 Windows 10.0.16299 中，RevealBrush 被引入，可以实现炫酷的鼠标滑过高亮效果和点击光照。本文将告诉大家如何完整地实现这样的效果。

---

### Reveal 的效果（自带）

在微软官方推荐的 [XAML Controls Gallery](https://github.com/Microsoft/Windows-universal-samples/tree/master/Samples/XamlUIBasics) 应用中，我们可以找到 Reveal 的实现章节。下图是应用中演示的 Reveal 效果：

![Reveal in XAML Controls Gallery](/static/posts/2018-04-15-reveal-effect-in-gallery.gif)

不过在其实现中，全都是使用的系统自带的样式，例如：

```xml
<Button Style="{StaticResource ButtonRevealStyle}" Content="Button" />
<Grid HorizontalAlignment="Center" Margin="5" Background="{ThemeResource CustomAcrylicInAppBrush_dark}" RequestedTheme="Dark">
    <StackPanel Orientation="Vertical">
        <StackPanel Orientation="Horizontal">
            <AppBarButton Style="{ThemeResource AppBarButtonRevealStyle}" Icon="World" Margin="1, 2, 0, 0"/>
            <AppBarButton Style="{ThemeResource AppBarButtonRevealStyle}" Icon="CellPhone" Margin="0, 2, 1, 0"/>
        </StackPanel>
        <StackPanel Orientation="Horizontal">
            <AppBarButton Style="{ThemeResource AppBarButtonRevealStyle}" Icon="Delete" Margin="1, 2, 0, 2"/>
            <AppBarButton Style="{ThemeResource AppBarButtonRevealStyle}" Icon="Comment" Margin="0, 2, 1, 2"/>
        </StackPanel>
    </StackPanel>
</Grid>
```

### Reveal 的制作（自己实现）

采用自带效果的控件看起来实现很容易，不过 UWP 控件的自带样式略坑，自己实现控件样式和模板是不可避免的事儿。

这是定制的 `ListViewItem` 的模板的一部分，写了 `RevealBorderBrush` 和 `RevealBackgroundBrush`。

```xml
<Grid x:Name="Root" Width="120" Height="40" BorderThickness="0 1 1 0">
    <Grid.BorderBrush>
        <RevealBorderBrush />
    </Grid.BorderBrush>
    <Grid.Background>
        <RevealBackgroundBrush />
    </Grid.Background>
    <ContentPresenter />
</Grid>
```

运行看，发现只有边框效果，背景效果是不存在的。

![只有边框光照效果](/static/posts/2018-04-15-reveal-border-worked.gif)

然而官方文档对于 `RevealBackgroundBrush` 的实现竟然没有提及，也是挺奇怪的。比如：[Reveal highlight - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/design/style/reveal) 和 [RevealBackgroundBrush Class (Windows.UI.Xaml.Media) - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/uwp/api/windows.ui.xaml.media.revealbackgroundbrush) 。

注意到 `RevealBackgroundBrush` 有一个附加属性 `RevealBrush.State`，设置到控件上用于指定采用哪一种光照效果：`RevealBrush.State="Pressed"`。直接将其设置到控件上，发现依然是没有效果的：

![依然没有效果](/static/posts/2018-04-15-reveal-border-worked.gif)

看来需要动态地改变，于是必须加上 `VisualStateManager`。

```xml
<Grid x:Name="Root" Width="120" Height="40" BorderThickness="0 1 1 0">
    <Grid.BorderBrush>
        <RevealBorderBrush />
    </Grid.BorderBrush>
    <Grid.Background>
        <RevealBackgroundBrush />
    </Grid.Background>
    <ContentPresenter />
    <VisualStateManager.VisualStateGroups>
        <VisualStateGroup x:Name="CommonStates">
            <VisualState x:Name="Normal" />
            <VisualState x:Name="Selected" />
            <VisualState x:Name="PointerOver">
                <VisualState.Setters>
                    <Setter Target="Root.(RevealBrush.State)" Value="PointerOver"/>
                </VisualState.Setters>
            </VisualState>
            <VisualState x:Name="PointerOverSelected">
                <VisualState.Setters>
                    <Setter Target="Root.(RevealBrush.State)" Value="PointerOver"/>
                </VisualState.Setters>
            </VisualState>
            <VisualState x:Name="PointerOverPressed">
                <VisualState.Setters>
                    <Setter Target="Root.(RevealBrush.State)" Value="Pressed"/>
                </VisualState.Setters>
            </VisualState>
            <VisualState x:Name="Pressed">
                <VisualState.Setters>
                    <Setter Target="Root.(RevealBrush.State)" Value="Pressed"/>
                </VisualState.Setters>
            </VisualState>
            <VisualState x:Name="PressedSelected">
                <VisualState.Setters>
                    <Setter Target="Root.(RevealBrush.State)" Value="Pressed"/>
                </VisualState.Setters>
            </VisualState>
        </VisualStateGroup>
        <VisualStateGroup x:Name="DisabledStates">
            <VisualState x:Name="Enabled"/>
            <VisualState x:Name="Disabled">
                <VisualState.Setters>
                    <Setter Target="Root.RevealBorderThickness" Value="0"/>
                </VisualState.Setters>
            </VisualState>
        </VisualStateGroup>
    </VisualStateManager.VisualStateGroups>
</Grid>
```

在以上这段新的代码中，我们适时在指针设备滑过的时候切换 `RevealBrush.State` 为 `PointerOver`，在按下时切换 `RevealBrush.State` 为 `Pressed`。再次运行才发现背景光照效果正常出现了。

![Reveal 背景光照效果出现](/static/posts/2018-04-15-all-reveal-worked.gif)

### 本文相关

- 本文所设计的源码来自我的一个个人兴趣项目，已在 GitHub 上开源：[walterlv/AssembleMailing](https://github.com/walterlv/AssembleMailing)。
- 我写过另一篇让 WPF 实现光照效果的博客：[流畅设计 Fluent Design System 中的光照效果 RevealBrush，WPF 也能模拟实现啦！](/post/fluent-design-reveal-brush-in-wpf.html)
