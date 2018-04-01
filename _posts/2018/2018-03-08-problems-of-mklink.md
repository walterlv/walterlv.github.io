---
title: "解决 mklink 使用中的各种坑（硬链接，软链接/符号链接，目录链接）"
date: 2018-03-08 20:23:06 +0800
categories: windows
---

通过 mklink 命令可以创建文件或文件夹的链接，而这种链接跟快捷方式是不一样的。然而我们还可能会遇到其使用过程中的一些坑，本文将整理这些坑并提供解决方法。

---

<div id="toc"></div>

### 0x00 背景介绍：mklink

`mklink` 可以像创建快捷方式一样建立文件或文件夹的链接，但不同于快捷方式的是，`mklink` 创建的链接绝大多数程序都不会认为那是一个链接，而是一个实实在在的文件或文件夹。

例如，为 `D:\OneDrive\Foo` 文件夹创建链接到 `D:\Foo`，那么 `D:\OneDrive\Foo` 中有一个 `.git` 文件时，绝大多数程序都会以为 `D:\Foo` 中也存在 `.git` 文件，而且文件内容一模一样。

`mklink` 可以创建符号链接、硬链接和目录链接。在 `cmd` 中输入 `mklink` 即可看到以下这样的帮助信息。

```powershell
C:\Users\lvyi>mklink
创建符号链接。

MKLINK [[/D] | [/H] | [/J]] Link Target

        /D      创建目录符号链接。默认为文件
                符号链接。
        /H      创建硬链接而非符号链接。
        /J      创建目录联接。
        Link    指定新的符号链接名称。
        Target  指定新链接引用的路径
                (相对或绝对)。
```

具体的使用不是本文的重点，可以阅读本文末尾的参考资料了解，这里只给出他们之间的大体区别。

使用方式|适用于|快捷方式小箭头
-|-|-
不带参数|文件|有
/D|文件夹|有
/J|文件夹|有
/H|文件|无

上面的表格顺序，从上到下的行为从越来越像快捷方式到越来越像两个独立的文件夹。

### 0x01 坑：PowerShell 中没有 mklink 命令

是的，PowerShell 中就是中没有 mklink 命令。如果要在 powershell 中使用 mklink，那么得先敲 `cmd` 进入 `cmd` 之后再使用 `mklink` 命令。

如果你是一个重度强迫症患者，那么可以编写一个 powershell 的扩展函数来实现：[Creating a Symbolic Link using PowerShell - Learn Powershell - Achieve More](https://learn-powershell.net/2013/07/16/creating-a-symbolic-link-using-powershell/)。

### 0x02 坑：权限

默认我们的用户账户是 `Administrators` 组的，会继承它的权限设定。正常情况下，我们使用 `mklink` 是可以成功执行的。但如果文件系统的设置比较奇怪或者重装过系统，那么可能出现没有权限的错误。

```powershell
C:\Users\lvyi>mklink /D D:\Foo D:\OneDrive\Foo
你没有足够的权限执行此操作。
```

这时，使用管理员权限启动 `cmd` 是最简单的做法。不过也可以考虑在 `本地安全策略（secpol.msc）\本地策略\用户权利分配` 中添加当前用户。

---

#### 参考链接

- [活用 MKLINK 命令保护、节省你的硬盘 - SinoSky](https://www.sinosky.org/mklink-cmd-useful-tips.html)
- [关于mklink的/D /J 区别 - CSDN博客](http://blog.csdn.net/NotBack/article/details/73604292)
- [Creating a Symbolic Link using PowerShell - Learn Powershell - Achieve More](https://learn-powershell.net/2013/07/16/creating-a-symbolic-link-using-powershell/)
- [win10 无法运行mklink命令同步onedrive和电脑数据 - Microsoft Community](https://answers.microsoft.com/zh-hans/windows/forum/windows_10-files-winpc/win10/8df12869-96f4-4cd1-a914-355e908a6015)
- [Win10下执行mklink提示你没有足够权限执行此操作 - CSDN博客](http://blog.csdn.net/u011583025/article/details/52908508)
