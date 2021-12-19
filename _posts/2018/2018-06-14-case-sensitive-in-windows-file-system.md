---
title: "Windows 10 四月更新，文件夹名称也能区分大小写了"
publishDate: 2018-06-14 08:02:24 +0800
date: 2018-12-14 09:54:00 +0800
tags: windows
coverImage: /static/posts/2018-06-20-10-43-02.png
permalink: /post/case-sensitive-in-windows-file-system.html
---

Linux 一向都是区分文件和文件夹大小写的。Mac OS 默认不区分文件和文件夹大小写，不过可以配置成支持。而 Windows 向来是不区分文件和文件夹大小写的，但是从 NTFS 开始却又支持区分文件夹大小写。

本文将介绍 Windows 10 四月更新带来的新特性 —— 让文件夹名称也能区分大小写。

---

<div id="toc"></div>

## 问题

本来文件系统是否区分大小写只是单纯风格上的差异，并没有孰优孰劣，但这可让那些跨平台的文件系统难以抉择了。典型的例子就是 Git。

我曾经就遭遇过 Git 操作上的大小写敏感性问题，写了一篇博客：[解决 Git 重命名时遇到的大小写不敏感的问题](/post/case-insensitive-in-git-rename)。

由于 Windows 文件系统对大小写不敏感，所以上面的问题才变得尤其难办，竟然需要通过至少两次提交，并且丢掉单线的 Git 历史记录的方式才能真正完成任务。而单纯让 Git 在仓库中区分大小写竟然会产生两份文件（却无法在 Windows 系统中观察到）。

## 开启方法

Windows 10 四月更新终于带来了文件夹区分大小写的支持！

使用管理员权限在当前文件夹启动 PowerShell：

![管理员权限启动 PowerShell](/static/posts/2018-06-20-10-43-02.png)

```powershell
fsutil.exe file SetCaseSensitiveInfo C:\Users\walterlv\GitDemo enable
```

是的，就是上面这一段非常简单而容易理解的命令即可开启**单个文件夹**的名称区分大小写功能。只是单个文件夹！如果需要开启其他文件夹，需要多次执行这样的命令。

而如果需要关闭对此文件夹的大小写支持，只需要将 `enable` 改为 `disable`。

```powershell
fsutil.exe file SetCaseSensitiveInfo C:\Users\walterlv\GitDemo disable
```

![区分大小写的效果](/static/posts/2018-06-14-09-07-45.png)

看！以上就是在 Windows 10 系统级开启了大小写敏感的我的一个 Git 仓库，这下可以让跨平台的 Git 工作起来在各个系统都一样了。

## 注意事项

以上命令的正确运行需要以下条件，缺一不可：

1. Windows 10 四月更新（1803）
1. 安装有 Linux 子系统，即 Windows Subsystem for Linux
1. 所在分区为 NTFS 格式
1. 以管理员权限运行 PowerShell

如果没有安装 Linux 子系统，那么运行时会出现以下错误：

```powershell
错误：不支持该请求。
```

▲ 中文版 PowerShell

```powershell
The request is not supported.
```

▲ 英文版 PowerShell

这个问题在 MicrosoftDocs 的 GitHub 仓库中被提到了：[fsutil setCaseSensitiveInfo · Issue #977 · MicrosoftDocs/windowsserverdocs](https://github.com/MicrosoftDocs/windowsserverdocs/issues/977)。

安装 Linux 子系统的方法可以参考微软官方文档：[Install Windows Subystem for Linux (WSL) on on Windows 10](https://docs.microsoft.com/zh-cn/windows/wsl/install-win10)。如果英文阅读有压力，可以参考毒逆天的博客：[Win10 安装 Linux子系统 Ubuntu18.04 / Kali Linux 的体验](https://www.cnblogs.com/dunitian/p/9159897.html?wt.mc_id=MVP)。

简单点，就是管理员权限 PowerShell 敲个命令：

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
```

或者命令都懒得敲，就是去商店下载（在商店搜索 Linux）：

![应用商店下载安装 Linux](/static/posts/2018-07-30-20-31-54.png)

---

## 附

`fsutil file` 支持的命令：

```powershell
 ⚡ lvyi@walterlv.github.io> fsutil.exe file
---- FILE Commands Supported ----

createNew                Creates a new file of a specified size
findBySID                Find a file by security identifier
layout                   Query all the information available about the file
optimizeMetadata         Optimize metadata for a file
queryAllocRanges         Query the allocated ranges for a file
queryCaseSensitiveInfo   Query the case sensitive information for a directory
queryExtents             Query the extents for a file
queryExtentsAndRefCounts Query the extents and their corresponding refcounts for a file
queryFileID              Queries the file ID of the specified file
queryFileNameById        Displays a random link name for the file ID
queryOptimizeMetadata    Query the optimize metadata state for a file
queryValidData           Queries the valid data length for a file
setCaseSensitiveInfo     Set the case sensitive information for a directory
setShortName             Set the short name for a file
setValidData             Set the valid data length for a file
setZeroData              Set the zero data for a file
setEOF                   Sets the end of file for an existing file
setStrictlySequential    Sets ReFS SMR file as strictly sequential
```

fsutil 支持的命令：

```powershell
 ⚡ lvyi@walterlv.github.io> fsutil.exe
---- Commands Supported ----

8dot3name       8dot3name management
behavior        Control file system behavior
dax             Dax volume management
dirty           Manage volume dirty bit
file            File specific commands
fsInfo          File system information
hardlink        Hardlink management
objectID        Object ID management
quota           Quota management
repair          Self healing management
reparsePoint    Reparse point management
resource        Transactional Resource Manager management
sparse          Sparse file control
tiering         Storage tiering property management
transaction     Transaction management
usn             USN management
volume          Volume management
wim             Transparent wim hosting management
```

---

**参考资料**

- [fsutil setCaseSensitiveInfo · Issue #977 · MicrosoftDocs/windowsserverdocs](https://github.com/MicrosoftDocs/windowsserverdocs/issues/977)
- [windows - fsutil - The request is not supported after setCaseSensitiveInfo - Stack Overflow](https://stackoverflow.com/q/50839623/6233938)


