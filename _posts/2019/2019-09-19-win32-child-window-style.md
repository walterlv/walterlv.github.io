---
title: "使用 SetParent 制作父子窗口的时候，如何设置子窗口的窗口样式以避免抢走父窗口的焦点"
date: 2019-09-19 10:24:12 +0800
tags: windows wpf dotnet csharp
position: starter
coverImage: /static/posts/2019-09-19-10-21-31.png
permalink: /post/win32-child-window-style.html
---

制作传统 Win32 程序以及 Windows Forms 程序的时候，一个用户看起来独立的窗口本就是通过各种父子窗口嵌套完成的，有大量窗口句柄，窗口之间形成父子关系。不过，对于 WPF 程序来说，一个独立的窗口实际上只有一个窗口句柄，窗口内的所有内容都是 WPF 绘制的。

如果你不熟悉 Win32 窗口中的父子窗口关系和窗口样式，那么很有可能遇到父子窗口之间“抢夺焦点”的问题，本文介绍如何解决这样的问题。

---

<div id="toc"></div>

## “抢夺焦点”

下图中的上下两个部分是两个不同的窗口，他们之间通过 `SetParent` 建立了父子关系。

注意看下面的窗口标题栏，当我在这些不同区域间点击的时候，窗口标题栏在黑色和灰色之间切换：

![抢夺焦点](/static/posts/2019-09-19-activation-between-parent-child-windows.gif)

这说明当子窗口获得焦点的时候，父窗口会失去焦点并显示失去焦点的样式。

你可以在[这篇博客](/post/hosted-hwnd-must-be-a-child-window)中找到一个简单的例子：

## 解决办法

而原因和解决方法仅有一个，就是子窗口需要有一个子窗口的样式。

具体来说，子窗口必须要有 `WS_CHILD` 样式。

你可以看看 Spyxx.exe 抓出来的默认普通窗口和子窗口的样式差别：

![默认普通窗口]](/static/posts/2019-09-19-10-21-31.png)

▲ 默认普通窗口

![子窗口](/static/posts/2019-09-19-10-21-47.png)

▲ 子窗口

---

**参考资料**

- [关于WS_CLIPCHILDREN和WS_CLIPSIBLINGS的理解（个人认为还是相当全面的） - helloj2ee - 博客园](https://www.cnblogs.com/helloj2ee/archive/2009/05/29/1491822.html)


