---
title: "WPF 获取元素（Visual）相对于屏幕设备的缩放比例，可用于清晰显示图片"
date: 2019-04-25 17:24:19 +0800
tags: dotnet csharp wpf
position: knowledge
coverImage: /static/posts/2019-04-25-17-03-18.png
permalink: /post/get-wpf-visual-scaling-ratio-to-device.html
---

我们知道，在 WPF 中的坐标单位不是屏幕像素单位，所以如果需要知道某个控件的像素尺寸，以便做一些与屏幕像素尺寸相关的操作，就需要经过一些计算（例如得到屏幕的 DPI）。

更繁琐的是，我们的控件可能外面有一些其他的控件做了 `RenderTransform` 进行了一些缩放，于是了解到屏幕像素单位就更不容易了。

本文将提供一套计算方法，帮助计算某个 WPF 控件相比于屏幕像素尺寸的缩放比例，用于进行屏幕像素级别的渲染控制。

---

<div id="toc"></div>

## 一个 WPF 控件会经历哪些缩放？

如下图，我画了一个屏幕，屏幕里面有一个 WPF 窗口，WPF 窗口里面有一个或者多个 ViewBox 或者设置了 `RenderTransform` 这样的缩放的控件，一层层嵌套下有我们的最终控件。

![这些缩放](/static/posts/2019-04-25-17-03-18.png)

于是，我们的控件如何得知此时相比于屏幕像素的缩放比呢？换句话说，如何得知此时此控件的显示占了多少个屏幕像素的宽高呢？

## 分别计算所有的缩放

从上面的图中，我们可以得知，有两种不同种类的缩放：

1. 屏幕到 WPF 窗口的缩放
1. WPF 窗口内部的缩放

### 屏幕到 WPF 窗口的缩放

我们知道 WPF 的单位叫做 DIP 设备无关单位。不过，我更希望引入 UWP 中的有效像素单位。实际上 WPF 和 UWP 的像素单位含义是一样的，只是 WPF 使用了一个画饼式的叫法，而 UWP 中的叫法就显得现实得多。

你可以阅读我的另一篇博客了解到有效像素单位：

- [将 UWP 的有效像素（Effective Pixels）引入 WPF](/post/introduce-uwp-effective-pixels-into-wpf)

有效像素主要就是考虑了 DPI 缩放。于是实际上我们就是在计算 DPI 缩放。

```csharp
// visual 是我们准备找到缩放量的控件。
var ct = PresentationSource.FromVisual(visual)?.CompositionTarget;
var matrix = ct == null ? Matrix.Identity : ct.TransformToDevice;
```

这里，我们使用的是 `PresentationSource.FromVisual(visual)?.CompositionTarget` 因为不同屏幕可能存在不同的 DPI。

- [支持 Windows 10 最新 PerMonitorV2 特性的 WPF 多屏高 DPI 应用开发](/post/windows-high-dpi-development-for-wpf)

### WPF 窗口内部的缩放

WPF 窗口内部的缩放，肯定不会是一层层自己去叠加。

实际上 WPF 提供了方法 `TransformToAncestor` 可以计算一个两个具有父子关系的控件的相对变换量。

于是我们需要找到 WPF 窗口中的根元素，可以通过不断查找可视化树的父级来找到根。

```csharp
// VisualRoot 方法用于查找 visual 当前的可视化树的根，如果 visual 已经显示，则根会是窗口中的根元素。
var root = VisualRoot(visual);
var transform = ((MatrixTransform)visual.TransformToAncestor(root)).Value;
```

## 我封装的源码

为了方便使用，我进行了一些封装。

要获取某个 Visual 相比于屏幕的缩放量，则调用 `GetScalingRatioToDevice` 方法即可。

代码已经上传至 gits：<https://gist.github.com/walterlv/6015ea19c9338b9e45ca053b102cf456>。

```csharp
using System;
using System.Windows;
using System.Windows.Media;

namespace Walterlv
{
    public static class VisualScalingExtensions
    {
        /// <summary>
        /// 获取一个 <paramref name="visual"/> 在显示设备上的尺寸相对于自身尺寸的缩放比。
        /// </summary>
        public static Size GetScalingRatioToDevice(this Visual visual)
        {
            return visual.GetTransformInfoToDevice().size;
        }

        /// <summary>
        /// 获取一个 <paramref name="visual"/> 在显示设备上的尺寸相对于自身尺寸的缩放比和旋转角度（顺时针为正角度）。
        /// </summary>
        public static (Size size, double angle) GetTransformInfoToDevice(this Visual visual)
        {
            if (visual == null) throw new ArgumentNullException(nameof(visual));

            // 计算此 Visual 在 WPF 窗口内部的缩放（含 ScaleTransform 等）。
            var root = VisualRoot(visual);
            var transform = ((MatrixTransform)visual.TransformToAncestor(root)).Value;
            // 计算此 WPF 窗口相比于设备的外部缩放（含 DPI 缩放等）。
            var ct = PresentationSource.FromVisual(visual)?.CompositionTarget;
            if (ct != null)
            {
                transform.Append(ct.TransformToDevice);
            }
            // 如果元素有旋转，则计算旋转分量。
            var unitVector = new Vector(1, 0);
            var vector = transform.Transform(unitVector);
            var angle = Vector.AngleBetween(unitVector, vector);
            transform.Rotate(-angle);
            // 计算考虑了旋转的综合缩放比。
            var rect = new Rect(new Size(1, 1));
            rect.Transform(transform);

            return (rect.Size, angle);
        }

        /// <summary>
        /// 寻找一个 <see cref="Visual"/> 连接着的视觉树的根。
        /// 通常，如果这个 <see cref="Visual"/> 显示在窗口中，则根为 <see cref="Window"/>；
        /// 不过，如果此 <see cref="Visual"/> 没有显示出来，则根为某一个包含它的 <see cref="Visual"/>。
        /// 如果此 <see cref="Visual"/> 未连接到任何其它 <see cref="Visual"/>，则根为它自身。
        /// </summary>
        private static Visual VisualRoot(Visual visual)
        {
            if (visual == null) throw new ArgumentNullException(nameof(visual));

            var root = visual;
            var parent = VisualTreeHelper.GetParent(visual);
            while (parent != null)
            {
                if (parent is Visual r)
                {
                    root = r;
                }
                parent = VisualTreeHelper.GetParent(parent);
            }
            return root;
        }
    }
}
```


