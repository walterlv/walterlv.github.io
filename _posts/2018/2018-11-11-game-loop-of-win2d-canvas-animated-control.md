---
title: "Win2D 中的游戏循环：CanvasAnimatedControl"
publishDate: 2018-11-11 21:35:58 +0800
date: 2018-11-28 16:25:46 +0800
tags: dotnet win2d uwp
---

Win2D 是 DirectX 的一个高层封装，提供了极大 DirectX 性能的同时，又具有很好用的 API 设计。

用 Win2D 除了能做出高性能的视觉效果之外，还可以轻而易举地搭建一个游戏循环出来。使用 Win2D 的游戏循环，你可以直接做出一个简单的游戏出来。

---

<div id="toc"></div>

## 使用 Win2D 做出来的游戏

我在 GitHub 上开源了我正在做的一个基于 Win2D 的小游戏 —— GravityMaze，可以翻译为重力迷宫。本意是使用手机的重力感应器借助于自然重力的方式玩这款游戏，不过考虑到 Windows 10 Mobile 的手机太少，用户数量太少，其实我还是直接展示 UWP 桌面版好了。使用方向键可以控制桌面的倾斜角度，以便间接控制小球的运动方向。

当然，我自己是有一部 Lumia 950XL 的，你可以在 [使用 Windows 10 中的加速度计（Accelerometer，重力传感器）](/post/uwp-accelerometer) 一文中看到它的身影。

![重力迷宫](/static/posts/2018-11-11-walterlv-gravity-maze.gif)  
▲ 重力迷宫

这张图的红色背景是我自己拍摄的，所以绝不可能存在版权问题。

## 准备工作

要使用 Win2D 进行简单的游戏开发，你需要先配置好一些 UWP 的开发环境，并且在你的项目中安装 Win2D.uwp 的 NuGet 包。阅读 [win10 uwp win2d 入门 看这一篇就够了 - 林德熙](https://blog.lindexi.com/post/win10-uwp-win2d-%E5%85%A5%E9%97%A8-%E7%9C%8B%E8%BF%99%E4%B8%80%E7%AF%87%E5%B0%B1%E5%A4%9F%E4%BA%86.html) 了解如何在你的项目中安装 Win2D，并且了解 Win2D 基本的知识。

## Win2D 中的画布控件

Win2D 中的画布有 `CanvasControl`、`CanvasVirtualControl` 和 `CanvasAnimatedControl`。

- `CanvasControl` 用于进行一次性绘制，或者那些不常更新的画面内容。例如进行软件的 UI 绘制，或者软件中所得图形的绘制。
- `CanvasVirtualControl` 适用于在一个很大的画面中，只显示一个小部分的情况。例如显示大地图的一部分，或者显示大量超界的笔迹内容。
- `CanvasAnimatedControl` 适用于显示频繁更新的画面。典型的例子就是游戏。

## CanvasAnimatedControl

我们使用 `CanvasAnimatedControl` 来做游戏循环，因为这是 Win2D 这几个控件中最适合做游戏循环的控件了。

要在你的项目中使用 `CanvasAnimatedControl`，你需要在 XAML 中添加 `using:Microsoft.Graphics.Canvas.UI.Xaml`：

```xml
<Page x:Class="Walterlv.GravityMaze.Pages.GamePage"
    xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
    xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
    xmlns:xaml="using:Microsoft.Graphics.Canvas.UI.Xaml">
    <xaml:CanvasAnimatedControl Update="OnUpdate" Draw="OnDraw" />
</Page>
```

然后，我们订阅 `CanvasAnimatedControl` 的两个事件：

- `Update`
    - 用于更新游戏中的数据，更新参考的是游戏时间线。
- `Draw`
    - 用于绘制游戏的内容。

这是游戏循环最必要的两个事件了，其他虽然也是需要的，但也可以不写。

```csharp
private MazeGame _game;
        
private void OnUpdate(ICanvasAnimatedControl sender, CanvasAnimatedUpdateEventArgs e)
{
    // 根据时间线更新游戏数据。
    _game.Update(e.Timing);
}

private void OnDraw(ICanvasAnimatedControl sender, CanvasAnimatedDrawEventArgs e)
{
    // 绘制游戏画面。
    using (var ds = e.DrawingSession)
    {
        _game.Draw(ds);
    }
}
```

## CanvasAnimatedControl 在游戏中的使用

你在我的 `GamePage` 中其实看不到对 `Update` 和 `Draw` 事件的实际使用，因为我把它们都封装到了 `MazeGame` 中了。

有些信息需要注意：

1. `Update` 和 `Draw` 运行于相同的线程，但都不是主线程；所以你不可以从这里去获取主线程中的 UI 资源。
1. 正常情况下 `Update` 调用一次之后，`Draw` 就会调用一次；但如果当前运行缓慢，那么多次 `Update` 调用之后才会调用一次 `Draw`。
1. 如果 UWP 窗口最小化了，那么只会调用 `Update` 方法，而不会调用 `Draw` 方法。

![线程](/static/posts/2018-11-11-20-14-26.png)  
▲ 线程

在 GravityMaze 重力迷宫中，主要是 `Player` 也就是你在上面动图中看到的那个小球需要在 `Update` 中更新数据，其他其实只需要画就好了。`Update` 中我需要计算速度、加速度以及进行碰撞检测。

```csharp
private void OnUpdate(ICanvasAnimatedControl sender, CanvasAnimatedUpdateEventArgs e)
{
    var seconds = timing.ElapsedTime.TotalSeconds;
    
    // 1. 根据重力感应器或者键盘计算这一帧桌面的倾斜角度。
    // 2. 计算这一倾角带来的加速度。
    // 3. 计算是否跌入黑洞。
    // 4. 将加速度叠加阻力。
    // 5. 计算此速度和加速度下的位置。
    // 6. 进行边缘检测和碰撞检测。
}
```

而在 `Draw` 中，只绘制了那个球：

```csharp
private void OnDraw(ICanvasAnimatedControl sender, CanvasAnimatedDrawEventArgs e)
{
    // 绘制游戏画面。
    using (var ds = e.DrawingSession)
    {
        ds.FillEllipse(_xPosition, _yPosition, _radius, _radius, Colors.Gray);
    }
}
```

事实上你在上面动图看到的球并不是一个毫无生机的灰球，而是一个具有特效的半透明塑料弹球。你可以阅读 [使用 Win2D 绘制带图片纹理的圆（或椭圆）](/post/draw-ellipse-with-bitmap-texture-using-win2d) 了解如何绘制这样的塑料弹球。

## CanvasAnimatedControl 中 CreateResources 事件

`CanvasAnimatedControl` 中还有 `CreateResources` 事件，对更复杂的游戏循环有所帮助。当需要创建资源的时候会引发此事件。

第一次使用的时候就需要创建资源；除此之外，如果设备丢失，也需要创建资源。阅读 [Win2D 官方文章系列翻译 - 处理设备丢失 - void² - 博客园](https://www.cnblogs.com/validvoid/p/win2d-handling-device-lost.html) 了解更多关于设备丢失的内容。

```csharp
private CanvasBitmap _boardMaterial;

private async void OnCreateResources(CanvasAnimatedControl sender, CanvasCreateResourcesEventArgs e)
{
    // 其中，GameCanvas 是 XAML 中 CanvasAnimatedControl 的名称。
    _boardMaterial = await CanvasBitmap.LoadAsync(GameCanvas, new Uri("{ms-appx:///Assets/Game/Boards/table.jpg}"));
}
```

这里的 `_boardMaterial` 就是你在上面动图中看到的后面那张红色背景。

这样，便可以在需要的时候创建资源。

不过，这时你需要在 `Draw` 中先判空再绘制。

```csharp
private void OnDraw(ICanvasAnimatedControl sender, CanvasAnimatedDrawEventArgs e)
{
    using (var ds = e.DrawingSession)
    {
        // 其中，FullBounds 是 Rect 类型，我在 Page 的 SizeChanged 中给它赋的值。
        if (_boardMaterial != null)
        {
            ds.DrawImage(_boardMaterial, FullBounds);
        }
        else
        {
            ds.FillRectangle(FullBounds, Colors.White);
        }
    }
}
```

你也可以使用事件参数 `CanvasCreateResourcesEventArgs` 来追踪这个异步加载任务，这样能够在绘制之前确保资源被加载完毕。

```csharp
private async void OnCreateResources(CanvasAnimatedControl sender, CanvasCreateResourcesEventArgs e)
{
    e.TrackAsyncAction(CreateResourcesAsync().AsAsyncAction());

    async Task CreateResourcesAsync()
    {
        _boardMaterial = await CanvasBitmap.LoadAsync(GameCanvas, new Uri("{ms-appx:///Assets/Game/Boards/table.jpg}"));
    }
}
```

---

**参考资料**

- [win10 uwp win2d 入门 看这一篇就够了 - 林德熙](https://blog.lindexi.com/post/win10-uwp-win2d-%E5%85%A5%E9%97%A8-%E7%9C%8B%E8%BF%99%E4%B8%80%E7%AF%87%E5%B0%B1%E5%A4%9F%E4%BA%86.html)
- [win10 uwp win2d CanvasVirtualControl 与 CanvasAnimatedControl - 林德熙](https://blog.lindexi.com/post/win10-uwp-win2d-CanvasVirtualControl-%E4%B8%8E-CanvasAnimatedControl.html)
- [win10 uwp 萤火虫效果 - 林德熙](https://blog.lindexi.com/post/win10-uwp-%E8%90%A4%E7%81%AB%E8%99%AB%E6%95%88%E6%9E%9C.html)
