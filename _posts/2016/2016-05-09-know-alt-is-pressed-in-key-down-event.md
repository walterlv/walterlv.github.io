---
layout: post
title: "KeyDown/PreviewKeyDown 事件中监听 Alt 键按下"
date: 2016-05-09 10:59:00 +0800
categories: wpf
permalink: /wpf/2016/05/09/know-alt-is-pressed-in-key-down-event.html
keywords: wpf
description: 当用户按下 Alt 键时，程序监听到的并不是 Alt 键被按下，而是 System 键。
---

在 WPF 应用程序（或者其他 Windows 应用程序中），为了监听 Alt 键按下，我们可以在 `KeyDown` 事件中写源码。然而，运行一看，发现并没有什么用。打个断点看下会发现，`e.Key` 的值是 `Key.System`。这就奇怪了，`Key.System` 是个什么鬼？

---

## 一个坑

在WPF应用程序（或者其他 Windows 应用程序中），为了监听 Alt 键按下，我们可以尝试写出这样的代码：

```csharp
PreviewKeyDown += (s, e) =>
{
    if (e.Key == Key.LeftAlt || e.Key == Key.RightAlt)
    {
        // A: 做些什么。
    }
};
```

然而，运行一看，发现并没有什么用。A处的代码根本就没执行。

打个断点看下，会发现，`e.Key` 的值是 `Key.System`。这就奇怪了，`Key.System` 是个什么鬼？

## 一段源码

看看 `KeyEventArgs` 中的源码，我们发现微软写了这么个注释：

```csharp
/// <summary>
///     The Key referenced by the event, if the key is not being 
///     handled specially.
/// </summary>
public Key Key
{
    get {return _key;}
}
```

如果按键没有被特殊处理， `Key` 属性才会返回正确的按键。这么说，当我们按下 Alt 键时，其实 Windows 或者 WPF 某一层特殊处理了这个按键。继续阅读源码，发现这个属性后面还有这样一个属性：

```csharp
/// <summary>
///     The Key referenced by the event, if the key is going to be
///     processed by an system.
/// </summary>
public Key SystemKey
{
    get { return (_key == Key.System) ? _realKey : Key.None;}
}
```

跟刚刚的 `Key` 属性相反，这个属性指进行特殊处理时返回的按键。所以，截至这里，问题算是解决了，因为我们可以写出这样的代码：

```csharp
PreviewKeyDown += (s, e) =>
{
    Key key = (e.Key == Key.System ? e.SystemKey : e.Key);
    if (key == Key.LeftAlt || key == Key.RightAlt)
    {
        // A: 做些什么。
    }
};
```

## 一个解释

然而事情肯定不能这样就结束了，微软为什么要设计这样奇怪的机制？为什么 Alt 键要成为特殊系统按键？

经过一系列搜索，我找到了解释：

> 在 Windows 系统中，Alt 键会被特殊处理。当单独按下 Alt 键，或者按下一个带有 Alt 的组合键时，操作系统会将此事件视为“系统按键”（System keypress）。系统按键与普通按键相比，其处理过程是不同的。
> 
> 首先，无论是系统按键还是普通按键，Windows都会将这些事件传递给应用程序。如果是普通按键，则传递 `WM_KEYDOWN` ，但如果是 Alt 键，则传递 `WM_SYSKEYDOWN` ；同理， `WM_KEYUP` 也会转变成 `WM_SYSKEYUP`。
> 
> 在 Windows 中（包括 WPF 中），Alt 键如此特殊是为了处理应用程序中那些带有“特殊标记”文字的菜单项（MenuItems）、按钮（Buttons）和其它标签（Labels）的。举个例子，如果按钮的文字内容被设置成“Say _Hi”，那么 Alt+H 快捷键就会被转变成为一次按钮点击（Click）事件。
> 
> 这段解释可以在这里 [https://stackoverflow.com/questions/3099472/previewkeydown-is-not-seeing-alt-modifiers](https://stackoverflow.com/questions/3099472/previewkeydown-is-not-seeing-alt-modifiers) 得到更详细的信息。
