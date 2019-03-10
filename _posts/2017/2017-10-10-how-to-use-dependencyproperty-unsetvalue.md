---
title: "DependencyProperty.UnsetValue 的正确打开方式"
publishDate: 2017-10-10 23:21:57 +0800
date: 2018-12-14 09:54:00 +0800
categories: xaml
permalink: /post/xaml/how-to-use-dependencyproperty-unsetvalue.html
tags: DependencyProperty UnsetValue 依赖属性
description: 为什么有时候在调试 XAML 程序（绑定或标记扩展）时会遇到 DependencyProperty.UnsetValue？DependencyProperty.UnsetValue 是什么？我们需要用 DependencyProperty.UnsetValue 吗？怎么用？
---

无论是 WPF，还是 UWP，只要你用了绑定或者标记扩展，一定会碰到一个神奇的值——`DependencyProperty.UnsetValue`。`UnsetValue` 是什么意思？为什么会出现这个值呢？如果要让 `UnsetValue` 为我们所用，正确的用法又是什么呢？

---

## DependencyProperty.UnsetValue 是什么？

要知道这是什么，一定要看源码：

```csharp
/// <summary> Standard unset value </summary>
public static readonly object UnsetValue = new NamedObject("DependencyProperty.UnsetValue");
```

这是一个 `NamedObject`，而 `NamedObject` 又是什么呢？

{% raw %}
```csharp
internal class NamedObject
{
    public NamedObject(string name)
    {
        if (String.IsNullOrEmpty(name)) throw new ArgumentNullException(name);
        _name = name;
    }
    public override string ToString()
    {
        if (_name[0] != '{') _name = String.Format(CultureInfo.InvariantCulture, "{{{0}}}", _name);
        return _name;
    }
    string _name;
}
```
{% endraw %}

好吧，其实这个类根本就没有什么用途，微软只是随便找了一个类，以便你在 Visual Studio 调试器或者你自己用代码输出值的时候能够显示一个预设好的字符串。真的只是起调试作用的啊！

在 `DependencyProperty.UnsetValue` 的定义中，只是为了让大家调试的时候显示 `DependencyProperty.UnsetValue` 而已。值本身不代表任何意义，只是为了说明遇到了一个“未设置”的值。

但是有人会问：`null` 在调试的时候也会显示 `null` 啊，为啥不用 `null`，要特别准备一个值呢？

这是因为在绑定中，`null` 可能是一个合理的值，可能会被故意用在绑定中来达到某种目的。于是微软必须用一个大家平常开发中一定不会用到的值来表示“不合理”，于是祭出了 `DependencyProperty.UnsetValue`。

## 什么情况下会出现 DependencyProperty.UnsetValue？

正常情况下，只有以下两处代码会遇到 `DependencyProperty.UnsetValue`：

1. 在用于绑定的转换器 `IValueConverter` `IMultiValueConverter` 的代码里面；
1. 在 XAML 标记扩展 `MarkupExtension` 里面。

而以上两处代码，只有在发生以下三种情况时才会遇到 `DependencyProperty.UnsetValue`：

1. 绑定出现了错误，也就是说绑定从最开始的源值到目标值的若干次转换过程中任何阶段发生了错误以至于无法成功转换到目标值。  
虽然我们写的是一个 `{Binding XXX}`，但 `XXX` 可能由另外的绑定来提供（例如逻辑父控件的 DataContext）。一次次绑定的源值是上一个绑定的目标值，于是这样的关系组合成一个绑定提供值的链条。链条中只要有一处不能提供合理的值，就会在绑定中得到 `UnsetValue`。
1. 绑定或者标记扩展写在了 `ControlTemplate` 或者 `DataTemplate` 里面，但此时并没有指定数据源。  
在模板应用到实际的控件之前，模板本身也会执行一次 `Binding` 和 `MarkupExtension` 的逻辑。于是如果绑定需要依赖于实际的控件，那么实际上 `Binding` 和 `MarkupExtension` 会至少执行两次，其中第一次便是模板中的那一次。此时获取依赖属性的值时拿到的便是 `DependencyProperty.UnsetValue`。
1. 使用依赖项属性的 `ReadLocalValue` 来获取值，而不是 `GetValue`；但此时并没有为依赖对象设置值。  
如果没有设置值，那么 `GetValue` 会返回更低优先级的值，一般情况下是依赖项属性在注册时的默认值；但 `ReadLocalValue` 就是在获取显式设置的那个值，如果没设，就只能是 `DependencyProperty.UnsetValue` 了。

## 我们应该如何正确使用 DependencyProperty.UnsetValue？

微软官方对于 `DependencyProperty.UnsetValue` 的介绍，专门的文档中只有一个说法，就是用来表示“不合理”的值，却并没有说明什么情况下为合理，什么情况下为不合理。但好在微软将一些推荐写法散落在了多个不同的文章中。这里整理在一起，以便为大家对 `DependencyProperty.UnsetValue` 的正确使用提供指导。

1. 在注册依赖项属性的时候，不要使用 `DependencyProperty.UnsetValue` 作为默认值。  
这个值本意其实并不是在说“未设置”，而是代表“不合理”。默认值必须是“合理地”才行。微软官方文档 [Custom dependency properties](https://docs.microsoft.com/en-us/windows/uwp/xaml-platform/custom-dependency-properties?wt.mc_id=MVP) 对此的解释是，如果默认值设置为 `UnsetValue`，则会在大家使用其值的时候产生混淆，并不能区分到底是依赖属性（的绑定系统）提供值的时候出错了还是因为只是默认没设置。
1. 微软推荐在写绑定的转换器的时候，如果转换有错误，不应该抛出异常，而是应该返回一个 `DependencyProperty.UnsetValue`，以便阻止绑定中继续传递值。不过我认为错误应该更及时地被发现才能避免错误的继续蔓延，所以建议在 DEBUG 下依然抛出异常，而在发布的版本里返回 `UnsetValue`。  
微软的推荐出自于 [Data binding in depth](https://docs.microsoft.com/en-us/windows/uwp/data-binding/data-binding-in-depth)，在 [How to: Convert Bound Data](https://docs.microsoft.com/en-us/dotnet/framework/wpf/data/how-to-convert-bound-data?wt.mc_id=MVP) 中给出了这种推荐的示例代码。
1. 如果需要在 `CoerceValueCallback` 回调中验证值的合理性，当值不合理的时候，返回 `DependencyProperty.UnsetValue`。  
这将告诉依赖属性系统阻止这次值的更改。

---

**参考资料**
- [Data binding in depth - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/data-binding/data-binding-in-depth?wt.mc_id=MVP)
- [How to: Convert Bound Data - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/wpf/data/how-to-convert-bound-data?wt.mc_id=MVP)
- [Custom dependency properties - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/xaml-platform/custom-dependency-properties?wt.mc_id=MVP)
- [Dependency Property Callbacks and Validation - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/wpf/advanced/dependency-property-callbacks-and-validation?wt.mc_id=MVP)
- [c# - Why do I get a DependencyProperty.UnsetValue when converting a value in a MultiBinding? - Stack Overflow](https://stackoverflow.com/questions/2811405/why-do-i-get-a-dependencyproperty-unsetvalue-when-converting-a-value-in-a-multib)
- [DependencyProperty.UnsetValue Field (System.Windows)](https://msdn.microsoft.com/en-us/library/system.windows.dependencyproperty.unsetvalue(v=vs.110).aspx)
- [UnsetValue](http://referencesource.microsoft.com/#WindowsBase/Base/System/Windows/DependencyProperty.cs,ee7f3b3d5828e7ab)