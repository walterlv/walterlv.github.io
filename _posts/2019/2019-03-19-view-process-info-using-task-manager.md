---
title: "Windows 系统上使用任务管理器查看进程的各项属性（命令行、DPI、管理员权限等）"
date: 2019-03-19 19:52:39 +0800
tags: windows
position: knowledge
coverImage: /static/posts/2019-03-19-18-51-09.png
---

Windows 系统上的任务管理器进化到 Windows 10 的 1809 版本后，又新增了几项可以查看的进程属性。

本文介绍可以使用任务管理器查看的各种进程属性。

---

<div id="toc"></div>

## 如何查看进程的各种属性

在任务栏上右键，选择“任务管理器”；或者按下 Ctrl + Shift + Esc 可以打开任务管理器。如果你的电脑死掉了，也可以按 Ctrl + Alt + Del 再选择任务管理器打开。

在顶部列表标题上右键，可以选择列，在这里可以打开和关闭各种各样可以查看的进程属性。

![任务管理器，选择列](/static/posts/2019-03-19-18-51-09.png)

## 名称、PID、状态

名称不用多说，就是启动这个进程时的程序文件的名称。

值得注意的是，名称自进程启动时就确定了，即便你在运行期间改了名字，进程名也不会变。关于运行期间改名，可以参见：

- [Windows 上的应用程序在运行期间可以给自己改名（可以做 OTA 自我更新） - 吕毅](/post/rename-executable-self-when-running)。

PID 可以唯一确定当前系统运行期间的一个进程，所以用 PID 来找到进程是最靠谱的（前提是你拿得到）。这里有一个有意思的事情，可以阅读这些文章：

- [Windows 的 PID为什么是 4 的倍数 - 开源中国社区](https://www.oschina.net/question/23734_29378)
- [WINDOWS 进程或线程号为什么是 4 的倍数 - GUO Xingwang - 博客园](http://www.cnblogs.com/Thriving-Country/archive/2011/09/18/2180143.html)

进程的状态可以阅读：

- [进程的挂起状态详细分析 - FreeeLinux's blog - CSDN博客](https://blog.csdn.net/freeelinux/article/details/53562592)

## 路径名称、命令行

路径名称可以帮助我们了解这个进程是由计算机上的哪个程序启动产生的。

不过我更喜欢的是“命令行”。因为除了可以看进程的路径之外，还可以了解到它是如何启动的。比如下面这篇博客中，我就是在任务管理器了解到这些工具的启动参数的。

- [使用 Visual Studio 自定义外部命令 (External Tools) 快速打开 git bash 等各种工具 - 吕毅](/post/customize-external-tools-for-visual-studio)

关于命令行中的路径，可以参见我的其他博客：

- [.NET 命令行参数包含应用程序路径吗？ - 吕毅](/post/when-will-the-command-line-args-contain-the-executable-path)
- [.NET/C# 获取一个正在运行的进程的命令行参数 - 吕毅](/post/get-command-line-for-a-running-process)

## 用户名、特权、UAC 虚拟化

我把这三项放在一起说，是因为这三项是与 UAC 相关的项。

用户名指的是启动此进程的那个用户的用户名，这在调试一些提权程序的时候可能会有用。因为对于管理员账户而言，提权前后是同一个用户；而对于标准账户，提权后进程将是管理员账户的进程，于是两个进程运行在不同的用户空间下，可能协作上会出现一些问题。

关于用户账户以及提权相关的问题，可以阅读 [Windows 中的 UAC 用户账户控制 - 吕毅](/post/windows-user-account-control)。

特权（Privilege）指的是此进程是否运行在管理员权限下。值为“是”则运行在管理员权限下，值为“否”则运行在标准账户权限下。

关于特权级别相关的问题，可以阅读 [Windows 中的 UAC 用户账户控制 - 吕毅](/post/windows-user-account-control)。

UAC 虚拟化相关的问题可以阅读 [应用程序清单 Manifest 中各种 UAC 权限级别的含义和效果 - 吕毅](/post/requested-execution-level-of-application-manifest)。

## DPI 感知

可以查看进程的 DPI 感知级别。

进程的 DPI 感知级别有以下这些，名字来源于 Windows 系统任务管理器上的显示名称。

- 不知道 (Unaware)
- 系统 (System DPI Awareness)
- 每个显示器 (Per-Monitor DPI Awareness)
- 每个显示器(v2) (Per-Monitor V2 DPI Awareness)

关于 DPI 感知级别的更多内容，可以阅读我的其他博客：

- [Windows 下的高 DPI 应用开发（UWP / WPF / Windows Forms / Win32） - 吕毅](/post/windows-high-dpi-development)
- [支持 Windows 10 最新 PerMonitorV2 特性的 WPF 多屏高 DPI 应用开发 - 吕毅](/post/windows-high-dpi-development-for-wpf)

