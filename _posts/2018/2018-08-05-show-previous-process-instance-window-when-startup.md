---
title: "Win32 程序在启动时激活前一个启动程序的窗口"
publishDate: 2018-08-05 21:48:50 +0800
date: 2018-09-01 08:15:17 +0800
categories: windows wpf
---

UWP 程序天生单实例。当然，新 API （10.0.17134）开始也提供了多实例功能。不过，传统 Win32 程序可就要自己来控制单实例了。

本文介绍简单的几个 Win32 方法调用，使 Win32 程序也支持单实例。

---

<div id="toc"></div>

## 激活之前进程的窗口

我们可以通过进程名称找到此前已经启动过的进程实例，如果发现，就激活它的窗口。

```csharp
[STAThread]
static void Main(string[] args)
{
    var current = Process.GetCurrentProcess();
    var process = Process.GetProcessesByName(current.ProcessName).FirstOrDefault(x => x.Id != current.Id);
    if (process != null)
    {
        var hwnd = process.MainWindowHandle;
        ShowWindow(hwnd, 9);
        return;
    }

    // 启动自己的主窗口，此部分代码省略。
}

[DllImport("user32.dll")]
private static extern int ShowWindow(IntPtr hwnd, uint nCmdShow);
```

你一定觉得那个 `9` 很奇怪，它是多个不同的 nCmdShow 的值：

- 0 `Hide`
- 1 `Minimized`
- 2 `Maximized`
- 9 `Restore`

另外，找到的窗口此时可能并不处于激活状态。例如在 Windows 10 中，此窗口可能在其他桌面上。那么我们需要添加额外的代码将其显示出来。

在前面的 `ShowWindow` 之后，再调用一下 `SetForegroundWindow` 即可将其激活到最前面来。如果在其他桌面，则会切换到对应的桌面。

```csharp
[DllImport("USER32.DLL")]
public static extern bool SetForegroundWindow(IntPtr hWnd);
```

```csharp
var hwnd = process.MainWindowHandle;
ShowWindow(hwnd, 9);
SetForegroundWindow(hwnd);
```

## 找到并激活窗口

以上方法适用于普通的主窗口。然而当窗口并不是进程的主窗口，或者 `ShowInTaskBar` 设为了 `false` 的时候就不生效了（此时窗口句柄会改变）。

于是，我们需要改用其他的方式来查找窗口。

```csharp
[STAThread]
static void Main(string[] args)
{
    var hwnd = FindWindow(null, "那个窗口的标题栏文字");
    if (hwnd != IntPtr.Zero)
    {
        ShowWindow(hwnd, 9);
        return;
    }

    // 启动自己的主窗口，此部分代码省略。
}

[DllImport("user32.dll", CharSet = CharSet.Unicode)]
public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
```

---

**参考资料**

- [Controlling Window State Of Other Applications using C#](https://www.c-sharpcorner.com/article/controlling-window-state-of-other-applications-using-C-Sharp/)
- [c# - How to show/hide an application with Visible and ShowInTaskBar as false - Stack Overflow](https://stackoverflow.com/q/8935985/6233938)
- [ShowWindowAsync function (Windows)](https://msdn.microsoft.com/en-us/library/ms633549%28VS.85%29.aspx?f=255&MSPPError=-2147217396)
- [How do I maximize/minimize applications programmatically in C#?](https://social.msdn.microsoft.com/Forums/vstudio/en-US/9bde4870-1599-4958-9ab4-902fa98ba53a/how-do-i-maximizeminimize-applications-programmatically-in-c?forum=csharpgeneral)
