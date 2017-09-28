---
layout: post
title: "优化 UWP 中图片的内存占用"
date: 2017-09-17 12:44:45 +0800
date_modified: 2017-09-29 07:36:02 +0800
categories: uwp
keywords: uwp image thumbnail GetThumbnailAsync UriSource
description: 优化 UWP 中图片的内存占用。
---

跟图片打交道的 UWP 应用或多或少都会遇到图片带来的性能问题，就算不主要处理图片，做个论坛做个新闻客户端都涉及到大量图片。一个帖子、一篇文章里多半都是些高清大图，这些图片一张即可占用程序 1~2M 的内存空间。普通的写法内存很快就爆了，那么 UWP 中我们可以用哪些方法优化呢？

---

### 1. DecodePixelWidth/DecodePixelHeight

对于那些高分辨率图像，直接设置其 `DecodePixelWidth` 和 `DecodePixelHeight` 的值为较小的值即可大大节省内存空间。以下两种方法中，后者对内存空间的节省非常显著。

```xml
<!-- 性能不好 -->
<Image Source="ms-appx:///Assets/high-resolution-image.jpg" 
       Width="300" Height="200"/>
```

```xml
<!-- 性能不错 -->
<Image>
    <Image.Source>
        <BitmapImage UriSource="ms-appx:///Assets/high-resolution-image.jpg" 
                     DecodePixelWidth="300" DecodePixelHeight="200"/>
    </Image.Source>
</Image>
```

### 2. 利用好自带的布局机制

如果没有指定 `DecodePixelWidth`/`DecodePixelHeight`，那么 XAML 会根据布局自动调整图片的解码大小。

不过，微软才不会让你这么开心地就用！如果你做了这些事，就当布局自带的内存优化不存在好了：

1. 你先调了 `SetSourceAsync` 或设置了 `UriSource`，然后才把 `BitmapImage` 连接到活动的 XAML 树
1. 使用异步解码（如 `SetSource`）解码图像。
1. 把图像或父控件的 `Opacity` 设成了 0，或者 `Visibility` 设为 `Collapsed`
1. `ImageBrush` 的 `Strech` 设成了 `None`
1. 图像用作点九图（参见 [NineGrid](https://docs.microsoft.com/zh-cn/uwp/api/Windows.UI.Xaml.Controls.Image#Windows_UI_Xaml_Controls_Image_NineGrid)）
1. 给图像或父控件设置了 `CacheMode="BitmapCache"`
1. `ImageBrush` 绘制到不是矩形的地方 (试过画到文字上或形状上吗？)

关于第 1 条，这里有一些官方的代码作为例子：

```xml
<!-- 推荐写法，直接在 XAML 里指定 UriSoruce -->
<Image x:Name="myImage" UriSource="Assets/cool-image.png"/>
```

```xml
<!-- 但如果没有在 XAML 中指定，也可以去后台代码指定。 -->
<Image x:Name="myImage"/>
```

```csharp
// 后台代码如果这样写就不错，因为先把 BitmapImage 放到了活动的 XAML 树上。
var bitmapImage = new BitmapImage();
myImage.Source = bitmapImage;
bitmapImage.UriSource = new URI("ms-appx:///Assets/cool-image.png", UriKind.RelativeOrAbsolute);
```

```csharp
// 然而这样写就不太推荐了，因为先设置了 UriSource，再把 BitmapImage 放到活动的 XAML 树上。
var bitmapImage = new BitmapImage();
bitmapImage.UriSource = new URI("ms-appx:///Assets/cool-image.png", UriKind.RelativeOrAbsolute);
myImage.Source = bitmapImage;
```

### 3. 利用好自带的缓存机制

如果你用 `UriSource` 属性，那么恭喜，你将获得自带的图片缓存！如果多次使用相同的 `Uri`，那么会共用同一份内存空间。除此之外就没啦，比如自己创建一个流啊什么的；这就是说并不建议自己用 `FileStream`。

另外，微软提供了这么好用的 `SetSourceAsync`，但是用了这个就没有缓存了！于是我到底是用还是不用呢？

### 4. GetThumbnailAsync

如果你使用本机文件，那么恭喜，你直接获得了拿到系统自带缩略图的机会！

使用系统自带的缩略图比前面的方法都更好，因为如果系统已经生成好了缩略图，你根本连解码图像都不需要。

```csharp
FileOpenPicker picker = new FileOpenPicker();
picker.FileTypeFilter.Add(".bmp");
picker.FileTypeFilter.Add(".jpg");
picker.FileTypeFilter.Add(".jpeg");
picker.FileTypeFilter.Add(".png");
picker.SuggestedStartLocation = PickerLocationId.PicturesLibrary;

StorageFile file = await picker.PickSingleFileAsync();

StorageItemThumbnail fileThumbnail = await file.GetThumbnailAsync(ThumbnailMode.SingleItem, 64);

BitmapImage bmp = new BitmapImage();
bmp.SetSource(fileThumbnail);

Image img = new Image();
img.Source = bmp;
```

关于 `GetThumbnailAsync` 的详细用法，我的好朋友林德熙有更详细的说明，参见：[win10 uwp 获得缩略图](https://lindexi.gitee.io/lindexi//post/win10-uwp-%E8%8E%B7%E5%BE%97%E7%BC%A9%E7%95%A5%E5%9B%BE/)。
