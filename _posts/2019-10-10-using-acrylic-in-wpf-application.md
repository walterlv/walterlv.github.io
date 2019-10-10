---
title: "在 WPF 程序中应用 Windows 10 真•亚克力效果"
date: 2019-10-10 10:23:47 +0800
categories: dotnet
position: starter
---

从 Windows 10 (1803) 开始，Win32 应用也可以有 API 来实现原生的亚克力效果了。不过相比于 UWP 来说，可定制性会差很多。

本文介绍如何在 WPF 程序中应用 Windows 10 真•亚克力效果。（而不是一些流行的项目里面自己绘制的亚克力效果。）

---

<div id="toc"></div>

## API

需要使用的 API 是微软的文档中并未公开的 `SetWindowCompositionAttribute`。

我在另一篇博客中有介绍此 API 各种用法的效果，详见：

- [使用 SetWindowCompositionAttribute 来控制程序的窗口边框和背景（可以做 Acrylic 亚克力效果、模糊效果、主题色效果等） - walterlv](/post/set-window-composition-attribute.html)

当然，使用此 API 也可以做 Windows 10 早期的模糊效果，比如：

- [在 Windows 10 上为 WPF 窗口添加模糊特效（就像开始菜单和操作中心那样） - walterlv](/post/win10/2017/10/02/wpf-transparent-blur-in-windows-10.html)

## 如何使用

为了方便地让你的窗口获得亚克力效果，我做了两层不同的 API：

1. `AcrylicBrush` *当然，受到 Win32 启用亚克力效果的限制，只能在窗口上设置此属性*
2. `WindowAccentCompositor` *用于更多地控制窗口与系统的叠加组合效果*

代码请参见：

- [Walterlv.Packages/WindowAccentCompositor.cs at master · walterlv/Walterlv.Packages](https://github.com/walterlv/Walterlv.Packages/blob/master/src/Themes/Walterlv.Themes.FluentDesign/Effects/WindowAccentCompositor.cs)

## 注意事项

要使得亚克力效果可以生效，需要：

1. 设置一个混合色 `GradientColor`
2. 混合色不能是全透明（如果全透明，窗口的亚克力部分就全透明穿透了），当然也不能全不透明，这样就看不到亚克力效果了。

---

**参考资料**

- [winapi - How do you set the glass blend colour on Windows 10? - Stack Overflow](https://stackoverflow.com/q/32724187/6233938)
