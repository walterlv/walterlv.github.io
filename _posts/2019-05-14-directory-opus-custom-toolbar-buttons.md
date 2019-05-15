---
title: "在 Directory Opus 中添加自定义的工具栏按钮提升效率"
publishDate: 2019-05-14 19:52:15 +0800
date: 2019-05-15 08:58:25 +0800
categories: windows
position: starter
---

使用 Directory Opus 替代 Windows 自带的文件资源管理器来管理你计算机上的文件可以极大地提高你的文件处理效率。

Directory Opus 自定义的工具栏按钮可以执行非常复杂的命令，所以充分利用自定义工具栏按钮的功能可以更大程度上提升工作效率。

---

<div id="toc"></div>

## Directory Opus 的工具栏

这是我的 Directory Opus 的界面（暂时将左侧的树关掉了）：

![Directory Opus](/static/posts/2019-05-14-16-53-32.png)

下图是我目前添加的一些工具栏按钮：

![Directory Opus 的工具栏按钮](/static/posts/2019-05-14-16-52-05.png)

## 自定义工具栏按钮

自定义的方法是，点击顶部的 `设置` -> `自定义工具栏`：

![自定义工具栏菜单](/static/posts/2019-05-14-19-36-51.png)

这时，会弹出自定义工具栏的对话框，并且所有可以被定制的工具栏现在都会进入编辑状态等待着我们对其进行编辑：

![正在自定义工具栏](/static/posts/2019-05-14-19-38-31.png)

## 添加一个自定义按钮

你并不需要在自定义工具栏对话框上进行任何操作，只需要在一个现有的工具栏上点击右键，然后点击 `新建` -> `新建按钮`：

![新建按钮](/static/posts/2019-05-14-19-41-16.png)

这时，你会看到一个新的按钮已经出现在了工具栏上：

![新建的按钮](/static/posts/2019-05-14-19-44-51.png)

现在，在此按钮上点击右键，“编辑”，就打开了 Directory Opus 的命令编辑器：

![命令编辑器](/static/posts/2019-05-14-19-45-44.png)

接下来，我们的操作就进入了本文的主要内容，也是最复杂的一部分内容了。

## 命令编辑器

要定义一个能够极大提升效率的按钮，命令编辑器中的多数框我们都是要使用的。

接下来我会通过两个示例来说明如何使用这个命令编辑器。

1. [Directory Opus 使用命令编辑器集成 TortoiseGit 的各种功能](/post/directory-opus-integrate-with-tortoise-git.html)
1. [Directory Opus 使用命令编辑器添加 PowerShell / CMD / Bash 等多种终端到自定义菜单](/post/directory-opus-integrate-with-terminals.html)

## 一切皆命令

在阅读上面的博客定义完一些自己的命令之后，你再观察 Directory Opus 的其他工具栏按钮，包括左上角的菜单，你会发现其实 Directory Opus 中所有的功能按钮和菜单都是使用相同的机制建立起来的。

一切皆命令。

这些命令组成了 Directory Opus 主界面的绝大多数功能。
