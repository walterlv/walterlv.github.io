---
title: "支持 Windows 10 最新 PerMonitorV2 特性的 WPF 多屏高 DPI 应用开发"
date: 2018-10-20 19:31:59 +0800
categories: windows dotnet wpf
published: false
---

Windows 10 自 1703 开始引入第二代的多屏 DPI 机制（PerMonitor V2），而 WPF 框架可以支持此第二代的多屏 DPI 机制。

本文将介绍 WPF 框架利用第二代多屏 DPI 机制进行高 DPI 适配的方法。同时，也介绍低版本的 WPF 或者低版本的操作系统下如何做兼容。

---

<div id="toc"></div>

### 添加应用程序清单文件

在你现有 WPF 项目的主项目中需要添加两个文件以支持第二代的多屏 DPI 机制。

- app.manifest *(决定性文件)*
- app.config *(修复 Bug)*

![项目中新增的两个文件](/static/posts/2018-10-18-18-18-31.png)  
▲ 项目中新增的两个文件

默认情况下，app.config 在你创建 WPF 项目的时候就会存在，而 app.manifest 则不是。如果你的项目中已经存在这两个文件，就不需要添加了。

#### 如果你没有 app.config，如何添加？

打开项目属性，然后在属性中选择 .NET Framework 的版本，无论你选择哪个，app.config 都会自动为你添加。

![选择 .NET Framework 版本以便添加 app.config 文件](/static/posts/2018-10-19-11-54-14.png)

#### 如果你没有 app.manifest，如何添加？



---

#### 参考资料

- [Developing a Per-Monitor DPI-Aware WPF Application - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/hidpi/declaring-managed-apps-dpi-aware)
- [WPF-Samples/Developer Guide - Per Monitor DPI - WPF Preview.docx at master · Microsoft/WPF-Samples](https://github.com/Microsoft/WPF-Samples/blob/master/PerMonitorDPI/Developer%20Guide%20-%20Per%20Monitor%20DPI%20-%20WPF%20Preview.docx)
- [Application Manifests - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/sbscs/application-manifests)
