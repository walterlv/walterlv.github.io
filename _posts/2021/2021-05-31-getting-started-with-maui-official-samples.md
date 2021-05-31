---
title: "编译并体验 .NET MAUI 官方示例代码"
date: 2021-05-31 14:35:49 +0800
categories: dotnet maui
position: starter
---

在微软的 Build 2021 大会上，微软发布了 .NET 6 Preview 4，同时发布了于它的 MAUI 第四个预览版。在 MAUI 成为 Visual Studio 2022 的官方工作负载之前，成功编译并运行 MAUI 的示例程序会比较麻烦，本文旨在帮助大家完成示例程序的编译运行和体验。

---

<div id="toc"></div>

## TL;DR

本段属太长不读系列。完整版请看下一段。

截至 2021 年 5 月 31 日，要成功编译并运行 .NET MAUI 官方示例项目，你需要准备如下环境：

1. 安装 Visual Studio 2019 16.11 Preview 1 或更高版本（否则只能编译而无法运行，旧版 VS 不知道如何调试这种项目）
1. 安装 .NET 6 Preview 4（MAUI 示例项目要求的最低 .NET 版本）
1. 安装 maui-check，检查并修复所有环境问题（包含各类 SDK、模拟器等）
1. 增加 NuGet 源 https://aka.ms/maui-preview/index.json（否则无法识别用到的 MAUI 类型）

在以上都准备就绪的情况下，你只需要使用 Visual Studio 2019 16.11 Preview 1 创建 MAUI 项目或打开官方 MAUI 示例项目即可调试 MAUI 项目。

当然，预计 .NET 6 和 Visual Studio 2022 发布后，MAUI 将成为 Visual Studio 工作负载的一部分。届时，只需要在 Visual Studio 2022 里勾选 MAUI 就够了，其他什么也不用管。

## 安装 Visual Studio 2019 16.11 Preview 1 或更高版本

如果你电脑上已经安装过预览版的 Visual Studio，那么直接去开始菜单搜索并打开 Visual Studio Installer，然后把预览版更新到最新就好了。但如果你电脑上只有正式版的 Visual Studio，那么你需要前往预览版的下载地址下载一个预览版的在线安装包来安装。

- [下载 Visual Studio 预览版（常年不变的地址）](https://visualstudio.microsoft.com/zh-hans/vs/preview/)

![更新 Visual Studio 预览版](/static/posts/2021-05-31-15-02-58.png)

## 安装 .NET 6 Preview 4

你还需要将你电脑上的 .NET 更新到 .NET 6 Preview 4 或者以上的版本。

- [下载 .NET 6（常年不变的地址）](https://dotnet.microsoft.com/download/dotnet/6.0)

## 安装 maui-check 工具

打开你喜爱的终端，然后输入如下命令：

```powershell
dotnet tool install -g redth.net.maui.check
```

这将在全局安装 maui-check 工具，辅助你完成 MAUI 开发环境的搭建。

工具安装完成后，直接输入命令 `maui-check` 然后回车运行，工具将自动检查你的电脑上是否已完成 MAUI 开发环境的搭建。它会在检查到问题之后发出轻轻的一声“嘟”，然后问你：“要尝试修复吗？（! Attempt to fix?）”你只需要打 `y` 告诉它要修复就好了。

这样的问题会问很多次，你都需要答 `y` 修复，甚至可能还需要多次运行 `maui-check` 工具来进行修复。

![Attempt to fix? [y/n] (y)](/static/posts/2021-05-31-15-12-11.png)

到最后，当你再次运行 `maui-check` 时，它会兴奋地告诉你：“Congratulations, everything looks great!”这意味着，MAUI 所需的环境已全部搭建完成。

![MAUI 所需环境已全部搭建完成](/static/posts/2021-05-31-15-19-09.png)

## 增加 NuGet 源

我有另一篇博客介绍如何添加 NuGet 源，详细的方法你可以去那里看：

- [全局或为单独的项目添加自定义的 NuGet 源 - walterlv](http://blog.walterlv.com/post/add-custom-nuget-source.html)

要简单一点，你只需要在命令行中输入：

```powershell
dotnet nuget add source -n maui-preview https://aka.ms/maui-preview/index.json
```

这会直接修改 `%AppData%\NuGet\NuGet.Config` 文件，并在其中添加一行 NuGet 源。

## MAUI 官方示例仓库

在以上所有步骤执行完成之后，以下项目就能直接在 Visual Studio 2019 16.11 Preview 1 或更高版本中编译并调试了。

- [dotnet/maui-samples: .NET 6 preview samples. Not for production use. The main branch tracks the current preview release, and develop tracks the upcoming preview.](https://github.com/dotnet/maui-samples)
- [davidortinau/WeatherTwentyOne](https://github.com/davidortinau/WeatherTwentyOne)

例如，以 [maui-samples](https://github.com/dotnet/maui-samples) 项目举例，将 HelloMaui 项目设为启动项目，在 Visual Studio 中将启动框架设置为 .net6.0-android，就可以在 Android 模拟器中运行 HelloMaui 应用了。

![设置启动框架](/static/posts/2021-05-31-15-34-18.png)

以下是 HelloMaui 在 Android 模拟器中的运行效果。

![官方 DEMO 在 Android 模拟器中的运行效果](/static/posts/2021-05-31-hello-maui-sample.gif)

另外，Visual Studio 2019 16.11 Preview 1 中已经内置了 MAUI 的项目模板，你也可以直接新建 MAUI 项目自行调试。

![新建 MAUI 项目](/static/posts/2021-05-31-15-37-54.png)

## 其他问题

目前，我还无法成功调试官方示例中的 HelloMauiWinUI3 项目，会出现 COM 异常，未注册类。正在寻找原因和解决方案中……

---

**参考资料**

- [Announcing .NET MAUI Preview 4 - .NET Blog](https://devblogs.microsoft.com/dotnet/announcing-net-maui-preview-4/)
