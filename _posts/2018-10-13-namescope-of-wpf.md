---
title: "WPF 中的 NameScope"
date: 2018-10-14 11:12:22 +0800
categories: dotnet wpf
---

我们在 WPF 中使用绑定时可以使用 `ElementName=Foo` 这样的写法，并且还能够真的在运行时找到这个名称对应的对象，是因为 WPF 中提供了名称范围概念。

实现 `INameScope` 接口可以定义一个名称范围。无论你使用 `Name` 属性还是使用 `x:Name` 特性都可以在一个名称范围内指定某个元素的名称。绑定时就在此名称范围内查找，于是可以找到你需要的对象。

本文将介绍 WPF 中 NameScope 的查找规则。

---

### INameScope

WPF 的 `INameScope` 接口只用来管理一个范围之内的名称。它包含下面三个方法：

```csharp
public interface INameScope
{
    object FindName(string name);
    void RegisterName(string name, object scopedElement);
    void UnregisterName(string name);
}
```

它的主要实现是 `NameScope`，包含了更多功能；而上面的接口是其本2222质功能。

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

### NameScope 的名称注册规则

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

### NameScope 的名称查找规则


