---
title: "让你编写的控件库在 XAML 中有一个漂亮的命名空间（xmlns）和命名空间前缀"
date: 2018-05-22 21:21:22 +0800
categories: dotnet xaml wpf
---

在 WPF XAML 中使用自己定义的控件时，想必大家都能在 XAML 中编写出这个控件的命名空间了。**然而——我写不出来，除非借助 ReSharper。**

如果控件能够有一个漂亮的命名空间和命名空间前缀呢？——好吧，还是写不出来，不过，至少漂亮些。本文将指导你自定义在 XAML 中使用的命名空间。

---

<div id="toc"></div>

### 达到什么样的效果？

```xml
<UserControl
    x:Class="HuyaHearhira.UserControl1"
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    xmlns:w="http://walterlv.github.io/demo"
    <Grid>
        <w:DemoPage />
    </Grid>
</UserControl>
```

注意到 `DemoPage` 所在的命名空间了吗？是 `http://walterlv.github.io/demo` 哦。而且，命名空间前缀是 `w`。这是不是比下面这种看得清爽多了呢？

```xml
<UserControl
    x:Class="HuyaHearhira.UserControl1"
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    xmlns:newCsprojDemo="clr-namespace:Walterlv.NewCsprojDemo;assembly=Walterlv.NewCsprojDemo">
    <Grid>
        <newCsprojDemo:DemoPage />
    </Grid>
</UserControl>
```

### 这是怎么做到的呢？

在 `System.Windows.Markup` 命名空间下，有两个程序集级别的 `Attribute`，分别是 `XmlnsDefinition` 和 `XmlnsPrefix`。`XmlnsDefinition` 定义某个 C# 命名空间和一段命名空间字符串是等意的，`XmlnsPrefix` 定义此命名空间的默认前缀（只是默认而已）。

```csharp
using System.Windows.Markup;

[assembly: XmlnsDefinition("http://walterlv.github.io/demo", "Walterlv.NewCsprojDemo")]
[assembly: XmlnsPrefix("http://walterlv.github.io/demo", "w")]
```

于是，利用这两个 `Attribute` 能够达到本文一开始的奇妙的效果。

如果你用工具（例如 ReSharper）自动生成命名空间前缀时，才会使用这样默认的命名空间前缀，否则，你随便填。

### 还有什么更高级的玩法吗？

也许你注意到 WPF 有一些一开始就帮你生成好的命名空间前缀，例如这些：

```xml
<UserControl
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
    xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006">
</UserControl>
```

如果我们也把命名空间定义到这里会如何呢？

```csharp
[assembly: XmlnsDefinition("http://schemas.microsoft.com/winfx/2006/xaml/presentation", "Walterlv.NewCsprojDemo")]
```

哇，我们竟然可以不用带前缀啦！

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

这在项目内为一些几乎侵染全部代码的标记扩展是很棒的一波语法糖。例如——自己实现的本地化标记扩展。
