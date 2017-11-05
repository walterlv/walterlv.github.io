---
title: "分享一个算法，计算能在任何背景色上清晰显示的前景色"
date_published: 2017-11-04 22:51:33 +0800
date: 2017-11-05 16:24:33 +0800
categories: algorithm wpf uwp dotnet csharp
---

背景色千差万别，如果希望在这样复杂的背景色下显示清晰可辨的前景色（例如显示文字），那如何选择这样的前景色才能确保适用于所有的背景呢？

---

<div id="toc"></div>

### 灰度图的心理学公式

红绿蓝三色是非常不直观的颜色表示的方法，如果不经过训练，人类几乎没有办法直接通过 RGB 的值来猜出大概的颜色来。而 HSB 是用来解决人眼感知问题的，它将颜色用色相、饱和度、明度来表示。

可是，即便是 HSB 也不能完美解决人眼的感知问题。看下图，黄色和蓝色的饱和度和明度一样，只是色相不同，你觉得哪一个颜色更亮，哪一个更暗？

![黄色和蓝色的感知亮度对比](/static/posts/2017-11-04-22-18-36.png)

相信大家都会觉得黄色更亮，蓝色总给人一种阴暗的感觉。

所以，在饱和度和明度之外，一定还有一种人眼对亮度的感觉是与色相相关的。

我们将不同色相的颜色排成一圈，观察下哪些颜色更亮，哪些更暗：

![相同饱和度明度下的不同色相](/static/posts/2017-11-04-22-16-35.png)

我们将上面的不同颜色直接转成灰度图像，这是最能反映人眼感知的灰度图像，它将是这样的：

![不同色相给人的心里感知亮度](/static/posts/2017-11-04-22-29-08.png)

也就是说，不同的颜色值总能找到一个人眼感知的灰度值，这是著名的心理学公式：

> 灰度 = 红×0.299 + 绿×0.587 + 蓝×0.114

### 在灰度背景色上决定前景色

一个图像的每一个像素经过上面的公式计算得到的新的图像，即是人眼感知亮度的灰度图。

于是，当我们期望计算一个能在背景色上清晰显示的前景色时，我们可将背景颜色转换为灰度颜色，然后根据灰度程度，选取黑色或白色作为前景色。

当然，如果你喜欢，可以将一段黑色或接近于黑色的灰度色作为浅色背景的前景；将一段白色或颉俊宇白色的灰度色作为深色背景的前景。

### 代码实现

为了实现这个效果，我们先写一个灰度/亮度的计算函数：

```csharp
/// <summary>
/// 获取一个颜色的人眼感知亮度，并以 0~1 之间的小数表示。
/// </summary>
private static double GetGrayLevel(Color color)
{
    return (0.299 * color.R + 0.587 * color.G + 0.114 * color.B) / 255;
}
```

然后写一个根据感知亮度计算反色的方法：

```csharp
private static Color GetReverseForegroundColor(double grayLevel) => grayLevel > 0.5 ? Colors.Black : Colors.White;
```

于是，当我们希望计算某个背景色上一定能清晰显示的前景色时，只需要调用 `GetReverseForegroundColor` 即可。

![测试 ForestGreen 颜色](/static/posts/2017-11-04-22-36-30.png)
![测试 Teal 颜色](/static/posts/2017-11-04-22-42-45.png)
![测试 YellowGreen 颜色](/static/posts/2017-11-04-22-43-28.png)

### 我封装的方便的 API

不过，总是写后台代码来计算，对于 XAML 类的程序来说还是麻烦了些，于是我写了一些用于 XAML 的标记扩展，方便让一些文字自动根据背景色改变颜色。

这是期望的最简用法：

```xml
<TextBlock Foreground="{media:LuminancedForeground}" Text="我是前景 by walterlv"/>
```

因为内部已经使用绑定来实现动态变化，所以，无需在颜色更改时再次更新：

![支持动态的背景色](/static/posts/2017-11-05-reversing-background-to-foreground.gif)

由于这份封装的 API 目前还在完善中，会经常改动，所以只贴出 GitHub 仓库地址，不放在这里：

- [LuminanceForegroundExtension](https://github.com/walterlv/sharing-demo/blob/master/src/Walterlv.Demo.WPF/Utils/Media/LuminanceForegroundExtension.cs) 写出此用法的关键类
- [LuminanceReverseColor](https://github.com/walterlv/sharing-demo/blob/master/src/Walterlv.Demo.WPF/Utils/Media/LuminanceReverseColor.cs) 包含亮度灰度值反色的逻辑
- [DependencyMarkupExtension](https://github.com/walterlv/sharing-demo/blob/master/src/Walterlv.Demo.WPF/Utils/Xaml/DependencyMarkupExtension.cs) 给标记扩展中一些恶心的代码提供封装

---

#### 参考资料
- [Luma (video) - Wikipedia](https://en.wikipedia.org/wiki/Luma_(video))
- [从RGB色转为灰度色算法（转） - carekee - 博客园](http://www.cnblogs.com/carekee/articles/3629964.html)
