---
layout: post
title: "深入了解 WPF Dispatcher 的工作原理（PushFrame 部分）"
date: 2017-09-26 01:03:54 +0800
categories: post wpf
keywords: dotnet wpf dispatcher PushFrame
description: 了解 Dispatcher.PushFrame 方法的作用和背后的实现原理。
---

深耕 WPF 开发的各位程序员大大们一定避不开使用 Dispatcher，就算没怎么直接接触也间接地用到了它。例如我们经常使用 `Window` 的 `ShowDialog` 方法。为什么它能做到“看似阻塞了 UI 线程”，实则又能够让 UI 线程正常响应呢？因为内部使用到了 `Diaptcher.PushFrame`。它在背后究竟做了什么使得能够在不卡死当前线程的情况下好像阻塞了一个方法的继续执行一样。

阅读本文将更深入地了解 Dispatcher 的工作机制。

---

本文是**深入了解 WPF Dispatcher 的工作原理**系列文章的一部分：

- [Invoke/InvokeAsync 部分](/post/wpf/2017/09/26/dispatcher-invoke-async.html)
- [PushFrame 部分](/post/wpf/2017/09/26/dispatcher-push-frame.html)（本文）

### Dispatcher.PushFrame 是什么？

在你写下如下代码的时候，有没有好奇过为什么写 `ShowDialog` 的地方可以等新开的窗口返回之后继续执行呢？

```csharp
var w = new FooWindow();
w.ShowDialog();
Debug.WriteLine(w.Bar);
```

有人可能会说是阻塞了 UI 线程。可是随便想想就会不对，因为弹出的新窗口中所有的事件也都是在 UI 线程中执行的。如果 UI 线程阻塞，为什么这些事件可以执行？

进入 `ShowDialog` 方法内部探索，不难找到“阻塞”的根源——`Dispatcher.PushFrame`。

### PushFrame 的实现原理



#### 参考资料

- PushFrame
  - [Dispatcher.cs](http://referencesource.microsoft.com/#WindowsBase/Base/System/Windows/Threading/Dispatcher.cs)
  - [c# - For what is PushFrame needed? - Stack Overflow](https://stackoverflow.com/questions/41759665/for-what-is-pushframe-needed)
  - 
