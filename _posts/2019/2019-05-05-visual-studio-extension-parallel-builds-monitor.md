---
title: "Visual Studio 使用 Parallel Builds Monitor 插件迅速找出编译速度慢的瓶颈，优化编译速度"
date: 2019-05-05 21:42:43 +0800
tags: visualstudio dotnet
position: starter
coverImage: /static/posts/2019-05-05-21-34-42.png
permalink: /post/visual-studio-extension-parallel-builds-monitor.html
---

嫌项目编译太慢？不一定是 Visual Studio 的问题，有可能是你项目的引用关系决定这个编译时间真的省不下来。

可是，编译瓶颈在哪里呢？本文介绍 Parallel Builds Monitor 插件，帮助你迅速找出编译瓶颈。

---

<div id="toc"></div>

## 下载安装 Parallel Builds Monitor

前往 [Parallel Builds Monitor - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=ivson4.ParallelBuildsMonitor-18691) 下载插件安装。

之后启动 Visual Studio 2019，你就能在 “其他窗口” 中找到 “Parallel Builds Monitor” 窗口了。请点击打开它。

## 编译项目

现在，使用 Visual Studio 编译一个项目，点开这个窗口，一个正在进行中的甘特图将呈现出来：

![并行编译窗口](/static/posts/2019-05-05-21-34-42.png)

## 寻找瓶颈

我们可以通过此插件寻找到多种可能的瓶颈：

1. 项目依赖瓶颈
1. CPU 瓶颈
1. IO 瓶颈

### 项目依赖瓶颈

看上面的那张图，这里存在典型的项目依赖瓶颈。因为在编译的中后期，几个编译时间最长的项目，其编译过程完全是串联起来编译的。

这里串联起来的每一个项目，都是依赖于前一个项目的。所以要解决掉这部分的性能瓶颈，我们需要断开这几个项目之间的依赖关系，这样它们能变成并行的编译。

### CPU 瓶颈

通常，CPU 成为瓶颈在编译中是个好事情，这意味着无关不必要的编译过程非常少，主要耗时都在编译代码的部分。当然，如果你有一些自定义的编译过程浪费了 CPU 占用那是另外一回事。

比如我之前写过自己可以做一个工具包，在编译期间会执行一些代码：

- [如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包](/post/create-a-cross-platform-msbuild-task-based-nuget-tool)

### IO 瓶颈

IO 本不应该成为瓶颈。如果你的项目就是存在非常多的依赖文件需要拷贝，那么应该尽可能利用差量编译来避免重复拷贝文件。

<!-- ## 解决瓶颈

在上面的图片中，我们首先要解决的瓶颈就是项目依赖瓶颈，因为从图中我们可以得出，如果后面的 3~4 个项目可以并行编译，那么将节省 15~20 秒甚至更多的编译时间。做法，就是删除项目依赖，将无法编译过的代码采用依赖注入等方式解耦。 -->

---

**参考资料**

- [Parallel Builds Monitor - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=ivson4.ParallelBuildsMonitor-18691)
- [KrzysztofBuchacz/ParallelBuildsMonitor](https://github.com/KrzysztofBuchacz/ParallelBuildsMonitor)


