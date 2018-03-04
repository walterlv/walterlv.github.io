---
title: "在 Windows 安装期间将 MBR 磁盘转换为 GPT 磁盘"
date: 2018-02-22 22:13:16 +0800
categories: windows sysprep
tags: MBR GPT
---

以 UEFI 启动的 Windows 磁盘必须是 GPT 格式。本文将介绍如何在安装 Windows 期间将磁盘从 MBR 转换成 GPT。

---

**特别注意**：操作不慎可能丢失所有数据，如果你懂得安装系统的一些基本概念，那么可以继续阅读并尝试实操；否则请交给专业人士操作。**切记，切记，切记！！！**

<div id="toc"></div>

### 第一步：按下 Shift + F10 启动命令提示符

在 Windows 的安装界面其实是可以启动命令提示符的，只需按下 Shift + F10 即可。

### 第二步：敲命令

启动 Diskpart：

```powershell
> diskpart
```

启动后提示符的前面会出现“DISKPART”前缀：

```powershell
DISKPART> list disk
```

这时命令提示符中会列出此计算机上所有的磁盘和其格式：

```powershell
  磁盘 ###  状态           大小     可用     Dyn  Gpt
  --------  -------------  -------  -------  ---  ---
  磁盘 0    联机              119 GB   118 GB        *
  磁盘 1    联机              465 GB  1024 KB
  磁盘 2    联机               28 GB      0 B        *
```

磁盘 0 是我准备装系统的系统盘。

================ ！！！**特别注意**！！！ ================

1. 注意这里选择的是磁盘，而**不是分区**！**不是**通常所说的 C 盘/D 盘，而是一块 SSD，或一块机械硬盘。
1. 后续操作会**清除选中磁盘中的所有数据**，是所有数据，毫无保留！

================ ！！！**特别注意**！！！ ================

现在，我们选中“磁盘 0”：

```powershell
DISKPART> select disk 0
```

这里的序号取决于安装 SSD 或机械硬盘的的连接线序号，所以一定要仔细查清楚，不要选错了。

接着，敲入 `clean` 命令清除此磁盘上的所有内容，**注意，这包括了所有的分区**：

```powershell
DISKPART> clean
```

等待清除结束，然后敲入 `convert gpt` 命令完成转换。

```powershell
DISKPART> convert gpt
```

### 第三步：平复激动的心情

操作结束之后直接按下 Alt + F4 切换到 Windows 安装程序继续安装即可。如果你是强迫症重度患者，敲一个 `exit` 命令结束“Diskpart”程序也未尝不可。

```powershell
DISKPART> exit
```
