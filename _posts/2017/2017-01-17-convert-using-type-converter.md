---
layout: post
title: "利用 TypeConverter，转换字符串和各种类型只需写一个函数"
date_published: 2017-01-17 18:13:00 +0800
date: 2018-04-23 07:31:32 +0800
categories: dotnet
permalink: /dotnet/2017/01/17/convert-using-type-converter.html
keywords: dotnet typeconverter
description: 使用 TypeConverter 实现字符串转各种类型。
---

*本文代码基于 .NET Framework 实现。*

本来只想进行简单的配置存储的，不料发现 .NET 的基本类型多达十多种。于是，如果写成下面这样，那代码可就太多了哦：

---

```csharp
// 注：`Configurator`是我的配置类，用于读写字符串的。
public static int GetInt32(this Configurator config, string key)
{
    return int.Parse(config[key], CultureInfo.InvariantCulture);
}
public static void SetInt32(this Configurator config, string key, int value)
{
    config[key] = value.ToString(CultureInfo.InvariantCulture);
}

public static bool GetBoolean(this Configurator config, string key)
{
    return bool.Parse(config[key]);
}
// 还没完，这才 1.5 种而已。
// ……
```

## 尝试使用泛型

这些方法都比较相似，于是自然而然想到了**泛型**，所以写出了这段代码：

```csharp
public static T GetValue<T>(this Configurator config, string key) where T : struct
{
    var @string = config[key];
    // T value = 某种通用的转换(@string); // 问题来了，这里该怎么写？
    return value;
}
```

这里就郁闷了，因为虽然方法内部的实现都长得差不多，但他们之间除了名字相同之外（比如 `Parse`和`ToString`），并没有什么联系；这样，便不能使用统一的接口或者抽象类等等来调用。

## 尝试使用反射

既然名字类似，那自然又能想到反射。可是，拥有 `Parse` 的类型并不多，`ToString` 中能传入 `CultureInfo.InvariantCulture` 且参数顺序保持一致的类型也少的可怜。于是，反射只能保证写得出来代码，却并不能保证多种类型的支持。

另外想到一点，`Int32` 类型的 `TryParse` 中有 `out` 关键字修饰的参数，反射能否支持呢？[StackOverflow 上找到了答案](https://stackoverflow.com/questions/2438065/c-sharp-reflection-how-can-i-invoke-a-method-with-an-out-parameter)：

> You invoke a method with an out parameter via reflection just like any other method. The difference is that the returned value will be copied back into the parameter array so you can access it from the calling function.

> ```csharp
> object[] args = new object[] { address, request };
> _DownloadDataInternal.Invoke(this, args);
> request = (WebRequest)args[1];
> ```

意思是说，这在反射中不用作什么考虑，传入的参数数组天然就已经支持了 `out` 关键字。

## 尝试寻找更通用的方案

在 Google 上继续漫游，在 StackOverflow 上发现这篇讨论：[How to convert string to any type](https://stackoverflow.com/questions/2922855/how-to-convert-string-to-any-type)。

最高票答案给出的回复是：

> ```csharp
> using System.ComponentModel;
> 
> TypeConverter typeConverter = TypeDescriptor.GetConverter(propType);
> object propValue = typeConverter.ConvertFromString(inputValue);
> ```

这可打开了思路，原来 .NET Framework 内部已经有了这种转换机制和相关的方法。于是用这种方法修改我的方法，成了这样子：

```csharp
public static T GetValue<T>(this Configurator config, string key) where T : struct
{
    var @string = config[key];
    var td = TypeDescriptor.GetConverter(typeof (T));
    return (T) td.ConvertFromInvariantString(@string);
}
public static void SetValue<T>(this Configurator config, string key, T value) where T : struct
{
    var td = TypeDescriptor.GetConverter(typeof (T));
    var @string = td.ConvertToInvariantString(value);
    config[key] = @string;
}
```

编写单元测试发现，这种方法能够支持的类型真的非常多，`byte` `char` `short` `ushort` `int` `uint` `long` `ulong` `bool` `float` `double` `decimal` `DateTime` `Point` `Vector` `Size` `Rect` `Matrix` `Color`……

看看代码中 `TypeDescriptor.GetConverter` 的返回值发现是 `TypeConverter` 类型的，而我们在 WPF 的 xaml 中编写自定义类型时，经常需要执行此类型的 `TypeConverter`。凭这一点可以大胆猜测，xaml 中能够通过字符串编写的类型均可以通过这种方式进行转换。然而，目前我还为对此进行验证。

## 验证猜想

1. 去 [https://referencesource.microsoft.com/](https://referencesource.microsoft.com/#System/compmod/system/componentmodel/TypeDescriptor.cs,99bfa42a7de642f9) 看 [`TypeDescriptor.GetConverter`](https://referencesource.microsoft.com/#System/compmod/system/componentmodel/TypeDescriptor.cs,99bfa42a7de642f9) 的源码（[点击进入](https://referencesource.microsoft.com/#System/compmod/system/componentmodel/TypeDescriptor.cs,99bfa42a7de642f9)）。
2. 尝试自定义一个类型，在类型上标记 `TypeConverter`，并对此类进行测试。
