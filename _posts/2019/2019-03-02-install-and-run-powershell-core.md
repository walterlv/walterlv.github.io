---
title: "安装和运行 .NET Core 版本的 PowerShell"
publishDate: 2019-03-02 17:29:05 +0800
date: 2019-04-30 19:37:52 +0800
tags: dotnet powershell
position: knowledge
coverImage: /static/posts/2019-03-02-16-13-46.png
permalink: /posts/install-and-run-powershell-core.html
---

Windows 自带一个强大的 PowerShell，不过自带的 PowerShell 一直是基于 .NET Framework 的版本。你可以下载安装一个 .NET Core 版本的 PowerShell，以便获得 .NET Core 的各种好处。包括跨平台，以及更好的性能。

本文将介绍在你的 Windows 系统上安装一个 .NET Core 版本的 PowerShell。

---

![PowerShell Core 的图标](/static/posts/2019-03-02-16-13-46.png)

<div id="toc"></div>

## 下载和安装

前往 .NET Core 版本 PowerShell 的发布页面来下载 PowerShell 全平台的安装包：

- [Releases · PowerShell/PowerShell](https://github.com/PowerShell/PowerShell/releases)

Windows 平台上建议下载 msi 格式的安装包，这样它可以帮助你完成大多数的安装任务。

![PowerShell 安装界面](/static/posts/2019-03-02-16-05-32.png)

![PowerShell 安装配置](/static/posts/2019-04-30-19-37-42.png)

## 运行

在安装完成之后启动新的 .NET Core 版本的 PowerShell 可以看见新的 PowerShell。

![.NET Core 版本的 PowerShell](/static/posts/2019-03-02-16-08-33.png)

在任何一个文件夹中右键可打开 PowerShell 或者以管理员权限打开 PowerShell。这与自带的 PowerShell 的玩法是类似的。

![使用右键菜单打开 PowerShell](/static/posts/2019-03-02-16-14-49.png)

## 在其他终端使用 PowerShell Core

如果你要在其他的终端使用 PowerShell Core，直接输入 `pwsh` 即可。其原理可以参考我的另一篇博客：

- [让你的 Windows 应用程序在任意路径也能够直接通过文件名执行 - 吕毅](/post/run-your-application-without-full-executable-path)

![在 cmd 中启动 PowerShell Core](/static/posts/2019-03-02-17-28-53.png)


