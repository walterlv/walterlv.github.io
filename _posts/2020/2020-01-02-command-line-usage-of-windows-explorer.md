---
title: "Windows 系统文件资源管理器的命令行参数（如何降权打开程序，如何选择文件）"
date: 2020-01-02 11:05:18 +0800
tags: windows
position: knowledge
coverImage: /static/posts/2020-01-02-08-17-31.png
permalink: /posts/command-line-usage-of-windows-explorer.html
---

大多数用户还是习惯使用 Windows 自带的文件资源管理器来管理文件，于是我们可以利用它的命令行参数来帮助我们做一些与之相关的交互。

本文会以实际的例子来说明如何使用 explorer.exe 的命令行参数。

---

<div id="toc"></div>

## 打开文件

在命令行中输入 `explorer D:\Services\blog.walterlv.com\test.txt` 即可打开 `test.txt` 文件。不过，这个时候是间接使用文件资源管理器打开的文件，效果跟我们直接在文件资源管理器中双击打开这个文件的效果是一样的。

![使用文件资源管理器打开文件](/static/posts/2020-01-02-08-17-31.png)

## 启动程序

实际上利用文件资源管理器启动程序和前面的打开文件是同一种命令，不过我特别拿出来说，是因为使用这种方式来启动程序还有一种特别的功效：

- **可以降权执行**

使用方法：

```powershell
explorer D:\Services\blog.walterlv.com\Walterlv.Blog.Home.exe
```

如果你当前进程是管理员权限，那么可以通过 `explorer` 间接启动将新启动的进程降低到与 `explorer` 同级别的权限。

不过，有几点需要注意的：

1. 如果用来降权，那么只会降到与文件资源管理器同级别的权限
    - 而文件资源管理器是什么权限在 Windows 7 上和 Windows 8/8.1/10 上不同
    - Windows 8/8.1/10 无论开关 UAC 都是普通用户权限，除非你特别使用任务管理器（Task Manager）以管理员权限启动文件资源管理器
    - Windows 7 在开启 UAC 的情况下，文件资源管理器是以普通用户权限运行的
    - Windows 7 在关闭 UAC 的情况下，文件资源管理器是以管理员权限运行的
1. 不允许给间接启动的程序携带命令行参数
    - 如果你试图传入额外的参数，那么最终不会执行这个程序，只会打开一个根你的程序毫无关系的文件管理器的新窗口而已
1. `explorer` 必须是已经启动的状态（大多数时候都是这样）

关于利用文件资源管理器降权执行程序的内容，可以阅读我的另一篇博客：

- [在 Windows 系统上降低 UAC 权限运行程序（从管理员权限降权到普通用户权限） - walterlv](https://blog.walterlv.com/post/start-process-with-lowered-uac-privileges.html)

关于 UAC 权限相关的内容，可以阅读我的另一篇博客：

- [Windows 中的 UAC 用户账户控制 - walterlv](https://blog.walterlv.com/post/windows-user-account-control.html)
- [Windows 的 UAC 设置中的通知等级实际上只有两个档而已 - walterlv](https://blog.walterlv.com/post/there-are-only-two-settings-for-the-uac-slider.html)

如果你使用 .NET 程序来完成启动程序的话，可能需要关注 `UseShellExecute`。不过利用 `explorer` 间接启动就无所谓了，无脑设置为 `false` 就好，因为它自己就相当于 Shell。

- [C#/.NET 中启动进程时所使用的 UseShellExecute 设置为 true 和 false 分别代表什么意思？ - walterlv](https://blog.walterlv.com/post/use-shell-execute-in-process-start-info.html)

## 打开某个文件夹

```powershell
explorer D:\Services\blog.walterlv.com
```

![使用文件资源管理器打开文件夹](/static/posts/2020-01-02-08-56-00.png)

## 选择某个文件

在与其他工具集成的时候，如果有需求要打开某个文件夹，并自动滚动到希望看到的文件选中它，那么这个命令非常有用：

```powershell
explorer /select,"D:\Services\blog.walterlv.com\Walterlv.Blog.Home.exe"
```

这可以在打开文件资源管理器的同时，选中 `Walterlv.Blog.Home.exe` 文件，并将它滚动到可视区域。

![使用文件资源管理器选中文件](/static/posts/2020-01-02-10-21-03.png)

## 其他命令行参数

在以上这些命令的基础上，可以添加一些可选参数用来控制如何执行这些命令。

- `/separate`
    - 让文件资源管理器在一个新的进程中打开

## 一些特殊文件夹的命令

打开当前工作路径的根目录：

```powershell
> explorer \
```

![打开根目录](/static/posts/2020-01-02-10-49-33.png)

打开“文档”文件夹：

```powershell
> explorer \\
# 或者
explorer /
```

打开“计算机”文件夹：

```powershell
# 注意，此命令在 CMD 中可以直接执行，在 PowerShell 中需要加上引号，即 ","
explorer ,
```

---

**参考资料**

- [How to run Windows Explorer as a different user (so I can do admin work) – Florin Lazar – Consistency Checkpoint](https://blogs.msdn.microsoft.com/florinlazar/2005/09/17/how-to-run-windows-explorer-as-a-different-user-so-i-can-do-admin-work/)
- [How to launch Windows Explorer with the privileges of a different domain user? - Super User](https://superuser.com/a/591082/940098)


