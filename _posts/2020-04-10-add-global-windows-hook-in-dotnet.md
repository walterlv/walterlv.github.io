---
title: ".NET/C# 使用 SetWindowsHookEx 监听鼠标或键盘消息以及此方法的坑"
date: 2020-04-10 17:01:18 +0800
categories: windows dotnet csharp
position: knowledge
---

一般来说，大家在需要监听全局消息的时候会考虑 `SetWindowsHookEx` 这个 API。或者需要处理一些非自己编写的窗口的消息循环的时候，也会考虑使用它。

如果要知道如何使用这个 API，你可以在网上搜到大量这样的文章/博客/教程/文档，然而大多不会提及使用此 API 时遇到的一些坑。阅读本文，你当然也可以知道应该如何使用这个 API，但同时也能了解如何正确使用以避免一些奇怪的问题。

---

<div id="toc"></div>

## 基本使用

简单一点，先贴出一部分可以工作起来的代码，你直接可以放到你的项目当中运行测试：

```csharp
public partial class MainWindow : Window
{
    private readonly HookProc _mouseHook;
    private IntPtr _hMouseHook;

    public MainWindow()
    {
        InitializeComponent();
        _mouseHook = OnMouseHook;
        Loaded += OnLoaded;
    }

    private void OnLoaded(object sender, RoutedEventArgs e)
    {
        // 下面代码在 .NET Core 3.x 以上可正常工作，在 .NET Framework 4.0 以下可正常工作。
        // 如果不满足此条件，你也可能可以正常工作，详情请阅读本文后续内容。
        var hModule = Marshal.GetHINSTANCE(Assembly.GetExecutingAssembly().GetModules()[0]);
        _hMouseHook = SetWindowsHookEx(
            HookType.WH_MOUSE_LL,
            mouseHook,
            hModule,
            0);
        if (_hMouseHook == IntPtr.Zero)
        {
            int errorCode = Marshal.GetLastWin32Error();
            throw new Win32Exception(errorCode);
        }
    }

    private IntPtr OnMouseHook(int nCode, IntPtr wParam, IntPtr lParam)
    {
        // 在这里，你可以处理全局鼠标消息。
        return CallNextHookEx(new IntPtr(0), nCode, wParam, lParam);
    }
}
```

本文讨论使用 .NET/C# 来完成 `SetWindowsHookEx` 的调用，所以自然少不了 P/Invoke（平台调用）。因此你必须将以下代码也添加到你的代码仓库中：

```csharp
[DllImport("kernel32", SetLastError = true)]
static extern IntPtr LoadLibrary(string lpFileName);

[DllImport("user32.dll")]
static extern uint GetWindowThreadProcessId(IntPtr hWnd, out uint lpdwProcessId);

[DllImport("user32.dll", SetLastError = true)]
static extern IntPtr SetWindowsHookEx(HookType hookType, HookProc lpfn, IntPtr hMod, uint dwThreadId);

[DllImport("user32.dll")]
static extern IntPtr CallNextHookEx(IntPtr hhk, int nCode, IntPtr wParam, IntPtr lParam);

private delegate IntPtr HookProc(int nCode, IntPtr wParam, IntPtr lParam);

public enum HookType : int
{
    WH_JOURNALRECORD = 0,
    WH_JOURNALPLAYBACK = 1,
    WH_KEYBOARD = 2,
    WH_GETMESSAGE = 3,
    WH_CALLWNDPROC = 4,
    WH_CBT = 5,
    WH_SYSMSGFILTER = 6,
    WH_MOUSE = 7,
    WH_HARDWARE = 8,
    WH_DEBUG = 9,
    WH_SHELL = 10,
    WH_FOREGROUNDIDLE = 11,
    WH_CALLWNDPROCRET = 12,
    WH_KEYBOARD_LL = 13,
    WH_MOUSE_LL = 14
}
```

## SetWindowsHookEx

`SetWindowsHookEx` 的签名如下：

```csharp
HHOOK SetWindowsHookExA(
  int       idHook,
  HOOKPROC  lpfn,
  HINSTANCE hmod,
  DWORD     dwThreadId
);
```

- 当方法执行成功时，返回值是钩子处理函数的句柄，用于在钩子的消息处理中调用 `CallNextHookEx` 方法。当方法执行失败时，这里返回 `0`。
- idHood 参数表示需要处理的消息类型（我们前面定义成了枚举类型 `HookType`）
- lpfn 是自己定义的钩子的消息处理方法（对应我们前面定义的委托）
- hmod 是模块的句柄，在本机代码中，对应 dll 的句柄（可在 dll 的入口函数中获取）；而我们是托管代码
- dwThreadId 是线程 Id，传入 0 则为全局所有线程，否则传入特定的线程 Id

## 需要注意的坑

### 模块句柄传什么？

本文一开始的代码中，我使用 `Marshal` 直接从托管程序集中获取了模块句柄，然后传入：

```csharp
var hModule = Marshal.GetHINSTANCE(Assembly.GetExecutingAssembly().GetModules()[0]);
```

实际上，`SetWindowsHookEx` 方法里面根本没有使用这个模块做什么真正的事情，它只是验证一下一个模块而已。只要存在。

所以，传入其他的模块都是可以的：

```csharp
var hModule = LoadLibrary("user32.dll");
```

这也是一开始我在 P/Invoke 的方法里面预留了一个 `LoadLibrary` 方法的原因。

至于为什么是 user32.dll。嗯，反正我们创建窗口监听消息都已经大量调用 user32.dll 的 API 了，这 dll 肯定已经加入到我们的进程中了，所以我们把这个传入到参数中是可以通过验证的。

### 错误 126：找不到指定的模块。

> The specified module could not be found.

如果你只是拿代码做做 demo 可能一切顺利，但放到实际项目里面就挂得一塌糊涂：

![找不到指定的模块](/static/posts/2020-04-10-15-46-43.png)

这也是我在一开始的 P/Invoke 里面加上了 `SetLassError` 的重要原因，因为这 API 容易挂。

检查的错误码是 126（0x0000007E）。

然而我的 dll 是存在的呀！

让我们再来看我一开始预留的注释：

```csharp
// 下面代码在 .NET Core 3.x 以上可正常工作，在 .NET Framework 4.0 以下可正常工作。
// 如果不满足此条件，你也可能可以正常工作，详情请阅读本文后续内容。
var hModule = Marshal.GetHINSTANCE(Assembly.GetExecutingAssembly().GetModules()[0]);
```

是的，你遇到这样的异常，多半意味着你落入 .NET Framework 4.x 版本的运行时了。

.NET Framework 4.0 相比于之前的 CLR 发生了很大的更改，不再假装 JIT 代码存在一非托管模块中，因此 `Marshal.GetHINSTANCE` 将不再起作用。

对于低级钩子来说，`SetWindowsHookEx` 需要一个有效的模块句柄进行检查，但实际上此 API 执行时根本没有使用这个模块。所以更推荐使用前一小节中提供的 `LoadLibrary` 函数来获取模块句柄，而不是获取当前托管模块的句柄。

解决方法，两/三个：

1. 方法一：使用 `LoadLibrary("user32.dll")` 获取模块句柄代替 `Marshal.GetHINSTANCE`
2. 方法二：将获取句柄的模块改为入口程序集（exe），即 `Assembly.GetEntryAssembly()`。
3. 方法三：升级成纯 .NET Core 程序

### 如何只处理特定窗口的消息？

消息循环属于“线程”，而不是属于某个窗口或者进程。在 `CreateWindowEx` 创建窗口时传入的消息处理函数会仅处理特定窗口的消息，然而当通过钩子的方式来处理消息的话，无法精确定位到某个特定的窗口，只能针对消息循环所在的线程。因此，要处理特定窗口的消息，只能先拿到此窗口所在的线程。

前面的 P/Invoke 中我也预留了获取窗口所在线程的方法。因此，可以直接使用以下调用来获取 `hWnd` 句柄窗口所在的线程。

```csharp
var threadId = GetWindowThreadProcessId(hWnd, out _);
```

本来在 `SetWindowsHookEx` 最后一个参数传入 0 表示全局钩子的，那么现在传入 `threadId` 即仅监听此线程的消息。

### 错误 1429：此挂接程序只可整体设置。

> This hook procedure can only be set globally.

估计找到这里的方式可能是搜索，因为这段中文读起来真的是太晦涩了。不过我把英文贴到上一行了，相信你差不多就知道是怎么回事了。

因为你给 `SetWindowsHookEx` 方法中传入的 `HookType` 参数指定了低级类型（Low Level，`HookType` 枚举后面带了 LL 后缀的），这时只能全局设置钩子。意味着你的第四个参数必须传入 `0`。

---

**参考资料**

- [SetWindowsHookExA function (winuser.h) - Win32 apps - Microsoft Docs](https://docs.microsoft.com/zh-cn/windows/win32/api/winuser/nf-winuser-setwindowshookexa)
- [Processing Global Mouse and Keyboard Hooks in C# - CodeProject](https://www.codeproject.com/Articles/7294/Processing-Global-Mouse-and-Keyboard-Hooks-in-C)
- [c# - SetWindowsHookEx fails with error 126 - Stack Overflow](https://stackoverflow.com/questions/17897646/setwindowshookex-fails-with-error-126)
- [winapi - How to pass window handle to wndproc? - Stack Overflow](https://stackoverflow.com/questions/9971175/how-to-pass-window-handle-to-wndproc)
- [.net - Example of hooking a window? - Stack Overflow](https://stackoverflow.com/questions/6872044/example-of-hooking-a-window)
