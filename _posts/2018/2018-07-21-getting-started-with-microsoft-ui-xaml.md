---
title: "使用 Microsoft.UI.Xaml 解决 UWP 控件和对老版本 Windows 10 的兼容性问题"
publishDate: 2018-07-21 21:51:05 +0800
date: 2018-12-14 09:54:00 +0800
tags: uwp windows
coverImage: /static/posts/2018-07-21-21-16-05.png
---

虽然微软宣称 Windows 10 将是最后一个 Windows 版本，但由于年代跨越实在太久远，兼容性依然是避不开的问题。Microsoft.UI.Xaml 的预览版现已推出，旨在解决 UWP UI 控件在各个不同版本 Windows 上的兼容性问题。

本文将简单了解一下 Microsoft.UI.Xaml 库，然后实际看看它的效果。

---

<div id="toc"></div>

## Windows 10 的兼容性问题

在创建 UWP 应用的时候，我们可以选择目标版本和最低版本。目标版本决定了我们能使用的最新 API，最低版本决定了我们需要支持的最低版本的 Windows 10。

![选择目标版本和最低版本](/static/posts/2018-07-21-21-16-05.png)  
▲ 图中目标版本为 17134，最低版本为 14393。事实上，目标版本必须是 17134，最低只能支持到 14393。

然而，每一次新版本 Windows 10 的推出，都带来大量新的开发 API。可以去官方文档 [Choose a UWP version - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/updates-and-versions/choose-a-uwp-version?wt.mc_id=MVP) 了解各个版本 Windows 10 新增的功能简介。

微软在 Windows 10 16299 版本带来了 XAML 条件编译，用以在 XAML 中兼容不同版本的 Windows 10，然而这意味着必须选择 16299 作为最低 API 版本才能正常使用此功能。当然，XAML 条件编译还是带来了不少方便的特性呢，阅读 [win10 uwp xaml 兼容多个版本条件编译 - 林德熙](https://blog.lindexi.com/post/win10-uwp-xaml-%E5%85%BC%E5%AE%B9%E5%A4%9A%E4%B8%AA%E7%89%88%E6%9C%AC%E6%9D%A1%E4%BB%B6%E7%BC%96%E8%AF%91.html) 可以了解 XAML 条件编译的使用方法，顺便收获一只猫。

Windows 10 也在各个版本新增了一些控件。那么问题来了，要支持最低版本就不能使用新控件。Windows 10 又不像 iOS 那样更新率高，意味着根本不能使用新控件进行开发。

![NavigationView](/static/posts/2018-07-21-21-32-58.png)

## Microsoft.UI.Xaml 库

于是微软就推出了在 <nuget.org> 上推出了 NuGet 包 [Microsoft.UI.Xaml](https://www.nuget.org/packages/Microsoft.UI.Xaml)。

使用此包，你需要将 UWP 的 **目标版本设为 17134**，支持的 **最低版本只能到 14393**，不能更低。

官方对此包的描述为：

> This package provides backward-compatible versions of Windows UI features including UWP XAML controls, and Fluent styles and materials. It is part of the Windows UI Library.

即提供各种 Windows UI 功能的向后兼容性，包括 UWP XAML 控件、Fluent 流畅设计样式和画刷。当然，不支持亚克力效果的系统版本虽然画刷能用，不崩溃，但也没有效果的。

![安装 Microsoft.UI.Xaml](/static/posts/2018-07-21-21-37-52.png)

## Microsoft.UI.Xaml 的上手方法

安装 Microsoft.UI.Xaml 后，Visual Studio 会自动打开 readme.txt 文件提示我们用法：

> Thanks for installing the WinUI nuget package! Don't forget to add this to your app.xaml:
> 
>     <Application.Resources>
>         <XamlControlsResources xmlns="using:Microsoft.UI.Xaml.Controls"/>
>     </Application.Resources>
> 
> See <http://aka.ms/winui> for more information.

即我们需要在 App.xaml 文件中添加 `<XamlControlsResources xmlns="using:Microsoft.UI.Xaml.Controls"/>` 作为应用程序的全局资源。不过，官方文档 [Getting started with the Windows UI library](https://docs.microsoft.com/en-us/uwp/toolkits/winui/getting-started?wt.mc_id=MVP) 中有对此更详细的描述。

如果我们是新 UWP 程序，这样写是没问题的：

```xml
<Application>
    <Application.Resources>
        <XamlControlsResources xmlns="using:Microsoft.UI.Xaml.Controls"/> 
    </Application.Resources>
</Application>
```

但如果基于原有的程序进行兼容性改造，可能原 Application 中已经有资源了，就必须换一种写法：

```xml
<Application>
    <Application.Resources>
        <ResourceDictionary>
            <ResourceDictionary.MergedDictionaries>
                <XamlControlsResources  xmlns="using:Microsoft.UI.Xaml.Controls"/>
            </ResourceDictionary.MergedDictionaries> 
        </ResourceDictionary>
    </Application.Resources>
</Application>
```

当然，以上这种改造在各种 XAML 上的行为都是一样的，比如我在 StackOverflow 上回答的问题 [Use ResourceDictionary with other Styles in WPF](https://stackoverflow.com/a/51391735/6233938) 也是这样的改法，其中说明了必须这样修改的原因。

不过没有结束，在需要使用到新版本 Windows 10 控件的 XAML 文件中，需要添加命名空间前缀：

```xml
xmlns:controls="using:Microsoft.UI.Xaml.Controls"
```

这样才能在 XAML 中使用 Microsoft.UI.Xaml 库中的新控件：

```xml
<Grid>
    <controls:NavigationView x:Name="WalterlvDemoView">
        <controls:NavigationView.MenuItems>
            <ListViewItem Content="Home" />
            <ListViewItem Content="Demo" />
            <ListViewItem Content="About" />
            <ListViewItem Content="https://walterlv.github.io/" />
        </controls:NavigationView.MenuItems>
    </controls:NavigationView>
</Grid>
```

还记得本文开头那张 Visual Studio 的兼容性提示图片吗？使用了 Microsoft.UI.Xaml 库之后，不会再有提示了。这不是欺骗，是真的具备了对早期系统的兼容性。

![](/static/posts/2018-07-21-20-59-27.png)

于是，一些广泛使用的 UWP 应用终于不用各种自己写控件来兼容低版本的 Windows 10 了。

当然除了在 XAML 中，也可以在 C# 代码中使用库中的新 API。

## 解决意料之外的错误

一切可以那么顺利？不一定，你可能在刚刚把 `<XamlControlsResources />` 加入之后，就会发现程序启动即崩溃了……

然后提示：

> System.Runtime.InteropServices.COMException  
>   HResult=0x80004005  
>   Message=Error HRESULT E_FAIL has been returned from a call to a COM component.  
>   Source=<Cannot evaluate the exception source>  
>   StackTrace:  
> <Cannot evaluate the exception stack trace>


![启动异常](/static/posts/2018-07-24-09-05-10.png)

不得不说，微软再一次把内部错误暴露了出去。实际的错误原因是 —— **目标 SDK 需要设置为 17134** —— 这是必须的！

![设置为 17134](/static/posts/2018-07-24-09-10-43.png)

当然，这个版本号并不是跟随系统的，而是跟随 Microsoft.UI.Xaml 库的。库如果更新有新系统的控件，那么你更新库之后就需要再次更新目标 SDK 版本了。

