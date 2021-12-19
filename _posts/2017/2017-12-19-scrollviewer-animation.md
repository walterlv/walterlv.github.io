---
title: "让 ScrollViewer 的滚动带上动画"
date: 2017-12-19 20:19:41 +0800
tags: wpf
permalink: /posts/scrollviewer-animation.html
---

WPF 的 `ScrollViewer` 没有水平滚动和垂直滚动的属性 `HorizontalScrollOffset` `VerticalScrollOffset`，只有水平滚动和垂直滚动的方法 `ScrollToHorizontalOffset` `ScrollToVerticalOffset`，那么怎么给滚动过程加上动画呢？

---

既然没有属性，那我们加个属性好了，反正附加属性就是用来干这个事儿的。

```csharp
namespace Walterlv
{
    public static class ScrollViewerBehavior
    {
        public static readonly DependencyProperty HorizontalOffsetProperty = DependencyProperty.RegisterAttached("HorizontalOffset", typeof(double), typeof(ScrollViewerBehavior), new UIPropertyMetadata(0.0, OnHorizontalOffsetChanged));
        public static void SetHorizontalOffset(FrameworkElement target, double value) => target.SetValue(HorizontalOffsetProperty, value);
        public static double GetHorizontalOffset(FrameworkElement target) => (double)target.GetValue(HorizontalOffsetProperty);
        private static void OnHorizontalOffsetChanged(DependencyObject target, DependencyPropertyChangedEventArgs e) => (target as ScrollViewer)?.ScrollToHorizontalOffset((double)e.NewValue);

        public static readonly DependencyProperty VerticalOffsetProperty = DependencyProperty.RegisterAttached("VerticalOffset", typeof(double), typeof(ScrollViewerBehavior), new UIPropertyMetadata(0.0, OnVerticalOffsetChanged));
        public static void SetVerticalOffset(FrameworkElement target, double value) => target.SetValue(VerticalOffsetProperty, value);
        public static double GetVerticalOffset(FrameworkElement target) => (double)target.GetValue(VerticalOffsetProperty);
        private static void OnVerticalOffsetChanged(DependencyObject target, DependencyPropertyChangedEventArgs e) => (target as ScrollViewer)?.ScrollToVerticalOffset((double)e.NewValue);
    }
}
```

我们在属性的变更通知中调用了 `ScrollToHorizontalOffset` 和 `ScrollToVerticalOffset` 方法。这样，便能够通过动画改变属性的方式来调用这两个方法。

那么现在我们就加上动画：

```xml
<Storyboard x:Key="ScrollStoryboard">
    <DoubleAnimation Storyboard.TargetName="ScrollViewer" Storyboard.TargetProperty="(walterlv:ScrollViewerBehavior.HorizontalOffset)"
                        From="0" To="500" Duration="0:0:0.6">
        <DoubleAnimation.EasingFunction>
            <CircleEase EasingMode="EaseOut"/>
        </DoubleAnimation.EasingFunction>
    </DoubleAnimation>
</Storyboard>
```

添加一些用于测试的按钮和 `ScrollViewer`：

```xml
<ScrollViewer Grid.Row="0" Grid.RowSpan="2" Grid.Column="0" Grid.ColumnSpan="3" x:Name="ScrollViewer"
                HorizontalScrollBarVisibility="Visible" VerticalScrollBarVisibility="Visible">
    <Image Source="https://walterlv.github.io/static/posts/2017-12-09-21-19-50.png" Width="1000"/>
</ScrollViewer>
        <Button Grid.Row="1" Grid.Column="0" Grid.ColumnSpan="3" x:Name="ConnectionDestination"
        VerticalAlignment="Bottom" Height="50" Content="动画目标" Panel.ZIndex="1">
    <Button.Triggers>
        <EventTrigger RoutedEvent="Button.Click">
            <BeginStoryboard Storyboard="{StaticResource ScrollStoryboard}"/>
        </EventTrigger>
    </Button.Triggers>
</Button>
```

现在，我们点击按钮，就可以看到 `ScrollViewer` 的滚动动画生效了，如下：

![动画效果](/static/posts/2017-12-19-scroll-viewer-animation.gif)

---

额外的，如果希望这个附加属性能够附加到 `ListView` 或者 `ListBox` 中，则需要修改 `ScrollViewerBehavior` 类，然后在 `OnHorizontalOffsetChanged` 和 `OnVerticalOffsetChanged` 方法中判断 `ListView` 和 `ListBox`，然后在其中寻找可视元素子级 `ScrollViewer`。

