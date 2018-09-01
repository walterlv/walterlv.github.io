---
title: "3 Ways to create a window with blurring background on Windows 10"
publishDate: 2018-07-16 19:14:59 +0800
date: 2018-09-01 08:00:03 +0800
categories: windows wpf uwp dotnet
version:
  current: English
versions:
  - 中文: /post/create-blur-background-window.html
  - English: #
---

This post is an answer from [Stack Overflow](https://stackoverflow.com/a/51257595/6233938) and introduce some methods to create a window with blurring background.

---

This post is written in **multiple languages**. Please select yours:

{% include post-version-selector.html %}

<div id="toc"></div>

### Options to blurring background

We have three ways to blurring background on Windows 10 and each has its advantages and disadvantages.

1. Call the Windows internal API `SetWindowCompositionAttribute`. You can get a lightly blurred transparent Window but this transparency is much less than the iOS one.  
![The image from my post](/static/posts/2017-10-01-23-49-15.png)

1. Add a `BlurEffect` to the window background image. You can get a more similar visual effect like the iOS one with very poor performance. But in this way, the background image is fixed and cannot be updated when the window moves.  
![BlurEffect of WPF](/static/posts/2018-07-16-19-08-19.png)

1. Use UWP instead of WPF and use the `AcrylicBrush`. You can get a high-performance blur transparent window. But you should try the UWP Application development.  
![The UWP AcrylicBrush from docs.microsoft.com](/static/posts/2018-07-16-19-09-22.png)

---

### SetWindowCompositionAttribute API

Calling `SetWindowCompositionAttribute` API is not very easy, so I've written a wrapper class for easier usage. You can use my class by writing only a simple line in the XAML file **or** in the cs file.

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

Or you can use it in the cs file like this:

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

Just add my wrapper class into your project. It's a very long class so I pasted into GitHub: <https://gist.github.com/walterlv/752669f389978440d344941a5fcd5b00>.

I also write a post for its usage, but it's not in English: <https://walterlv.github.io/post/win10/2017/10/02/wpf-transparent-blur-in-windows-10.html>

### WPF BlurEffect

Just set the Effect property of a WPF UIElement.

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

Notice that it has a very poor performance.

You can also add a `RectangleGeometry` to clip your UIElement into a rounded rectangle.

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

### UWP AcyclicBrush

You can read Microsoft's documents [Acrylic material - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/design/style/acrylic) for more details about how to write an `AcylicBrush`.
