---
title: "Win32/C# 应用不依赖任何库使用纯 GDI+ 对窗口截图（BitBlt）"
date: 2020-05-23 13:52:28 +0800
tags: windows dotnet csharp
position: knowledge
---

在 Windows 上有 GDI+ 来操作位图，不止能完成很多的位图操作，还提供了与 Win32 窗口的互操作，可以截到 Win32 窗口的图片。

如果你希望对窗口截图，那么可使用本文提供的方法。

---

<div id="toc"></div>

## 没有依赖

本文对窗口的截图几乎不需要任何额外的依赖（当然，都 GDI 了，Windows 系统还是要的）。

不过，你可以考虑使用 [Lsj.Util.Win32](https://www.nuget.org/packages/Lsj.Util.Win32/) 来简化代码，所以如果不介意的话也推荐安装，避免手工写一大堆的 P/Invoke。如果打算自己写 P/Invoke 又不熟的话，你可以参考 [使用 PInvoke.net Visual Studio Extension 辅助编写 Win32 函数签名 - walterlv](/post/pinvoke-net-visual-studio-extension)。

如果你的项目可以使用 `System.Drawing.Bitmap` 类的话，那更推荐直接使用 `Bitmap`，那样更简单。请参考 [Win32/C# 应用不依赖任何库使用纯 GDI+ 对窗口截图（BitBlt） - walterlv](/post/pure-win32-capture-window-to-bitmap)。

## 开始截图

如果你使用了 Lsj.Util.Win32 库，那么需要引用一些命名空间：

```csharp
using Lsj.Util.Win32;
using Lsj.Util.Win32.BaseTypes;
using Lsj.Util.Win32.Enums;
using Lsj.Util.Win32.Structs;
```

这个命名空间中已经带了很多我们需要用到的 Win32 互操作需要用到的数据结构，所以本文代码中只会列出库中暂时没有的（不然代码太多了）。

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
            var data = GetImageFromHBitmap(wdc, hBitmap, width, height);
            return data;
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

其中，`GetImageFromHBitmap` 方法的实现就比较麻烦了——我们需要手工写图片文件的文件头！

分成三个部分写入：

1. BMP 位图文件头
1. BMP 信息
1. 位图数据

实现如下：

```csharp
private static unsafe byte[] GetImageFromHBitmap(HDC hdc, HBITMAP hBitmap, int width, int height)
{
    var data = new byte[sizeof(BITMAPFILEHEADER) + sizeof(BITMAPINFOHEADER) + width * height * 3];
    var bitmapInfoHeader = new BITMAPINFOHEADER
    {
        biSize = (uint)sizeof(BITMAPINFOHEADER),
        biWidth = width,
        biHeight = height,
        biPlanes = 1,
        biBitCount = 24,
        biCompression = Compression.BI_PNG,
        biSizeImage = 0,
        biXPelsPerMeter = 0,
        biYPelsPerMeter = 0,
        biClrUsed = 0,
        biClrImportant = 0,
    };
    fixed (void* lpvBits = data)
    {
        var lpvBitsOnData = new IntPtr((long)lpvBits + sizeof(BITMAPFILEHEADER) + sizeof(BITMAPINFOHEADER));
        var got = Gdi32.GetDIBits(hdc, hBitmap, 0, height, lpvBitsOnData, new BITMAPINFO
        {
            bmiColors = new RGBQUAD[1],
            bmiHeader = bitmapInfoHeader
        }, (uint)DIBColorTableIdentifiers.DIB_RGB_COLORS);
    }
    var fileHeader = new BITMAPFILEHEADER
    {
        bfOffBits = (uint)sizeof(BITMAPFILEHEADER) + (uint)sizeof(BITMAPINFOHEADER),
        bfSize = (uint)data.Length,
        bfType = 0x4D42, // BM
    };
    GetBytes(fileHeader).CopyTo(data, 0);
    GetBytes(bitmapInfoHeader).CopyTo(data, sizeof(BITMAPFILEHEADER));
    return data;
}

private static byte[] GetBytes<T>(T @struct) where T : struct
{
    int size = Marshal.SizeOf(@struct);
    byte[] data = new byte[size];

    IntPtr ptr = Marshal.AllocHGlobal(size);
    Marshal.StructureToPtr(@struct, ptr, true);
    Marshal.Copy(ptr, data, 0, size);
    Marshal.FreeHGlobal(ptr);
    return data;
}

[StructLayout(LayoutKind.Sequential, Pack = 2)]
private struct BITMAPFILEHEADER
{
    public ushort bfType;
    public uint bfSize;
    public ushort bfReserved1;
    public ushort bfReserved2;
    public uint bfOffBits;
}
```

这里代代码不涉及到格式转换，因此你只能生成 BMP 格式。

## 更多截窗口方法

- [Win32/C# 应用使用 GDI+ 对窗口截图（BitBlt） - walterlv](/post/win32-and-system-drawing-capture-window-to-bitmap)
- （本文）[Win32/C# 应用不依赖任何库使用纯 GDI+ 对窗口截图（BitBlt） - walterlv](/post/pure-win32-capture-window-to-bitmap)
- [Win32/C# 应用使用 PrintWindow 对窗口截图（PrintWindow） - walterlv](/post/win32-capture-window-using-print-window)

---

**参考资料**

- [Capturing an Image - Win32 apps - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/gdi/capturing-an-image)
