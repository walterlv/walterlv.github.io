---
title: "如何准备 Visual Studio 扩展/插件开发环境"
date: 2019-07-05 20:20:24 +0800
categories: visualstudio dotnet
position: starter
---

因为很多涉及到 Visual Studio 插件开发相关的文章/博客需要以安装 Visual Studio 插件开发环境为基础，所以本文介绍如何安装 Visual Studio 插件开发环境，以简化那些博客中的内容。

---

## 启动 Visual Studio 安装程序

请在开始菜单中找到或者搜索 Visual Studio Installer，然后启动它：

![找到并且启动 Visual Studio Installer](/static/posts/2019-07-05-20-10-40.png)

## 安装 Visual Studio 插件开发工作负载

在 Visual Studio 的安装界面中选择“修改”：

![修改](/static/posts/2019-07-05-20-12-15.png)

在工作负载中找到并勾选 Visual Studio 扩展开发（英文版是 Visual Studio extension development），然后按下右下角的“修改”： 

![勾选 Visual Studio 扩展开发负载](/static/posts/2019-07-05-20-17-03.png)

等待 Visual Studio 安装完 Visual Studio 扩展开发。如果提示重启计算机，那么就重启一下。

## 体验 Visual Studio 插件模板

如果你成功安装了 Visual Studio 扩展开发的工作负载，那么你在新建项目的时候就可以看到 Visual Studio 扩展开发相关的项目模板。

![Visual Studio 扩展开发相关模板](/static/posts/2019-07-05-20-20-14.png)
