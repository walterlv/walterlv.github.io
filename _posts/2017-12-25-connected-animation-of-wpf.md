---
title: "实现一个 WPF 版本的 ConnectedAnimation"
date: 2017-12-25 19:44:21 +0800
categories: wpf uwp
---

Windows 10 的创造者更新为开发者们带来了 Connected Animation 连接动画，这也是 Fluent Design System 的一部分。它的视觉引导性很强，用户能够在它的帮助下迅速定位操作的对象。

不过，这是 UWP，而且还是 Windows 10 Creator's Update 中才带来的特性，WPF 当然没有。于是，我自己写了一个“简易版本”。

---

![Connected Animation](https://docs.microsoft.com/en-us/windows/uwp/design/motion/images/connected-animations/example.gif)  
▲ Connected Animation 连接动画

<div id="toc"></div>

### 模拟 UWP 中的 API

UWP 中的连接动画能跑起来的最简单代码包含下面两个部分。

准备动画 `PrepareToAnimate()`：

> ```csharp
> ConnectedAnimationService.GetForCurrentView().PrepareToAnimate(/*string */key, /*UIElement */source);
> ```

开始动画 `TryStart`：

> ```csharp
> var animation = ConnectedAnimationService.GetForCurrentView().GetAnimation(/*string */key);
> animation?.TryStart(/*UIElement */destination);
> ```

于是，我们至少需要实现这些 API：

- `ConnectedAnimationService.GetForCurrentView();`
- `ConnectedAnimationService.PrepareToAnimate(string key, UIElement source);`
- `ConnectedAnimationService.GetAnimation(string key);`
- `ConnectedAnimation.TryStart(UIElement destination);`

### 实现这个 API

现在，我们需要写两个类才能实现上面那些方法：

- `ConnectedAnimationService` - 用来管理一个窗口内的所有连接动画
- `ConnectedAnimation` - 用来管理和播放一个指定 Key 的连接动画

#### ConnectedAnimationService

我选用窗口作为一个 `ConnectedAnimationService` 的管理单元是因为我可以在一个窗口内实现这样的动画，而跨窗口的动画就非常麻烦了。所以，我试用附加属性为 `Window` 附加一个 `ConnectedAnimationService` 属性，用于在任何一个 `View` 所在的地方获取 `ConnectedAnimationService` 的实例。

每次 `PrepareToAnimate` 时我创建一个 `ConnectedAnimation` 实例来管理此次的连接动画。为了方便此后根据 Key 查找 `ConnectedAnimation` 的实例，我使用字典存储这些实例。

```csharp
using System;
using System.Collections.Generic;
using System.Windows;
using System.Windows.Media;
using Walterlv.Annotations;

namespace Walterlv.Demo.Media.Animation
{
    public class ConnectedAnimationService
    {
        private ConnectedAnimationService()
        {
        }

        private readonly Dictionary<string, ConnectedAnimation> _connectingAnimations =
            new Dictionary<string, ConnectedAnimation>();

        public void PrepareToAnimate([NotNull] string key, [NotNull] UIElement source)
        {
            if (key == null)
            {
                throw new ArgumentNullException(nameof(key));
            }
            if (source == null)
            {
                throw new ArgumentNullException(nameof(source));
            }

            if (_connectingAnimations.TryGetValue(key, out var info))
            {
                throw new ArgumentException("指定的 key 已经做好动画准备，不应该重复进行准备。", nameof(key));
            }

            info = new ConnectedAnimation(key, source, OnAnimationCompleted);
            _connectingAnimations.Add(key, info);
        }

        private void OnAnimationCompleted(object sender, EventArgs e)
        {
            var key = ((ConnectedAnimation) sender).Key;
            if (_connectingAnimations.ContainsKey(key))
            {
                _connectingAnimations.Remove(key);
            }
        }

        [CanBeNull]
        public ConnectedAnimation GetAnimation([NotNull] string key)
        {
            if (key == null)
            {
                throw new ArgumentNullException(nameof(key));
            }
            if (_connectingAnimations.TryGetValue(key, out var info))
            {
                return info;
            }
            return null;
        }

        private static readonly DependencyProperty AnimationServiceProperty =
            DependencyProperty.RegisterAttached("AnimationService",
                typeof(ConnectedAnimationService), typeof(ConnectedAnimationService),
                new PropertyMetadata(default(ConnectedAnimationService)));

        public static ConnectedAnimationService GetForCurrentView(Visual visual)
        {
            var window = Window.GetWindow(visual);
            if (window == null)
            {
                throw new ArgumentException("此 Visual 未连接到可见的视觉树中。", nameof(visual));
            }

            var service = (ConnectedAnimationService) window.GetValue(AnimationServiceProperty);
            if (service == null)
            {
                service = new ConnectedAnimationService();
                window.SetValue(AnimationServiceProperty, service);
            }
            return service;
        }
    }
}
```

#### ConnectedAnimation

这是连接动画的关键实现。

我创建了一个内部类 `ConnectedAnimationAdorner` 用于在 `AdornerLayer` 上承载连接动画。`AdornerLayer` 是 WPF 中的概念，用于在其他控件上叠加显示一些 UI，UWP 中没有这样的特性。

```csharp
private class ConnectedAnimationAdorner : Adorner
{
    private ConnectedAnimationAdorner([NotNull] UIElement adornedElement)
        : base(adornedElement)
    {
        Children = new VisualCollection(this);
        IsHitTestVisible = false;
    }

    internal VisualCollection Children { get; }

    protected override int VisualChildrenCount => Children.Count;

    protected override Visual GetVisualChild(int index) => Children[index];

    protected override Size ArrangeOverride(Size finalSize)
    {
        foreach (var child in Children.OfType<UIElement>())
        {
            child.Arrange(new Rect(child.DesiredSize));
        }
        return finalSize;
    }

    internal static ConnectedAnimationAdorner FindFrom([NotNull] Visual visual)
    {
        if (Window.GetWindow(visual)?.Content is UIElement root)
        {
            var layer = AdornerLayer.GetAdornerLayer(root);
            if (layer != null)
            {
                var adorner = layer.GetAdorners(root)?.OfType<ConnectedAnimationAdorner>().FirstOrDefault();
                if (adorner == null)
                {
                    adorner = new ConnectedAnimationAdorner(root);
                    layer.Add(adorner);
                }
                return adorner;
            }
        }
        throw new InvalidOperationException("指定的 Visual 尚未连接到可见的视觉树中，找不到用于承载动画的容器。");
    }

    internal static void ClearFor([NotNull] Visual visual)
    {
        if (Window.GetWindow(visual)?.Content is UIElement root)
        {
            var layer = AdornerLayer.GetAdornerLayer(root);
            var adorner = layer?.GetAdorners(root)?.OfType<ConnectedAnimationAdorner>().FirstOrDefault();
            if (adorner != null)
            {
                layer.Remove(adorner);
            }
        }
    }
}
```

而 `ConnectedAnimationAdorner` 的作用是显示一个 `ConnectedVisual`。`ConnectedVisual` 包含一个源和一个目标，根据 `Progress`（进度）属性决定应该分别将源和目标显示到哪个位置，其不透明度分别是多少。

```csharp
private class ConnectedVisual : DrawingVisual
{
    public static readonly DependencyProperty ProgressProperty = DependencyProperty.Register(
        "Progress", typeof(double), typeof(ConnectedVisual),
        new PropertyMetadata(0.0, OnProgressChanged), ValidateProgress);

    public double Progress
    {
        get => (double) GetValue(ProgressProperty);
        set => SetValue(ProgressProperty, value);
    }

    private static bool ValidateProgress(object value) =>
        value is double progress && progress >= 0 && progress <= 1;

    private static void OnProgressChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        ((ConnectedVisual) d).Render((double) e.NewValue);
    }

    public ConnectedVisual([NotNull] Visual source, [NotNull] Visual destination)
    {
        _source = source ?? throw new ArgumentNullException(nameof(source));
        _destination = destination ?? throw new ArgumentNullException(nameof(destination));

        _sourceBrush = new VisualBrush(source) {Stretch = Stretch.Fill};
        _destinationBrush = new VisualBrush(destination) {Stretch = Stretch.Fill};
    }

    private readonly Visual _source;
    private readonly Visual _destination;
    private readonly Brush _sourceBrush;
    private readonly Brush _destinationBrush;
    private Rect _sourceBounds;
    private Rect _destinationBounds;

    protected override void OnVisualParentChanged(DependencyObject oldParent)
    {
        if (VisualTreeHelper.GetParent(this) == null)
        {
            return;
        }

        var sourceBounds = VisualTreeHelper.GetContentBounds(_source);
        if (sourceBounds.IsEmpty)
        {
            sourceBounds = VisualTreeHelper.GetDescendantBounds(_source);
        }
        _sourceBounds = new Rect(
            _source.PointToScreen(sourceBounds.TopLeft),
            _source.PointToScreen(sourceBounds.BottomRight));
        _sourceBounds = new Rect(
            PointFromScreen(_sourceBounds.TopLeft),
            PointFromScreen(_sourceBounds.BottomRight));

        var destinationBounds = VisualTreeHelper.GetContentBounds(_destination);
        if (destinationBounds.IsEmpty)
        {
            destinationBounds = VisualTreeHelper.GetDescendantBounds(_destination);
        }
        _destinationBounds = new Rect(
            _destination.PointToScreen(destinationBounds.TopLeft),
            _destination.PointToScreen(destinationBounds.BottomRight));
        _destinationBounds = new Rect(
            PointFromScreen(_destinationBounds.TopLeft),
            PointFromScreen(_destinationBounds.BottomRight));
    }

    private void Render(double progress)
    {
        var bounds = new Rect(
            (_destinationBounds.Left - _sourceBounds.Left) * progress + _sourceBounds.Left,
            (_destinationBounds.Top - _sourceBounds.Top) * progress + _sourceBounds.Top,
            (_destinationBounds.Width - _sourceBounds.Width) * progress + _sourceBounds.Width,
            (_destinationBounds.Height - _sourceBounds.Height) * progress + _sourceBounds.Height);

        using (var dc = RenderOpen())
        {
            dc.DrawRectangle(_sourceBrush, null, bounds);
            dc.PushOpacity(progress);
            dc.DrawRectangle(_destinationBrush, null, bounds);
            dc.Pop();
        }
    }
}
```

最后，用一个 `DoubleAnimation` 控制 `Progress` 属性，来实现连接动画。

完整的包含内部类的代码如下：

```csharp
using System;
using System.Collections.Generic;
using System.Linq;
using System.Windows;
using System.Windows.Documents;
using System.Windows.Media;
using System.Windows.Media.Animation;
using Walterlv.Annotations;

namespace Walterlv.Demo.Media.Animation
{
    public class ConnectedAnimation
    {
        internal ConnectedAnimation([NotNull] string key, [NotNull] UIElement source, [NotNull] EventHandler completed)
        {
            Key = key ?? throw new ArgumentNullException(nameof(key));
            _source = source ?? throw new ArgumentNullException(nameof(source));
            _reportCompleted = completed ?? throw new ArgumentNullException(nameof(completed));
        }

        public string Key { get; }
        private readonly UIElement _source;
        private readonly EventHandler _reportCompleted;

        public bool TryStart([NotNull] UIElement destination)
        {
            return TryStart(destination, Enumerable.Empty<UIElement>());
        }

        public bool TryStart([NotNull] UIElement destination, [NotNull] IEnumerable<UIElement> coordinatedElements)
        {
            if (destination == null)
            {
                throw new ArgumentNullException(nameof(destination));
            }
            if (coordinatedElements == null)
            {
                throw new ArgumentNullException(nameof(coordinatedElements));
            }
            if (Equals(_source, destination))
            {
                return false;
            }
            // 正在播动画？动画播完废弃了？false

            // 准备播放连接动画。
            var adorner = ConnectedAnimationAdorner.FindFrom(destination);
            var connectionHost = new ConnectedVisual(_source, destination);
            adorner.Children.Add(connectionHost);

            var storyboard = new Storyboard();
            var animation = new DoubleAnimation(0.0, 1.0, new Duration(TimeSpan.FromSeconds(10.6)))
            {
                EasingFunction = new CubicEase {EasingMode = EasingMode.EaseInOut},
            };
            Storyboard.SetTarget(animation, connectionHost);
            Storyboard.SetTargetProperty(animation, new PropertyPath(ConnectedVisual.ProgressProperty.Name));
            storyboard.Children.Add(animation);
            storyboard.Completed += (sender, args) =>
            {
                _reportCompleted(this, EventArgs.Empty);
                //destination.ClearValue(UIElement.VisibilityProperty);
                adorner.Children.Remove(connectionHost);
            };
            //destination.Visibility = Visibility.Hidden;
            storyboard.Begin();

            return true;
        }

        private class ConnectedVisual : DrawingVisual
        {
            public static readonly DependencyProperty ProgressProperty = DependencyProperty.Register(
                "Progress", typeof(double), typeof(ConnectedVisual),
                new PropertyMetadata(0.0, OnProgressChanged), ValidateProgress);

            public double Progress
            {
                get => (double) GetValue(ProgressProperty);
                set => SetValue(ProgressProperty, value);
            }

            private static bool ValidateProgress(object value) =>
                value is double progress && progress >= 0 && progress <= 1;

            private static void OnProgressChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
            {
                ((ConnectedVisual) d).Render((double) e.NewValue);
            }

            public ConnectedVisual([NotNull] Visual source, [NotNull] Visual destination)
            {
                _source = source ?? throw new ArgumentNullException(nameof(source));
                _destination = destination ?? throw new ArgumentNullException(nameof(destination));

                _sourceBrush = new VisualBrush(source) {Stretch = Stretch.Fill};
                _destinationBrush = new VisualBrush(destination) {Stretch = Stretch.Fill};
            }

            private readonly Visual _source;
            private readonly Visual _destination;
            private readonly Brush _sourceBrush;
            private readonly Brush _destinationBrush;
            private Rect _sourceBounds;
            private Rect _destinationBounds;

            protected override void OnVisualParentChanged(DependencyObject oldParent)
            {
                if (VisualTreeHelper.GetParent(this) == null)
                {
                    return;
                }

                var sourceBounds = VisualTreeHelper.GetContentBounds(_source);
                if (sourceBounds.IsEmpty)
                {
                    sourceBounds = VisualTreeHelper.GetDescendantBounds(_source);
                }
                _sourceBounds = new Rect(
                    _source.PointToScreen(sourceBounds.TopLeft),
                    _source.PointToScreen(sourceBounds.BottomRight));
                _sourceBounds = new Rect(
                    PointFromScreen(_sourceBounds.TopLeft),
                    PointFromScreen(_sourceBounds.BottomRight));

                var destinationBounds = VisualTreeHelper.GetContentBounds(_destination);
                if (destinationBounds.IsEmpty)
                {
                    destinationBounds = VisualTreeHelper.GetDescendantBounds(_destination);
                }
                _destinationBounds = new Rect(
                    _destination.PointToScreen(destinationBounds.TopLeft),
                    _destination.PointToScreen(destinationBounds.BottomRight));
                _destinationBounds = new Rect(
                    PointFromScreen(_destinationBounds.TopLeft),
                    PointFromScreen(_destinationBounds.BottomRight));
            }

            private void Render(double progress)
            {
                var bounds = new Rect(
                    (_destinationBounds.Left - _sourceBounds.Left) * progress + _sourceBounds.Left,
                    (_destinationBounds.Top - _sourceBounds.Top) * progress + _sourceBounds.Top,
                    (_destinationBounds.Width - _sourceBounds.Width) * progress + _sourceBounds.Width,
                    (_destinationBounds.Height - _sourceBounds.Height) * progress + _sourceBounds.Height);

                using (var dc = RenderOpen())
                {
                    dc.DrawRectangle(_sourceBrush, null, bounds);
                    dc.PushOpacity(progress);
                    dc.DrawRectangle(_destinationBrush, null, bounds);
                    dc.Pop();
                }
            }
        }

        private class ConnectedAnimationAdorner : Adorner
        {
            private ConnectedAnimationAdorner([NotNull] UIElement adornedElement)
                : base(adornedElement)
            {
                Children = new VisualCollection(this);
                IsHitTestVisible = false;
            }

            internal VisualCollection Children { get; }

            protected override int VisualChildrenCount => Children.Count;

            protected override Visual GetVisualChild(int index) => Children[index];

            protected override Size ArrangeOverride(Size finalSize)
            {
                foreach (var child in Children.OfType<UIElement>())
                {
                    child.Arrange(new Rect(child.DesiredSize));
                }
                return finalSize;
            }

            internal static ConnectedAnimationAdorner FindFrom([NotNull] Visual visual)
            {
                if (Window.GetWindow(visual)?.Content is UIElement root)
                {
                    var layer = AdornerLayer.GetAdornerLayer(root);
                    if (layer != null)
                    {
                        var adorner = layer.GetAdorners(root)?.OfType<ConnectedAnimationAdorner>().FirstOrDefault();
                        if (adorner == null)
                        {
                            adorner = new ConnectedAnimationAdorner(root);
                            layer.Add(adorner);
                        }
                        return adorner;
                    }
                }
                throw new InvalidOperationException("指定的 Visual 尚未连接到可见的视觉树中，找不到用于承载动画的容器。");
            }

            internal static void ClearFor([NotNull] Visual visual)
            {
                if (Window.GetWindow(visual)?.Content is UIElement root)
                {
                    var layer = AdornerLayer.GetAdornerLayer(root);
                    var adorner = layer?.GetAdorners(root)?.OfType<ConnectedAnimationAdorner>().FirstOrDefault();
                    if (adorner != null)
                    {
                        layer.Remove(adorner);
                    }
                }
            }
        }
    }
}
```

#### 调用

我在一个按钮的点击事件里面尝试调用上面的代码：

```csharp
private int index;

private void AnimationButton_Click(object sender, RoutedEventArgs e)
{
    BeginConnectedAnimation((UIElement)sender, ConnectionDestination);
}

private async void BeginConnectedAnimation(UIElement source, UIElement destination)
{
    var service = ConnectedAnimationService.GetForCurrentView(this);
    service.PrepareToAnimate($"Test{index}", source);

    // 这里特意写在了同一个方法中，以示效果。事实上，只要是同一个窗口中的两个对象都可以实现。
    var animation = service.GetAnimation($"Test{index}");
    animation?.TryStart(destination);

    // 每次点击都使用不同的 Key。
    index++;
}
```

![连接动画试验](/static/posts/2017-12-25-connected-animation-test.gif)  
▲ 上面的代码做的连接动画

### 目前的局限性以及改进计划

然而稍微试试不难发现，这段代码很难将控件本身隐藏起来（设置 `Visibility` 为 `Collapsed`），也就是说如果源控件和目标控件一直显示，那么动画期间就不允许隐藏（不同时显示就没有这个问题)。这样也就出不来“连接”的感觉，而是覆盖的感觉。

通过修改调用方的代码，可以规避这个问题。而做法是隐藏控件本身，但对控件内部的可视元素子级进行动画。这样，动画就仅限继承自 `Control` 的那些元素（例如 `Button`，`UserControl` 了）。

```csharp
private async void BeginConnectedAnimation(UIElement source, UIElement destination)
{
    source.Visibility = Visibility.Hidden;
    ConnectionDestination.Visibility = Visibility.Hidden;
    var animatingSource = (UIElement) VisualTreeHelper.GetChild(source, 0);
    var animatingDestination = (UIElement) VisualTreeHelper.GetChild(destination, 0);

    var service = ConnectedAnimationService.GetForCurrentView(this);
    service.PrepareToAnimate($"Test{index}", animatingSource);
    var animation = service.GetAnimation($"Test{index}");
    animation?.TryStart(animatingDestination);
    index++;

    await Task.Delay(600);
    source.ClearValue(VisibilityProperty);
    ConnectionDestination.ClearValue(VisibilityProperty);
}
```

![连接动画试验](/static/posts/2017-12-25-connected-animation-run.gif)  
▲ 修改后的代码做的连接动画

现在，我正试图通过截图和像素着色器（Shader Effect）来实现更加通用的 `ConnectedAnimation`，正在努力编写中……

---

#### 参考资料

- [Connected animation - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/design/motion/connected-animation)
- [UWP Connected Animations updates with Windows Creators release – Varun Shandilya](http://varunshandilya.com/uwp-connected-animations-updates-with-windows-creators-release/)
- [实现Fluent Design中的Connected Animation - ^ _ ^ .io](https://lijiaxiang98.github.io/2017/09/08/%E5%AE%9E%E7%8E%B0Fluent-Design%E4%B8%AD%E7%9A%84Connected-Animation/)
