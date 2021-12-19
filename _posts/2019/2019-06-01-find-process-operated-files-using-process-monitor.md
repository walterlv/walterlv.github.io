---
title: "使用 ProcessMonitor 找到进程所操作的文件的路径"
date: 2019-06-01 13:49:15 +0800
tags: windows
position: problem
coverImage: /static/posts/2019-06-01-13-36-35.png
permalink: /posts/find-process-operated-files-using-process-monitor.html
---

很多系统问题都是可以修的，不需要重装系统，但是最近我还是重装了。发现之前正在玩的一款游戏的存档没有了……因为我原有系统的数据并没有删除，所以我还是能找回原来的游戏存档的。但是，我怎么知道这款游戏将存档放在了那个路径下呢？搜索当然是好方法，不过我喜欢玩的游戏大多是冷门游戏，有些搜不到。于是我就用 Process Monitor 找到了存档所在，恢复了我的游戏进度。

本文介绍如何使用 ProcessMonitor 找出进程创建和修改的文件路径。

---

<div id="toc"></div>

## 下载 Process Monitor

Process Monitor 是微软极品工具箱的一部分，你可以在此页面下载：

- [Process Monitor - Windows Sysinternals - Microsoft Docs](https://docs.microsoft.com/en-us/sysinternals/downloads/procmon)

## 打开 Process Monitor

当你一开始打开 Process Monitor 的时候，列表中会立刻刷出大量的进程的操作记录。这么多的记录会让我们找到目标进程操作的文件有些吃力，于是我们需要设置规则。

Process Monitor 的工具栏按钮并不多，而且我们这一次的目标只会用到其中的两个：

- 清除列表（将已经记录的所有数据清空，便于聚焦到我们最关心的数据中）
- 设置过滤器（防止大量无关的进程操作进入列表中干扰我们的查找）

![Process Monitor 的工具栏按钮](/static/posts/2019-06-01-13-36-35.png)

## 设置过滤规则

我启动了我想要玩的游戏，在任务管理器中发现它的进程名称是 RIME.exe。呃……如果你也想玩，给你个链接：

- [RiME - Explore the beautiful yet rugged world of RiME](https://www.epicgames.com/store/en-US/product/rime/home)

点击设置过滤规则按钮，可以看到下面的界面：

![设置过滤器](/static/posts/2019-06-01-13-40-45.png)

可以选定 `某个名词` `与另一个字符串` `进行某种操作` 之后 `引入 (Include)` 或 `排除 (Exclude)`。

我希望找到 RIME 这款游戏的游戏存档位置，所以我需要进入游戏，玩到第一个会存档的地方之后观察监视的操作记录。

所以我希望的过滤器规则是：

1. 将所有不是 RIME.exe 进程的记录全部排除；
1. 将不是文件操作的记录全部排除；
1. 将读文件的记录排除（这样剩下的只会是写文件，毕竟游戏读文件很频繁的）。

于是我设置了这些规则：

```
[ProcessName] is [RIME.exe]      then [Exclude]
[Operation]   is [RegOpenKey]    then [Exclude]
[Operation]   is [RegCloseKey]   then [Exclude]
[Operation]   is [RegQueryKey]   then [Exclude]
[Operation]   is [RegQueryValue] then [Exclude]
[Operation]   is [RegEnumKey]    then [Exclude]
[Operation]   is [RegSetInfoKey] then [Exclude]
[Operation]   is [ReadFile]      then [Exclude]
```

这样，剩下的记录将主要是文件写入以及一些不常见的操作了。

## 分析记录

现在，我在游戏里面玩到了第一个存档点，终于在 Process Monitor 的进程列表中看到了创建文件和写入文件相关的操作了。

![记录的列表](/static/posts/2019-06-01-13-47-11.png)

通过观察 Path 的值，我可以知道 RIME 游戏的存档放在了 `%LocalAppData%\SirenGame` 文件夹下。

于是我关掉 RIME 游戏，将原来系统中的此文件夹覆盖到新系统中的此文件夹之后，再次打开游戏，我恢复了我的全部游戏存档了。


