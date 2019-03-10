---
title: "Visual Studio 2017 以前的旧格式的 csproj Import 进来的 targets 文件有时不能正确计算属性（PropertyGroup）和集合（ItemGroup）"
publishDate: 2018-12-22 22:30:12 +0800
date: 2018-12-23 15:17:07 +0800
categories: dotnet visualstudio msbuild roslyn nuget
position: problem
---

我在之前的博客中有教大家如何编写 NuGet 工具包，其中就有编写 .targets 文件。

我在实际的使用中，发现 Visual Studio 2017 带来的含 Sdk 的新 csproj 格式基本上没有多少坑；然而旧的 csproj 文件却总是不能完美的运行，总是出错。关键是，不是每台电脑都出错，不是每个时机都出错。

本文将讲一些坑。

---

<div id="toc"></div>

## 本文的前置知识

你可能需要了解 csproj 文件的格式和编译过程，才可能读懂本文，所以需要先阅读：

- [理解 C# 项目 csproj 文件格式的本质和编译流程](/post/understand-the-csproj.html)

## 问题

下面的代码来自 [SourceFusion](https://github.com/dotnet-campus/SourceFusion) 项目的早期版本。

这是一个 .targets 文件，项目安装此 NuGet 包之后就会自动 Import 这个 targets 文件。

```xml
<Project>
    <PropertyGroup>
        <_DefaultSourceFusionWorkingFolder Condition="'$(_DefaultSourceFusionWorkingFolder)' == ''">obj\$(Configuration)\</_DefaultSourceFusionWorkingFolder>
        <SourceFusionWorkingFolder Condition="'$(SourceFusionWorkingFolder)' == ''">$(_DefaultSourceFusionWorkingFolder)</SourceFusionWorkingFolder>
        <SourceFusionToolsFolder>$(SourceFusionWorkingFolder)SourceFusion.Tools\</SourceFusionToolsFolder>
        <SourceFusionGeneratedCodeFolder>$(SourceFusionWorkingFolder)SourceFusion.GeneratedCodes\</SourceFusionGeneratedCodeFolder>
    </PropertyGroup>
  
    <Target Name="_SourceFusionCreateDirectories" BeforeTargets="_SourceFusionWriteCompilingArgs;_SourceFusionWriteFilterArgs">
        <ItemGroup>
            <SourceFusionDirectory Include="$(SourceFusionWorkingFolder)" />
            <SourceFusionDirectory Include="$(SourceFusionToolsFolder)" />
            <SourceFusionDirectory Include="$(SourceFusionGeneratedCodeFolder)" />
        </ItemGroup>
        <MakeDir Directories="@(SourceFusionDirectory)" ContinueOnError="false" />
    </Target>
</Project>
```

代码的解读如下：

1. 创建了一个私有属性 `_DefaultSourceFusionWorkingFolder`，三个公有属性 `SourceFusionWorkingFolder`、`SourceFusionToolsFolder`、`SourceFusionGeneratedCodeFolder`。
1. 在编译期间，执行一个私有的 Target，收集所有收集到的文件夹，形成一个 `SourceFusionDirectory` 集合。然后将集合中的所有字符串视为文件夹，创建这几个文件夹。

在新的有 Sdk 的 csproj 中，这个 targets 文件的执行没有问题。但是，对于旧的 csproj 来说，就经常出现这几个属性为空或者部分为空的情况。额外的，就算修改这个文件，上面的属性也不会生效。

不过，如果使用命令行进行编译，这个却又是生效的。

## 原因

究其原因，这是 MSBuild 对项目文件（csproj）的解析和 Visual Studio 对项目文件的解析是不同的。命令行使用的是 [MSBuild](https://github.com/Microsoft/msbuild) 解析 csproj，而 Visual Studio 使用的是 [VSProjectSystem](https://github.com/Microsoft/VSProjectSystem)。

对于 VSProjectSystem 来说，`Project` 根节点下的 `PropertyGroup` 和 `ItemGroup` 对不会更新。有时清除 Visual Studio 的项目缓存可以解决这个问题，但有时清除也不能解决。

真实的原因我并没有调查出来。但以上代码在大多数开发者的 Visual Studio 中是可以正常使用的，但有少数开发者使用这个会出现错误（没有创建任何文件夹）。

## 解决办法

既然问题出在 [MSBuild](https://github.com/Microsoft/msbuild) 和 [VSProjectSystem](https://github.com/Microsoft/VSProjectSystem) 对属性和集合处理的不同，那么我就不要创建动态的集合，而是在 Target 内部编写属性和集合。

在 Target 内部的属性和集合将在编译期间进行计算，而不是在 Visual Studio 打开的时候就计算好。于是我们每次编译的时候都可以获得最新的属性和集合的值。

## 衍生知识

旧格式的 csproj 是不会自动计算属性和集合的变更的，这也是为什么项目文件改变的时候，Visual Studio 需要重新加载项目才可以正常显示和编译项目。同时，如果编辑旧格式的 csproj 文件，也需要先卸载掉项目才可以。而新格式的 csproj 是可以直接编辑而不需要卸载项目的，同时如果被外部改变，也不需要重新加载项目，而是可以直接计算出来新的属性和集合。
