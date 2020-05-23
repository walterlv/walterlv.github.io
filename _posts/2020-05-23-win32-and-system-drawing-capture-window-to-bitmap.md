---
title: "Win32/C# 应用使用 GDI+ 对窗口截图（BitBlt）"
date: 2020-05-23 13:52:14 +0800
categories: windows dotnet csharp
position: knowledge
---

在 Windows 上有 GDI+ 来操作位图，不止能完成很多的位图操作，还提供了与 Win32 窗口的互操作，可以截到 Win32 窗口的图片。

如果你希望对窗口截图，那么可使用本文提供的方法。

---

<div id="toc"></div>

## 依赖，或者没有依赖

在本文的代码中，你可以考虑引用以下这些库来简化代码。

对于 .NET Core：

- [System.Drawing.Common](https://www.nuget.org/packages/System.Drawing.Common)
- [Lsj.Util.Win32](https://www.nuget.org/packages/Lsj.Util.Win32/)

对于 .NET Framework / Mono：

- System.Drawing.dll
- [Lsj.Util.Win32](https://www.nuget.org/packages/Lsj.Util.Win32/)

以上所有库都是可选的。

如果你打算不引用 Lsj.Util.Win32，那么下面代码中涉及到的 Win32 API 调用你需要自己写 P/Invoke。如果你不熟悉 P/Invoke 的写法，你可以参考 [使用 PInvoke.net Visual Studio Extension 辅助编写 Win32 函数签名 - walterlv](/post/pinvoke-net-visual-studio-extension)。

如果你不打算引用 System.Drawing.Common，那么可以考虑使用裸的 GDI+ 来完成，可以参考 [Win32/C# 应用不依赖任何库使用纯 GDI+ 对窗口截图（BitBlt） - walterlv](/post/pure-win32-capture-window-to-bitmap)。

## 开始截图

如果你使用了 Lsj.Util.Win32 库，那么需要引用一些命名空间：

```csharp
using Lsj.Util.Win32;
using Lsj.Util.Win32.BaseTypes;
using Lsj.Util.Win32.Enums;
using Lsj.Util.Win32.Structs;
```

代码如下：

```csharp
public static byte[] CaptureWindow(HWND hWnd, int width, int height)
{
    // 创建兼容内存 DC。
    var wdc = User32.GetWindowDC(hWnd);
    var cdc = Gdi32.CreateCompatibleDC(wdc);
    // 创建兼容位图 DC。
    var hBitmap = Gdi32.CreateCompatibleBitmap(wdc, width, height);
    // 关联兼容位图和兼容内存，不这么做，下面的像素位块（bit_block）转换不会生效到 hBitmap。
    var oldHBitmap = Gdi32.SelectObject(cdc, (IntPtr)hBitmap);
    // 注：使用 GDI+ 截取“使用硬件加速过的”应用时，截取到的部分是全黑的。
    var result = Gdi32.BitBlt(cdc, 0, 0, width, height, wdc, 0, 0, RasterCodes.SRCCOPY);

    try
    {
        // 保存图片。
        if (result)
        {
            using (var bmp = Image.FromHbitmap(hBitmap))
            {
                using (var ms = new MemoryStream())
                {
                    bmp.Save(ms, ImageFormat.Png);
                    ms.Seek(0, SeekOrigin.Begin);
                    var data = ms.ToArray();
                    return data;
                }
            }
        }
        else
        {
            var error = Kernel32.GetLastError();
            throw new Win32Exception((int)error);
        }
    }
    finally
    {
        // 回收资源。
        Gdi32.SelectObject(cdc, oldHBitmap);
        Gdi32.DeleteObject((IntPtr)hBitmap);
        Gdi32.DeleteDC(cdc);
        User32.ReleaseDC(hWnd, wdc);
    }
}
```

示例代码只是单纯返回 PNG 格式的位图数据。你还可以按你的需要改造成其他数据。

## 更多截窗口方法

- （本文）[Win32/C# 应用使用 GDI+ 对窗口截图（BitBlt） - walterlv](/post/win32-and-system-drawing-capture-window-to-bitmap)
- [Win32/C# 应用不依赖任何库使用纯 GDI+ 对窗口截图（BitBlt） - walterlv](/post/pure-win32-capture-window-to-bitmap)
- [Win32/C# 应用使用 PrintWindow 对窗口截图（PrintWindow） - walterlv](/post/win32-capture-window-using-print-window)

---

**参考资料**

- [Capturing an Image - Win32 apps - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/gdi/capturing-an-image)
