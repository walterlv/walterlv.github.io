---
title: "WPF：无法对元素“XXX”设置 Name 特性值“YYY”。“XXX”在元素“ZZZ”的范围内，在另一范围内定义它时，已注册了名称。"
date: 2020-04-03 14:44:21 +0800
categories: wpf dotnet
position: problem
---

最近在改一段 XAML 代码时，我发现无论如何给一个控件添加 `Name` 或者 `x:Name` 属性时都会出现编译错误：无法对元素“XXX”设置 Name 特性值“YYY”。“XXX”在元素“ZZZ”的范围内，在另一范围内定义它时，已注册了名称。

---

<div id="toc"></div>

## 编译错误

编译时，出现错误：

> 无法对元素“XXX”设置 Name 特性值“YYY”。“XXX”在元素“ZZZ”的范围内，在另一范围内定义它时，已注册了名称。

> MC3093: Cannot set Name attribute value 'X' on element 'Y'. 'Y' is under the scope of element 'Z', which already had a name registered when it was defined in another scope.

这里的 XXX 是元素的类型，YYY 是指定的名称的值，ZZZ 是父容器的名称。

我把出现错误的 XAML 简化后大约是这样的，`XXX` 是 `TextBox`，`YYY` 是 `RenameTextBox`，而 `ZZZ` 是 `walterlv:Foo`。

```xml
<walterlv:Foo Background="White">
    <StackPanel Orientation="Horizontal" Focusable="False">
        <TextBlock Text="名称：" />
        <TextBox x:Name="RenameTextBox" />
    </StackPanel>
</walterlv:Foo>
```

## 小心用户控件

出现此问题的最大原因在那个 `walterlv:Foo` 上。实际上，这是一个用户控件，也就是继承自 `UserControl` 的大家通常用来写界面的东西。

```xml
<UserControl x:Class="Walterlv.Foo"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml">
    <UserControl.Style>
        <!-- 省略 -->
    </UserControl.Style>
</UserControl>
```

别问我为什么会有以上这样诡异的代码。我也不知道，这只是偶然发现的代码，我简化后拿到博客中。

于是需要提醒大家注意：

1. 在 WPF 里，拥有直接的 XAML 文件的始终应该作为最终用户界面，不应该当作控件使用（不要试图在其他地方使用时还设置其 `Content` 属性）；
1. 如果你确实希望做控件，请继承自 `CustomControl` 然后在 `/Themes/Generic.xaml` 里写样式。

至于以上 XAML 代码中我看到用的是 `<UserControl.Style>` 来写样式，是因为踩到了当控件用的另一个坑：

所有在控件的 XAML 中设置的 `Content` 属性都将被使用时覆盖。

## 解决方法

当然是考虑将以上诡异的用户控件定义方式改为正统的 `CustomControl` 啦！将 `<UserControl.Style>` 里定义的所有样式全部改到 `/Themes/Generic.xaml` 文件中。

![创建自定义控件](/static/posts/2020-04-03-14-40-15.png)

如果你不清楚如何编写一个自定义控件，那么请直接在 Visual Studio 中基于 WPF 自定义控件创建文件，你会发现 Visual Studio 为你写好了注释。

```csharp
using System;
using System.Collections.Generic;
using System.Text;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace Walterlv.Demo
{
    /// <summary>
    /// 按照步骤 1a 或 1b 操作，然后执行步骤 2 以在 XAML 文件中使用此自定义控件。
    ///
    /// 步骤 1a) 在当前项目中存在的 XAML 文件中使用该自定义控件。
    /// 将此 XmlNamespace 特性添加到要使用该特性的标记文件的根
    /// 元素中:
    ///
    ///     xmlns:MyNamespace="clr-namespace:Walterlv.Demo"
    ///
    ///
    /// 步骤 1b) 在其他项目中存在的 XAML 文件中使用该自定义控件。
    /// 将此 XmlNamespace 特性添加到要使用该特性的标记文件的根
    /// 元素中:
    ///
    ///     xmlns:MyNamespace="clr-namespace:Walterlv.Demo;assembly=Walterlv.Demo"
    ///
    /// 您还需要添加一个从 XAML 文件所在的项目到此项目的项目引用，
    /// 并重新生成以避免编译错误:
    ///
    ///     在解决方案资源管理器中右击目标项目，然后依次单击
    ///     “添加引用”->“项目”->[浏览查找并选择此项目]
    ///
    ///
    /// 步骤 2)
    /// 继续操作并在 XAML 文件中使用控件。
    ///
    ///     <MyNamespace:Foo/>
    ///
    /// </summary>
    public class Foo : Control
    {
        static Foo()
        {
            DefaultStyleKeyProperty.OverrideMetadata(typeof(Foo), new FrameworkPropertyMetadata(typeof(Foo)));
        }
    }
}
```

`/Themes/Generic.xaml` 文件：

```xml
<ResourceDictionary
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    xmlns:local="clr-namespace:Walterlv.Demo">


    <Style TargetType="{x:Type local:Foo}">
        <Setter Property="Template">
            <Setter.Value>
                <ControlTemplate TargetType="{x:Type local:Foo}">
                    <Border Background="{TemplateBinding Background}"
                            BorderBrush="{TemplateBinding BorderBrush}"
                            BorderThickness="{TemplateBinding BorderThickness}">
                    </Border>
                </ControlTemplate>
            </Setter.Value>
        </Setter>
    </Style>
</ResourceDictionary>
```