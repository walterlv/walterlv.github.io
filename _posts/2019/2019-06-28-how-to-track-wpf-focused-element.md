---
title: "如何追踪 WPF 程序中当前获得键盘焦点的元素并显示出来"
publishDate: 2019-06-28 09:49:29 +0800
date: 2019-06-29 09:07:54 +0800
categories: wpf dotnet csharp
position: knowledge
---

我们有很多的调试工具可以帮助我们查看 WPF 窗口中当前获得键盘焦点的元素。本文介绍监控当前键盘焦点元素的方法，并且提供一个不需要任何调试工具的自己绘制键盘焦点元素的方法。

---

<div id="toc"></div>

## 使用调试工具查看当前获得键盘焦点的元素

Visual Studio 带有实时可视化树的功能，使用此功能调试 WPF 程序的 UI 非常方便。

![打开实时可视化树](/static/posts/2019-06-28-08-58-54.png)

在打开实时可视化树后，我们可以略微认识一下这里的几个常用按钮：

![实时可视化树中的常用按钮](/static/posts/2019-06-28-09-03-11.png)

这里，我们需要打开两个按钮：

- 为当前选中的元素显示外框
- 追踪具有焦点的元素

这样，只要你的应用程序当前获得焦点的元素发生了变化，就会有一个表示这个元素所在位置和边距的叠加层显示在窗口之上。

![实时可视化树中的焦点追踪](/static/posts/2019-06-28-live-visual-tree-track-focused-element.gif)

你可能已经注意到了，Visual Studio 附带的这一叠加层会导致鼠标无法穿透操作真正具有焦点的元素。这显然不能让这一功能一直打开使用，这是非常不方便的。

## 使用代码查看当前获得键盘焦点的元素

我们打算在代码中编写追踪焦点的逻辑。这可以规避 Visual Studio 中叠加层中的一些问题，同时还可以在任何环境下使用，而不用担心有没有装 Visual Studio。

获取当前获得键盘焦点的元素：

```csharp
var focusedElement = Keyboard.FocusedElement;
```

不过只是拿到这个值并没有多少意义，我们需要：

1. 能够实时刷新这个值；
1. 能够将这个控件在界面上显示出来。

### 实时刷新

`Keyboard` 有路由事件可以监听，得知元素已获得键盘焦点。

```csharp
Keyboard.AddGotKeyboardFocusHandler(xxx, OnGotFocus);
```

这里的 `xxx` 需要替换成监听键盘焦点的根元素。实际上，对于窗口来说，这个根元素可以唯一确定，就是窗口的根元素。于是我可以写一个辅助方法，用于找到这个窗口的根元素：

```csharp
// 用于存储当前已经获取过的窗口根元素。
private FrameworkElement _root;

// 获取当前窗口的根元素。
private FrameworkElement Root => _root ?? (_root = FindRootVisual(this));

// 一个辅助方法，用于根据某个元素为起点查找当前窗口的根元素。
private static FrameworkElement FindRootVisual(FrameworkElement source) =>
    (FrameworkElement)((HwndSource)PresentationSource.FromVisual(source)).RootVisual;
```

于是，监听键盘焦点的代码就可以变成：

```csharp
Keyboard.AddGotKeyboardFocusHandler(Root, OnGotFocus);

void OnGotFocus(object sender, KeyboardFocusChangedEventArgs e)
{
    if (e.NewFocus is FrameworkElement fe)
    {
        // 在这里可以输出或者显示这个获得了键盘焦点的元素。
    }
}
```

### 显示

为了显示一个跟踪焦点的控件，我写了一个 UserControl，里面的主要代码是：

```xml
<Canvas IsHitTestVisible="False">
    <Border x:Name="FocusBorder" BorderBrush="#80159f5c" BorderThickness="4"
            HorizontalAlignment="Left" VerticalAlignment="Top"
            IsHitTestVisible="False" SnapsToDevicePixels="True">
        <Border x:Name="OffsetBorder" Background="#80159f5c"
                Margin="-200 -4 -200 -4" Padding="12 0"
                HorizontalAlignment="Center" VerticalAlignment="Bottom"
                SnapsToDevicePixels="True">
            <Border.RenderTransform>
                <TranslateTransform x:Name="OffsetTransform" Y="16" />
            </Border.RenderTransform>
            <TextBlock x:Name="FocusDescriptionTextBlock" Foreground="White" HorizontalAlignment="Center" />
        </Border>
    </Border>
</Canvas>
```

```csharp
using System;
using System.Runtime.InteropServices;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Interop;
using System.Windows.Threading;

namespace Walterlv.Windows
{
    public partial class KeyboardFocusView : UserControl
    {
        public KeyboardFocusView()
        {
            InitializeComponent();
            Loaded += OnLoaded;
            Unloaded += OnUnloaded;
        }

        private void OnLoaded(object sender, RoutedEventArgs e)
        {
            if (Keyboard.FocusedElement is FrameworkElement fe)
            {
                SetFocusVisual(fe);
            }
            Keyboard.AddGotKeyboardFocusHandler(Root, OnGotFocus);
        }

        private void OnUnloaded(object sender, RoutedEventArgs e)
        {
            Keyboard.RemoveGotKeyboardFocusHandler(Root, OnGotFocus);
            _root = null;
        }

        private void OnGotFocus(object sender, KeyboardFocusChangedEventArgs e)
        {
            if (e.NewFocus is FrameworkElement fe)
            {
                SetFocusVisual(fe);
            }
        }

        private void SetFocusVisual(FrameworkElement fe)
        {
            var topLeft = fe.TranslatePoint(new Point(), Root);
            var bottomRight = fe.TranslatePoint(new Point(fe.ActualWidth, fe.ActualHeight), Root);
            var isOnTop = topLeft.Y < 16;
            var isOnBottom = bottomRight.Y > Root.ActualHeight - 16;

            var bounds = new Rect(topLeft, bottomRight);
            Canvas.SetLeft(FocusBorder, bounds.X);
            Canvas.SetTop(FocusBorder, bounds.Y);
            FocusBorder.Width = bounds.Width;
            FocusBorder.Height = bounds.Height;

            FocusDescriptionTextBlock.Text = string.IsNullOrWhiteSpace(fe.Name)
                ? $"{fe.GetType().Name}"
                : $"{fe.Name}({fe.GetType().Name})";
        }

        private FrameworkElement _root;

        private FrameworkElement Root => _root ?? (_root = FindRootVisual(this));

        private static FrameworkElement FindRootVisual(FrameworkElement source) =>
            (FrameworkElement)((HwndSource)PresentationSource.FromVisual(source)).RootVisual;
    }
}
```

这样，只要将这个控件放到窗口中，这个控件就会一直跟踪窗口中的当前获得了键盘焦点的元素。当然，为了最好的显示效果，你需要将这个控件放到最顶层。

![实时可视化树中的焦点追踪](/static/posts/2019-06-28-focused-element.gif)

## 绘制并实时显示 WPF 程序中当前键盘焦点的元素

如果我们需要监听应用程序中所有窗口中的当前获得键盘焦点的元素怎么办呢？我们需要给所有当前激活的窗口监听 `GotKeyboardFocus` 事件。

于是，你需要我在另一篇博客中写的方法来监视整个 WPF 应用程序中的所有窗口：

- [如何监视 WPF 中的所有窗口，在所有窗口中订阅事件或者附加 UI](/post/how-to-monitor-all-windows-of-wpf-application)

里面有一段对 `ApplicationWindowMonitor` 类的使用：

```csharp
var app = Application.Current;
var monitor = new ApplicationWindowMonitor(app);
monitor.ActiveWindowChanged += OnActiveWindowChanged;

void OnActiveWindowChanged(object sender, ActiveWindowEventArgs e)
{
    var newWindow = e.NewWindow;
    // 一旦有一个新的获得焦点的窗口出现，就可以在这里执行一些代码。
}
```

于是，我们只需要在 `OnActiveWindowChanged` 事件中，将我面前面写的控件 `KeyboardFocusView` 从原来的窗口中移除，然后放到新的窗口中即可监视新的窗口中的键盘焦点。

由于每一次的窗口激活状态的切换都会更新当前激活的窗口，所以，我们可以监听整个 WPF 应用程序中所有窗口中的键盘焦点。
