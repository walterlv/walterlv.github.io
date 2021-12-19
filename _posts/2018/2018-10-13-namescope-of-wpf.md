---
title: "WPF 中的 NameScope"
publishDate: 2018-10-14 12:23:40 +0800
date: 2018-10-16 21:01:20 +0800
tags: dotnet wpf
---

我们在 WPF 中使用绑定时可以使用 `ElementName=Foo` 这样的写法，并且还能够真的在运行时找到这个名称对应的对象，是因为 WPF 中提供了名称范围概念。

实现 `INameScope` 接口可以定义一个名称范围。无论你使用 `Name` 属性还是使用 `x:Name` 特性都可以在一个名称范围内指定某个元素的名称。绑定时就在此名称范围内查找，于是可以找到你需要的对象。

本文将介绍 WPF 中 NameScope 的查找规则。（额外的，资源 / 资源字典的查找方式与 NameScope 的方式是一样的，所以本文分析过程同样使用与资源的查找。）

---

## INameScope

WPF 的 `INameScope` 接口只用来管理一个范围之内的名称。它包含下面三个方法：

```csharp
public interface INameScope
{
    object FindName(string name);
    void RegisterName(string name, object scopedElement);
    void UnregisterName(string name);
}
```

它的主要实现是 `NameScope`，包含了更多功能；而上面的接口是其本质功能。

不过，`NameScope` 的实现带来了一个重要的依赖项属性 —— `NameScope`。下面是此属性的代码（经过简化）：

```csharp
public static readonly DependencyProperty NameScopeProperty
    = DependencyProperty.RegisterAttached("NameScope", typeof(INameScope), typeof(NameScope));

public static void SetNameScope(DependencyObject dependencyObject, INameScope value)
{
    if (dependencyObject == null) throw new ArgumentNullException(nameof(dependencyObject));
    dependencyObject.SetValue(NameScopeProperty, value);
}

public static INameScope GetNameScope(DependencyObject dependencyObject)
{
    if (dependencyObject == null) throw new ArgumentNullException(nameof(dependencyObject));
    return ((INameScope)dependencyObject.GetValue(NameScopeProperty));
}
```

同样实现了此接口的还有 `TemplateNameScope`，此 NameScope 会被 `FrameworkTemplate` / `FrameworkElementFactory` / `BamlRecordReader` 设置到以上依赖属性中。于是我们可以在模板范围内找到某个特定名称对应的元素。

除此之外，NameScope 的设置由 XAML 解析器在 WPF 项目编译的时候自动生成。

## NameScope 的名称注册规则

如果你没有在代码中显式去调用 `RegisterName` 这样的方法，那么 NameScope 的创建以及名称的注册都由 XAML 解析器来完成。

XAML 解析器（BamlRecordReader）注册名字的时候并没有去爬可视化树什么的，只是单纯在解析 XAML 的时候去调用代码注册这个名字而已。注册由一个 Stack 来完成，`NameScopeStack`。

设想以下这个例子（来自于 .NET Framework 代码中的注释）：

```xml
<Window x:Name="myWindow">
    ...
    <Style x:Name="myStyle">
        ...
        <SolidColorBrush x:Name="myBrush">
        </SolidColorBrush>
    </Style>
</Window>
```

每当 XAML 解析器解析一层的时候，就会给 `NameScopeStack` 入栈，于是 `Window` 首先创建 NameScope 入栈。随后解析到 `Style` 时又加一个 NameScope 入栈，其他元素解析时不会创建 NameScope（包括 XAML 中的顶层元素 `UserControl` 等）。

这时，`myWindow` 会被注册到 `Window` 一层的 NameScope 中，`myStyle` 也会注册到 `Window` 一层的 NameScope 中；而 `myBrush` 则会注册到 `Style` 那一层的 NameScope 中。

- Window 的 NameScope
    - `myWindow`
    - `myStyle`
- Style 的 NameScope
    - `myBrush`

## NameScope 的名称查找规则

在本文一开始贴出 `NameScope` 依赖项属性的时候，你应该注意到这只是一个普通的属性，并没有使用到什么可以用可视化树继承这样的高级元数据。事实上也不应该有这样的高级元数据，因为 NameScope 的抽象级别低于可视化树或者逻辑树。

但是，实际上 `NameScope` 的查找却是依赖于逻辑树的 —— 这是 `FrameworkElement` 的功能：

```csharp
internal static INameScope FindScope(DependencyObject d, out DependencyObject scopeOwner)
{
    while (d != null)
    {
        INameScope nameScope = NameScope.NameScopeFromObject(d);
        if (nameScope != null)
        {
            scopeOwner = d;
            return nameScope;
        }

        DependencyObject parent = LogicalTreeHelper.GetParent(d);

        d = (parent != null) ? parent : Helper.FindMentor(d.InheritanceContext);
    }

    scopeOwner = null;
    return null;
}
```

非常明显，`FindScope` 是期望使用逻辑树来查找名称范围的。

不过值得注意的是，当一个元素没有逻辑父级的时候，会试图使用 `Helper.FindMentor` 来查找另一个对象。那这是什么方法，又试图寻找什么对象呢？

Mentor 是名词，意为 “导师，指导”。于是我们需要阅读以下 `Helper.FindMentor` 方法的实现来了解其意图：

提示：*以下注释中的 FE 代表 FrameworkElement，而 FCE 代表 FrameworkContentElement。*

```csharp
/// <summary>
///     This method finds the mentor by looking up the InheritanceContext
///     links starting from the given node until it finds an FE/FCE. This
///     mentor will be used to do a FindResource call while evaluating this
///     expression.
/// </summary>
/// <remarks>
///     This method is invoked by the ResourceReferenceExpression
///     and BindingExpression
/// </remarks>
internal static DependencyObject FindMentor(DependencyObject d)
{
    // Find the nearest FE/FCE InheritanceContext
    while (d != null)
    {
        FrameworkElement fe;
        FrameworkContentElement fce;
        Helper.DowncastToFEorFCE(d, out fe, out fce, false);

        if (fe != null)
        {
            return fe;
        }
        else if (fce != null)
        {
            return fce;
        }
        else
        {
            d = d.InheritanceContext;
        }
    }

    return null;
}
```

具体来说，是不断查找 `InheritanceContext`，如果找到了 FrameworkElement 或者 FrameworkContentElement，那么就返回这个 FE 或者 FCE；如果到最终也没有找到，则返回 null。

这是个 `virtual` 属性，基类 `DependencyObject` 中只返回 `null`，而子类重写它时，返回父级。`Freezable`, `FrameworkElement`, `FrameworkContentElement` 等重写了这个属性。

对于 `FrameworkElement`，重写时只是单纯的返回了一个内部管理的字段而已：

```csharp
internal override DependencyObject InheritanceContext
{
    get { return InheritanceContextField.GetValue(this); }
}
```

此字段在调用 `DependencyObject.AddInheritanceContext` 的时候会赋值。而对于可视化树或逻辑树的建立，此方法不会被调用，所以此属性并不会对可视化树或逻辑树有影响。但是，`Freezable`, `InputBinding`, `Visual3D`, `GridViewColumn`, `ViewBase`, `CollectionViewSource`, `ResourceDictionary`, `TriggerAction`, `TriggerBase` 等会在属性赋值的时候调用此方法。于是我们能够在以上这些属性的设置中找到名称。

特别说明，只有那些重写了 `InheritanceContext` 的类型才会在查找名称的时候找得到 NameScope；只有以上这些调用了 `DependencyObject.AddInheritanceContext` 方法的属性才会在赋值是能够找得到 NameScope。

所以，我另一篇文章中所说的 ContextMenu 是找不到对应的 NameScope 的。[WPF 的 ElementName 在 ContextMenu 中无法绑定成功？试试使用 x:Reference！](/post/fix-wpf-binding-issues-in-context-menu)。此文中 `ContextMenu` 找到的 NameScope 是 `null`。
