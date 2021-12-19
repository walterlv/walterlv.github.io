---
title: "WindowsXamlHost：在 WPF 中使用 UWP 的控件（Windows Community Toolkit）"
publishDate: 2018-11-04 11:47:23 +0800
date: 2019-03-09 09:09:02 +0800
tags: uwp wpf dotnet
coverImage: /static/posts/2018-11-04-09-34-39.png
permalink: /posts/use-uwp-controls-in-wpf.html
---

Windows Community Toolkit 再次更新到 5.0。以前可以在 WPF 中使用有限的 UWP 控件，而现在有了 WindowsXamlHost，则可以使用更多 UWP 原生控件了。

---

关于 Windows Community Toolkit 早期版本的 Xaml Bridge，可以参见：

- [WPF 使用 Edge 浏览器 - 林德熙](https://blog.lindexi.com/post/WPF-%E4%BD%BF%E7%94%A8-Edge-%E6%B5%8F%E8%A7%88%E5%99%A8.html)

<div id="toc"></div>

## 安装 NuGet 包

你需要做的第一步，是在你的 WPF 项目中安装 Microsoft.Toolkit.Wpf.UI.XamlHost。建议直接在 项目的 NuGet 管理器中搜索并安装。

![安装 Microsoft.Toolkit.Wpf.UI.XamlHost](/static/posts/2018-11-04-09-34-39.png)

![安装好 NuGet 包后查看引用](/static/posts/2018-11-04-09-43-24.png)

## 配置 WPF 项目能访问 UWP 的类型

因为我们即将开始使用到 UWP 中的控件类型，所以需要配置项目能够访问到 Windows Runtime 的类型。

![添加引用](/static/posts/2018-11-04-09-56-19.png)  
▲ 添加引用

你需要在你的 WPF 项目中添加以下 6 个引用才能访问 UWP 的类型：

- C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETCore\v4.5
    - 引用 System.Runtime.WindowsRuntime
    - 引用 System.Runtime.WindowsRuntime.UI.Xaml
    - 引用 System.Runtime.InteropServices.WindowsRuntime
- C:\Program Files (x86)\Windows Kits\10\UnionMetadata\Facade
    - 引用 Windows.winmd
- C:\Program Files (x86)\Windows Kits\10\References\
    - *在此目录下选择你的 SDK 版本（如 16299,17763 等）*
        - Windows.Foundation.UniversalApiContract\
            - *在此目录下选择你的 API 版本（如 4.0.0.0）*
                - 引用 Windows.Foundation.UniversalApiContract.winmd
        - Windows.Foundation.FoundationContract
            - *在此目录下选择你的 API 版本（如 3.0.0.0）*
                - 引用 Windows.Foundation.FoundationContract.winmd
                
在你添加完这些引用之后，还需要选中这些引用，右击属性，把所有的 “复制到本地” 选项设置为 “否”。

![不要复制到本地](/static/posts/2018-11-04-10-10-16.png)

![添加 Windows Runtime 的 .NET Framework 类型引用](/static/posts/2018-11-04-09-57-03.png)  
▲ 添加 Windows Runtime 的 .NET Framework 类型引用

![添加 Windows.WinMD 的引用](/static/posts/2018-11-04-09-57-44.png)  
▲ 添加 Windows.WinMD 的引用

![在添加引用时注意选择 SDK 的版本号](/static/posts/2018-11-04-09-58-07.png)  
▲ 在添加引用时注意选择 SDK 的版本号

![添加 Windows.Foundation.UniversalApiContract.winmd](/static/posts/2018-11-04-09-58-41.png)  
▲ 添加 Windows.Foundation.UniversalApiContract.winmd

![添加 Windows.Foundation.FoundationContract.winmd](/static/posts/2018-11-04-09-58-54.png)  
▲ 添加 Windows.Foundation.FoundationContract.winmd

## 开始在 WPF 中使用 UWP 的控件

你可以像使用普通 WPF 控件一样将 WindowsXamlHost 添加到你的 WPF 界面中：

- 拖拽到界面设计器中
- 拖拽到 XAML 代码行中
- 直接在 XAML 代码中写

![添加 WindowsXamlHost 控件](/static/posts/2018-11-04-10-17-54.png)  
▲ 添加 WindowsXamlHost 控件

接着，指定 `InitialTypeName` 属性为 UWP 中的控件的名称（带命名空间）。这样，当 WindowsXamlHost 初始化的时候，也会初始化一个 UWP 的控件。

这里为了简单，我初始化一个 UWP 的按钮。但必须得为 UWP 的按钮进行一些初始化，所以我监听了 `ChangedChanged` 事件：

```xml
<XamlHost:WindowsXamlHost Grid.Column="1"
    InitialTypeName="Windows.UI.Xaml.Controls.Button"
    ChildChanged="WindowsXamlHost_ChildChanged" />
```

```csharp
private void WindowsXamlHost_ChildChanged(object sender, EventArgs e)
{
    var host = (WindowsXamlHost) sender;
    var button = (Windows.UI.Xaml.Controls.Button) host.Child;
    button.Width = 120;
    button.Height = 40;
    button.Content = "blog.walterlv.com";
    button.Click += UwpButton_Click;
}

private void UwpButton_Click(object sender, RoutedEventArgs e)
{
}
```

## 可以忽略的错误

在启动的时候，你可能会遇到一些异常。比如下面这个：

![没有 Application](/static/posts/2018-11-04-10-33-27.png)

因为我们不是原生的 UWP，而是 Host 在 WPF 中的 UWP 控件，所以会没有 `Application`。这在 UWP 控件初始化内部已经 `catch` 了，所以你可以忽略。

## 最终效果

当将程序跑起来之后，你就能看到 WPF 窗口中的 UWP 控件了。

![运行效果](/static/posts/2018-11-04-uwp-button-in-wpf-window.gif)

## 值得注意的地方

1. 目前 WindowsXamlHost 还不够稳定，会出现一些闪退
    - 这点就需要为 WindowsCommunityToolkit 贡献 Issues 或代码了
1. Host 的 UWP 控件是一个新的 HwndSource，这相当于 UWP 的控件是通过子窗口的形式与 WPF 窗口放在一起的
    - 于是，只能指定一个矩形区域完全属于 UWP，在这个区域 WPF 控件无法与其获得交互或渲染叠加

## 关于 DPI 适配

为了让 UWP 控件能够在 WPF 窗口中获得正确的 Per-Monitor 的 DPI 适配效果，你需要设置为 PerMonitorV2 的 DPI 感知级别。

在 PerMonitorV2 的 DPI 感知级别下，UWP 控件能够正常获得 DPI 缩放。

在 100% DPI 的屏幕下：

![100% DPI 下](/static/posts/2018-11-04-10-46-46.png)

在 150% DPI 的屏幕下：

![PerMonitorV2 感知级别 150% DPI 下](/static/posts/2018-11-04-10-46-49.png)

而如果只是指定为 PerMonitor，那么切换 DPI 或者切换屏幕的时候，只有 WPF 部分会缩放，而 UWP 部分不会变化。

![PerMonitor 感知级别 150% DPI 下](/static/posts/2018-11-04-10-48-07.png)

关于 PerMonitorV2 和 PerMonitor 的理解和区别，可以参见：

- [Windows 下的高 DPI 应用开发（UWP / WPF / Windows Forms / Win32） - walterlv](/post/windows-high-dpi-development)

关于如何在 WPF 下开启 PerMonitorV2 级别的 DPI 感知可以参见：

- [支持 Windows 10 最新 PerMonitorV2 特性的 WPF 多屏高 DPI 应用开发 - walterlv](/post/windows-high-dpi-development-for-wpf)

## 更复杂的 UWP 控件嵌入

如果希望将更多的 WPF 窗口内的 UI 部分交给 UWP 来做，那么就不能只是仅仅初始化一个 `Button` 就完了。

你需要引入一个 UWP 控件库。阅读以下文章了解更多：

- [WindowsXamlHost：在 WPF 中使用 UWP 控件库中的控件 - walterlv](/post/use-uwp-control-library-in-wpf)

---

**参考资料**

- [WindowsXAMLHost control - Windows Community Toolkit - Microsoft Docs](https://docs.microsoft.com/en-us/windows/communitytoolkit/controls/wpf-winforms/windowsxamlhost?wt.mc_id=MVP)
- [Enhance your desktop application for Windows 10 - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/porting/desktop-to-uwp-enhance#first-set-up-your-project?wt.mc_id=MVP)


