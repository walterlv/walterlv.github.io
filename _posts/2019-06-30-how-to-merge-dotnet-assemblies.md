---
title: ".NET 将多个程序集合并成单一程序集的四种方法"
date: 2019-06-30 11:30:59 +0800
categories: dotnet csharp
position: knowledge
---

编写 .NET 程序的时候，我们经常会在项目的输出目录下发现一大堆的文件。除了我们项目自己生成的程序集之外，还能找到这个项目所依赖的一大堆依赖程序集。有没有什么方法可以把这些依赖和我们的程序集合并到一起呢？

本文介绍四种将程序集和依赖打包合并到一起的方法，每一种方法都有其不同的原理和优缺点。我将介绍这些方法的原理并帮助你决定哪种方法最适合你想要使用的场景。

---

<div id="toc"></div>

## 四种方法

目前我已知的将 .NET 程序集与依赖合并到一起的方法有下面四种：

1. 使用 .NET Core 3.0 自带的合并依赖的方法
1. 使用 Fody
1. 使用 SourceYard 源代码包
1. 使用 ILMerge（微软所写）或者 ILRepack（基于 Mono.Ceil）
1. 其他方法

如果你还知道有其他的方法，欢迎评论指出，非常感谢！

上面的第五种方法我也会做一些介绍，要么是因为无法真正完成任务或者适用场景非常有限，要么是其原理我还不理解，因此只进行简单介绍。

### 使用 .NET Core 3.0 自带的合并依赖的方法

.NET Core 3.0 自 Preview 5 开始，增加了发布成单一 exe 文件的功能。

在你的项目文件中增加下面的两行可以开启此功能：

```diff
    <Project Sdk="Microsoft.NET.Sdk">
    
      <PropertyGroup>
        <OutputType>Exe</OutputType>
        <TargetFramework>netcoreapp3.0</TargetFramework>
++      <RuntimeIdentifier>win10-x64</RuntimeIdentifier>
++      <PublishSingleFile>true</PublishSingleFile>
      </PropertyGroup>
    
    </Project>
```

第一行 `RuntimeIdentifier` 一定需要指定，因为发布的单一文件是特定于架构的。这里，我们指定了 win10-x64，你也可以指定为其他的值。可以使用的值你可以在这篇文章中查询到：

- [.NET Core Runtime IDentifier (RID) catalog - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/core/rid-catalog)

第二行 `PublishSingleFile` 即开启发布时单一文件的功能。这样，你在发布你的程序的时候可以得到一个单一的可执行程序。发布一个 .NET Core 项目的方法是在命令行中输入：

```powershell
dotnet publish
```

当然，如果你没有更改任何你的项目文件（没有增加上面的那两行），那么你在使用发布命令的时候就需要把这两个属性再增加上。因此完整的发布命令是下面这样的：

```powershell
dotnet publish -r win10-x64 /p:PublishSingleFile=true
```

这里的 `-r` 就等同于在项目中指定 `RuntimeIdentifier` 持续。这里的 `/p` 是在项目中增加一个属性，而增加的属性名是 `PublishSingleFile`，增加的属性值是 `true`。

使用 .NET Core 3.0 这种自带的发布单一 exe 的方法会将你的程序的全部文件（包括所有依赖文件，包括非托管程序集，包括各种资源文件）全部打包到一个 exe 中。当运行这个 exe 的时候，会首先将所有这些文件生成到本地计算机中一个临时目录下。只有第一次运行这个 exe 的时候才会生成这个目录和其中的文件，之后的运行是不会再次生成的。

下面说一些 .NET Core 3.0 发布程序集的一点扩展——.NET Core 3.0 中对于发布程序集的三种处理方式可以放在一起使用：

- 裁剪程序集（Assembly Trimmer）
- 提前编译（Ahead-of-Time compilation，通过 crossgen）
- 单一文件打包（Single File Bundling）

关于 .NET Core 3.0 中发布仅一个 exe 的方法、原理和实践，可以参见林德熙的博客：

- [dotnet core 发布只有一个 exe 的方法](https://blog.lindexi.com/post/dotnet-core-%E5%8F%91%E5%B8%83%E5%8F%AA%E6%9C%89%E4%B8%80%E4%B8%AA-exe-%E7%9A%84%E6%96%B9%E6%B3%95.html)

.NET Core 在 GitHub 上开源：

- [.NET Foundation](https://github.com/dotnet)

### 使用 Fody

在你的项目中安装一个 NuGet 包 [Costura.Fody](https://www.nuget.org/packages/Costura.Fody/)。一般来说，安装完之后，你编译的时候就会生成仅有一个 exe 的程序集了。

如果你继续留意，可以发现项目中多了一个 Fody 的专属配置文件 `FodyWeavers.xml`，内容如下：

```xml
<?xml version="1.0" encoding="utf-8" ?>
<Weavers>
    <Costura/>
</Weavers>
```

仅仅到此为止你已经足够利用 Fody 完成程序集的合并了。

但是，如果希望对 Fody 进行更精细化的配置，可以阅读叶洪的博客：

- [.NET 合并程序集（将 dll 合并到 exe 中） - Iron 的博客 - CSDN博客](https://blog.csdn.net/iron_ye/article/details/83961266)

Fody 在 GitHub 上开源：

- [Fody/Fody: Extensible tool for weaving .net assemblies](https://github.com/Fody/Fody)

### 使用 SourceYard 源代码包

SourceYard 源代码包在程序集合并上是另辟蹊径的一种合并方式。它不能帮助你将所有的依赖全部合并，但足以让你在发布一些简单应用的时候不至于引入大量的依赖。

例如，你可以考虑新建一个项目，然后安装下面的 NuGet 包：

- [lindexi.src.MacAddress.Source](https://www.nuget.org/packages/lindexi.src.MacAddress.Source/)

安装完成之后，你就可以在你的项目中使用到此 NuGet 包为你带来的获取 MAC 地址的工具类了。

```csharp
using System;
using lindexi.src;

namespace Walterlv.Demo
{
    internal static class Program
    {
        static void Main()
        {
            var macList = MacAddress.GetActiveMacAddress();
            foreach (var mac in macList)
            {
                Console.WriteLine(mac);
            }
        }
    }
}
```

编译完你的项目，你会发现你的项目没有携带任何依赖。你安装的 NuGet 包并没有成为你的依赖，反而成为你正在编译的程序集的一部分。

如果你要制作一个像上面那样的源代码包，只需要在你要制作 NuGet 包的项目安装上 [dotnetCampus.SourceYard](https://www.nuget.org/packages/dotnetCampus.SourceYard/0.1.7213-alpha)，在你打包成 NuGet 包的时候，就会生成一个普通的 NuGet 包以及一个 *.Source.nupkg 的源代码包。将源代码包上传到 nuget.org 上，其他人便可以安装你制作的源代码包了。

关于如何使用 SourceYard 制作一个源代码包的方法可以阅读林德熙的博客：

- [SourceYard 制作源代码包](https://blog.lindexi.com/post/sourceyard-%E5%88%B6%E4%BD%9C%E6%BA%90%E4%BB%A3%E7%A0%81%E5%8C%85)

关于能够做出源代码包的原理，可以阅读我的博客：

- 入门篇：[将 .NET Core 项目打一个最简单的 NuGet 源码包，安装此包就像直接把源码放进项目一样](/post/the-simplest-way-to-pack-a-source-code-nuget-package.html)
- 进阶篇：[从零开始制作 NuGet 源代码包（全面支持 .NET Core / .NET Framework / WPF 项目）](/post/build-source-code-package-for-wpf-projects.html)

SourceYard 在 GitHub 上开源：

- [dotnet-campus/SourceYard: Add a NuGet package only for dll reference? By using dotnetCampus.SourceYard, you can pack a NuGet package with source code. By installing the new source code package, all source codes behaviors just like it is in your project.](https://github.com/dotnet-campus/SourceYard)

### 使用 ILMerge 或者 ILRepack 等工具

### 其他方法

#### 使用 dnSpy

#### 使用 Warp

- [dgiagio/warp: Create self-contained single binary applications](https://github.com/dgiagio/warp)

## 各种方法的原理和使用场景比较

---

**参考资料**