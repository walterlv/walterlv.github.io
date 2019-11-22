---
title: "C# 8.0 如何在项目中开启可空引用类型的支持"
publishDate: 2019-04-21 19:22:00 +0800
date: 2019-11-22 12:37:42 +0800
categories: csharp msbuild visualstudio
position: starter
---

C# 8.0 引入了可为空引用类型和不可为空引用类型。由于这是语法级别的支持，所以比传统的契约式编程具有更强的约束力。更容易帮助我们消灭 `null` 异常。

本文将介绍如何在项目中开启 C# 8.0 的可空引用类型的支持。

---

<div id="toc"></div>

## 使用 Sdk 风格的项目文件

如果你还在使用旧的项目文件，请先升级成 Sdk 风格的项目文件：[将 WPF、UWP 以及其他各种类型的旧 csproj 迁移成 Sdk 风格的 csproj - 吕毅](/post/introduce-new-style-csproj-into-net-framework.html)。

本文会示例一个项目文件。

由于现在 C# 8.0 还没有正式发布，所以如果要启用 C# 8.0 的语法支持，需要在项目文件中设置 `LangVersion` 属性为 `8.0` 而不能指定为 `latest` 等正式版本才能使用的值。

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>netcoreapp3.0</TargetFramework>
    <LangVersion>8.0</LangVersion>
  </PropertyGroup>

</Project>
```

## 在项目文件中开启可空引用类型的支持

在项目属性中添加一个属性 `NullableContextOptions`：

```diff
    <Project Sdk="Microsoft.NET.Sdk">

      <PropertyGroup>
        <OutputType>Exe</OutputType>
        <TargetFramework>netcoreapp3.0</TargetFramework>
        <LangVersion>8.0</LangVersion>
++      <Nullable>enable</Nullable>
      </PropertyGroup>

    </Project>
```

此属性可被指定为以下四个值之一：

- `enable`
    - 所有引用类型均被视为不可为空，启用所有 null 相关的警告。
- `warnings`
    - 不会判定类型是否可空或不可为空，但启用局部范围内的 null 相关的警告。
- `annotations`
    - 所有引用类型均被视为不可为空，但关闭 null 相关的警告。
- `disable`
    - 与 8.0 之前的 C# 行为相同，即既不认为类型不可为空，也不启用 null 相关的警告。


这五个值其实是两个不同维度的设置排列组合之后的结果：

- 可为空注释上下文
    - 用于告知编译器是否要识别一个类型的引用可为空或者不可为空。
- 可为空警告上下文
    - 用于告知编译器是否要启用 null 相关的警告，以及警告的级别。

当仅仅启用警告上下文而不开启可为空注释上下文，那么编译器将仅仅识别局部变量中明显可以判定出对 null 解引用的代码，而不会对包括变量或者参数定义部分进行分析。

### 可为空注释（Annotation）上下文

当启动可为空注释上下文后，C# 编译器会将所有的类型引用变量识别为以下种类：

- 不可为空
- 可为空
- 未知

于是，当你写出 `string walterlv` 的变量定义，那么 `walterlv` 就是不可为空的引用类型；当写出 `string? walterlv` 的变量定义，那么 `walterlv` 就是可为空的引用类型。

对于类型参数来说，可能不能确定是否是可空引用类型，那么将视为“未知”。

当关闭可为空注释上下文后，C# 编译器会将所有类型引用变量识别为以下种类：

- 无视

于是，无论你使用什么方式顶一个一个引用类型的变量，C# 编译器都不会判定这到底是不是一个可为空还是不可为空的引用类型。

### 可为空警告上下文

例如以下代码：

```csharp
string walterlv = null;
var value = walterlv.ToString();
```

在将 `null` 赋值给 `walterlv` 变量时，是不会引发程序异常的；而在后面调用了 `ToString()` 方法则会引发程序异常。

安全性区别就在这里。安全性警告仅会将编译期间可识别到可能运行时异常的代码进行警告（即下面的 `walterlv.ToString()`），而不会对没有异常的代码进行警告。如果是 `enable`，那么将 `null` 赋值给 `walterlv` 变量的那一句也会警告。

## 在源代码文件中开启可空引用类型的支持

除了在项目文件中全局开启可空引用类型的支持，也可以在 C# 源代码文件中覆盖全局的设定。

- `#nullable enable`: 在源代码中启用可空引用类型并给出警告。
- `#nullable disable`: 在源代码中禁用可空引用类型并关闭警告。
- `#nullable restore`: 还原这段代码中可空引用类型和可空警告。
- `#nullable disable warnings`: 在源代码中禁用可空警告。
- `#nullable enable warnings`: 在源代码中启用可空警告。
- `#nullable restore warnings`: 还原这段代码中可空警告。
- `#nullable disable annotations`: 在源代码中禁用可空引用类型。
- `#nullable enable annotations`: 在源代码中启用用可空引用类型。
- `#nullable restore annotations`: 还原这段代码中可空引用类型。

## 早期版本的属性

在接近正式版的时候，开关才是 `Nullable`，而之前是 `NullableContextOptions`，但在 Visual Studio 2019 Preview 2 之前，则是 `NullableReferenceTypes`。现在，这些旧的属性已经废弃。

<!-- 早期 `NullableContextOptions` 属性可被指定为以下五个值之一：

- `enable`
    - 所有引用类型均被视为不可为空，启用所有 null 相关的（Nullability）警告。
- `disable`
    - 无视所有引用类型是否为空，当设为此选项，则跟此前版本的 C# 行为一致。
- `safeonly`
    - 所有引用类型均被视为不可为空，启用所有安全性的 null 相关警告。
- `warnings`
    - 无视所有引用类型是否为空，但启用所有 null 相关的警告。
- `safeonlywarnings`
    - 无视所有引用类型是否为空，但启用所有安全性的 null 相关警告。

当前现在不用这么复杂了。

早期在项目中还可以通过 pragma 设置：

- `#pragma warning disable nullable`
- `#pragma warning enable nullable`
- `#pragma warning restore nullable`
- `#pragma warning safeonly nullable` -->

---

**参考资料**

- [Nullable reference types - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/nullable-references)
- [c# - What is the difference between NullableContextOptions and NullableReferenceTypes? - Stack Overflow](https://stackoverflow.com/a/54855437/6233938)
