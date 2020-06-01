---
title: "如何在 Unity3D 场景中显示帧率（FPS）"
publishDate: 2020-05-23 16:36:57 +0800
date: 2020-05-23 16:37:08 +0800
categories: unity csharp
position: knowledge
---

本文介绍如何在 Unity3D 场景中显示帧率。

---

<div id="toc"></div>

## 插入 UI：Text

做 FPS 帧率显示需要用到 UI 对象 Text，因此你需要有一个 Canvas。关于在 Unity3D 中插入 UI 对象的方法可见我的另一篇博客：

- [Unity3D 入门：如何为游戏添加 UI - walterlv](/post/unity-starter-add-game-ui)

当添加了 Canvas 后，再在 Canvas 里添加 Text：

![添加 Text](/static/posts/2020-05-23-15-16-44.png)

## 设置文本的属性和布局

选中文本对象，在 Inspector 窗格中有很多需要设置的属性。如下图所示。

![设置属性和布局](/static/posts/2020-05-23-15-26-54.png)

### 锚点对齐

上图中，我把点击对齐格子的弹出框放到了场景空间中（截图而已，实际不能放），不然会遮挡窗口中的其他属性。

这里在水平和垂直方向上都分别可以设置 4 种对齐方式：

- 左/上 对齐
- 居中对齐
- 右/下 对齐
- 拉伸对齐

默认是水平垂直居中，于是 UI 对象会以场景的中心为参考点布局。如果你强行把文本对象拉到左上角，那么你会失去分辨率自适应的特性。

由于本文期望 FPS 显示到左上角，所以我把锚点设置成左上角。

### 相对位置，大小

接着，使用鼠标拖拽文本到合适的位置。也可以直接在 Inspector 窗口中设置 PosX 和 PosY 属性，这样更精确。

也许你注意到还有一个 PosZ 属性可以设置。如果你在 2D 视图中，那么你会发现设置这个属性是“无效”的，但只要切回 3D 视图，你就能发现还是有深度变化的。不过，在设置 Canvas 的 Render Mode 属性之前（保持默认值），这个设置依然还是没有意义，因为默认情况下 UI 在最终显示的时候是始终保持 2D 视图的。

可以拖拉鼠标调整文本框的大小，也可以设置 Width 和 Height 属性。

### 设置文本的文字内容、字体大小和颜色

在下面的 Text 组件里面，你还可以设置通常本文应该有的属性，调整到你觉得合适的值就好。

## 添加帧率计算脚本

接下来我们开始添加帧率计算脚本。

### 创建脚本

在 Inspector 窗口中添加 AddComponent 添加组件，选择新脚本，取个名字。

![添加脚本](/static/posts/2020-05-23-15-39-55.png)

### 设计脚本属性

```csharp
using UnityEngine;
using UnityEngine.UI;

public class FpsUpdater : MonoBehaviour
{
    public Text fpsText;

    void Update()
    {
    }
}
```

我们在脚本中公开一个属性 `fpsText`，用来在 Inspector 窗口中制定要更新的文本 UI。

然后，将文本对象拖到脚本的 Fps Text 属性上，这样我们就可以在脚本中直接使用 `fpsText` 字段拿到要更新文本的 Text 对象了。

![设置 Fps Text 属性](/static/posts/2020-05-23-15-45-46.png)

当然，直接用 `gameObject` 也是可以的，不过需要自己再做类型转换。

### 编写代码

#### 最简单的

最简单的获取 FPS 的方式是直接用 1 除以当前帧所经历的时间。

```csharp
void Update()
{
    var fps = 1.0f / Time.deltaTime;
    fpsText.text = $"FPS: {fps}";
}
```

然而当你实际使用的时候你就会觉得——嗯……眼睛会瞎的。

![闪烁的 FPS](/static/posts/2020-05-23-flash-float-fps.gif)

你也有可能发现文字一时出现一时消失，那可能是因为你文本框的宽度设小了。于是当小数点后位数多了一些之后，显示不下去，文字就会消失。

至少，取个整还是需要的吧，谁愿意看小数帧数呢？

```csharp
var fps = 1.0f / Time.deltaTime;
fpsText.text = $"FPS: {Mathf.Ceil(fps)}";
```

#### 更稳定的

加了取整还是变化很快，看不清。那么可以如何更稳定呢？

可以考虑累加多帧再一次性更新。比如这里 60 帧更新一次：

```csharp
using UnityEngine;
using UnityEngine.UI;

public class FpsUpdater : MonoBehaviour
{
    public Text fpsText;

    private int count;
    private float deltaTime;

    void Update()
    {
        count++;
        deltaTime += Time.deltaTime;

        if (count % 60 == 0)
        {
            count = 1;
            var fps = 60f/deltaTime;
            deltaTime = 0;
            fpsText.text = $"FPS: {Mathf.Ceil(fps)}";
        }
    }
}
```

![稳定的帧率指示](/static/posts/2020-05-23-steady-fps.gif)

或者考虑 0.5 秒更新一次：

```csharp
public Text fpsText;

private int count;
private float deltaTime;

void Update()
{
    count++;
    deltaTime += Time.deltaTime;

    if (deltaTime >= 0.5f)
    {
        var fps = count/deltaTime;
        count = 0;
        deltaTime = 0;
        fpsText.text = $"FPS: {Mathf.Ceil(fps)}";
    }
}
```

![每秒刷新一次的更稳定的帧率指示](/static/posts/2020-05-23-steady-fps-in-seconds.gif)

#### 更多脚本

更多 FPS 帧数显示的脚本，可以从本文末尾的参考资料处找到。有很多不同需求的（比如帧率过低飘红的设定，比如要精确）。

---

**参考资料**

- [how to see fps? (frames per second) - Unity Answers](https://answers.unity.com/questions/1189486/how-to-see-fps-frames-per-second.html)
- [How do I find the frames per second of my game? - Unity Answers](https://answers.unity.com/questions/46745/how-do-i-find-the-frames-per-second-of-my-game.html)
- [FramesPerSecond - Unify Community Wiki](http://wiki.unity3d.com/index.php?title=FramesPerSecond)
- [Accurate Frames Per Second Count - Unity Answers](https://answers.unity.com/questions/64331/accurate-frames-per-second-count.html)
