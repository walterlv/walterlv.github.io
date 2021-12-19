---
title: "Windows 系统上用 .NET/C# 查找所有窗口，并获得窗口的标题、位置、尺寸、最小化、可见性等各种状态"
date: 2019-10-10 12:11:37 +0800
tags: windows dotnet csharp
position: knowledge
---

在 Windows 应用开发中，如果需要操作其他的窗口，那么可以使用 `EnumWindows` 这个 API 来枚举这些窗口。

你可以使用本文编写的一个类型，查找到所有窗口中你关心的信息。

---

<div id="toc"></div>

## 需要使用的 API

枚举所有窗口仅需要使用到 `EnumWindows`，其中需要定义一个委托 `WndEnumProc` 作为传入参数的类型。

剩下的我们需要其他各种方法用于获取窗口的其他属性。

- `GetParent` 获取窗口的父窗口，这可以确认找到的窗口是否是顶层窗口。（关于顶层窗口，可以延伸 [使用 SetParent 跨进程设置父子窗口时的一些问题（小心卡死） - walterlv](/post/all-processes-freezes-if-their-windows-are-connected-via-setparent)。）
- `IsWindowVisible` 判断窗口是否可见
- `GetWindowText` 获取窗口标题
- `GetClassName` 获取窗口类名
- `GetWindowRect` 获取窗口位置和尺寸，为此我们还需要定义一个结构体 `LPRECT`

```csharp
private delegate bool WndEnumProc(IntPtr hWnd, int lParam);

[DllImport("user32")]
private static extern bool EnumWindows(WndEnumProc lpEnumFunc, int lParam);

[DllImport("user32")]
private static extern IntPtr GetParent(IntPtr hWnd);

[DllImport("user32")]
private static extern bool IsWindowVisible(IntPtr hWnd);

[DllImport("user32")]
private static extern int GetWindowText(IntPtr hWnd, StringBuilder lptrString, int nMaxCount);

[DllImport("user32")]
private static extern int GetClassName(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

[DllImport("user32")]
private static extern bool GetWindowRect(IntPtr hWnd, ref LPRECT rect);

[StructLayout(LayoutKind.Sequential)]
private readonly struct LPRECT
{
    public readonly int Left;
    public readonly int Top;
    public readonly int Right;
    public readonly int Bottom;
}
```

## 枚举所有窗口

我将以上 API 封装成 `FindAll` 函数，并提供过滤器可以给大家过滤众多的窗口使用。

比如，我写了下面一个简单的示例，可以输出当前可见的所有窗口以及其位置和尺寸：

```csharp
using System;

namespace Walterlv.WindowDetector
{
    class Program
    {
        static void Main(string[] args)
        {
            var windows = WindowEnumerator.FindAll();
            for (int i = 0; i < windows.Count; i++)
            {
                var window = windows[i];
                Console.WriteLine($@"{i.ToString().PadLeft(3, ' ')}. {window.Title}
     {window.Bounds.X}, {window.Bounds.Y}, {window.Bounds.Width}, {window.Bounds.Height}");
            }
            Console.ReadLine();
        }
    }
}
```

![获取所有窗口以及其位置和尺寸](/static/posts/2019-10-10-12-06-19.png)

这里的 `FindAll` 方法，我提供了一个默认参数，可以指定如何过滤所有枚举到的窗口。如果不指定，则会找可见的，包含标题的，没有最小化的窗口。如果你希望找一些看不见的窗口，可以自己写过滤条件。

什么都不要过滤的话，就传入 `_ => true`，意味着所有的窗口都会被枚举出来。

## 附源码

因为源代码会经常更新，所以建议在这里查看：

- [walterlv.demo/Walterlv.WindowDetector/Walterlv.WindowDetector at master · walterlv/walterlv.demo](https://github.com/walterlv/walterlv.demo/tree/master/Walterlv.WindowDetector/Walterlv.WindowDetector)

无法访问的话，可以看下面：

```csharp
using System;
using System.Collections.Generic;
using System.Drawing;
using System.Runtime.InteropServices;
using System.Text;

namespace Walterlv.WindowDetector
{
    /// <summary>
    /// 包含枚举当前用户空间下所有窗口的方法。
    /// </summary>
    public class WindowEnumerator
    {
        /// <summary>
        /// 查找当前用户空间下所有符合条件的窗口。如果不指定条件，将仅查找可见窗口。
        /// </summary>
        /// <param name="match">过滤窗口的条件。如果设置为 null，将仅查找可见窗口。</param>
        /// <returns>找到的所有窗口信息。</returns>
        public static IReadOnlyList<WindowInfo> FindAll(Predicate<WindowInfo> match = null)
        {
            var windowList = new List<WindowInfo>();
            EnumWindows(OnWindowEnum, 0);
            return windowList.FindAll(match ?? DefaultPredicate);

            bool OnWindowEnum(IntPtr hWnd, int lparam)
            {
                // 仅查找顶层窗口。
                if (GetParent(hWnd) == IntPtr.Zero)
                {
                    // 获取窗口类名。
                    var lpString = new StringBuilder(512);
                    GetClassName(hWnd, lpString, lpString.Capacity);
                    var className = lpString.ToString();

                    // 获取窗口标题。
                    var lptrString = new StringBuilder(512);
                    GetWindowText(hWnd, lptrString, lptrString.Capacity);
                    var title = lptrString.ToString().Trim();

                    // 获取窗口可见性。
                    var isVisible = IsWindowVisible(hWnd);

                    // 获取窗口位置和尺寸。
                    LPRECT rect = default;
                    GetWindowRect(hWnd, ref rect);
                    var bounds = new Rectangle(rect.Left, rect.Top, rect.Right - rect.Left, rect.Bottom - rect.Top);

                    // 添加到已找到的窗口列表。
                    windowList.Add(new WindowInfo(hWnd, className, title, isVisible, bounds));
                }

                return true;
            }
        }

        /// <summary>
        /// 默认的查找窗口的过滤条件。可见 + 非最小化 + 包含窗口标题。
        /// </summary>
        private static readonly Predicate<WindowInfo> DefaultPredicate = x => x.IsVisible && !x.IsMinimized && x.Title.Length > 0;

        private delegate bool WndEnumProc(IntPtr hWnd, int lParam);

        [DllImport("user32")]
        private static extern bool EnumWindows(WndEnumProc lpEnumFunc, int lParam);

        [DllImport("user32")]
        private static extern IntPtr GetParent(IntPtr hWnd);

        [DllImport("user32")]
        private static extern bool IsWindowVisible(IntPtr hWnd);

        [DllImport("user32")]
        private static extern int GetWindowText(IntPtr hWnd, StringBuilder lptrString, int nMaxCount);

        [DllImport("user32")]
        private static extern int GetClassName(IntPtr hWnd, StringBuilder lpString, int nMaxCount);

        [DllImport("user32")]
        private static extern void SwitchToThisWindow(IntPtr hWnd, bool fAltTab);

        [DllImport("user32")]
        private static extern bool GetWindowRect(IntPtr hWnd, ref LPRECT rect);

        [StructLayout(LayoutKind.Sequential)]
        private readonly struct LPRECT
        {
            public readonly int Left;
            public readonly int Top;
            public readonly int Right;
            public readonly int Bottom;
        }
    }

    /// <summary>
    /// 获取 Win32 窗口的一些基本信息。
    /// </summary>
    public readonly struct WindowInfo
    {
        public WindowInfo(IntPtr hWnd, string className, string title, bool isVisible, Rectangle bounds) : this()
        {
            Hwnd = hWnd;
            ClassName = className;
            Title = title;
            IsVisible = isVisible;
            Bounds = bounds;
        }

        /// <summary>
        /// 获取窗口句柄。
        /// </summary>
        public IntPtr Hwnd { get; }

        /// <summary>
        /// 获取窗口类名。
        /// </summary>
        public string ClassName { get; }

        /// <summary>
        /// 获取窗口标题。
        /// </summary>
        public string Title { get; }

        /// <summary>
        /// 获取当前窗口是否可见。
        /// </summary>
        public bool IsVisible { get; }

        /// <summary>
        /// 获取窗口当前的位置和尺寸。
        /// </summary>
        public Rectangle Bounds { get; }

        /// <summary>
        /// 获取窗口当前是否是最小化的。
        /// </summary>
        public bool IsMinimized => Bounds.Left == -32000 && Bounds.Top == -32000;
    }
}
```
