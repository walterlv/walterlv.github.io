---
title: "Unity3D 入门：如何为游戏添加 UI"
date: 2020-05-23 15:21:49 +0800
tags: unity csharp
position: starter
coverImage: /static/posts/2020-05-23-14-46-33.png
permalink: /posts/unity-starter-add-game-ui.html
---

早期的 Unity3D 做 UI 并不容易，以至于大家习惯于使用 NGUI 插件来开发。后来 NGUI 的开发者加入开发了 Unity UI，现在就有了一套更好用的 Unity UI 可用了。

本文简单介绍如何添加 UI 作为入门，不会深入介绍各种 UI 和细节。

---

<div id="toc"></div>

## 添加 Canvas

Unity UI 都需要放到 Canvas 上才能工作。你可以像如下图这样插入一个 Canvas。

![插入 Canvas](/static/posts/2020-05-23-14-46-33.png)

当然，你也可以插入其他的 UI 对象，不过最终 Unity 编辑器都会帮你插入一个 Canvas，然后把你插入的对象放到这个 Canvas 里面。

![插入的 Canvas](/static/posts/2020-05-23-14-50-18.png)

## EventSystem

当你开始向场景中插入 Unity 后，同时也会插入一个 EventSystem 游戏对象。EventSystem 的作用是接收系统中的输入事件，以便 UI 元素能够接受到这些事件处理用户的输入。

## Canvas 的属性

在 Inspector 窗口中，表示 Canvas 在场景中位置的对象是 RectTransform 对象了，不再是 Transform 对象。这是定位 UI 的坐标而设计的新的类型。

你无法修改 Canvas 的 RectTransform 对象的任何属性，这样 Unity 才可以让这个 Canvas 能根据分辨率自适应。

## 其他 UI

关于 Unity UI 的其他细节，我将在单独的博客中说明。

- [如何在 Unity3D 场景中显示帧率（FPS） - walterlv](/post/unity-show-fps)

## 切换成 2D 视图

在开发（2D）UI 的时候，建议将场景视图切换成 2D，这样比较容易做布局。

![切换成 2D](/static/posts/2020-05-23-15-19-37.png)

当然，如果你不像我这样能看得到整个 Canvas 的话，可以考虑调整下视角或者直接双击 `F`。

关于操作视角和快捷键，可以参考我的其他博客：

- [Unity3D 入门：Unity Editor 编辑器常用快捷键 - walterlv](/post/unity-starter-unity-editor-shortcut-keys.html)


