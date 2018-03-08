---
title: "解决 mklink 使用中的各种坑（硬链接，软链接/符号链接，目录链接）"
date: 2018-03-06 09:33:04 +0800
categories: windows
published: false
---

通过 mklink 命令可以创建文件或文件夹的链接，而这种链接跟快捷方式是不一样的。然而我们还可能会遇到其使用过程中的一些坑，本文将整理这些坑并提供解决方法。

---

<div id="toc"></div>

### 0x00 背景介绍：mklink

mklink 是一个为

### 0x01 坑 1：权限


---

#### 参考链接

- [win10 无法运行mklink命令同步onedrive和电脑数据 - Microsoft Community](https://answers.microsoft.com/zh-hans/windows/forum/windows_10-files-winpc/win10/8df12869-96f4-4cd1-a914-355e908a6015)
- [Win10下执行mklink提示你没有足够权限执行此操作 - CSDN博客](http://blog.csdn.net/u011583025/article/details/52908508)
