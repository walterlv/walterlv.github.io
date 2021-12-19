---
title: "如何创建一个基于 .NET Core 3 的 WPF 项目"
publishDate: 2018-12-06 11:11:05 +0800
date: 2019-03-19 18:30:07 +0800
tags: dotnet wpf
position: starter
---

在 Connect(); 2018 大会上，微软发布了 .NET Core 3 Preview，以及基于 .NET Core 3 的 WPF；同时还发布了 Visual Studio 2019 预览版。不过 Visual Studio 2019 的预览版中并没有携带 WPF on .NET Core 3 的模板，于是新建项目的时候并不能快速创建一个基于 .NET Core 3 的 WPF 项目。

本文将指导大家如何创建一个基于 .NET Core 3 的 WPF 项目。

---

<div id="toc"></div>

## 安装 .NET Core 3.0 Preview SDK

前往官网下载：[.NET Core 3.0 downloads for Linux, macOS, and Windows](https://dotnet.microsoft.com/download/dotnet-core/3.0)。

然后安装。

如果你没有安装 Visual Studio 2019 Preview，请前往下载：[Visual Studio 2019](https://visualstudio.microsoft.com/vs/preview/)。

## 使用 Visual Studio 2019 创建

1. 启动 Visual Studio 2019，选择“创建新项目”
1. 选择 WPF App (.NET Core)，下一步
1. 输入项目名称、位置和解决方案名称，创建

![创建新项目](/static/posts/2019-03-19-18-26-22.png)

![WPF App (.NET Core)](/static/posts/2019-03-19-18-26-27.png)

![创建](/static/posts/2019-03-19-18-26-33.png)

## 使用命令行创建

刚刚发布 .NET Core 3.0 和 Visual Studio 2019 第一个预览版的时候，Visual Studio 还不能创建 .NET Core 3.0 的 WPF 程序，所以会有这一小节用命令行来创建。

当然，有时我也会用 Visual Studio Code 来写简单的程序，这个时候也用得到命令行：

- [让你的 VSCode 具备调试 C# 语言 .NET Core 程序的能力 - 吕毅](/post/equip-vscode-for-dotnet-core-app-debugging)

### 运行新建命令

在桌面或其他你要新建项目的文件夹中打开 PowerShell，然后输入命令：

```powershell
dotnet new wpf -o WalterlvWpfApp
```

其中，后面的 `WalterlvWPfApp` 是 WPF 项目的名称。

这时，你会在你刚刚准备的文件夹中发现刚刚新建的 WPF 项目。

![刚刚新建的 WPF 项目](/static/posts/2018-12-06-08-52-20.png)  
▲ 刚刚新建的 WPF 项目

### 打开这个 csproj 文件

在 Visual Studio 中打开这个 csproj 文件即可在 Visual Studio 2019 Preview 中基于这个新的 WPF on .NET Core 3 的项目进行开发。

![新的 WPF 项目](/static/posts/2018-12-06-08-55-09.png)  
▲ 新的 WPF 项目。

## 更多

如果你希望将现有基于 .NET Framework 的 WPF 项目迁移到 .NET Core 3，那么请阅读我的另一篇博客：[将基于 .NET Framework 的 WPF 项目迁移到基于 .NET Core 3](/post/migrate-wpf-project-from-dotnet-framework-to-dotnet-core)。

可以持续关注官方 WPF on .NET Core 的例子：[samples/wpf/WPF-WinRT at master · dotnet/samples](https://github.com/dotnet/samples/tree/master/wpf/WPF-WinRT)。
