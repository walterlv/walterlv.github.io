---
title: "Unity3D 入门：最简单的控制视角，以及控制角色前进、转向的脚本"
date: 2020-05-05 15:58:46 +0800
tags: unity
position: starter
coverImage: /static/posts/2020-05-05-15-29-26.png
permalink: /post/unity-starter-handle-base-player-input-for-movement.html
---

本文依然是 Unity3D 的入门篇。作为 Unity3D 的入门读者，你可能希望迅速让你能在游戏中操作你的视角，或者让角色移动。

---

<div id="toc"></div>

## 创建脚本

作为入门篇，可能需要讲一下如何创建脚本。按下图，在 Unity 编辑器中：

1. 在 `Hierarchy`（层级）中选中主摄像机；
2. 在 `Inspector`（检查器）中选择最后那个 `Add Component`（添加组件）；
3. 选择 `New Script`（新建脚本）输入脚本名称，然后点击 `Create and Add`（创建并添加）。

![创建并添加脚本](/static/posts/2020-05-05-15-29-26.png)

<!-- 如果加错了，可以像这样删除脚本

![](/static/posts/2020-05-05-15-32-56.png) -->

接下来，我们需要去 Visual Studio 中编辑这个脚本。

点击菜单中的 `Assets` -> `Open C# Project`（`资源` -> `打开 C# 项目`）。于是可以转到 Visual Studio 中编辑你的脚本文件。

## 最简代码

在 Visual Studio 中找到我们刚刚创建的 `PlayerController` 脚本。

其实就是脚本名加上 `.cs` 后缀。Unity 中 C# 脚本要求文件名必须匹配脚本的类名，因此，不要随便尝试改文件名或类名；就算改了，也要同步更新文件名和类名重新匹配，并重新在 Inspector 中添加新名称的脚本。

在脚本中添加如下代码：

```csharp
using UnityEngine;

public class PlayerController : MonoBehaviour
{
    private Transform transform;
    public float moveSpeed = 5f;
    public float rotateSpeed = 50f;

    void Start()
    {
        transform = GetComponent<Transform>();
    }

    void Update()
    {
        float adValue = Input.GetAxis("Horizontal");
        float wsValue = Input.GetAxis("Vertical");
        float mValue = Input.GetAxis("Mouse X");

        var moveDirection = (Vector3.forward * wsValue) + (Vector3.right * adValue);
        transform.Translate(moveDirection.normalized * moveSpeed * Time.deltaTime, Space.Self);
        transform.Rotate(Vector3.up * rotateSpeed * Time.deltaTime * mValue);
    }
}
```

`Start` 消息会在游戏对象（也就是前面我们添加了脚本的那个主摄像机）创建后，第一个 `Update` 消息执行前调用，可以用来做一些初始化。这里，我们拿到我们需要做变换的 `Transform` 组件（这里的组件也就是 Unity 编辑器的“检查器”中看到的一个个组件）。

而 `Update` 会尽量在每一帧执行一次，我们在这里执行一些需要每帧更新的逻辑。

我们做了这些事情：

1. 定义了公共的两个字段 `moveSpeed` 和 `rotateSpeed` 表示移动速度和转向速度。
2. 通过 `Input.GetAxis` 获取不同种类的玩家输入。
3. 通过玩家的输入计算 `Transform` 组件的更新差量，然后更新 `Transform` 组件。

关于在脚本当中公开属性以在编辑器中设置的更多细节，可阅读我的另一篇 Unity3D 入门博客：

- [Unity3D 入门：让 C# 脚本公开可在 Unity 编辑器中设置的属性 - walterlv](/post/unity-starter-public-fields-of-unity-script.html)

可以看以下效果（gif 文件有点大，多等等）：

![运动效果](/static/post/2020-05-05-player-controller.gif)


