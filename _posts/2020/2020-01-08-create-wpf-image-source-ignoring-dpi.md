---
title: "WPF 中如何创建忽略 DPI 属性的图片"
date: 2020-01-08 12:57:02 +0800
tags: wpf dotnet csharp
position: problem
permalink: /post/create-wpf-image-source-ignoring-dpi.html
---

WPF 框架设计为与 DPI 无关，但你依然可能遇到 DPI 问题。尤其是 `Image` 控件显示的图片会根据图片 EXIF 中的 DPI 信息和屏幕 DPI 自动缩放图片。对于 UI 用图来说这是好事，但对于软件用户随便插入的图片来说就不是了——用户传入的图片可能是各种各样不统一的 DPI。因此这种 DPI 我们应该忽略。

---

<div id="toc"></div>

## 解决方法

直接设置 `Image` 控件的大小是一个不错的方案，这在允许设置 `Image` 控件大小的场合下是可以使用的。如果你能设置，那么直接设置，这是最好的方法了。

除此之外，我们还可能可以尝试这些方法：

1. 创建 `BitmapImage` 对象，根据当前屏幕的 DPI 值计算 `DecodePixelWidth` 和 `DecodePixelHeight`；
1. 创建 `DrawingImage` 对象，直接按照 WPF 的坐标单位绘制图片原始像素大小的图片；
1. 创建 `Bitmap` / `WriteableBitmap` 对象，重新创建一张 96 DPI 的图片。

以下的代码中，都假设当前 DPI 的值为 `monitorDpi`。

<!-- ## `BitmapImage`

如果直接使用 `BitmapImage` 对象，那么需要事先得知图片的宽高，否则需要两次加载图片。

```csharp
private static ImageSource CreateBitmapImage(Stream sourceStream, int width, int height)
{
    var bitmap = new BitmapImage();
    bitmap.BeginInit();
    bitmap.StreamSource = sourceStream;
    bitmap.DecodePixelWidth = width / monitorDpi.FactorX;
    bitmap.DecodePixelHeight = height / monitorDpi.FactorY;
    bitmap.EndInit();
}
```

在 `BitmapImage` 中，`EndInit` 调用之前是无法得知图片的像素尺寸的，所以方法必须要求传入期望的图片尺寸。要么两次加载 `BitmapImage`，要么通过其他方式来获取尺寸。

比如：

- [c# - Getting image dimensions without reading the entire file - Stack Overflow](https://stackoverflow.com/questions/111345/getting-image-dimensions-without-reading-the-entire-file) -->

## `DrawingImage`

`DrawingImage` 可以使用 WPF 的方式来绘制，不过如果要绘制位图，也需要一个 `BitmapImage` 对象，不过这个时候我们可以按照我们需要的尺寸进行绘制而不用关心 DPI 的问题。由于尺寸是在绘制的时候确定的，所以不需要 `Image` 控件也设置尺寸。

```csharp
private static ImageSource CreateBitmapImage(Stream sourceStream)
{
    var bitmap = new BitmapImage();
    bitmap.BeginInit();
    bitmap.StreamSource = sourceStream;
    bitmap.EndInit();

    var image = new ImageDrawing(
        bitmap,
        new Rect(0, 0, bitmap.PixelWidth / monitorDpi.FactorX, bitmap.PixelHeight / monitorDpi.FactorY));
    var drawing = new DrawingImage(image);
    return drawing;
}
```

<!-- ## `Bitmap` / `WriteableBitmap` -->

