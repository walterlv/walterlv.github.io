---
title: "流畅设计 Fluent Design System 中的光照效果 RevealBrush，WPF 也能模拟实现啦！"
publishDate: 2018-04-05 16:34:42 +0800
date: 2019-03-23 11:09:45 +0800
tags: wpf xaml uwp
---

UWP 才能使用的流畅设计效果好惊艳，写新的 UWP 程序可以做出更漂亮的 UI 啦！然而古老的 WPF 项目也想解解馋怎么办？

于是我动手实现了一个！

---

<div id="toc"></div>

## 迫不及待看效果

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

我自己画的图，不忍直视，只好模糊掉作为背景了。[请点击查看：图片](/static/posts/2018-04-05-16-17-15.png)

以下是我后来使用此模拟的效果制作的应用。这些应用虽然看起来整个儿都很像 UWP 应用，但都是 100% 纯 WPF；因为我模拟了 UWP 的风格：

- [WPF 使用 WindowChrome，在自定义窗口标题栏的同时最大程度保留原生窗口样式（类似 UWP/Chrome） - walterlv](/post/wpf-simulate-native-window-style-using-window-chrome)
- [WPF 应用完全模拟 UWP 的标题栏按钮 - walterlv](/post/wpf-simulate-native-window-title-bar-buttons)

**2019 年 1 月更新：**

![Cloud Keyboard](/static/posts/2019-01-23-reveal-brush-in-cloud-keyboard-pc.gif)  
▲ 源码在这个仓库：[Walterlv.CloudKeyboard](https://github.com/walterlv/Walterlv.CloudKeyboard)

**2019 年 3 月更新：**

![Diagnostics Window](/static/posts/2019-03-23-reveal-in-wpf-window.gif)  

## 话不多说看源码

UWP 里的 CompositionBrush 是用一个 ShaderEffect 做出所有控件的所有效果的。正如 [叛逆者](https://www.zhihu.com/people/minmin.gong/activities) 在 [如何评价微软在 Build 2017 上提出的 Fluent Design System？ - 知乎](https://www.zhihu.com/question/59724483/answer/168191216?utm_medium=social&utm_source=wechat_session) 一文中说的，只需要极少的计算量就能完成。

不过 Win32 窗口并没有得到眷恋，所以我只好自己实现。但限于只能使用 WPF 内建机制，故性能上当然不能比了。但在小型项目的局部用用还是非常不错的——尤其是个人项目！*不过话说现在个人项目谁还用 WPF 呢* (逃

思路是画一个径向渐变，即 `RadialGradientBrush`，然后当鼠标在窗口内移动时，改变径向渐变的渐变中心为鼠标所在点。

以下是全部源码。**不要在意基类啦！WPF 不让我们实现自己的 Brush，所以只好用 MarkupExtension 绕道实现了。**

**2019 年 3 月更新：**以下源码中现在使用了全局光照，也就是说，就算你的控件不在一个固定的窗口中，也会使用到光照效果了。

```csharp
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Windows;
using System.Windows.Input;
using System.Windows.Markup;
using System.Windows.Media;

// ReSharper disable CheckNamespace

namespace Walterlv.Effects
{
    /// <summary>
    /// Paints a control border with a reveal effect using composition brush and light effects.
    /// </summary>
    public class RevealBorderBrushExtension : MarkupExtension
    {
        [ThreadStatic]
        private static Dictionary<RadialGradientBrush, WeakReference<FrameworkElement>> _globalRevealingElements;

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
            if (service.TargetObject.GetType().Name.EndsWith("SharedDp")) return this;
            if (!(service.TargetObject is FrameworkElement element)) return this;
            if (DesignerProperties.GetIsInDesignMode(element)) return new SolidColorBrush(FallbackColor);

            var brush = CreateGlobalBrush(element);
            return brush;
        }

        private Brush CreateBrush(UIElement rootVisual, FrameworkElement element)
        {
            var brush = CreateRadialGradientBrush();
            rootVisual.MouseMove += OnMouseMove;
            return brush;

            void OnMouseMove(object sender, MouseEventArgs e)
            {
                UpdateBrush(brush, e.GetPosition(element));
            }
        }

        private Brush CreateGlobalBrush(FrameworkElement element)
        {
            var brush = CreateRadialGradientBrush();
            if (_globalRevealingElements is null)
            {
                CompositionTarget.Rendering -= OnRendering;
                CompositionTarget.Rendering += OnRendering;
                _globalRevealingElements = new Dictionary<RadialGradientBrush, WeakReference<FrameworkElement>>();
            }

            _globalRevealingElements.Add(brush, new WeakReference<FrameworkElement>(element));
            return brush;
        }

        private void OnRendering(object sender, EventArgs e)
        {
            if (_globalRevealingElements is null)
            {
                return;
            }

            var toCollect = new List<RadialGradientBrush>();
            foreach (var pair in _globalRevealingElements)
            {
                var brush = pair.Key;
                var weak = pair.Value;
                if (weak.TryGetTarget(out var element))
                {
                    Reveal(brush, element);
                }
                else
                {
                    toCollect.Add(brush);
                }
            }

            foreach (var brush in toCollect)
            {
                _globalRevealingElements.Remove(brush);
            }

            void Reveal(RadialGradientBrush brush, IInputElement element)
            {
                UpdateBrush(brush, Mouse.GetPosition(element));
            }
        }

        private void UpdateBrush(RadialGradientBrush brush, Point origin)
        {
            IInputElement element;
            if (IsUsingMouseOrStylus())
            {
                brush.GradientOrigin = origin;
                brush.Center = origin;
            }
            else
            {
                brush.Center = new Point(double.NegativeInfinity, double.NegativeInfinity);
            }
        }

        private RadialGradientBrush CreateRadialGradientBrush()
        {
            var brush = new RadialGradientBrush(Color, Colors.Transparent)
            {
                MappingMode = BrushMappingMode.Absolute,
                RadiusX = Radius,
                RadiusY = Radius,
                Opacity = Opacity,
                Transform = Transform,
                RelativeTransform = RelativeTransform,
                Center = new Point(double.NegativeInfinity, double.NegativeInfinity),
            };
            return brush;
        }

        private bool IsUsingMouseOrStylus()
        {
            var device = Stylus.CurrentStylusDevice;
            if (device is null)
            {
                return true;
            }

            if (device.TabletDevice.Type == TabletDeviceType.Stylus)
            {
                return true;
            }

            return false;
        }
    }
}
```

---

**参考资料**

- [突出显示 - UWP app developer - Microsoft Docs](https://docs.microsoft.com/zh-cn/windows/uwp/design/style/reveal?wt.mc_id=MVP)
