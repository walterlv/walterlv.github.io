---
layout: post
title: "WPF 渲染系统（WPF Render System）"
date: 2017-01-16 14:50:00 +0800
tags: wpf
permalink: /wpf/2017/01/16/wpf-render-system.html
keywords: wpf render
description: 通过添加移除视觉树一步步跟踪微软源码，了解渲染系统背后的故事。
---

一个朋友问我：“为什么几千个 `Visual` 在视觉树上，增加删除几个能够那么快地渲染出来？”这个问题问倒我了，因为我对 WPF 渲染系统的了解很少，更不知道渲染部分和 UI 逻辑部分是如何分工的。  
在此机会下，我毫不犹豫地打开 [https://referencesource.microsoft.com/](https://referencesource.microsoft.com/) 阅读 WPF 的源码。

---

对**探索源码**章节不感兴趣的读者，可以直接跳到后面**大胆猜想**与**理论依据**章节。



## 探索源码

虽然知道 [referencesource](https://referencesource.microsoft.com/) 上有源码，但从哪个类哪个方法开始也是个问题。

#### 寻找入口

既然是添加、移除视觉树节点，那么应该在这几个类中找得到相关方法：`Visual`、`VisualTreeHelper`、`VisualCollection`。试着找了下 `VisualTreeHelper`，结果只有各种 `Get` 方法；找了下 `VisualCollection`，结果找到了。

```CSharp
public int Add(Visual visual)
{
    // …… （省略部分）
    if (visual != null)
    {
        ConnectChild(addedPosition, visual);
    }
    // …… （省略部分）
}
```

依此为突破口，应该能一层层找到渲染 `Visual` 部分的代码吧！

#### 层层进入

我们看看 `ConnectChild` 方法，随后一层层进入。

```CSharp
private void ConnectChild(int index, Visual value)
{
    // …… （省略部分）
    _owner.InternalAddVisualChild(value);
}
```

其中，`_owner` 是 `Visual` 类型。

```CSharp
internal void InternalAddVisualChild(Visual child)
{
    this.AddVisualChild(child);
}
```

接下来就不那么顺利了，因为 `AddVisualChild` 方法进去后发现仅设置了标志位，再没有执行实质性的方法。这下杯具了，此路不通。但是 `AddVisualChild` 方法旁边还有个 `RemoveVisualChild` 方法，顺手看了下，居然有实质性方法：

```CSharp
protected void RemoveVisualChild(Visual child)
{
    // …… （省略部分）
    for (int i = 0; i < _proxy.Count; i++)
    {
        DUCE.Channel channel = _proxy.GetChannel(i);

        if (child.CheckFlagsAnd(channel, VisualProxyFlags.IsConnectedToParent))
        {
            child.SetFlags(channel, false, VisualProxyFlags.IsConnectedToParent);
            DUCE.IResource childResource = (DUCE.IResource)child;
            childResource.RemoveChildFromParent(this, channel);
            childResource.ReleaseOnChannel(channel);
        }
    }
    // …… （省略部分）
}
```

注意到 `childResource.RemoveChildFromParent(this, channel);` 的调用方是 `childResource`，而它是从 `Visual` 强转的 `DUCE.IResource` 接口对象。由于我们要了解的是实现细节，直接点开接口是看不到的，所以，得看看到底是谁实现了这个接口。既然是 `Visual` 强转得到，那么确定是 `Visual` 实现。但必须要强转才能调用，这不得不让我怀疑“Visual 类[显式实现](https://msdn.microsoft.com/en-us/library/ms173157.aspx)了接口 `DUCE.IResource`”。    
于是，我在浏览器中按下 `Ctrl`+`F`，搜素 `RemoveChildFromParent`，结果不出所料：

```CSharp
/// <summary>
/// Sends a command to compositor to remove the child
/// from its parent on the channel.
/// </summary>
void DUCE.IResource.RemoveChildFromParent(
        DUCE.IResource parent,
        DUCE.Channel channel)
{
    DUCE.CompositionNode.RemoveChild(
        parent.GetHandle(channel),
        _proxy.GetHandle(channel),
        channel);
}
```

其实我们可以继续去看 `RemoveChild` 方法，但注释却让我感到意外。

> Sends a command to compositor to remove the child from its parent on the channel.
> 在 channel 中向 compositor 发送一个移除视觉子级的命令。

莫非到头来都不会真实地执行任何渲染相关的方法？channel 是什么？compositor 又是什么？一个一个调查！

#### 查到最后

`RemoveChild` 方法如下，果不其然，真的只是在通道中发送了一条移除视觉子级的命令。

```CSharp
/// <SecurityNote>
///     Critical: This code accesses an unsafe code block
///     TreatAsSafe: Operation is ok to call. It does not return any pointers and sending a pointer to a channel is safe
/// </SecurityNote>
[SecurityCritical, SecurityTreatAsSafe]
internal static void RemoveChild(
    DUCE.ResourceHandle hCompositionNode,
    DUCE.ResourceHandle hChild,
    Channel channel)
{
    DUCE.MILCMD_VISUAL_REMOVECHILD command;

    command.Type = MILCMD.MilCmdVisualRemoveChild;
    command.Handle = hCompositionNode;
    command.hChild = hChild;

    unsafe
    {
        channel.SendCommand(
            (byte*)&command,
            sizeof(DUCE.MILCMD_VISUAL_REMOVECHILD)
            );
    }
}
```

channel 是 `DUCE.Channel` 类型的，在 msdn 上搜索 `DUCE.Channel` 没有得到正式的定义，但是搜到的一篇文章却间接地描述了它的用途。

> [WPF Render Thread Failures](https://blogs.msdn.microsoft.com/dsui_team/2013/11/18/wpf-render-thread-failures/)
> The render thread only synchronizes with the UI thread in a few locations, so the callstacks above are typically where you *notice the problem, not where it actually occurred*. The most common locations when they synchronize are when a window’s settings are updated (size, position, etc.) or as a result of the UI thread handling a “channel” message from DirectX.  
> 渲染线程只在少数几处与 UI 线程进行同步，这也是为什么你看到的堆栈信息是这么几处，而不是真实发生错误的代码。通常进行线程同步的几个地方是 window 的尺寸、位置等发生变换时或者 UI 线程从 DirectX 处理通道中的消息时。

从原文中的错误堆栈中和上文里面我们可以知道 channel 是用来让 UI 线程和渲染线程进行通信的通道。

记得刚开始 `AddVisualChild` 方法中没有找到相关方法吗？想知道为什么。于是我又通过 `DUCE.Channel` 反向查找，最终发现对应的方法其实在 `Visual.Render` 方法中。

```CSharp
internal void Render(RenderContext ctx, UInt32 childIndex)
{
    // …… （省略部分）
    DUCE.CompositionNode.InsertChildAt(
        ctx.Root,
        _proxy.GetHandle(channel),
        childIndex,
        channel);
    // …… （省略部分）
}
```

## 大胆猜想

继续找，发现 `DUCE.Channel` 类型中只有发送/提交命令的方法，没有获取命令的方法；而且发送命令执行的都是非托管代码。而如果获取命令的方法也是托管代码，那么 `DUCE.Channel` 中一定有方法获取到命令的。所以，大胆猜测，获取方法仅在非托管代码中实现。也就是说，UI 线程由托管代码实现，但视觉树改变后仅发送一个命令通知渲染线程实现，而渲染线程由非托管代码实现。

## 理论依据

Google 搜索“WPF Render”关键字，我找到了这篇文章：
[A Critical Deep Dive into the WPF Rendering System](https://jeremiahmorrill.wordpress.com/2011/02/14/a-critical-deep-dive-into-the-wpf-rendering-system/)

从这篇文章中，得到了很多 WPF 渲染系统的启发，这也许能解释本文开始的一部分现象。
