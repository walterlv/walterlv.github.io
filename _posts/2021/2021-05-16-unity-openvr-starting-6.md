---
title: "Unity OpenVR 虚拟现实入门六：通过摇杆控制玩家移动"
publishDate: 2021-05-16 11:00:59 +0800
date: 2021-05-16 17:45:34 +0800
categories: unity openvr
position: starter
---

在 Unity 的帮助下，虚拟现实应用的开发非常容易。不过国内竟然还是没有什么教程，所以这里就来一点入门的，适合新手。

本文将基于第四篇的简单场景，通过摇杆的方式控制玩家移动。

---

系列博客：

- [Unity OpenVR 虚拟现实入门一：安装配置 Unity + OpenVR 环境](https://blog.walterlv.com/post/unity-openvr-starting-1.html)
- [Unity OpenVR 虚拟现实入门二：一个最简单的虚拟现实游戏/程序](https://blog.walterlv.com/post/unity-openvr-starting-2.html)
- [Unity OpenVR 虚拟现实入门三：最简单的五指交互](https://blog.walterlv.com/post/unity-openvr-starting-3.html)
- [Unity OpenVR 虚拟现实入门四：通过脚本控制手与控制器](https://blog.walterlv.com/post/unity-openvr-starting-4.html)
- [Unity OpenVR 虚拟现实入门五：通过传送控制玩家移动](https://blog.walterlv.com/post/unity-openvr-starting-5.html)
- [Unity OpenVR 虚拟现实入门六：通过摇杆控制玩家移动](https://blog.walterlv.com/post/unity-openvr-starting-6.html)

<div id="toc"></div>

## 准备场景

如果你是基于本系列第四篇来做的摇杆移动，那么直接开始本篇。如果是基于第五篇（传送），那么，在本文开始之前，我们需要先把第五篇里传送相关的游戏对象禁用。

如下图，选择所有与传送相关的游戏对象，右键然后“切换激活状态”。

![禁用传送相关的对象](/static/posts/2021-05-16-16-14-11.png)  
▲ 禁用传送相关的对象

## 编写移动玩家的脚本

选中“Player”，在检查器中添加组件。我们添加一个名为“PlayerMovementScript”的脚本。双击新添加的脚本文件，会用 Visual Studio 打开这个脚本文件，我们需要添加一点点的代码。

```csharp
using UnityEngine;

using Valve.VR;
using Valve.VR.InteractionSystem;

public class PlayerMovementScript : MonoBehaviour
{
    public SteamVR_Action_Vector2 input;
    public float speed;

    void Update()
    {
        var localMovement = new Vector3(input.axis.x, 0, input.axis.y);
        var worldMovement = Player.instance.hmdTransform.TransformDirection(localMovement);
        var worldMovementOfPlane = Vector3.ProjectOnPlane(worldMovement, Vector3.up);
        transform.position += speed * Time.deltaTime * worldMovementOfPlane;
    }
}
```

这里，我们定义了两个属性：

* `SteamVR_Action_Vector2` 类型的 `input`
* `float` 类型的 `speed`

我们现在定义的这个 `SteamVR_Action_Vector2` 类型是 SteamVR 输入的一种类型，当使用 VR 控制器产生一个二维向量类型的数据时，就会生成 `SteamVR_Action_Vector2` 类型的数据。例如推动摇杆会产生这样的二维向量。我们稍后也会将这个类型绑定到摇杆上。

关于 SteamVR 能产生的其他输入类型，可以参考林德熙的博客：[Unity3D OpenVR SteamVR Input Action 动作](https://blog.lindexi.com/post/Unity3D-OpenVR-SteamVR-Input-Action-%E5%8A%A8%E4%BD%9C.html)。

而 `float` 类型则跟所有编程语言一样，只是一个浮点数而已。

在 `Update` 函数中：

* `input.axis.x`、`input.axis.y` 是我们从 SteamVR 的二维向量中取得的 X、Y 分量；但是，我们将它转换成一个三维向量。这样，我们就能得到一个摇杆映射到三维坐标中与地面平行的平面上的坐标（相对坐标）。
* 这个坐标是相对坐标，而要移动玩家，我们需要一个世界坐标下的移动向量，于是我们拿头显的变换量，将这个本地坐标转换到世界坐标中。最终得到的世界坐标，我们保存到了 `worldMovement` 变量中。
* 为了避免让玩家移动到空中或地面以下，我们将 `worldMovement` 向量投影到与地面平行的二维平面上。
* 最终，我们用速度、经过的时间和之前计算得到的二维平面上的世界三维坐标相乘，便得到了这一帧的移动向量，将其叠加到玩家的位置坐标上即得到了新一帧的玩家坐标。

## 设置 SteamVR 输入

现在，回到 Unity 编辑器中，在“Player”对象的检查器中，找到我们刚刚添加的“PlayerMovementScript”脚本，我们需要设置这个 `input` 属性应该由什么进行输入。

![选择输入](/static/posts/2021-05-16-16-37-04.png)  
▲ 选择输入

在这个下拉列表中，我们点击“Add”（添加）。这时会进入 SteamVR 输入窗口，为了避免太多的输入设置影响到阅读，我删除了几乎所有默认为我们准备的 SteamVR 输入。（这是可以删除的，因为我们的这个入门应用不支持决大多数的操作，而且反正之后也会再添加。另外，关于 SteamVR 输入的更详细了解，可以阅读另一篇博客：（占位符））

我们添加一个新的（默认名字是 `NewAction`）：

![添加新的输入](/static/posts/2021-05-16-16-40-18.png)  
▲ 添加新的输入

这是一个抽象的，二维向量类型的输入，我将其取名为“DirectMovement”（意为直接移动，与之相对的是本系列第五篇说的传送移动 Teleport）。SteamVR 的这种抽象的输入可以很好地将编写代码时的输入与各种各样不同类型的 VR 控制器隔离开来，避免 VR 应用绑死某个控制器的按键。

以下是我为此添加的“DirectMovement”：

* 名字是“DirectMovement”
* 类型是 `Vector2`
* 必要性为“suggested”（suggested 表示开发者定义的，但允许用户修改的按键绑定设置；而 mandatory 表示开发者强制定义不允许用户修改的按键绑定设置）
* 我额外添加了中文和英文的两个不同本地化语言（这会在 SteamVR 的按键绑定设置时显示给开发者和用户看）

![DirectMovement 的动作设置](/static/posts/2021-05-16-16-45-35.png)  
▲ DirectMovement 的动作设置

添加完成之后，点击“SteamVR Input”窗口左下角的“Save and generate”按钮，等待编译完成后，关闭这个窗口。

再回到“Player”游戏对象的检查器中找到“PlayerMovementScript”脚本，我们可以为输入选择我们刚刚添加的“DirectMovement”动作了。

![选择 DirectMovement 动作](/static/posts/2021-05-16-16-53-36.png)  
▲ 选择 DirectMovement 动作

## 设置控制器按键绑定

现在，我们需要重新打开“SteamVR Input”窗口来设置按键绑定。这个窗口在“窗口”->“SteamVR Input”菜单里。

![SteamVR Input 菜单](/static/posts/2021-05-16-16-55-54.png)  
▲ SteamVR Input 菜单

在这个“SteamVR Input”窗口中，选择右下角的“Open binding UI”按钮。

![Open binding UI](/static/posts/2021-05-16-16-56-32.png)  
▲ Open binding UI

稍等片刻，会打开“控制器按键设置”界面（这是 SteamVR 的界面，以后玩家去改键的时候看到的也是这个界面）。

![控制器按键设置](/static/posts/2021-05-16-16-58-56.png)  
▲ 控制器按键设置

首屏会显示这些信息：

* 当前正在开发的应用的按键设置（我们即将选择编辑它）
* 当前控制器（我用的是 Index Controller）
* 官方按键设置（对玩家来说，可通过这个设置还原成开发者的官方按键；而对我们开发者来说，也就是代码仓库里的那个按键设置）

我们点击“编辑”以编辑当前的按键设置。

因为我们在前面删除了几乎所有的 SteamVR 输入动作，所以这里的按键设置几乎都是空的（如果没删的话，这里会有很多默认的）。

![编辑按键设置](/static/posts/2021-05-16-17-03-47.png)  
▲ 编辑按键设置

将鼠标放到“Thumb Stick”上可以看到摇杆高亮了，这就是我们即将要绑定的那个按键。

![Thumb Stick](/static/posts/2021-05-16-17-04-25.png)  
▲ Thumb Stick

点击旁边的“➕”号，会弹出这个键的各种不同用法：

* 摇杆：像摇杆一样使用这个键，会产生 X、Y 坐标（这正好产生我们刚刚新建的动作里需要的 Vector2 类型的输入数据）
* 十字键：像“上”“下”“左”“右”四个按键一样使用这个键
* 滚动：像滚轮一样使用这个键，报告水平和垂直滚动量
* 径向菜单：像一个圆形菜单一样使用这个键
* 按键：像按键一样使用这个键，可以处理触摸、点击、按下、双击和长按。
* 切换按键：像切换一样使用这个键，按一下为开启，再按一下为关闭。

![Thumb Stick 键的不同种用法](/static/posts/2021-05-16-17-06-26.png)

我们需要的是“摇杆”用法，因为这样才能产生我们需要的移动玩家的“Vector2”类型的输入数据。于是我们选择“摇杆”。

现在，以摇杆的方式使用这个键可以产生三种不同的输入：

* 点击：按下这个摇杆键时触发
* 触摸：摇杆键被触摸时触发
* 位置：推动摇杆时触发，产生位置输入（这是我们需要的输入）

![三种不同的输入](/static/posts/2021-05-16-17-13-12.png)  
▲ 三种不同的输入

我们在“位置”上点击，在打开的新界面中，我们可以看到它产生“矢量2”类型的数据，并且还能发现我们刚刚在 Unity 编辑器中定义的“Direct Movement”动作。我们选择它。

![选择“Direct Movement”动作](/static/posts/2021-05-16-17-15-36.png)

点击“✔️”来确定对这个摇杆键的设置。

![确认摇杆键的设置](/static/posts/2021-05-16-17-16-56.png)  
▲ 确认摇杆键的设置

为了使我们的按键设置直接修改到我们的源代码，我们点击整个界面右下角的“替换默认按键设置”按钮，这将直接修改我们代码中的按键绑定文件。

![替换默认按键设置](/static/posts/2021-05-16-17-17-42.png)  
▲ 替换默认按键设置

## 运行

现在，回到 Unity 编辑器，运行一下。可以看到，已经可以通过摇杆来控制玩家移动了。
