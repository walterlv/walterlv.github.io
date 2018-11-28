---
title: "使用 Windows 10 中的加速度计（Accelerometer，重力传感器）"
publishDate: 2018-11-11 21:29:36 +0800
date: 2018-11-12 09:03:53 +0800
categories: uwp
---

在做 UWP 应用开发的时候还有什么理由可以用到加速度计呢？场景很多啦，比如做游戏，做类似 Surface Hub 那种一边旋转，一边所有内容跟着一起转的效果。

Windows 10 UWP 中的加速度计使用非常简单，只需要简单几句代码即可。

---

<div id="toc"></div>

### 重力迷宫游戏

这里有一个利用加速度计的好玩的例子：

![用 Lumia 950XL 玩重力迷宫](/static/posts/2018-11-12-playing-gravity-maze-with-lumia950xl.gif)  
▲ 用 Lumia 950XL 玩重力迷宫

画质太渣了？确实太渣了。那就看看桌面版吧…… 反正是 UWP，两边看起来是一样的。

![重力迷宫桌面版画面（高清版）](/static/posts/2018-11-11-walterlv-gravity-maze.gif)  
▲ 重力迷宫桌面版画面（高清版）

### 初始化 Accelerometer

`Accelerometer` 在 `Windows.Devices.Sensors` 命名空间下，使用时需要在类顶部加上 `using`。

```csharp
using Windows.Devices.Sensors;
```

而获得加速度计的实例只需要一句话：

```csharp
_accelerometer = Accelerometer.GetDefault();
```

如果设备上没有加速度计，那么这里拿到的实例就会是 `null`。所以注意需要进行 `null` 判断，毕竟大部分 Windows 10 设备都是普通电脑，没有加速度计的。

现在，我们对加速度计进行一些简单的初始化：

```csharp
_accelerometer = Accelerometer.GetDefault();
if (_accelerometer != null)
{
    // 设置加速度计读数的报告间隔。这里我们与 16ms 进行判断，如果小于 16ms 就设为 16ms。
    // 因为我们在做游戏，帧数就是 60Hz，也就是说，我们不需要更高的读数间隔。
    uint minReportInterval = _accelerometer.MinimumReportInterval;
    uint reportInterval = minReportInterval > 16 ? minReportInterval : 16;
    _accelerometer.ReportInterval = reportInterval;
    // 监听 ReadingChanged 事件，以便在加速度计读数改变时做一些操作。
    _accelerometer.ReadingChanged += Accelerometer_ReadingChanged;
}
```

### 得到 Accelerometer 的读数

在监听事件的 `Accelerometer_ReadingChanged` 事件中，我们可以得到加速度计的读数。

```csharp
private float _xAxis;
private float _yAxis;
private float _zAxis;

private void Accelerometer_ReadingChanged(Accelerometer sender, AccelerometerReadingChangedEventArgs e)
{
    AccelerometerReading reading = e.Reading;
    _xAxis = (float) reading.AccelerationX;
    _yAxis = (float) reading.AccelerationY;
    _zAxis = (float) reading.AccelerationZ;
}
```

这些读数是 -1 到 1 之间的数值。

### 将 Accelerometer 的读数转化成倾斜角度

在 [Win2D 中的游戏循环：CanvasAnimatedControl](/post/game-loop-of-win2d-canvas-animated-control.html) 一文中，我在 PC 上玩这款游戏，也是在模拟桌子的倾角。于是我们也需要将读数转化成 Windows 10 设备的倾斜角度。

```csharp
private (float xAngle, float yAngle) GetTiltAngles()
{
    if (_accelerometer != null)
    {
        // 从加速度计中读取读数，然后转换成设备倾斜角度。
        return ((float) (-_yAxis * Math.PI / 2), (float) (-_xAxis * Math.PI / 2));
    }
    else
    {
        // 如果没有加速度计，则从键盘获得模拟的倾斜角度。
        return GetTiltAnglesByKeyboard();
    }
}
```

这里的 `_xAxis` 和 `_yAxis` 就是前面在 `Accelerometer_ReadingChanged` 事件中获得的读数数值。

这里计算所得的角度值是下面图片中所指示的角度值。

![X 方向数值](/static/posts/2018-11-11-21-22-55.png)  
▲ X 方向数值

![Y 方向数值](/static/posts/2018-11-11-21-23-00.png)  
▲ Y 方向数值

---

#### 参考资料

- [Use the accelerometer - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/devices-sensors/use-the-accelerometer)
