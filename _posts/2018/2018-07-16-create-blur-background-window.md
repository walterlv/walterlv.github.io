---
title: "Windows 10 应用创建模糊背景窗口的三种方法"
publishDate: 2018-07-16 19:44:07 +0800
date: 2018-08-12 16:05:47 +0800
categories: windows wpf uwp dotnet
version:
  current: 中文
versions:
  - 中文: #
  - English: /post/create-blur-background-window-en.html
---

现代的操作系统中创建一张图片的高斯模糊效果非常容易，不过如果要在窗口中获得模糊支持就需要操作系统的原生支持了。iOS/Mac 和 Windows 系统都对此有支持。

本文将介绍三种创建模糊背景窗口的方法。有人可能喜欢称之为毛玻璃窗口、亚克力窗口。

---

This post is written in **multiple languages**. Please select yours:

{% include post-version-selector.html %}

最早我是在 StackOverflow 上回答一位网友的提问时写了一份非常长的答案，后来小伙伴建议我将答案改写成博客，于是我就改了。StackOverflow 上的答案在这里：[colors - WPF: How to Style my form with Transparency levels - Stack Overflow](https://stackoverflow.com/questions/51257442/wpf-how-to-style-my-form-with-transperancy-levels/51257595#51257595)。

<div id="toc"></div>

### 三种创建模糊背景窗口的方法

Windows 10 上创建带模糊背景的窗口有三种不同的方法，不过每一种都是既有好处又有坏处的：

1. 调用 Win32 API —— `SetWindowCompositionAttribute`，使用这种方式能够获得一个背景轻微透明的窗口。当然，如果需要模拟亚克力效果或者是 iOS/Mac 上的模糊效果就 gg 了。  
![The image from my post](/static/posts/2017-10-01-23-49-15.png)

1. 为窗口中的背景图片添加 WPF 自带的模糊效果 `BlurEffect`。这种方式你想获得多大的模糊半径就能获得多大的模糊半径，不过带来的就是更高的性能损耗。同时，还得考虑在移动窗口的时候动态地去更新背景图片并再次模糊。  
![BlurEffect of WPF](/static/posts/2018-07-16-19-08-19.png)

1. 使用 Fluent Design System 中的亚克力效果 —— `AcrylicBrush`。这绝对是 Windows 10 上获得背景模糊效果中视觉效果最好，同时又最省性能的方法了。不过，这种方法只能在 UWP 应用中使用。  
![The UWP AcrylicBrush from docs.microsoft.com](/static/posts/2018-07-16-19-09-22.png)

---

### SetWindowCompositionAttribute API

`SetWindowCompositionAttribute` 并没有那么好调用，所以我为此写了一个辅助类类封装对背景模糊效果的调用。使用这个辅助类，你只需要使用一行代码就能开启背景模糊效果。

可以在 XAML 代码中使用 `interop:WindowBlur.IsEnabled="True"`：

```xml
<Window x:Class="Walterlv.Demo.MainWindow"
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    xmlns:interop="clr-namespace:Walterlv.Demo.Interop"
    mc:Ignorable="d" Title="MainWindow" Height="350" Width="525"
    interop:WindowBlur.IsEnabled="True"
    Background="Transparent">
</Window>
```

可以在 cs 代码中使用 `WindowBlur.SetIsEnabled(this, true)`：

```csharp
public class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        WindowBlur.SetIsEnabled(this, true);
    }
}
```

我为 `WindowBlur` 类准备了一个 GitHub Gist，在这里：<https://gist.github.com/walterlv/752669f389978440d344941a5fcd5b00>。你只需要将代码全部复制到你的项目中即可开始使用。

当然，我还写了一篇博客专门讲使用 `SetWindowCompositionAttribute` API 实现背景模糊效果：[在 Windows 10 上为 WPF 窗口添加模糊特效（就像开始菜单和操作中心那样）](/post/win10/2017/10/02/wpf-transparent-blur-in-windows-10.html)。

### WPF BlurEffect

WPF 的 `UIElement` 都有 `Effect` 属性，将其设置为 `BlurEffect` 即可获得控件的高斯模糊效果。

```xml
<Window x:Class="MejirdrituTeWarqoudear.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        AllowsTransparency="True" WindowStyle="None"
        Width="540" Height="360">
    <Grid>
        <Image Source="YourImageFile.jpg" Stretch="Fill" Margin="-60">
            <Image.Effect>
                <BlurEffect KernelType="Gaussian" Radius="60" />
            </Image.Effect>
        </Image>
        <Border CornerRadius="60" Margin="30" Background="#7F000000">
            <TextBlock Foreground="White"
                       FontSize="20" FontWeight="Light" TextAlignment="Center"
                       HorizontalAlignment="Center" VerticalAlignment="Center">
                <Run Text="Hello World" FontSize="48"/>
                <LineBreak/>
                <Run Text="walterlv.github.io"/>
            </TextBlock>
        </Border>
    </Grid>
</Window>
```

特别注意：**此方法有严重地性能问题**。

如果你的窗口是一个异形窗口，例如是具有圆角的矩形，那么你需要额外为控件设置 `RectangleGeometry` 来裁剪控件。

![Rounded Rectangle](/static/posts/2018-07-16-19-09-43.png)

```xml
<Window x:Class="MejirdrituTeWarqoudear.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Width="540" Height="360">
    <Grid>
        <Grid.Clip>
            <RectangleGeometry RadiusX="60" RadiusY="60" Rect="30 30 480 300" />
        </Grid.Clip>
        <Image Source="High+Sierra.jpg" Stretch="Fill" Margin="-60">
            <Image.Effect>
                <BlurEffect KernelType="Gaussian" Radius="60" />
            </Image.Effect>
        </Image>
        <Border Background="#7F000000">
            <TextBlock Foreground="White"
                        FontSize="20" FontWeight="Light" TextAlignment="Center"
                        HorizontalAlignment="Center" VerticalAlignment="Center">
                <Run Text="Hello World" FontSize="48"/>
                <LineBreak/>
                <Run Text="walterlv.github.io"/>
            </TextBlock>
        </Border>
    </Grid>
</Window>
```

如果是圆形窗口，我另外写了一篇文章来说明进行圆形裁剪：[WPF 中使用附加属性，将任意 UI 元素或控件裁剪成圆形（椭圆）](/post/clip-wpf-uielement-to-ellipse.html)。

### UWP AcyclicBrush

微软的官方文档 [Acrylic material - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/design/style/acrylic) 讲解了如何使用亚克力效果。
