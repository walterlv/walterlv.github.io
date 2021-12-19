---
title: "使用 Visual Studio 编译时，让错误一开始发生时就停止编译（以便及早排查编译错误节省时间）"
date: 2019-06-30 13:36:09 +0800
tags: visualstudio dotnet csharp
position: starter
coverImage: /static/posts/2019-06-30-13-28-01.png
permalink: /posts/cancel-building-if-error-occurred-in-visual-studio.html
---

对于稍微大一点的 .NET 解决方案来说，编译时间通常都会长一些。如果项目结构和差量编译优化的好，可能编译完也就 5~30 秒，但如果没有优化好，那么出现 1~3 分钟都是可能的。

如果能够在编译出错的第一时间停止编译，那么我们能够更快地去找编译错误的原因，也能从更少的编译错误列表中找到出错的关键原因。

---

如果你只是觉得你的项目或解决方案编译很慢而不知道原因，我推荐你安装 Parallel Builds Monitor 插件来调查一下。你可以阅读我的一篇博客来了解它：

- [Visual Studio 使用 Parallel Builds Monitor 插件迅速找出编译速度慢的瓶颈，优化编译速度 - walterlv](/post/visual-studio-extension-parallel-builds-monitor)

一个优化比较差的解决方案可能是下面这个样子的：

![优化比较差的解决方案的编译甘特图](/static/posts/2019-06-30-13-28-01.png)

明明没有多少个项目，但是项目之间的依赖几乎是一条直线，于是不可能开启项目的并行编译。

图中这个项目的编译时长有 1 分 30 秒。可想而知，如果你的改动导致非常靠前的项目编译错误，而默认情况下编译的时候会继续尝试编译下去，于是你需要花非常长的时间才能等待编译完毕，然后从一大堆项目中出现的编译错误中找到最开始出现错误的那个（通常也是编译失败的本质原因）。

现在，推荐使用插件 [VSColorOutput](https://marketplace.visualstudio.com/items?itemName=MikeWard-AnnArbor.VSColorOutput)。

它的主要功能是给你的输出窗格加上颜色，可以让你更快速地区分调试信息、输出、警告和错误。

不过，也正是因为它是通过匹配输出来上色的，于是它可以得知你的项目出现了编译错误，可以采取措施。

在你安装了这款插件之后，你可以在 Visual Studio 的“工具”->“设置”中找到 VSColorOutput 的设置。其中有一项是“Stop Build on First Error”，打开之后，再出现了错误的话，将第一时间会停止。你也可以发现你的 Visual Studio 错误列表中的错误数量非常少了，这些错误都是导致编译失败的最早出现的错误，利于你定位问题。

![VSColorOutput 的设置](/static/posts/2019-06-30-13-32-45.png)


