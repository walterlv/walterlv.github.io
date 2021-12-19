---
title: "如何在保留原本所有样式/绑定和用户设置值的情况下，设置和还原 WPF 依赖项属性的值"
date: 2020-06-03 07:13:24 +0800
tags: wpf dotnet
position: knowledge
permalink: /posts/change-and-restore-wpf-dependency-value-without-disabling-the-declared-use-of-the-property.html
---

WPF 备份某控件的一些属性，做一些神奇的操作，然后再还原这些属性。多么司空见惯的操作呀！然而怎么备份却是值得研究的问题。直接赋值？那一定是因为你没踩到一些坑。

---

<div id="toc"></div>

## 场景和问题

现在，我们假想一个场景（为了编代码方便）：

1. 有一个窗口，设置了一些样式属性
2. 现在需要将这个窗口设置为全屏，这要求修改一些原来的属性（WPF 自带那设置有 bug，我会另写一篇博客说明）
3. 取消设置窗口全屏后，之前修改的那些属性要“完美”还原

一般可能会这么写：

```csharp
private Window _window;
private WindowStyle _oldStyle;

private void OnEnterFullScreen()
{
    _oldStyle = _window.WindowStyle;
    _window.WindowStyle = WindowStyle.None;
}

private void OnExitFullScreen()
{
    _window.WindowStyle = _oldStyle;
}
```

然而：

- 如果某人在 `WindowStyle` 上设了个动态的样式怎么办？——那当然是不再动态了呀（因为覆盖了样式值）
- 如果某人在 `WindowStyle` 上设置了绑定怎么办？——那当然也是不再生效了呀（因为绑定被你覆盖了）

## 解决方法和原理

因为各大 WPF 入门书籍都说到了 WPF 依赖项属性的优先级机制，所以大家应该基本都知道这个。不了解的，可以立刻去这里看看：[依赖项属性值优先级 - WPF | Microsoft Docs](https://docs.microsoft.com/zh-cn/dotnet/framework/wpf/advanced/dependency-property-value-precedence#dependency-property-setting-precedence-list)。

是这样的优先级：强制 > 动画 > 本地值 > 模板 > 隐式样式 > 样式触发器 > 模板触发器 > 样式 > 默认样式 > 属性继承 > 元数据默认值。

而我们通过在 XAML 或 C# 代码中直接赋值，设置的是“本地值”。因此，如果设置了本地值，那么更低优先级的样式当然就全部失效了。

那么绑定呢？绑定在依赖项属性优先级中并不存在。绑定实际上是通过“本地值”来实现的，将一个绑定表达式设置到“本地值”中，然后在需要值的时候，会 `ProvideValue` 提供值。所以，如果再设置了本地值，那么绑定的设置就被覆盖掉了。

但是，`SetCurrentValue` 就是干这件事的！

`SetCurrentValue` 设计为在不改变依赖项属性任何已有值的情况下，设置属性当前的值。

```csharp
_window.SetCurrentValue(Window.WindowStyleProperty, WindowStyle.None);
```

那么，只需要还原 `SetCurrentValue` 所做的修改，就还原了此依赖项属性的一切设置的值：

```csharp
_window.InvalidateProperty(Window.WindowStyleProperty);
```

注意不是 `ClearValue`，那会清除本地值。

然而还差一点，绑定如果在你应用 `SetCurrentValue` 期间有改变，那么这次的赋值并不会让绑定立即生效，所以我们还需要手工再让绑定重新更新值：

```csharp
BindingOperations.GetBindingExpression(_window, Window.WindowStyleProperty)?.UpdateTarget();
```

那么，综合起来，本文一开始的代码将更新成如下形式：

```csharp
private Window _window;

private void OnEnterFullScreen()
{
    _window.SetCurrentValue(Window.WindowStyleProperty, WindowStyle.None);
}

private void OnExitFullScreen()
{
    _window.InvalidateProperty(Window.WindowStyleProperty);
    BindingOperations.GetBindingExpression(_window, Window.WindowStyleProperty)?.UpdateTarget();
}
```

## 延伸

将代码变得通用一点：

```csharp
static void ApplyTempProperty(DependencyObject d, DependencyProperty dp, object tempValue)
{
    d?.SetCurrentValue(dp, tempValue);
}

static void RestoreProperty(DependencyObject d, DependencyProperty dp)
{
    d.InvalidateProperty(dp);
    BindingOperations.GetBindingExpression(d, dp)?.UpdateTarget();
}
```

