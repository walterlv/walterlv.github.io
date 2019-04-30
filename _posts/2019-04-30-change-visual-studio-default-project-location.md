---
title: "如何修改 Visual Studio 新建项目时的默认路径"
date: 2019-04-30 10:29:19 +0800
categories: visualstudio
position: starter
---

Visual Studio 创建新项目的时候，默认位置在 `C:\Users\lvyi\source\repos\` 下。多数时候，我们都希望将其改为一个更适合自己开发习惯的路径。实际上修改默认路径并不是一个麻烦的事情，但是当紧急需要修改的时候，你可能找不到设置项在哪里。

本文介绍如何修改这个默认路径。

---

## 默认位置

默认位置在 `C:\Users\lvyi\source\repos\` 下。

![默认位置](/static/posts/2019-04-30-10-17-14.png)

## Visual Studio 的设置项

在 Visual Studio 中打开菜单 “工具” -> “选项”；然后找到 “项目和解决方案” -> “位置” 标签。“项目位置” 一栏就是设置新建项目默认路径的地方。

![中文版的设置界面](/static/posts/2019-04-30-10-24-22.png)

如果是英文本，则打开菜单 “Tools” -> “Options”；然后找到 “Projects and Solutions” -> “Locations” 标签。“Projects location” 一栏就是设置新建项目默认路径的地方。

![英文版的设置界面](/static/posts/2019-04-30-10-27-35.png)

## 修改后的默认位置

修改完后，再次新建项目，就可以看到修改后的默认路径了。

![修改后的默认位置](/static/posts/2019-04-30-10-28-56.png)
