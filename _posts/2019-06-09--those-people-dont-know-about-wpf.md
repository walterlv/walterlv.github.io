---
title: "WPF 很少人知道的科技"
date: 2019-06-09 09:21:50 +0800
categories: wpf dotnet csharp
position: knowledge
---

本文介绍不那么常见的 WPF 相关的知识。

---

<div id="toc"></div>

## 多个数据源合并为一个列表显示

WPF 提供 `CompositionCollection` 用于将多个列表合并为一个，以便在 WPF 界面的同一个列表中显示多个数据源的数据。

```xml
<ListBox Name="WalterlvDemoListBox">
    <ListBox.ItemsSource>
        <CompositeCollection>
            <CollectionContainer Collection="{Binding Items1}" />
            <CollectionContainer Collection="{Binding Items2}" />
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

## 在 C# 代码中创建 DataTemplate

大多数时候我们只需要在 XAML 中就可以实现我们想要的各种界面效果。这使得你可能已经不知道如何在 C# 代码中创建同样的内容。

比如在代码中创建 `DataTemplate`，主要会使用到 `FrameworkElementFactory` 类型。

可以参考：

- [WPF 后台创建 DateTemplate - Iron 的博客 - CSDN博客](https://blog.csdn.net/Iron_Ye/article/details/83504358)
