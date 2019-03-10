---
title: "使用 PInvoke.net Visual Studio Extension 辅助编写 Win32 函数签名"
date: 2018-07-21 22:35:49 +0800
categories: dotnet csharp visualstudio windows
---

在 .NET 程序中使用 Win32 函数并不如 C++ 中方便。因为 C# 中不能引入 C++ 中常用的头文件，于是各种方法签名、结构体定义等等都需要各种寻找。然而 PInvoke.net 帮助我们解决了这个问题。本文推荐一款 Visual Studio 插件来帮助我们更快速地插入 Win32 函数签名。

---

<div id="toc"></div>

## PInvoke.net

PInvoke.net 的官方网站是 <https://www.pinvoke.net/>，如果你只是希望临时找一找 P/Invoke 函数调用的方法签名，那么直接去网站就能搜索。不过，如果你期望写代码时能够随时方便地插入，那么安装插件还是非常方便的。

前往 Visual Studio Marketplace 即可下载安装 [PInvoke.net Visual Studio Extension](https://marketplace.visualstudio.com/items?itemName=vs-publisher-306627.PInvokenetVisualStudioExtension) 扩展。不过，更推荐直接在 Visual Studio 的“工具->扩展和更新”里面在线下载安装插件：

![PInvoke.net Visual Studio Extension](/static/posts/2018-07-21-22-39-09.png)

下载完关闭所有的 Visual Studio 后，会弹出扩展安装界面，继续安装即可。

![安装扩展](/static/posts/2018-07-21-22-38-12.png)

## 使用 PInvoke.net 扩展

在安装了 PInvoke.net 插件后，可以在顶部菜单栏中寻找到 PInvoke.net 菜单项，里面可以插入 PInvoke 的函数调用签名：

![Insert PInvoke Signatures](/static/posts/2018-07-21-22-54-08.png)

现在，我们搜索 `MoveWindow` 函数：

![MoveWindow](/static/posts/2018-07-21-22-57-52.png)

随后点击 Insert 便在代码中得到了一份 MoveWindow 的 P/Invoke 函数签名。

```csharp
/// <summary>
///     The MoveWindow function changes the position and dimensions of the specified window. For a top-level window, the
///     position and dimensions are relative to the upper-left corner of the screen. For a child window, they are relative
///     to the upper-left corner of the parent window's client area.
///     <para>
///         Go to https://msdn.microsoft.com/en-us/library/windows/desktop/ms633534%28v=vs.85%29.aspx for more
///         information
///     </para>
/// </summary>
/// <param name="hWnd">C++ ( hWnd [in]. Type: HWND )<br /> Handle to the window.</param>
/// <param name="X">C++ ( X [in]. Type: int )<br />Specifies the new position of the left side of the window.</param>
/// <param name="Y">C++ ( Y [in]. Type: int )<br /> Specifies the new position of the top of the window.</param>
/// <param name="nWidth">C++ ( nWidth [in]. Type: int )<br />Specifies the new width of the window.</param>
/// <param name="nHeight">C++ ( nHeight [in]. Type: int )<br />Specifies the new height of the window.</param>
/// <param name="bRepaint">
///     C++ ( bRepaint [in]. Type: bool )<br />Specifies whether the window is to be repainted. If this
///     parameter is TRUE, the window receives a message. If the parameter is FALSE, no repainting of any kind occurs. This
///     applies to the client area, the nonclient area (including the title bar and scroll bars), and any part of the
///     parent window uncovered as a result of moving a child window.
/// </param>
/// <returns>
///     If the function succeeds, the return value is nonzero.<br /> If the function fails, the return value is zero.
///     <br />To get extended error information, call GetLastError.
/// </returns>
[DllImport("user32.dll", SetLastError = true)]
internal static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);
```

不过，插件内所带的 P/Invoke 函数似乎并不够多，因为对于 `DwmSetWindowAttribute` 这样的函数并没有在插件中出现。不过 <https://www.pinvoke.net/> 中是包含的。

![](/static/posts/2018-07-21-22-56-00.png)

除了包含 C# 调用所需的函数签名之外，还包含函数签名中所用的结构体或枚举类型定义。

```csharp
[DllImport("dwmapi.dll", PreserveSig = true)]
public static extern int DwmSetWindowAttribute(IntPtr hwnd, DWMWINDOWATTRIBUTE attr, ref int attrValue, int attrSize);

enum DWMWINDOWATTRIBUTE : uint
{ 
    NCRenderingEnabled = 1,
    NCRenderingPolicy,
    TransitionsForceDisabled,
    AllowNCPaint,
    CaptionButtonBounds,
    NonClientRtlLayout,
    ForceIconicRepresentation,
    Flip3DPolicy,
    ExtendedFrameBounds,
    HasIconicBitmap,
    DisallowPeek,
    ExcludedFromPeek,
    Cloak,
    Cloaked,
    FreezeRepresentation
}
```

感谢广大 .NET 的社区开发者帮助收集各种 PInvoke 函数签名；如果你发现了一些没有收录的，也欢迎加入。
