---
title: "WPF 使用 WindowChrome，在自定义窗口标题栏的同时最大程度保留原生窗口样式（类似 UWP/Chrome）"
publishDate: 2018-07-12 15:57:30 +0800
date: 2021-11-12 14:31:33 +0800
tags: wpf uwp dotnet windows
coverImage: /static/posts/2018-07-12-09-22-32.png
permalink: /posts/wpf-simulate-native-window-style-using-window-chrome.html
---

WPF 自定义窗口样式有多种方式，不过基本核心实现都是在修改 Win32 窗口样式。然而，Windows 上的应用就应该有 Windows 应用的样子嘛，在保证自定义的同时也能与其他窗口样式保持一致当然能最大程度保证 Windows 操作系统上的体验一致性。

本文将使用 WindowChrome 来自定义窗口样式，使其既保留原生窗口样式和交互习惯，又能够具备一定的自定义空间。

---

<div id="toc"></div>

## 使用 Windows 原生窗口体验的应用

在自定义窗口样式的同时保证一致的 Windows 窗口风格体验的优秀应用有这些：

- Windows 10 UWP 应用
    - 当然少不了 UWP 应用，毕竟这就是 Windows 10 窗口体验的代表
- Google Chrome
    - 如果我不提第三方应用，你们肯定会说微软都是自己拿内部 API，拿黑科技做的
- Windows 文件资源管理器
    - Windows 文件资源管理器也有一些自定义（例如在标题栏上放按钮，虽然实际做得很丑），不过整体来说还没 Chrome 做得精致呢

![Chrome 普通窗口](/static/posts/2018-07-12-09-22-32.png)  
▲ Chrome 普通窗口

![Chrome 最大化窗口](/static/posts/2018-07-12-09-21-05.png)  
▲ Chrome 最大化窗口

## 为什么不做无边框窗口？

WPF 自定义窗口可是非常容易的，完全自定义样式、异形都不在话下。

```xml
<Window x:Class="Walterlv.Whitman.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        xmlns:local="clr-namespace:Walterlv.Whitman"
        mc:Ignorable="d" Title="Whitman" Width="800" Height="450"
        WindowStyle="None" AllowsTransparency="True">
</Window>
```

然而，这就不贴近原生窗口体验了，有这么多事情都不好模拟：

- 最小化、最大化、关闭按钮
    - 按钮要多大？位置在哪里？图标边距又是多少，颜色值又是什么？鼠标滑入划出的动画效果如何？
- 窗口标题栏交互
    - 标题栏上有右键菜单，如果自己模拟，基本上这个就要自己重新实现了。
- 窗口的位置和尺寸
    - 你需要自己实现一套窗口的拖拽调整位置功能，需要自己实现一套拖拽调整大小的功能。而自己实现的方式在触摸屏下还很容易出现失效的情况。
- 窗口的阴影
    - 要完全模拟 Windows 10 上的窗口阴影效果实在是一件头疼的事情，因为并不知道各种阴影参数是多少；就算模拟出来，性能也是个严重的问题。
- 窗口的边框颜色
    - 虽然窗口边框是被广为吐槽的一点，但为了保证一致的窗口体验，这也是需要模拟的；正常情况和失焦的情况颜色还不一样。
- 第三方应用集成
    - 第三方截图应用可以毫无障碍地捕捉到标准窗口的外框范围，但如果我们没有模拟好（而是拿一个 WPF 无边框窗口模拟），那么第三方截图应用就截不准（可能会超出窗口本来的大小）。

## 开始使用 WindowChrome

你也许需要先阅读 [Window 的 UI 元素及行为 - dino.c](https://www.cnblogs.com/dino623/p/uielements_of_window.html) 了解一些基本概念。

理论上 `WindowChrome` 的使用是非常简单的（呃……理论上）。你只需要在 `<Window />` 节点里写如下代码便能够完成客户区（Client Area）到非客户区（Non-client Area）的覆盖：

```xml
<WindowChrome.WindowChrome>
    <WindowChrome />
</WindowChrome.WindowChrome>
```

然而，默认的行为却并不那么像原生 Windows 10 窗口。事实上，这样的写法只是简单地把窗口的客户区覆盖到非客户区，原生窗口中的交互还在，但样式都已经被遮挡了。

![样式已经被遮挡](/static/posts/2018-07-12-14-13-45.png)  
▲ 样式已经被遮挡

不止是样式被遮挡，我们应该能注意相比于原生还有这些不同：

1. 我们的边框是白色的，原生的边框是系统主题色
1. 鼠标划入我们窗口内才开始拖拽改变大小，但原生的在阴影区域就能开始调整大小了

![拖拽的热区不同](/static/posts/2018-07-12-14-21-11.png)

现在，为了能够观察到 `WindowChrome` 各种属性设置的效果，我们为 `Window` 定义一个新的 `Template`，里面就是空的，这样就没有什么内容能够遮挡我们设置的样式了。

```xml
<Window.Template>
    <ControlTemplate TargetType="Window">
        <Border />
    </ControlTemplate>
</Window.Template>
```

![没有遮挡的窗口](/static/posts/2018-07-12-14-47-02.png)  
▲ 没有遮挡的窗口

然而即便如此，我们也只解决了系统主题色边框的问题，没有解决调整窗口的拖拽热区问题。而且边框还如此之丑。

### GlassFrameThickness

在官方文档 [WindowChrome.GlassFrameCompleteThickness Property (System.Windows.Shell)](https://msdn.microsoft.com/en-us/library/system.windows.shell.windowchrome.glassframecompletethickness(v=vs.110).aspx) 中有说，如果指定 `GlassFrameThickness` 值为 -1，那么可以做到整个窗口都遮挡，但实际上全遮挡的效果也是不对劲的，就像下面这样：

```xml
<WindowChrome.WindowChrome>
    <WindowChrome GlassFrameThickness="-1" />
</WindowChrome.WindowChrome>
```

![GlassFrameThickness 为 -1](/static/posts/2018-07-12-14-45-32.png)  
▲ GlassFrameThickness 为 -1

不止边框颜色不见了，连右上角的三个按钮的位置都跟原生不同，这个窗口的位置不贴边。

显然，`GlassFrameThickness` 属性我们不能指定为 -1。

也不能指定为 0，你可以试试，会发现连阴影都不见了，这更不是我们想要的效果。

![GlassFrameThickness 为 0](/static/posts/2018-07-12-14-54-15.png)  
▲ GlassFrameThickness 为 0

那我们指定为其他正数呢？

![指定为其他正数](/static/posts/2018-07-12-14-59-42.png)  
▲ 指定为其他正数

显然，没有一个符合我们的要求。

### NonClientFrameEdges

但好在我们还有一个属性可以尝试 —— `NonClientFrameEdges`。官方文档 [WindowChrome.NonClientFrameEdges Property (System.Windows.Shell)](https://msdn.microsoft.com/en-us/library/system.windows.shell.windowchrome.nonclientframeedges%28v=vs.110%29.aspx?f=255&MSPPError=-2147217396) 对此的解释是：

> Gets or sets a value that indicates which edges of the window frame are not owned by the client.

即指定哪一边不属于客户区。

考虑到我们前面的尝试中发现左、下、右的边框都是不符合要求的，所以我们现在将值设置为 `Left,Bottom,Right`：

```xml
<WindowChrome.WindowChrome>
    <WindowChrome NonClientFrameEdges="Left,Bottom,Right" />
</WindowChrome.WindowChrome>
```

![比较接近的效果](/static/posts/2018-07-12-15-05-26.png)  
▲ 比较接近的效果

这回我们终于看到了比较接近原生窗口的效果了，除了窗口的边框效果在激活和非激活状态下与原生窗口一致，连右上角三个按钮的位置也是贴近原生窗口的。甚至拖拽调整窗口大小时的光标热区也是类似的：

![拖拽光标热区](/static/posts/2018-07-12-15-07-40.png)  
▲ 拖拽光标热区

唯一不符合要求的是标题栏高度，这时我们可以继续设置 `GlassFrameThickness`，把顶部设置得更高一些。

然而设置到多少呢？我测量了一下 Microsoft Store 应用的按钮高度，是 32。

![Microsoft Store 标题栏](/static/posts/2018-07-12-15-10-48.png)

但是，这 32 包括了顶部 1 像素的边框吗？我使用放大镜查看，发现是包含的。

![Microsoft Store 标题栏放大后](/static/posts/2018-07-12-15-14-16.png)

而我们的 `GlassFrameThickness` 属性也是包含这个 1 像素边框的。所以含义一致，我们可以考虑直接将 32 设置到属性中：

```xml
<WindowChrome.WindowChrome>
    <WindowChrome GlassFrameThickness="0 32 0 0" NonClientFrameEdges="Left,Bottom,Right" />
</WindowChrome.WindowChrome>
```

然而实测结果是 —— 又被耍了，虽然标题栏有 32 的高度，但按钮只有 30 而已：

![](/static/posts/2018-07-12-15-18-16.png)

而且在最大化窗口之后，按钮高度继续压缩。标题栏只剩下 24 的高度，按钮只剩下 22 的高度了。

![](/static/posts/2018-07-12-15-19-32.png)

这显然也模拟得不像。于是，我们霸气一点，直接把顶部边距改得更大。为了凑个整，我写 64 好了。

```xml
<WindowChrome.WindowChrome>
    <WindowChrome GlassFrameThickness="0 64 0 0" NonClientFrameEdges="Left,Bottom,Right" />
</WindowChrome.WindowChrome>
```

虽然正常状态下的按钮依然是 30 高度，但最大化时还是 30 高度这一点与原生 UWP 窗口和 Chrome 的行为是类似的。（UWP 窗口按钮 32 高度，最大化 32 高度；Google Chrome 窗口按钮 30 高度，最大化 27 高度。）

![](/static/posts/2018-07-12-15-24-51.png)

所以，截至这里，我们算是模拟得比较像了。

其他的属性需要尝试吗？`CornerRadius`, `ResizeBorderThickness`, `ResizeGripDirection`, `UseAeroCaptionButtons` 在默认情况下的行为就已经够了；而 `IsHitTestVisibleInChrome` 是个与 WPF 相关的附加属性，与模拟窗口样式没有关系。所以基本模拟就靠前面的两个属性了。

## 定制 Window 的控件模板

`WindowChrome` 提供客户区内容覆盖到非客户区的能力，所以我们通过定制 `Window` 的 `ControlTemplate` 能够在保证原生窗口体验的同时，尽可能定制我们的窗口样式。

在按照以上的方式设置了 `WindowChrome` 之后，我们能够定制的客户区已经有下图所示的这么多了：

![可定制的客户区](/static/posts/2018-07-12-15-35-28.png)  
▲ 可定制的客户区

特别注意：**可定制区域中顶部是包含那 1 像素的边距的，但其他三边不包含。**

下面的窗口是我在 [冷算法：自动生成代码标识符（类名、方法名、变量名）](/post/algorithm-of-generating-random-identifiers) 中所述算法的一个应用，除了右上角的一个白色块，在保证接近原生窗口的情况下，定制了一些内容。

![](/static/posts/2018-07-12-15-44-14.png)  
▲ 一个试验品

为了保证标题栏的标题文字也尽可能地接近原生窗口，我也通过测量得出了用于显示标题的 `<TextBlock />` 的各种参数。整理之后，写成了下面的样式：

![](/static/posts/2018-07-12-15-43-33.png)

```xml
<Window.Template>
    <ControlTemplate TargetType="Window">
        <Border Padding="0 30 0 0">
            <Grid x:Name="RootGrid" Background="{TemplateBinding Background}">
                <Border Background="{TemplateBinding Background}"
                        VerticalAlignment="Top" Height="30" Margin="0 -29 140 0">
                    <TextBlock Foreground="White" Margin="16 0" VerticalAlignment="Center"
                               FontSize="12" Text="{TemplateBinding Title}" />
                </Border>
                <ContentPresenter />
            </Grid>
        </Border>
        <ControlTemplate.Triggers>
            <Trigger Property="WindowState" Value="Maximized">
                <Setter TargetName="RootGrid" Property="Margin" Value="6" />
            </Trigger>
        </ControlTemplate.Triggers>
    </ControlTemplate>
</Window.Template>
```

需要注意，我写了一个触发器，当窗口最大化时根元素边距值设为 6。如果不设置，最大化时窗口边缘的像素将看不见。这是反复尝试的经验值，且在多种 DPI 下验证是依然有效的。实际上即便是最合适此时设置的 `SystemParameters.WindowResizeBorderThickness` 属性依然无法让窗口最大化时边缘距离保持为 0。

## 标题栏上的三大金刚

我们发现，在以上所有方法尝试完成后，还剩下右上角的三颗按钮的背景色无法定制。如果依然采用非客户区控件覆盖的方法，这三个按钮就会被遮挡，只能自己区模拟了，那是不小的工作量。

然而我们还发现，Google Chrome 是定制了这三个按钮的背景色的，正在研究它的做法。

不过 Win32 原生的方法顶多只支持修改标题栏按钮的背景色，而不支持让标题栏按钮全透明。也就是说，Win32 原生方法也许能达到 Google Chrome 的效果，但不可能达到 UWP 中的效果。

为了完全模拟 UWP，标题栏上的按钮只能自绘了。关于自绘标题栏按钮以模拟 UWP 原生按钮，可以阅读我的另一篇文章（代码太长，还是分开了好）：[WPF 应用完全模拟 UWP 的标题栏按钮](/post/wpf-simulate-native-window-title-bar-buttons)。

## 原生 Windows 窗口体验

UWP 应用对窗口样式的定制能力是非常小的，远远小于传统 Win32 应用。但因为其与系统原生集成，如果要求保证原生窗口体验，UWP 的定制能力又是各种方法里面最大的，而且 API 非常简单。

如果你正在使用 UWP 开发应用，可参考林德熙的博客 [win10 uwp 标题栏](https://blog.lindexi.com/post/win10-uwp-%E6%A0%87%E9%A2%98%E6%A0%8F.html) 来定制标题栏。

## 特别处理 Windows 7 上关闭 Aero 效果的情况

博客更新：特别说明，在 Windows 7 上可以关闭 Aero 效果，这时用本文方法做出的窗口，透明部分会显示黑色。

解决方法为调用 `DwmIsCompositionEnabled()` 判断一下是否开启了 Aero 特效，如果关闭了，则使用传统的 AllowsTransparency 属性替代或放弃异形窗口。

```csharp
[DllImport("Dwmapi.dll", ExactSpelling = true, PreserveSig = false)]
[return: MarshalAs(UnmanagedType.Bool)]
public static extern bool DwmIsCompositionEnabled();
```

---

**参考资料**

- [DwmSetWindowAttribute function - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/api/dwmapi/nf-dwmapi-dwmsetwindowattribute?wt.mc_id=MVP)
- [pinvoke.net: DwmSetWindowAttribute (Enums)](https://www.pinvoke.net/default.aspx/Enums/DwmSetWindowAttribute.html)
- [Why does a maximized window have the wrong window rectangle? - The Old New Thing](https://devblogs.microsoft.com/oldnewthing/20120326-00/?p=8003)


