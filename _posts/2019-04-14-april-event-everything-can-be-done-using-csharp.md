---
title: "C# 跨设备前后端开发探索"
publishDate: 2019-04-13 17:31:39 +0800
date: 2019-04-15 08:21:52 +0800
categories: csharp dotnet wpf uwp xamarin web
position: starter
---

每个人都拥有 **好奇心**，好奇心驱使着我们总是去尝试做一些有趣的事情。

带起你的好奇心，本文将使用 C# 开发各种各样好玩的东西。

---

[![C# 跨设备前后端开发探索](/static/posts/2019-04-14-17-10-52.png)](http://easinote.seewo.com/linkShare?id=7dc9e588977d4764b1ea1a4112716540)

<div id="toc"></div>

## 0x00 序章

### 好奇心

每个人都拥有 **好奇心**，好奇心驱使着我们总是去尝试做一些有趣的事情。

比如这件事：

![手机上打字慢](/static/posts/2019-04-14-17-22-55.png)

在好奇心的驱使下，我们立刻 **尝试** 我们的想法。

我们需要用电脑打字，手机端出字；于是我们需要开发的是一款云输入法。而一个最简单的云驱动的软件需要至少一个 Web 后端、一个桌面端和一个移动端。

还没开始呢，就这么复杂。

![需要至少三个端](/static/posts/2019-04-14-18-12-37.png)

### 先搞起来

摆在我们面前的，有两条路可以选：

1. ![先掌握所有理论知识再实践](/static/posts/2019-04-14-18-19-52.png)
1. ![无论什么技术，先搞起来](/static/posts/2019-04-14-18-20-13.png)

如果先搞起来，那么我们能够迅速出效果，出产品，出玩具，那么这种成就感会鼓励我们继续完善我们的代码，继续去做更多好玩的东西。

而如果是先掌握所有理论知识再实践，这是我们从学校带来的学习方式，我们中的多数人在校期间就是这么学习的。虽然对学霸来说可以无视，但对于我们这样大多数的小伙伴来说，简直就是“从入门到放弃”。

![从入门到放弃](/static/posts/2019-04-14-learn-and-give-up.gif)

如果先搞起来呢？如果我们连“入门”都不需要呢？是不是就不需要放弃了！

怎么才能够先搞起来？我们需要调整一下心态——我们不是在学，而是在玩！

我们需要做的是降低学习成本，甚至入门不学习，那么立刻就能玩起来！

![搞起来](/static/posts/2019-04-14-18-31-58.png)

我们有 C#，还有什么不能马上搞起来！

## 0x01 C# 跨设备前后端开发

打开 Visual Studio 2019，我们先搞起来！

![Visual Studio 2019](/static/posts/2019-04-14-18-33-07.png)

### Web 后端

![创建一个 Asp.NET Core Web 应用程序](/static/posts/2019-04-14-18-34-25.png)

![输入项目的名称](/static/posts/2019-04-14-18-34-30.png)

![选择 API 开发](/static/posts/2019-04-14-18-34-35.png)

对于简单的云服务来说，使用 Asp.NET Core 开发是非常简单快速的。你可以阅读林德熙的博客入门 Asp.NET Core 开发：

- [win10 uwp 手把手教你使用 asp dotnet core 做 cs 程序 - 林德熙](https://blog.lindexi.com/post/win10-uwp-%E6%89%8B%E6%8A%8A%E6%89%8B%E6%95%99%E4%BD%A0%E4%BD%BF%E7%94%A8-asp-dotnet-core-%E5%81%9A-cs-%E7%A8%8B%E5%BA%8F.html)

### Windows 桌面端

![开发 Windows 桌面端](/static/posts/2019-04-14-18-37-51.png)

我们是要玩的呀，什么东西好玩。我们自己就是用户，用户看得到的部分才是最具有可玩性的。这就是指客户端或者 Web 前端。

我们现在要拿 C# 写客户端，一般 C# 或者 .NET 的开发者拿什么来写桌面客户端呢？

- WPF 或者 Windows Forms 应用程序

![WPF 程序](/static/posts/2019-04-14-18-47-01.png)

![Windows Forms 程序](/static/posts/2019-04-14-18-47-06.png)

### 公共代码

我们现在已经有至少两个端了。由于我们是同一个软件系统，所以实际上非常容易出现公共代码。典型的就是一些数据模型的定义，以及 Web API 的访问代码，还有一些业务需要的其他公共代码等等。

所以，我们最好使用一个新的项目将这些代码整合起来。

我们选用 .NET Standard 项目来存放这些代码，这样可以在各种 .NET 中使用这些库。

![.NET Standard 类库](/static/posts/2019-04-14-18-50-07.png)

### 控制台

由于我们多数的代码都可以放到 .NET Standard 类库中，以确保绝大多数的代码都是平台和框架无关的，所以实际上我们在其他各个端项目中的代码会是很少的。

这个时候，写一个控制台程序来测试我们的项目，控制台程序的部分其实只需要很少的用于控制控制台输入输出的代码，其他多数的代码例如用来访问 Web API 的代码都是不需要放在控制台项目中的，放到 .NET Standard 的类库中编写就可以做到最大程度的共用了。

![控制台程序](/static/posts/2019-04-14-18-50-24.png)

### iOS 端

接下来要完成这个云键盘程序，我们还需要开发一个移动端。使用 Xamarin 可以帮助我们完成这样的任务。

![Xamarin.Forms](/static/posts/2019-04-14-18-52-54.png)

![Xamarin 自定义键盘扩展](/static/posts/2019-04-14-18-53-09.png)

关于使用 Xamarin.Forms 开发一个键盘扩展，可以阅读我的另一篇博客：

- [使用 Xamarin 开发 iOS 键盘扩展（含网络访问）](/post/develop-ios-keyboard-extension-using-xamarin.html)

### Web 前端

于是，我们仅仅使用 C# 还有客户端开发者熟悉的 XAML 就开发出了三个端了。

![三个端](/static/posts/2019-04-14-18-55-17.png)

这三个端中，有两个都是客户端，于是就会存在向用户分发客户端的问题。虽然可以让用户去商店下载，但是提供一个官方下载页面可以让用户在一处地方找到所有端的下载和部署方法。

这需要使用到前端。然而如何使用 C# 代码来编写去前端呢？

![如何使用 C# 来编写前端？](/static/posts/2019-04-14-18-57-35.png)

使用 CSHTML5！

你可以前往 [CSHTML5 的官网](http://www.cshtml5.com/) 下载 Visual Studio 的插件，这样你就可以在 Visual Studio 中编写 CSHTML5 的代码了，还有设计器的支持。

![CSHTML5 如何编译 C# 和 XAML 代码](/static/posts/2019-04-14-18-59-14.png)

## 0x02 C# 还能做什么？

于是我们使用 XAML + C# 就编写出了各个端了。

![各个端](/static/posts/2019-04-14-19-00-57.png)

如果没有 GUI，那么跨平台将是非常容易的一件事情。例如我们想要在 Mac 电脑上也做一个打字发送的一方，那么一个控制台应用也是能够直接完成的。

![没有 GUI，更容易跨平台](/static/posts/2019-04-15-08-09-34.png)

不过，这并不是说，我们只能通过控制台来开发桌面端应用。

我们还有：

- [AvaloniaUI/Avalonia: A multi-platform .NET UI framework](https://github.com/AvaloniaUI/Avalonia)
- [Xamarin 版的 WPF 桌面端](https://docs.microsoft.com/en-us/xamarin/xamarin-forms/platform/other/wpf)
- [Xamarin.Mac - 开发 Mac 桌面端](https://docs.microsoft.com/en-us/xamarin/mac/)
- [GTK# - 开发 Linux 桌面端](https://docs.microsoft.com/en-us/xamarin/xamarin-forms/platform/other/gtk?tabs=windows)
- [Tizen .NET - 开发三星物联网系统的 GUI](https://docs.microsoft.com/en-us/xamarin/xamarin-forms/platform/other/tizen)

利用这些平台，我们能开发其他桌面平台的 GUI 客户端。

另外，利用 ML.NET，我们还能用 C# 进行机器学习。可参见：[Bean.Hsiang - 博客园](http://www.cnblogs.com/BeanHsiang/)。

利用 Roslyn，我们还能用直接做编译器，然后你还有什么不能做的？关于 Roslyn 的入门，可以阅读：[从零开始学习 dotnet 编译过程和 Roslyn 源码分析 - walterlv](https://blog.walterlv.com/post/posts-for-learning-dotnet-build-nuget-roslyn.html)。

还有 IoT。

还有其他……

## 0x03 终章

每个人都拥有 **好奇心**，好奇心驱使着我们总是去尝试做一些有趣的事情。

使用你熟悉的语言 C#，不需要太多额外的入门，即可玩转你身边各种你需要的技术栈，玩出各种各样你自己期望尝试开发的小东西。
