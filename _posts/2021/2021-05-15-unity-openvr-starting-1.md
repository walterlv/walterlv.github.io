---
title: "Unity OpenVR 虚拟现实入门一：安装配置 Unity + OpenVR 环境"
publishDate: 2021-05-15 20:08:44 +0800
date: 2021-05-16 07:57:01 +0800
categories: unity openvr
position: starter
---

在 Unity 的帮助下，虚拟现实应用的开发非常容易。不过国内竟然还是没有什么教程，所以这里就来一点入门的，适合新手。

本文将搭建好虚拟现实的开发环境。

---

<div id="toc"></div>

## 第一步：安装 Unity Hub

去官网 <https://unity.cn/releases> 下载 Unity Hub。这是必要的，因为 Unity 编辑器的运行一定要先安装有 Unity Hub，且必须始终保持最新版，否则可能还会导致无法连接。

下载完成后安装即可。

![Unity Hub 界面](/static/posts/2021-05-15-20-21-39.png)  
▲ Unity Hub 界面

## 第二步：安装最新版本的 Unity 编辑器

启动 Unity Hub，然后选择左侧的“安装”，再选择右上角的“安装”选择你当前最新版本的 Unity，点“下一步”，选“安装”。然后等就好了。

![安装最新版本 Unity 编辑器 1/2](/static/posts/2021-05-15-20-31-36.png)  
▲ 安装最新版本 Unity 编辑器 1/2

![安装最新版本 Unity 编辑器 2/2](/static/posts/2021-05-15-20-33-02.png)  
▲ 安装最新版本 Unity 编辑器 2/2

## 第三步：安装 XR 插件管理器

在 Unity Hub 中，新建一个项目，然后等这个项目被 Unity 编辑器打开。首次创建项目或第一次打开某个项目会等很久，在恢复项目中所需的包。耐心等待吧。

![等待创建项目](/static/posts/2021-05-16-07-51-32.png)  
▲ 等待创建项目

![XR 插件管理](/static/posts/2021-05-16-07-55-15.png)  
▲ XR 插件管理

等你看到 Unity 编辑器的界面后，选择“编辑”->“项目设置”，在打开的项目设置窗格中，拉到最下面的“XR 插件管理”然后选择它。在里面，你可以看到“安装 XR 插件管理”的按钮，点击它，然后等上几分钟到数小时，直到安装完成。安装完成后，需要重启 Unity 编辑器。

![Unity 编辑器界面](/static/posts/2021-05-15-20-37-12.png)  
▲ Unity 编辑器界面

重启完编辑器后，再进入到最底部的“XR Plug-in Management”则可以看到已经加载完成的“XR Plug-in Management”插件。勾选你打算适配的虚拟现实设备。

![XR Plug-in Management](/static/posts/2021-05-15-20-40-09.png)  
▲ XR Plug-in Management
