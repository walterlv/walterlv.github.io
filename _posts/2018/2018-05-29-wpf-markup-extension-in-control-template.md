---
title: "如何编写 WPF 的标记扩展 MarkupExtension，即便在 ControlTemplate/DataTemplate 中也能生效"
publishDate: 2018-05-29 20:56:46 +0800
date: 2018-12-14 09:54:00 +0800
tags: xaml wpf
permalink: /posts/wpf-markup-extension-in-control-template.html
---

WPF 的标记扩展为 WPF 带来了强大的扩展性。利用自定义的标记扩展，我们能够为 XAML 中的属性提供各种各样种类的值，而不仅限于自带的那一些。

不过有小伙伴发现在 `ControlTemplate` 或 `DataTemplate` 中编写标记扩展有时并不能正常工作，而本文将提供解决方法。

---

本文并不会详细讲解如何编写 WPF 的标记扩展，如果你想了解相关的知识，建议阅读官网：[Markup Extensions and WPF XAML - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/wpf/advanced/markup-extensions-and-wpf-xaml?wt.mc_id=MVP)。

<div id="toc"></div>

## 编写简单的标记扩展

一个简单的标记扩展会是像这样：

```csharp
using System.Windows;
using System.Windows.Markup;
using System.Windows.Media;

namespace Walterlv.Demo
{
    public class RevealBorderBrushExtension : MarkupExtension
    {
        public override object ProvideValue(IServiceProvider serviceProvider)
        {
            return Brushes.White;
        }
    }
}
```

这样的标记扩展如此简单，以至于你可以在任意的 XAML 中用。只要赋值的那个属性接受 `Brush` 类型，就不会出错。

然而……有小伙伴写了更加复杂的标记扩展，在标记扩展中还通过 `serviceProvider` 拿到了目标控件的一些属性。本来一直好好工作的，结果有一天这个标记扩展被用到了 `ControlTemplate` 上，然后就挂了……挂了……

## 编写能在 `ControlTemplate` 中使用的标记扩展

在 `ControlTemplate` 中，XAML 标记扩展也是立即执行的，这就意味着当标记扩展中的 `ProvideValue` 执行时，还没有根据模板创建控件呢，那创建的是什么呢？

是一个名为 `System.Windows.SharedDp` 的对象，不明白是什么？没关系，微软把这个类设置为 `internal` 了，就是不想让你明白。所以，如果我们的标记扩展需要用到实际控件的一些功能（例如需要订阅事件、需要绑定、需要获取布局……），那么你就需要对 `System.Windows.SharedDp` 进行判断了。

具体来说，是加上这样的判断：

```csharp
if (service.TargetObject.GetType().Name.EndsWith("SharedDp"))
{
    return this;
}
```

更完整一点写出来，就是这样：

```csharp
using System;
using System.ComponentModel;
using System.Windows;
using System.Windows.Input;
using System.Windows.Markup;
using System.Windows.Media;

namespace Walterlv.Demo
{
    public class RevealBorderBrushExtension : MarkupExtension
    {
        public override object ProvideValue(IServiceProvider serviceProvider)
        {
            // 如果没有服务，则直接返回。
            if (!(serviceProvider.GetService(typeof(IProvideValueTarget)) is IProvideValueTarget service)) return null;
            // MarkupExtension 在样式模板中，返回 this 以延迟提供值。
            if (service.TargetObject.GetType().Name.EndsWith("SharedDp")) return this;
            // 如果不是 FrameworkElement，那么返回 this 以延迟提供值。
            if (!(service.TargetObject is FrameworkElement element)) return this;
            // 如果是设计时，那么返回白色
            if (DesignerProperties.GetIsInDesignMode(element)) return Brushes.White;

            var window = Window.GetWindow(element);
            if (window == null) return this;
            // 这一句是编译不通过的，我只是拿来做示范。
            var brush = CreateBrush(window, element);
            return brush;
        }
    }
}
```

你可能会觉得这段代码有些熟悉，如果有这种感觉，说明你可能阅读过我的另一篇博客：[流畅设计 Fluent Design System 中的光照效果 RevealBrush，WPF 也能模拟实现啦！](/post/fluent-design-reveal-brush-in-wpf)。

