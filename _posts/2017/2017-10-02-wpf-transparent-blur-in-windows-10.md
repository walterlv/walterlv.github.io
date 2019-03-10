---
layout: post
title: "在 Windows 10 上为 WPF 窗口添加模糊特效（就像开始菜单和操作中心那样）"
publishDate: 2017-10-02 00:14:07 +0800
date: 2018-02-20 06:31:10 +0800
categories: win10 windows wpf
permalink: /post/win10/2017/10/02/wpf-transparent-blur-in-windows-10.html
tags: WPF Windows Blur SetWindowCompositionAttribute
description: 
---

其实我是希望能够找到为 Win32 桌面程序实现 Fluent Design System 效果的，不过一直没找到。倒是发现了一个可以让 Win32 桌面程序做出类似 Windows 10 开始菜单和操作中心那种模糊效果的方法。

写这篇文章并不意味着我推荐大家这么去做，只是希望将方法总结出来，作为一个研究点而已。

本文提供了一个完整的用于在 Windows 10 上实现模糊特效的 C# 类，没有放到 GitHub 也没有其他类型的开源。如果需要直接拿走就好。

---

![白底效果](/static/posts/2017-10-01-23-47-29.png)

![黑底效果](/static/posts/2017-10-01-23-49-15.png)

<p id="toc"></p>

## 为什么不推荐使用？

当初 Windows Vista 推出 Aero 特效后惊艳了世人。然而那还是个 30 帧动画大行其道的年代，即便是后来的 Windows 7 也是如此。这个特效不能使用更高帧率就在于对资源的消耗量太感人。然而 Windows 8/8.1 的推出，动画是其中的一个重要部分——那全屏的感人的流畅的动画，那丝般的顺滑，让人难忘。然而这么流畅是有代价的——需要 60 帧满速运行，而且不能占用太多资源，不然依然卡顿。于是微软只好砍掉了背景高斯模糊功能……充满遗憾……被世人唾骂……

忍受不了世人的咒骂，微软只好再把高斯模糊效果带回 Windows 10。可是，在算法没有从根本上得到改进的情况下，大量的资源消耗依然是不可忽视的问题。所以微软现在只好在少数几个地方先用用，满足大家曾经对于 Aero 的呼声，适当提升一点点审美。

既然微软能用，那么我们也理应能用。然而事实情况是——微软没有任何文档来说明如何实现这样的效果。足以说明微软也不希望他们担心的性能问题大量出现在用户的电脑上。（对于移动设备如 Surface 来说，带来的就是电池可用时间的缩短。）

[叛逆者](https://www.zhihu.com/people/minmin.gong/activities) 说，他们终于在特效的算法上有了质的突破，创意来源于平时小组言谈中一点点想法。这就是 Fluent Design System！终于只需要非常少量的计算资源就能达到非常炫酷的现代效果。让人印象深刻的可以替代 Aero 的就属亚克力（Acrylic）了。这效果是在 DWM 进程上运行的（与 Aero 特效一样），所以也不会额外占用应用程序本身的计算资源。

然而，本文探究的方法并不是 Fluent Design System 中的任何部分。依然是微软不期望大家使用的方法，所以，本文并不推荐大家作为真实项目使用，而是作为一种探究学习的途径。

## 我封装的 API

为了方便大家使用，我封装了一个小的 API。于是大家可以非常方便地使用。

如果你想在 XAML 里用，直接在 `MainWindow` 上加上以下两行：

```xml
xmlns:interop="clr-namespace:Walterlv.Demo.Interop"
interop:WindowBlur.IsEnabled="True"
```

如果你希望直接在 cs 文件里面写，则这样就好了：

```csharp
WindowBlur.SetIsEnabled(this, true);
```

注意这里的 `this` 指的是 `MainWindow`。

事实上，当你用了上面的 API 试图看一看效果的时候，你会发现其实并不如本文一开始的图片那样。而是一个非常丑陋的窗口：

![一开始的丑陋](/static/posts/2017-10-02-00-04-29.png)

你需要做两件事情才能变得好看一些：

1. 设置窗口背景色为透明（`Transparent`）/半透明（`#A0FFFFFF`），以便去掉默认的白色背景。
1. 为窗口设置 `WindowChrome` 属性，以便去掉标题栏颜色的不同，并修复周围阴影几个像素的半透明偏差。

完整的代码可以看这里：

```xml
<Window x:Class="Walterlv.Demo.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        xmlns:interop="clr-namespace:Walterlv.Demo.Interop"
        mc:Ignorable="d" Title="Blur Demo" Height="350" Width="525"
        interop:WindowBlur.IsEnabled="True"
        Background="Transparent">
    <WindowChrome.WindowChrome>
        <WindowChrome GlassFrameThickness="-1" />
    </WindowChrome.WindowChrome>
    <Grid Background="#A0FFFFFF">
        <TextBlock Foreground="White"
                   FontSize="20" FontWeight="Light" TextAlignment="Center"
                   HorizontalAlignment="Center" VerticalAlignment="Center">
            <Run Text="Hello World" FontSize="48"/>
            <LineBreak/>
            <Run Text="白底效果" />
            <LineBreak/>
            <Run Text="walterlv.github.io"/>
        </TextBlock>
    </Grid>
</Window>
```

## 实现原理——SetWindowCompositionAttribute

`WindowBlur` 类内部用到了微软从未开放的 API，[叛逆者](https://www.zhihu.com/people/minmin.gong/activities) 也已经证实这就是微软在开始菜单和操作中心中用到的 API。这个 API 就是 `SetWindowCompositionAttribute`。

事实上此类中的代码来源也是多个地方找到的，最开始是 C 语言的版本，而后从 [Nukepayload2/sample-win10-aeroglass](https://github.com/Nukepayload2/sample-win10-aeroglass) 找到了 C# 的版本，最终基于它改造成了现在这个样子。

代码见本文最后，因为我想把参考资料放到前面来，以感谢前人的努力。

---

**参考资料**
- [如何评价微软在 Build 2017 上提出的 Fluent Design System？ - 知乎](https://www.zhihu.com/question/59724483/answer/168191216?utm_medium=social&utm_source=wechat_session)
- [windows - Mimicking Acrylic in a Win32 app - Stack Overflow](https://stackoverflow.com/questions/44000217/mimicking-acrylic-in-a-win32-app)
- [winapi - How do you set the glass blend colour on Windows 10? - Stack Overflow](https://stackoverflow.com/questions/32724187/how-do-you-set-the-glass-blend-colour-on-windows-10)
- [调用未公开API SetWindowCompositionAttribute 在Win10下开启Aero - CSDN博客](http://blog.csdn.net/ysc3839/article/details/50451064)
- [Windows 10 开始菜单的高斯模糊效果是如何实现的？ - 知乎](https://www.zhihu.com/question/54147239)
- [从编程的角度来说，Windows 的开始菜单是如何实现的？ - 知乎](https://www.zhihu.com/question/53157092/answer/133772272?utm_source=qq&utm_medium=social)
- [Windows 10 Creators Update 新功能——画中画模式和窗口高斯模糊 - yinyue200 - 博客园](http://www.cnblogs.com/yinyue200/p/6623307.html)
- [Nukepayload2/sample-win10-aeroglass](https://github.com/Nukepayload2/sample-win10-aeroglass)

---

## 附：封装好的 API 代码

<script src="https://gist.github.com/walterlv/752669f389978440d344941a5fcd5b00.js"></script>
