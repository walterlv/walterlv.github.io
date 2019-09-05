---
title: ".NET/C# 阻止屏幕关闭，阻止系统进入睡眠状态"
date: 2019-09-05 14:43:33 +0800
categories: dotnet csharp windows
position: knowledge
---

在 Windows 系统中，一段时间不操作键盘和鼠标，屏幕便会关闭，系统会进入睡眠状态。但有些程序（比如游戏、视频和演示文稿）在运行过程中应该阻止屏幕关闭，否则屏幕总是关闭，会导致体验会非常糟糕。

本文介绍如何编写 .NET/C# 代码临时阻止屏幕关闭以及系统进入睡眠状态。

---

<div id="toc"></div>

## Windows API

我们需要使用到一个 Windows API：

```csharp
/// <summary>
/// Enables an application to inform the system that it is in use, thereby preventing the system from entering sleep or turning off the display while the application is running.
/// </summary>
[DllImport("kernel32")]
private static extern ExecutionState SetThreadExecutionState(ExecutionState esFlags);
```

使用到的枚举用 C# 类型定义是：

```csharp
[Flags]
private enum ExecutionState : uint
{
    /// <summary>
    /// Forces the system to be in the working state by resetting the system idle timer.
    /// </summary>
    SystemRequired = 0x01,

    /// <summary>
    /// Forces the display to be on by resetting the display idle timer.
    /// </summary>
    DisplayRequired = 0x02,

    /// <summary>
    /// This value is not supported. If <see cref="UserPresent"/> is combined with other esFlags values, the call will fail and none of the specified states will be set.
    /// </summary>
    [Obsolete("This value is not supported.")]
    UserPresent = 0x04,

    /// <summary>
    /// Enables away mode. This value must be specified with <see cref="Continuous"/>.
    /// <para />
    /// Away mode should be used only by media-recording and media-distribution applications that must perform critical background processing on desktop computers while the computer appears to be sleeping.
    /// </summary>
    AwaymodeRequired = 0x40,

    /// <summary>
    /// Informs the system that the state being set should remain in effect until the next call that uses <see cref="Continuous"/> and one of the other state flags is cleared.
    /// </summary>
    Continuous = 0x80000000,
}
```

以上所有的注释均照抄自微软的官方 API 文档：

- [SetThreadExecutionState function (winbase.h) - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setthreadexecutionstate)

## API 封装

如果你擅长阅读英文，那么以上的 API 函数、枚举和注释足够你完成你的任务了。

不过，我这里提供一些封装，以应对一些常用的场景。

```csharp
using System;
using System.Runtime.InteropServices;

namespace Walterlv.Windows
{
    /// <summary>
    /// 包含控制屏幕关闭以及系统休眠相关的方法。
    /// </summary>
    public static class SystemSleep
    {
        /// <summary>
        /// 设置此线程此时开始一直将处于运行状态，此时计算机不应该进入睡眠状态。
        /// 此线程退出后，设置将失效。
        /// 如果需要恢复，请调用 <see cref="RestoreForCurrentThread"/> 方法。
        /// </summary>
        /// <param name="keepDisplayOn">
        /// 表示是否应该同时保持屏幕不关闭。
        /// 对于游戏、视频和演示相关的任务需要保持屏幕不关闭；而对于后台服务、下载和监控等任务则不需要。
        /// </param>
        public static void PreventForCurrentThread(bool keepDisplayOn = true)
        {
            SetThreadExecutionState(keepDisplayOn
                ? ExecutionState.Continuous | ExecutionState.SystemRequired | ExecutionState.DisplayRequired
                : ExecutionState.Continuous | ExecutionState.SystemRequired);
        }

        /// <summary>
        /// 恢复此线程的运行状态，操作系统现在可以正常进入睡眠状态和关闭屏幕。
        /// </summary>
        public static void RestoreForCurrentThread()
        {
            SetThreadExecutionState(ExecutionState.Continuous);
        }

        /// <summary>
        /// 重置系统睡眠或者关闭屏幕的计时器，这样系统睡眠或者屏幕能够继续持续工作设定的超时时间。
        /// </summary>
        /// <param name="keepDisplayOn">
        /// 表示是否应该同时保持屏幕不关闭。
        /// 对于游戏、视频和演示相关的任务需要保持屏幕不关闭；而对于后台服务、下载和监控等任务则不需要。
        /// </param>
        public static void ResetIdle(bool keepDisplayOn = true)
        {
            SetThreadExecutionState(keepDisplayOn
                ? ExecutionState.SystemRequired | ExecutionState.DisplayRequired
                : ExecutionState.SystemRequired);
        }
    }
}
```

此封装后，使用则相当简单：

```csharp
// 阻止系统睡眠，阻止屏幕关闭。
SystemSleep.PreventForCurrentThread();

// 恢复此线程曾经阻止的系统休眠和屏幕关闭。
SystemSleep.RestoreForCurrentThread();
```

或者：

```csharp
// 重置系统计时器，临时性阻止系统睡眠和屏幕关闭。
// 此效果类似于手动使用鼠标或键盘控制了一下电脑。
SystemSleep.ResetIdle();
```

在使用 `PreventForCurrentThread` 这个 API 的时候，你需要避免程序对空闲时机的控制不好，导致屏幕始终不关闭。

如果你发现无论你设置了多么短的睡眠时间和屏幕关闭时间，屏幕都不会关闭，那就是有某个程序阻止了屏幕关闭，你可以：

- [查看有哪些程序会一直保持屏幕处于打开状态](/post/find-out-the-reason-that-wakes-the-pc-up.html)
- [找到是谁持续唤醒了计算机屏幕](/post/find-out-the-reason-that-wakes-the-pc-up.html)

---

**参考资料**

- [SetThreadExecutionState function (winbase.h) - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-setthreadexecutionstate)
