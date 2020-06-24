---
title: "Visual Studio 在编译 A 项目时，确保 B 项目已编译"
date: 2020-06-18 08:53:17 +0800
categories: visualstudio dotnet
position: problem
---

如果考虑在你的某个项目中安插一个专门用来做编译的项目，这个项目要求最先编译，那么你会考虑用什么方法呢？

本文讲述在编译 A 项目时，确保 B 项目已编译的方法。

---

<div id="toc"></div>

## 使用 MSBuild 编译目标来编译

A 在编译的时候，需要确保 B 项目已经编译（因为可能用到 B 的输出）。

然而 A 项目并不需要引用 B，因为仅仅是编译需要用到 B 而已，不需要在最终产品中带上 B。

那么在 A 项目中，使用 `MSBuild` 编译任务来编译 B：

```xml
<Project Sdk="Microsoft.NET.Sdk">

    <PropertyGroup>
        <TargetFramework>net48</TargetFramework>
    </PropertyGroup>

    <Target Name="BuildTheCompilerProject" BeforeTargets="BeforeBuild">
        <MSBuild Projects="..\Walterlv.Packages.Compiler\Walterlv.Packages.Compiler.csproj" Targets="Build" Properties="Configuration=$(Configuration);Platform=$(Platform)" />
    </Target>

</Project>
```

而 B 项目，则可能是框架完全不兼容的另一种项目：

```xml
<Project Sdk="Microsoft.NET.Sdk">

    <PropertyGroup>
        <TargetFramework>netcoreapp3.1</TargetFramework>
    </PropertyGroup>

</Project>
```

## 其他方法

本文的方法已加入到此类型解法的方法列表中，详情请看：

- [三种方法设置 .NET/C# 项目的编译顺序，而不影响项目之间的引用 - walterlv](https://blog.walterlv.com/post/affects-project-building-order.html)
