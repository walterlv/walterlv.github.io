---
title: ".NET 程序集/项目/包的版本号设置有最大范围，最大不能超过 65534"
publishDate: 2020-06-18 18:15:19 +0800
date: 2020-06-19 00:05:08 +0800
tags: visualstudio dotnet
position: problem
coverImage: /static/posts/2020-06-18-18-01-22.png
permalink: /posts/dotnet-version-number-too-large.html
---

试过给 .NET Core 项目设置一个大于 65535 的版本号吗？可能没有，因为设置了会炸！

---

<div id="toc"></div>

## 最简问题项目

用最普通的项目模板创建一个 .NET 项目（要求是 SDK 风格的），于是，你会得到两个文件：项目文件 Walterlv.Demo.csproj 和代码文件 Class1.cs。

Walterlv.Demo.csproj：

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>netcoreapp3.1</TargetFramework>
  </PropertyGroup>
</Project>
```

Class1.cs 应该不用贴出来了，因为没啥关系。

现在，我们加个版本号：

```diff
    <Project Sdk="Microsoft.NET.Sdk">
      <PropertyGroup>
++      <Version>1.0.0.65535</Version>
        <TargetFramework>netcoreapp3.1</TargetFramework>
      </PropertyGroup>
    </Project>
```

一编译就立刻编译错误：

![编译错误](/static/posts/2020-06-18-18-01-22.png)

然而，只要把版本号改到 65534 或者更小的值就没有问题。

因为我们可以知道，在 SDK 风格的项目当中，版本号的任何一位的范围只能是 0~65534。

## 传统项目没问题

你可能会说，创建了一个 .NET Framework 的项目，并没有出现问题。

那是因为此问题的复现要求：

1. 必须是 SDK 风格的项目（.NET Core 默认的风格，也可用于 .NET Framework）；
2. 必须是通过 .csproj 或者 .props / .targets 文件来指定的版本号。

这两个条件缺一不可。而通过模板创建的 .NET Framework 项目默认使用的是传统风格的 csproj 项目文件。

如果是传统风格的项目，必须使用 AssemblyInfo.cs 来指定版本号；新的 SDK 风格的版本号也可以使用 AssemblyInfo.cs 来指定版本号。而这两种情况的版本号范围是整个 int 范围（0~2G）。

附，在 SDK 风格项目中使用 AssemblyInfo.cs 来指定版本号前，你需要先用以下属性关闭默认自动生成 AssemblyInfo.cs 功能：

```diff
    <Project Sdk="Microsoft.NET.Sdk">
      <PropertyGroup>
        <TargetFramework>netcoreapp3.1</TargetFramework>
++      <GenerateAssemblyInfo>False</GenerateAssemblyInfo>
      </PropertyGroup>
    </Project>
```

## 谁的限制？

实际上，版本号限制是 Windows 系统带来的，Windows 系统限制到 65535 了。

虽然你可以通过以上 AssemblyInfo 的方法绕过编译错误，但实际上生成的文件版本会溢出：

![溢出的版本号](/static/posts/2020-06-19-00-04-19.png)

.NET 运行时是可以支持 int 范围的版本号的，无奈兼容 Windows 的部分却不行。

---

**参考资料**

- [Why are build numbers limited to 65535? - Microsoft Docs](https://docs.microsoft.com/zh-cn/archive/blogs/msbuild/why-are-build-numbers-limited-to-65535)
- [c# - The specified version string does not conform to the required format - major[.minor[.build[.revision]]] - Stack Overflow](https://stackoverflow.com/a/37941296/6233938)


