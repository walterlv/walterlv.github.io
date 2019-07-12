---
title: "WPF 的 VisualBrush 只刷新显示的视觉效果，不刷新布局范围"
date: 2019-07-12 20:31:34 +0800
categories: wpf dotnet csharp
position: problem
version:
  current: 中文
versions:
  - 中文: #
  - English: /post/visual-brush-refresh-views-only-but-not-layout-en.html
---

WPF 的 `VisualBrush` 可以帮助我们在一个控件中显示另一个控件的外观。这是非常妙的功能。

但是本文需要说其中的一个 Bug —— 如果使用 VisualBrush 显示另一个控件的外观，那么只会在其显示效果有改变的时候刷新，而不会在目标布局改变的时候刷新布局。

---

<div id="toc"></div>

## 用于复现问题的代码

我们现在做一个可以用于验证此问题的布局。

在一个大的 `Grid` 容器中有一个 `Grid` 和一个 `Border`，这个 `Grid` 将放一个大面积的 `Rectangle` 和一个表示内容的 `TextBlock`；而那个 `Border` 将完全以 `VisualBrush` 的形式呈现，呈现的内容是此 `Grid` 中的全部内容。

![可以用于验证此问题的布局](/static/posts/2019-07-12-20-12-32.png)

它的完整 XAML 代码如下：

```xml
<Window x:Class="Walterlv.Demo.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        Title="Walterlv 的 WindowChrome 示例窗口" Height="450" Width="800"
        WindowStartupLocation="CenterScreen">
    <Grid>
        <Grid x:Name="VisualSource">
            <Rectangle x:Name="VisibleOr" Fill="LightCoral" Visibility="Visible" />
            <TextBlock FontSize="24" TextAlignment="Center" VerticalAlignment="Center">
                <Run Text="I'm walterlv, " />
                <LineBreak />
                <Run Text="I'm reproducing this Visual bug." />
            </TextBlock>
        </Grid>
        <Border>
            <Border.Background>
                <VisualBrush Visual="{Binding Source={x:Reference VisualSource}}" />
            </Border.Background>
        </Border>
    </Grid>
</Window>
```

其后台 C# 代码如下，包含每隔 1 秒钟切换 `Rectangle` 可见性的代码。

```csharp
using System.Threading.Tasks;
using System.Windows;

namespace Walterlv.Demo
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            Loaded += OnLoaded;
        }

        private async void OnLoaded(object sender, RoutedEventArgs e)
        {
            while (true)
            {
                await Task.Delay(1000);
                VisibleOr.Visibility = Visibility.Collapsed;
                await Task.Delay(1000);
                VisibleOr.Visibility = Visibility.Visible;
            }
        }
    }
}
```

## 验证问题

我们知道，`VisualBrush` 在默认情况下会将 `Visual` 中的全部内容拉伸到控件中显示，于是可以预估出两个可能的结果：

- 如果 `Rectangle` 可见（`Visibility` 为 `Visible`），那么 `Border` 中以 `VisualBrush` 显示的内容将完全和下面重叠（因为大小相同，拉伸后正好重叠）。
- 如果 `Rectangle` 不可见（`Visibility` 为 `Collapsed`），那么 `Border` 中以 `VisualBrush` 显示的内容将仅有文字且拉伸到整个 `Border` 范围。

然而实际运行真的是这样子吗？

下面的动图是 `Rectangle` 初始状态可见时，窗口运行后的结果：

![初始状态可见](/static/posts/2019-07-12-visual-layout-not-refresh-2.gif)

下面的动图是 `Rectangle` 初始状态不可见时，窗口运行后的结果：

![初始状态不可见](/static/posts/2019-07-12-visual-layout-not-refresh.gif)

注意到了吗？

只有初始状态才能正确反应我们之前预估出的结果，而无论后面怎么再改变可见性，布局都不会再刷新了。只是——后面 `VisualBrush` 的内容始终重叠。这意味着 `VisualBrush` 中目标 `Visual` 的范围增大之后不会再缩小了。

## 问题？

这是问题吗？

于是在以下 issue 中跟进此问题：

- 

## VisualBrush 的其他 Bug

参见：

- [wpf VisualBrush 已知问题 - 林德熙](https://blog.lindexi.com/post/wpf-VisualBrush-%E5%B7%B2%E7%9F%A5%E9%97%AE%E9%A2%98.html)
