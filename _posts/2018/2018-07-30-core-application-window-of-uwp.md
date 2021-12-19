---
title: "UWP 应用中 CoreApplication / Application, CoreWindow / Window 之间的区别"
publishDate: 2018-07-30 07:51:34 +0800
date: 2018-12-14 09:54:00 +0800
tags: uwp
version:
  current: 中文
versions:
  - 中文: #
  - English: /post/core-application-window-of-uwp-en.html
coverImage: /static/posts/2018-07-27-08-37-42.png
permalink: /post/core-application-window-of-uwp.html
---

在 StackOverflow 上看到有小伙伴询问 `CoreApplication`, `CoreApplicationView`, `Application`, `ApplicationView`, `CoreWindow`, `Window` 它们的含义以及它们之间的区别。

于是我整理了这篇文章。

---

This post is written in **multiple languages**. Please select yours:

{% include post-version-selector.html %}

StackOverflow 上的地址：[c# - CoreApplicationView vs CoreWindow vs ApplicationView - Stack Overflow](https://stackoverflow.com/a/51585979/6233938)。

<div id="toc"></div>

## 命名空间

类的完整含义经常需要配合其命名空间查看，所以我们有必要将这几个类的完整名称拿出来看：

- `Windows.ApplicationModel.Core.CoreApplication`
- `Windows.ApplicationModel.Core.CoreApplicationView`
- `Windows.UI.Xaml.Application`
- `Windows.UI.ViewManagement.ApplicationView`
- `Windows.UI.Core.CoreWindow`
- `Windows.UI.Xaml.Window`

额外的，如果你关心标题栏，还有：

- `Windows.ApplicationModel.Core.CoreApplicationViewTitleBar`
- `Windows.UI.ViewManagement.ApplicationViewTitleBar`

再额外的，如果你关心线程模型，还有：

- `Windows.UI.Core.CoreDispatcher`
- `Windows.UI.Xaml.DispatcherTimer`

可以看到，大的命名空间分类有 `Windows.ApplicationModel` 和 `Windows.UI` 两类。也就是说，`CoreApplication` 和 `CoreApplicationView` 是管理应用程序模型的，而 `Application`、`CoreWindow` 和 `Window` 是管理应用内 UI 的。小的命名空间分类有 `Core` 和 `Xaml` 两类。也就是说，`CoreApplication`、`CoreApplicationView` 和 `CoreWindow` 是管理核心功能，而 `Application` 和 `Window` 是管理 XAML UI 的。

## 自顶向下

`Application` 到 `Window` 到 XAML 内容，很明显地就能直到其是自顶向下的关系，应用内包含窗口，窗口内包含 XAML 内容。那么它们之间的关系呢？

`CoreApplication` 管理一个 UWP 应用中的所有视图（View），而 `CoreApplication` 直接管理的视图是 `CoreApplicationView`；也就是说，UWP 应用 `CoreApplication` 管理所有的应用视图 `CoreApplicationView`。而一个 `CoreApplicationView` 包含一个窗口和一个线程调度模型，即 `CoreWindow` 和 `CoreDispatcher`。

![UWP 应用视图](/static/posts/2018-07-27-08-37-42.png)  
▲ UWP 应用视图

在 [让 UWP 应用显示多个窗口（多视图）](/post/show-multiple-views-for-an-uwp-app) 一文中，由于一个应用对应多个视图，所以可以更容易地理解它们之间的关系。

`CoreWindow` 就是我们所理解的窗口。为了方便使用，`Windows.UI.XAML.Window` 类型封装了这个 `CoreWindow`。`CoreDispatcher` 是基于消息循环的线程调度模型，正是因为有了消息循环，所以此窗口才能一直显示而不被销毁。

## 对外，还是对内？

我们是站在 UWP 普通开发者的角度来思考这个问题的，普通 UWP 开发者是从 `MainPage` 开始写 UWP 应用的。所以在这里，“外” 指的是页面之外，或者叫做我们直接编写的 XAML 内容之外，那些非 XAML 内容；而 “内” 指的是页面之内，也就是我们通常写的 XAML 内容。

对外的部分有 `CoreApplication`、`CoreApplicationView` 和 `CoreWindow`，对内的部分有 `Application` 和 `Window`。其中，`Window` 是对 `CoreWindow` 的封装，提供了更多与 XAML 相关的功能。这里的 `ApplicationView` 也是这样，是对 `CoreApplication` 的封装，提供了 XAML 相关的功能。

具体来说，`CoreWindow` 是与操作系统、与整个应用打交道的类型，提供了诸如窗口的尺寸、位置、输入状态等设置或调用；`Window` 是与应用内 UI 打交道的类型，比如可以设置窗口内显示的 UI，设置内部哪个控件属于标题栏，获取此窗口内的 `Compositor`。与之对应的，`CoreApplicationView` 是应用与操作系统交互，与窗口消息循环机制协同工作的类型，包含窗口客户区和非客户区设置；`ApplicationView` 也是与应用内 UI 打交道的类型，它可以使用 XAML 相关的类型对应用程序视图进行更方便的设置。

总结起来，`CoreWindow` 和 `CoreApplicationView` 提供更加核心的操作系统或应用底层功能，而 `Window` 和 `ApplicationView` 对前者进行了封装，使得我们能够使用 `Windows.UI.Xaml` 命名空间下的类型对窗口和应用视图进行控制。

## 关于这些概念的更多应用

我有另外一些文章用到了这些概念：

- [从零开始创建一个 UWP 程序](/post/create-uwp-app-from-zero-1)
- [让 UWP 应用显示多个窗口（多视图）](/post/show-multiple-views-for-an-uwp-app)
- [UWP 扩展/自定义标题栏](/post/tips-for-customize-uwp-title-bar)

---

**参考资料**

- [Title bar customization - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/design/shell/title-bar?wt.mc_id=MVP)


