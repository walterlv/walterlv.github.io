---
title: ".NET 程序如何获取图片的宽高（框架自带多种方法的不同性能）"
publishDate: 2020-02-17 08:32:28 +0800
date: 2020-04-30 18:35:49 +0800
tags: dotnet wpf
position: problem
coverImage: /static/posts/2020-02-17-07-48-35.png
permalink: /post/get-image-pixel-width-and-height-in-dotnet.html
---

获取图片宽高的方法有很多种，本文介绍 .NET 中获取图片宽高的几种方法并评估其性能。如果你打算对大量图片进行一些处理，本文可能有用。

---

<div id="toc"></div>

## 本文即将评估的方法

本文即将采用以下四种方法获取图片：

1. `System.Drawing.Imaging.Metafile`
1. `System.Drawing.Bitmap`
1. `System.Windows.Media.Imaging.BitmapImage`
1. `System.Windows.Media.Imaging.BitmapDecoder`

### `System.Drawing.Imaging.Metafile`

实际上不要被这个名字误解了，`Metafile` 并不是“某个图片的元数据”，与之对应的 `MetafileHeader` 也不是“某个图片的元数据头”。Metafile 是微软 Windows 系统一种图片格式，也就是大家熟悉的 wmf 和 emf，分别是 Windows Metafile 和 Enhanced Metafile。

所以指望直接读取图片元数据头来提升性能的的小伙伴们注意啦，这不是你们要找的方法。

不过为什么这个也能拿出来说，是因为此类也可以读取其他格式的图片。

```csharp
var header = Metafile.FromFile(@"D:\blog.walterlv.com\large-background-image.jpg");
var witdh = header.Width;
var height = header.Height;
```

能拿到。

### `System.Drawing.Bitmap`

这个实际上是封装的 GDI+ 位图，所以其性能最好也是 GDI+ 的性能，然而都知道 GDI+ 的静态图片性能不错，但比起现代的其他框架来说确实差得多。

```csharp
var bitmap = new Bitmap(@"D:\blog.walterlv.com\large-background-image.jpg");
var witdh = bitmap.Width;
var height = bitmap.Height;
```

### `System.Windows.Media.Imaging.BitmapImage`

这是 WPF 框架中提供的显示位图的方法，生成的图片可以直接被 WPF 框架显示。

```csharp
var bitmap = new BitmapImage(new Uri(@"D:\blog.walterlv.com\large-background-image.jpg", UriKind.Absolute));
var witdh = bitmap.Width;
var height = bitmap.Height;
```

### `System.Windows.Media.Imaging.BitmapDecoder`

这也是 WPF 框架中提供的方法，但相比完全加载图片到可以显示的 `System.Windows.Media.Imaging.BitmapImage`，此方法的性能会好得多。

```csharp
var decoder = new JpegBitmapDecoder(new Uri(@"D:\blog.walterlv.com\large-background-image.jpg", UriKind.Absolute), BitmapCreateOptions.DelayCreation, BitmapCacheOption.OnDemand);
var frame = decoder.Frames[0];
var witdh = frame.PixelWidth;
var height = frame.PixelHeight;
```

## 性能对比

为了测试性能，我使用下面这张非常大的图，同一张图运行多次：

![大图](/static/posts/2020-02-14-large-background-image.jpg)

分别运行以上四个方法各 1 次：

![运行 1 次的时间消耗](/static/posts/2020-02-17-07-48-35.png)

分别运行以上四个方法各 10 次：

![运行 10 次的时间消耗](/static/posts/2020-02-17-07-50-48.png)

分别运行以上四个方法各 100 次（可以发现大量的 GC）：

![运行 100 次的时间消耗](/static/posts/2020-02-17-07-52-10.png)

现在，使用不同的图片运行多次。

分别运行以上四个方法各 10 张图片：

![运行 10 次的时间消耗](/static/posts/2020-02-17-08-05-52.png)

分别运行以上四个方法各 100 张图片（可以发现大量的 GC）：

![运行 100 次的时间消耗](/static/posts/2020-02-17-08-03-21.png)

做成图表，对于同一张图片运行不同次数：

| 消耗时间(ms) | Metafile | Bitmap | BitmapImage | BitmapDecoder |
| ------------ | -------- | ------ | ----------- | ------------- |
| 1次          | 175      | 107    | 71          | 2             |
| 10次         | 1041     | 1046   | 63          | 17            |
| 100次        | 10335    | 10360  | 56          | 122           |

![同一张图运行不同次数](/static/posts/2020-02-17-08-28-44.png)

对于不同图片运行不同次数：

| 消耗时间(ms) | Metafile | Bitmap | BitmapImage | BitmapDecoder |
| ------------ | -------- | ------ | ----------- | ------------- |
| 1次          | 175      | 107    | 71          | 2             |
| 10次         | 998      | 980    | 83          | 20            |
| 100次        | 10582    | 10617  | 255         | 204           |
| 1000次       | 127023   | 128627 | 3456        | 4015          |

![不同图片运行不同次数](/static/posts/2020-02-17-08-29-42.png)

可以发现，对于 .NET 框架中原生自带的获取图片尺寸的方法来说：

1. `System.Windows.Media.Imaging.BitmapDecoder` 的整体性能是最好的
1. 对于同一张图，`System.Windows.Media.Imaging.BitmapImage` 的运行时间不随次数的增加而增加，其内部有缓存

---

**参考资料**

- [WMF - 维基百科，自由的百科全书](https://zh.wikipedia.org/wiki/WMF)


