---
title: "解读 Microsoft.NET.Sdk 的源码，你能定制各种奇怪而富有创意的编译过程"
publishDate: 2018-06-30 13:55:39 +0800
date: 2019-07-02 19:42:50 +0800
tags: dotnet visualstudio nuget msbuild
version:
  current: 中文
versions:
  - 中文: #
  - English: /post/read-microsoft-net-sdk-en.html
coverImage: /static/posts/2018-06-30-21-06-06.png
permalink: /posts/read-microsoft-net-sdk.html
---

在 csproj 中，`Project` 中的 `Sdk` 属性是 MSBuild 15.0 开始支持的，也就是 Visual Studio 2017 开始支持。有了 Sdk 属性的存在，MSBuild 编译过程能够扩展得非常强大，而不止是过去 `Import` 的一个 `props` 和 `targets` 文件。

本文将介绍 Microsoft.NET.Sdk 的源码，以及利用源码中的一些线索来完成官方文档中没有提及的功能扩展。

---

This post is written in **multiple languages**. Please select yours:

{% include post-version-selector.html %}

<div id="toc"></div>

## Microsoft.NET.Sdk 源码的位置

在计算机上全局搜索 `Microsoft.NET.Sdk` 可以找到不同版本的多个 Sdk 目录，由于我安装了 .NET Core 3.0，所以找到的目录是：`C:\Program Files\dotnet\sdk\3.0.100-preview6-012264`。当然，按照官网 [How to: Reference an MSBuild Project SDK](https://docs.microsoft.com/en-us/visualstudio/msbuild/how-to-use-project-sdk?wt.mc_id=MVP) 的描述，如果自己实现了一套 Sdk，也可以以 NuGet 包的形式发布。

![Search Microsoft.NET.Sdk](/static/posts/2018-06-30-21-06-06.png)  
▲ 搜索 Microsoft.NET.Sdk

![The Sdk folder](/static/posts/2018-06-30-21-08-25.png)  
▲ 我计算机上的 Sdk 文件夹

Sdk 中的 NuGet 部分在 GitHub 上的仓库地址：

- [NuGet.Client/src/NuGet.Core at dev · NuGet/NuGet.Client](https://github.com/NuGet/NuGet.Client/tree/dev/src/NuGet.Core)

## Microsoft.NET.Sdk 的目录结构

在打开看 `Microsoft.NET.Sdk` 的目录结构后，我们可以发现这几乎就是 NuGet 包要求的目录结构。

![The folder structure of Microsoft.NET.Sdk](/static/posts/2018-06-30-21-09-29.png)

关于 NuGet 包的目录结构，我在下面两篇文章中都有提到过：

- [如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包](/post/create-a-cross-platform-msbuild-task-based-nuget-tool)
- [如何创建一个基于命令行工具的跨平台的 NuGet 工具包](/post/create-a-cross-platform-command-based-nuget-tool)

官方对 NuGet 的目录结构也有介绍：[How to create a NuGet package from a convention-based working directory](https://docs.microsoft.com/en-us/nuget/create-packages/creating-a-package#from-a-convention-based-working-directory?wt.mc_id=MVP)。

不过，Sdk 类型的 NuGet 包会多一个 `Sdk` 文件夹。

![The extra Sdk folder](/static/posts/2018-06-30-21-10-19.png)

`Sdk` 文件夹中的 `Sdk.props` 和 `Sdk.targets` 是会被默认 `Import` 的，这一点在官方文档 [How to: Reference an MSBuild Project SDK - Visual Studio](https://docs.microsoft.com/en-us/visualstudio/msbuild/how-to-use-project-sdk?wt.mc_id=MVP) 中是有说明的，以下两段代码的含义相同：

> ```xml
> <Project Sdk="Microsoft.NET.Sdk">
>     <PropertyGroup>
>         <TargetFramework>net48</TargetFramework>
>     </PropertyGroup>
> </Project>
> ```

> ```xml
> <Project>
>     <!-- Implicit top import -->
>     <Import Project="Sdk.props" Sdk="Microsoft.NET.Sdk" />
> 
>     <PropertyGroup>
>         <TargetFramework>net48</TargetFramework>
>     </PropertyGroup>
> 
>     <!-- Implicit bottom import -->
>     <Import Project="Sdk.targets" Sdk="Microsoft.NET.Sdk" />
> </Project>
> ```

由于这两个文件的默认引入，Sdk 可以完成非常多的编译任务。而且通常 Sdk 带有扩展性，使得我们可以很方便地对项目的编译过程进行扩展，这一点在我前面提到了两篇制作 NuGet 工具包的文章中都有说明。

## Microsoft.NET.Sdk 的主要任务

在 Sdk 文件夹中搜索 `Target` 节点的个数，我得到了 174 个（随 .NET Core 2.1 发布）；不过有一些是同名的，会被重写（类似于 C#/.NET 中的继承和重写）；核心的并没有那么多。

- `CollectPackageReferences` 用于收集 `PackageReference` 收集到的所有依赖（也就是 NuGet 包依赖）
- `CoreCompile` 核心的编译过程

- `GenerateAssemblyInfo` 用于生成 `AssemblyInfo.cs` 文件（以前可是手工写的呢）
- `Pack` 用于将当前程序集打包成一个 NuGet 包
- `GenerateNuspec` 在打包之前生成 nuspec 文件

## 定制富有创意的编译过程

下面是 Microsoft.NET.Sdk 中发现的一些富有创意的编译过程：

```xml
<Target Name="DontRestore" BeforeTargets="Restore">
  <Error Text="This project should not be restored" />
 </Target>
```

▲ 如果有 `Restore`，那么让你编译不通过

```xml
<Target Name="ReferenceStaticLegacyPackage" BeforeTargets="CollectPackageReferences">
  <ItemGroup>
    <PackageReference Remove="LiteDB" />
    <PackageReference Include="LiteDB" Version="2.0.2" />
  </ItemGroup>
</Target>
```

▲ 这是我另外写的一篇文章：[阻止某个 NuGet 包意外升级](/post/prevent-nuget-package-upgrade)

---

**参考资料**

- [How to: Reference an MSBuild Project SDK - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/how-to-use-project-sdk?wt.mc_id=MVP)


