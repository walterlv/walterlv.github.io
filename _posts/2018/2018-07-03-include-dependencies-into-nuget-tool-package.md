---
title: "在制作跨平台的 NuGet 工具包时，如何将工具（exe/dll）的所有依赖一并放入包中"
publishDate: 2018-07-03 21:30:25 +0800
date: 2018-12-14 09:54:00 +0800
tags: msbuild nuget visualstudio dotnet
permalink: /post/include-dependencies-into-nuget-tool-package.html
---

NuGet 提供了工具类型的包支持，生成一个基于 .NET Core 的 dll 或者基于 .NET Framework 的 exe 之后，你几乎可以对项目做任何事情。但是，默认情况下，NuGet 不会将这些工具的依赖一起打包进入 NuGet 包 nupkg 文件内，这就使得功能比较复杂的跨平台 NuGet 工具包几乎是无法正常工作的。

本文将介绍将这些依赖加入 NuGet 包中的方法，使得复杂的工具能够正常使用。

---

<div id="toc"></div>

## 问题

你可能是在 [创建一个基于命令行工具的跨平台 NuGet 工具包](/post/create-a-cross-platform-command-based-nuget-tool) 的时候遇到依赖问题的，也可能是自己做到另外什么工具遇到的。

典型的例子，我正在做一个基于 Roslyn 的 NuGet 工具包。于是整个 Roslyn 的大量 dll 都是我的依赖。但默认情况下，打出来的包并不包含 Roslyn 相关的 dll。

## 探索

[官方关于 NuGet 的文档](https://docs.microsoft.com/en-us/nuget/) 并没有提及任何关于额外添加依赖文件的方法，擅长 NuGet 的大神 [Nate McMaster](https://natemcmaster.com/) 虽然有一篇关于加入 NuGet 依赖的博客 [MSBuild tasks with dependencies](https://natemcmaster.com/blog/2017/11/11/msbuild-task-with-dependencies/?wt.mc_id=MVP)，但依然没有很简单地解决。

尝试找一个实际将这些依赖 Include 进来，但是不知道什么时机合适。太早了依赖文件还没有生成，太晚了 NuGet 包中即将打的文件早已确认，Include 了也没用。

于是，我去阅读了 Microsoft.NET.Sdk 的源码，找到了并没有公开的内部方法来解决这个问题。关于阅读 Microsoft.NET.Sdk 源码的方式，可以参考 [解读 Microsoft.NET.Sdk 的源码，你能定制各种奇怪而富有创意的编译过程](/post/read-microsoft-net-sdk) 和 [Reading the Source Code of Microsoft.NET.Sdk, Writing the Creative Extension of Compiling](/post/read-microsoft-net-sdk-en)。

NuGet 打包的核心在 NuGet.Build.Tasks.Pack.targets 文件，主要是这段代码（省略了大量内容，留下了看起来有点儿关系的部分）：

```xml
<!-- 已删减大量内容，全部内容请自己阅读源码。 -->
<PackTask PackItem="$(PackProjectInputFile)"
          PackageFiles="@(_PackageFiles)"
          PackageFilesToExclude="@(_PackageFilesToExclude)"
          PackageTypes="$(PackageType)"
          IsTool="$(IsTool)"
          IncludeBuildOutput="$(IncludeBuildOutput)"/>
</Target>
```

`PackageTypes` 和 `IsTool` 是我放来灌水的，这两个属性决定了我们打出来的包的类型（是否是工具类型）。看起来像的是 `PackageFiles` 和 `PackageFilesToExclude` 属性，不过这两个属性用到了私有的属性 `@(_PackageFiles)` 和 `@(_PackageFilesToExclude)`。

所以接下来需要搜索到底是那里在为 `@(_PackageFiles)` 和 `@(_PackageFilesToExclude)` 赋值。搜索 `<_PackageFiles` 可以找到赋值的地方就在 NuGet.Build.Tasks.Pack.targets 文件中：

```xml
<!-- 已删减大量内容，全部内容请自己阅读源码。 -->
<Target Name="_GetPackageFiles" Condition="$(IncludeContentInPack) == 'true'">
  <ItemGroup>
    <_PackageFilesToExclude Include="@(Content)" Condition="'%(Content.Pack)' == 'false'"/>
  </ItemGroup>
  <!-- Include PackageFiles and Content of the project being packed -->
  <ItemGroup>
    <_PackageFiles Include="@(Content)" Condition=" %(Content.Pack) != 'false' ">
      <BuildAction Condition = "'%(Content.BuildAction)' == ''">Content</BuildAction>
    </_PackageFiles>
    <_PackageFiles Include="@(Compile)" Condition=" %(Compile.Pack) == 'true' ">
      <BuildAction Condition = "'%(Compile.BuildAction)' == ''">Compile</BuildAction>
    </_PackageFiles>
    <_PackageFiles Include="@(None)" Condition=" %(None.Pack) == 'true' ">
      <BuildAction Condition = "'%(None.BuildAction)' == ''">None</BuildAction>
    </_PackageFiles>
    <!-- 已删减大量内容，全部内容请自己阅读源码。 -->
  </ItemGroup>
</Target>
```

这是一个私有 `Target`，所以答案已经呼之欲出了。

## 答案

我们写一个 `Target`，将 `_GetPackageFiles` 设为我们的前置 Target。然后，我们就可以把输出目录中除了 NuGet 自然而然会帮我们打入 NuGet 包中的所有文件都加入到 NuGet 包中的对应目录下。

具体来说，是将下面的 Target 添加到项目文件的末尾。

```xml
<Target Name="IncludeAllDependencies" BeforeTargets="_GetPackageFiles">
  <ItemGroup>
    <None Include="$(OutputPath)*.*" Exclude="$(OutputPath)$(AssemblyName).exe;$(OutputPath)$(AssemblyName).pdb" Pack="True" PackagePath="tools\net47" />
  </ItemGroup>
</Target>
```

