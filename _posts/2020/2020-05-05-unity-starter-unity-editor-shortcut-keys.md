---
title: "Unity3D 入门：Unity Editor 编辑器常用快捷键"
publishDate: 2020-05-05 18:23:20 +0800
date: 2020-05-05 19:35:25 +0800
categories: unity
position: starter
---

本文为 Unity3D 入门小伙伴整理 Unity 编辑器中的常用快捷键。

---

<div id="toc"></div>

## 调节工具

Unity 编辑器左上角的一组按钮，正好也对应着键盘左上角的字母：

| 图标   | ![Q](/static/posts/2020-05-05-17-29-17.png) | ![W](/static/posts/2020-05-05-17-29-44.png) | ![E](/static/posts/2020-05-05-17-30-06.png) | ![R](/static/posts/2020-05-05-17-30-27.png) | ![T](/static/posts/2020-05-05-17-30-46.png) | ![Y](/static/posts/2020-05-05-17-31-06.png) |
| ------ | :-----------------------------------------: | :-----------------------------------------: | :-----------------------------------------: | :-----------------------------------------: | :-----------------------------------------: | :-----------------------------------------: |
| 快捷键 |                      Q                      |                      W                      |                      E                      |                      R                      |                      T                      |                      Y                      |
| 英文   |                  Hand Tool                  |                  Move Tool                  |                 Rotate Tool                 |                 Scale Tool                  |                  Rect Tool                  |   Move, Rotate or Scale selected objects    |
| 中文   |                  手形工具                   |                  移动工具                   |                  旋转工具                   |                  缩放工具                   |                  矩形工具                   |          移动、旋转或缩放选定对象           |
| 功能   |            在整个场景中移动漫游             |            按坐标轴移动选定对象             |             按三个维度旋转对象              |            在三个维度上缩放对象             |         以矩形的方式调节对象的尺寸          |      综合前面所有对选定对象的调节工具       |

除了使用 `Q` 打开手形工具随后用鼠标左键漫游场景外，使用鼠标中键也可以在任意工具下漫游场景（按住鼠标中键然后移动鼠标）。

按住鼠标右键移动可以以当前镜头处为轴心旋转视角，按住鼠标右键的同时按下 `W` `A` `S` `D` `Q` `E` 也可以前后左右下上移动镜头。

按住 `Alt` 键的同时，也可以在任意工具下使用鼠标左键移动镜头，不过与前面不同的是，这是以目标物体为轴心来移动和旋转的。

按住 `Alt` 键的同时，按住鼠标右键上下左右移动也可以移远和移近物体。

按住 `Ctrl` 键的同时，使用以上所有工具移动、旋转或缩放对象的话，可以对齐网格。（`Edit->Grid and Snap Settings...` 可以打开网格设置。）

![网格设置](/static/posts/2020-05-05-18-13-57.png)

按住 `V` 键的同时，鼠标放到对象中心的移动格子上移动对象，可以让此对象对齐场景中的其他对象。（下图指示了鼠标拖哪里。）

![对齐其他对象](/static/posts/2020-05-05-18-15-59.png)

## 视图调节

**F**（置于中心）：当在层级（Hierarchy）窗口或场景（Scene）窗口选中某个对象后，可按 `F` 将对象置于场景中心，并放大/缩小到合适的尺寸。

## 窗口调整

**Shift + 空格**（最大化/还原）：当你的焦点在 Unity 编辑器的任何子窗口中的时候，按下 `Shift + Space` 可以将此子窗口最大化或者还原。

如下图是最大化后的场景窗口：

![最大化场景窗口](/static/posts/2020-05-05-17-43-49.png)

## 进入退出播放模式

**Ctrl + P**（进入退出播放模式）：相当于按下界面中的“播放”按钮。

## 所有快捷键

在 `Edit->Shortcuts...` 中可以找到并编辑所有的快捷键。

![所有快捷键](/static/posts/2020-05-05-18-20-42.png)

---

**参考资料**

- [Unity - Manual: Unity shortcuts](https://docs.unity3d.com/Manual/UnityHotkeys.html)