---
title: "WPF 跨应用程序域的 UI（Cross AppDomain UI）"
publishDate: 2017-11-13 00:36:28 +0800
date: 2018-12-14 09:54:00 +0800
tags: wpf
coverImage: /static/posts/2017-11-13-13-23-53.png
---

为自己写的程序添加插件真的是一个相当常见的功能，然而如果只是简单加载程序集然后去执行程序集中的代码，会让宿主应用程序暴露在非常危险的境地！因为只要插件能够运行任何一行代码，就能将宿主应用程序修改得天翻地覆哭爹喊娘；而根本原因，就在于暴露了整个托管堆和整个 UI 树。

如果将宿主和插件放到不同的应用程序域中，则可以解决此问题。本文将介绍跨应用程序域承载 UI 的方法，其中也包含跨域（Cross-Domain）调用方法。

---

<p id="toc"></p>

## 来自于托管插件框架的辅助类

.NET Framework 自 3.5 以来推出了托管插件框架（MAF，Managed AddIn Framework），位于 `System.AddIn` 命名空间。其特性在于，将宿主和插件隔离在不同的应用程序域中，避免插件对宿主造成不良影响。

此命名空间中存在 `FrameworkElementAdapters` 类型，在 System.Windows.Presentation 程序集中，详见 [FrameworkElementAdapters.cs](http://referencesource.microsoft.com/#System.Windows.Presentation/System/AddIn/Pipeline/FrameworkElementAdapters.cs)。虽说主要用于 MAF 插件框架，但其实只需要此类型便可以实现跨应用程序域的 UI。

`FrameworkElementAdapters` 只有两个方法，`ViewToContractAdapter` 将 UI 转换成 `INativeHandleContract`，而 `ContractToViewAdapter` 将 `INativeHandleContract` 用一个 `FrameworkElement` 进行承载。

```csharp
public static class FrameworkElementAdapters
{
    [SecurityCritical]
    public static FrameworkElement ContractToViewAdapter(INativeHandleContract nativeHandleContract);
    [SecurityCritical]
    public static INativeHandleContract ViewToContractAdapter(FrameworkElement root);
}
```

## 一个极简的跨域 UI Demo

首先，我们需要有一个支持跨域调用的类型，并有任意的可以用来返回 `INativeHandleContract` 的方法。

```csharp
internal sealed class DomainX : MarshalByRefObject
{
    public INativeHandleContract GetElement()
    {
        return FrameworkElementAdapters.ViewToContractAdapter(
            new Rectangle
            {
                Width = 200,
                Height = 100,
                Fill = Brushes.ForestGreen,
            });
    }
}
```

我们需要跨域创建这个 UI 控件并得到 `INativeHandleContract`。

```csharp
var domain = AppDomain.CreateDomain("X");
var instance = (DomainX)domain.CreateInstanceAndUnwrap(typeof(DomainX).Assembly.FullName, typeof(DomainX).FullName);
var contract = instance.GetElement();
```

然后，在需要承载这个跨域 UI 的地方取得这个 `INativeHandleContract` 的实例 `contract`。

```csharp
var element = FrameworkElementAsyncAdapters.ContractToViewAdapter(contract);
// this 在这里是 MainWindow 或者 MainPage，或者其它任何能够承载 FrameworkElement 的对象。
this.Content = element;
```

以上的这两端代码都可以写在 `MainWindow` 的 `Loaded` 事件中。

## 对 MAF 吐一下槽

MAF 框架对插件和宿主程序集所在的文件夹结构有要求。这可是非常讨厌的一项特性！因为当我们希望采用 MAF 框架的时候，我们的应用程序可能已经有自己独特的一套目录了。就算我们从零开始写应用，采用 MAF 约定的方式组织 dll 也是很丑的方式（带有很重的 MAF 的影子）。

它没有提供任何的配置，而且如果不按照约定放置文件夹，还会发生如下错误：

![](/static/posts/2017-11-13-13-23-53.png)

---

**参考资料**

- [ENikS/System.AddIn: Projects related to Microsoft System.AddIn](https://github.com/ENikS/System.AddIn)
- [Add-In Performance: What can you expect as you cross an isolation boundary and how to make it better [Jesse Kaplan] – CLR Add-In Team Blog](https://blogs.msdn.microsoft.com/clraddins/2008/02/22/add-in-performance-what-can-you-expect-as-you-cross-an-isolation-boundary-and-how-to-make-it-better-jesse-kaplan/)
- [WPF Add-Ins Overview - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/wpf/app-development/wpf-add-ins-overview?wt.mc_id=MVP)
- [Walkthrough: Creating an Extensible Application - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/add-ins/walkthrough-create-extensible-app?wt.mc_id=MVP)
- [Add-ins and Extensibility - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/add-ins/?wt.mc_id=MVP)

