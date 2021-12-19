---
title: "在 Roslyn/MSBuild 中进行基本的数学运算"
date: 2019-05-11 14:53:09 +0800
tags: msbuild visualstudio roslyn
position: knowledge
permalink: /posts/msbuild-numeric-methods.html
---

在任何一种编程语言中，做基本的数学运算都是非常容易的事情。不过，不知道 .NET 项目的项目文件 csproj 文件中进行数学运算就不像一般的编程语言那样直观了，毕竟这不是一门语言，而只是一种项目文件格式而已。

本文介绍如何在 Roslyn/MSBuild 的项目文件中使用基本的数学运算。

---

<div id="toc"></div>

## Roslyn/MSBuild 中的数学运算

在 MSBuild 中，数学运算需要使用 `MSBuild` 内建的方法调用来实现。

你只需要给 MSBuild 中那些数学计算方法中传入看起来像是数字的属性，就可以真的计算出数字出来。

### 加减乘除模

- `Add` 两个数相加，实现 a + b
- `Subtract` 第一个数减去第二个数，实现 a - b
- `Multiply` 两个数相乘，实现 a * b
- `Divide` 第一个数除以第二个数，实现 a / b
- `Modulo` 第一个数与第二个数取模，实现 a % b

而具体到 MSBuild 中的使用，则是这样的：

```xml
<!-- 计算 5 - 1 的数学运算结果 -->
<Walterlv>$([MSBuild]::Subtract(5, 1))</Walterlv>
```

```xml
<!-- 取出 Walterlv 属性的字符串值，然后计算其长度减去 1，将数学运算结果存入 Walterlv2 属性中 -->
<Walterlv>walterlv is a 逗比</Walterlv>
<Walterlv2>$([MSBuild]::Subtract($(Walterlv.Length), 1))</Walterlv2>
```

## 不要试图在 MSBuild 中使用传统的数学运算符号

不同于一般编程语言可以写的 `+` `-` `*` `/`，如果你直接在项目文件中使用这样的符号来进行数学计算，要么你将得到一个数学运算的字符串，要么你将得到编译错误。

例如，如果你在你的项目文件中写了下面这样的代码，那么无一例外全部不能得到正确的数学运算结果。

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>netcoreapp3.0</TargetFramework>

    <!-- 这个属性将得到一个 “1 + 1” 字符串 -->
    <Walterlv>1 + 1</Walterlv>

    <!-- 无法编译此属性 -->
    <!-- 无法计算表达式“"1 + 1".Length + 1”。未找到方法“System.String.Length + 1” -->
    <Walterlv2>$(Walterlv.Length + 1)</Walterlv2>

    <!-- 这个属性将得到一个 “5 + 1” 字符串 -->
    <Walterlv3>$(Walterlv.Length) + 1</Walterlv3>

  </PropertyGroup>

</Project>
```

---

**参考资料**

- [Property Functions - Visual Studio 2015 - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/property-functions#BKMK_PropertyFunctions)

