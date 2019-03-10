---
title: ".NET/C# 项目如何优雅地设置条件编译符号？"
publishDate: 2018-12-24 22:17:53 +0800
date: 2018-12-25 08:15:22 +0800
categories: csharp dotnet visualstudio msbuild
position: starter
---

条件编译符号指的是 Conditional Compilation Symbols。你可以在 Visual Studio 的项目属性中设置，也可以直接在项目文件中写入 `DefineConstants` 属性。

不过对于不同种类的项目，我建议使用不同的设置方法。本文将介绍如何设置条件编译符。

---

对于新旧格式的差别或者迁移，可以查看我的其他博客：

- [理解 C# 项目 csproj 文件格式的本质和编译流程](/post/understand-the-csproj.html)
- [将 WPF、UWP 以及其他各种类型的旧 csproj 迁移成基于 Microsoft.NET.Sdk 的新 csproj](/post/introduce-new-style-csproj-into-net-framework.html)

<div id="toc"></div>

## 新格式推荐：在 csproj 文件中设置

在项目中设置 `<DefineConstants />` 属性：

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFrameworks>netcoreapp2.1;net47</TargetFrameworks>
    <DefineConstants>$(DefineConstants);WALTERLV</DefineConstants>
  </PropertyGroup>

</Project>
```

这里我使用字符串拼接的方式 `$(DefineConstants);WALTERLV` 来设置，这样可以把预设的那些条件编译符号保留，比如通常 Visual Studio 会帮你生成的 `TRACE` 条件编译符。

但即便你不做这种拼接也不用担心。因为基于框架或平台的条件编译符号是自动设置的。例如 `NETCOREAPP2_1` 等都是在你指定 `DefineConstants` 之后自动设置的。以下是 Microsoft.NET.Sdk 中的部分源码，可以证明这一点：

```xml
<PropertyGroup Condition="'$(DisableImplicitConfigurationDefines)' != 'true'">
  <ImplicitConfigurationDefine>$(Configuration.ToUpperInvariant())</ImplicitConfigurationDefine>
  
  <!-- Replace dashes and periods in the configuration with underscores.  This makes it more likely that
       the resulting compilation constant will be a valid C# conditional compilation symbol.  As the set
       of characters that aren't allowed is essentially open-ended, there's probably not a good way to
       fully sanitize the Configuration in MSBuild evaluation.  If the resulting string still isn't a
       valid conditional combilation symbol, then the compiler will generate the following error and
       the define will be ignored:
          warning MSB3052: The parameter to the compiler is invalid, '/define:0BAD_DEFINE' will be ignored.
       -->
  
  <ImplicitConfigurationDefine>$(ImplicitConfigurationDefine.Replace('-', '_'))</ImplicitConfigurationDefine>
  <ImplicitConfigurationDefine>$(ImplicitConfigurationDefine.Replace('.', '_'))</ImplicitConfigurationDefine>
  <DefineConstants>$(DefineConstants);$(ImplicitConfigurationDefine)</DefineConstants>
</PropertyGroup>
<PropertyGroup>
  <DefineConstants>$(DefineConstants);$(ImplicitFrameworkDefine)</DefineConstants>
</PropertyGroup>
```

## 旧格式推荐：在 Visual Studio 项目属性中设置

你可以在项目属性的“生成”页中找到条件编译符号的设置。

我自己用的 Visual Studio 是英文版的，但是也感谢小伙伴 [林德熙](https://blog.lindexi.com/) 帮我截了一张中文版的图。

![Conditional Compilation Symbols](/static/posts/2018-12-24-21-34-59.png)  

![条件编译符号](/static/posts/2018-12-24-21-34-54.png)

你需要特别注意：

- 设置条件编译符号需要在各种配置下都设置，因为各种配置都是不一样的；具体来说是 Debug 下要设，Release 下也要设，x86 下要设，x64 下也要设。

## 关于配置（Configuration）和条件编译符号（Conditional Compilation Symbols）

你可能在你的代码中同时看到 Pascal 命名规则的 Debug 和全部大写的 DEBUG，或者看到 Release 和 RELEASE。这是两个不同的概念。

Debug 和 Release 的名称来自于配置（Configuration）。你的项目有 Debug 配置和 Release 配置，或者你自己定义的其他配置。你的项目编译过程默认根据 Debug 和 Release 配置做了很多不同的编译选项。例如 Debug 下会禁用优化而 Release 下会开启优化。

而 DEBUG 和 RELEASE 这样的全大写名称来自于条件编译符号（Conditional Compilation Symbols），是真正在 C# 代码中使用的符号。而这全大写符号的定义是分别在 Debug 和 Release 配置下设置了不同的值来实现的。

所以这两个是不同的概念，不要弄混淆了。

同时这也带来了一些命名建议：

1. 条件编译符号使用全大写命名
    - 例如：DEBUG, RELEASE, NET47, NETCOREAPP2_1
1. 配置使用 Pascal 命名
    - 例如：Debug, Release
