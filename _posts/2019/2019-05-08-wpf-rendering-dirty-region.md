---
title: "通过分析 WPF 的渲染脏区优化渲染性能"
publishDate: 2019-05-08 09:36:29 +0800
date: 2019-05-13 09:50:23 +0800
tags: wpf dotnet csharp
position: problem
coverImage: /static/posts/2019-05-08-09-00-36.png
permalink: /posts/wpf-rendering-dirty-region.html
---

本文介绍通过发现渲染脏区来提高渲染性能。

---

<div id="toc"></div>

## 脏区 Dirty Region

在计算机图形渲染中，可以每一帧绘制全部的画面，但这样对计算机的性能要求非常高。

脏区（Dirty Region）的引入便是为了降低渲染对计算机性能的要求。每一帧绘制的时候，仅仅绘制改变的部分，在软件中可以节省大量的渲染资源。而每一帧渲染时，改变了需要重绘的部分就是脏区。

以下是我的一款 WPF 程序 [Walterlv.CloudKeyboard](https://github.com/walterlv/Walterlv.CloudKeyboard) 随着交互的进行不断需要重绘的脏区。

![较多的脏区](/static/posts/2019-05-07-uncontrollable-dirty-region.gif)

可以看到，脏区几乎涉及到整个界面，而且刷新非常频繁。这显然对渲染性能而言是不利的。

*当然这个程序很小，就算一直全部重新渲染性能也是可以接受的。*不过当程序中存在比较复杂的部分，如大量的 `Geometry` 以及 3D 图形的时候，重新渲染这一部分将带来严重的性能问题。

## WPF 性能套件

先下载 WPF 性能套件：

- [下载 Performance Profiling Tools for Windows Presentation Foundation](https://download.microsoft.com/download/A/6/A/A6AC035D-DA3F-4F0C-ADA4-37C8E5D34E3D/setup/WinSDKPerformanceToolKit_amd64/wpt_x64.msi)
- [下载 补丁](https://download.microsoft.com/download/1/8/9/189A7832-49D8-4978-85E8-3DFFF44E6C04/WpfPerf_timezone_patch.msp)

## 脏区监视

启动 WPF Performance Suite，选择工具 Perforator，然后在 Action 菜单中启动一个待分析的 WPF 进程。虽然工具很久没有更新，但依然可以支持基于 .NET Core 3 版本的 WPF 程序。

![启动一个进程](/static/posts/2019-05-08-09-00-36.png)

当程序运行起来后，可以看到 WPF 程序的各种性能数据图表。

![WPF 性能收集工具](/static/posts/2019-05-08-08-59-08.png)

现在将 `Show dirty-region update overlay` 选项打勾即可看到本文一开始的脏区叠加层的显示。

与脏区有关的选项有三个：

- Show dirty-region update overlay
    - 显示脏区叠加层，每一次脏区出现需要重新渲染时会叠加一层新的半透明颜色。
- Disable dirty region support
    - 禁用脏区支持。这时，每次渲染都将重绘整个窗口。
- Clear back-buffer before rendering
    - 每次重绘之前都将清除之前所有的绘制，使用此选项，你可以迅速找到界面中频繁刷新的部分，而重绘频率不高的部分多数时候都是纯黑。

## 优化脏区重绘

一开始的程序中，因为我使用了模拟 UWP 的高光效果，导致大量的控件在重绘高光部分，这是导致每一帧都在重新渲染的罪魁祸首。

于是我将高光渲染关闭，脏区的重新渲染将仅仅几种在控件样式改变的时候（例如焦点改变）：

![稍微正常一点的脏区](/static/posts/2019-05-08-controllable-dirty-region.gif)

光照效果可以参见我的另一篇博客：

- [流畅设计 Fluent Design System 中的光照效果 RevealBrush，WPF 也能模拟实现啦！](/post/fluent-design-reveal-brush-in-wpf)

<!-- ## 性能优化建议

如果你希望重绘的脏区面积更少，那么建议：

1. 不要频繁修改面积太大的元素（例如像我这样调整一个大面积元素的边框颜色，这样整个大面积元素都会成为脏区）
1. 尽量将频繁修改的大面积元素拆分成多个小面积 Visual -->

---

**参考资料**

- [WPF Performance Suite - Microsoft Docs](https://docs.microsoft.com/en-us/previous-versions/aa969767(v=vs.110))


