---
title: "使用 DISM 工具检查并修复 Windows 系统文件"
date: 2019-05-10 09:02:34 +0800
tags: windows
position: knowledge
coverImage: /static/posts/2019-05-09-21-06-09.png
permalink: /post/dism-restore-health.html
---

DISM，Deployment Image Servicing and Management，部署映像服务和管理。本文介绍使用此工具检查并修复 Windows 的系统文件。

---

<div id="toc"></div>

## 系统要求

Windows 8/8.1 和 Windows 10 开始提供 DISM 工具。

相比于我在另一篇博客中提及的 sfc，DISM 利用 Windows 系统镜像来完成修复，所以更容易修复成功。关于 sfc（System File Check）可以参见：

- [使用 System File Check (SFC) 工具检查并修复 Windows 系统文件](/post/system-file-check-scan-and-repair-system-files)

## 使用方法

使用管理员权限启动 CMD，然后输入命令：

```cmd
DISM.exe /Online /Cleanup-image /Restorehealth
```

运行后等待其运行完成。

![DISM 修复系统的命令](/static/posts/2019-05-09-21-06-09.png)

## 使用本地镜像

上面的命令依赖于 Windows Update 服务来获取在线的镜像进行恢复。如果 Windows Update 服务已经挂了，那么这个命令是无法正常完成的。

这时需要额外添加 `/Source:` 来指定修复所使用的本地文件：

```cmd
DISM.exe /Online /Cleanup-Image /RestoreHealth /Source:C:\RepairSource\Windows /LimitAccess
```

`C:\RepairSource\Windows` 需要换成自己的本地镜像路径。

---

**参考资料**

- [Fix corrupted Windows Update system files using DISM Tool](https://www.thewindowsclub.com/fix-windows-update-using-dism)
- [How to use DISM command-line utility to repair a Windows 10 image - Windows Central](https://www.windowscentral.com/how-use-dism-command-line-utility-repair-windows-10-image)
- [Fix Windows Update errors by using the DISM or System Update Readiness tool](https://support.microsoft.com/en-us/help/947821/fix-windows-update-errors-by-using-the-dism-or-system-update-readiness)


