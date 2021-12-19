---
title: "Linux 系统根目录下的文件夹"
date: 2020-01-30 16:02:14 +0800
tags: linux
position: starter
coverImage: /static/posts/2020-01-30-16-00-42.png
permalink: /posts/linux-root-directories.html
---

本文介绍 Linux 系统根目录下的各种文件夹及其用途，了解这些目录可以帮助你更好地管理你的 Linux 主机。

---

<div id="toc"></div>

## Linux 系统根目录

各个不同 Linux 发行版的根目录会有一些区别，但大多数发行版的主要的目录都是有的。

- `/bin` binary 用于存放经常使用的命令
- `/boot` boot 启动时的一些核心文件
- `/dev` device 外部设备
- `/etc` 用于存放各种系统配置和管理配置（名字来源于法语 et cetera，意思就是 etc...，表示还有一些其他的东西等等，其实就是指一堆杂项，不过现在就用来存放一堆配置文件了）
- `/home` 用户目录，里面按用户名命名了子文件夹
- `/lib` library 存放系统最基本的动态链接共享库
- `/lib64` library 64bit 动态链接库的 64 位版本
- `/lost+found` 一般情况下是空的，但在非法关闭后，这里就会存放一些文件
- `/media` 识别出的 U 盘，光驱等会在这个目录下
- `/mnt` mount 系统提供此文件夹用于给用户挂载其他的文件系统，例如光驱
- `/opt` 用于安装软件的目录
- `/proc` 是一个虚拟目录，是系统的内存映射，可通过访问此目录获取系统信息（这个目录的内容不在硬盘上而在内存里）
- `/root` 超级管理员 root 用户的主目录
- `/run` 用于在系统启动时运行的程序
- `/sbin` super binary 系统超集管理员使用的系统管理程序
- `/srv` service 存放一些服务启动之后需要提取的数据。
- `/sys` 存放 Linux 系统内核文件
- `/tmp` 用于存放一些临时文件
- `/usr` 用户的应用程序和文件都在此目录下，类似于 Windows 系统中的 Program Files 目录
- `/var` 经常被修改的文件可以放到这个目录，比如说日志文件

![Linux 系统根目录](/static/posts/2020-01-30-16-00-42.png)

---

**参考资料**

- [Linux 系统目录结构 - 菜鸟教程](https://www.runoob.com/linux/linux-system-contents.html)
- [Linux中etc目录详解大全总汇详解_mianjunan的博客-CSDN博客](https://blog.csdn.net/mianjunan/article/details/6684966)


