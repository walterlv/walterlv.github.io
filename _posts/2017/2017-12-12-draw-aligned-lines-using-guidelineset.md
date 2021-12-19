---
title: "WPF 绘制对齐像素的清晰显示的线条"
publishDate: 2017-12-12 21:49:53 +0800
date: 2018-08-13 20:47:08 +0800
tags: wpf
coverImage: /static/posts/2018-05-25-12-51-28.png
---

此前有小伙伴询问我为何他 1 像素的线条显示发虚，然后我告诉他是“像素对齐”的问题，然而他设置了各种对齐像素的属性依旧没有作用。于是我对此进行了一系列试验，对 WPF 像素对齐的各种方法进行了一次总结。此后在 StackOverflow 中，我回答了 [graphics - WPF DrawingContext seems ignore SnapToDevicePixels - Stack Overflow](https://stackoverflow.com/questions/6018106/wpf-drawingcontext-seems-ignore-snaptodevicepixels) 问题。

阅读本文，我们将了解解决 WPF 像素对齐的四种方法以及其各自的适用范围和副作用。

---

[![像素对齐](/static/posts/2018-05-25-12-51-28.png)](https://r302.cc/B99pXz)

<p id="toc"></p>

## 为什么要做像素对齐

![我们在解决什么问题](/static/posts/2017-12-12-19-48-01.png)

看线条！这是 3 像素的线条：

![线条发虚](/static/posts/2017-12-12-19-44-51.png)

然而论其原因，就是**因为我们屏幕太渣**~哦~不，是**因为绘制的线条没有与屏幕像素对齐**，具体来说是视觉对象（`Visual`）的位置不在整数像素上或尺寸不是整数像素。而与此同时屏幕的点距又太大以至于我们看出来绘制的线条和屏幕像素之间的差异。

然而为什么 WPF 不默认为我们对齐像素呢？这是因为要对齐像素必定带来尺寸上的偏差；这是绘制尺寸精度和最终呈现效果之间的平衡。在 MacBook、Surface Pro 这些高档显示屏上，根本不用管这样的平衡问题；但在渣渣显示器上，微软把这种平衡的控制交给了应用的开发者。

## 处理像素对齐的四种方法

### 方法一：布局取整 UseLayoutRounding

![UseLayoutRounding](/static/posts/2017-12-12-20-40-06.png)

实际效果是：

![UseLayoutRounding 的效果](/static/posts/2017-12-12-19-59-53.png)

![逗我](/static/posts/2017-12-12-20-43-44.png)

**根本就不起作用**！

事实上我们从 .NET Framework 源码可以得知，`UseLayoutRounding` 实际只处理 UI 元素对自己子级控件的布局取整。一旦整棵布局树种有任何一个不是整数（或者 DPI 相乘后不是整数），那么就依然没有解决问题。

### 方法二：对齐设备像素 SnapsToDevicePixels

这是一个会沿着逻辑树继承的属性，只要最顶层设置了这个属性，里面的元素都会具备此特性。不过，他只处理矩形的渲染，也就是说，只对 `Border` `Rectangle` 这些类型的元素生效，其他的包括自己写的元素基本都是不管用的。

它有一个好处，是像素对齐的情况下同时能够保证显示不足或超过 1 像素时，也能带一点儿透明或者超过一点像素。

### 方法三：使用 DrawingContext 绘制并配合 GuidelineSet

如果自己处理绘制，则可以在 `OnRender` 方法中使用 `DrawingContext` 来绘制各种各样的形状。`DrawingContext` 有方法 `PushGuidelineSet`，而 `PushGuidelineSet` 就是用来处理对齐的。

以下是四种不同方式的对齐效果对比，其中上面一半是直接对齐（即绘制过程是紧贴着的），下面一半则是多个部分带上一点偏移（即并不是紧贴）：

![四种方式对比](/static/posts/2017-12-12-20-50-44.png)  
▲ 看不清的可以考虑方法看

于是要想像素对齐，必须：

- 布局或绘制时，UI 元素之间一点偏移或空隙都不能有，一点都不行
- `SnapsToDevicePixels` 和 `GuidelineSet` 在实际对齐中有效，而 `UseLayoutRounding` 就是在逗你

`GuidelineSet` 的使用可以参考我在 StackOverflow 上的回答：[graphics - WPF DrawingContext seems ignore SnapToDevicePixels - Stack Overflow](https://stackoverflow.com/a/45189552/6233938)。

以下是我编写的用于辅助绘制对齐线条的扩展方法：

```csharp
public static class SnapDrawingExtensions
{
    public static void DrawSnappedLinesBetweenPoints(this DrawingContext dc,
        Pen pen, double lineThickness, params Point[] points)
    {
        var guidelineSet = new GuidelineSet();
        foreach (var point in points)
        {
            guidelineSet.GuidelinesX.Add(point.X);
            guidelineSet.GuidelinesY.Add(point.Y);
        }
        var half = lineThickness / 2;
        points = points.Select(p => new Point(p.X + half, p.Y + half)).ToArray();
        dc.PushGuidelineSet(guidelineSet);
        for (var i = 0; i < points.Length - 1; i = i + 2)
        {
            dc.DrawLine(pen, points[i], points[i + 1]);
        }
        dc.Pop();
    }
}
```

注意添加到 `GuidelineSet` 的尺寸**不需要是整数，也不需要计算对齐屏幕的位置**，只需要**随便指定一个值即可，但相邻的绘制元素的值需要在 double 级别完全相同，多一点少一点都不行**。

另外还需要特别注意的是：如果你绘制矩形，那么 `GuidelineSet` **构造函数参数传入的是横坐标和纵坐标，不要把宽度和高度传进去了**。

在 `OnRender` 中调用它绘制：

```csharp
protected override void OnRender(DrawingContext dc)
{
    // Draw four horizontal lines and one vertical line.
    // Notice that even the point X or Y is not an integer, the line is still snapped to device.
    dc.DrawSnappedLinesBetweenPoints(_pen, LineThickness,
        new Point(0, 0), new Point(320, 0),
        new Point(0, 40), new Point(320, 40),
        new Point(0, 80.5), new Point(320, 80.5),
        new Point(0, 119.7777), new Point(320, 119.7777),
        new Point(0, 0), new Point(0, 120));
}
```

![绘制的四条线](/static/posts/2017-12-12-21-32-09.png)

### 方法四：RenderOptions.EdgeMode

这是纯渲染级别的附加属性，对所有 UI 元素有效。这个属性很神奇，一旦设置，元素就再也不会出现模糊的边缘了，一定是硬像素边缘。不足半像素的全部删掉，超过半像素的变为 1 个像素。

以为它可以解决问题？——**Too young, too simple.**

你希望能够绘制 1 像素的线条，实际上它会让你有时看得见 1 像素线条，有时看的是 2 像素线条，有时居然完全看不见！！！

如果你都作用对象上还有其它视觉对象，它们也会一并变成了“硬边缘”，是可以看得见一个个像素的边缘。

![硬边缘](/static/posts/2017-12-12-22-09-53.png)

## 各种方法适用范围总结

![适用范围总结](/static/posts/2017-12-12-21-39-04.png)

1. 如果画粗线条粗边框，那么 `RenderOptions.EdgeMode` 最适合了，因为设置起来最方便，可以设置到所有的 UI 元素上。由于边框很粗，所以多一个少一个像素用户也注意不到。
1. 如果是画细边框，那么使用 `Border` 配合 `SnapsToDevicePixels` 可以解决，无论是 0.8 像素还是 1.0 像素，1.2 像素，都能在准确地显示其粗细的基础之上还保证像素对齐。
1. 如果图形比较复杂，比如绘制表格或者其它各种交叉了线条的图形，那么使用 `DrawingContext` 绘制，并设置 `GuidelineSet` 对齐。
1. 如果窗口非常简单，既没有缩放，UI 元素也不多，可以考虑使用 `UseLayoutRounding` 碰碰运气，万一界面简单到只需要整数对齐就够了呢？
1. 特别说明，上面四种方法不足与应对所有的像素对齐情况，如果还是没办法对齐……节哀把……我们一起找偏方……

