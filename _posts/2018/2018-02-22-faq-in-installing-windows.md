---
title: "安装 Windows 需要知道的 256 个问题"
date: 2018-02-22 20:57:12 +0800
categories: windows sysprep
tags: Windows10 Win10 FAT32 NTFS GPT UEFI
---

如果你希望更刺激地安装 Windows，那么你需要了解很多 Windows 系统相关的问题。

---

### 为什么 UEFI 方式启动的 U 盘必须使用 FAT32 文件系统？

因为 NTFS 是 Windows 系统专属的文件系统，而 UEFI 目前并不支持 NTFS。

于是，如果在主板设置中选择“仅 UEFI 启动”，那么 NTFS 格式的启动 U 盘在 F12 启动选项中将不可见；而如果设置为“UEFI 启动并兼容旧模式”，那么虽可以在 F12 启动选项中看得见启动 U 盘，但选择启动后是普通的 BIOS 启动。

**注意**：在 F12 的启动选项中，UEFI 启动的选项会有一个前缀“UEFI: ”。
