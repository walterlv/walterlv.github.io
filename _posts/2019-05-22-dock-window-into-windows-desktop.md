---
title: "WPF 使用 AppBar 将窗口停靠在桌面上，让其他程序不占用此窗口的空间（附我封装的附加属性）"
date: 2019-05-22 19:44:35 +0800
categories: windows dotnet csharp wpf
position: knowledge
---

本文介绍如何使用 Windows 的 AppBar 相关 API 实现固定停靠在桌面上的特殊窗口。

---

<div id="toc"></div>

## 停靠窗口

你可能并不明白停靠窗口是什么意思。

看下图，你可能使用过 OneNote 的停靠窗口功能。当打开一个新的 OneNote 停靠窗口之后，这个新的 OneNote 窗口将固定显示在桌面的右侧，其他的窗口就算最大化也只会占据剩余的空间。

OneNote 的这种功能可以让你在一边浏览网页或做其他事情的时候，以便能够做笔记。同时又不用担心其他窗口最大化的时候会占据记笔记的一部分空间。

![OneNote 的停靠窗口](/static/posts/2019-05-22-16-57-28.png)

这其实也是 Windows 任务栏所使用的方法。

OneNote 中给出的名称叫做“停靠窗口”，于是这可以代表微软希望用户对这个概念的理解名词。

只是，这个概念在 Windows API 中的名称叫做 AppBar。

## AppBar

要做出停靠窗口的效果，最核心的 API 是 `SHAppBarMessage`，用于发送 AppBar 消息给操作系统，以便让操作系统开始处理此窗口已形成一个 AppBar 窗口。也就是我们在用户交互上所说的“停靠窗口”。

虽然说要让一个窗口变成 AppBar 只需要一点点代码，但是要让整个停靠窗口工作得真的像一个停靠窗口，依然需要大量的辅助代码。所以我将其封装成了一个 `DesktopAppBar` 类，方便 WPF 程序来调用。

## 如何使用

以下使用，你需要先获取我封装的源码才可以编译通过：

- 

你可以在 XAML 中使用：

```xml
<Window x:Class="Walterlv.Demo.DesktopDocking.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        xmlns:dock="clr-namespace:Walterlv.Demo.DesktopDocking"
        mc:Ignorable="d" Title="Walterlv 的停靠窗口" Height="450" Width="500"
        dock:DesktopAppBar.AppBar="Right">
    <StackPanel Background="#ffcd42">
        <TextBlock FontSize="64" Margin="64" TextAlignment="Center" Text="walterlv 的停靠窗口" />
        <Button Content="再停靠一个 - blog.walterlv.com" FontSize="32" Padding="32" Margin="32" Background="#f9d77b" BorderThickness="0"
                Click="Button_Click"/>
    </StackPanel>
</Window>
```

核心代码是其中的一处属性赋值 `dock:DesktopAppBar.AppBar="Right"`，以及前面的命名空间声明 `xmlns:dock="clr-namespace:Walterlv.Demo.DesktopDocking"`。

你也可以在 C# 代码中使用：

```csharp
using System;
using System.Windows;

namespace Walterlv.Demo.DesktopDocking
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
        }

        protected override void OnSourceInitialized(EventArgs e)
        {
            base.OnSourceInitialized(e);
            DesktopAppBar.SetAppBar(this, AppBarEdge.Right);
        }
    }
}
```

使用以上代码中的任何一种方式，你就可以让你的窗口在右边停靠了。

![停靠的窗口](/static/posts/2019-05-22-19-29-33.png)

从图中我们可以发现，我们的示例窗口停靠在了右边，其宽度就是我们在 XAML 中设置的窗口宽度（当然这是我封装的逻辑，而不是 AppBar 的原生逻辑）。

同时我们还能注意到，Visual Studio 的窗口是处于最大化的状态的——这是停靠窗口的最大优势——可以让其他窗口的工作区缩小，在最大化的时候不会覆盖到停靠窗口的内容。

## 如何还原

Windows AppBar 的 API 有一个很不好的设定，如果进程退出了，那么 AppBar 所占用的空间 **并不会还原**！！！

不过不用担心，我在封装的代码里面加入了窗口关闭时还原空间的代码，如果你正常关闭窗口，那么停靠窗口占用的空间就会及时还原回来。

当然，你也可以适时调用下面的代码：

```csharp
DesktopAppBar.SetAppBar(this, AppBarEdge.None);
```

## 附源码

由于源码一直在持续改进，所以本文中贴的源代码可能不是最新的。你可以在以下仓库找到这段源码的最新版本：

- [walterlv.demo/Walterlv.Demo.DesktopDocking/Walterlv.Demo.DesktopDocking at master · walterlv/walterlv.demo](https://github.com/walterlv/walterlv.demo/tree/master/Walterlv.Demo.DesktopDocking/Walterlv.Demo.DesktopDocking)

```csharp
using System;
using System.ComponentModel;
using System.Diagnostics.CodeAnalysis;
using System.Runtime.InteropServices;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Interop;

// ReSharper disable IdentifierTypo
// ReSharper disable InconsistentNaming
// ReSharper disable EnumUnderlyingTypeIsInt
// ReSharper disable MemberCanBePrivate.Local
// ReSharper disable UnusedMember.Local
// ReSharper disable UnusedMember.Global

namespace Walterlv.Demo.DesktopDocking
{
    /// <summary>
    /// 表示窗口停靠到桌面上时的边缘方向。
    /// </summary>
    public enum AppBarEdge
    {
        /// <summary>
        /// 窗口停靠到桌面的左边。
        /// </summary>
        Left = 0,

        /// <summary>
        /// 窗口停靠到桌面的顶部。
        /// </summary>
        Top,

        /// <summary>
        /// 窗口停靠到桌面的右边。
        /// </summary>
        Right,

        /// <summary>
        /// 窗口停靠到桌面的底部。
        /// </summary>
        Bottom,

        /// <summary>
        /// 窗口不停靠到任何方向，而是成为一个普通窗口占用剩余的可用空间（工作区）。
        /// </summary>
        None
    }

    /// <summary>
    /// 提供将窗口停靠到桌面某个方向的能力。
    /// </summary>
    public class DesktopAppBar
    {
        public static readonly DependencyProperty AppBarProperty = DependencyProperty.RegisterAttached(
            "AppBar", typeof(AppBarEdge), typeof(DesktopAppBar),
            new PropertyMetadata(AppBarEdge.None, OnAppBarEdgeChanged));

        public static AppBarEdge GetAppBar(Window window) => (AppBarEdge) window.GetValue(AppBarProperty);

        public static void SetAppBar(Window window, AppBarEdge value) => window.SetValue(AppBarProperty, value);

        private static readonly DependencyProperty AppBarProcessorProperty = DependencyProperty.RegisterAttached(
            "AppBarProcessor", typeof(AppBarWindowProcessor), typeof(DesktopAppBar), new PropertyMetadata(null));

        [SuppressMessage("ReSharper", "ConditionIsAlwaysTrueOrFalse")]
        private static void OnAppBarEdgeChanged(DependencyObject d, DependencyPropertyChangedEventArgs e)
        {
            if (DesignerProperties.GetIsInDesignMode(d))
            {
                return;
            }

            var oldValue = (AppBarEdge) e.OldValue;
            var newValue = (AppBarEdge) e.NewValue;
            var oldEnabled = oldValue is AppBarEdge.Left
                             || oldValue is AppBarEdge.Top
                             || oldValue is AppBarEdge.Right
                             || oldValue is AppBarEdge.Bottom;
            var newEnabled = newValue is AppBarEdge.Left
                             || newValue is AppBarEdge.Top
                             || newValue is AppBarEdge.Right
                             || newValue is AppBarEdge.Bottom;
            if (oldEnabled && !newEnabled)
            {
                var processor = (AppBarWindowProcessor) d.GetValue(AppBarProcessorProperty);
                processor.Detach();
            }
            else if (!oldEnabled && newEnabled)
            {
                var processor = new AppBarWindowProcessor((Window) d);
                d.SetValue(AppBarProcessorProperty, processor);
                processor.Attach(newValue);
            }
            else if (oldEnabled && newEnabled)
            {
                var processor = (AppBarWindowProcessor) d.GetValue(AppBarProcessorProperty);
                processor.Update(newValue);
            }
        }

        /// <summary>
        /// 包含对 <see cref="Window"/> 进行操作以便使其成为一个桌面停靠窗口的能力。
        /// </summary>
        private class AppBarWindowProcessor
        {
            /// <summary>
            /// 创建 <see cref="AppBarWindowProcessor"/> 的新实例。
            /// </summary>
            /// <param name="window">需要成为停靠窗口的 <see cref="Window"/> 的实例。</param>
            public AppBarWindowProcessor(Window window)
            {
                _window = window;
                _callbackId = RegisterWindowMessage("AppBarMessage");
                _hwndSourceTask = new TaskCompletionSource<HwndSource>();

                var source = (HwndSource) PresentationSource.FromVisual(window);
                if (source == null)
                {
                    window.SourceInitialized += OnSourceInitialized;
                }
                else
                {
                    _hwndSourceTask.SetResult(source);
                }

                _window.Closed += OnClosed;
            }

            private readonly Window _window;
            private readonly TaskCompletionSource<HwndSource> _hwndSourceTask;
            private readonly int _callbackId;

            private WindowStyle _restoreStyle;
            private Rect _restoreBounds;
            private ResizeMode _restoreResizeMode;
            private bool _restoreTopmost;

            private AppBarEdge Edge { get; set; }

            /// <summary>
            /// 在可以获取到窗口句柄的时候，给窗口句柄设置值。
            /// </summary>
            private void OnSourceInitialized(object sender, EventArgs e)
            {
                _window.SourceInitialized -= OnSourceInitialized;
                var source = (HwndSource) PresentationSource.FromVisual(_window);
                _hwndSourceTask.SetResult(source);
            }

            /// <summary>
            /// 在窗口关闭之后，需要恢复窗口设置过的停靠属性。
            /// </summary>
            private void OnClosed(object sender, EventArgs e)
            {
                _window.Closed -= OnClosed;
                _window.ClearValue(AppBarProperty);
            }

            /// <summary>
            /// 将窗口属性设置为停靠所需的属性。
            /// </summary>
            private void ForceWindowProperties()
            {
                _window.WindowStyle = WindowStyle.None;
                _window.ResizeMode = ResizeMode.NoResize;
                _window.Topmost = true;
            }

            /// <summary>
            /// 备份窗口在成为停靠窗口之前的属性。
            /// </summary>
            private void BackupWindowProperties()
            {
                _restoreStyle = _window.WindowStyle;
                _restoreBounds = _window.RestoreBounds;
                _restoreResizeMode = _window.ResizeMode;
                _restoreTopmost = _window.Topmost;
            }

            /// <summary>
            /// 使一个窗口开始成为桌面停靠窗口，并开始处理窗口停靠消息。
            /// </summary>
            /// <param name="value">停靠方向。</param>
            public async void Attach(AppBarEdge value)
            {
                var hwndSource = await _hwndSourceTask.Task;

                BackupWindowProperties();

                var data = new APPBARDATA();
                data.cbSize = Marshal.SizeOf(data);
                data.hWnd = hwndSource.Handle;

                data.uCallbackMessage = _callbackId;
                SHAppBarMessage((int) ABMsg.ABM_NEW, ref data);
                hwndSource.AddHook(WndProc);

                Update(value);
            }

            /// <summary>
            /// 更新一个窗口的停靠方向。
            /// </summary>
            /// <param name="value">停靠方向。</param>
            public async void Update(AppBarEdge value)
            {
                var hwndSource = await _hwndSourceTask.Task;

                Edge = value;


                var bounds = TransformToAppBar(hwndSource.Handle, _window.RestoreBounds, value);
                ForceWindowProperties();
                Resize(_window, bounds);
            }

            /// <summary>
            /// 使一个窗口从桌面停靠窗口恢复成普通窗口。
            /// </summary>
            public async void Detach()
            {
                var hwndSource = await _hwndSourceTask.Task;

                var data = new APPBARDATA();
                data.cbSize = Marshal.SizeOf(data);
                data.hWnd = hwndSource.Handle;

                SHAppBarMessage((int) ABMsg.ABM_REMOVE, ref data);

                _window.WindowStyle = _restoreStyle;
                _window.ResizeMode = _restoreResizeMode;
                _window.Topmost = _restoreTopmost;

                Resize(_window, _restoreBounds);
            }

            private IntPtr WndProc(IntPtr hwnd, int msg,
                IntPtr wParam, IntPtr lParam, ref bool handled)
            {
                if (msg == _callbackId)
                {
                    if (wParam.ToInt32() == (int) ABNotify.ABN_POSCHANGED)
                    {
                        var hwndSource = _hwndSourceTask.Task.Result;
                        var bounds = TransformToAppBar(hwndSource.Handle, _window.RestoreBounds, Edge);
                        Resize(_window, bounds);
                        handled = true;
                    }
                }

                return IntPtr.Zero;
            }

            private static void Resize(Window window, Rect bounds)
            {
                window.Left = bounds.Left;
                window.Top = bounds.Top;
                window.Width = bounds.Width;
                window.Height = bounds.Height;
            }

            private Rect TransformToAppBar(IntPtr hWnd, Rect area, AppBarEdge edge)
            {
                var data = new APPBARDATA();
                data.cbSize = Marshal.SizeOf(data);
                data.hWnd = hWnd;
                data.uEdge = (int) edge;

                if (data.uEdge == (int) AppBarEdge.Left || data.uEdge == (int) AppBarEdge.Right)
                {
                    data.rc.top = 0;
                    data.rc.bottom = (int) SystemParameters.PrimaryScreenHeight;
                    if (data.uEdge == (int) AppBarEdge.Left)
                    {
                        data.rc.left = 0;
                        data.rc.right = (int) Math.Round(area.Width);
                    }
                    else
                    {
                        data.rc.right = (int) SystemParameters.PrimaryScreenWidth;
                        data.rc.left = data.rc.right - (int) Math.Round(area.Width);
                    }
                }
                else
                {
                    data.rc.left = 0;
                    data.rc.right = (int) SystemParameters.PrimaryScreenWidth;
                    if (data.uEdge == (int) AppBarEdge.Top)
                    {
                        data.rc.top = 0;
                        data.rc.bottom = (int) Math.Round(area.Height);
                    }
                    else
                    {
                        data.rc.bottom = (int) SystemParameters.PrimaryScreenHeight;
                        data.rc.top = data.rc.bottom - (int) Math.Round(area.Height);
                    }
                }

                SHAppBarMessage((int) ABMsg.ABM_QUERYPOS, ref data);
                SHAppBarMessage((int) ABMsg.ABM_SETPOS, ref data);

                return new Rect(data.rc.left, data.rc.top,
                    data.rc.right - data.rc.left, data.rc.bottom - data.rc.top);
            }

            [StructLayout(LayoutKind.Sequential)]
            private struct RECT
            {
                public int left;
                public int top;
                public int right;
                public int bottom;
            }

            [StructLayout(LayoutKind.Sequential)]
            private struct APPBARDATA
            {
                public int cbSize;
                public IntPtr hWnd;
                public int uCallbackMessage;
                public int uEdge;
                public RECT rc;
                public readonly IntPtr lParam;
            }

            private enum ABMsg : int
            {
                ABM_NEW = 0,
                ABM_REMOVE,
                ABM_QUERYPOS,
                ABM_SETPOS,
                ABM_GETSTATE,
                ABM_GETTASKBARPOS,
                ABM_ACTIVATE,
                ABM_GETAUTOHIDEBAR,
                ABM_SETAUTOHIDEBAR,
                ABM_WINDOWPOSCHANGED,
                ABM_SETSTATE
            }

            private enum ABNotify : int
            {
                ABN_STATECHANGE = 0,
                ABN_POSCHANGED,
                ABN_FULLSCREENAPP,
                ABN_WINDOWARRANGE
            }

            [DllImport("SHELL32", CallingConvention = CallingConvention.StdCall)]
            private static extern uint SHAppBarMessage(int dwMessage, ref APPBARDATA pData);

            [DllImport("User32.dll", CharSet = CharSet.Auto)]
            private static extern int RegisterWindowMessage(string msg);
        }
    }
}
```

---

**参考资料**

- [c# - How do you do AppBar docking (to screen edge, like WinAmp) in WPF? - Stack Overflow](https://stackoverflow.com/a/84987/6233938)
- [mgaffigan/WpfAppBar: AppBar implementation for WPF](https://github.com/mgaffigan/WpfAppBar)
- [.net - How to dock an application in the Windows desktop? - Stack Overflow](https://stackoverflow.com/a/2792047/6233938)
- [AppBar using C# - CodeProject](https://www.codeproject.com/Articles/6741/AppBar-using-C)
- [SHAppBarMessage function (shellapi.h) - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/api/shellapi/nf-shellapi-shappbarmessage)
- [RegisterWindowMessageA function (winuser.h) - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/api/winuser/nf-winuser-registerwindowmessagea)
