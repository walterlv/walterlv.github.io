---
title: "分析现有 WPF / Windows Forms 程序能否顺利迁移到 .NET Core 3.0（使用 .NET Core 3.0 Desktop API Analyzer ）"
publishDate: 2018-09-13 21:00:09 +0800
date: 2018-10-05 6:40:51 +0800
categories: dotnet wpf
---

今年五月的 Build 大会上，微软说 .NET Core 3.0 将带来 WPF / Windows Forms 这些桌面应用的支持。当然，是通过 Windows 兼容包（Windows Compatibility Pack）实现的。为了提前检查你的程序是否能在未来跑在 .NET Core 3.0 上，微软在 2018年8月8日 推出了 .NET Core 3.0 Desktop API Analyzer，帮助你提前检查你的程序能有多容易迁移到 .NET Core 3.0 

本文将介绍其使用方法，并介绍 API 的逐步迁移方法。

---

<div id="toc"></div>

## .NET Core 3.0 Desktop API Analyzer

你可以前往 GitHub 查看 .NET Core 3.0 Desktop API Analyzer 项目：

- [Microsoft/dotnet-apiport-ui](https://github.com/Microsoft/dotnet-apiport-ui)

去 release 标签下即可下载。当然，目前仅发布一个版本，你也可以点击以下链接直接下载：

- [PortabilityAnalyzer.zip](https://github.com/Microsoft/dotnet-apiport-ui/releases)

下载完后解压到任意目录即可运行。

## 分析一个 WPF 程序

第一个想到的，是分析目前已在商店发布的基于 .NET Framework 4.7 的 WPF 程序 [标识符命名工具 - Whitman](ms-windows-store://pdp/?productid=9P8LNZRNJX85)。

![分析 WPF 程序](/static/posts/2018-09-13-20-21-36.png)  
▲ 分析 WPF 程序

其实这个目录下只有一点点程序集，所以分析起来很快的。

![Whitman 的目录结构](/static/posts/2018-09-13-20-22-46.png)  
▲ Whitman 的目录结构

选好后，点击 **Analyze**，在 **Analyzing...** 提示等待之后，即可在它指定的临时目录中找到分析结果文件：

```
Report saved in: 
C:\Users\walterlv\AppData\Local\Temp\PortabilityReport.xlsx
```

竟然是一个 Excel 表格！

![Excel 表格表示的结果](/static/posts/2018-09-13-20-25-13.png)  
▲ Excel 表格表示的结果

可以看到，我的 Whitman 对 .NET Core 3.0 的 API 是 100% 兼容的。将来迁移的时候可以不需要修改代码。

## 分析更复杂的程序

我试着分析一个更庞大的 WPF 软件目录后，发现还是有一些 API 是不兼容的。

![有一些 API 不兼容](/static/posts/2018-09-13-20-37-24.png)  
▲ 有一些 API 不兼容

![有一些程序集兼容性很低](/static/posts/2018-09-13-20-39-08.png)  
▲ 有一些程序集兼容性很低

这份 Excel 表格中还包含了具体哪些 API 是不兼容的，并为部分使用提供了建议：

![查看不兼容的 API](/static/posts/2018-09-13-20-43-07.png)  
▲ 查看不兼容的 API

所以，我们只需要查找对对应 API（第一列）的使用，然后通过其他技术手段将其替换成别的方法来写即可解决这样的兼容性问题。

## 着手解决兼容性问题

比如我们拿出其中一行：

Target type | Target member | Header for assembly name entries | .NET Core | Recommended changes
-|-|-|-|-
T:System.Runtime.Remoting.Messaging.MethodCallMessageWrapper | T:System.Runtime.Remoting.Messaging.MethodCallMessageWrapper | Walterlv.Placeholder | Not supported | Remove usage.

我们通过在 Walterlv.Placeholder（这只是个占位程序集，实际名称已隐去）中全解决方案中搜索 `MethodCallMessageWrapper` 可以找到此 API 的所有使用。

```csharp
public override IMessage Invoke(IMessage msg)
{
    var caller = new MethodCallMessageWrapper((IMethodCallMessage) msg);
    // 省略其他代码。
}
```

此方法在此处上下文的目的是实现 AOP 代理，即为了实现切面编程，允许在实体类的每个方法执行之前注入一些代码。

既然此处基于 .NET Framework `MethodCallMessageWrapper` 的 AOP 已不可用，那么我们需要寻找到 .NET Core 中 AOP 的替代品。例如 .NET Core 官方推荐的是：

- [dotnetcore/AspectCore-Framework: AspectCore is an AOP-based cross platform framework for .NET Standard.](https://github.com/dotnetcore/AspectCore-Framework)

于是，我们几乎需要改造此类型，使其对 .NET Framework 中 `MethodCallMessageWrapper` 的使用替换成对 `AspectCore-Framework` 的依赖。

这是一项繁重的工作，不过还是要做的。迁移到 .NET Core 有很多好处，不是吗？

## 一些错误

额外的，在其他一些程序的分析中，我遇到了一些错误。通过混淆的比较，我认为此错误可能源于程序集的混淆：

```
Unable to analyze.
Details:
Detecting assembly references                      [Failed]

Cannot locate assembly information for System.Object. Microsoft assemblies found are:
Cannot locate assembly information for System.Object. Microsoft assemblies found are:
Cannot locate assembly information for System.Object. Microsoft assemblies found are:
Cannot locate assembly information for System.Object. Microsoft assemblies found are:
Cannot locate assembly information for System.Object. Microsoft assemblies found are:
Cannot locate assembly information for System.Object. Microsoft assemblies found are:
Cannot locate assembly information for System.Object. Microsoft assemblies found are:
Cannot locate assembly information for System.Object. Microsoft assemblies found are:
```

如果你想了解更多混淆相关的资料，可以阅读我的另一篇博客：[.NET 中各种混淆（Obfuscation）的含义、原理、实际效果和不同级别的差异（使用 SmartAssembly）](/post/obfuscation-configurations-of-smart-assembly)。

## 未来的迁移

.NET Core 并不会原生提供 WPF / Windows Forms 这些桌面应用的支持，而是通过 Windows 兼容包（Windows Compatibility Pack）实现。你可以阅读微软官方博客了解：

[Announcing the Windows Compatibility Pack for .NET Core - .NET Blog](https://blogs.msdn.microsoft.com/dotnet/2017/11/16/announcing-the-windows-compatibility-pack-for-net-core/)

迁移到 .NET Core 并不会为这些程序带来跨平台特性，只是能够充分利用到 .NET Core 带来的诸多好处而已。比如更高的性能，更方便的部署，及时的更新。当然还有 MIT 开源，我们能够和社区一起修复 Bug。

关于 .NET Framework 迁移到 .NET Core 的好处，以及 .NET Framework 未来的支持情况，可以阅读微软的另一篇博客了解：

[Update on .NET Core 3.0 and .NET Framework 4.8 - .NET Blog](https://blogs.msdn.microsoft.com/dotnet/2018/10/04/update-on-net-core-3-0-and-net-framework-4-8/)
