---
title: "仅反射加载（ReflectionOnlyLoadFrom）的 .NET 程序集，如何反射获取它的 Attribute 元数据呢？"
publishDate: 2019-02-26 21:28:08 +0800
date: 2019-03-04 22:14:26 +0800
categories: dotnet csharp
position: knowledge
---

平时我们获取一个程序集或者类型的 `Attribute` 是非常轻松的，只需要通过 `GetCustomAttribute` 方法就能拿到实例然后获取其中的值。但是，有时我们仅为反射加载一些程序集的时候，获取这些元数据就不那么简单了，因为我们没有加载目标程序集中的类型。

本文介绍如何为仅反射加载的程序集读取 Attribute 元数据信息。

---

<div id="toc"></div>

## 仅反射加载一个程序集

使用 `ReflectionOnlyLoadFrom` 可以仅以反射的方式加载一个程序集。

```csharp
var extensionFilePath = @"C:\Users\walterlv\Desktop\Walterlv.Extension.dll";
var assembly = Assembly.ReflectionOnlyLoadFrom(extensionFilePath);
```

## 获取程序集的 Attribute（例如获取程序集版本号）

`Assembly.GetCustomAttributesData()` 得到的是一个 `CustomAttributeData` 的列表，而这个列表中的每一项都与普通反射中拿到的特性集合不同，这里拿到的只是特性的信息（以下循环中的 `data` 变量）。

`CustomAttributeData` 中有 `AttributeType` 属性，虽然此属性是 `Type` 类型的，但是实际上它只会是 `RuntimeType` 类型，而不会是真实的 `Attribute` 的类型（因为不能保证宿主程序域中已经加载了那个类型）。

```csharp
var customAttributesData = assembly.GetCustomAttributesData();
foreach (CustomAttributeData data in customAttributesData)
{
    // 这里可以针对每一个拿到的慝的信息进行操作。
}
```

比如我们要获取这个程序集的版本号，正常我们写 `assembly.GetCustomAttribute<AssemblyFileVersionAttribute>().Version`，但是这里我们无法生成 `AssemblyFileVersionAttribute` 的实例，我们只能这么写：

```csharp
var versionString = assembly.GetCustomAttributesData()
    .FirstOrDefault(x => x.AttributeType.FullName == typeof(AssemblyFileVersionAttribute).FullName)
    ?.ConstructorArguments[0].Value as string ?? "0.0";
var version = new Version(versionString);
```

代码解读是这样的：

1. 我们从拿到的所有的 `Attribute` 元数据中找到第一个名称与 `AssemblyFileVersionAttribute` 相同的数据；
1. 从数据的构造函数参数中找到传入的参数值，而这个值就是我们定义 `AssemblyFileVersionAttribute` 时传入的参数的实际值。

因为我们知道 `AssemblyFileVersionAttribute` 的构造函数只有一个，所以我们确信可以从第一个参数中拿到我们想要的值。

顺便一提，我们使用 `AssemblyFileVersionAttribute` 而不是使用 `AssemblyVersionAttribute` 是因为使用 .NET Core 新格式（基于 Microsoft.NET.Sdk）编译出来的程序集默认是不带 `AssemblyVersionAttribute` 的。详见：[语义版本号（Semantic Versioning） - walterlv](/post/semantic-version)。

---

**参考资料**

- [CustomAttributeData Class (System.Reflection) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/system.reflection.customattributedata)
- [c# - How to get custom attributes from an assembly that is not (really) loaded - Stack Overflow](https://stackoverflow.com/q/1459565/6233938)
- [c# - Get custom attribute data from assembly file and unlock it afterwise - Stack Overflow](https://stackoverflow.com/q/37420518/6233938)
