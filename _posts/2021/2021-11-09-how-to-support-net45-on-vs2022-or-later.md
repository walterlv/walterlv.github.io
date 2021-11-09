---
title: "Visual Studio 2022 升级不再附带 .NET Framework 4.5 这种古老的目标包了，本文帮你装回来"
date: 2021-11-09 09:58:41 +0800
categories: visualstudio dotnet
position: problem
---

就在北京时间 2021 年 11 月 9 日凌晨，Visual Studio 2022 正式发布了！着急升级的小伙伴兴致勃勃地升级并卸载了原来的 Visual Studio 2019 后，发现自己的几个库项目竟然无法编译通过了。究其原因，是因为我的一些库依旧在支持古老的 .NET Framework 4.5 框架，而 Visual Studio 2022 不再附带如此古老的目标包了。

本文将说说如何继续让 Visual Studio 2022 编译古老的 .NET Framework 4.5 框架项目。

---

<div id="toc"></div>

## 无法编译 .NET Framework 4.5 项目

为了更广泛的适用于各种项目，我的一些库兼容的框架版本是非常古老的（比如下图截取的这张）。可是卸载掉 Visual Studio 2019 只留下 Visual Studio 2022 之后这些项目就不再能编译通过了。如果点开 Visual Studio 2022 的安装程序，会发现已经删除掉了 .NET Framework 4.5 的目标包了，无法通过它安装回来。

![支持古老的框架](/static/posts/2021-11-09-09-46-36.png)

![无法编译 .NET Framework 4.5 项目](/static/posts/2021-11-09-09-45-32.png)

![没有 .NET Frameweork 4.5 的目标包](/static/posts/2021-11-09-09-49-26.png)

## 重新安装回 .NET Framework 4.5 的目标包

重新安装 Visual Studio 2019 可以让你重新安装 .NET Framework 4.5 目标包，然而现在再去 Visual Studio 的官网，会发现下载链接已经全面替换成了新出的 Visual Studio 2022 了，那我改如何下载回来？

事实上，旧版的 Visual STudio 可以在这里下载：

* [Visual Studio 2019](https://docs.microsoft.com/zh-cn/visualstudio/releases/2019/history)

当然，更早的版本就算在这份文档里也找不到下载链接了；还想要下载的话可能得去 Visual Studio 订阅里下了。如果担心 Visual Studio 2019 不久后也丢失，可以自行收藏一下下载的文件。

由于你已经有一个新的主力 Visual Studio 2022 了，所以再装 Visual Studio 2019 时就不需要勾选负载了，只需要勾选 2022 版本不带的几个目标包即可：

* .NET Framework 4 目标包
* .NET Framework 4.5 目标包
* .NET Framework 4.5.1 目标包

![勾选 .NET Framework 4.5 目标包](/static/posts/2021-11-09-09-57-43.png)
