---
title: "Visual Studio 也开始支持 Ctrl 点击跳转了，于是需要解决跟 ReSharper 的冲突"
date: 2017-11-07 15:55:11 +0800
tags: visualstudio
coverImage: /static/posts/2017-11-07-15-54-22.png
---

微软在 2017年10月9日 发布了 Visual Studio 2017 version 15.4.0。而这个版本带来了大家期待已久的 Ctrl+Click 跳转到定义的功能。然而……ReSharper 也是这样的快捷键，也是这样的功能！！！

居然冲突了啊，怎么办？

---

这里可以阅读发布日志：[Visual Studio 2017 15.4 Release Notes](https://www.visualstudio.com/en-us/news/releasenotes/vs2017-relnotes)。

> Editor
> - We added the popular Productivity Power Tools navigation feature **Control Click Go To Definition** to the core Visual Studio product.
>   - For supported languages (currently C#, VB and Python, with more languages coming in future releases), holding down the **Ctrl** key will allow you to click on a symbol in the Visual Studio editor and navigate to its definition.
>   - If you prefer to keep the older **Ctrl+Click** word selection behavior, you can control the feature’s key usage via **Tools > Options > Text Editor > General > Enable mouse click to perform Go To Definition**, which lets you select other modifier keys, or turn off the feature if you wish.

---

所以 Visual Studio 和 ReSharper 开始冲突，具体表现为，点击跳转到定义后，如果鼠标在转到定义之后刚好还落在另一个单词上，那么还会跳转到那个新的单词，非常恶心！

只恶心自己就好了，为了防止恶心到大家，我找了几天，终于分别找到了 Visual Studio 和 ReSharper 两者的设置项。如下图，关掉一个就好了。

![Visual Studio 和 ReSharper 中的设置](/static/posts/2017-11-07-15-54-22.png)

