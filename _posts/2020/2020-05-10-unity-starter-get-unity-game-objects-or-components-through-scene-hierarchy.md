---
title: "Unity3D 入门：如何在脚本中找到游戏对象的父子级/祖孙级对象和它们的组件"
publishDate: 2020-05-05 09:17:37 +0800
date: 2020-05-10 15:34:05 +0800
tags: unity
position: starter
---

在真正能玩的游戏场景中，很多脚本的执行是在不确定的游戏对象上进项的，于是会考虑在父对象或者子对象上去写脚本。这时，可能需要查找游戏对象。那么如何在脚本中找到父子游戏对象（gameObject）呢？

---

<div id="toc"></div>

## 场景

如下图所示，`Windows` 游戏对象下面可能有很多不确定数量和位置的游戏对象，需要操作它们。

![游戏场景](/static/posts/2020-05-10-15-16-04.png)

在为游戏对象创建脚本的时候，这个脚本中的类会继承自 `MonoBehavior`：

```csharp
using UnityEngine;

public class WindowUpdater : MonoBehaviour
{
    void Start()
    {
    }

    void Update()
    {
    }
}
```

## 找父组件/子组件

`MonoBehavior` 直接提供了查找父子组件的方法 `GetComponent(s)` / `GetComponent(s)InParent` 和 `GetComponent(s)InChildren`，因此直接调用即可。对于泛型方法，每个子对象只会找到一个组件，所以通常适用于子组件非常简单的场景。

```csharp
var renderers = GetComponentsInChildren<Renderer>();
for (var i = 0; i < renderers.Length; i++)
{
    var texture = textures[i];
    renderers[i].material.mainTexture = texture;
}
```

## 找父对象/子对象

`MonoBehavior` 并没有提供直接查找父子对象的方法。

但是 `Transform` 有！

所以，通过 `Transform` 可以间接获取到子对象。`GetChild()` `GetChildCount`。

```csharp
var transform = GetComponent<Transform>();
for (int i = 0; 0 < renderers.Length; i++)
{
    transform.GetChild(i).gameObject.SetActive(true);
}
```
