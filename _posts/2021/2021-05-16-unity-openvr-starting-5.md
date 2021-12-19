---
title: "Unity OpenVR 虚拟现实入门五：通过传送控制玩家移动"
publishDate: 2021-05-16 09:59:33 +0800
date: 2021-05-16 17:47:41 +0800
tags: unity openvr
position: starter
coverImage: /static/posts/2021-05-16-10-22-58.png
permalink: /post/unity-openvr-starting-5.html
---

在 Unity 的帮助下，虚拟现实应用的开发非常容易。不过国内竟然还是没有什么教程，所以这里就来一点入门的，适合新手。

本文将基于第四篇的简单场景，通过传送的方式控制玩家移动。

---

系列博客：

- [Unity OpenVR 虚拟现实入门一：安装配置 Unity + OpenVR 环境](https://blog.walterlv.com/post/unity-openvr-starting-1.html)
- [Unity OpenVR 虚拟现实入门二：一个最简单的虚拟现实游戏/程序](https://blog.walterlv.com/post/unity-openvr-starting-2.html)
- [Unity OpenVR 虚拟现实入门三：最简单的五指交互](https://blog.walterlv.com/post/unity-openvr-starting-3.html)
- [Unity OpenVR 虚拟现实入门四：通过脚本控制手与控制器](https://blog.walterlv.com/post/unity-openvr-starting-4.html)
- [Unity OpenVR 虚拟现实入门五：通过传送控制玩家移动](https://blog.walterlv.com/post/unity-openvr-starting-5.html)
- [Unity OpenVR 虚拟现实入门六：通过摇杆控制玩家移动](https://blog.walterlv.com/post/unity-openvr-starting-6.html)

<div id="toc"></div>

## 搭建一个简单的场景

基于之前第四篇中我们添加的“Player”和控制器，我们这里简单打建一个场景。于是我们添加一个 3D 物体——“平面”——这足够简单。当然这不是必要的，只是会让我们后续的玩家移动看起来是踩在地面上，而不是悬在空中。

![创建平面](/static/posts/2021-05-16-10-22-58.png)  
▲ 创建平面

创建完记得在检查器里面将平面的位置设置到 (0,0,0)。

![设置平面的位置](/static/posts/2021-05-16-10-26-22.png)  
▲ 设置平面的位置

## 创建传送动作

在资源中定位到“SteamVR”->“InteractionSystem”->“Teleport”->“Prefabs”，找到“Teleporting”然后将它拖拽到场景中。

只需要运行场景，你就能发现在推动手柄摇杆时就能传送了：

![传送](/static/posts/2021-05-16-10-31-13.png)  
▲ 传送

不过，我们只能做出这个传送的动作，而不会真正地传送出去，因为我们还没有传送的“目的地”。

## 创建传送目的地

依然是在“SteamVR”->“InteractionSystem”->“Teleport”->“Prefabs”中。这次，我们拖拽“TeleportPoint”进入场景。

![拖拽 TeleportPoint 进入场景](/static/posts/2021-05-16-10-34-27.png)  
▲ 拖拽 TeleportPoint 进入场景

我们拖拽多个这样的传送目的地到场景中，运行看看效果。

![可传送到目的地](/static/posts/2021-05-16-10-39-59.png)  
可传送到目的地

在这张图片中，白色的地面让传送点很难看清，我们随便找一个非白色的材质拖拽到平面上。这里我直接使用“SteamVR”->“InteractionSystem”->“Teleport”->“Textures”里的“TeleportArea”材质（偷懒）。

![使用非白色的材质](/static/posts/2021-05-16-10-46-56.png)

## 创建传送目的区域

不过，只是传送到某个点的话，更像是看某场全景电影。要实现更加沉浸的体验，我们需要能让场景中的大多数地面都可被传送。

创建一个新的平面，同样将位置调整到 (0,0,0)，再调整大小，将其与之前的白色“地面”重叠在一起。不过这个新的平面，我们要添加一个“TeleportArea”的脚本。

![添加脚本 Teleport Area](/static/posts/2021-05-16-10-51-55.png)  
▲ 添加脚本 Teleport Area

运行看看，发现并不能传送（如下图）：

![无法传送](/static/posts/2021-05-16-10-54-43.png)  
无法传送

这是因为，我们创建的这两的平面完全重叠了。我们只需要将“TeleportArea”那个平面的 Y 坐标稍微向上移动一点点（例如 0.1 个单位）就可以了。

![Y 移动一点点](/static/posts/2021-05-16-10-57-17.png)  
▲ Y 移动一点点

![可以传送了](/static/posts/2021-05-16-10-56-42.png)  
▲ 可以传送了


