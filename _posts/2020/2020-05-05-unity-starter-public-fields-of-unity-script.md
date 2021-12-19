---
title: "Unity3D 入门：让 C# 脚本公开可在 Unity 编辑器中设置的属性"
publishDate: 2020-05-05 09:20:09 +0800
date: 2020-05-05 16:22:24 +0800
tags: unity
position: starter
---

将一部分参数从 C# 脚本中抽离出来，可以让 C# 脚本在 Unity 项目中更通用，适用于更多游戏对象（gameObject）。

本文介绍如何创建可在 Unity 编辑器中设置属性的 C# 脚本，并介绍如何在 Unity 编辑器中设置它们。

---

<div id="toc"></div>

## 简单的 C# 脚本

本文的例子取自于我的另一篇博客：

- [Unity3D 入门：最简单的控制视角，以及控制角色前进、转向的脚本 - walterlv](/post/unity-starter-handle-base-player-input-for-movement.html)

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

## 公开字段

只需要将脚本的字段设为 `public`，Unity 编辑器便能识别出这些字段以及它们的类型，然后允许你在 Inspector 中编辑它们。

![在 Inspector 中设置公开字段的值](/static/posts/2020-05-05-16-14-41.png)

注意，Inspector 中不会识别属性，更不会识别方法。所以要公开，必须使用“字段”。

## 在哪里修改值

Unity 编辑器会在每次重新激活编辑器窗口的时候重新加载 Unity 项目。因此，当你在 Visual Studio 或其他编辑器中新编写了公开字段后，回到 Unity 编辑器中便会识别到这些字段，然后显示出来。

值得注意的是，这个时候就已经记录了此脚本在此游戏对象中的值。也就是说，此后无论你如何在脚本中修改公开字段的值，运行游戏都不会有变化，因为游戏开始后，就会用你在编辑器中设置的值（虽然不是手工设的）覆盖脚本中编写的默认值。

要修改，还是需要在 Inspector 中去修改值。

## 有趣的名称

按照 Unity C# 脚本的编写规范，公开的字段也是按 `camelCase` 命名的。当然，你也可以用 `PascalCase` 命名也不会有什么识别上的问题。

不过，无论你用什么命名，Inspector 中都会将你的名称拆开成多个单词，并首字母大写。

更有趣的是，如果你使用了一些预设的字段名称，那么 Inspector 中会显示成预设的名称。典型的是命名成 `Name` 的时候，Inspector 中会显示“名称”（如果你装了中文语言包的话）。
