---
title: "WPF 很少人知道的科技"
publishDate: 2019-06-09 09:49:30 +0800
date: 2019-07-11 14:16:23 +0800
tags: wpf dotnet csharp
position: knowledge
permalink: /post/those-people-dont-know-about-wpf.html
---

本文介绍不那么常见的 WPF 相关的知识。

---

<div id="toc"></div>

## 在 C# 代码中创建 DataTemplate

大多数时候我们只需要在 XAML 中就可以实现我们想要的各种界面效果。这使得你可能已经不知道如何在 C# 代码中创建同样的内容。

比如在代码中创建 `DataTemplate`，主要会使用到 `FrameworkElementFactory` 类型。

可以参考：

- [WPF 后台创建 DateTemplate - Iron 的博客 - CSDN博客](https://blog.csdn.net/Iron_Ye/article/details/83504358)


## 多个数据源合并为一个列表显示

WPF 提供 `CompositionCollection` 用于将多个列表合并为一个，以便在 WPF 界面的同一个列表中显示多个数据源的数据。

```xml
<ListBox Name="WalterlvDemoListBox">
    <ListBox.Resources>
        <CollectionViewSource x:Key="Items1Source" Source="{Binding Items1}"/>
        <CollectionViewSource x:Key="Items2Source" Source="{Binding Items2}"/>
    </ListBox.Resources>
    <ListBox.ItemsSource>
        <CompositeCollection>
            <CollectionContainer Collection="{Binding Source={StaticResource Items1Source}}" />
            <CollectionContainer Collection="{Binding Source={StaticResource Items2Source}}" />
            <ListBoxItem>Walterlv End Item 1</ListBoxItem>
            <ListBoxItem>Walterlv End Item 2</ListBoxItem>
        </CompositeCollection>
    </ListBox.ItemsSource>
</ListBox>
```

关于 `CompositeCollection` 的使用示例可以参考：

- [How to: Implement a CompositeCollection - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/wpf/data/how-to-implement-a-compositecollection)

神樹桜乃写了一份非 WPF 框架的版本，如果希望在非 WPF 程序中使用，可以参考：

- [Sakuno.Base/ConcatenatedCollectionView`T.cs at master · KodamaSakuno/Sakuno.Base](https://github.com/KodamaSakuno/Sakuno.Base/blob/master/src/Sakuno.Base/Collections/ConcatenatedCollectionView%60T.cs)

## 使用附加属性做缓存，避免内存泄漏

在没有使用 WPF 的时候，如果我们要为一个对象添加属性或者行为，我们可能会使用字典来实现。但字典带来了内存泄漏的问题，要自己处理内存泄漏问题可能会写比较复杂的代码。

然而，WPF 的附加属性可以非常容易地为对象添加属性或者行为，而且也不用担心内存泄漏问题。

例如，我曾经用 WPF 来模拟 UWP 流畅设计（Fluent Design）中的光照效果，使用附加属性来管理此行为则完全不用担心内存泄漏问题：

- [流畅设计 Fluent Design System 中的光照效果 RevealBrush，WPF 也能模拟实现啦！](/post/fluent-design-reveal-brush-in-wpf)

## 使用 ConditionalWeakTable 做非 WPF 版本的缓存

如果你有一些非 WPF 的对象需要做类似 WPF 那种附加属性，那么可以考虑使用 `ConditionalWeakTable` 来实现，Key 是那个对象，而 Value 是你需要附加的属性或者行为。

这里的引用关系是 Key 引用着 Value，如果 Key 被回收，那么 Value 也可以被回收。

- [.NET/C# 使用 ConditionalWeakTable 附加字段（CLR 版本的附加属性，也可用用来当作弱引用字典 WeakDictionary）](/post/conditional-weak-table)

## 使用代码模拟触摸

WPF 默认情况下的触摸是通过 COM 组件 `PimcManager` 获取到的，在[禁用实时触摸](https://blog.lindexi.com/post/wpf-%E7%A6%81%E7%94%A8%E5%AE%9E%E6%97%B6%E8%A7%A6%E6%91%B8)后会启用系统的 `TOUCH` 消息获取到，如果[开启了 Pointer 消息](https://blog.lindexi.com/post/win10-%E6%94%AF%E6%8C%81%E9%BB%98%E8%AE%A4%E6%8A%8A%E8%A7%A6%E6%91%B8%E6%8F%90%E5%8D%87%E9%BC%A0%E6%A0%87%E4%BA%8B%E4%BB%B6-%E6%89%93%E5%BC%80-pointer-%E6%B6%88%E6%81%AF)那么会使用 `POINTER` 消息。

我们可以继承自 `TouchDevice` 来模拟触摸，详见：

- [WPF 模拟触摸设备](https://blog.lindexi.com/post/wpf-%E6%A8%A1%E6%8B%9F%E8%A7%A6%E6%91%B8%E8%AE%BE%E5%A4%87)

## 模拟 UWP 界面

在现有的 Windowing API 下，系统中看起来非常接近系统级的窗口样式可能都是用不同技术模拟实现的，只是模拟得很像而已。

如果要将 WPF 模拟得很像 UWP，可以参考我的这两篇博客：

- [WPF 使用 WindowChrome，在自定义窗口标题栏的同时最大程度保留原生窗口样式（类似 UWP/Chrome）](/post/wpf-simulate-native-window-style-using-window-chrome)
- [WPF 应用完全模拟 UWP 的标题栏按钮](/post/wpf-simulate-native-window-title-bar-buttons)

## 模拟 Fluent Design 特效

目前 WPF 还不能直接使用 Windows 10 Fluent Design 特效。当然如果你的程序非常小，那么模拟一下也不会伤害太多性能：

- [流畅设计 Fluent Design System 中的光照效果 RevealBrush，WPF 也能模拟实现啦！](/post/fluent-design-reveal-brush-in-wpf)
- [在 Windows 10 上为 WPF 窗口添加模糊特效](/post/win10/2017/10/02/wpf-transparent-blur-in-windows-10.html)

然而充分利用 Fluent Design 的高性能，需要上 XAML Islands，详见：

- [Using the UWP XAML hosting API in a desktop application - Windows apps | Microsoft Docs](https://docs.microsoft.com/en-us/windows/apps/desktop/modernize/using-the-xaml-hosting-api)

