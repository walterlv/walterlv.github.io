---
title: "将基于 .NET Framework 的 WPF 项目迁移到基于 .NET Core 3"
date: 2018-12-06 09:01:48 +0800
categories: dotnet wpf
position: starter
published: false
---

在 Connect(); 2018 大会上，微软发布了 .NET Core 3 Preview，以及基于 .NET Core 3 的 WPF；同时还发布了 Visual Studio 2019 预览版。你可以基于 .NET Core 3 创建 WPF 程序。不过，如果你已经有基于 .NET Framework 的 WPF 项目，那么如何快速迁移到基于 .NET Core 的版本呢？

本文将指导大家将现有基于 .NET Framework 的 WPF 项目迁移到基于 .NET Core 3 的版本。

---

<div id="toc"></div>

### 安装 .NET Core 3.0 Preview SDK

前往官网下载：[.NET Core 3.0 downloads for Linux, macOS, and Windows](https://dotnet.microsoft.com/download/dotnet-core/3.0)。

然后安装。

### 编辑 csproj 文件

卸载你原有的 WPF 项目，然后右键“编辑 csproj 文件”。将里面所有的内容改为以下代码：

```xml
<Project Sdk="Microsoft.NET.Sdk.WindowsDesktop">
  <PropertyGroup>
    <TargetFramework>netcoreapp3.0</TargetFramework>
    <UseWPF>true</UseWPF>

    <!-- 如果你的项目是 Exe，则设为 WinExe；如果是 WPF 类库，则删掉这一行 -->
    <OutputType>WinExe</OutputType>

    <!-- 如果你的原有项目中有 App.manifest 文件，则在此加入 -->
    <!-- <ApplicationManifest>Properties\App.manifest</ApplicationManifest> -->

    <!-- 如果你的原有项目中有 App.ico 图标，则在此加入 -->
    <!-- <ApplicationIcon>Properties\App.ico</ApplicationIcon> -->

    <!-- 如果你的原有项目中有自定义的 Main 函数，则在此加入 -->
    <!-- <StartupObject>Walterlv.Whitman.Program</StartupObject> -->
  </PropertyGroup>
  <ItemGroup>

    <!-- 如果你的原有项目中有自己添加的图标文件，则在此加入 -->
    <Resource Include="Properties\App.ico" />

  </ItemGroup>
</Project>
```

### 编辑 AssemblyInfo.cs 文件

### 恢复 NuGet 包

---

#### 参考资料