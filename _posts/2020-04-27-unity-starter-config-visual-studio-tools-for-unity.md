---
title: "Unity3D 入门：在 Visual Studio 里使用 Visual Studio Tools for Unity 全套工具"
date: 2020-04-27 19:35:40 +0800
categories: unity csharp
position: starter
---

Visual Studio 安装过程中一起勾选的 Visual Studio Tools for Unity 提供了与 Unity 编辑器方便的交互功能，充分使用 Visual Studio Tools for Unity 可以提升一部分开发效率减少一点点坑。

---

<div id="toc"></div>

## Visual Studio Tools for Unity

我在 [Unity3D 入门：安装 Unity3D 并配置与 Visual Studio 的协作开发环境 - walterlv](https://blog.walterlv.com/post/unity-starter-install-and-integrated-with-visual-studio.html) 一文中提及了在安装 Unity 的开发环境时建议勾选了 Visual Studio Tools for Unity。

如果你还没安装，可以阅读此博客安装。如果安装后没有设置 Unity 编辑器的关联，也可以阅读这篇博客了解如何设置关联。

## 快速实现 Unity 消息

在 `MonoBehaviour` 的类中输入 `onXXX` 可以在智能感知列表中看到 Unity 在游戏运行时给每个游戏对象广播的消息，直接回车输入可以插入这个方法。于是，你可以无需记忆所有的这些消息就可以在不同的消息中添加处理函数。

![onXXX](/static/posts/2020-04-27-19-12-32.png)

![插入的处理函数](/static/posts/2020-04-27-19-16-18.png)

或者，你也可以在类中按下 `Ctrl`+`Shift`+`M` 打开“实现 Unity 消息”对话框，通过勾选插入一堆处理函数。

![实现 Unity 消息](/static/posts/2020-04-27-19-19-06.png)

## Unity 项目资源管理器

我们在 Unity 编辑器中查看 Unity 项目的文件结构与 Visual Studio 解决方案资源管理器中看到的是完全不同的。实际上，Visual Studio 中的项目和解决方案对 Unity 资产来说是没有意义的，有用的其实是里面的 C# 脚本。

于是就有了“Unity 项目资源管理器”的需要，它可以以跟 Unity 编辑器相同的视角看 Unity 项目中的资产。

![打开 Unity 项目资源管理器](/static/posts/2020-04-27-19-24-55.png)

![在 Unity 项目资源管理器中查看](/static/posts/2020-04-27-19-29-05.png)

![在 Unity 编辑器中查看](/static/posts/2020-04-27-19-28-25.png)

## 附加到 Unity 调试

在安装了 Visual Studio Tools for Unity 后，打开 Unity 的项目你将看到平常的“调试”按钮变成了“附加到 Unity”按钮。

![附加到 Unity](/static/posts/2020-04-26-11-35-57.png)

在 Unity 编辑器也运行起来的情况下，可以在 Visual Studio 里面进入断点调试。

![需要运行 Unity](/static/posts/2020-04-26-11-40-20.png)

当然，如果觉得每次都要单独去点“Play”比较麻烦的话，可以在调试按钮上下拉选择“附加到 Unity 并播放”。这样每次点击按钮的时候就直接会开始运行游戏了。

![附加到 Unity 并播放](/static/posts/2020-04-27-19-32-28.png)

如果你没有找到“附加到 Unity”按钮，那么可以在 Visual Studio 的“调试”菜单中找到“附加 Unity 调试程序”。点击后可以自动查找当前正在运行的 Unity 编辑器，选择你希望调试的那一个即可开始调试。

![附加 Unity 调试程序](/static/posts/2020-04-26-11-42-15.png)

![选择 Unity 实例](/static/posts/2020-04-27-19-33-54.png)

---

**参考资料**

- [Getting Started with Visual Studio Tools for Unity - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/cross-platform/getting-started-with-visual-studio-tools-for-unity?view=vs-2019)
