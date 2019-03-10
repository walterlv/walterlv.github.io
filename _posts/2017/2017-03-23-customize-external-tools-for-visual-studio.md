---
title: "使用 Visual Studio 自定义外部命令 (External Tools) 快速打开 git bash 等各种工具"
publishDate: 2017-03-23 10:01:40 +0800
date: 2019-03-04 11:06:33 +0800
categories: visualstudio
position: knowledge
---

Visual Studio 支持自定义的外部命令，于是即便 Visual Studio 原生没有的功能，插件没有提供的功能，你也能仅仅通过配置就实现。比如，我们可以一键打开 Git Bash 输入 git 命令，比如可以一键打开项目或者文件所在的文件夹。

本文将教你如何自定义 Visual Studio 的外部命令，并提供一些我自己正在使用的外部命令配置。

---

<div id="toc"></div>

![在 Visual Studio 中的外部命令](/static/posts/2019-02-02-10-13-02.png)

看，就是一键的按钮！

所以，你想不想也在 Visual Studio 的工具栏上增加高效率的功能按钮呢？

- 一键打开 Git Bash
- 一键打开解决方案所在文件夹
- 一键 Blame 正在打开的文件 *(话说 VS17 的 Blame 功能也没好到哪儿去，还是得 TortoiseGit)*

我们开始吧！

## 第一步：自定义外部命令

打开 [工具] -> [外部命令]，然后在新打开的对话框中编辑外部命令。

![自定义外部命令](/static/posts/2019-02-02-10-17-11.png)

为了方便，我把我自己正在用的几个外部命令分享给大家：

1. 用于一键打开 Git Bash，以便快速输入 git 命令
    - [Title] `打开 Git Bash`
    - [Command] `C:\Program Files\Git\git-bash.exe`
    - [Arguments] `--cd="$(SolutionDir)\."`
    - [InitialDirectory] `"$(SolutionDir)"`

    <!-- 1. 用于一键打开 Git Bash，以便快速输入 git 命令
        - [Title] `打开 Git Bash`
        - [Command] `C:\Program Files\Git\usr\bin\mintty.exe`
        - [Arguments] `--nodaemon -o AppID=GitForWindows.Bash -o AppLaunchCmd="C:\Program Files\Git\git-bash.exe" -o AppName="Git Bash" -i "C:\Program Files\Git\git-bash.exe" --store-taskbar-properties -- /usr/bin/bash --login -i`
        - [InitialDirectory] `"$(SolutionDir)"` -->

1. 用于快速打开解决方案所在的文件夹（通常这也是 git 仓库的根目录）
    - [Title] `在资源管理器中查看此解决方案`
    - [Command] `C:\Windows\explorer.exe`
    - [Arguments] `/select,"$(SolutionDir)$(SolutionFileName)"`
    - [InitialDirectory] `"$(SolutionDir)"`

1. 用于快速打开当前正在编辑的文件所在的文件夹
    - [Title] `在资源管理器中查看此文件`
    - [Command] `C:\Windows\explorer.exe`
    - [Arguments] `/select,"$(ItemPath)"`
    - [InitialDirectory] `"$(ItemDir)"`

1. 使用 VSCode 打开此解决方案（这可以用来快速编辑某些 VS 中不方便编辑的文件）
    - [Title] `使用 VSCode 编辑`
    - [Command] `%LocalAppData%\Programs\Microsoft VS Code\Code.exe`
    - [Arguments] `"$(SolutionDir)"`
    - [InitialDirectory] `"$(SolutionDir)"`

1. 使用 TortoiseGit 来 Blame 此文件（而且还会自动定位到当前行）
    - [Title] `追溯此文件`
    - [Command] `C:\Program Files\TortoiseGit\bin\TortoiseGitBlame.exe`
    - [Arguments] `"$(ItemPath)" /line:$(CurLine)`
    - [InitialDirectory] `"$(ItemDir)"`

1. 使用 TortoiseGit 来查看此文件的 git 日志
    - [Title] `查看此文件的历史记录`
    - [Command] `C:\Program Files\TortoiseGit\bin\TortoiseGitProc.exe`
    - [Arguments] `/command:log /path:"$(ItemPath)"`
    - [InitialDirectory] `"$(ItemDir)"`

## 第二步：自定义工具条按钮

点击工具条最右侧的小箭头，然后添加删除按钮，在长长的下拉框的最后，有一个“自定义”菜单项。打开，我们接下来的操作都在这里面。

![添加或删除按钮](/static/posts/2019-02-02-10-36-57.png)

随后，按照下图操作添加一个外部命令。注意，外部命令的序号从 1 开始，就是我们在上一节外部命令框中那些命令的序号。

![添加一个外部命令](/static/posts/2019-02-02-10-41-32.png)

然后，编辑这个外部命令。

![编辑这个外部命令](/static/posts/2019-02-02-10-43-42.png)

在一个个添加完成之后，Visual Studio 的顶部工具栏中就会出现我们刚刚添加的各种外部命令了。点击可以一键使用相应的功能。

![添加并编辑完的外部命令](/static/posts/2019-02-02-10-52-26.png)
