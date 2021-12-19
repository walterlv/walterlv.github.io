---
title: "WPF 不要给 Window 类设置变换矩阵（应用篇）"
date: 2019-09-02 12:34:25 +0800
tags: wpf dotnet csharp
position: problem
coverImage: /static/posts/2019-09-02-11-58-46.png
permalink: /posts/dont-set-or-animate-scale-transform-for-a-wpf-window.html
---

WPF 的 `Window` 类是不允许设置变换矩阵的。不过，总会有小伙伴为了能够设置一下试图绕过一些验证机制。

不要试图绕过，因为你会遇到更多问题。

---

<div id="toc"></div>

## 试图设置变换矩阵

当你试图给 `Window` 类设置变换矩阵的时候，会出现异常：

> System.InvalidOperationException:“转换对于 Window 无效。”

无论是缩放还是旋转，都一样会出现异常。

![转换对于 Window 无效 - 缩放](/static/posts/2019-09-02-11-58-46.png)

![转换对于 Window 无效 - 旋转](/static/posts/2019-09-02-12-23-55.png)

我们在 [WPF 不要给 Window 类设置变换矩阵（分析篇）](/post/analyze-matrix-invert-exception-for-wpf-window) 一文中已经证明在 WPF 的 2D 变换中，旋转一定不会造成矩阵不可逆，因此此验证是针对此属性的强验证。

只有做设置的变换是恒等变换的时候，才可以完成设置。

```csharp
this.RenderTransform = new TranslateTransform(0, 0);
this.RenderTransform = new ScaleTransform(1, 1);
this.RenderTransform = new RotateTransform(0);
this.RenderTransform = new MatrixTransform(Matrix.Identity);
```

## 绕过验证

然而你可以通过先设置变换，再修改变换值的方式绕过验证：

```csharp
var scaleTransform = new ScaleTransform(1, 1);
this.RenderTransform = scaleTransform;
scaleTransform.ScaleX = 0.5;
scaleTransform.ScaleY = 0.5;
```

实际上，你绕过也没有关系，可是这样的设置实际上是没有任何效果的。

不过为什么还是会有小伙伴这么设置呢？

是因为小伙伴同时还设置了窗口透明 `AllowsTransparency="True"`、`WindowStyle="None"` 和 `Background="Transparent"`，导致看起来好像这个变换生效了一样。

## 小心异常

此设置不仅没有效果，还会引发异常，请阅读我的另一篇博客了解：

- [WPF 不要给 Window 类设置变换矩阵（分析篇）：System.InvalidOperationException: 转换不可逆。](/post/analyze-matrix-invert-exception-for-wpf-window)


