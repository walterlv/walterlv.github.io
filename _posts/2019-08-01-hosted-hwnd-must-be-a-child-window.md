---
title: "System.InvalidOperationException:“寄宿 HWND 必须是子窗口。”"
date: 2019-08-01 18:45:38 +0800
categories: wpf windows dotnet csharp
position: problem
---

当试图在 WPF 窗口中嵌套显示 Win32 子窗口的时候，你有可能出现错误：“`System.InvalidOperationException:“寄宿 HWND 必须是子窗口。”`”。

这是很典型的 Win32 错误，本文介绍如何修复此错误。

---

<div id="toc"></div>

## 一个最简的嵌入其他窗口的例子

我们在 `MainWindow` 中嵌入一个其他的窗口来承载新的 WPF 控件。一般情况下我们当然不会这么去做，但是如果我们要跨越进程边界来完成 WPF 渲染内容的融合的时候，就需要嵌入一个新的窗口了。

WPF 中可以使用 `HwndSource` 来包装一个 WPF 控件到 Win32 窗口，使用自定义的继承自 `HwndHost` 的类可以把 Win32 窗口包装成 WPF 控件。由于窗口句柄是可以跨越进程边界传递的，所以这样的方式可以完成跨进程的 WPF 控件显示。

下面是最简单的一个例子，为了简单，没有跨进程传递 Win32 窗口句柄，而是直接创建出来。

```csharp
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;

namespace Walterlv.Demo.HwndWrapping
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            Loaded += OnLoaded;
        }

        private void OnLoaded(object sender, RoutedEventArgs e)
        {
            Content = new HwndWrapper();
        }
    }

    public class HwndWrapper : HwndHost
    {
        private HwndSource _source;

        protected override HandleRef BuildWindowCore(HandleRef hwndParent)
        {
            var parameters = new HwndSourceParameters("walterlv");
            _source = new HwndSource(parameters);
            // 这里的 ChildPage 是一个继承自 UseControl 的 WPF 控件，你可以自己创建自己的 WPF 控件。
            _source.RootVisual = new ChildPage();
            return new HandleRef(this, _source.Handle);
        }

        protected override void DestroyWindowCore(HandleRef hwnd)
        {
            _source?.Dispose();
        }
    }
}
```

## 寄宿 HWND 必须是子窗口

当运行此代码的时候，会提示错误：

> System.InvalidOperationException:“寄宿 HWND 必须是子窗口。”

或者英文版：

> System.InvalidOperationException:"Hosted HWND must be a child window."

这是一个 Win32 错误，因为我们试图将一个普通的窗口嵌入到另一个窗口中，而实际上要完成嵌入需要子窗口才行。

那么如何设置一个 Win32 窗口为子窗口呢？使用 `SetWindowLong` 来设置 Win32 窗口的样式是可以的。不过我们因为使用了 `HwndSource`，所以可以通过 `HwndSourceParameters` 来更方便地设置窗口样式。

我们需要将 `HwndSourceParameters` 那一行改成这样：

```diff
++  const int WS_CHILD = 0x40000000;
--  var parameters = new HwndSourceParameters("walterlv");
++  var parameters = new HwndSourceParameters("walterlv")
++  {
++      ParentWindow = hwndParent.Handle,
++      WindowStyle = WS_CHILD,
++  };
```

最关键的是两点：

1. 需要设置此窗口为子窗口，也就是设置 `WindowStyle` 为 `WS_CHILD`；
1. 需要设置此窗口的父窗口，也就是设置 `ParentWindow` 为 `hwndParent.Handle`（我们使用参数中传入的 `hwndParent` 作为父窗口）。

现在再运行，即可正常显示此嵌套窗口：

![嵌套窗口](/static/posts/2019-08-01-16-52-50.png)

另外，`WindowStyle` 属性最好加上 `WS_CLIPCHILDREN`，详情请阅读：

- [解决 WPF 嵌套的子窗口在改变窗口大小的时候闪烁的问题](/post/window-flickers-on-resizing-if-the-window-contains-a-hwndhost-element.html)

---

**参考资料**

- [WPF嵌入式调用Win32应用程序的问题—提示异常：寄宿的HWND必须是指定父级的子窗口](https://social.microsoft.com/Forums/zh-CN/7090f2a0-9efc-4379-a3a7-585e209a1f54/wpf2388420837243353584329992win3224212299923124324207303403838239?forum=wpfzhchs)
