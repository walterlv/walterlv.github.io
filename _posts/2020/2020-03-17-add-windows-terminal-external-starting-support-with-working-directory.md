---
title: "将 Windows Terminal 作为外部工具集成到其他工具/程序/代码中"
publishDate: 2020-03-17 10:05:58 +0800
date: 2020-03-24 09:49:23 +0800
tags: windows dotnet
position: knowledge
coverImage: /static/posts/2020-03-17-09-52-28.png
---

Windows Terminal 在 Windows 上是一款 UWP 应用，然而其依然具有良好的与外部工具的集成特性，你可以在其他各种工具中配置使用 Windows Terminal 打开。

本文介绍如何配置使用 Windows Terminal 打开。

---

<div id="toc"></div>

## 命令行调用

在应用商店可以下载到 [Windows Terminal (Preview)](https://www.microsoft.com/store/productId/9N0DX20HK701)，下载安装后，你就可以开始使用 `wt` 命令了，这可以用来启动 Windows Terminal。（这里要说明一下，虽然你可以找到应用程序在 `C:\Program Files\WindowsApps\Microsoft.WindowsTerminal_0.9.433.0_x64__8wekyb3d8bbwe\WindowsTerminal.exe` 下，但是你并没有权限直接去运行 UWP 应用的 exe 入口。

因此，你在任意的命令行工具，甚至是 Win+R 运行窗口，或者开始菜单的搜索中输入 `wt` 回车就可以运行 Windows Terminal 了。

增加的命令实际上来自于 `C:\Users\lvyi\AppData\Local\Microsoft\WindowsApps` 目录。你可以进入这个目录找到商店应用增加的所有的命令。

默认情况下直接打开会进入用户文件夹下。

![默认打开](/static/posts/2020-03-17-09-52-28.png)

如果需要在特定的工作目录下打开，则需要修改配置。请点击设置按钮打开配置文件，然后修改默认终端的 `startingDirectory` 属性，从 `%USERPROFILE%` 修改到其他路径：

![打开设置](/static/posts/2020-03-17-09-53-59.png)

如果需要使用“当前工作路径”，则将 `startingDirectory` 修改为 `%__CD__%`。注意，CD 两边分别是两个下划线。

```diff
    {
      ……
      "snapOnInput": true,
--    "startingDirectory": "%USERPROFILE%",
++    "startingDirectory": "%__CD__%",
      "useAcrylic": true
    },
```

在修改成 `%__CD__%` 之后，如果通过快捷方式直接启动 Windows Terminal，则会看到路径被切换到了 `C:\Windows\System32`。不过这不重要，因为即便是选择了用户路径，每次启动也都是要切走的。

## 工具集成

在了解了以上命令行调用后，工具集成就简单多了，只需要设置好启动 `wt` 命令，以及设置好工作路径即可。

如下图是我在 Directory Opus 中设置的 Windows Terminal 的一键打开按钮：

![在 Directory Opus 中设置](/static/posts/2020-03-17-10-02-46.png)

关于 Directory Opus 集成工具可以参见我的其他博客：

- [在 Directory Opus 中添加自定义的工具栏按钮提升效率 - walterlv](https://blog.walterlv.com/post/directory-opus-custom-toolbar-buttons.html)
- [Directory Opus 使用命令编辑器添加 PowerShell / CMD / Bash 等多种终端到自定义菜单 - walterlv](https://blog.walterlv.com/post/directory-opus-integrate-with-terminals.html)

## C# 代码调用

使用 C# 代码启动的方法也非常常规，直接 `Process.Start` 然后设置工作路径即可。前提是前面设置了 `%__CD__%` 为启动路径。

```csharp
var info = new ProcessStartInfo{
	FileName = "wt.exe",
	WorkingDirectory = @"D:\walterlv",
	UseShellExecute = false,
};
Process.Start(info);
```

---

**参考资料**

- [Programmatically Opening Windows Terminal in a Specific Folder - Rick Strahl's Web Log](https://weblog.west-wind.com/posts/2019/Sep/03/Programmatically-Opening-Windows-Terminal-in-a-Specific-Folder)

