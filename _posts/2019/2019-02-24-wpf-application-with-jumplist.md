---
title: "为 WPF 程序添加 Windows 跳转列表的支持"
publishDate: 2019-02-24 16:40:50 +0800
date: 2019-03-10 21:30:54 +0800
tags: windows wpf dotnet csharp
position: knowledge
coverImage: /static/posts/2019-02-21-21-45-13.png
permalink: /posts/wpf-application-with-jumplist.html
---

Windows 跳转列表是自 Windows 7 时代就带来的功能，这一功能是跟随 Windows 7 的任务栏而发布的。当时应用程序要想用上这样的功能需要调用 shell 提供的一些 API。

然而在 WPF 程序中使用 Windows 跳转列表功能非常简单，在 XAML 里面就能完成。本文将介绍如何让你的 WPF 应用支持 Windows 跳转列表功能。

---

<div id="toc"></div>

## 一个简单的跳转列表程序

新建一个 WPF 程序，然后直接在 App.xaml 中添加跳转列表的代码。这里为了更快上手，我直接贴出整个 App.xaml 的代码。

```xml
<Application x:Class="Walterlv.Demo.WindowsTasks.App"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:local="clr-namespace:Walterlv.Demo.WindowsTasks"
             StartupUri="MainWindow.xaml">
    <JumpList.JumpList>
        <JumpList ShowRecentCategory="True" ShowFrequentCategory="True">
            <JumpTask Title="启动新窗口" Description="启动一个新的空窗口" />
            <JumpTask Title="修改 walterlv 的个性化设置" Description="打开个性化设置页面并定位到 walterlv 的设置"
                      IconResourcePath="C:\Windows\System32\wmploc.dll" IconResourceIndex="17"
                      Arguments="--account" />
        </JumpList>
    </JumpList.JumpList>
</Application>
```

顺便的，我加了一个简单的图标，这样不至于显示一个默认的应用图标。

![添加的简单的图标](/static/posts/2019-02-21-21-45-13.png)

运行此程序后就可以在任务栏上右击的时候看到跳转列表：

![运行后看到的跳转列表](/static/posts/2019-02-21-21-42-05.png)

在这段程序中，我们添加了两个“任务”，在跳转列表中有一个“任务”分类。因为我的系统是英文，所以显示的是“Task”。

在任务分类中，有两个“任务”，`启动新窗口` 以及 `修改 walterlv 的个性化设置`。第一个任务只设了标题和鼠标移上去的提示信息，于是显示的图标就是应用本身的图标，点击之后也是启动任务自己。第二个任务设置了 `Arguments` 参数，于是点击之后会带里面设置的参数启动自己；同时设置了 `IconResourcePath` 和 `IconResourceIndex` 用于指定图标。

这种图标的指定方式是 Windows 系统中非常常用的方式。你可以在我的另一篇博客中找到各种各样系统自带的图标；至于序号，则是自己去数。

- [Windows 10 自带那么多图标，去哪里找呢？](/post/where-is-the-windows-10-native-icons)

## 定制跳转列表的功能

`JumpList` 有两个属性 `ShowRecentCategory` 和 `ShowFrequentCategory`，如果指定为 `true` 则表示操作系统会自动为我们保存此程序最近使用的文件的最频繁使用的文件。

Windows 的跳转列表有两种不同的列表项，一种是“任务”，另一种是文件。至于这两种不同的列表项如何在跳转列表中安排，则是操作系统的事情。

这两种不同的列表项对应的类型分别是：

- `JumpTask`
- `JumpPath`

`JumpTask` 可以理解为这就是一个应用程序的快捷方式，可以指定应用程序的路径（`ApplicationPath`）、工作目录（`WorkingDirectory`）、启动参数（`Arguments`）和图标（`IconResourcePath`、`IconResourceIndex`）。如果不指定路径，那么就默认为当前程序。也可以指定显示的名称（`Title`）和鼠标移上去可以看的描述（`Description`）。

`JumpPath` 则是一个路径，可以是文件或者文件夹的路径。通常用来作为最近使用文件的展示。**特别说明**：你必须关联某种文件类型这种类型的文件才会显示到 `JumpPath` 中。

另外，`JumpTask` 和 `JumpPath` 都有一个 `CustomCategory` 属性可以指定类别。对于 `JumpTask`，如果不指定类别，那么就会在默认的“任务”（Task）类别中。对于 `JumpPath`，如果不指定类别，就在最近的文件中。

`JumpTask` 如果不指定 `Title` 和 `CustomCategory` 属性，那么他会成为一个分隔符。

---

**参考资料**

- [JumpList Class (System.Windows.Shell) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/system.windows.shell.jumplist)
- [Taskbar Extensions - Windows applications - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/shell/taskbar-extensions)


