---
title: "Windows 下的高 DPI 应用开发（UWP / WPF / Windows Forms / Win32）"
publishDate: 2018-10-18 10:06:11 +0800
date: 2021-01-04 20:33:15 +0800
tags: windows dotnet wpf uwp
coverImage: /static/posts/2018-10-22-15-53-59.png
---

本文将介绍 Windows 系统中高 DPI 开发的基础知识。由于涉及到坐标转换，这种转换经常发生在计算的不知不觉中；所以无论你使用哪种 Windows 下的 UI 框架进行开发，你都需要了解这些内容，以免不断踩坑。

---

[![Windows 高 DPI 应用开发课件](/static/posts/2018-10-22-15-53-59.png)](https://r302.cc/D58kdD)

<div id="toc"></div>

## 各种不同的 Windows 桌面 UI 框架

微软主推的 Windows 桌面 UI 框架有：

- UWP
- WPF
- Windows Forms
- Win32 与 C++
- DirectX

后两者实际上并不是 UI 框架，是 UI 框架的底层不同实现。当然你单纯凭借 Win32 和 DirectX 去开发 GUI 应用也没有人拦你，只不过如果你试图只用 Win32 和 DirectX 而不进行各种 UI 组件封装的话，最终会非常痛苦的。

UWP 只支持 Windows 10（当然也分不同的小版本，兼容起来有些小麻烦）。

WPF 和 Windows Forms 的最新版本只支持 Windows 7 SP1 及以上系统。*如果要支持 Windows 7 和更早的系统，你需要降低 .NET Framework 的版本至 4.5.2 及以下；如果要 XP 支持，还需要到 4.0 及以下。*

## 对普通用户而言的 DPI 级别

DPI 值有两种：系统 DPI (System DPI) 和屏幕 DPI (Monitor DPI)。自 Windows Vista 开始引入系统 DPI 概念，自 Windows 8.1 开始引入屏幕 DPI 概念。

在 Windows Vista / 7 / 8 中，操作系统提供了真正的 DPI 的设置：

![Windows 7 的 DPI 设置](/static/posts/2021-01-04-20-25-29.png)  
▲ Windows 7 的 DPI 设置（*控制面板 -> 外观与个性化 -> 显示*）

这里的设置改的就是系统的 DPI 值。

Windows 7 中还额外提供了传统 Windows XP 风格 DPI 缩放比例的选项（此选项在 Windows 8 之后就删掉了），这也是在修改 DPI 值，只不过可以选择非 1/4 整数倍的 DPI 值。

![自定义 DPI 设置](/static/posts/2021-01-04-20-26-22.png)  
▲ 自定义 DPI 设置

自 Windows 8.1 开始，操作系统开始可以设置不同屏幕的 DPI 值了：

![Windows 10 中的多个屏幕选择](/static/posts/2018-10-17-18-15-37.png)  
▲ Windows 10 中的多个屏幕选择

![Windows 10 中针对每个屏幕的 DPI 设置](/static/posts/2018-10-17-18-15-59.png)  
▲ Windows 10 中针对每个屏幕的 DPI 设置

如果用户在设置中更改了系统 DPI 值或屏幕 DPI 值，那么 Windows 系统会提示需要注销才会应用修改。

对于 Windows 8.1 以下的系统，注销是必要的。因为系统 DPI 值如果不注销就不会改变，应用需要在系统重新登录后有了新的 DPI 值时才会正常根据新的系统 DPI 值进行渲染。否则就是系统进行的位图缩放。

对于 Windows 8.1 及以上的系统，注销通常也是必要的。虽然屏幕 DPI 值已经更新，并且已向应用窗口发送了 Dpi Change 消息，但系统 DPI 值依然没变。应用必须处理 Dpi Change 消息才会正常渲染。如果应用不支持屏幕 DPI 感知，那么使用的就是系统 DPI 值，于是一样的会被系统进行位图缩放。

但事情到 Windows 10 (1803) 之后，事情又有了转机。现在，你可以通过在设置中打开一个开关，使得无需注销，只要重新打开应用即可让此应用获取到最新的系统 DPI 的值。

![Windows 10 (1803) 中新增的“不模糊”设置项](/static/posts/2018-10-28-11-03-11.png)

方法是：打开“设置” -> “系统” -> “显示器” -> “高级缩放设置”，在“高级缩放设置”上，打开“允许 Windows 尝试修复应用，使其不模糊”。

额外的，对于 Windows 8.1 及以上的系统，系统 DPI 值等于主屏在系统启动时的屏幕 DPI 值。

## 对 Windows 应用而言的 DPI 感知级别（Dpi Awareness）

Windows 的 DPI 感知级别经过历代升级，已经有四种了。

1. 无感知 (**Unaware**)
    - DPI 值就是一个常量 96。
    - 如果在系统中设置缩放，那么就会采用位图拉伸（会模糊）。
    - 更多信息请看本文末尾的故事。
1. 系统级感知 (**System DPI Awareness**)
    - Vista 系统引入。
    - 所有显示器上的应用共用这一个 DPI 值。
    - 每个用户会话固定一个 DPI 值，修改 DPI 后不需要重启系统而只需要注销当前用户重新登录即可。
    - 如果在设置中修改了 DPI，那么就会采用位图拉伸（会模糊）。
2. 屏幕级感知 (**Per-Monitor DPI Awareness**)
    - 随 Windows 8.1 引入
    - 应用的 DPI 值会随着所在屏幕的不同而改变。
    - 当多个屏幕 DPI 不一样，而应用从一个屏幕切换到另一个屏幕的时候，应用会收到 DPI 改变的消息
    - 只有应用的顶层 HWND 会收到 DPI 改变消息
3. 屏幕级感知第二代 (**Per-Monitor V2 DPI Awareness**)
    - 随 Windows 10 (1607) 引入
    - 应用的 DPI 值会随着所在屏幕的不同而改变。
    - 当多个屏幕 DPI 不一样，而应用从一个屏幕切换到另一个屏幕的时候，应用会收到 DPI 改变的消息
    - 应用的顶层和子 HWND 都会收到 DPI 改变消息
    - 以下 UI 元素也会在 DPI 改变时缩放
        - 非客户区（Non-client Area）
        - 系统通用控件中的位图（comctl32V6）
        - 对话框（[CreateDialog](https://docs.microsoft.com/en-us/windows/desktop/api/winuser/nf-winuser-createdialoga?wt.mc_id=MVP)）

在 Windows 10 19H1 中，可以直接在任务管理器中查看到进程的 DPI Awareness：

![在任务管理器中查看 DPI Awareness](/static/posts/2018-10-22-15-47-00.png)  
▲ 在任务管理器中查看 DPI Awareness

方法是在任务管理器中 Details 的标题栏右键，选择列，然后找到 DPI Awareness。

可以看到，目前仅文件资源管理器是 Per-Monitor V2 的。

关于在任务管理器中查看 DPI，可以阅读我的另一篇博客：

- [Windows 系统上使用任务管理器查看进程的各项属性（命令行、DPI、管理员权限等） - 吕毅](/post/view-process-info-using-task-manager)

任务管理器上关于 DPI 的中文翻译也是蛮有意思的。

## 不同 UI 框架对 DPI 的支持情况

### UWP

UWP 当然支持最新的各种 DPI 感知级别，而且是完全支持。

### WPF

WPF 的最新版支持最新的 DPI 感知级别，不过依然有限制：

> Native WPF applications will DPI scale WPF hosted in other frameworks and other frameworks hosted in WPF do not automatically scale

即原生 WPF 应用支持 DPI 缩放，在其他 UI 框架中的 WPF 也支持 DPI 缩放；但是 WPF 中嵌入的其他 UI 框架不支持自动 DPI 缩放。

WPF 第一个版本（随 .NET Framework 3.5 发布）就已支持系统级 DPI 感知。

.NET Framework 4.6.2 开始的 WPF 才开始支持屏幕级 DPI 感知。而 Per-Monitor V1 和 Per-Monitor V2 的支持在操作系统级别是兼容的，所以只需要修改 WPF 中的应用程序清单即可兼容第二代屏幕级 DPI 感知。

### Windows Forms

Windows Forms 也是在 .NET Framework 4.7 才开始支持屏幕级 DPI 感知的。不过部分控件不支持自动随屏幕 DPI 切换。

### 其他 UI 框架

原生 Win32 是支持最新 DPI 感知的，其他如 GDI/GDI+/MFC 等都不支持，除非开发者手工编写。

## 混合 DPI 感知级别

当项目足够大的时候，一个或几个项目成员可能很难了解所有的窗口逻辑。让一个进程的所有窗口开启 DPI 缩放对应用的高 DPI 迁移来说比较困难。不过好在我们可以开启混合 DPI 缩放。

Windows 10 (1604) 开始引入顶级窗口（Top-level Window）级别的 DPI 感知，而 Windows 10 (1703) 开始引入每一个 HWND 的 DPI 感知，包括顶级窗口和非顶级窗口。这里的顶级窗口指的是没有父级的窗口，指的是 Parent，而不是 Owner。（实际上 API 在更早版本就引入了，这里有故事，详见本文末尾。）

在创建一个窗口的前后分别调用 [SetThreadDpiAwarenessContext](https://docs.microsoft.com/en-us/windows/desktop/api/Winuser/nf-winuser-setthreaddpiawarenesscontext?wt.mc_id=MVP) 函数可以让创建的这个窗口具有单独的 DPI 感知级别。前一次是为了让窗口在创建时有一个对此线程的新的 DPI 感知级别，而后一次调用是恢复此线程的 DPI 感知级别。

关于混合 DPI 感知级别的其他内容，可以阅读官网：[Mixed-Mode DPI Scaling and DPI-aware APIs - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/hidpi/high-dpi-improvements-for-desktop-applications?wt.mc_id=MVP)。

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

## DPI 相关的 Windows API 的迁移

- GetSystemMetrics      ->  GetSystemMetricsForDpi
- AdjustWindowRectEx    ->  AdjustWindowRectExForDpi
- SystemParametersInfo  ->  SystemParametersInfoForDpi
- GetDpiForMonitor      ->  GetDpiForWindow

## 关于 DPI 相关 API 变化的故事

感谢 [Mouri_Naruto](https://www.52pojie.cn/home.php?mod=space&uid=512260)（毛利）提供的故事，API 的具体使用也可参考他的文章：[【原创】实现每显示器高DPI识别(Per-Monitor DPI Aware)的注意事项](https://www.52pojie.cn/thread-512713-1-1.html)。

### 关于 Windows 10

前文提到 Per-Monitor V2 是 Windows 10 (1703) 引入的，微软官方文档 [High DPI Desktop Application Development on Windows - Win32 apps](https://docs.microsoft.com/en-us/windows/win32/hidpi/high-dpi-desktop-application-development-on-windows) 也是这么写的。但实际上更早的 Windows 10 (1607) 就引入了相关 API，包括 SetThreadDpiAwarenessContext 和 PerMonitorV2 应用程序清单。并且更早的，V2 带来的非客户区缩放和子窗口 DPI 变更消息的 API 在 1507 和 1511（分别是 Windows 10 的第一和第二个正式版本）就已经有了，不过是未公开的（可参阅 [【原创】实现每显示器高DPI识别(Per-Monitor DPI Aware)的注意事项](https://www.52pojie.cn/thread-512713-1-1.html)）。1607 开始这两个非公开 API 不能使用了，因为换成了新的 API，参见 [Setting the default DPI awareness for a process (Windows) - Win32 apps](https://docs.microsoft.com/en-us/windows/win32/hidpi/setting-the-default-dpi-awareness-for-a-process#setting-default-awareness-with-the-application-manifest)。

可以发现微软实际上宣称 1607 已经支持 Per-Monitor V2 了，而完整支持是在 1703。所谓的“完整”体现在这些地方：

* comctl32 从 1703 开始完整支持缩放（参见 [High DPI Scaling Improvements for Desktop Applications and “Mixed Mode” DPI Scaling in the Windows 10 Anniversary Update (1607) - Windows Developer Blog](https://blogs.windows.com/windowsdeveloper/2016/10/24/high-dpi-scaling-improvements-for-desktop-applications-and-mixed-mode-dpi-scaling-in-the-windows-10-anniversary-update/#ioIsJTATkKKMored.97)）
* 如果你指定了 PerMonitor 但没指定 PerMonitorV2，那么 1607 默认是 PerMonitor，1703 默认是 PerMonitorV2。

### 关于 Windows Vista 之前的系统

感谢 [Mouri_Naruto](https://www.52pojie.cn/home.php?mod=space&uid=512260)（毛利）提供的历史：

> Windows Vista 之前的系统不代表就对 DPI 无感知，事实上 Windows Vista 之前的版本，大概是 Windows 98 开始就支持通过 GDI 相关的 API 获取当前系统的 DPI 值（当时 Windows Phone 之前的 Windows 移动端 OS 通过这种 API 支持 PPI 高达 280 的手机屏幕，毕竟我也算是 2008 年就入手 HTC Touch Diamond 的用户，那个屏幕的 PPI 值（PPI 280）直到 iPhone Retina 概念（PPI 320）出现后才超过）。
>
> 只是 Windows Vista 提供了对不明确表示 DPI 支持的应用的暴力缩放（通过 Desktop Window Manager 合成实现），毕竟那个时代除了手机之外，基本没有什么屏幕涉及到高 DPI。
>
> 倒是 Windows Vista 之前的系统的 DPI 修改是需要重启机器的……所以当时我作死给我的手机修改 DPI 也是要重启的（Windows CE 5.2 内核）
>
> Vista 之前的版本，系统中设置缩放，如果你做到了 System Aware 的要求位图是不会模糊的（Vista 引入 DWM 虚拟化强制拉伸，主要是当时的引用没有做相关支持，在高 DPI 情况下会控件会变得非常小且布局大概率会乱掉）。

---

**参考资料**

- [High DPI Desktop Application Development on Windows - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/hidpi/high-dpi-desktop-application-development-on-windows?wt.mc_id=MVP)
- [WPF-Samples/Developer Guide - Per Monitor DPI - WPF Preview.docx at master · Microsoft/WPF-Samples](https://github.com/Microsoft/WPF-Samples/blob/master/PerMonitorDPI/Developer%20Guide%20-%20Per%20Monitor%20DPI%20-%20WPF%20Preview.docx)
- [在 Windows 10 中修复显示模糊的应用 - Windows Help](https://support.microsoft.com/zh-cn/help/4091364/windows-10-fix-blurry-apps)
- [Fix apps that appear blurry in Windows 10 - Windows Help](https://support.microsoft.com/en-us/help/4091364/windows-10-fix-blurry-apps)

