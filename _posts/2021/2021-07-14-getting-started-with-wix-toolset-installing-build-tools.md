---
title: "用 WiX 制作安装包：安装 WiX Toolset 工具集"
date: 2021-07-14 17:47:10 +0800
tags: dotnet msi wix
position: starter
coverImage: /static/posts/2021-07-14-14-22-57.png
permalink: /posts/getting-started-with-wix-toolset-installing-build-tools.html
---

本文是 [WiX Toolset 安装包制作入门教程](/post/getting-started-with-wix-toolset) 系列中的首篇，可前往阅读完整教程。

WiX 提供一组工具集，我们的安装包正是通过这一组工具集来编译生成的。你可以通过很多方式来安装这组工具集，本文会提到多种方案，但仅会详细说其中一种，以便让教程尽可能简单。

---

<div id="toc"></div>

## 从官网下载安装 WiX Toolset

请前往其 GitHub 发布页下载：

- [Releases · wixtoolset/wix3](https://github.com/wixtoolset/wix3/releases)

为了简单，可下载其中的 wix311.exe 文件。这份安装包可帮助我们更简单地部署好 WiX Toolset 的构建环境。

点击中间最大的那个按钮“Install”即可开始安装：

![安装 WiX Toolset](/static/posts/2021-07-14-installing-wix-toolset.gif)

安装完成之后，在中间的按钮上它会提示可以安装 Visual Studio 集成：

![推荐安装 Visual Studio 集成](/static/posts/2021-07-14-14-22-57.png)

点击这个按钮后可安装 Visual Studio 插件。关于安装此插件的详细信息，可阅读下一篇入门博客：

- [安装 WiX Toolset Visual Studio 插件](/post/getting-started-with-wix-toolset-installing-visual-studio-extensions)

另特别说明一下，这个安装包界面是用 WPF 做的。是后续入门教程系列博客里也会说到如何做一个 WPF 界面的安装包。

## 其他安装途径

此段非新手教程部分，如果不关心可略过。

### scoop 安装

如果你安装有 scoop 包管理器，可直接输入以下命令安装：

```powershell
scoop install wixtoolset
```

这套工具是在 scoop 的 main bucket 里面的，所以无需添加新的 bucket。安装完成后会自动添加环境变量，所以即便是 scoop 安装后，也可以直接在 Visual Studio 里面正常构建安装包。

### nuget 安装

以上方式均为全局安装，如果是团队合作，要求所有维护 WiX 安装包的开发人员都安装好 WiX Toolset。你也可以考虑将 WiX 安装到你的某个 Visual Studio 项目中，这样打开此项目的所有开发人员在还原 NuGet 包后都自动拥有了 WiX 全套工具集。

使用 NuGet 的方式是按项目安装的，仅此解决方案（sln）有效。安装了此 NuGet 包的项目将可完全使用 WiX 工具集（因为包里包含了构建安装包需要的 MSBuild 属性）。

以下是 NuGet 包中自带的属性一览：

```xml
<Project ToolsVersion="4.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <PropertyGroup>
    <WixInstallPath>$(MSBuildThisFileDirectory)..\tools</WixInstallPath>
    <WixExtDir>$(WixInstallPath)\</WixExtDir>

    <WixTargetsPath>$(WixInstallPath)\wix.targets</WixTargetsPath>
    <LuxTargetsPath>$(WixInstallPath)\lux.targets</LuxTargetsPath>

    <WixTasksPath>$(WixInstallPath)\WixTasks.dll</WixTasksPath>
    <WixSdkPath>$(WixInstallPath)\sdk\</WixSdkPath>
    <WixCATargetsPath>$(WixSdkPath)wix.ca.targets</WixCATargetsPath>
  </PropertyGroup>
</Project>
```

如果感兴趣通过 NuGet 的方式来安装 WiX Toolset，我可以再写一篇专门使用此方式安装并在团队所有人电脑上可直接构建安装包的博客。


