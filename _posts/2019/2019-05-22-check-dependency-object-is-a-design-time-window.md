---
title: "WPF 判断一个对象是否是设计时的窗口类型，而不是运行时的窗口"
date: 2019-05-22 19:53:07 +0800
tags: wpf dotnet csharp
position: problem
---

当我们对 `Window` 类型写一个附加属性的时候，在属性变更通知中我们需要判断依赖对象是否是一个窗口。但是，如果直接判断是否是 `Window` 类型，那么在设计器中这个属性的设置就会直接出现异常。

那么有没有什么方法能够得知这是一个设计时的窗口呢？这样就不会抛出异常，而能够完美支持设计器了。

---

<div id="toc"></div>

## 方法一：判断设计时属性

WPF 原生自带一个附加属性可以判断一个依赖对象是否来源于设计器。而这个属性就是 `DesignerProperties.IsInDesignMode`。

在 WPF 的设计器中，这个属性会被设计器重写元数据，指定其值为 `true`，而其他默认的情况下，它的默认值都是 `false`。

所以通过判断这个值可以得知此时是否是在设计器中使用此附加属性。

```csharp
if (DesignerProperties.GetIsInDesignMode(d))
{
    // 通常我们考虑在设计器中不做额外的任何事情是最偷懒不会出问题的代码了。
    return;
}
```

我在这些博客中使用过这样的判断方法，可以参见源码：

- [流畅设计 Fluent Design System 中的光照效果 RevealBrush，WPF 也能模拟实现啦！](/post/fluent-design-reveal-brush-in-wpf)
- [如何编写 WPF 的标记扩展 MarkupExtension，即便在 ControlTemplate/DataTemplate 中也能生效](/post/wpf-markup-extension-in-control-template)

## 方法二：判断设计时窗口

上面的方法是个通用的判断设计器中的方法。不过，如果我们希望得到更多的设计器支持，而不是像上面那样直接 `return` 导致此属性在设计器中一点效果都没有的话，我们需要进行更精确的判断。

然而设计器中的类型我们不能直接引用到，所以可以考虑进行类型名称判断的方式。类型名称判断的方式会与 Visual Studio 的版本相关，所以实际上代码并不怎么好看。

我将判断方法整理如下：

```csharp
public static class WalterlvDesignTime
{
    /// <summary>
    /// 判断一个依赖对象是否是设计时的 <see cref="Window"/>。
    /// </summary>
    /// <param name="window">要被判断设计时的 <see cref="Window"/> 对象。</param>
    /// <returns>如果对象是设计时的 <see cref="Window"/>，则返回 true，否则返回 false。</returns>
    private static bool IsDesignTimeWindow(DependencyObject window)
    {
        const string vs201920172015Window =
            "Microsoft.VisualStudio.DesignTools.WpfDesigner.InstanceBuilders.WindowInstance";
        const string vs2013Window = "Microsoft.Expression.WpfPlatform.InstanceBuilders.WindowInstance";

        if (DesignerProperties.GetIsInDesignMode(window))
        {
            var typeName = window.GetType().FullName;
            if (Equals(vs201920172015Window, typeName) || Equals(vs2013Window, typeName))
            {
                return true;
            }
        }

        return false;
    }
}
```

于是，只需要调用一下这个方法即可得到此窗口实例是否是设计时的窗口：

```csharp
if (WalterlvDesignTime.IsDesignTimeWindow(d))
{
    // 检测到如果是设计时的窗口，就跳过一些句柄等等一些真的需要一个窗口的代码调用。
}
else if (d is Window)
{
    // 检测到真的是窗口，做一些真实窗口初始化需要做的事情。
}
else
{
    // 这不是一个窗口，需要抛出异常。
}
```
