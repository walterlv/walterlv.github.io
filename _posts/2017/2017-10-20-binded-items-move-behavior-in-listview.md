---
title: "UWP 和 WPF 不同，ListView 中绑定的集合修改顺序时，UI 的刷新规则"
date: 2017-10-20 08:14:00 +0800
tags: dotnet wpf uwp
description: 
permalink: /posts/binded-items-move-behavior-in-listview.html
---

`ObservableCollection<T>` 中有一个 `Move` 方法，而这个方法在其他类型的集合中是很少见的。由于 `ObservableCollection<T>` 主要用于绑定，涉及到 UI 更新，而 UI 更新普遍比普通的集合修改慢了不止一个数量级，所以可以大胆猜想，`Move` 的存在是为了提升 UI 刷新性能。

然而事实真是这样的吗？

---

## 试验

将 `ObservableCollection<T>` 用于 UI 绑定的目前只有 UWP 和 WPF，于是我写了两个 App 来验证这个问题。代码已上传 GitHub [walterlv/ListViewBindingDemo for ItemsMove](https://github.com/walterlv/ListViewBindingDemo-for-ItemsMove)。

验证方式主要看两个点：
1. UI 元素的 Hash 值有没有更改，以便了解 UWP 或 WPF 框架是否有为此移动的数据创建新的 UI。
1. UI 元素的焦点有没有变化，以便了解 UWP 或 WPF 是否将此 UI 元素移出过视觉树。

结果如下图：

- 在 UWP 中，移动数据的元素焦点没有改变，Hash 值也没有改变。  
![UWP 中看被移动的元素](/static/posts/2017-10-20-uwp-items-move-1.gif)

- 在 UWP 中，未被移动数据的元素 Hash 值没有改变。  
![UWP 中看未被移动的元素](/static/posts/2017-10-20-uwp-items-move-2.gif)

- 在 WPF 中，移动数据的元素焦点丢失，Hash 值已经改变。  
![WPF 中看被移动的元素](/static/posts/2017-10-20-wpf-items-move-1.gif)

- 在 WPF 中，未被移动数据的元素 Hash 值没有改变。  
![WPF 中看未被移动的元素](/static/posts/2017-10-20-wpf-items-move-2.gif)

## 猜想

- UWP 真的对 `ObservableCollection<T>` 的 `Move` 操作有优化，根本就没有将移动数据的元素移除视觉树。
- WPF 似乎并没有对 `ObservableCollection<T>` 的 `Move` 操作进行优化，因为 Hash 值都变了，直接就是创建了个新的。几乎等同于将原来的 UI 元素移除之后再创建了一个新的。

## 调查

.Net Standard 统一了 `ObservableCollection<T>` 的 API，所以 UWP 和 WPF 这些基本的 API 是一样的。由于 .NET Framework 发布了源代码，.Net Core 直接开源，所以这两者的代码我们都能翻出来。

这是 [Net Framework 版的 ObservableCollection<T>.MoveItem](http://referencesource.microsoft.com/#System/compmod/system/collections/objectmodel/observablecollection.cs,270a83d222656b02)

```csharp
/// <summary>
/// Called by base class ObservableCollection&lt;T&gt; when an item is to be moved within the list;
/// raises a CollectionChanged event to any listeners.
/// </summary>
protected virtual void MoveItem(int oldIndex, int newIndex)
{
    CheckReentrancy();

    T removedItem = this[oldIndex];

    base.RemoveItem(oldIndex);
    base.InsertItem(newIndex, removedItem);

    OnPropertyChanged(IndexerName);
    OnCollectionChanged(NotifyCollectionChangedAction.Move, removedItem, newIndex, oldIndex);
}
```

这是 [.Net Core 版的 ObservableCollection<T>.MoveItem](https://github.com/dotnet/corefx/blob/master/src/System.ObjectModel/src/System/Collections/ObjectModel/ObservableCollection.cs)

```csharp
/// <summary>
/// Called by base class ObservableCollection&lt;T&gt; when an item is to be moved within the list;
/// raises a CollectionChanged event to any listeners.
/// </summary>
protected virtual void MoveItem(int oldIndex, int newIndex)
{
    CheckReentrancy();

    T removedItem = this[oldIndex];

    base.RemoveItem(oldIndex);
    base.InsertItem(newIndex, removedItem);

    OnIndexerPropertyChanged();
    OnCollectionChanged(NotifyCollectionChangedAction.Move, removedItem, newIndex, oldIndex);
}
```

好吧，微软真省事儿，不止代码中的每个字母都相同，就连注释都一样……

`MoveItem` 所做的就是在旧的位置移除元素，并将其插入到新的位置。于是，优化的重心就在于引发 `CollectionChanged` 事件时传入的参数了，都是传入 `NotifyCollectionChangedAction.Move`。

由于 UWP 没有开源，从源码级别我们只能分析 WPF 为此枚举所做的事情。在 WPF 中，`ListView` 为此所做的判断仅一处，就是其基类 `ItemsControl` 类的 `AdjustItemInfos` 方法。然而此方法内部对 `Move` 的实现几乎就是 `Remove` 和 `Add` 的叠加。

但是 UWP 中我们可以做更多的试验。比如我们直接移除掉原来的一项，然后延迟再添加一个新的：

```csharp
var item = EditableCollection.FirstOrDefault(x => x.EditingText == "E");
EditableCollection.Remove(item);
await Task.Delay(2000);
EditableCollection.Insert(random.Next(EditableCollection.Count), item);
```

或者我们直接添加一个跟原来不同的项：

```csharp
var item = EditableCollection.FirstOrDefault(x => x.EditingText == "E");
EditableCollection.Remove(item);
await Task.Delay(2000);
EditableCollection.Insert(random.Next(EditableCollection.Count), new EditableModel("X"));
```

这时运行发现，焦点确实移除了，但 HashCode 依然是原来的 HashCode。基本可以确定，UWP 的 `ListBox` 做了更多的优化，在根据 `DataTemplate` 生成控件时，一直在重用之前已经生成好的控件。

## 结论

UWP 比 WPF 对 `ObservableCollection<T>` 的集合操作进行了更好的性能优化，在添加、删除、移动时会重用之前创建好的控件。而在 WPF 中，则简单地创建和销毁这些控件——即便调用了 `ObservableCollection<T>` 专有的 `Move` 方法也没有做更多的优化。

