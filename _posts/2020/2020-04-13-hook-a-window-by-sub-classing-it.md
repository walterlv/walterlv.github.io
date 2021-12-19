---
title: "通过子类化窗口（SubClass）来为现有的某个窗口添加新的窗口处理程序（或者叫钩子，Hook）"
publishDate: 2020-04-13 21:24:48 +0800
date: 2020-04-14 08:19:29 +0800
tags: win32 dotnet csharp
position: knowledge
permalink: /posts/hook-a-window-by-sub-classing-it.html
---

创建窗口的时候，可以传一个消息处理函数。然而如果窗口不是自己创建的，还能增加消息处理函数吗？答案是可以的，除了 `SetWindowsHookEx` 来添加钩子之外，更推荐用子类化的方式来添加。

本文介绍如何通过子类化（SubClass）的方式来为窗口添加额外的消息处理函数。

---

<div id="toc"></div>

## 子类化

子类化的本质是通过 `SetWindowLong` 传入 `GWL_WNDPROC` 参数。

`SetWindowLong` 的 API 如下：

```csharp
LONG SetWindowLongA(
  HWND hWnd,
  int  nIndex,
  LONG dwNewLong
);
```

nIndex 指定为 `GWL_WNDPROC`，在此情况下，后面的 `dwNewLong` 就可以指定为一个函数指针，返回值就是原始的消息处理函数。

对于 .NET/C# 来说，我们需要拿到窗口句柄，拿到一个消息处理函数的指针。

窗口句柄在不同的 UI 框架拿的方法不同，WPF 是通过 `HwndSource` 或者 `WindowInteropHelper` 来拿。而将委托转换成函数指针则可通过 `Marshal.GetFunctionPointerForDelegate` 来转换。

你可别吐槽 WPF 另有它法来加消息处理函数啊！本文说的是 Win32，方法需要具有普适性。特别是那种你只能拿到一个窗口句柄，其他啥也不知道的窗口。

```csharp
var hWnd = new WindowInteropHelper(this).EnsureHandle();
var wndProc = Marshal.GetFunctionPointerForDelegate<WndProc>(OnWndProc);
_originalWndProc = SetWindowLongPtr(hWnd, GWL_WNDPROC, wndProc);

IntPtr OnWndProc(IntPtr hWnd, uint msg, IntPtr wParam, IntPtr lParam)
{
    // 在这里处理消息。
}
```

将完整的代码贴下来，大约是这样：

```csharp
public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        SourceInitialized += MainWindow_SourceInitialized;
    }

    private void MainWindow_SourceInitialized(object sender, EventArgs e)
    {
        var hWnd = new WindowInteropHelper(this).EnsureHandle();
        _wndProc = OnWndProc;
        var wndProc = Marshal.GetFunctionPointerForDelegate<WndProc>(_wndProc);
        _originalWndProc = SetWindowLongPtr(hWnd, GWL_WNDPROC, wndProc);
    }

    private WndProc _wndProc;
    private IntPtr _originalWndProc;

    private IntPtr OnWndProc(IntPtr hWnd, uint msg, IntPtr wParam, IntPtr lParam)
    {
        switch (msg)
        {
            case WM_NCHITTEST:
                return CallWindowProc(_originalWndProc, hWnd, msg, wParam, lParam);
            default:
                return CallWindowProc(_originalWndProc, hWnd, msg, wParam, lParam);
        }
    }
}
```

其中，我将委托存成了一个字段，这样可以避免 GC 回收掉这个委托对象造成崩溃。

在示例的消息处理函数中，我示例处理了一下 `WM_NCHITTEST`（虽然依然什么都没做）。最后，必须调用 `CallWindowProc` 以调用此前原来的那个消息处理函数。

最后，如果你又不希望处理这个消息了，那么使用以下方法注销掉这个委托：

```csharp
// 嗯，没错，就是前面更换消息处理函数时返回的那个指针。
SetWindowLongPtr(hWnd, GWL_WNDPROC, _originalWndProc);
```

上面需要的所有的 P/Invoke 我都贴到了下面，需要的话放到你的代码当中。

```csharp
private static IntPtr SetWindowLongPtr(IntPtr hWnd, int nIndex, IntPtr dwNewLong)
{
    if (IntPtr.Size == 8)
    {
        return SetWindowLongPtr64(hWnd, nIndex, dwNewLong);
    }
    else
    {
        return new IntPtr(SetWindowLong32(hWnd, nIndex, dwNewLong.ToInt32()));
    }
}

[DllImport("user32.dll", EntryPoint = "SetWindowLong")]
private static extern int SetWindowLong32(IntPtr hWnd, int nIndex, int dwNewLong);

[DllImport("user32.dll", EntryPoint = "SetWindowLongPtr")]
private static extern IntPtr SetWindowLongPtr64(IntPtr hWnd, int nIndex, IntPtr dwNewLong);

[DllImport("user32.dll")]
static extern IntPtr CallWindowProc(IntPtr lpPrevWndFunc, IntPtr hWnd, uint Msg, IntPtr wParam, IntPtr lParam);

private delegate IntPtr WndProc(IntPtr hWnd, uint msg, IntPtr wParam, IntPtr lParam);

private const int GWL_WNDPROC = -4;
private const int WM_NCHITTEST = 0x0084;
private const int HTTRANSPARENT = -1;
```

## 其他方法

本文一开始说到了使用 `SetWindowsHookEx` 的方式来添加钩子，具体你可以阅读我的另一篇博客来了解如何实现：

- [.NET/C# 使用 SetWindowsHookEx 监听鼠标或键盘消息以及此方法的坑 - walterlv](/post/add-global-windows-hook-in-dotnet.html)

---

**参考资料**

- [Using Window Procedures - Win32 apps - Microsoft Docs](https://docs.microsoft.com/zh-cn/windows/win32/winmsg/using-window-procedures?redirectedfrom=MSDN#subclassing_window)

