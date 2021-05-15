---
title: "WPF / Windows Forms 检测窗口在哪个屏幕"
date: 2020-06-11 18:39:48 +0800
categories: wpf dotnet csharp
position: starter
---

使用 Windows Forms 自带的 System.Windows.Forms.Screen 类可以从一个窗口句柄获取到对应的屏幕。随后可以使用此 `Screen` 类获取各种屏幕信息。

---

<div id="toc"></div>

## System.Windows.Forms.Screen

通过句柄获取屏幕类：

```csharp
System.Windows.Forms.Screen.FromHandle(hWnd)
```

这里我做了一个 DEMO 程序，画出了窗口的位置和大小，以及当前窗口所在的屏幕的位置和大小。

![屏幕间移动的窗口](/static/posts/2020-06-11-move-between-screen.gif)

## 附代码

MainWindow.xaml

```xml
<Window x:Class="Walterlv.Issues.Dpi.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        xmlns:local="clr-namespace:Walterlv.Issues.Dpi"
        mc:Ignorable="d"
        Title="欢迎阅读吕毅的博客 blog.walterlv.com" Height="450" Width="800">
    <Grid x:Name="RootPanel">
        <Canvas SnapsToDevicePixels="True">
            <UIElement.RenderTransform>
                <ScaleTransform ScaleX="0.2" ScaleY="0.2" />
            </UIElement.RenderTransform>
            <Border x:Name="ScreenBorder" Background="#E4E4E6">
                <UIElement.RenderTransform>
                    <TranslateTransform x:Name="ScreenTranslateTransform" />
                </UIElement.RenderTransform>
                <TextBlock x:Name="ScreenTextBlock" FontSize="240" TextAlignment="Right" />
            </Border>
            <Border x:Name="WindowBorder" Background="#949499">
                <UIElement.RenderTransform>
                    <TranslateTransform x:Name="WindowTranslateTransform" />
                </UIElement.RenderTransform>
                <TextBlock x:Name="WindowTextBlock" FontSize="240" Margin="0 0 -1000 -1000" />
            </Border>
        </Canvas>
    </Grid>
</Window>
```

MainWindow.xaml.cs

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;

namespace Walterlv.Issues.Dpi
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            LocationChanged += MainWindow_LocationChanged;
            SizeChanged += MainWindow_SizeChanged;
        }

        private void MainWindow_LocationChanged(object sender, EventArgs e)
        {
            UpdateScreenInfo(this);
        }

        private void MainWindow_SizeChanged(object sender, SizeChangedEventArgs e)
        {
            UpdateScreenInfo(this);
        }

        private void UpdateScreenInfo(Window window)
        {
            var hwndSource = (HwndSource)PresentationSource.FromVisual(window);
            if (hwndSource is null)
            {
                return;
            }
            var hWnd = hwndSource.Handle;
            var screen = System.Windows.Forms.Screen.FromHandle(hWnd).Bounds;

            if (User32.GetWindowRect(hWnd, out var rect))
            {
                ScreenTranslateTransform.X = screen.X;
                ScreenTranslateTransform.Y = screen.Y;
                ScreenBorder.Width = screen.Width;
                ScreenBorder.Height = screen.Height;
                ScreenTextBlock.Text = $@"{rect.left},{rect.top}
{screen.Width}×{screen.Height}";
                WindowTranslateTransform.X = rect.left;
                WindowTranslateTransform.Y = rect.top;
                WindowBorder.Width = rect.right - rect.left;
                WindowBorder.Height = rect.bottom - rect.top;
                WindowTextBlock.Text = $@"{rect.left},{rect.top}
{rect.right - rect.left}×{rect.bottom - rect.top}";
            }
        }
    }
}
```
