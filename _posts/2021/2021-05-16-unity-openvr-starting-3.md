---
title: "Unity OpenVR 虚拟现实入门三：最简单的五指交互"
date: 2021-05-16 09:24:20 +0800
categories: unity openvr
position: starter
---

在 Unity 的帮助下，虚拟现实应用的开发非常容易。不过国内竟然还是没有什么教程，所以这里就来一点入门的，适合新手。

本文将基于前两篇搭建的环境，做一个简单的五指交互。

---

系列博客：

- [Unity OpenVR 虚拟现实入门一：安装配置 Unity + OpenVR 环境](https://blog.walterlv.com/post/unity-openvr-starting-1.html)
- [Unity OpenVR 虚拟现实入门二：一个最简单的虚拟现实游戏/程序](https://blog.walterlv.com/post/unity-openvr-starting-2.html)
- [Unity OpenVR 虚拟现实入门三：最简单的五指交互](https://blog.walterlv.com/post/unity-openvr-starting-3.html)
- [Unity OpenVR 虚拟现实入门四：通过脚本控制手与控制器](https://blog.walterlv.com/post/unity-openvr-starting-4.html)
- [Unity OpenVR 虚拟现实入门五：通过传送控制角色移动](https://blog.walterlv.com/post/unity-openvr-starting-5.html)

<div id="toc"></div>

## 前提

你需要有一个在第二篇中做出的“Player”。

![Unity 编辑器中的 Player](/static/posts/2021-05-16-09-06-08.png)  
▲ Unity 编辑器中的 Player

## 将控制器换成手

找到场景中的“Player”->“SteamVRObjects”，选择“LeftHand”，在“检查器”中找到“Render Model Prefab”。

![Render Model Prefab](/static/posts/2021-05-16-09-07-49.png)  
▲ Render Model Prefab

将前面在“SteamVR”->“InteractionSystem”->“Core”->“Prefabs”中的其他种类的左手拖拽到检查器的“Render Model Prefab”中。例如，我们拖入了“LeftRenderModel”。

![拖入 LeftRenderModel](/static/posts/2021-05-16-09-09-25.png)  
▲ 拖入 LeftRenderModel

SteamVR 中自带的其他几种控制器模型有：

![SteamVR 自带的手模型](/static/posts/2021-05-16-09-16-28.png)  
▲ SteamVR 自带的手模型

同样，我们将右手也替换一个模型。

## 运行

运行我们刚刚替换过手模型的场景，看看效果：

[![RenderModel](/static/posts/2021-05-16-09-21-24.png)](https://r302.cc/ngGjpBG?platform=enpc&channel=copylink)  
▲ RenderModel

[![RenderModel Floppy](/static/posts/2021-05-16-09-21-10.png)](https://r302.cc/erJGmvD?platform=enpc&channel=copylink)  
▲ RenderModel Floppy
