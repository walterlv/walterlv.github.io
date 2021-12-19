---
title: "在 WPF 中获取一个依赖对象的所有依赖项属性"
date: 2019-09-12 11:24:33 +0800
tags: wpf dotnet csharp
position: knowledge
permalink: /posts/wpf-get-all-dependency-properties.html
---

本文介绍如何在 WPF 中获取一个依赖对象的所有依赖项属性。

---

<div id="toc"></div>

## 通过 WPF 标记获取

```csharp
public static IEnumerable<DependencyProperty> EnumerateDependencyProperties(object element)
{
    if (element is null)
    {
        throw new ArgumentNullException(nameof(element));
    }

    MarkupObject markupObject = MarkupWriter.GetMarkupObjectFor(element);
    if (markupObject != null)
    {
        foreach (MarkupProperty mp in markupObject.Properties)
        {
            if (mp.DependencyProperty != null)
            {
                yield return mp.DependencyProperty;
            }
        }
    }
}

public static IEnumerable<DependencyProperty> EnumerateAttachedProperties(object element)
{
    if (element is null)
    {
        throw new ArgumentNullException(nameof(element));
    }

    MarkupObject markupObject = MarkupWriter.GetMarkupObjectFor(element);
    if (markupObject != null)
    {
        foreach (MarkupProperty mp in markupObject.Properties)
        {
            if (mp.IsAttached)
            {
                yield return mp.DependencyProperty;
            }
        }
    }
}
```

## 通过设计器专用方法获取

本来 .NET 中提供了一些专供设计器使用的类型 `TypeDescriptor` 可以帮助设计器找到一个类型或者组件的所有可以设置的属性，不过我们也可以通过此方法来获取所有可供使用的属性。

下面是带有重载的两个方法，一个传入类型一个传入实例。

```csharp
/// <summary>
/// 获取一个对象中所有的依赖项属性。
/// </summary>
public static IEnumerable<DependencyProperty> GetDependencyProperties(object instance)
    => TypeDescriptor.GetProperties(instance, new Attribute[] { new PropertyFilterAttribute(PropertyFilterOptions.All) })
        .OfType<PropertyDescriptor>()
        .Select(x => DependencyPropertyDescriptor.FromProperty(x)?.DependencyProperty)
        .Where(x => x != null);

/// <summary>
/// 获取一个类型中所有的依赖项属性。
/// </summary>
public static IEnumerable<DependencyProperty> GetDependencyProperties(Type type)
    => TypeDescriptor.GetProperties(type, new Attribute[] { new PropertyFilterAttribute(PropertyFilterOptions.All) })
        .OfType<PropertyDescriptor>()
        .Select(x => DependencyPropertyDescriptor.FromProperty(x)?.DependencyProperty)
        .Where(x => x != null);
```

---

**参考资料**

- [wpf - How to enumerate all dependency properties of control? - Stack Overflow](https://stackoverflow.com/a/26367132/6233938)
- [Getting list of all dependency/attached properties of an Object](https://social.msdn.microsoft.com/Forums/vstudio/en-US/580234cb-e870-4af1-9a91-3e3ba118c89c/getting-list-of-all-dependencyattached-properties-of-an-object?forum=wpf)

