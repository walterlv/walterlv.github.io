---
layout: post
title: "Why Unload Twice"
date: 2017-09-19 18:32:39 +0800
categories: wpf
keywords: wpf load unload LogicalTree
description: Why WPF sometimes unloaded twice? It really confused me.
---

Sometimes WPF raise unload event twice. In this case, it happens when a logical tree is build all by myself. Why unload twice? It really confused me.

**Any help would be appreciated!** The repo: [walterlv/why-unload-twice @ GitHub](https://github.com/walterlv/why-unload-twice)

---

Why the `_problemChild` unloaded twice?

## How to reproduce it ?

1. Clone this repository;
1. Run/Debug;
1. Click *Add Child* button several times;
1. Every time you click *Delete Child*, you'll got *Content Unloaded* output twice.

## Key points

- A non-generic style is added.
- When removing an FrameworkElement from a visual tree, it is also been removed from a logical tree at the same time.
- The visual tree and the logical tree is different.

#### Key points(zh-CHS) - 复现此问题的关键

1. 为一个 `TemplatedControl`（`CustomControl`） 定制非默认模板（不放在 `Generic.xaml` 中的模板）；
1. 这个控件包含视觉子级和逻辑子级，并且这两个不是同一个对象；
1. 将这个控件同时从视觉树和逻辑树中移除（两个移除顺序不重要，但一定是无中断的）；

这时你会观察到从这个控件的逻辑子级开始向所有子节点递归引发 `Unloaded` 事件，然后又从这个控件本身开始向所有子节点递归引发 `Unloaded` 事件，于是所有子节点都会连续发生两次 `Unloaded` 事件。

#### Key points(zh-CHT) - 復現此問題的關鍵

1. 為一個 `TemplatedControl`（`CustomControl`） 定制非默認模板（不放在 `Generic.xaml` 中的模板）；
1. 這個控件包含視覺子級和邏輯子級，並且這兩個不是同一個對象；
1. 將這個控件同時從視覺樹和邏輯樹中移除（兩個移除順序不重要，但一定是無中斷的）；

這時你會觀察到從這個控件的邏輯子級開始向所有子節點遞歸引發`Unloaded` 事件，然後又從這個控件本身開始向所有子節點遞歸引發`Unloaded` 事件，於是所有子節點都會連續發生兩次`Unloaded` 事件。

## Stacks of this issue

### When a non-generic style of `Child` is added, the `Unloaded` event will be raised of these two operations.

Removing from visual tree with non-generic style  
![Removing from visual tree with non-generic style](https://github.com/walterlv/why-unload-twice/raw/master/Docs/removing-from-visual-tree-with-non-generic-style.png)

Removing from logical tree with non-generic style  
![Removing from logical tree with non-generic style](https://github.com/walterlv/why-unload-twice/raw/master/Docs/removing-from-logical-tree-with-non-generic-style.png)

### When only the generic style of `Child` is defined, the `Unloaded` event will be raised of only one operations.

Removing from visual tree with generic style  
![Removing from visual tree with generic style](https://github.com/walterlv/why-unload-twice/raw/master/Docs/removing-from-visual-tree-with-generic-style.png)
