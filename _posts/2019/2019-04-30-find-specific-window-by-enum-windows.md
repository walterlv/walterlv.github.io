---
title: "使用 EnumWindows 找到满足你要求的窗口"
date: 2019-04-30 21:11:32 +0800
tags: windows dotnet csharp wpf
position: knowledge
permalink: /posts/find-specific-window-by-enum-windows.html
---

在 Windows 应用开发中，如果需要操作其他的窗口，那么可以使用 `EnumWindows` 这个 API 来枚举这些窗口。

本文介绍使用 `EnumWindows` 来枚举并找到自己关心的窗口（如 QQ/TIM 窗口）。

---

<div id="toc"></div>

## `EnumWindows`

你可以在微软官网了解到 `EnumWindows`。

要在 C# 代码中使用 `EnumWindows`，你需要编写平台调用 P/Invoke 代码。使用我在另一篇博客中的方法可以自动生成这样的平台调用代码：

- [使用 PInvoke.net Visual Studio Extension 辅助编写 Win32 函数签名](/post/pinvoke-net-visual-studio-extension)

我这里直接贴出来：

```csharp
[DllImport("user32.dll")]
public static extern int EnumWindows(WndEnumProc lpEnumFunc, int lParam);
```

## 遍历所有的顶层窗口

官方文档对此 API 的描述是：

> Enumerates all top-level windows on the screen by passing the handle to each window, in turn, to an application-defined callback function.

遍历屏幕上所有的顶层窗口，然后给回调函数传入每个遍历窗口的句柄。

不过，并不是所有遍历的窗口都是顶层窗口，有一些非顶级系统窗口也会遍历到，详见：[EnumWindows 中的备注节](https://docs.microsoft.com/en-us/windows/desktop/api/winuser/nf-winuser-enumwindows#remarks)。

所以，如果需要遍历得到所有窗口的集合，那么可以使用如下代码：

```csharp
public static IReadOnlyList<int> EnumWindows()
{
    var windowList = new List<int>();
    EnumWindows(OnWindowEnum, 0);
    return windowList;

    bool OnWindowEnum(int hwnd, int lparam)
    {
        // 可自行加入一些过滤条件。
        windowList.Add(hwnd);
        return true;
    }
}
```

## 遍历具有指定类名或者标题的窗口

我们需要添加一些可以用于过滤窗口的 Win32 API。以下是我们即将用到的两个：

```csharp
// 获取窗口的类名。
[DllImport("user32.dll")]
private static extern int GetClassName(int hWnd, StringBuilder lpString, int nMaxCount);

// 获取窗口的标题。
[DllImport("user32")]
public static extern int GetWindowText(int hwnd, StringBuilder lptrString, int nMaxCount);
```

于是根据类名找到窗口的方法：

```csharp
public static IReadOnlyList<int> FindWindowByClassName(string className)
{
    var windowList = new List<int>();
    EnumWindows(OnWindowEnum, 0);
    return windowList;

    bool OnWindowEnum(int hwnd, int lparam)
    {
        var lpString = new StringBuilder(512);
        GetClassName(hwnd, lpString, lpString.Capacity);
        if (lpString.ToString().Equals(className, StringComparison.InvariantCultureIgnoreCase))
        {
            windowList.Add(hwnd);
        }

        return true;
    }
}
```

使用此方法，我们可以传入 `"txguifoundation"` 找到 QQ/TIM 的窗口：

```csharp
var qqHwnd = FindWindowByClassName("txguifoundation");
```

要获取窗口的标题，或者把标题作为过滤条件，则使用 `GetWindowText`。

在 QQ/TIM 中，窗口的标题是聊天对方的名字或者群聊名称。

```csharp
var lptrString = new StringBuilder(512);
GetWindowText(hwnd, lptrString, lptrString.Capacity);
```

---

**参考资料**

- [EnumWindows function (winuser.h) - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/api/winuser/nf-winuser-enumwindows)
- [GetClassName function (winuser.h) - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/api/winuser/nf-winuser-getclassname)

