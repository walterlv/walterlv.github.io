---
title: "在 Visual Studio 的解决方案资源管理器中隐藏一些文件"
date: 2018-07-04 20:30:08 +0800
tags: msbuild nuget visualstudio dotnet
coverImage: /static/posts/2018-07-04-20-08-19.png
permalink: /posts/make-items-invisible-in-vs-solution-explorer.html
---

项目文件中有一些属性几乎是专门为 IDE 而准备的，不过考虑到 .NET 生态的开发者多数都使用 Visual Studio，所以基本上也只有 Visual Studio 对这些特性支持的最全面。（才不会透漏这些属性其实本就是为 Visual Studio 而准备的呢。）

本文将介绍如何在 Visual Studio 的解决方案资源管理器中隐藏一些文件。

---

<div id="toc"></div>

## 原生支持

Visual Studio 原生支持 `Visible` 属性用来控制某一项文件是否在 Visual Studio 的解决方案资源管理器中显示。具体来说，是这样设置的：

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>netcoreapp2.1</TargetFramework>
    <EnableDefaultItems>false</EnableDefaultItems>
  </PropertyGroup>
  <ItemGroup>
    <Compile Include="**\*.cs" Exclude="obj\**\*.cs" Visible="false" />
  </ItemGroup>
</Project>
```

好了，任务完成，全文结束！

<br>
<br>
<br>
<br>
<br>

要是只有这样，我才不会写这篇文章呢！

## 原生不支持

![存在文件夹的情况](/static/posts/2018-07-04-20-08-19.png)

考虑一下像上图那样有些文件在文件夹中的情况，然后我们再次设置 `Visible="false"` 属性：

![文件夹竟然还在](/static/posts/2018-07-04-20-16-46.png)

文件夹竟然还在！这是 Visual Studio 的 Bug 吗？

还真是，至少在 Visual Studio 的项目系统中就有这样的 Issue 处于打开的状态：

- [Content Visible=false hides the item, but not the directories in Solution Explorer · Issue #162 · Microsoft/VSProjectSystem](https://github.com/Microsoft/VSProjectSystem/issues/162)

回复是：

> Yes this is a known issue. We are discussing options to resolve it over here [dotnet/roslyn-project-system#1233](https://github.com/dotnet/project-system/issues/1233)

好吧，那就等着解决吧！不过等大家的 Visual Studio 更新到解决的版本还需要很久吧。

## 变通解决

所以，我们只好采取其他手段来解决，最容易想到的是编写一个 `<Target />`。

```xml
<Target Name="IncludeSourceCodes" BeforeTargets="CoreCompile">
  <ItemGroup>
    <Compile Include="**\*.cs" Exclude="bin\**\*.cs;obj\**\*.cs;" />
  </ItemGroup>
</Target>
```

这样，引入这些文件就是通过在编译时才引入的。没有开始编译时，项目中自然看不见。

![完全看不见了](/static/posts/2018-07-04-20-29-52.png)

如果这样的例子发生在制作的 NuGet 包中，那么这个文件可能在 NuGet 包中的路径是 /build/Walterlv.Demo.targets；为了引用额外的源码，我们可以加上额外的路径信息：

```xml
<Target Name="IncludeSourceCodes" BeforeTargets="CoreCompile">
  <ItemGroup>
    <Compile Include="$(MSBuildThisFileDirectory)..\src\**\*.cs" Exclude="$(MSBuildThisFileDirectory)..\src\bin\**\*.cs;$(MSBuildThisFileDirectory)..\src\obj\**\*.cs;" />
  </ItemGroup>
</Target>
```

## 活学活用

这并不是说在 Visual Studio 的解决方案资源管理器中，隐藏文件都应该采用 `<Target />` 来做，毕竟这样太复杂了。如果没有太复杂的要求，直接些 `Visible="false"` 也未尝不可。

比较复杂的情况可能比如：

- [制作跨平台的 NuGet 源码包，安装后就像直接把源码放进项目一样](/post/the-simplest-way-to-pack-a-source-code-nuget-package)
- 需要额外为项目准备一些辅助运行的必要文件

---

**参考资料**

- [Content Visible=false hides the item, but not the directories in Solution Explorer · Issue #162 · Microsoft/VSProjectSystem](https://github.com/Microsoft/VSProjectSystem/issues/162)


