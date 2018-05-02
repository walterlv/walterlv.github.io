---
title: "流畅设计 Fluent Design System 中的光照效果 RevealBrush，WPF 也能模拟实现啦！"
date: 2018-04-05 16:34:42 +0800
categories: wpf xaml uwp
---

UWP 才能使用的流畅设计效果好惊艳，写新的 UWP 程序可以做出更漂亮的 UI 啦！然而古老的 WPF 项目也想解解馋怎么办？

于是我动手实现了一个！

---

<div id="toc"></div>

### 迫不及待看效果

![光照效果](/static/posts/2018-04-05-16-09-11.gif)  
▲ 是不是很像 UWP 中的 `RevealBorderBrush`？

不止是效果像，连 XAML 写法也像：

```xml
<Border BorderThickness="1" Margin="50,34,526,348">
    <Border.BorderBrush>
        <demo:RevealBorderBrush />
    </Border.BorderBrush>
</Border>
<Border BorderThickness="1" Margin="50,76,526,306">
    <Border.BorderBrush>
        <demo:RevealBorderBrush Color="White" FallbackColor="Gray" />
    </Border.BorderBrush>
</Border>
```
▲ 模拟得很像的 RevealBorderBrush 的 XAML 写法

当然，窗口背景那张图是直接用的高斯模糊效果，并不是亚克力 Acrylic 效果。鉴于那张被模糊得看不清的图**是我自己画的**，所以我一定要单独放出来给大家看🤓！

![我自己画的图，不忍直视，只好模糊掉作为背景了](/static/posts/2018-04-05-16-17-15.png)  
▲ 我自己画的图，不忍直视，只好模糊掉作为背景了

### 话不多说看源码

UWP 里的 CompositionBrush 是用一个 ShaderEffect 做出所有控件的所有效果的。正如 [叛逆者](https://www.zhihu.com/people/minmin.gong/activities) 在 [如何评价微软在 Build 2017 上提出的 Fluent Design System？ - 知乎](https://www.zhihu.com/question/59724483/answer/168191216?utm_medium=social&utm_source=wechat_session) 一文中说的，只需要极少的计算量就能完成。

不过 Win32 窗口并没有得到眷恋，所以我只好自己实现。但限于只能使用 WPF 内建机制，故性能上当然不能比了。但在小型项目的局部用用还是非常不错的——尤其是个人项目！*不过话说现在个人项目谁还用 WPF 呢* (逃

思路是画一个径向渐变，即 `RadialGradientBrush`，然后当鼠标在窗口内移动时，改变径向渐变的渐变中心为鼠标所在点。

以下是全部源码。**不要在意基类啦！WPF 不让我们实现自己的 Brush，所以只好用 MarkupExtension 绕道实现了。**

```csharp
using System;
using System.ComponentModel;
using System.Windows;
using System.Windows.Input;
using System.Windows.Markup;
using System.Windows.Media;

namespace Walterlv.Demo
{
    /// <summary>
    /// Paints a control border with a reveal effect using composition brush and light effects.
    /// </summary>
    public class RevealBorderBrushExtension : MarkupExtension
    {
        /// <summary>
        /// The color to use for rendering in case the <see cref="MarkupExtension"/> can't work correctly.
        /// </summary>
        public Color FallbackColor { get; set; } = Colors.White;

        /// <summary>
        /// Gets or sets a value that specifies the base background color for the brush.
        /// </summary>
        public Color Color { get; set; } = Colors.White;

        public Transform Transform { get; set; } = Transform.Identity;

        public Transform RelativeTransform { get; set; } = Transform.Identity;

        public double Opacity { get; set; } = 1.0;

        public double Radius { get; set; } = 100.0;

        public override object ProvideValue(IServiceProvider serviceProvider)
        {
            // 如果没有服务，则直接返回。
            if (!(serviceProvider.GetService(typeof(IProvideValueTarget)) is IProvideValueTarget service)) return null;
            // MarkupExtension 在样式模板中，返回 this 以延迟提供值。
            if (service.TargetObject.ToString().EndsWith("SharedDp")) return this;
            if (!(service.TargetObject is FrameworkElement element)) return this;
            if (DesignerProperties.GetIsInDesignMode(element)) return new SolidColorBrush(FallbackColor);

            var window = Window.GetWindow(element);
            if (window == null) return this;
            var brush = CreateBrush(window, element);
            return brush;
        }

        private Brush CreateBrush(Window window, FrameworkElement element)
        {
            var brush = new RadialGradientBrush(Colors.White, Colors.Transparent)
            {
                MappingMode = BrushMappingMode.Absolute,
                RadiusX = Radius,
                RadiusY = Radius,
                Opacity = Opacity,
                Transform = Transform,
                RelativeTransform = RelativeTransform,
            };
            window.MouseMove += OnMouseMove;
            window.Closed += OnClosed;
            return brush;

            void OnMouseMove(object sender, MouseEventArgs e)
            {
                var position = e.GetPosition(element);
                brush.GradientOrigin = position;
                brush.Center = position;
            }

            void OnClosed(object o, EventArgs eventArgs)
            {
                window.MouseMove -= OnMouseMove;
                window.Closed -= OnClosed;
            }
        }
    }
}
```

---

#### 参考资料

- [突出显示 - UWP app developer - Microsoft Docs](https://docs.microsoft.com/zh-cn/windows/uwp/design/style/reveal)
