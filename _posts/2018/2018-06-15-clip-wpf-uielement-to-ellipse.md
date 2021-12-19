---
title: "WPF 中使用附加属性，将任意 UI 元素或控件裁剪成圆形（椭圆）"
publishDate: 2018-06-15 09:22:29 +0800
date: 2020-05-06 08:15:56 +0800
tags: xaml wpf
coverImage: /static/posts/2018-06-15-09-51-13.png
permalink: /post/clip-wpf-uielement-to-ellipse.html
---

不知从什么时候开始，头像流行使用圆形了，于是各个平台开始追逐显示圆形裁剪图像的技术。WPF 作为一个优秀的 UI 框架，当然有其内建的机制支持这种圆形裁剪。

不过，内建的机制仅支持画刷，而如果被裁剪的元素支持交互，或者拥有普通画刷无法达到的显示效果，那么就需要本文介绍的更加通用的解决方法了。

---

*UWP 的圆形裁剪请左转参考*：[UWP 将图片裁剪成圆形（椭圆）](/post/clip-uwp-image-to-ellipse)。

WPF 的 `UIElement` 提供了 `Clip` 依赖项属性，可以使用一个 `Geometry` 来裁剪任意的 `UIElement`。由于 `Geometry` 几乎可以表示任意形状，这意味着我们可以才建成任意想要的样子。

于是，我们可以利用这一点，使用 `EllipseGeometry` 将任意 `UIElement` 裁剪成圆形或者椭圆形。比如，写成下面这样：

```xml
<Grid>
    <Grid.Clip>
        <EllipseGeometry Center="120 180" RadiusX="120" RadiusY="180" />
    </Grid.Clip>
    <Image Source="demo.jpg" Stretch="Fill" />
    <TextBlock Text="https://walterlv.github.io" Foreground="White" Margin="171,172,51,21"/>
</Grid>
```

最终可以出现如下的效果。

![裁剪成椭圆](/static/posts/2018-06-15-09-51-13.png)

不过，稍微改变下窗口的大小，就会发现裁剪的范围不对了。因为我们写死了圆形裁剪的中心点和两个不同方向的半径（这里可不好说是长半轴还是短半轴啊）。

![没用跟着改变大小的圆形裁剪](/static/posts/2018-06-15-09-51-56.png)

我们需要一个可以自动修改裁剪圆形的一种机制，于是，我们想到了 `Binding`。为了使 XAML 的代码好看一点，我将 `Binding` 封装到了一个单独的类中处理，使用附加属性提供 API。

我封装好的类如下：

```csharp
/// <summary>
/// 提供将任意控件裁剪为圆形或椭圆的附加属性。
/// </summary>
public static class EllipseClipper
{
    /// <summary>
    /// 标识 IsClipping 的附加属性。
    /// </summary>
    public static readonly DependencyProperty IsClippingProperty = DependencyProperty.RegisterAttached(
        "IsClipping", typeof(bool), typeof(EllipseClipper), new PropertyMetadata(false, OnIsClippingChanged));

    public static void SetIsClipping(DependencyObject element, bool value)
        => element.SetValue(IsClippingProperty, value);

    public static bool GetIsClipping(DependencyObject element)
        => (bool) element.GetValue(IsClippingProperty);

    private static void OnIsClippingChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        var source = (UIElement) d;
        if (e.NewValue is false)
        {
            // 如果 IsClipping 附加属性被设置为 false，则清除 UIElement.Clip 属性。
            source.ClearValue(UIElement.ClipProperty);
            return;
        }

        // 如果 UIElement.Clip 属性被用作其他用途，则抛出异常说明问题所在。
        var ellipse = source.Clip as EllipseGeometry;
        if (source.Clip != null && ellipse == null)
        {
            throw new InvalidOperationException(
                $"{typeof(EllipseClipper).FullName}.{IsClippingProperty.Name} " +
                $"is using {source.GetType().FullName}.{UIElement.ClipProperty.Name} " +
                "for clipping, dont use this property manually.");
        }

        // 使用 UIElement.Clip 属性。
        ellipse = ellipse ?? new EllipseGeometry();
        source.Clip = ellipse;

        // 使用绑定来根据控件的宽高更新椭圆裁剪范围。
        var xBinding = new Binding(FrameworkElement.ActualWidthProperty.Name)
        {
            Source = source,
            Mode = BindingMode.OneWay,
            Converter = new HalfConverter(),
        };
        var yBinding = new Binding(FrameworkElement.ActualHeightProperty.Name)
        {
            Source = source,
            Mode = BindingMode.OneWay,
            Converter = new HalfConverter(),
        };
        var xyBinding = new MultiBinding
        {
            Converter = new SizeToClipCenterConverter(),
        };
        xyBinding.Bindings.Add(xBinding);
        xyBinding.Bindings.Add(yBinding);
        BindingOperations.SetBinding(ellipse, EllipseGeometry.RadiusXProperty, xBinding);
        BindingOperations.SetBinding(ellipse, EllipseGeometry.RadiusYProperty, yBinding);
        BindingOperations.SetBinding(ellipse, EllipseGeometry.CenterProperty, xyBinding);
    }

    private sealed class SizeToClipCenterConverter : IMultiValueConverter
    {
        public object Convert(object[] values, Type targetType, object parameter, CultureInfo culture)
            => new Point((double) values[0], (double) values[1]);

        public object[] ConvertBack(object value, Type[] targetTypes, object parameter, CultureInfo culture)
            => throw new NotSupportedException();
    }

    private sealed class HalfConverter : IValueConverter
    {
        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
            => (double) value / 2;

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
            => throw new NotSupportedException();
    }
}
```

在 XAML 中只需要很简单的一个属性赋值即可达到圆形或椭圆形裁剪。

```xml
<Grid local:EllipseClipper.IsClipping="True">
    <Image Source="fluentdesign-app-header.jpg" Stretch="Fill" />
    <TextBlock Text="https://walterlv.github.io" Foreground="White" Margin="171,172,51,21"/>
</Grid>
```

而且在控件的大小改变的时候也能够正常更新裁剪范围。

![裁剪成椭圆](/static/posts/2018-06-15-ellipse-clip.gif)

这篇博客的核心代码我也贴在了 StackOverflow 上：[c# - WPF displaying a gif in an ellipse - Stack Overflow](https://stackoverflow.com/a/50867867/6233938)


