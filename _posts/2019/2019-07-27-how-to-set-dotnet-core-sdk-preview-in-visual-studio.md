---
title: "如何在 Visual Studio 2019 中设置使用 .NET Core SDK 的预览版（全局生效）"
publishDate: 2019-07-27 09:38:56 +0800
date: 2019-09-24 08:37:39 +0800
tags: msbuild visualstudio dotnet
position: starter
---

.NET Core 3 相比于 .NET Core 2 是一个大更新。也正因为如此，即便它长时间处于预览版尚未发布的状态，大家也一直在使用。

Visual Studio 2019 中提供了使用 .NET Core SDK 预览版的开关。但几个更新的版本其开关的位置不同，本文将介绍在各个版本中的位置，方便你找到然后设置。

---

<div id="toc"></div>

## Visual Studio 2019 (16.3 及以上)

.NET Core 3.0 已经发布，下载地址：

- [Download .NET (Linux, macOS, and Windows)](https://dotnet.microsoft.com/download)

Visual Studio 16.3 与 .NET Core 3.0 正式版同步发布，因此不再需要 .NET Core 3.0 的预览版设置界面。你只需要安装正式版 .NET Core SDK 即可。

## Visual Studio 2019 (16.2)

从 Visual Studio 2019 的 16.2 版本，.NET Core 预览版的设置项的位置在：

- `工具` -> `选项`
- `环境` -> `预览功能` -> `Use previews of the .NET Core SDK (需要 restart)`


![Visual Studio 2019 16.2 的设置位置](/static/posts/2019-07-27-18-31-15.png)

如果你是英文版的 Visual Studio，也可以参考英文版：

- `Tools` -> `Options`
- `Environment` -> `Preview Features` -> `Use previews of the .NET Core SDK (requires restart)`

![Option location of Visual Studio 2019 16.2](/static/posts/2019-07-27-18-34-43.png)

## Visual Studio 2019 (16.1)

从 Visual Studio 2019 的 16.1 版本，.NET Core 预览版的设置项的位置在：

- `工具` -> `选项`
- `环境` -> `预览功能` -> `使用 .NET Core SDK 的预览`

![Visual Studio 2019 16.1 的设置位置](/static/posts/2019-07-27-09-00-09.png)

如果你是英文版的 Visual Studio，也可以参考英文版：

- `Tools` -> `Options`
- `Environment` -> `Preview Features` -> `Use previews of the .NET Core SDK`

![Option location of Visual Studio 2019 16.1](/static/posts/2019-07-27-09-11-48.png)

## Visual Studio 2019 (16.0 和早期预览版)

在 Visual Studio 2019 的早期，.NET Core 在设置中是有一个专用的选项的，在这里：

- `工具` -> `选项`
- `项目和解决方案` -> `.NET Core` -> `使用 .NET Core SDK 预览版`

![Visual Studio 2019 16.0 的设置位置](/static/posts/2019-07-27-09-08-23.png)

如果你是英文版的 Visual Studio，也可以参考英文版：

- `Tools` -> `Options`
- `Projects and solutions` -> `.NET Core` -> `Use previews of the .NET Core SDK`

![Option location of Visual Studio 2019 16.0](/static/posts/2019-07-27-09-23-36.png)

## 关于全局配置

Visual Studio 2019 中此对于 .NET Core SDK 的预览版的设置是全局生效的。

也就是说，你在 Visual Studio 2019 中进行了此设置，在命令行中使用 `MSBuild` 或者 `dotnet build` 命令进行编译也会使用这样的设置项。

那么这个全局的设置项在哪个地方呢？是如何全局生效的呢？可以阅读我的其他博客：

- [Visual Studio 2019 中使用 .NET Core 预览版 SDK 的全局配置文件在哪里？](/post/where-is-the-dotnet-sdk-preview-config-file)
- [找出 .NET Core SDK 是否使用预览版的全局配置文件在那里（探索篇）](/post/find-out-the-dotnet-sdk-preview-config-file)
