---
title: "Unity OpenVR 虚拟现实入门四：通过脚本控制手与控制器"
publishDate: 2021-05-16 09:49:15 +0800
date: 2021-05-16 16:18:47 +0800
categories: unity openvr
position: starter
---

在 Unity 的帮助下，虚拟现实应用的开发非常容易。不过国内竟然还是没有什么教程，所以这里就来一点入门的，适合新手。

本文将基于第三篇的简单场景，打开和关闭控制器的显示。

---

系列博客：

- [Unity OpenVR 虚拟现实入门一：安装配置 Unity + OpenVR 环境](https://blog.walterlv.com/post/unity-openvr-starting-1.html)
- [Unity OpenVR 虚拟现实入门二：一个最简单的虚拟现实游戏/程序](https://blog.walterlv.com/post/unity-openvr-starting-2.html)
- [Unity OpenVR 虚拟现实入门三：最简单的五指交互](https://blog.walterlv.com/post/unity-openvr-starting-3.html)
- [Unity OpenVR 虚拟现实入门四：通过脚本控制手与控制器](https://blog.walterlv.com/post/unity-openvr-starting-4.html)
- [Unity OpenVR 虚拟现实入门五：通过传送控制玩家移动](https://blog.walterlv.com/post/unity-openvr-starting-5.html)
- [Unity OpenVR 虚拟现实入门六：通过摇杆控制玩家移动](https://blog.walterlv.com/post/unity-openvr-starting-6.html)

<div id="toc"></div>

## 添加脚本

本文继续第三篇的内容。

在“Player”上添加脚本。我们在“Update”中简单添加一些代码：

```csharp
using UnityEngine;

using Valve.VR;
using Valve.VR.InteractionSystem;

public class PlayerDemoScript : MonoBehaviour
{
    public bool showControllers = false;

    void Update()
    {
        foreach (var hand in Player.instance.hands)
        {
            if (showControllers)
            {
                hand.ShowController();
                hand.SetSkeletonRangeOfMotion(EVRSkeletalMotionRange.WithController);
            }
            else
            {
                hand.HideController();
                hand.SetSkeletonRangeOfMotion(EVRSkeletalMotionRange.WithoutController);
            }
        }
    }
}
```

这样，当 `showControllers` 被设置为 `true` 时，可以同时显示手与控制器，当设置为 `false` 时，则只显示手。

这里 `ShowController` 是显示控制器，`HideController` 是隐藏控制器。后面的 `SetSkeletonRangeOfMotion` 是让手的骨骼动画适配控制器，如果指定为 `WithController` 则会在运动手指的时候握紧时只会握住控制器，而不会穿模到控制器里面；反之，握紧的时候则不考虑控制器的位置，会穿模。

[![手握住控制器](/static/posts/2021-05-16-09-46-33.png)](https://r302.cc/Yz0D3Ax?platform=enpc&channel=copylink)  
▲ 手握住控制器

## 运行

运行场景，当我们在“检查器”中勾选“showControllers”时，会在场景中看到手握住控制器。
