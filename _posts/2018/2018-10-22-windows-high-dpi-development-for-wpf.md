---
title: "支持 Windows 10 最新 PerMonitorV2 特性的 WPF 多屏高 DPI 应用开发"
publishDate: 2018-10-22 18:04:01 +0800
date: 2020-06-10 16:41:39 +0800
tags: windows dotnet wpf
---

Windows 10 自 1703 开始引入第二代的多屏 DPI 机制（PerMonitor V2），而 WPF 框架可以支持此第二代的多屏 DPI 机制。

本文将介绍 WPF 框架利用第二代多屏 DPI 机制进行高 DPI 适配的方法。同时，也介绍低版本的 WPF 或者低版本的操作系统下如何做兼容。

---

<div id="toc"></div>

## 添加应用程序清单文件

在你现有 WPF 项目的主项目中需要添加两个文件以支持第二代的多屏 DPI 机制。

- app.manifest *(决定性文件)*
- app.config *(修复 Bug, .NET Framework 4.6.2 及以上可忽略)*

![项目中新增的两个文件](/static/posts/2018-10-18-18-18-31.png)  
▲ 项目中新增的两个文件

默认情况下，app.config 在你创建 WPF 项目的时候就会存在，而 app.manifest 则不是。如果你的项目中已经存在这两个文件，就不需要添加了。

### 如果你没有 app.config，如何添加？

打开项目属性，然后在属性中选择 .NET Framework 的版本，无论你选择哪个，app.config 都会自动为你添加。

![选择 .NET Framework 版本以便添加 app.config 文件](/static/posts/2018-10-19-11-54-14.png)

当然，正统的方法是跟下面的 app.manifest 的添加方法相同，你会在下面看到 Visual Studio 新建项中 app.manifest 和 app.config 文件是挨在一起的。

### 如果你没有 app.manifest，如何添加？

![新建文件的时候选择应用程序清单文件（应用程序配置文件就在旁边）](/static/posts/2018-10-22-15-56-38.png)  
▲ 新建文件的时候选择应用程序清单文件（应用程序配置文件就在旁边）

## 了解 WPF 清单文件中的 DPI 感知设置

### DpiAware

在你打开了 app.manifest 文件后，找到以下代码，然后取消注释：

```xml
<!-- Indicates that the application is DPI-aware and will not be automatically scaled by Windows at higher
    DPIs. Windows Presentation Foundation (WPF) applications are automatically DPI-aware and do not need 
    to opt in. Windows Forms applications targeting .NET Framework 4.6 that opt into this setting, should 
    also set the 'EnableWindowsFormsHighDpiAutoResizing' setting to 'true' in their app.config. -->
<!--
<application xmlns="urn:schemas-microsoft-com:asm.v3">
<windowsSettings>
    <dpiAware xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">true</dpiAware>
</windowsSettings>
</application>
-->
```

上面这一段代码是普通的 DPI 感知的清单设置，开启后获得系统 DPI 感知级别（System DPI Awareness）。

如果要开启 Per-Monitor DPI 感知，将上面的 `true` 改成 `true/pm`（pm 表示 per-monitor）。

不过这只是兼容性的设计而已，感谢老版本的系统使用字符串包含的方式，于是可以老版本的系统可以兼容新的 DPI 感知值：

- 什么都不填
    - 如果你额外也没做什么 DPI 相关的操作，那么就是 Unaware。
    - 如果你在程序启动的时候调用了 [SetProcessDpiAwareness](https://docs.microsoft.com/en-us/windows/desktop/api/shellscalingapi/nf-shellscalingapi-setprocessdpiawareness) 或 [SetProcessDPIAware](https://docs.microsoft.com/en-us/windows/desktop/api/winuser/nf-winuser-setprocessdpiaware?wt.mc_id=MVP) 函数，那么就会按照调用此函数的效果来感知 DPI。
- 包含 `true` 字符串
    - 当前进程设置为系统级 DPI 感知（System DPI Awareness）。
- 包含 `false` 字符串
    - 在 Windows Vista / 7 / 8 中，与什么都不填的效果是一样的。
    - 在 Windows 8.1 / 10 中，当前进程设置为不感知 DPI（Unaware），就算你调用了 [SetProcessDpiAwareness](https://docs.microsoft.com/en-us/windows/desktop/api/shellscalingapi/nf-shellscalingapi-setprocessdpiawareness) 和 [SetProcessDPIAware](https://docs.microsoft.com/en-us/windows/desktop/api/winuser/nf-winuser-setprocessdpiaware?wt.mc_id=MVP) 也是没有用的。
- 包含 `true/pm` 字符串
    - 在 Windows Vista / 7 / 8 中，当前进程设置为系统级 DPI 感知（System DPI Awareness）。
    - 在 Windows 8.1 / 10 中，当前进程设置为屏幕级 DPI 感知（Per-Monitor DPI Awareness）。
- 包含 `per monitor` 字符串
    - 在 Windows Vista / 7 / 8 中，与什么都不填的效果是一样的。
    - 在 Windows 8.1 / 10 中，当前进程设置为屏幕级 DPI 感知（Per-Monitor DPI Awareness）。
- 其他任何字符串
    - 在 Windows Vista / 7 / 8 中，与什么都不填的效果是一样的。
    - 在 Windows 8.1 / 10 中，当前进程设置为不感知 DPI（Unaware），就算你调用了 [SetProcessDpiAwareness](https://docs.microsoft.com/en-us/windows/desktop/api/shellscalingapi/nf-shellscalingapi-setprocessdpiawareness) 和 [SetProcessDPIAware](https://docs.microsoft.com/en-us/windows/desktop/api/winuser/nf-winuser-setprocessdpiaware?wt.mc_id=MVP) 也是没有用的。

说明一下，[SetProcessDpiAwareness](https://docs.microsoft.com/en-us/windows/desktop/api/shellscalingapi/nf-shellscalingapi-setprocessdpiawareness) 是新 API，要求的最低系统版本是 Windows 8.1，调用这个才能指定为 Per-Monitor 的 DPI 感知。而 [SetProcessDPIAware](https://docs.microsoft.com/en-us/windows/desktop/api/winuser/nf-winuser-setprocessdpiaware?wt.mc_id=MVP) 是 Vista 开始引入的老 API，没有参数可以传。

### DpiAwareness

```xml
<asmv3:application>
  <asmv3:windowsSettings xmlns="http://schemas.microsoft.com/SMI/2016/WindowsSettings">
    <dpiAwareness>PerMonitorV2, unaware</dpiAwareness>
  </asmv3:windowsSettings>
</asmv3:application>
```

注意：**只有 Windows 10 (1607) 及以上版本才会识别此节点的 DPI 设置**。如果你设置了 `dpiAwareness` 节点，那么 `dpiAware` 就会被忽略。

建议你可以两个节点都指定，这样既可以使用到 Windows 10 1607 的新特性，又可以兼容老版本的 Windows 操作系统。

`dpiAwareness` 节点支持设置一个或多个 DPI 感知级别，用逗号分隔。如果你指定了多个，那么操作系统会从第一个开始识别，如果能识别就使用，否则会找第二个。用这种方式，未来的应用可以指定当前系统不支持的 DPI 感知级别。

鉴于此，在目前 Windows 7 还大行其道的今天，为了兼容，`dpiAwareness` 和 `dpiAware` 都设置是比较靠谱的。

`dpiAwareness` 节点目前支持的值有：

- 什么都不设置
    - 按 `dpiAware` 节点的结果来
- 整个逗号分隔的序列都没有能识别的 DPI 感知级别
    - 如果你额外也没做什么 DPI 相关的操作，那么就是 Unaware。
    - 如果你在程序启动的时候调用了 [SetProcessDpiAwareness](https://docs.microsoft.com/en-us/windows/desktop/api/shellscalingapi/nf-shellscalingapi-setprocessdpiawareness) 或 [SetProcessDPIAware](https://docs.microsoft.com/en-us/windows/desktop/api/winuser/nf-winuser-setprocessdpiaware?wt.mc_id=MVP) 函数，那么就会按照调用此函数的效果来感知 DPI。
- 第一个能识别的感知级别是 `system`
    - 当前进程设置为系统级 DPI 感知（System DPI Awareness）。
- 第一个能识别的感知级别是 `permonitor`
    - 当前进程设置为屏幕级 DPI 感知（Per-Monitor DPI Awareness）。
- 第一个能识别的感知级别是 `permonitorv2`
    - 当前进程设置为第二代屏幕级 DPI 感知（Per-Monitor V2 DPI Awareness）。
    - 仅在 Windows 10 (1703) 及以上版本才可被识别
- 第一个能识别的感知级别是 `unaware`
    - 当前进程设置为不感知 DPI（Unaware），就算你调用了 [SetProcessDpiAwareness](https://docs.microsoft.com/en-us/windows/desktop/api/shellscalingapi/nf-shellscalingapi-setprocessdpiawareness) 和 [SetProcessDPIAware](https://docs.microsoft.com/en-us/windows/desktop/api/winuser/nf-winuser-setprocessdpiaware?wt.mc_id=MVP) 也是没有用的。

## 使 WPF 程序支持 Per-Monitor V2 级 DPI 感知

前面我们分析 App.Manifest 文件中 DPI 的设置后，几乎得到一个信息，`dpiAware` 和 `dpiAwareness` 都是要设置的，除非以后绝大多数用户的系统版本都到达 Windows 10 (1607) 及以上。

以下是推荐的 DPI 感知级别设置：

```xml
<application xmlns="urn:schemas-microsoft-com:asm.v3">
  <windowsSettings>
    <!-- The combination of below two tags have the following effect : 
         1. Per-Monitor for >= Windows 10 Anniversary Update
         2. System < Windows 10 Anniversary Update -->
    <dpiAwareness xmlns="http://schemas.microsoft.com/SMI/2016/WindowsSettings">PerMonitorV2</dpiAwareness>
    <dpiAware xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">true</dpiAware>
  </windowsSettings>
</application>
```

需要注意：系统版本在 Windows 10 (1703) 或以上，V2 的感知级别才会生效，否则就直接使用系统级 DPI 感知。

这里我们其实偷懒了，这种写法方便我们仅处理两种不同的 DPI 缩放规则：

1. Windows 10 (1703) 之后的系统，全按最全支持来做兼容；
2. 其他系统，全按 Windows 7 的支持级别来做兼容。

你可能注意到本文文末的参考文章中有微软的官方博客，里面推荐的是支持所有级别的 DPI 感知。这看你的需求，因为部分 DPI 相关的模块如果你打算都支持，可能需要更加复杂的判定和计算。本文推荐的少一些，省一点开发量（反正 Windows 8.1 和 Windows 10 早期版本的用户量太少，这部分用户体验不比 Windows 7 差，又不是不能用）。

![又不是不能用](/static/posts/2020-06-10-16-41-32.png)

第一代和第二代的 Per-Monitor 感知之间的差异，可以参考：[Windows 下的高 DPI 应用开发（UWP / WPF / Windows Forms / Win32） - walterlv](/post/windows-high-dpi-development)

额外的，如果你的 .NET Framework 版本在 .NET Framework 4.6.2 以下，但操作系统在 Windows 10 及以上，你还需要修改 App.config 文件（在 `<configuration />` 节点）。

```xml
<runtime>
  <AppContextSwitchOverrides value = "Switch.System.Windows.DoNotScaleForDpiChanges=false"/>
</runtime>
```

注意：

1. 这个值要设为 `false`。（微软官方吐槽：Yes, set it to false. Double negative FTW!）
1. `AppContextSwitchOverrides` 不能被设置两次，如果一已经设置了其他值，需要用分号分隔多个值。

特别说明，当面向 .NET Framework 4.6.2 以下版本编译，但运行于 Windows 10 (1607) 和以上版本时，只需要添加 `Switch.System.Windows.DoNotScaleForDpiChanges=false` 即可让 WPF 程序处理 Dpi Change 消息，此时 WPF 程序就像高版本的 .NET Framework 中一样能够正常处理多屏下的 DPI 缩放。

以上，划重点 **你并不需要编译为高版本的 .NET Framework 即可获得 Per-Monitor 的 DPI 缩放支持**。

## WPF 程序在特殊清单设置下的效果

`dpiAwareness` 不设置，`dpiAware` 节点设置为 `true/pm`：

![100% DPI](/static/posts/2018-10-22-17-28-31.png)  
▲ 100% DPI

![150% DPI](/static/posts/2018-10-22-17-28-52.png)  
▲ 150% DPI

注意到标题栏（非客户区）没有缩放，而 WPF 区域（客户区）清晰地缩放了。

`dpiAwareness` 不设置，`dpiAware` 节点设置为 `true`：

![100% DPI](/static/posts/2018-10-22-17-28-31.png)  
▲ 100% DPI

![150% DPI](/static/posts/2018-10-22-17-30-59.png)  
▲ 150% DPI

注意到标题栏（非客户区）被缩放了，而 WPF 区域（客户区）被 DPI 虚拟化进行了位图拉伸（模糊）。

`dpiAwareness` 不设置，`dpiAware` 节点设置为 `true/pm12345`：

此时，WPF 程序无法启动！！！而你只需要减少一位数字，例如写成 `true/pm1234` 即可成功启动，效果跟 `true` 是一样的，注意效果 **不是** `true/pm`。也就是说，`/pm` 并没有显示出它的含义来。额外的，如果设为 `false` 但后面跟随那么长的字符串，WPF 程序是可以启动的。

`dpiAwareness` 设置为 `PerMonitorV2`：

![150% DPI](/static/posts/2018-10-22-17-37-33.png)  
▲ 150% DPI

注意到标题栏（非客户区）被缩放了，而 WPF 区域（客户区）也能清晰地缩放（仅 Windows 10 1703 及以上系统才是这个效果）。

## 低版本 .NET Framework 和 低版本 Windows 下的 WPF DPI 缩放

由于 Windows 8.1 操作系统用户存量不多，主要是 Windows 7 和 Windows 10。所以我们要么兼容完全不支持 Per-Monitor 的 Windows 7，要么使用具有新特性的 Windows 10 即可获得最佳的开发成本平衡。**使用以上的 DPI 缩放方法足以让你的 WPF 应用在任何一个 .NET Framework 版本下获得针对屏幕的 DPI 清晰缩放（Per-Monitor DPI Awareness）。**

所以仅针对 Windows 8.1 做特殊的 DPI 缩放是不值得的，把 Windows 8.1 当做 Windows 7 来做那种不支持 Per-Monitor 的处理就好了。当然你硬要支持也有相关文档可以看：[Developing a Per-Monitor DPI-Aware WPF Application - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/hidpi/declaring-managed-apps-dpi-aware) 了解实现方法。具体是使用 `DisableDpiAwareness` 特性和 [Windows Per-Monitor Aware WPF Sample](https://code.msdn.microsoft.com/windowsdesktop/Per-Monitor-Aware-WPF-e43cde33?wt.mc_id=MVP) 中的源码。

---

**参考资料**

- [Developing a Per-Monitor DPI-Aware WPF Application - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/hidpi/declaring-managed-apps-dpi-aware?wt.mc_id=MVP)
- [WPF-Samples/Developer Guide - Per Monitor DPI - WPF Preview.docx at master · Microsoft/WPF-Samples](https://github.com/Microsoft/WPF-Samples/blob/master/PerMonitorDPI/Developer%20Guide%20-%20Per%20Monitor%20DPI%20-%20WPF%20Preview.docx)
- [Application Manifests - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/sbscs/application-manifests?wt.mc_id=MVP)
- [High-DPI Scaling Improvements for Desktop Applications in the Windows 10 Creators Update (1703) - Windows Developer Blog](https://blogs.windows.com/windowsdeveloper/2017/04/04/high-dpi-scaling-improvements-desktop-applications-windows-10-creators-update/)
