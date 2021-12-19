---
title: "如何给 Windows Terminal 增加一个新的终端（以 Bash 为例）"
date: 2019-07-03 16:51:53 +0800
tags: windows
position: starter
coverImage: /static/posts/2019-07-03-16-24-01.png
permalink: /posts/add-a-new-profile-for-windows-terminal.html
---

Windows Terminal 的预览版本可以在微软应用商店下载，下载完后它原生就可以打开三个不同的终端 PowerShell Core、CMD 和 PowerShell。然而我的计算机上还安装了一个 Bash 可以如何添加到 Windows Terminal 里呢？

本文将介绍添加一个新终端应该如何修改配置。

---

## 下载安装 Windows Terminal

Windows Terminal 预览版已上架微软应用商店，你可以前往下载：

- <https://www.microsoft.com/store/productId/9N0DX20HK701>

随后，在开始菜单中启动 Windows Terminal。

![Windows Terminal](/static/posts/2019-07-03-16-24-01.png)

## 打开配置文件

在界面的右上角点按下拉按钮，点击“Settings”可以打开配置文件。

![Settings](/static/posts/2019-07-03-16-23-22.png)

这个配置文件虽然看起来有 300+ 行，但实际上结构非常简单。我把它折叠起来加上一点点注释你应该很容易看出其配置文件的结构。

![配置文件的结构](/static/posts/2019-07-03-16-29-08.png)

## 新增一个 profile

我们把原来的一个 profile 复制一份出来，这样我们就能够写一份自己的终端配置了。

![新复制出来一个 profile](/static/posts/2019-07-03-16-31-12.png)

下面是我添加的 Bash 的配置。如果你是通过安装 Git for Windows 而安装的 Git Bash，那么默认路径就是 `C:\Program Files\Git\bin\bash.exe`。

```json
{
    "acrylicOpacity" : 0.5,
    "closeOnExit" : true,
    "colorScheme" : "Campbell",
    "commandline" : "C:\\Program Files\\Git\\bin\\bash.exe",
    "cursorColor" : "#FFFFFF",
    "cursorShape" : "bar",
    "fontFace" : "Monaco",
    "fontSize" : 12,
    "guid" : "{1d4e097e-fe87-4164-97d7-3ca794c316fd}",
    "historySize" : 9001,
    "icon" : "C:\\Users\\walterlv\\Resources\\Icons\\git-bash.png",
    "name" : "Bash",
    "padding" : "0, 0, 0, 0",
    "snapOnInput" : true,
    "startingDirectory" : "%USERPROFILE%",
    "useAcrylic" : true
},
```

注意，必须要改的有这些项：

1. `commandline` 你需要改成你的新的终端的路径；
1. `guid` 必须使用新的跟其他终端不重复的 guid；
1. `name` 改为终端的名称（本例中是 Bash，虽然不是必须，但强烈建议修改）

Visual Studio 自带了一个 guid 生成工具，你可以在菜单的工具中找到：

![Visual Studio 自带的 GUID 生成工具](/static/posts/2019-07-03-16-36-12.png)

你也可以在网上搜索 GUID 生成器得到很多在线的 GUID 生成工具。

另外，还有一些可选的参数：

- `useAcrylic` 使用亚克力效果
- `acrylicOpacity` 亚克力效果透明度
- `colorScheme` 配色方案（配置文件后面自带了五种配色方案，你也可以额外再添加新的配色方案）
- `fontFace` 字体名称
- `fontSize` 字号大小
- `icon` 图标
- `startingDirectory` 初始路径

其中，你可能需要一个 `icon` 文件，下面有一个 Git Bash 的图标，有需要自取：

![Git Bash 图标](/static/posts/2019-07-02-10-22-00.png)

## 最终效果

在你按下 Ctrl+S 保存这个配置文件之后，配置将会立刻生效。你可以在你的 Windows Terminal 中看到你新增的 Bash 终端了。

![最终效果](/static/posts/2019-07-03-16-51-11.png)


