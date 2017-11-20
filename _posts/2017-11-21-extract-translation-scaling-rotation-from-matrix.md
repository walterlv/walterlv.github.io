---
title: "从 Matrix 解构出 Translate/Scale/Rotate（平移/缩放/旋转）"
date: 2017-11-21 00:20:36 +0800
categories: xaml wpf uwp
---

在 XAML 中，我们对一个 `UIElement` 进行一个 `RenderTransform` 是再常见不过的事情了，我们可以从众多叠加的 `TransformGroup` 瞬间得到一个 `Matrix` 表示整个变换的综合变换矩阵，然而反过来却不好做——从变换矩阵中反向得到变换分量。

---

首先明确的是，各种 `TranslateTransform`、`ScaleTransform`、`RotateTransform` 到 `Matrix` 具有唯一确定的解，然而反向转换却是有无穷多个解的。于是如果我们要得到一个解，我们需要给定一个条件，然后得到这个条件下的其中一个解。

<div id="toc"></div>

### 准备工作

为了写出一个通用的变换方法来，我准备了一个测试控件，并为它随意填写一个变换：

```xml
<Border x:Name="DisplayShape" Background="#FF1B6CB0" Width="200" Height="100">
    <UIElement.RenderTransform>
        <TransformGroup>
            <ScaleTransform ScaleX="0.8" ScaleY="2"/>
            <SkewTransform/>
            <RotateTransform Angle="-48.366"/>
            <TranslateTransform x:Name="TranslateTransform" X="85" Y="160"/>
        </TransformGroup>
    </UIElement.RenderTransform>
    <TextBlock Foreground="{media:LuminanceForeground TargetName=DisplayShape}" Text="walterlv" HorizontalAlignment="Center" VerticalAlignment="Center"/>
</Border>
```

▲ `LuminanceForeground` 的作用可参见我的另一篇文章：[计算能在任何背景色上清晰显示的前景色](/post/get-gray-reversed-color.html)

![](/static/posts/2017-11-20-23-47-06.png)  
▲ 一个随便应用了一个变换的控件

我们将从这个控件中取得变换矩阵 `Matrix`，然后计算出变换分量的一个解，应用到新的控件上：

```xml
<Rectangle x:Name="TraceShape" Width="200" Height="100" Stroke="#FFE2620A" StrokeThickness="4"/>
```

![](/static/posts/2017-11-20-23-50-08.png)  
▲ 我们希望计算一组变换分量以便让这个框追踪变换了的控件

于是，我们写下了测试代码：

```csharp
private void OnLoaded(object sender, RoutedEventArgs args)
{
    var matrix = DisplayShape.RenderTransform.Value;
    var (scaling, rotation, translation) = ExtractMatrix(matrix);
    var group = new TransformGroup();
    group.Children.Add(new ScaleTransform {ScaleX = scaling.X, ScaleY = scaling.Y});
    group.Children.Add(new RotateTransform {Angle = rotation});
    group.Children.Add(new TranslateTransform {X = translation.X, Y = translation.Y});
    TraceShape.RenderTransform = group;
}

private (Vector Scaling, double Rotation, Vector Translation) ExtractMatrix(Matrix matrix)
{
    // 我们希望在这里写出一个方法，以便得到三个变换分量。
}
```

`OnLoaded` 是为了让代码运行起来，而 `ExtractMatrix` 才是我们的核心——将变换分量解构出来。

---

### 思路和初步成果

我们的思路是创造一个单位矩形，让它应用这个变换，然后测量变换后矩形的宽高变化，角度变化和位置变化。由于直接使用 `Rect` 类型时无法表示旋转后的矩形，所以我们直接使用四个顶点来计算，于是我们写出如下代码：

```csharp
private (Vector Scaling, double Rotation, Vector Translation) ExtractMatrix(Matrix matrix)
{
    var unitPoints = new[] {new Point(0, 0), new Point(1, 0), new Point(1, 1), new Point(0, 1)};
    var transformedPoints = unitPoints.Select(matrix.Transform).ToArray();
    var scaling = new Vector(
        (transformedPoints[1] - transformedPoints[0]).Length,
        (transformedPoints[3] - transformedPoints[0]).Length);
    var rotation = Vector.AngleBetween(new Vector(1, 0), transformedPoints[1] - transformedPoints[0]);
    var translation = transformedPoints[0] - unitPoints[0];
    return (scaling, rotation, translation);
}
```

运行后，我们发现追踪框已经与原始控件完全贴合，说明计算正确。

![](/static/posts/2017-11-20-23-57-54.png)  
▲ 追踪框完全贴合

---

### 可以灵活应用计算结果

不过如果真要在产品中做追踪框，肯定不能像上图那样被严重拉伸。所以，我们把缩放分量去掉，换成尺寸变化：

```csharp
private void OnLoaded(object sender, RoutedEventArgs args)
{
    var matrix = DisplayShape.RenderTransform.Value;
    var (scaling, rotation, translation) = ExtractMatrix(matrix);
    var group = new TransformGroup();
    TraceShape.Width = DisplayShape.ActualWidth * scaling.X;
    TraceShape.Height = DisplayShape.ActualHeight * scaling.Y;
    group.Children.Add(new RotateTransform {Angle = rotation});
    group.Children.Add(new TranslateTransform {X = translation.X, Y = translation.Y});
    TraceShape.RenderTransform = group;
}
```

以上代码中，`ScaleTransform` 已经被去掉，取而代之的是宽高的设置。

![](/static/posts/2017-11-21-00-01-43.png)  
▲ 没有被拉伸的追踪框

<!-- ---

### 更通用的方法

以上虽然达到了目的，不过实际应用中可能会有更多的限制，例如：
- 变换中心不是 `(0, 0)`
- 最终应用的顺序不是 `Scale`->`Rotate`->`Translate`

首先来解决变换中心的通用性问题。

我们将变换中心设为 `(0.5, 0.5)`：

```xml
<Rectangle x:Name="TraceShape" Width="200" Height="100" Stroke="#FFE2620A" StrokeThickness="4" RenderTransformOrigin="0.5 0.5"/>
```

于是，追踪框不知道飞到哪里去了……

![](/static/posts/2017-11-21-00-14-25.png)  
▲ 改变了变换中心 -->
