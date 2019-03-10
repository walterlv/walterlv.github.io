---
title: "用动画的方式画出任意的路径（直线、曲线、折现）"
publishDate: 2017-11-20 08:49:55 +0800
date: 2017-11-20 09:07:07 +0800
categories: xaml wpf uwp
---

WPF/UWP 中提供的 `Path` 类可以为我们绘制几乎所有可能的矢量图形。但是，如果这些矢量图形可以以动画的形式播放出来，那将可以得到非常炫酷的演示效果。

---

我用 Blend 画了我的名字：

![walterlv](/static/posts/2017-11-20-00-34-29.png)

```xml
<Canvas x:Name="DisplayCanvas" Grid.Row="1" Grid.Column="0" Grid.ColumnSpan="2">
    <FrameworkElement.Resources>
        <Style TargetType="Path">
            <Setter Property="Stretch" Value="None"/>
            <Setter Property="Stroke" Value="#FF1B6CB0"/>
            <Setter Property="StrokeThickness" Value="4"/>
        </Style>
    </FrameworkElement.Resources>
    <Path x:Name="w"   Data="M501.5,309.22 L510.5,356.22 524,324.72 536,355.72 546,306.22"/>
    <Path x:Name="a"   Data="M588.5,316.22 C588.5,316.22 561.5,308.72 558,334.72 554.5,360.72 579.5,369.21978 588,357.71985 596.5,346.21993 587.00002,315.22013 588.99999,310.22011 590.49998,326.72017 589.50007,359.22028 597.99998,359.22028"/>
    <Path x:Name="l1"  Data="M613.5,283.22 C613.5,283.22 607,372.22 623.5,357.22"/>
    <Path x:Name="t_1" Data="M635.5,317.72 L656.5,316.22"/>
    <Path x:Name="t_2" Data="M644,285.72 C644,285.72 642.5,334.72 644,345.72 645.5,356.72 657.99343,366.72 661.99155,342.72"/>
    <Path x:Name="e"   Data="M678.5,329.72 L711.5,327.72 C711.5,327.72 711,306.22 692,307.72 673,309.22 677,325.72 677,336.22 677,346.71999 685.99986,355.21999 692.49989,353.71999 698.99993,352.21999 709.49999,349.22025 709.99999,343.72022"/>
    <Path x:Name="r"   Data="M725.5,306.72 C740,309.22 733.5,336.22 733.5,344.72 735.5,326.22 726.99993,300.72 763.49829,307.22"/>
    <Path x:Name="l2"  Data="M786,281.22 C786,281.22 769,372.22 789.5,362.72"/>
    <Path x:Name="v"   Data="M803,308.22 L817,358.22 835.5,310.22"/>
</Canvas>
```

然后将它做成了动画：

![动画绘制的路径](/static/posts/2017-11-20-draw-path-animatedly.gif)

而要做到这一点，我们只需要关心 `Path` 的两个属性即可：

- `StrokeDashArray`
- `StrokeDashOffset`

`StrokeDashArray` 是一个包含有很多个 `double` 的浮点数集合，决定了虚线虚实的变化趋势；`StrokeDashOffset` 是给这个变化趋势添加一个偏移量。

如果一条直线其长度为 100，粗细为 1，`StrokeDashArray="5,5"` 表示这段直线用虚线表示绘制；一开始的 5 长度绘制，接下来 5 长度不绘制，再接下来 5 长度绘制，依此类推。在这种情况下，我们再设置 `StrokeDashOffset="1"`，则将虚实的变化延后 1 个长度，即一开始空出 1 长度不绘制后，才接着 5 长度绘制。

于是，如果我们设置 `StrokeDashArray="100,100"`，那么意味着一开始整条线都绘制，随后在看不见的线条的后面一倍长度上不绘制。我们设置 `StrokeDashOffset="100"` 则意味着将这个绘制整体延后 100 长度，也就是完全看不见。当 `StrokeDashOffset` 设置成中间值的时候，这跟线条只会绘制一部分。

于是我们的思路是：

- 设置 `StrokeDashArray`，使其虚实部分都等于线的长度
- 动画设置 `StrokeDashOffset`，使其从长度变化到 0

这是为此制作的动画 XAML：

```xml
<CubicEase x:Key="EasingFunction.DrawLine" EasingMode="EaseOut"/>
<Storyboard x:Key="Storyboard.DrawName">
    <DoubleAnimation Storyboard.TargetName="w" Storyboard.TargetProperty="StrokeDashOffset" To="0" BeginTime="0:0:0" Duration="0:0:1" EasingFunction="{StaticResource EasingFunction.DrawLine}"/>
    <DoubleAnimation Storyboard.TargetName="a" Storyboard.TargetProperty="StrokeDashOffset" To="0" BeginTime="0:0:1" Duration="0:0:1" EasingFunction="{StaticResource EasingFunction.DrawLine}"/>
    <DoubleAnimation Storyboard.TargetName="l1" Storyboard.TargetProperty="StrokeDashOffset" To="0" BeginTime="0:0:2" Duration="0:0:1" EasingFunction="{StaticResource EasingFunction.DrawLine}"/>
    <DoubleAnimation Storyboard.TargetName="t_1" Storyboard.TargetProperty="StrokeDashOffset" To="0" BeginTime="0:0:3" Duration="0:0:0.4" EasingFunction="{StaticResource EasingFunction.DrawLine}"/>
    <DoubleAnimation Storyboard.TargetName="t_2" Storyboard.TargetProperty="StrokeDashOffset" To="0" BeginTime="0:0:3.4" Duration="0:0:0.6" EasingFunction="{StaticResource EasingFunction.DrawLine}"/>
    <DoubleAnimation Storyboard.TargetName="e" Storyboard.TargetProperty="StrokeDashOffset" To="0" BeginTime="0:0:4" Duration="0:0:1" EasingFunction="{StaticResource EasingFunction.DrawLine}"/>
    <DoubleAnimation Storyboard.TargetName="r" Storyboard.TargetProperty="StrokeDashOffset" To="0" BeginTime="0:0:5" Duration="0:0:1" EasingFunction="{StaticResource EasingFunction.DrawLine}"/>
    <DoubleAnimation Storyboard.TargetName="l2" Storyboard.TargetProperty="StrokeDashOffset" To="0" BeginTime="0:0:6" Duration="0:0:1" EasingFunction="{StaticResource EasingFunction.DrawLine}"/>
    <DoubleAnimation Storyboard.TargetName="v" Storyboard.TargetProperty="StrokeDashOffset" To="0" BeginTime="0:0:7" Duration="0:0:1" EasingFunction="{StaticResource EasingFunction.DrawLine}"/>
</Storyboard>
```

于是我们便可以在 C# 代码中初始化那些 XAML 里算不出来的值（Path 中线的长度）：

```csharp
private Storyboard DrawLineStoryboard => (Storyboard) FindResource("Storyboard.DrawName");

private async void OnLoaded(object sender, RoutedEventArgs args)
{
    for (var i = 0; i < DrawLineStoryboard.Children.Count; i++)
    {
        InitializePathAndItsAnimation((Path) DisplayCanvas.Children[i], (DoubleAnimation) DrawLineStoryboard.Children[i]);
    }
    DrawLineStoryboard.Begin();
}

private void InitializePathAndItsAnimation(System.Windows.Shapes.Path path, DoubleAnimation animation)
{
    var length = path.Data.GetProximateLength() / path.StrokeThickness;
    path.StrokeDashOffset = length;
    path.StrokeDashArray = new DoubleCollection(new[] {length, length});
    animation.From = length;
}
```

上述代码中存在一个线长度的估值算法，我们的策略是用多边形近似：

```csharp
public static class GeometryExtensions
{
    public static double GetProximateLength(this Geometry geometry)
    {
        var path = geometry.GetFlattenedPathGeometry();
        var length = 0.0;
        foreach (var figure in path.Figures)
        {
            var start = figure.StartPoint;
            foreach (var segment in figure.Segments)
            {
                if (segment is PolyLineSegment polyLine)
                {
                    // 一般的路径会转换成折线。
                    foreach (var point in polyLine.Points)
                    {
                        length += ProximateDistance(start, point);
                        start = point;
                    }
                }
                else if (segment is LineSegment line)
                {
                    // 少部分真的是线段的路径会转换成线段。
                    length += ProximateDistance(start, line.Point);
                    start = line.Point;
                }
            }
        }
        return length;

        double ProximateDistance(Point p1, Point p2)
        {
            return Math.Sqrt(Math.Pow(p1.X - p2.X, 2) + Math.Pow(p1.Y - p2.Y, 2));
        }
    }
}
```

**参考资料**

- [SVG技术入门：如何画出一条会动的线 – WEB骇客](http://www.webhek.com/post/animated-line-drawing-in-svg.html)
- [c# - Getting Geometry length - Stack Overflow](https://stackoverflow.com/questions/10877631/getting-geometry-length)
