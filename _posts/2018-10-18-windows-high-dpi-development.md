---
title: "Windows 下的高 DPI 应用开发（UWP / WPF / Windows Forms / Win32）"
publishDate: 2018-10-18 10:06:11 +0800
date: 2018-10-18 14:47:12 +0800
categories: windows dotnet wpf uwp
---

本文将介绍 Windows 系统中高 DPI 开发的基础知识。由于涉及到坐标转换，这种转换经常发生在计算的不知不觉中；所以无论你使用哪种 Windows 下的 UI 框架进行开发，你都需要了解这些内容，以免不断踩坑。

---

<div id="toc"></div>

### 各种不同的 Windows 桌面 UI 框架

微软主推的 Windows 桌面 UI 框架有：

- UWP
- WPF
- Windows Forms
- Win32 与 C++
- DirectX

后两者实际上并不是 UI 框架，是 UI 框架的底层不同实现。当然你单纯凭借 Win32 和 DirectX 去开发 GUI 应用也没有人拦你，只不过如果你试图只用 Win32 和 DirectX 而不进行各种 UI 组件封装的话，最终会非常痛苦的。

UWP 只支持 Windows 10（当然也分不同的小版本，兼容起来有些痛苦）。

WPF 和 Windows Forms 的最新版本只支持 Windows 7 SP1 及以上系统。*如果要支持 Windows 7 和更早的系统，你需要降低 .NET Framework 的版本至 4.6.2 及以下；如果要 XP 支持，还需要到 4.0 及以下。*

### 对普通用户而言的 DPI 级别

DPI 值有两种：系统 DPI (System DPI) 和屏幕 DPI (Monitor DPI)。自 Windows Vista 开始引入系统 DPI 概念，自 Windows 8.1 开始引入屏幕 DPI 概念。

在 Windows Vista / 7 / 8 中，操作系统提供了真正的 DPI 的设置：

![Windows 7 的 DPI 设置](/static/posts/2018-10-17-18-04-47.png)  
▲ Windows 7 的 DPI 设置（*控制面板 -> 外观与个性化 -> 显示*）

这里的设置改的就是系统的 DPI 值。

Windows 7 中还额外提供了传统 Windows XP 风格 DPI 缩放比例的选项（此选项在 Windows 8 之后就删掉了），这也是在修改 DPI 值，只不过可以选择非 1/4 整数倍的 DPI 值。

![自定义 DPI 设置](/static/posts/2018-10-17-18-18-03.png)  
▲ 自定义 DPI 设置

自 Windows 8.1 开始，操作系统开始可以设置不同屏幕的 DPI 值了：

![Windows 10 中的多个屏幕选择](/static/posts/2018-10-17-18-15-37.png)  
▲ Windows 10 中的多个屏幕选择

![Windows 10 中针对每个屏幕的 DPI 设置](/static/posts/2018-10-17-18-15-59.png)  
▲ Windows 10 中针对每个屏幕的 DPI 设置

如果用户在设置中更改了系统 DPI 值或屏幕 DPI 值，那么 Windows 系统会提示需要注销才会应用修改。

对于 Windows 8.1 以下的系统，注销是必要的。因为系统 DPI 值如果不注销就不会改变，应用需要在系统重新登录后有了新的 DPI 值时才会正常根据新的系统 DPI 值进行渲染。否则就是系统进行的位图缩放。

对于 Windows 8.1 及以上的系统，注销通常也是必要的。虽然屏幕 DPI 值已经更新，并且已向应用窗口发送了 Dpi Change 消息，但系统 DPI 值依然没变。应用必须处理 Dpi Change 消息才会正常渲染。如果应用不支持屏幕 DPI 感知，那么使用的就是系统 DPI 值，于是一样的会被系统进行位图缩放。

额外的，对于 Windows 8.1 及以上的系统，系统 DPI 值等于主屏在系统启动时的屏幕 DPI 值。

谁能保证所有的应用都能适配最新的系统特性呢？不能，所以注销通常是免不了的。

### 对 Windows 应用而言的 DPI 感知级别（Dpi Awareness）

Windows 的 DPI 感知级别经过历代升级，已经有四种了。

1. 无感知 (**Unaware**)
    - DPI 值就是一个常量 96。
    - 如果在系统中设置缩放，那么就会采用位图拉伸（会模糊）。
1. 系统级感知 (**System DPI Awareness**)
    - Vista 系统引入
    - DPI 值在系统启动后就固定下来，所有显示器上的应用共用这一个 DPI 值。
    - 如果在系统设置中修改了 DPI，那么就会采用位图拉伸（会模糊）。
1. 屏幕级感知 (**Per-Monitor DPI Awareness**)
    - 随 Windows 8.1 引入
    - 应用的 DPI 值会随着所在屏幕的不同而改变。
    - 当多个屏幕 DPI 不一样，而应用从一个屏幕切换到另一个屏幕的时候，应用会收到 DPI 改变的消息
    - 只有应用的顶层 HWND 会收到 DPI 改变消息
1. 屏幕级感知第二代 (**Per-Monitor V2 DPI Awareness**)
    - 随 Windows 10 (1703) 引入
    - 应用的 DPI 值会随着所在屏幕的不同而改变。
    - 当多个屏幕 DPI 不一样，而应用从一个屏幕切换到另一个屏幕的时候，应用会收到 DPI 改变的消息
    - 应用的顶层和子 HWND 都会收到 DPI 改变消息
    - 以下 UI 元素也会在 DPI 改变时缩放
        - 非客户区（Non-client Area）
        - 系统通用控件中的位图（comctl32V6）
        - 对话框（[CreateDialog](https://docs.microsoft.com/en-us/windows/desktop/api/winuser/nf-winuser-createdialoga)）

### 不同 UI 框架对 DPI 的支持情况

#### UWP

UWP 当然支持最新的各种 DPI 感知级别，而且是完全支持。

#### WPF

WPF 的最新版支持最新的 DPI 感知级别，不过依然有限制：

> Native WPF applications will DPI scale WPF hosted in other frameworks and other frameworks hosted in WPF do not automatically scale

即原生 WPF 应用支持 DPI 缩放，在其他 UI 框架中的 WPF 也支持 DPI 缩放；但是 WPF 中嵌入的其他 UI 框架不支持自动 DPI 缩放。

WPF 第一个版本（随 .NET Framework 3.5 发布）就已支持系统级 DPI 感知。

.NET Framework 4.6.2 开始的 WPF 才开始支持屏幕级 DPI 感知。而 Per-Monitor V1 和 Per-Monitor V2 的支持在操作系统级别是兼容的，所以只需要修改 WPF 中的应用程序清单即可兼容第二代屏幕级 DPI 感知。

#### Windows Forms

Windows Forms 也是在 .NET Framework 4.7 才开始支持屏幕级 DPI 感知的。不过部分控件不支持自动随屏幕 DPI 切换。

#### 其他 UI 框架

原生 Win32 是支持最新 DPI 感知的，其他如 GDI/GDI+/MFC 等都不支持，除非开发者手工编写。

### 混合 DPI 感知级别

当项目足够大的时候，一个或几个项目成员可能很难了解所有的窗口逻辑。让一个进程的所有窗口开启 DPI 缩放对应用的高 DPI 迁移来说比较困难。不过好在我们可以开启混合 DPI 缩放。

Windows 10 (1604) 开始引入顶级窗口（Top-level Window）级别的 DPI 感知，而 Windows 10 (1703) 开始引入每一个 HWND 的 DPI 感知，包括顶级窗口和非顶级窗口。这里的顶级窗口指的是没有父级的窗口，指的是 Parent，而不是 Owner。

在创建一个窗口的前后分别调用 [SetThreadDpiAwarenessContext](https://docs.microsoft.com/en-us/windows/desktop/api/Winuser/nf-winuser-setthreaddpiawarenesscontext) 函数可以让创建的这个窗口具有单独的 DPI 感知级别。前一次是为了让窗口在创建时有一个对此线程的新的 DPI 感知级别，而后一次调用是恢复此线程的 DPI 感知级别。

关于混合 DPI 感知级别的其他内容，可以阅读官网：[Mixed-Mode DPI Scaling and DPI-aware APIs - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/hidpi/high-dpi-improvements-for-desktop-applications)。

微软的 Office 系列就是典型的使用了混合 DPI 感知级别的应用。在以下实验中，我组成了一个 96 DPI 的主屏和 144 DPI 的副屏，先在 96 DPI 的屏幕上截一张图，再将窗口移动到 144 DPI 的屏幕中再截一张图。

Microsoft PowerPoint 使用的是系统 DPI 感知级别：

![96 DPI 下的主界面](/static/posts/2018-10-18-10-10-29.png)  
▲ 96 DPI 下的主界面

![144 DPI 下的主界面](/static/posts/2018-10-18-10-11-03.png)  
▲ 144 DPI 下的主界面

你可以通过点开图片查看原图来比较这两幅图在原图尺寸下的模糊程度。

Microsoft PowerPoint 的演示页面使用的是屏幕 DPI 感知级别：

![96 DPI 下的演示页面](/static/posts/2018-10-18-10-13-43.png)  
▲ 96 DPI 下的演示页面

![144 DPI 下的演示页面](/static/posts/2018-10-18-10-14-09.png)  
▲ 144 DPI 下的演示页面

可以看到，演示页面在多屏 DPI 下是没有产生缩放的模糊，即采用了屏幕 DPI 感知级别。

而以上的主界面和演示页面属于同一个进程。

![只有一个 PowerPoint 进程](/static/posts/2018-10-18-10-17-29.png)  
▲ 只有一个 PowerPoint 进程

### DPI 相关的 Windows API 的迁移

- GetSystemMetrics      ->  GetSystemMetricsForDpi
- AdjustWindowRectEx    ->  AdjustWindowRectExForDpi
- SystemParametersInfo  ->  SystemParametersInfoForDpi
- GetDpiForMonitor      ->  GetDpiForWindow

---

#### 参考资料

- [High DPI Desktop Application Development on Windows - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/hidpi/high-dpi-desktop-application-development-on-windows)
- [WPF-Samples/Developer Guide - Per Monitor DPI - WPF Preview.docx at master · Microsoft/WPF-Samples](https://github.com/Microsoft/WPF-Samples/blob/master/PerMonitorDPI/Developer%20Guide%20-%20Per%20Monitor%20DPI%20-%20WPF%20Preview.docx)
