---
title: "在 VSCode 中使用带参数的快捷键执行指定命令"
date: 2018-12-30 21:43:14 +0800
categories: vscode
position: starter
published: false
---

为 VSCode 安装插件可以添加各种各样的功能，不过有时候我只是期望简单配置一个私有的功能。这时候通用性可能更加重要 —— 一个能够执行所有命令并支持快捷键和参数的方法。

本文将介绍如何在 VSCode 中实现。

---

<div id="toc"></div>

## 安装插件 Shell

安装插件 Shell：[Shell - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=bbenoist.shell)。

![Shell 插件](/static/posts/2018-12-30-17-06-59.png)

在安装完之后，按下 F1 并输入 Shell 你可以发现 Shell 插件带来的几个命令：

- `Run Command` 执行命令
- `Run Command at Active File Location` 在当前激活的文件上执行命令
- `Show Command History` 显示命令的执行历史
- `Show Command Log` 显示命令日志
- `Terminate Running Command` 结束当前正在执行的命令

![Shell 命令带来的几个插件](/static/posts/2018-12-30-17-11-00.png)

## Shell 插件的基本使用

实际上本文并不想说 Shell 插件的基本使用，因为你可以在插件的官方 README 中找到所有的使用方法。

[Shell - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=bbenoist.shell)

## 为命令绑定快捷键

![打开 VSCode 的快捷键设置](/static/posts/2018-12-30-17-12-49.png)


