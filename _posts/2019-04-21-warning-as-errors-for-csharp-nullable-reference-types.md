---
title: "C# 可空引用类型 NullableReferenceTypes 更强制的约束：将警告改为错误 WarningsAsErrors"
date: 2019-04-21 20:16:56 +0800
categories: csharp msbuild
position: problem
---

程序员不看警告！

于是 C# 8.0 带来的可空引用类型由于默认以警告的形式出现，所以实际上约束力非常弱。

本文将把 C# 8.0 的可空引用类型警告提升为错误，以提高约束力。

---

<div id="toc"></div>

## 启用可空引用类型

你需要先在你的项目中启用可空引用类型的支持，才能修改警告到错误：

- [C# 8.0 如何在项目中开启可空引用类型的支持 - 吕毅](/post/how-to-enable-nullable-reference-types.html)。

## 项目属性

在项目属性中设置是比较快捷直观的方法。

在项目上右键属性，打开“生成”标签。

![项目属性](/static/posts/2019-04-21-19-40-24.png)

在这里，可以看到“将警告视为错误”一栏：

- 无
- 所有
- 特定警告

可以看到默认选中的是“特定警告”且值是 `NU1605`。

NU 是 NuGet 中发生的错误或者警告的前缀，`NU1605` 是大家可能平时经常见到的一个编译错误“检测到包降级”。关于这个错误的信息可以阅读官网：[NuGet Warning NU1605 - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/reference/errors-and-warnings/nu1605)，本文不需要说明。

于是，我们将我们需要视为错误的错误代码补充到后面就可以，以分号分隔。

```
NU1605;CS8600;CS8602;CS8603;CS8625
```

记得在改之前，把前面的配置从“活动”改为“所有配置”，这样你就不用改完之后仅在 Debug 生效，完了还要去 Release 配置再改一遍。

![改为所有配置](/static/posts/2019-04-21-19-46-46.png)

## WarningsAsErrors

前面使用属性面板指定时，有一个奇怪的默认值。实际上我们直接修改将固化这个默认值，这不利于将来项目跟随 Sdk 或者 NuGet 包的升级。

所以，最好我们能直接修改到项目文件，以便更精细地控制这个属性的值。

在上一节界面中设置实际上是生成了一个属性 `WarningsAsErrors`。那么我们现在修改 `WarningsAsErrors` 属性的值，使其拼接之前的值：

```diff
    <Project Sdk="Microsoft.NET.Sdk">
    
      <PropertyGroup>
        <OutputType>Exe</OutputType>
        <TargetFramework>netcoreapp3.0</TargetFramework>
        <LangVersion>8.0</LangVersion>
        <NullableContextOptions>enable</NullableContextOptions>
++      <WarningsAsErrors>$(WarningsAsErrors);CS8600;CS8602;CS8603;CS8625</WarningsAsErrors>
      </PropertyGroup>
    
    </Project>
```

这句话的含义是先获取之前的值，将其放到我们要设置的值的前面。这样可以跟随 Sdk 或者 NuGet 包的升级而更新此默认值。

## 各项编译错误或者警告的含义

我们刚刚设置的各项警告转错误的含义如下。

### `CS8600`

将 null 文本或可能的 null 值转换为非 null 类型。

```csharp
string walterlv = null;
```

![CS8600](/static/posts/2019-04-21-20-07-16.png)

### `CS8602`

null 引用可能的取消引用。

```csharp
// 当编译器判定 walterlv 可能为 null 时才会有此警告。
var value = walterlv.ToString();
```

![CS8602](/static/posts/2019-04-21-20-08-52.png)

### `CS8603`

可能的 null 引用返回。

```csharp
string Foo()
{
    return null;
}
```

![CS8603](/static/posts/2019-04-21-20-12-35.png)

### `CS8625`

无法将 null 文本转换为非 null 引用或无约束类型参数。

```csharp
void Foo(string walterlv = null)
{
}
```

![CS8625](/static/posts/2019-04-21-20-10-39.png)

---

**参考资料**

- [Switch to errors instead of warnings for nullable reference types in C# 8 - tabs ↹ over ␣ ␣ ␣ spaces by Jiří {x2} Činčura](https://www.tabsoverspaces.com/233764-switch-to-errors-instead-of-warnings-for-nullable-reference-types-in-csharp-8)
- [NuGet Warning NU1605 - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/reference/errors-and-warnings/nu1605)
