---
title: "UWP 将图片裁剪成圆形（椭圆）"
date: 2018-06-15 21:21:21 +0800
tags: xaml uwp
coverImage: /static/posts/2018-06-15-21-19-44.png
permalink: /post/clip-uwp-image-to-ellipse.html
---

不知从什么时候开始，头像流行使用圆形了，于是各个平台开始追逐显示圆形裁剪图像的技术。UWP 有内建的机制支持这种圆形图像裁剪，不过，仅限于画刷。

---

*WPF 的圆形裁剪请左转参考*：[WPF 中使用附加属性，将任意 UI 元素或控件裁剪成圆形（椭圆）](/post/clip-wpf-uielement-to-ellipse)。

与 WPF 不同，UWP 中 `UIElement.Clip` 属性是 `RectangleGeometry` 类型的，这意味着利用此属性是没有办法完成圆形裁剪的。

但是，存在一个与 WPF 一样的简单一些的方案，直接使用 `ImageBrush`：

```xml
<Grid>
    <Ellipse Width="512" Height="512">
        <Ellipse.Fill>
            <ImageBrush ImageSource="Conan_C2.png" />
        </Ellipse.Fill>
    </Ellipse>
</Grid>
```

![](/static/posts/2018-06-15-21-19-44.png)

这是我的头像，原图是这样的：

![](/static/posts/2018-06-15-21-20-36.png)


