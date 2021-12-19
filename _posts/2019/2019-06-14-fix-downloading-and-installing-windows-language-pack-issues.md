---
title: "Windows 10 解决无法完整下载安装语言包（日语输入法无法下载使用）"
publishDate: 2019-06-14 23:14:44 +0800
date: 2019-06-16 20:53:20 +0800
tags: windows
position: problem
coverImage: /static/posts/2019-06-14-22-05-03.png
permalink: /posts/fix-downloading-and-installing-windows-language-pack-issues.html
---

最近我想在我的 Windows 10 上安装一个新的语言包，在 “设置” -> “时间和语言” -> “语言” 中，添加了新的语言之后，语言进入了下载状态。但是没过一小会儿，下载进度条就结束了，提示语言已经下载安装完成。但实际上只能作为显示使用，（日语）输入法却不能使用。

我找了很多的资料试图解决这个问题，但发现竟然没有任何一种现有方法可以解决我的问题（这可能是日语输入法特有的问题吧）。最终解决后，我将网上搜集到的方法以及我实际解决所使用的方法都收录进来，方便大家后续解决问题。

---

<div id="toc"></div>

## 问题描述

网上找到了一段跟我几乎一样的描述，[可以前往这里查看](https://answers.microsoft.com/zh-hans/windows/forum/all/win10%E6%97%A0%E6%B3%95%E5%AE%8C%E6%95%B4%E4%B8%8B/22663fe8-5fd8-402d-bcc8-b4ce0c2e38b0)。我发现他描述得非常准确，所以就直接引用了他的原话：

> 添加语言的时候能下载显示语言，点进选项后发现输入语言没有自动下载和安装，手动点下载，进度条在卡在前半不动，几秒后自动跳掉。
> 
> 造成的影响是：1.日文输入法能出现，但无法切换到假名状态，只能输入英文；……

我能够添加完成日语，并且它也能作为我的显示语言正常显示。但是进入语言之后，发现里面的三个可供下载的扩展选项都没有下载。而如果手动点击下载，无论如何也没有反应。由于输入法就是这里的第一个扩展选项，所以虽然可以切换到日语的微软输入法，但是只能输入英文字母，而无法输入任何日语文字（にほんご）。

如下图，无论怎么点击都不会下载。重启无效。

![怎么点都没反应](/static/posts/2019-06-14-22-05-03.png)

## 解决

网上的解决方案有很多种，我这里整理最有可能解决问题的两种。

- 删除下载缓存（通用解决方案）
- 暂时关闭 UAC（本次我是此方法成功的）
- 其他方法（请点击本文最后的参考链接，包含我的各种参考资料）

### 删除下载缓存

前往文件夹：`C:\Windows\SoftwareDistribution\Download`。

这里面的内容都是 Windows 的各种下载的缓存。如果是因为下载的文件损坏，那么删除此文件夹中的全部内容通常可以解决问题。

你不用担心删除此文件夹会出现什么问题，因为重新下载那些缓存所付出的代价往往比修复的问题本身更小。

在时机尝试中，我删除了此文件夹后，重新启动计算机。我发现再点击语言下载之后不会是没有反应了，而是出现了一小会儿的进度条；再随后才继续恢复成没有下载的状态。再之后，也是怎么点击下载也没有反应了。

于是几乎可以认定语言包的下载缓存确认是在这个路径中的，但是导致无法下载安装的本质原因却不是这个。

### 暂时关闭 UAC

后来我尝试了网上的其他各种方案，都没有解决。包括删除重新安装语言包，包括使用 PowerShell 脚本删除语言列表项，包括清理注册表项等等。

我突然间异想天开认为有可能是 UAC（用户账户控制）的问题，但是无论使用中文还是英文搜索，无论使用谷歌还是必应搜索引擎，无论翻了多少页，都没有找到此问题与 UAC 有关的文章、帖子或解决方案。

但我还是尝试了。

我打开了 UAC 设置，临时把滑块从最顶部拖到最底部，以关闭 UAC。

![UAC 设置](/static/posts/2019-06-14-23-09-00.png)

点击“下载”后，终于有反应可以继续完成下载了。看起来是解决了，但这三个下载按钮只有一个可以继续下载安装。但是我重启计算机之后，三个按钮都可以正常点击下载安装了。

![已经可以开始下载安装了](/static/posts/2019-06-14-22-05-23.png)

![已经可以开始下载安装了](/static/posts/2019-06-14-22-05-34.png)

最后，我把 UAC 拖到最顶部还原我的设置。

关于为什么我会拖到最顶部，你可以阅读我的另一篇博客：

- [Windows 的 UAC 设置中的通知等级实际上只有两个档而已](/post/there-are-only-two-settings-for-the-uac-slider)

### 进程监控与调试

当然，我还尝试过使用 Visual Studio 附加 SystemSettings.exe 进程进行调试，发现在每次点击“下载”没有反应的时候会看到出现了一个“线程已结束”的输出，并没有实际上的意义。

我也希望通过 Process Monitor 查看下载失败时是否涉及到 IO，结果也没有什么线索。

### 其他方法

另外，有小伙伴说可以去另一台可以下载安装的电脑上拷贝 `C:\Windows\IME\IMEJP` 目录过来也可以使用。

## 期望

幸好最终解决了问题，希望可以帮到读者。

如果你有其他方法解决了问题，或者说你试过了各种方法也没有解决问题，欢迎在本文原文的评论区留言，也许能找到更合适的解决办法。

---

**参考资料**

- [WIN10无法完整下载日语语言包，不能下载基本输入语言，不能下载日语补充字库。。&# - Microsoft Community](https://answers.microsoft.com/zh-hans/windows/forum/all/win10%E6%97%A0%E6%B3%95%E5%AE%8C%E6%95%B4%E4%B8%8B/22663fe8-5fd8-402d-bcc8-b4ce0c2e38b0)
- [Windows 10（1903）无法下载英语基本输入法、手写、语音功能 - Microsoft Community](https://answers.microsoft.com/zh-hans/windows/forum/all/windows/c5d81b0f-a223-4fad-bb63-df6e82f91a26)
- [(Fixed) How to Download and Install Windows 10 Language Pack](https://www.jihosoft.com/tips/download-install-windows-10-language-pack.html)
- [Win10的日语输入法无法安装功能 - Microsoft Community](https://answers.microsoft.com/zh-hans/windows/forum/all/win10%E7%9A%84%E6%97%A5%E8%AF%AD%E8%BE%93%E5%85%A5/846ee4e4-0f15-4431-9faa-b4e170230c4b)
- [win10输入法可选功能无法安装 - Microsoft Community](https://answers.microsoft.com/zh-hans/windows/forum/all/win10%E8%BE%93%E5%85%A5%E6%B3%95%E5%8F%AF%E9%80%89/89f90932-bab3-49e3-b74a-afe272f17461)
- [win10 可选功能更新（输入法）失败 - Microsoft Community](https://answers.microsoft.com/zh-hans/windows/forum/all/win10/9ae722f4-0c8e-4864-a4e7-018bf478bc87)
- [解决Windows10专业版无法安装语言包！！！ - Antrn的博客 - CSDN博客](https://blog.csdn.net/qq_38232598/article/details/80687009)
- [Win10 1803日文输入法问题 - Kevin的博客 - CSDN博客](https://blog.csdn.net/yinghua12a/article/details/81105287)


