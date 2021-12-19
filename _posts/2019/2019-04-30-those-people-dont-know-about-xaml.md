---
title: "XAML 很少人知道的科技"
publishDate: 2019-04-30 10:30:24 +0800
date: 2019-04-30 19:08:20 +0800
tags: dotnet csharp wpf uwp
position: knowledge
---

本文介绍不那么常见的 XAML 相关的知识。

---

<div id="toc"></div>

## Thickness 可以用空格分隔

当你用设计器修改元素的 Margin 时，你会看到用逗号分隔的 `Thickness` 属性。使用设计器或者属性面板时，使用逗号是默认的行为。

不过你有试过，使用空格分隔吗？

```xml
<Button Margin="10 12 0 0" />
```

## 使用逗号（`,`）设置多值枚举

有一些枚举标记了 `[Flags]` 特性，这样的枚举可以通过位运算设置多个值。

```csharp
[Flags]
enum NonClientFrameEdges
{
    // 省略枚举内的值。
}
```

那么在 XAML 里面如何设置多个枚举值呢？使用逗号（`,`）即可，如下面的例子：

```xml
<WindowChrome NonClientFrameEdges="Left,Bottom,Right" GlassFrameThickness="0 64 0 0" UseAeroCaptionButtons="False" />
```

## 使用加号（`+`）设置多值枚举

使用逗号（`,`） 设置多值枚举是通用的写法，但是在 WPF/UWP 中设置按键/键盘快捷键的时候又有加号（`+`）的写法。如下面的例子：

```xml
<KeyBinding Command="{x:Static WalterlvCommands.Foo}" Modifiers="Control+Shift" Key="W" />
```

这里的 `Modifiers` 属性的类型是 `ModifierKeys`，实际上是因为这个类型特殊地编写了一个 `TypeConverter` 来转换字符串，所以键盘快捷键多值枚举使用的位或运算用的是加号（`+`）。

## 设置 Url 型的 XAML 命名空间（xmlns）

WPF/UWP 中原生控件的 XAML 命名空间是 <http://schemas.microsoft.com/winfx/2006/xaml/presentation>，与 XAML 编译器相关的 XAML 命名空间是 <http://schemas.microsoft.com/winfx/2006/xaml>，还有其他 Url 形式的 XAML 命名空间。

只需要在库中写如下特性（Attribute）即可将命名空间指定为一个 url：

```csharp
using System.Windows.Markup;
[assembly: XmlnsDefinition("http://walterlv.github.io/demo", "Walterlv.NewCsprojDemo")]
```

详情请阅读博客：

- [让你编写的控件库在 XAML 中有一个统一的漂亮的命名空间（xmlns）和命名空间前缀](/post/define-xmlns-of-for-xaml)

此写法要生效，定义的组件与使用的组件不能在同一程序集。

## 设置默认的 XAML 命名空间前缀

WPF/UWP XAML 编译器的命名空间前缀是 `x`。如果你写了自己的控件，希望给控件指定一个默认的命名空间前缀，那么可以通过在库中写如下特性（Attribute）实现：

```csharp
using System.Windows.Markup;
[assembly: XmlnsPrefix("http://walterlv.github.io/demo", "w")]
```

这样，当 XAML 设计器帮助你自动添加命名空间时，将会使用 `w` 前缀。虽然实际上你也能随便改。

详情请阅读博客：

- [让你编写的控件库在 XAML 中有一个统一的漂亮的命名空间（xmlns）和命名空间前缀](/post/define-xmlns-of-for-xaml)

此写法要生效，定义的组件与使用的组件不能在同一程序集。

## 让你做的控件库不需要 XAML 命名空间前缀

自己写了一个 `DemoPage`，要在 XAML 中使用，一般需要添加命名空间前缀才可以。但是也可以不写：

```xml
<UserControl
    x:Class="HuyaHearhira.UserControl1"
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
    <Grid>
        <DemoPage />
    </Grid>
</UserControl>
```

方法是在库中定义命名空间前缀为 <http://schemas.microsoft.com/winfx/2006/xaml/presentation>。

```csharp
using System.Windows.Markup;
[assembly: XmlnsDefinition("http://schemas.microsoft.com/winfx/2006/xaml/presentation", "Walterlv.NewCsprojDemo")]
```

此写法要生效，定义的组件与使用的组件不能在同一程序集。
