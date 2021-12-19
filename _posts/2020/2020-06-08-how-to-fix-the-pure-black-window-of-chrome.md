---
title: "Chrome 窗口全黑了，不怕，有招"
date: 2020-06-08 08:22:55 +0800
tags: windows web
position: problem
---

Chrome 的窗口偶尔会出现全黑掉的情况。从轻微的到严重的，本文都有解决方案。

---

<div id="toc"></div>

## 偶然全黑

Chrome 全黑的状态看起来像下图这样：

![Chrome 全黑](/static/posts/2020-06-08-08-08-05.png)

通常发生在这些时间点后：

- 锁屏解锁后
- 突然间显卡驱动崩溃了一下
- 显卡驱动刚刚升完级
- 远程桌面连接后

这时，通常还伴随着基于 Chromium 内核的应用全部黑屏，比如：

- Visual Studio Code (VSCode)
- Microsoft Edge

解决方法是：

- **开一个新窗口**

开的方法有（任选其一，适用与所有 Chromium 内核应用）：

- 在任务栏上右键，重新点开程序（看下图）
- 直接鼠标中键点击任务栏上的图标
- 去开始菜单或者其他入口处点开程序

![新开一个窗口](/static/posts/2020-06-08-08-14-50.png)

## 一直黑

有时，前面的方法并不能帮你解决问题——新开程序也依然是黑屏的。

通常发生在这些时间点后：

- Windows 10 系统更新完后

这时，你可能发现其他基于 Chromium 内核的应用是正常的。也就说明此时的问题仅仅是 Chrome 浏览器的问题。

解决方法是：

1. 删除 `%LOCALAPPDATA%\Google\Chrome\User Data\ShaderCache\GPUCache` 下的全部文件
2. 重新启动 Chrome 浏览器

例如，我的文件夹是 `C:\Users\lvyi\AppData\Local\Google\Chrome\User Data\ShaderCache\GPUCache`，全部删除后重新启动即恢复。
