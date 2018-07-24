---
title: ".NET/C# 使窗口永不获得焦点"
date: 2018-07-24 14:19:56 +0800
categories: windows dotnet csharp
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

于是，我们将完整的窗口代码写完，是下面这样：

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
            SetWindowLong(handle, GWL_EXSTYLE, exstyle | WS_EX_NOACTIVATE);
        }

        private const int WS_EX_NOACTIVATE = 0x08000000;
        private const int GWL_EXSTYLE = -20;

        [DllImport("user32.dll", EntryPoint="GetWindowLong")]
        private static extern int GetWindowLong(IntPtr hWnd, int nIndex);

        [DllImport("user32.dll", EntryPoint = "SetWindowLong")]
        private static extern int SetWindowLong(IntPtr hWnd, int nIndex, int dwNewLong);
    }
}
```

运行这段代码，可以发现，即时我们的窗口中文本框获得了焦点，焦点其实依然在外面的程序中。（我们的文本框依然不会响应键盘输入的。）

![No Activate](/static/posts/2018-07-24-no-activate.gif)

---

#### 参考资料

- [c# - Not take focus, but allow interaction? - Stack Overflow](https://stackoverflow.com/questions/6804251/not-take-focus-but-allow-interaction)
