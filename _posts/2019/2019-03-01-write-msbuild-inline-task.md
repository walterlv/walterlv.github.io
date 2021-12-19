---
title: "如何在 csproj 中用 C# 代码写一个内联的编译任务 Task"
date: 2019-03-01 15:12:04 +0800
tags: msbuild dotnet visualstudio csharp
position: starter
---

我之前写过一些改变 MSBuild 编译过程的一些博客，包括利用 Microsoft.NET.Sdk 中各种自带的 Task 来执行各种各样的编译任务。更复杂的任务难以直接利用自带的 Task 实现，需要自己写 Task。

本文介绍非常简单的 Task 的编写方式 —— 在 csproj 文件中写内联的 Task。

---

<div id="toc"></div>

## 前置知识

在阅读本文之前，你至少需要懂得：

- csproj 文件的结构以及编译过程
- Target 是什么，Task 是什么

所以如果你不懂或者理不清，则请先阅读：

- [理解 C# 项目 csproj 文件格式的本质和编译流程 - 吕毅](/post/understand-the-csproj)

关于 Task 的理解，我有一些介绍自带 Task 的博客以及如何编写 Task 的教程：

- [如何编写基于 Microsoft.NET.Sdk 的跨平台的 MSBuild Target（附各种自带的 Task） - 吕毅](/post/write-msbuild-target)
- [如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包 - 吕毅](/post/create-a-cross-platform-msbuild-task-based-nuget-tool)

## 编写内联的编译任务（Task）

如果你阅读了前面的博客，那么大致知道如何写一个在编译期间执行的 Task。不过，默认你需要编写一个额外的项目来写 Task，然后将这个项目生成 dll 供编译过程通过 `UsingTask` 来使用。然而如果 Task 足够简单，那么依然需要那么复杂的过程显然开发成本过高。

于是现在可以编写内联的 Task：

1. 内联任务的支持需要用到 `Microsoft.Build.Tasks.v4.0.dll`；
1. 我们用 `<![CDATA[ ]]>` 来内嵌 C# 代码；
1. 除了用 `UsingTask` 编写内联的 Task 外，我们需要额外编写一个 `Target` 来验证我们的内联 Task 能正常工作。

下面是一个最简单的内联编译任务：

```xml
<Project Sdk="Microsoft.NET.Sdk">
    <UsingTask TaskName="WalterlvDemoTask" TaskFactory="CodeTaskFactory"
               AssemblyFile="$(MSBuildToolsPath)\Microsoft.Build.Tasks.v4.0.dll">
        <Task>
            <Code Type="Fragment" Language="cs">
                <![CDATA[
        Console.WriteLine("Hello Walterlv!");
                ]]>
            </Code>
        </Task>
    </UsingTask>
<Project>
```

为了能够测试，我把完整的 csproj 文件贴出来：

```xml
<Project Sdk="Microsoft.NET.Sdk">

    <PropertyGroup>
        <OutputType>Exe</OutputType>
        <TargetFramework>net472</TargetFramework>
    </PropertyGroup>

    <UsingTask TaskName="WalterlvDemoTask" TaskFactory="CodeTaskFactory"
               AssemblyFile="$(MSBuildToolsPath)\Microsoft.Build.Tasks.v4.0.dll">
        <Task>
            <Code Type="Fragment" Language="cs">
                <![CDATA[
        Console.WriteLine("Hello Walterlv!");
                ]]>
            </Code>
        </Task>
    </UsingTask>

    <Target Name="WalterlvDemoTarget" AfterTargets="Build">
        <WalterlvDemoTask />
    </Target>

</Project>
```

目前内联编译仅适用于 MSBuild，而 `dotnet build` 尚不支持。现在在项目目录输入命令进行编译，可以在输出窗口看到我们内联编译中的输出内容：

```powershell
msbuild
```

![输出内容](/static/posts/2019-03-01-15-09-19.png)

## 编写更复杂的内联编译任务

阅读我的另一篇博客了解如何编写一个更复杂的内联编译任务：

- [编写 MSBuild 内联编译任务（Task）用于获取当前编译环境下的所有编译目标（Target） - 吕毅](/post/write-a-msbuild-inline-task-for-getting-all-targets)
