---
title: "如何在 .NET/C# 代码中安全地结束掉一个控制台应用程序？通过发送 Ctrl+C 信号来结束"
date: 2019-12-26 14:16:11 +0800
tags: dotnet csharp
position: knowledge
coverImage: /static/posts/2019-12-26-14-04-19.png
permalink: /posts/shutdown-a-console-program-safely-using-ctrl-c.html
---

我的电脑上每天会跑一大堆控制台程序，于是管理这些程序的运行就成了一个问题。或者说你可能也在考虑启动一个控制台程序来完成某些特定的任务。

如果我们需要结束掉这个控制台程序怎么做呢？直接杀进程吗？这样很容易出问题。我正在使用的一个控制台程序会写文件，如果直接杀进程可能导致数据没能写入到文件。所以本文介绍如何使用 .NET/C# 代码向控制台程序发送 `Ctrl+C` 来安全地结束掉程序。

---

<div id="toc"></div>

## 用 Ctrl+C 结束控制台程序

如果直接用 `Process.Kill` 杀掉进程，进程可能来不及保存数据。所以无论是窗口程序还是控制台程序，最好都让控制台程序自己去关闭。

![Process.Kill 结束控制台程序](/static/posts/2019-12-26-14-04-19.png)

▲ 使用 `Process.Kill` 结束程序，程序退出代码是 -1

![Ctrl+C 结束控制台程序](/static/posts/2019-12-26-14-02-15.png)

▲ 使用 `Ctrl+C` 结束程序，程序退出代码是 0

## Ctrl+C 信号

Windows API 提供了方法可以将当前进程与目标控制台进程关联起来，这样我们便可以向自己发送 `Ctrl+C` 信号来结束掉关联的另一个控制台进程。

关联和取消关联的方法是下面这两个，`AttachConsole` 和 `FreeConsole`：

```csharp
[DllImport("kernel32.dll")]
private static extern bool AttachConsole(uint dwProcessId);

[DllImport("kernel32.dll")]
private static extern bool FreeConsole();
```

不过，当发送 `Ctrl+C` 信号的时候，不止我们希望关闭的控制台程序退出了，我们自己程序也是会退出的（即便我们自己是一个 GUI 程序）。所以我们必须先组织自己响应 `Ctrl+C` 信号。

需要用到另外一个 API：

```csharp
[DllImport("kernel32.dll")]
private static extern bool SetConsoleCtrlHandler(ConsoleCtrlDelegate? HandlerRoutine, bool Add);

enum CtrlTypes : uint
{
    CTRL_C_EVENT = 0,
    CTRL_BREAK_EVENT,
    CTRL_CLOSE_EVENT,
    CTRL_LOGOFF_EVENT = 5,
    CTRL_SHUTDOWN_EVENT
}

private delegate bool ConsoleCtrlDelegate(CtrlTypes CtrlType);
```

不过，因为我们实际上并不需要真的对 `Ctrl+C` 进行响应，只是单纯临时禁用以下，所以我们归这个委托传入 `null` 就好了。

最后，也是最关键的，就是发送 `Ctrl+C` 信号了：

```csharp
[DllImport("kernel32.dll")]
[return: MarshalAs(UnmanagedType.Bool)]
private static extern bool GenerateConsoleCtrlEvent(CtrlTypes dwCtrlEvent, uint dwProcessGroupId);
```

下面，我将完整的代码贴出来。

## 全部源代码

```csharp
using System;
using System.Diagnostics;
using System.Runtime.InteropServices;

namespace Walterlv.Fracture.Utils
{
    /// <summary>
    /// 提供与控制台程序的交互。
    /// </summary>
    public class ConsoleInterop
    {
        /// <summary>
        /// 关闭控制台程序。
        /// </summary>
        /// <param name="process">要关闭的控制台程序的进程实例。</param>
        /// <param name="timeoutInMilliseconds">如果不希望一直等待进程自己退出，则可以在此参数中设置超时。你可以在超时未推出候采取强制杀掉进程的策略。</param>
        /// <returns>如果进程成功退出，则返回 true；否则返回 false。</returns>
        public static bool StopConsoleProgram(Process process, int? timeoutInMilliseconds = null)
        {
            if (process is null)
            {
                throw new ArgumentNullException(nameof(process));
            }

            if (process.HasExited)
            {
                return true;
            }

            // 尝试将我们自己的进程附加到指定进程的控制台（如果有的话）。
            if (AttachConsole((uint)process.Id))
            {
                // 我们自己的进程需要忽略掉 Ctrl+C 信号，否则自己也会退出。
                SetConsoleCtrlHandler(null, true);

                // 将 Ctrl+C 信号发送到前面已关联（附加）的控制台进程中。
                GenerateConsoleCtrlEvent(CtrlTypes.CTRL_C_EVENT, 0);

                // 拾前面已经附加的控制台。
                FreeConsole();

                bool hasExited;
                // 由于 Ctrl+C 信号只是通知程序关闭，并不一定真的关闭。所以我们等待一定时间，如果仍未关闭，则超时不处理。
                // 业务可以通过判断返回值来角是否进行后续处理（例如强制杀掉）。
                if (timeoutInMilliseconds == null)
                {
                    // 如果没有超时处理，则一直等待，直到最终进程停止。
                    process.WaitForExit();
                    hasExited = true;
                }
                else
                {
                    // 如果有超时处理，则超时候返回。
                    hasExited = process.WaitForExit(timeoutInMilliseconds.Value);
                }

                // 重新恢复我们自己的进程对 Ctrl+C 信号的响应。
                SetConsoleCtrlHandler(null, false);

                return hasExited;
            }
            else
            {
                return false;
            }
        }

        [DllImport("kernel32.dll")]
        private static extern bool AttachConsole(uint dwProcessId);

        [DllImport("kernel32.dll")]
        private static extern bool FreeConsole();

        [DllImport("kernel32.dll")]
        private static extern bool SetConsoleCtrlHandler(ConsoleCtrlDelegate? HandlerRoutine, bool Add);

        [DllImport("kernel32.dll")]
        [return: MarshalAs(UnmanagedType.Bool)]
        private static extern bool GenerateConsoleCtrlEvent(CtrlTypes dwCtrlEvent, uint dwProcessGroupId);

        enum CtrlTypes : uint
        {
            CTRL_C_EVENT = 0,
            CTRL_BREAK_EVENT,
            CTRL_CLOSE_EVENT,
            CTRL_LOGOFF_EVENT = 5,
            CTRL_SHUTDOWN_EVENT
        }

        private delegate bool ConsoleCtrlDelegate(CtrlTypes CtrlType);
    }
}
```

## 如何使用

现在，我们可以通过调用 `ConsoleInterop.StopConsoleProgram(process)` 来安全地结束掉一个控制台程序。

当然，为了处理一些意外的情况，我把超时也加上了。下面的用法演示超时 2 秒候程序还没有退出，则强杀。

```csharp
if (!ConsoleInterop.StopConsoleProgram(process, 2000))
{
    try
    {
        process.Kill();
    }
    catch (InvalidOperationException e)
    {
    }
}
```

![Ctrl+C 结束控制台程序](/static/posts/2019-12-26-14-02-15.png)

---

**参考资料**

- [signals - Can I send a ctrl-C (SIGINT) to an application on Windows? - Stack Overflow](https://stackoverflow.com/a/15281070/6233938)
- [Stopping command-line applications programatically with Ctrl-C event from .Net – a working demo - Nemo's Realms](http://stanislavs.org/stopping-command-line-applications-programatically-with-ctrl-c-events-from-net/)
- [AttachConsole function - Windows Console - Microsoft Docs](https://docs.microsoft.com/en-us/windows/console/attachconsole)
- [SetConsoleCtrlHandler function - Windows Console - Microsoft Docs](https://docs.microsoft.com/en-us/windows/console/setconsolectrlhandler)


