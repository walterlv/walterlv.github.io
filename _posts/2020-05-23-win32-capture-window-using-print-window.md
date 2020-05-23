---
title: "Win32/C# 应用使用 PrintWindow 对窗口截图（PrintWindow）"
date: 2020-05-23 14:32:26 +0800
categories: windows dotnet csharp
position: knowledge
---

相比于 Windows 2000 引入到 GDI+ 中的 `BitBlt` 方法截取窗口图片，Windows XP 时也引入了 `PrintWindow` 方法来专门截取窗口，截取的原理也不同。

微软 Office 系列里的截取窗口，用的就是 `PrintWindow` 方法。

---

<div id="toc"></div>

## 开始截图

相比于使用 `BitBlt` 方法，使用 `PrintWindow` 截取窗口的代码少得多。

你需要引用如下命名空间：

```csharp
using System.Drawing;
using System.Drawing.Imaging;
using System.Drawing.Graphics;
```

```csharp
public static byte[] CaptureWindow(HWND hWnd, int width, int height)
{
   using (var bmp = new Bitmap(width, height))
   {
       using (Graphics memoryGraphics = Graphics.FromImage(bmp))
       {
           IntPtr dc = memoryGraphics.GetHdc();
           PrintWindow(hWnd, dc, 0);
           memoryGraphics.ReleaseHdc(dc);

           using (MemoryStream ms = new MemoryStream())
           {
               bmp.Save(ms, ImageFormat.Png);
               ms.Seek(0, SeekOrigin.Begin);
               return ms.ToArray();
           }
       }
   }
}

[DllImport("User32.dll", SetLastError = true)]
static extern bool PrintWindow(IntPtr hwnd, IntPtr hdc, uint nFlags);
```

## 原理、效果和问题

使用 `PrintWindow` 来截图时，目标窗口会收到一次 `WM_PRINT` 或 `WM_PRINTCLIENT` 消息以完成一次绘图。并且，此过程是同步进行的，如果目标窗口在处理消息时没有返回，那么这里的调用将一直挂起。

使用此方法截图时，DWM 绘制的窗口部分在真实窗口中和实际截出来的会不一样，是关掉了 Aero 效果时的窗口样式。

![关掉了 Aero 样式的截图](/static/posts/2020-05-23-14-28-54.png)

当然，还有可能把目标窗口截挂：

![截到没有目标窗口了](/static/posts/2020-05-23-14-29-28.png)

## 更多截窗口方法

- [Win32/C# 应用使用 GDI+ 对窗口截图（BitBlt） - walterlv](/post/win32-and-system-drawing-capture-window-to-bitmap)
- [Win32/C# 应用不依赖任何库使用纯 GDI+ 对窗口截图（BitBlt） - walterlv](/post/pure-win32-capture-window-to-bitmap)
- （本文）[Win32/C# 应用使用 PrintWindow 对窗口截图（PrintWindow） - walterlv](/post/win32-capture-window-using-print-window)

---

**参考资料**

- [PrintWindow function (winuser.h) - Win32 apps - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/api/winuser/nf-winuser-printwindow)
- [office的截屏是用的什么技术？ - 知乎](https://www.zhihu.com/question/272066252)
