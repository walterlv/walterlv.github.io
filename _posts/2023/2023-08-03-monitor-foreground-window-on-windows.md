---
title: "如何在控制台程序中监听 Windows 前台窗口的变化"
date: 2023-08-03 11:02:53 +0800
categories: dotnet csharp windows
position: knowledge
coverImage: /static/posts/2023-08-03-10-54-17.png
---

前一段时间总会时不时发现当前正在打字的窗口突然失去了焦点，于是很希望有个工具能实时监听前台窗口的变化，并实时输出出来。

本文会介绍两类知识，一类是如何在 .NET/C# 程序中方便地调用 Win32 API，另一类是在控制台程序中开启 Windows 消息循环。

---

<div id="toc"></div>

![监听前台窗口变化的运行效果](/static/posts/2023-08-03-10-54-17.png)

## 思路

获取当前前台窗口的本质 API 调用是 [GetForegroundWindow](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getforegroundwindow)。在拿到前台窗口的句柄后，进而获取到例如窗口标题、类名等信息。

```csharp
var hWnd = GetForegroundWindow();
// 随后获取窗口标题、类名等……
```

接下来，就是什么时机去调用这个 API 了。

虽然我第一时间想到了延时轮询的方式，并且好久以前也确实是这么写的。但其实有更好的方法来解决这个问题，而且 Lsj 的 [Window Debugger](https://gitlab.sdlsj.net/lsj/windowdebugger/-/tags) 也正计划实现这个功能，对此也有更多的了解。

是的，我们有 [SetWinEventHook](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setwineventhook) 这个 Win32 API，如果参数传入 [EVENT_SYSTEM_FOREGROUND](https://learn.microsoft.com/en-us/windows/win32/winauto/event-constants) 就可以实现监听前台窗口的变化。

## 实施

### 基本框架代码

于是，我们控制台程序中最关键的框架代码如下：

```csharp
// 监听系统的前台窗口变化。
SetWinEventHook(
    EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_FOREGROUND,
    HMODULE.Null, WinEventProc,
    0, 0,
    WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS);

// 开启消息循环，以便 WinEventProc 能够被调用。
if (GetMessage(out var lpMsg, default, default, default))
{
    TranslateMessage(in lpMsg);
    DispatchMessage(in lpMsg);
}

// 当前前台窗口变化时，输出新的前台窗口信息。
void WinEventProc(HWINEVENTHOOK hWinEventHook, uint @event, HWND hwnd, int idObject, int idChild, uint idEventThread, uint dwmsEventTime)
{
    var current = GetForegroundWindow();
    // 随后获取窗口标题、类名等……
}
```

解释：

1. 调用 `SetWinEventHook` 时，前两个参数都传入 `EVENT_SYSTEM_FOREGROUND`
    - 第一个参数是最小事件值，第二个参数是最大事件值，这里我们只监听前台窗口变化，所以两个参数都传入 `EVENT_SYSTEM_FOREGROUND`
2. 由于我们是控制台程序，没有窗口，所以第三个参数传入 `HMODULE.Null`，第 5、6 个参数传入 0
3. 最后一个参数，我们传入了 `WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS`
    - `WINEVENT_OUTOFCONTEXT` 表示事件函数将在其他进程的上下文中执行，这意味着该事件钩子函数可以捕获其他进程中发生的事件
    - `WINEVENT_SKIPOWNPROCESS` 表示忽略进程自身发生的事件（当然，我们是控制台程序，没有窗口，所以这个传不传没有区别）
4. 随后，我们开启了消息循环，以便 `WinEventProc` 能够被调用
    - `GetMessage` 会阻塞当前线程，直到有消息到达
    - `DispatchMessage` 会将消息传递给 `WinEventProc`，这样 `WinEventProc` 才会被调用

### P/Invoke

这里，我使用的是 [microsoft/CsWin32](https://github.com/microsoft/CsWin32)，因为我只会用到少数几个 Win32 函数，不希望引入庞大的 P/Invoke 相关的库。

首先安装 `Microsoft.Windows.CsWin32` NuGet 包：

```xml
<ItemGroup>
  <PackageReference Include="Microsoft.Windows.CsWin32" Version="0.3.18-beta" PrivateAssets="all" />
</ItemGroup>
```

随后，在项目中添加文件 NativeMethods.txt，内容如下。这些是我们刚刚已经用的以及即将使用的 Win32 函数和常量。

```txt
DispatchMessage
GetClassName
GetForegroundWindow
GetMessage
GetProcessImageFileName
GetWindowText
GetWindowThreadProcessId
SetWinEventHook
TranslateMessage
EVENT_SYSTEM_FOREGROUND
WINEVENT_OUTOFCONTEXT
WINEVENT_SKIPOWNPROCESS
```

随后，在 Program.cs 的开头添加几个 `using`：

```csharp
using Windows.Win32.Foundation;
using Windows.Win32.UI.Accessibility;

using static Windows.Win32.PInvoke;
```

这样，前面我们的框架代码便能正常编译和使用了。

### 获取窗口的各种信息

为了让 Program.cs 中的代码更简洁一些，我们创建一个 `Win32Window` 类，用来辅助我们获取特定窗口的各种信息。

```csharp
using System.Buffers;
using System.Diagnostics;

using Windows.Win32.Foundation;

using static Windows.Win32.PInvoke;

namespace Walterlv.ForegroundWindowMonitor;
public class Win32Window
{
    private readonly HWND _hWnd;
    private string? _className;
    private string? _title;
    private string? _processName;
    private uint _pid;

    internal Win32Window(nint handle)
    {
        _hWnd = (HWND)handle;
    }

    public nint Handle => _hWnd;

    public string ClassName => _className ??= CallWin32ToGetPWSTR(512, (p, l) => GetClassName(_hWnd, p, l));

    public string Title => _title ??= CallWin32ToGetPWSTR(512, (p, l) => GetWindowText(_hWnd, p, l));

    public uint ProcessId => _pid is 0 ? (_pid = GetProcessIdCore()) : _pid;

    public string ProcessName => _processName ??= Process.GetProcessById((int)ProcessId).ProcessName;

    private unsafe uint GetProcessIdCore()
    {
        uint pid = 0;
        GetWindowThreadProcessId(_hWnd, &pid);
        return pid;
    }

    private unsafe string CallWin32ToGetPWSTR(int bufferLength, Func<PWSTR, int, int> getter)
    {
        var buffer = ArrayPool<char>.Shared.Rent(bufferLength);
        try
        {
            fixed (char* ptr = buffer)
            {
                getter(ptr, bufferLength);
                return new string(ptr);
            }
        }
        finally
        {
            ArrayPool<char>.Shared.Return(buffer);
        }
    }
}
```

于是，回到 Program.cs 中的 `WinEventProc` 方法内部，我们就可以输出窗口的各种信息了：

```csharp
void WinEventProc(HWINEVENTHOOK hWinEventHook, uint @event, HWND hwnd, int idObject, int idChild, uint idEventThread, uint dwmsEventTime)
{
    var current = GetForegroundWindow();

    var w = new Win32Window(current);
    // 你也可以获得更多你想获得的信息，这里我只是举例输出了几个而已。
    var rowText = $"[{w.Handle}] {w.Title} - {w.ProcessName}";

    Console.WriteLine(rowText);
}
```

### 完整代码

Program.cs 的完整代码如下：

```csharp
using Windows.Win32.Foundation;
using Windows.Win32.UI.Accessibility;

using static Windows.Win32.PInvoke;

// 监听系统的前台窗口变化。
SetWinEventHook(
    EVENT_SYSTEM_FOREGROUND, EVENT_SYSTEM_FOREGROUND,
    HMODULE.Null, WinEventProc,
    0, 0,
    WINEVENT_OUTOFCONTEXT | WINEVENT_SKIPOWNPROCESS);

// 开启消息循环，以便 WinEventProc 能够被调用。
if (GetMessage(out var lpMsg, default, default, default))
{
    TranslateMessage(in lpMsg);
    DispatchMessage(in lpMsg);
}

// 当前前台窗口变化时，输出新的前台窗口信息。
void WinEventProc(HWINEVENTHOOK hWinEventHook, uint @event, HWND hwnd, int idObject, int idChild, uint idEventThread, uint dwmsEventTime)
{
    var current = GetForegroundWindow();

    var w = new Win32Window(current);
    // 你也可以获得更多你想获得的信息，这里我只是举例输出了几个而已。
    var rowText = $"[{w.Handle}] {w.Title} - {w.ProcessName}";

    Console.WriteLine(rowText);
}
```

如果更多地优化一下输出的格式，那么就可以得到下面的效果：

![监听前台窗口变化的运行效果](/static/posts/2023-08-03-10-54-17.png)

关于如何在控制台中输出表格（并实现中英文字符对齐显示），可以阅读我后面要写的另一篇博客。

### 开源项目

本文的代码已经开源在 GitHub 上，感兴趣可以去项目中阅读更新的代码：

- <https://github.com/walterlv/Walterlv.ForegroundWindowMonitor>

---

**参考资料**

- [dotnet 使用 CsWin32 库简化 Win32 函数调用逻辑](https://blog.lindexi.com/post/dotnet-%E4%BD%BF%E7%94%A8-CsWin32-%E5%BA%93%E7%AE%80%E5%8C%96-Win32-%E5%87%BD%E6%95%B0%E8%B0%83%E7%94%A8%E9%80%BB%E8%BE%91.html)
- [GetForegroundWindow function (winuser.h) - Win32 apps - Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getforegroundwindow)
- [microsoft/CsWin32: A source generator to add a user-defined set of Win32 P/Invoke methods and supporting types to a C# project.](https://github.com/microsoft/CsWin32)

