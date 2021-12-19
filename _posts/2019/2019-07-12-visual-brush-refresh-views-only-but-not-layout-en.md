---
title: "The VisualBrush of WPF only refresh the visual but not the layout"
date: 2019-07-12 20:53:11 +0800
tags: wpf dotnet csharp
position: problem
version:
  current: English
versions:
  - 中文: /post/visual-brush-refresh-views-only-but-not-layout.html
  - English: #
coverImage: /static/posts/2019-07-12-20-12-56.png
---

Now we'll talk about a behavior of WPF `VisualBrush`. Maybe it is a bug, but let's view some details and determine whether it is or not.

---

<div id="toc"></div>

## The reproduction code

Let's make a XAML layout to reproduce such an issue.

We have a large `Grid` which contains an inner `Grid` and an inner `Border`. The `Grid` contains a `Rectangle` which is as large as the `Grid` itself and a `TextBlock` which presents some contents. The `Border` only shows its background which a `VisualBrush` of the `Grid`.

![The layout that can reproduce this issue](/static/posts/2019-07-12-20-12-56.png)

This is the whole XAML file:

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

This is the code-behind. Notice that it changes the visibility of the `Rectangle` every 1 second.

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

## To verify the issue

We know that the `VisualBrush` shows and stretch the whole `Visual` so we can predicate only two results:

- If the `Rectangle` is visible with `Visibility` property `Visible`, the `Border` background which contains the `VisualBrush` will be exactly the same with the `Grid`.
- If the `Rectangle` is invisible with `Visibility` property `Collapsed`, the `Border` background which contains the `VisualBrush` will stretch the whole content to the `Border` without any area of the `Rectangle`.

But it is the real result?

The animation picture below shows the result when the `Rectangle` is visible as the startup:

![Visible at the beginning](/static/posts/2019-07-12-visual-layout-not-refresh-2.gif)

The animation picture below shows the result when the `Rectangle` is invisible as the startup:

![Invisible at the beginning](/static/posts/2019-07-12-visual-layout-not-refresh.gif)

Did you notice that?

Only at the very beginning when the program runs it behaves the same as we predicted. But when we change the visibility of the `Rectangle` the layout never changes.

## The issue?

I've fired this issue into GitHub and this is the link:

- [The VisualBrush only refresh the visual but not the layout when the Visual visibility changes · Issue #1241 · dotnet/wpf](https://github.com/dotnet/wpf/issues/1241)

