---
title: ".NET/C# 利用 Walterlv.WeakEvents 高性能地定义和使用弱事件"
date: 2019-09-18 22:05:55 +0800
tags: dotnet csharp
position: knowledge
permalink: /posts/implement-custom-dotnet-weak-event.html
---

弱引用是 .NET 引入的概念，可以用来协助解决内存泄漏问题。然而事件也可能带来内存泄漏问题，是否有弱事件机制可以使用呢？.NET 没有自带的弱事件机制，但其中的一个子集 WPF 带了。然而我们不是什么项目都能引用 WPF 框架类库的。

本文介绍 Walterlv.WeakEvents 库来定义和使用弱事件。

---

<div id="toc"></div>

系列博客：

- [.NET/C# 利用 Walterlv.WeakEvents 高性能地定义和使用弱事件](/post/implement-custom-dotnet-weak-event)
- [.NET/C# 利用 Walterlv.WeakEvents 高性能地中转一个自定义的弱事件（可让任意 CLR 事件成为弱事件）](/post/implement-custom-dotnet-weak-event-relay)
- [.NET 设计一套高性能的弱事件机制](/post/design-a-dotnet-weak-event-relay)

## 下载安装 Walterlv.WeakEvents

在你需要做弱事件的项目中安装 NuGet 包：

- [Walterlv.WeakEvents](https://www.nuget.org/packages/Walterlv.WeakEvents/)

## 定义弱事件

现在，定义弱事件就不能直接写 `event EventHandler Bar` 了，要像下面这样写：

```csharp
using System;
using Walterlv.WeakEvents;

namespace Walterlv.Demo
{
    public class Foo
    {
        private readonly WeakEvent<EventArgs> _bar = new WeakEvent<EventArgs>();

        public event EventHandler Bar
        {
            add => _bar.Add(value, value.Invoke);
            remove => _bar.Remove(value);
        }

        private void OnBar() => _bar.Invoke(this, EventArgs.Empty);
    }
}
```

## 使用弱事件

对于弱事件的使用，就跟以前任何其他正常事件一样了，直接 `+=` 和 `-=`。

这样，如果我有一个 `A` 类的实例 `a`，订阅了以上 `Foo` 的 `Bar` 事件，那么当 `a` 脱离作用范围后，将可以被垃圾回收机制回收。而如果不这么做，`Foo` 将始终保留对 `a` 实例的引用，这将阻止垃圾回收。

