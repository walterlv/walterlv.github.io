---
title: "ReSharper 在 C 盘占用了太多空间了，本文告诉你如何安全地删除或转移这些文件"
date: 2019-01-30 20:34:19 +0800
categories: dotnet resharper windows
position: problem
---

一个不小心，我的 SSD 又满了。到底是谁占用了那么多的空间！如果你是 ReSharper 的重度用户，那么可能你的调查结果会直指 JetBrains ReSharper。

本文将告诉你如何安全地删除这些文件来释放你的 C 盘空间，然后在 ReSharper 中设置其他的缓存目录。

---

<div id="toc"></div>

## 消失的 C 盘空间

SSD 很贵的，看看都满成什么样儿了……我一个 SSD 分成了 C 和 D 两个分区，都满了。

![近乎满了的 SSD](/static/posts/2019-01-30-20-23-31.png)

你可以使用 SpaceSniffer 来快速调查占用你大量 C 盘空间的到底是些什么文件。我之前写过一篇文章介绍如何使用它：

- [找回你 C 盘丢失的空间（SpaceSniffer）](/windows/2017/09/17/find-lost-space-using-space-sniffer.html)

当你是 ReSharper 的重度用户的时候，你很有可能会看到如下的场景：

![JetBrains 家的软件竟然占据了这么多空间](/static/posts/2019-01-30-19-58-03.png)

是的，JetBrains 家的软件竟然占用了 17.2GB 的 C 盘空间！他们一定认为所有的用户都是土豪，能够买 500GB 以上的 SSD 全部分配给 C 盘。

好的，吐槽就到这里，我们进入正题——删除这些文件。

## 删除 ReSharper 的缓存目录

注意：**只有 Transient 文件夹是可以删除的**！

ReSharper 安装时的目录都在 `%LocalAppData%\JetBrains` 中。虽然运行时的缓存也在这里，但是如果你直接把这个目录删掉了，那么 ReSharper 插件以及 JetBrains 全家桶也就不能正常使用了。

Transient 意思跟 Temporary 差不多，就是短暂使用的文件。不过 ReSharper 竟然在这里堆了这么多。

![Transient](/static/posts/2019-01-30-20-10-46.png)

删除掉这个文件夹不影响 ReSharper 及其他 JetBrains 全家桶的正常运行。

ReSharper 在设置中提供了清除缓存的按钮，但那个按钮点了其实释放不了多少空间的，本文最后一句将说明这个问题。

![删除 Transient 目录](/static/posts/2019-01-30-20-34-07.png)

## 转移 ReSharper 的缓存目录

1. 从 Visual Studio 的菜单中进入 ReSharper 的设置界面：ReSharper -> Options；
2. 进入缓存设置选项：Environment -> General -> Caches -> Store solution。

在这里可以修改 ReSharper 缓存文件的存储位置。

不过可得提醒你一下，ReSharper 这么耗性能的插件，还是老老实实放 SSD 里面吧，SSD 再怎么贵比起你的时间来说可便宜多了呀！

![ReSharper Options](/static/posts/2019-01-30-20-27-21.png)

![更改缓存目录](/static/posts/2019-01-30-20-28-18.png)

可以在这个界面中看到，ReSharper 其实是提供了清除缓存的按钮（Clear）的，但是这个按钮点击之后其实只是会删除当前项目的缓存。而实际上 ReSharper 在你的电脑上积攒久了是众多缓存文件一起占用的太多空间，只删除最近正在使用的这个项目其实根本释放不了多少空间的。（比如我打开我的 Walterlv.CloudKeyboard 项目清除结果只删掉了不到 100M 的空间。）

---

**参考资料**

- [Remove old caches – ReSharper Support - JetBrains](https://resharper-support.jetbrains.com/hc/en-us/community/posts/360000087690-Remove-old-caches)
