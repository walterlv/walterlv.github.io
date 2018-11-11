---
title: "使用 Win2D 绘制带图片纹理的圆（或椭圆）"
date: 2018-11-11 21:49:20 +0800
categories: dotnet win2d uwp
---

使用 Win2D 绘制图片和绘制椭圆都非常容易，可是如何使用 Win2D 绘制图片纹理的椭圆呢？

---

<div id="toc"></div>

### 重力迷宫小球

![重力迷宫](/static/posts/2018-11-11-walterlv-gravity-maze.gif)  
▲ 重力迷宫

你可以看到这个小球就像一个透明塑料小球一样，纹理会跟随背景而动。这显然不是 [Win2D 中的游戏循环：CanvasAnimatedControl](/post/game-loop-of-win2d-canvas-animated-control.html) 一文中我用 `DrawEllipse` 画的那个灰色小球。

### Win2D 实现

我们会使用到 Win2D 中的多种特效：

- `MorphologyEffect`
    - 用于将背景那些红色的洞洞转换成较虚的形态，以便球看起来不是扁平的。
    - 不是必要的，只是为了好看而已。
- `CropEffect`
    - 将背景区域裁剪成一个较小的区域。
    - 不是必要的。
- `AlphaMaskEffect`
    - 使用透明度蒙版使得图片只露出椭圆部分。
    - 这是绘制椭圆必要的特效。
- `ShadowEffect`
    - 做一个小球的阴影。
    - 不是必要的。

要画出图片纹理的椭圆，只需要这么一点代码即可：

```csharp
using (var list = new CanvasCommandList(creator))
{
    using (var s = list.CreateDrawingSession())
    {
        s.FillEllipse(_xPosition, _yPosition, _radius, _radius, Colors.Black);
    }

    var mask = new AlphaMaskEffect
    {
        Source = bitmap,
        AlphaMask = list,
    };

    ds.DrawImage(mask);
}
```

![带图片纹理的椭圆](/static/posts/2018-11-11-21-44-05.png)  
▲ 带图片纹理的椭圆

现在，如果你希望获得本文一开始获得的那种奇妙的效果，可以添加更多的特效：

```csharp
var bitmap = _game.Material.bitmap;
var morphology = new MorphologyEffect
{
    Source = bitmap,
    Mode = MorphologyEffectMode.Dilate,
    Width = 40,
    Height = 40,
};

var crop = new CropEffect
{
    Source = morphology,
    SourceRectangle = new Rect(
        _xPosition - _radius, _yPosition - _radius,
        _radius + _radius, _radius + _radius),
};

using (var list = new CanvasCommandList(creator))
{
    using (var s = list.CreateDrawingSession())
    {
        s.FillEllipse(_xPosition, _yPosition, _radius, _radius, Colors.Black);
    }

    var mask = new AlphaMaskEffect
    {
        Source = crop,
        AlphaMask = list,
    };

    var shadow = new ShadowEffect
    {
        Source = mask,
        BlurAmount = 4,
        ShadowColor = Color.FromArgb(0x40, 0x00, 0x00, 0x00),
    };

    ds.DrawImage(shadow);
    ds.DrawImage(mask);
}
```

### 关于 CanvasCommandList

上面的例子中，我们是用到了 `CanvasCommandList`。它可以帮助我们将绘制命令先绘制到一个缓存的上下文中，以便被其他绘制上下文进行统一的处理。

阅读林德熙的博客了解更多 `CanvasCommandList` 的资料：[win2d CanvasCommandList 使用方法 - 林德熙](https://lindexi.gitee.io/lindexi/post/win2d-CanvasCommandList-%E4%BD%BF%E7%94%A8%E6%96%B9%E6%B3%95.html)。
