---
title: "如何利用 Win32 API 设置两个窗口的所有者（Owner）关系"
date: 2023-03-01 15:37:01 +0800
categories: windows csharp dotnet
position: knowledge
---

设置两个窗口的父子关系非常简单，只需要调用 [`SetParent`](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setparent) 函数即可。然而设置两个窗口的所有者（Owner）关系却没有一个简单直观的 API。那么本文介绍一下如何设置两个窗口的 Owner 关系。

---

<div id="toc"></div>

## 设置所有者（Owner）

由于方法非常简单，所以我直接贴出 `MainWindow` 中的完整代码：

```csharp
public partial class MainWindow : Window
{
    public MainWindow()
    {
        InitializeComponent();
        SourceInitialized += OnSourceInitialized;
    }

    private void OnSourceInitialized(object? sender, EventArgs e)
    {
        var ownerHwnd = User32.GetForegroundWindow();
        var hwnd = new WindowInteropHelper(this).Handle;
        User32.SetWindowLong(hwnd,
            GetWindowLongIndexes.GWL_HWNDPARENT,
            (nint)ownerHwnd);
    }
}
```

在这里，我准备好了两个窗口句柄，一个是 `ownerHwnd`，我随便取了当前窗口的；另一个是 `hwnd` 即自己的句柄。这样，程序启动的时候，便会把自己窗口的所有者设置为启动前最后一个前台窗口。

接下来是关键代码 `SetWindowLong`，传入三个参数：

1. 自己窗口的句柄 `hwnd`
2. `GWL_HWNDPARENT` 即指定所有者（在[官方文档](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowlonga)中，依然将其描述为 parent`）
3. 所有者窗口的句柄 `ownerHwnd`

## 所需 API

在 C# 中，以上 API 函数需要定义。为了方便，你可以直接安装库 [Lsj.Util.Win32](https://www.nuget.org/packages/Lsj.Util.Win32/) 以省去所有的定义工作。

如果你不想引入库，可以用下面我准备好的定义（摘自 [Lsj.Util.Win32](https://www.nuget.org/packages/Lsj.Util.Win32/) 并简化）：

```csharp
public static nint SetWindowLong([In] nint hWnd, [In] GetWindowLongIndexes nIndex, [In] nint dwNewLong) => nint.Size > 4
    ? SetWindowLongPtrImp(hWnd, nIndex, dwNewLong)
    : SetWindowLongImp(hWnd, nIndex, dwNewLong.ToInt32());

[DllImport("user32.dll", CharSet = CharSet.Unicode, EntryPoint = "SetWindowLongW", ExactSpelling = true, SetLastError = true)]
private static extern int SetWindowLongImp(nint hWnd, GetWindowLongIndexes nIndex, int dwNewLong);

[DllImport("user32.dll", CharSet = CharSet.Unicode, EntryPoint = "SetWindowLongPtrW", ExactSpelling = true, SetLastError = true)]
private static extern nint SetWindowLongPtrImp(nint hWnd, GetWindowLongIndexes nIndex, nint dwNewLong);

public enum GetWindowLongIndexes
{
    GWL_HWNDPARENT = -8,
}
```

## 后续需求

出于兼容性考虑，即便设置为了所有者关系，Windows 系统也不会强制修改窗口的样式（例如从任务栏中去掉）。你可以考虑将窗口的 `WindowStylesEx` 属性中的 `WS_EX_APPWINDOW` 部分去掉来实现这样的效果。

```csharp
var style = style & ~WindowStylesEx.WS_EX_APPWINDOW;
```

至于具体如何使用 `GetWindowLong` 和 `SetWindowLong` 来实现以上目的，本文就不赘述了。

---

**参考资料**

- [SetParent function (winuser.h) - Win32 apps - Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-setparent)
- [GetWindowLongA function (winuser.h) - Win32 apps - Microsoft Learn](https://learn.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-getwindowlonga)
- [winapi - How to change a Window Owner using its handle - Stack Overflow](https://stackoverflow.com/a/133496/6233938)
