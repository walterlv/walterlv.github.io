---
title: "让你的 VSCode 具备调试 C# 语言 .NET Core 程序的能力"
date: 2019-03-14 22:01:44 +0800
categories: dotnet csharp vscode msbuild visualstudio
position: starter
published: false
---

如果你是开发个人项目，那就直接用 Visual Studio Community 版本吧，对个人免费，对小团体免费，不需要这么折腾。

如果你是 Mac / Linux 用户，不想用 Visual Studio for Mac 版；或者不想用 Visual Studio for Windows 版那么重磅的 IDE 来开发简单的 .NET Core 程序；或者你就是想像我这么折腾，那我们就开始吧！

---

<div id="toc"></div>

## 安装 .NET Core Sdk、Visual Studio Code 和 C# for Visual Studio Code

1. [点击这里下载正式或者预览版的 .NET Core](https://dotnet.microsoft.com/download) 然后安装
2. [点击这里下载 Visual Studio Code](https://code.visualstudio.com/download) 然后安装
3. 在 Visual Studio Code 里安装 C# for Visual Studio Code 插件（步骤如下图所示）

![安装 C# for Visual Studio Code 插件](/static/posts/2019-03-14-20-01-52.png)

搜索的时候，推荐使用 `OmniSharp` 关键字，因为这可以得到唯一的结果，你不会弄混淆。*如果你使用 C# 作为关键字，那需要小心，你得找到名字只有 C#，点开之后是 C# for Visual Studio Code 的那款插件。因为可能装错，所以我不推荐这么做。*

对于新版的 Visual Studio Code，装完会自动启用，所以你不用担心。我们可以后续步骤了。

## 使用 VSCode 创建 .NET Core 项目

本文不会讲解如何使用 VSCode 创建 .NET Core 项目，因为这不是本文的重点。

也许你可以参考我还没有写的另一篇博客。

## 打开一个现有的 .NET Core 项目

现在假设你已经有一个现成的能用 Visual Studio 跑起来的 .NET Core 控制台项目了（可能是刚克隆下来的，也可能就是用我另一篇博客中的教程创建的），于是我们就在这个项目上进行开发。

本文以我的自动化测试程序 Walterlv.InfinityStartupTest 为例进行说明。如果你找不到合适的例子，可以使用这篇博客创建一个。

在这个文件夹的根目录下右键，然后 `使用 Code 打开`。

![使用 Visual Studio Code 打开文件夹](/static/posts/2019-03-14-20-14-15.png)

## 配置编译和调试环境

正常情况下，当你用 Visual Studio Code 打开一个包含 .NET Core 项目的文件夹时，C# 插件会在右下角弹出通知提示，问你要不要为这个项目创建编译和调试文件，当然选择“Yes”。

![创建编译和调试文件的提示](/static/posts/2019-03-14-20-23-09.png)

这个提示一段时间不点会消失的，但是右下角会有一个小铃铛（上面的图片也可以看得到的），点开可以看到刚刚消失的提示，然后继续操作。

这时，你的项目文件夹中会多出两个文件，都在 .vscode 文件夹中。`tasks.json` 是编译文件，指导如何进行编译；`launch.json` 是调试文件，指导如何进行调试。

![多出的编译文件和调试文件](/static/posts/2019-03-14-20-39-17.png)

## 开始调试

现在，你只需要按下 F5（就是平时 Visual Studio 调试按烂的那个），你就能使用熟悉的调试方式在 Visual Studio Code 中来调试 .NET Core 程序了。

下图是调试进行中各个界面的功能分区。如果你没看到这个界面，请点击左侧那只被圈在圆圈里面的小虫子。

![Visual Studio Code 中的 .NET Core 调试界面](/static/posts/2019-03-14-20-52-08.png)

当你按照本文操作，在按下 F5 后有各种报错，那么原因只有一个——你的这个项目本身就是编译不过的，你自己用命令行也会编译不过。你需要解决编译问题，而本文只是入门教程，不会说如何解决编译问题。

## 手工设置 tasks.json 和 launch.json 文件

如果自动创建的这两个文件有问题，或者你根本就找不到自动创建的入口，可以考虑手工创建这两个文件。

请参见博客：

- [手工编辑 tasks.json 和 launch.json，让你的 VSCode 具备调试 .NET Core 程序的能力](/post/equip-vscode-manually-for-dotnet-core-app-debugging.html)

## 编写 C# 代码

请参见博客：

- [让你的 VSCode 具备调试 C# 语言 .NET Core 程序的能力](/post/equip-vscode-for-dotnet-core-app-debugging.html)
