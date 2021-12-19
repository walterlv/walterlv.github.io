---
title: "使用不安全代码将 Bitmap 位图转为 WPF 的 ImageSource 以获得高性能和持续小的内存占用"
publishDate: 2017-11-09 23:25:41 +0800
date: 2017-11-10 14:42:45 +0800
tags: wpf
coverImage: /static/posts/2017-11-09-23-25-23.png
permalink: /post/convert-bitmap-to-imagesource-using-unsafe-method.html
---

在 WPF 中将一个现成的 Bitmap 位图转换成 ImageSource 用于显示一个麻烦的事儿，因为 WPF 并没有提供多少可以转过来的方法。不过产生 Bitmap 来源却非常多，比如屏幕截图、GDI 图、数组或其它非托管框架生成的图片。

---

WPF 官方提供了一种方法，使用 `System.Windows.Interop.Imaging.CreateBitmapSourceFromHBitmap()` 方法。官方解释称这是托管和非托管位图相互转换所用的方法。然而此方法有一个很严重的弊端——每次都会生成全新的位图，即便每次 `DeleteObject` 之后，内存依然不会即时释放。

DeleteObject：

```csharp
[DllImport("gdi32")]
static extern int DeleteObject(IntPtr o);
```

DeleteObject 的指针源于 `Bitmap.GetHbitmap()` 方法，且得到的指针会作为 `System.Windows.Interop.Imaging.CreateBitmapSourceFromHBitmap()` 的参数之一。

---

在持续输出图像的时候（例如播放 Gif 图、持续显示屏幕截图等）不及时释放内存非常致命！为了防止重复创建图片，`WriteableBitmap` 似乎成了比较好的选择。

但是 `WriteableBitmap` 没有提供与位图 Bitmap 的互操作。然而它们都提供了像素操作。

于是，我们考虑内存拷贝来完成转换，代码如下：

```csharp
public static class WriteableBitmapExtensions
{
    public static void CopyFrom(this WriteableBitmap wb, Bitmap bitmap)
    {
        if (wb == null) throw new ArgumentNullException(nameof(wb));
        if (bitmap == null) throw new ArgumentNullException(nameof(bitmap));

        var ws = wb.PixelWidth;
        var hs = wb.PixelHeight;
        var wt = bitmap.Width;
        var ht = bitmap.Height;
        if (ws != wt || hs != ht) throw new ArgumentException("暂时只支持相同尺寸图片的复制。");

        var width = ws;
        var height = hs;
        var bytes = ws * hs * wb.Format.BitsPerPixel / 8;

        var rBitmapData = bitmap.LockBits(new Rectangle(0, 0, width, height),
            ImageLockMode.ReadOnly, bitmap.PixelFormat);

        wb.Lock();
        unsafe
        {
            Buffer.MemoryCopy(rBitmapData.Scan0.ToPointer(), wb.BackBuffer.ToPointer(), bytes, bytes);
        }
        wb.AddDirtyRect(new Int32Rect(0, 0, width, height));
        wb.Unlock();

        bitmap.UnlockBits(rBitmapData);
    }
}
```

我写了一个持续不断截取屏幕并输出显示的控件，在我的 The New Surface Pro 2736*1826 分辨率下内存一直保持 168M 从不变化。

![内存占用](/static/posts/2017-11-09-23-25-23.png)

这个方法的简化空间还非常大，比如，如果数据源是一个一次申请不断修改的数组，那么连 `Bitmap` 都可以不需要了，直接拷贝数组空间即可。我的朋友林德熙为此将这段代码简化得只剩下几行代码了：[WPF 使用不安全代码快速从数组转 WriteableBitmap - 林德熙](https://blog.lindexi.com/post/WPF-%E4%BD%BF%E7%94%A8%E4%B8%8D%E5%AE%89%E5%85%A8%E4%BB%A3%E7%A0%81%E5%BF%AB%E9%80%9F%E4%BB%8E%E6%95%B0%E7%BB%84%E8%BD%AC-WriteableBitmap.html)。


