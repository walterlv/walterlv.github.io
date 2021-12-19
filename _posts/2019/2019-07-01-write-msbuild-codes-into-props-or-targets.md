---
title: "在项目文件 / MSBuild / NuGet 包中编写扩展编译的时候，正确使用 props 文件和 targets 文件"
publishDate: 2019-07-01 15:54:13 +0800
date: 2021-06-07 15:12:04 +0800
tags: visualstudio msbuild nuget dotnet
position: principle
permalink: /posts/write-msbuild-codes-into-props-or-targets.html
---

.NET 扩展编译用的文件有 .props 文件和 .targets 文件。不给我选择还好，给了我选择之后我应该使用哪个文件来编写扩展编译的代码呢？

---

如果你不了解 .props 文件或者 .targets 文件，可以阅读下面的博客：

- [理解 C# 项目 csproj 文件格式的本质和编译流程 - walterlv](/post/understand-the-csproj)

具体的例子有下面这些博客。不过大概阅读一下就好，这只是 .props 和 .targets 文件的一些应用。文章比较长，你可以考虑稍后阅读。

- [从零开始制作 NuGet 源代码包（全面支持 .NET Core / .NET Framework / WPF 项目） - walterlv](/post/build-source-code-package-for-wpf-projects)
- [如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包 - walterlv](/post/create-a-cross-platform-msbuild-task-based-nuget-tool)
- [如何创建一个基于命令行工具的跨平台的 NuGet 工具包 - walterlv](/post/create-a-cross-platform-command-based-nuget-tool)

当我们创建的 NuGet 包中包含 .props 和 .targets 文件的时候，我们相当于在项目文件 csproj 的两个地方添加了 Import 这些文件的代码。

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <!-- 本来是没有下面这一行的，我只是为了说明 NuGet 相当于帮我们添加了这一行才假装写到了这里。 -->
  <Import Project="$(NuGetPackageRoot)walterlv.samplepackage\0.8.3-alpha\build\Walterlv.SamplePackage.props" Condition="Exists('$(NuGetPackageRoot)walterlv.samplepackage\0.8.3-alpha\build\Walterlv.SamplePackage.props')" />

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFrameworks>netcoreapp3.0</TargetFrameworks>
  </PropertyGroup>

  <!-- 本来是没有下面这一行的，我只是为了说明 NuGet 相当于帮我们添加了这一行才假装写到了这里。 -->
  <Import Project="$(NuGetPackageRoot)walterlv.samplepackage\0.8.3-alpha\build\Walterlv.SamplePackage.targets" Condition="Exists('$(NuGetPackageRoot)walterlv.samplepackage\0.8.3-alpha\build\Walterlv.SamplePackage.targets')" />

</Project>
```

如果你安装的多份 NuGet 包都带有 .props 和 .targets 文件，那么就相当于帮助你 Import 了多个：

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <!-- 本来是没有下面这一行的，我只是为了说明 NuGet 相当于帮我们添加了这一行才假装写到了这里。 -->
  <Import Project="$(NuGetPackageRoot)walterlv.samplepackage1\0.8.3-alpha\build\Walterlv.SamplePackage1.props" Condition="Exists('$(NuGetPackageRoot)walterlv.samplepackage1\0.8.3-alpha\build\Walterlv.SamplePackage1.props')" />
  <Import Project="$(NuGetPackageRoot)walterlv.samplepackage2\0.5.1-beta\build\Walterlv.SamplePackage2.props" Condition="Exists('$(NuGetPackageRoot)walterlv.samplepackage2\0.5.1-beta\build\Walterlv.SamplePackage2.props')" />

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFrameworks>netcoreapp3.0</TargetFrameworks>
  </PropertyGroup>

  <!-- 本来是没有下面这一行的，我只是为了说明 NuGet 相当于帮我们添加了这一行才假装写到了这里。 -->
  <Import Project="$(NuGetPackageRoot)walterlv.samplepackage1\0.8.3-alpha\build\Walterlv.SamplePackage1.targets" Condition="Exists('$(NuGetPackageRoot)walterlv.samplepackage1\0.8.3-alpha\build\Walterlv.SamplePackage1.targets')" />
  <Import Project="$(NuGetPackageRoot)walterlv.samplepackage2\0.5.1-beta\build\Walterlv.SamplePackage2.targets" Condition="Exists('$(NuGetPackageRoot)walterlv.samplepackage2\0.5.1-beta\build\Walterlv.SamplePackage2.targets')" />

</Project>
```

于是，什么代码写到 .props 里而什么代码写到 .targets 里就一目了然了：

1. 如果你是定义属性或者为属性设置初值，那么请写到 .props 里面
    - 这样，所有的 NuGet 包或者扩展的编译流程都将可以访问到你设置的属性的值
1. 如果你是使用属性，或者按条件设置属性，那么请写到 .targets 里面
    - 因为这个时候多数的属性已经初始化完毕，你可以使用到属性的值了
1. 如果你写的是编译目标（Target），那么请写到 .targets 里面
    - 编译目标是扩展编译的，通常都是使用属性
    - 也会有一些产生属性的，但那都是需要在编译期间产生的属性，其他依赖需要使用 `DependsOn` 等属性来获取

例如下面的属性适合写到 .props 里面。这是一个设置属性初始值的地方：

```xml
<Project>

  <PropertyGroup>
    <MSBuildAllProjects>$(MSBuildAllProjects);$(MSBuildThisFileFullPath)</MSBuildAllProjects>

    <!-- 当生成 WPF 临时项目时，不会自动 Import NuGet 中的 props 和 targets 文件，这使得在临时项目中你现在看到的整个文件都不会参与编译。
       然而，我们可以通过欺骗的方式在主项目中通过 _GeneratedCodeFiles 集合将需要编译的文件传递到临时项目中以间接参与编译。
       WPF 临时项目不会 Import NuGet 中的 props 和 targets 可能是 WPF 的 Bug，也可能是刻意如此。
       所以我们通过一个属性开关 `ShouldFixNuGetImportingBugForWpfProjects` 来决定是否修复这个错误。-->
    <ShouldFixNuGetImportingBugForWpfProjects Condition=" '$(ShouldFixNuGetImportingBugForWpfProjects)' == '' ">True</ShouldFixNuGetImportingBugForWpfProjects>

  </PropertyGroup>

</Project>
```

这个属性的含义你可以在我的另一篇博客中找到：[从零开始制作 NuGet 源代码包（全面支持 .NET Core / .NET Framework / WPF 项目）](/post/build-source-code-package-for-wpf-projects.html)

而下面的属性适合写到 .targets 里面，因为这里使用到了其他的属性：

```xml

<Project>

  <PropertyGroup>
    <MSBuildAllProjects>$(MSBuildAllProjects);$(MSBuildThisFileFullPath)</MSBuildAllProjects>

    <!-- 因为这里使用到了 `Configuration` 属性，需要先等到此属性已经初始化完成再使用，否则我们会拿到非预期的值。 -->
    <ShouldOptimizeDebugging> Condition=" '$(Configuration)' == 'Debug' ">True</ShouldOptimizeDebugging>

  </PropertyGroup>

</Project>
```

