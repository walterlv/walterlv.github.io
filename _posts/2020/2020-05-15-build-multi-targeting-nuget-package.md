---
title: "在制作多框架项目的 NuGet 包时应该注意的问题（buildMultiTargeting/TargetFrameworks）"
date: 2020-05-15 14:23:19 +0800
tags: nuget dotnet msbuild
position: knowledge
---

制作一个 dll 引用的 NuGet 包简直是一键完成，无论是不是多框架项目；制作 dotnet-tools 也是如此。但如果需要自定义一些编译步骤，那么就需要在制作 NuGet 包时做很多的特殊处理了。

本文介绍制作适用于多框架项目的 NuGet 工具包时应该注意的问题。

---

<div id="toc"></div>

## 背景知识

### NuGet 包内的文件夹结构

回顾一下 NuGet 包的文件夹结构：

```
+ /
+ lib/
+ ref/
+ runtimes/
+ content/
+ build/
+ buildMultiTargeting/
+ buildTransitive
+ tools/
```

由于涉及到自定义 NuGet 包的代码都写在 `build` `buildMultiTargeting` 和 `buildTransitive` 中，其他都不涉及到 NuGet 包在编译期间会做的事情，另外，`buildTransitive` 是用来[处理包传递过程中的编译过程](https://github.com/NuGet/Home/wiki/Allow-package--authors-to-define-build-assets-transitive-behavior)的，所以我们本文只说也只需要说 `build` 和 `buildMultiTargeting`。

这里面的代码都是用 `Target` 写出来的，如果你对此不了解，建议阅读这些博客：

- [理解 C# 项目 csproj 文件格式的本质和编译流程 - walterlv](/post/understand-the-csproj.html)
- [从零开始制作 NuGet 源代码包（全面支持 .NET Core / .NET Framework / WPF 项目） - walterlv](/post/build-source-code-package-for-wpf-projects)

### 制作有自定义功能的 NuGet 包

我之前写过一些关于如何制作各种高级功能的 NuGet 包的博客：

- [如何创建一个基于命令行工具的跨平台的 NuGet 工具包 - walterlv](/post/create-a-cross-platform-command-based-nuget-tool)
- [如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包 - walterlv](/post/create-a-cross-platform-msbuild-task-based-nuget-tool)
- [从零开始制作 NuGet 源代码包（全面支持 .NET Core / .NET Framework / WPF 项目） - walterlv](/post/build-source-code-package-for-wpf-projects)

按照上面的博客制作出来的 NuGet 包其实是适用于单框架项目和多框架项目的，甚至也适用于传统的非 SDK 风格的项目。

关于单框架和多框架项目，就是项目文件中这里的差别：

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <!-- 单框架项目 -->
    <TargetFramework>netcoreapp3.1</TargetFramework>
  </PropertyGroup>

</Project>
```

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <!-- 多框架项目 -->
    <TargetFrameworks>netcoreapp3.1;net48</TargetFrameworks>
  </PropertyGroup>

</Project>
```

但是，有的小伙伴希望探索一些更高级的用法，所以可能会遇到在多框架项目中，NuGet 包自定义的功能不执行的问题。

接下来，我们了解一下在单框架和多框架下 NuGet 包执行上的不同。

## 执行时机

我们打出这样的两种 NuGet 包，一种是仅包含 `build` 文件夹而不包含 `buildMultiTargeting` 文件夹；一种是包含 `build` 文件夹和 `buildMultiTargeting` 文件夹。

我们的目标项目一种是单框架项目；一种是多框架项目。

于是我们可以得到这样的四种不同的组合情况：

1. 仅含 `build` 文件夹的 NuGet 包装到单框架项目中
1. 仅含 `build` 文件夹的 NuGet 包装到多框架项目中
1. 包含 `build` 和 `buildMultiTargeting` 文件夹的 NuGet 包装到单框架项目中
1. 包含 `build` 和 `buildMultiTargeting` 文件夹的 NuGet 包装到多框架项目中

### 1. 仅含 `build` 文件夹的 NuGet 包装到单框架项目中

在这种情况下，`build` 文件夹中的 `.props` 和 `.targets` 文件在目标项目编译时正常执行。

### 2. 仅含 `build` 文件夹的 NuGet 包装到多框架项目中

在这种情况下，`build` 文件夹中的 `.props` 和 `.targets` 文件，会分别在目标项目编译每个框架的时候执行一次。

例如这种项目：

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <!-- 多框架项目 -->
    <TargetFrameworks>netcoreapp3.1;net48</TargetFrameworks>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Walterlv.NullableAttributes.Source" Version="0.15.0" />
  </ItemGroup>

</Project>
```

那么，在编译 `netcoreapp3.1` 框架的时候会执行一次 Walterlv.NullableAttributes.Source 包中 `build` 文件夹中的编译任务；在编译 `net48` 框架的时候又会执行一次 Walterlv.NullableAttributes.Source 包中 `build` 文件夹中的编译任务。

### 3. 包含 `build` 和 `buildMultiTargeting` 文件夹的 NuGet 包装到单框架项目中

在这种情况下，`buildMultiTargeting` 中的任何编译任务相当于不存在。编译过程与情况 1 是完全一样的。

### 4. 包含 `build` 和 `buildMultiTargeting` 文件夹的 NuGet 包装到多框架项目中

从 NuGet 5.x 版本开始在这种情况下，`build` 中的内容和 `buildMultiTargeting` 中的编译任务会同时参与编译。

依然举例这样的目标项目（不过使用了含 `buildMultiTargeting` 的 NuGet 包）：

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <!-- 多框架项目 -->
    <TargetFrameworks>netcoreapp3.1;net48</TargetFrameworks>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Walterlv.NullableAttributes.Source" Version="2.1.1" />
  </ItemGroup>

</Project>
```

编译一开始，会将 `buildMultiTargeting` 中的编译任务加入执行。在编译 `netcoreapp3.1` 框架的时候会执行一次 Walterlv.NullableAttributes.Source 包中 `build` 文件夹中的编译任务；在编译 `net48` 框架的时候又会执行一次 Walterlv.NullableAttributes.Source 包中 `build` 文件夹中的编译任务。而这两个单独框架的编译结束后，`buildMultiTargeting` 中的任务才会结束。

也就是说，这两个编译任务文件夹中的编译任务是都会执行的。但是：

**两者参与编译的 Targets 不一样**。

下表中列出了在你没有编写任何扩展的任务或者干预已有 Target 执行的情况下，默认可以依赖的 Target（指的是可以通过 `BeforeTargets="xx"` 或 `AfterTargets="xx"` 的方式扩展编译任务：

| 可依赖的 Target | build             | buildMultiTargeting |
| --------------- | ----------------- | ------------------- |
| BeforeCompile   | ✔                 | ❌                   |
| Compile         | ✔                 | ❌                   |
| CoreCompile     | ✔                 | ❌                   |
| AfterCompile    | ✔                 | ❌                   |
| BeforeBuild     | ✔                 | ❌                   |
| Build           | ✔                 | ✔                   |
| AfterBuild      | ✔                 | ❌                   |
| BeforeRebuild   | ❌                 | ❌                   |
| Rebuild         | ❌                 | ✔（如果强行执行）   |
| AfterRebuild    | ❌                 | ❌                   |
| BeforeClean     | ✔（如果强行执行） | ❌                   |
| Clean           | ✔（如果强行执行） | ✔（如果强行执行）   |
| AfterClean      | ✔（如果强行执行） | ❌                   |

注：强制执行说的是一般编译时不会执行，你需要在命令中指定执行这个 Target。也对应到 Visual Studio 里的“重新编译”和“清理”的功能。

为了更好理解上表，这里给出一个例子。下面的代码如果在 `build` 文件夹中则会在编译过程输出一堆星号，而如果在 `buildMultiTargeting` 文件夹中则不会执行。而无论目标项目是否是多框架的。但换成 `AfterBuild` 则会两个文件夹中都输出。

```xml
<Target Name="WalterlvDemoTarget" AfterTargets="Build">
    <Message Text="****************************************************************" />
</Target>
```

当然，不要被这个第 4 种情况带歪了！如果你的 NuGet 包依然只有一个 `build` 文件夹，那么上面的所有 Targets 都是会执行的。

---

**参考资料**

- [Create a NuGet package using nuget.exe CLI - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/create-packages/creating-a-package)
- [Allow package authors to define build assets transitive behavior · NuGet/Home Wiki](https://github.com/NuGet/Home/wiki/Allow-package--authors-to-define-build-assets-transitive-behavior)
