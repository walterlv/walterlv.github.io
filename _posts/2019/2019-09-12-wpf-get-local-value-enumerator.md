---
title: "如何在 WPF 中获取所有已经显式赋过值的依赖项属性"
date: 2019-09-12 11:39:49 +0800
tags: wpf dotnet csharp
position: knowledge
permalink: /posts/wpf-get-local-value-enumerator.html
---

获取 WPF 的依赖项属性的值时，会依照优先级去各个级别获取。这样，无论你什么时候去获取依赖项属性，都至少是有一个有效值的。有什么方法可以获取哪些属性被显式赋值过呢？如果是 CLR 属性，我们可以自己写判断条件，然而依赖项属性没有自己写判断条件的地方。

本文介绍如何获取以及显式赋值过的依赖项属性。

---

需要用到 `DependencyObject.GetLocalValueEnumerator()` 方法来获得一个可以遍历所有依赖项属性本地值。

```csharp
public static void DoWhatYouLikeByWalterlv(DependencyObject dependencyObject)
{
    var enumerator = dependencyObject.GetLocalValueEnumerator();
    while (enumerator.MoveNext())
    {
        var entry = enumerator.Current;
        var property = entry.Property;
        var value = entry.Value;
        // 在这里使用 property 和 value。
    }
}
```

这里的 `value` 可能是 `MarkupExtension` 可能是 `BindingExpression` 还可能是其他一些可能延迟计算值的提供者。因此，你不能在这里获取到常规方法获取到的依赖项属性的真实类型的值。

但是，此枚举拿到的所有依赖项属性的值都是此依赖对象已经赋值过的依赖项属性的本地值。如果没有赋值过，将不会在这里的遍历中出现。

---

**参考资料**

- [Dependency properties overview - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/wpf/advanced/dependency-properties-overview)

