---
title: "使用 Microsoft.Net.Compilers 在旧版本的 Visual Studio 2013/2015/2017 中开启新的 C# 7.x 和 C# 8 语法"
publishDate: 2018-10-15 15:23:45 +0800
date: 2019-03-23 10:30:03 +0800
tags: visualstudio csharp
permalink: /posts/add-lastest-csharp-support-for-old-visual-studio.html
---

新版本的 C# 特性需要新版本的 Visual Studio 的支持。不过，如果你不介意修改项目的话，你也能在低版本的 Visual Studio 中获得高版本的 C# 语言支持了。

而使用 Microsoft.Net.Compilers 这款 NuGet 包就可以做到。

---

<div id="toc"></div>

## 不同 Visual Studio 原生支持的 C# 版本

Visual Studio 每一次的重大发布都带来新的 C# 版本（至少在 Visual Studio 2017 之前是这样），于是通常情况下如果你使用了旧版本的 Visual Studio，还打不开编写了新 C# 语法的项目呢！

你可以阅读另一篇文章了解不同 Visual Studio 版本原生带来的 C# 版本。

[各个 C# 版本的主要特性、发布日期和发布方式（C# 1.0 - 7.3） - 吕毅](/post/csharp-version-histories)

## 引入 Microsoft.Net.Compilers

不过，伴随着 .NET Core 生态的崛起和 NuGet 的逐渐广泛的使用，微软发布了 [Microsoft.Net.Compilers](https://www.nuget.org/packages/Microsoft.Net.Compilers/) 来解决跨 Visual Studio 版本的 C# 语言版本兼容问题了。

Microsoft.Net.Compilers 首次发布于 2015 年 7 月。

官方对齐的描述是：

> .NET Compilers package.  
> Referencing this package will cause the project to be built using the specific version of the C# and Visual Basic compilers contained in the package, as opposed to any system installed version.

这是一个 .NET 的编译器包，无论你系统中安装的是什么版本的 C# 编译器，使用此包都可以强制项目使用某个特定版本的 C# 编译器。

## 使用 Microsoft.Net.Compilers

### 第一步：安装 .NET Framework 4.6 或以上

Microsoft.Net.Compilers 对项目本身没有什么要求，但需要编译项目的计算机上安装有完整功能的 .NET Framework 4.6 及以上版本。

> This package can be used to compile code targeting any platform, but can only be run using the desktop .NET 4.6+ Full Framework.

这是开发者计算机上的事情，不影响产品的 .NET Framework 版本需求。如果你连系统也比较旧，那么安装下最新版本的 .NET Framework 即可。

### 第二步：安装 NuGet 包 Microsoft.Net.Compilers

在你需要编写最新版本 C# 的项目中安装 NuGet 包 Microsoft.Net.Compilers。

### 第三步：编辑项目使用最新版本的 C# 语言

就像普通的项目启用最新版 C# 语言一样，在你的项目的 csproj 的 `PropertyGroup` 中添加以下属性：

```xml
<LangVersion>Latest</LangVersion>
```

如果不知道如何添加，可以阅读 [VisualStudio 使用三个方法启动最新 C# 功能 - 林德熙](https://blog.lindexi.com/post/VisualStudio-%E4%BD%BF%E7%94%A8%E4%B8%89%E4%B8%AA%E6%96%B9%E6%B3%95%E5%90%AF%E5%8A%A8%E6%9C%80%E6%96%B0-C-%E5%8A%9F%E8%83%BD.html)。

### 开始使用最新版本的 C# 特性

你已经可以使用最新版本的 C# 了，而不用关心你本机安装的是哪个版本 —— 即便你是 Visual Studio 2013/2015。

```csharp
class Program
{
   static async Task Main(string[] args)
   {
      Console.WriteLine("Thanks Walterlv!");
      await Task.Delay(5000);
      Console.WriteLine("I got the latest C# version.");
   }
}
```

---

**参考资料**

- [C# : Enabling C# 7.1 on Visual Studio 2015 / 2013 – programmium](https://programmium.wordpress.com/2017/11/13/c-enabling-c-7-1-on-visual-studio-2015-2013/)
- [NuGet Gallery - Microsoft.Net.Compilers](https://www.nuget.org/packages/Microsoft.Net.Compilers/)
- [c# - What is the Purpose of Microsoft.Net.Compilers? - Stack Overflow](https://stackoverflow.com/a/34548597/6233938)
- [Remove dependency of Microsoft.Net.Compilers NuGet Package · Issue #271 · opserver/Opserver](https://github.com/opserver/Opserver/issues/271)

