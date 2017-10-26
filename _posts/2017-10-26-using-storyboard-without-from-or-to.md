---
title: "WPF 和 UWP 中，不用设置 From 或 To，Storyboard 即拥有更灵活的动画控制"
date: 2017-10-26 12:55:27 +0800
categories: wpf uwp
tags: Storyboard Animation From To
---

无论是 WPF 还是 UWP 开发，如果用 `Storyboard` 和 `Animation` 做动画，我们多数时候都会设置 `From` 和 `To` 属性，用于从起始值动画到目标值。然而动画并不总是可以静态地指定这些值，因为更多的时候动画的起始值和目标值取决于当前 UI 的状态。

本文中，我将将尽量避免设置 `From` 和 `To` 值，让动画可以随时中断并重新开始，而中途不会出现突兀的变化。

---

<div id="toc"></div>

### 预览效果

下面是本文期望实现的基本效果：

- 在 WPF 中的动画效果  
![WPF 动画随机移动](/static/posts/2017-10-26-wpf-move-to-randomly.gif)
- 在 UWP 中的动画效果  
![UWP 动画随机移动](/static/posts/2017-10-26-uwp-move-to-randomly.gif)

### 预备代码

为了让读者能够最快速地搭建一个可供试验的 DEMO，我这里贴出界面部分核心代码。

XAML 是这样的（这里的 XAML，WPF 和 UWP 完全一样，可以互相使用而不用修改任何代码）：

- 布局部分

```xml
<Grid Background="White">
    <Grid.RowDefinitions>
        <RowDefinition Height="Auto"/>
        <RowDefinition/>
    </Grid.RowDefinitions>
    <Grid.ColumnDefinitions>
        <ColumnDefinition/>
        <ColumnDefinition/>
        <ColumnDefinition/>
    </Grid.ColumnDefinitions>
    <Button Grid.Row="0" Grid.Column="0" Content="平移至随机位置" Click="BeginStoryboard_Click"/>
    <Button Grid.Row="0" Grid.Column="1" Content="从随机位置平移" Click="BeginStoryboard2_Click"/>
    <Button Grid.Row="0" Grid.Column="2" Content="暂停" Click="PauseStoryboard_Click"/>
    <Canvas x:Name="DisplayCanvas" Grid.Row="1" Grid.Column="0" Grid.ColumnSpan="2">
        <Rectangle x:Name="DisplayShape" Fill="ForestGreen" Width="120" Height="40">
            <UIElement.RenderTransform>
                <TranslateTransform x:Name="TranslateTransform" X="0" Y="0"/>
            </UIElement.RenderTransform>
        </Rectangle>
    </Canvas>
</Grid>
```

- 资源部分

```xml
<Page.Resources>
    <CircleEase x:Key="EasingFunction.Translate" EasingMode="EaseOut"/>
    <!-- 为了方便使用，在 UWP 中加上了 x:Name；WPF 代码请删除 x:Name -->
    <Storyboard x:Name="TranlateStoryboard" x:Key="Storyboard.Translate">
        <DoubleAnimation Storyboard.TargetName="TranslateTransform" Storyboard.TargetProperty="X" EasingFunction="{StaticResource EasingFunction.Translate}"/>
        <DoubleAnimation Storyboard.TargetName="TranslateTransform" Storyboard.TargetProperty="Y" EasingFunction="{StaticResource EasingFunction.Translate}"/>
    </Storyboard>
</Page.Resources>
```

.xaml.cs 文件中预备一些属性和字段方便使用：

```csharp
#if !WINDOWS_UWP
// 因为 WPF 不能在资源中指定 x:Name，所以需要在后台代码中手动查找动画资源。
private Storyboard TranslateStoryboard => (Storyboard)FindResource("Storyboard.Translate");
#endif
private DoubleAnimation TranslateXAnimation => (DoubleAnimation) TranslateStoryboard.Children[0];
private DoubleAnimation TranslateYAnimation => (DoubleAnimation) TranslateStoryboard.Children[1];
private readonly Random _random = new Random(DateTime.Now.Ticks.GetHashCode());

private Point NextRandomPosition()
{
    var areaX = (int) Math.Round(DisplayCanvas.ActualWidth - DisplayShape.ActualWidth);
    var areaY = (int) Math.Round(DisplayCanvas.ActualHeight - DisplayShape.ActualHeight);
    return new Point(_random.Next(areaX) + 1, _random.Next(areaY) + 1);
}
```

### 探索动画

由于我们期望元素从当前所在的位置开始动画，到我们指定的另一个随机位置，所以直接在 XAML 中指定 `From` 和 `To` 是一个艰难的行为。我们只好在 .xaml.cs 文件中指定。

#### WPF

在 WPF 中，如果我们没有指定动画的 `From`，那么动画将从当前值开始；如果我们没有指定动画的 `To`，那么动画将到当前值结束。从这个角度上说，似乎不设置 `From` 和 `To` 将导致动画保持在当前值不变，不会有动画效果。

但是，WPF 允许在动画进行中修改动画参数，于是我们可以直接开始动画，然后再动画进行中修改元素属性到目标值。

也就是说，可以这么写：

```csharp
private void BeginStoryboard_Click(object sender, RoutedEventArgs e)
{
    TranslateStoryboard.Begin();

    var nextPosition = NextRandomPosition();
    TranslateTransform.X = nextPosition.X;
    TranslateTransform.Y = nextPosition.Y;
}
```

快速点击这个按钮看看，你会发现每次点击都可以立即从当前位置开始向新的目标位置动画。

![快速点击动画](/static/posts/2017-10-26-wpf-move-quickly.gif)

不过你应该注意到了一个坑——第一次并没有播放动画，而是直接跳到了目标位置；这是因为动画还没有保持住元素的位置。我们需要在初始化的时候播放一次动画；

```csharp
private void OnLoaded(object sender, RoutedEventArgs e)
{
    TranslateStoryboard.Begin();
    TranslateStoryboard.Stop();
}
```

这样就解决了第一次动画不播放的问题。

现在，我们加上暂停按钮：

```csharp
private void PauseStoryboard_Click(object sender, RoutedEventArgs e)
{
    TranslateStoryboard.Pause();
}
```

即便是中途有暂停，依然能够继续让动画朝新的目标位置动画。

![快速点击动画](/static/posts/2017-10-26-wpf-move-with-pause.gif)

如果我们希望动画从一个新的起点开始，而不是从当前状态开始，则只需要在动画开始之前设置元素的位置即可：

```csharp
private void BeginStoryboard2_Click(object sender, RoutedEventArgs e)
{
    MoveToRandomPosition();
    TranslateStoryboard.Begin();
    MoveToRandomPosition();

    void MoveToRandomPosition()
    {
        var nextPosition = NextRandomPosition();
        TranslateTransform.X = nextPosition.X;
        TranslateTransform.Y = nextPosition.Y;
    }
}
```

#### UWP

UWP 的情况就不如 WPF 那么灵活了。在 UWP 中，如果不给动画指定 `To` 值，那么动画根本就会直接朝 `0` 位置执行。

于是在动画执行之前，设置动画的 `To` 值不可避免：

```csharp
private void BeginStoryboard_Click(object sender, RoutedEventArgs e)
{
    AnimateToRandomPosition();
    TranslateStoryboard.Begin();

    void Uwp_AnimateToRandomPosition()
    {
        var nextPosition = NextRandomPosition();
        TranslateXAnimation.To = nextPosition.X;
        TranslateYAnimation.To = nextPosition.Y;
    }
}
```

在这样的写法下，灵活性与 WPF 相当，但 WPF 中支持在动画没有播放的时候随时设置元素位置，而这种方式则不行（其值会被动画保持）。

### 完整的后台代码

```csharp
public partial class StoryboardPage : Page
{
    public StoryboardPage()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

#if !WINDOWS_UWP
    private Storyboard TranslateStoryboard => (Storyboard)FindResource("Storyboard.Translate");
#endif
    private DoubleAnimation TranslateXAnimation => (DoubleAnimation) TranslateStoryboard.Children[0];
    private DoubleAnimation TranslateYAnimation => (DoubleAnimation) TranslateStoryboard.Children[1];
    private readonly Random _random = new Random(DateTime.Now.Ticks.GetHashCode());

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        Loaded -= OnLoaded;
        TranslateStoryboard.Begin();
        TranslateStoryboard.Stop();
    }

    private void BeginStoryboard_Click(object sender, RoutedEventArgs e)
    {
        Uwp_AnimateToRandomPosition();
        TranslateStoryboard.Begin();
        MoveToRandomPosition();
    }

    private void BeginStoryboard2_Click(object sender, RoutedEventArgs e)
    {
        MoveToRandomPosition();
        Uwp_AnimateToRandomPosition();
        TranslateStoryboard.Begin();
        MoveToRandomPosition();
    }

    private void PauseStoryboard_Click(object sender, RoutedEventArgs e)
    {
        TranslateStoryboard.Pause();
    }

    [Conditional("WINDOWS_UWP")]
    private void Uwp_AnimateToRandomPosition()
    {
        var nextPosition = NextRandomPosition();
        TranslateXAnimation.To = nextPosition.X;
        TranslateYAnimation.To = nextPosition.Y;
    }

    [Conditional("WPF")]
    private void MoveToRandomPosition()
    {
        var nextPosition = NextRandomPosition();
        TranslateTransform.X = nextPosition.X;
        TranslateTransform.Y = nextPosition.Y;
    }

    private Point NextRandomPosition()
    {
        var areaX = (int) Math.Round(DisplayCanvas.ActualWidth - DisplayShape.ActualWidth);
        var areaY = (int) Math.Round(DisplayCanvas.ActualHeight - DisplayShape.ActualHeight);
        return new Point(_random.Next(areaX) + 1, _random.Next(areaY) + 1);
    }
}
```

### 总结

1. 在 WPF 中，可以不通过 `From` 和 `To` 来指定动画的起始值和终止值；但如果真的不指定 `From` 和 `To`，需要提前播放一次动画以确保动画能保持住元素状态；
1. 在 WPF 中，如果没有指定 `From` 和 `To`，那么动画结束后依然能直接为元素属性复制，且会立刻生效（正常情况下需要先清除动画）；
1. 在 UWP 中，必须指定动画的 `To` 才能按照期望播放到目标值。
