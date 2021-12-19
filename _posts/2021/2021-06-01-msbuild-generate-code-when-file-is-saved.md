---
title: "编写你的专属 MSBuild C# 代码生成器：在保存文件时自动实时生成你的代码"
date: 2021-06-01 20:34:17 +0800
tags: dotnet msbuild csharp
position: knowledge
---

我之前的博客中有介绍如何在项目中生成额外的代码，也有介绍制作一个生成代码的 NuGet 包。而本文是在此基础上更进一步，可以让生成代码变成实时的；更准确的说，是在保存文件时即生成代码，而无需完整编译一次项目。

---

一天，头像全白昵称空格的“wuweilai”童鞋问我为什么 GRPC 的 NuGet 包能自动在 .proto 文件保存时更新生成的代码，怎么才能做到像它那样。然后，我研究了下 [Grpc.Tools](https://www.nuget.org/packages/Grpc.Tools/) 包里的代码，外加跟他反复讨论，摸清了自动生成代码的方法。

<div id="toc"></div>

## 背景知识

本文的知识非常简单，如果只是希望知道怎么实时生成代码的话，把本文后面的代码复制一下就可以了。但如果希望完整了解基于 MSBuild 生成代码的原理，你可以需要了解以下知识或教程：

- [理解 C# 项目 csproj 文件格式的本质和编译流程](/post/understand-the-csproj.html)
- [如何创建一个基于命令行工具的跨平台的 NuGet 工具包](/post/create-a-cross-platform-command-based-nuget-tool.html)
- [如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包](/post/create-a-cross-platform-msbuild-task-based-nuget-tool.html)

## 准备项目

我们创建一个全新的项目，用来了解如何实时生成代码。

如下图，就是个普通的控制台应用程序。我额外生成了一个 Test.txt 文件，里面什么也没有。我们即将实现的是：**在保存 Test.txt 文件时，会立即执行我们的编译流程**，这样，我们便能基于 Test.txt 来实时生成一些代码。

![一个简单的项目结构](/static/posts/2021-06-01-19-54-27.png)

## 最简单的自动生成代码的逻辑

现在，我们打开项目 csproj 文件（双击项目名称即可打开编辑这个文件）：

```diff
  <Project Sdk="Microsoft.NET.Sdk">

    <PropertyGroup>
      <OutputType>Exe</OutputType>
      <TargetFramework>net5.0</TargetFramework>
    </PropertyGroup>

+   <!-- 将项目中的所有 txt 文件搜集起来，用 WalterlvDemoFile 集合存起来。-->
+   <ItemGroup>
+     <WalterlvDemoFile Include="**\*.txt" Generator="MSBuild:Compile" />
+   </ItemGroup>

+   <!-- 注册 WalterlvDemoFile 项为一个 Item，这样它的通用属性就能被识别了。 -->
+   <ItemGroup>
+     <AvailableItemName Include="WalterlvDemoFile" />
+   </ItemGroup>

+   <!-- 随便写一个 Target，在编译之前做些什么。 -->
+   <Target Name="WalterlvDemoTarget" BeforeTargets="BeforeCompile">
+     <Exec Command="winver" />
+   </Target>

  </Project>
```

我把新增的代码高亮出来了。如果你想复制到你的项目里，记得去掉行首的所有 `+` 号。

等你复制到项目里之后，试着在 Test.txt 文件里面随便写点什么，然后保存。你会发现……呃……弹出了一个 Windows 版本号窗口……

## 最简代码解读

1. 我们定义了一个 Target，名为 `WalterlvDemoTarget`（随便取的名字），并要求在 `BeforeCompile` 这个 Target 执行之前执行。
    - 关于时机，可以阅读：
        - [通过重写预定义的 Target 来扩展 MSBuild / Visual Studio 的编译过程](/post/extend-the-visual-studio-build-process.html)
        - [在制作多框架项目的 NuGet 包时应该注意的问题（buildMultiTargeting/TargetFrameworks](/post/build-multi-targeting-nuget-package.html)
    - 我们做了一个有趣的事情，在这个 Target 里面，显示了“系统版本号”（因为我想让实时编译过程变得更直观）
1. 我们定义了一个 `WalterlvDemoFile` 项，这是随便取的名字，是为了搜集 `*.txt` 文件。
1. 我们在 `WalterlvDemoFile` 里指定 `Generator` 为 `MSBuild:Compile`。
    - 对于已知的项（Item）来说，`Generator` 属性是 MSBuild 编译时的一个已知元数据（Metadata），其作用为当此文件改变时，会执行一个指定的 Target
    - 我们将其指定为 `MSBuild:Compile`，即指定为 MSBuild 内置的一个 Target `Compile`，意为执行一次编译
1. 然而，`WalterlvDemoFile` 并不是已知的项，所以我们还需要额外将 `WalterlvDemoFile` 添加到 `AvailableItemName` 集合里。
    - 关于已知的项，可以阅读：
        - [Common MSBuild Project Items - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/common-msbuild-project-items)
    - 加完之后，`WalterlvDemoFile` 的 `Generator` 属性就可以被自动启用了

## 延伸

在上面那个最简的 Demo 中，我们弹出了个 Windows 版本号，这真的只是为了让你立刻注意到某个代码执行了。当然真正生成代码肯定不会是这样的弹窗。

不过，你可以从我的其他博客里找到很多生成代码的方法，比如这篇……还有这篇……还有这这这篇……

- [生成代码，从 T 到 T1, T2, Tn —— 自动生成多个类型的泛型](/post/generate-code-of-generic-types.html)
- [如何创建一个基于命令行工具的跨平台的 NuGet 工具包](/post/create-a-cross-platform-command-based-nuget-tool.html)
- [如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包](/post/create-a-cross-platform-msbuild-task-based-nuget-tool.html)
- [将 .NET Core 项目打一个最简单的 NuGet 源码包，安装此包就像直接把源码放进项目一样](/post/the-simplest-way-to-pack-a-source-code-nuget-package.html)
- [Roslyn 如何基于 Microsoft.NET.Sdk 制作源代码包](https://blog.lindexi.com/post/Roslyn-%E5%A6%82%E4%BD%95%E5%9F%BA%E4%BA%8E-Microsoft.NET.Sdk-%E5%88%B6%E4%BD%9C%E6%BA%90%E4%BB%A3%E7%A0%81%E5%8C%85.html)

---

**参考资料**

- [Build Time Code Generation in MSBuild · mhut.ch](https://mhut.ch/journal/2015/06/30/build-time-code-generation-in-msbuild)
- [grpc/grpc: The C based gRPC (C++, Python, Ruby, Objective-C, PHP, C#)](https://github.com/grpc/grpc)
- [NuGet Gallery - Grpc.Tools](https://www.nuget.org/packages/Grpc.Tools/)
