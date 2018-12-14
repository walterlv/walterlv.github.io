---
title: ".NET/C# 使窗口永不激活（No Activate 永不获得焦点）"
publishDate: 2018-07-24 14:19:56 +0800
date: 2018-12-14 09:54:00 +0800
categories: windows dotnet csharp wpf
---

有些窗口天生就是为了辅助其它程序而使用的，典型的如“输入法窗口”。这些窗口不希望抢夺其它窗口的焦点。

有 Win32 方法来解决这样的问题，`WS_EX_NOACTIVATE` 便是关键。

---

具体来说，是给窗口样式中额外添加一个 `WS_EX_NOACTIVATE` 位。

```csharp
var handle = GetTheWindowHandle();
int exstyle = GetWindowLong(handle, GWL_EXSTYLE);
SetWindowLong(handle, GWL_EXSTYLE, exstyle | WS_EX_NOACTIVATE);
```

当然，这里需要用到 P/Invoke 平台调用，可以阅读 [使用 PInvoke.net Visual Studio Extension 辅助编写 Win32 函数签名](/post/pinvoke-net-visual-studio-extension.html) 了解快速生成平台调用方法签名的方法。

于是，我们将完整的窗口代码写完，是下面这样。

注意 64 位系统中需调用 `GetWindowLongPtr` 和 `SetWindowLongPtr`，而 32 位系统中是没有这两个方法的；在任何版本的 Windows 中都是这样。当然，64 位系统会为其上运行的 32 位进程模拟 32 位系统的环境。

```csharp
using System;
using System.Runtime.InteropServices;
using System.Windows;
using System.Windows.Interop;

namespace Walterlv.Demo
{
    public partial class MainWindow : Window
    {
        public MainWindow()
        {
            InitializeComponent();
            SourceInitialized += OnSourceInitialized;
        }
        
        private void OnSourceInitialized(object sender, EventArgs e)
        {
            var handle = new WindowInteropHelper(this).Handle;
            var exstyle = GetWindowLong(handle, GWL_EXSTYLE);
            SetWindowLong(handle, GWL_EXSTYLE, new IntPtr(exstyle.ToInt32() | WS_EX_NOACTIVATE));
        }

        #region Native Methods

        private const int WS_EX_NOACTIVATE = 0x08000000;
        private const int GWL_EXSTYLE = -20;

        public static IntPtr GetWindowLong(IntPtr hWnd, int nIndex)
        {
            return Environment.Is64BitProcess
                ? GetWindowLong64(hWnd, nIndex)
                : GetWindowLong32(hWnd, nIndex);
        }

        public static IntPtr SetWindowLong(IntPtr hWnd, int nIndex, IntPtr dwNewLong)
        {
            return Environment.Is64BitProcess
                ? SetWindowLong64(hWnd, nIndex, dwNewLong)
                : SetWindowLong32(hWnd, nIndex, dwNewLong);
        }

        [DllImport("user32.dll", EntryPoint = "GetWindowLong")]
        private static extern IntPtr GetWindowLong32(IntPtr hWnd, int nIndex);

        [DllImport("user32.dll", EntryPoint = "GetWindowLongPtr")]
        private static extern IntPtr GetWindowLong64(IntPtr hWnd, int nIndex);

        [DllImport("user32.dll", EntryPoint = "SetWindowLong")]
        private static extern IntPtr SetWindowLong32(IntPtr hWnd, int nIndex, IntPtr dwNewLong);

        [DllImport("user32.dll", EntryPoint = "SetWindowLongPtr")]
        private static extern IntPtr SetWindowLong64(IntPtr hWnd, int nIndex, IntPtr dwNewLong);

        #endregion
    }
}
```

运行这段代码，可以发现，即时我们的窗口中文本框获得了焦点，焦点其实依然在外面的程序中。（我们的文本框依然不会响应键盘输入的。）

![No Activate](/static/posts/2018-07-24-no-activate.gif)

---

#### 参考资料

- [c# - Not take focus, but allow interaction? - Stack Overflow](https://stackoverflow.com/q/6804251/6233938)
- [Extended Window Styles - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/winmsg/extended-window-styles?wt.mc_id=MVP)
- [GetWindowLongPtr function (Windows)](https://msdn.microsoft.com/en-us/library/windows/desktop/ms633585%28v=vs.85%29.aspx)
- [SetWindowLongPtr function (Windows)](https://msdn.microsoft.com/en-us/library/windows/desktop/ms644898(v=vs.85).aspx)
