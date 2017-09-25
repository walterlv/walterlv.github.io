---
layout: post
title: "深入了解 WPF Dispatcher 的工作原理（PushFrame 部分）"
date: 2017-09-26 02:08:46 +0800
categories: post wpf
keywords: dotnet wpf dispatcher PushFrame
description: 了解 Dispatcher.PushFrame 方法的作用和背后的实现原理。
---

在上一篇文章 [深入了解 WPF Dispatcher 的工作原理（Invoke/InvokeAsync 部分）](/post/wpf/2017/09/26/dispatcher-invoke-async.html) 中我们发现 `Dispatcher.Invoke` 方法内部是靠 `Dispatcher.PushFrame` 来确保“不阻塞地等待”的。然而它是怎么做到“不阻塞地等待”的呢？

阅读本文将更深入地了解 Dispatcher 的工作机制。

---

本文是**深入了解 WPF Dispatcher 的工作原理**系列文章的一部分：

1. [Invoke/InvokeAsync 部分](/post/wpf/2017/09/26/dispatcher-invoke-async.html)
1. [PushFrame 部分](/post/wpf/2017/09/26/dispatcher-push-frame.html)（本文）

### Dispatcher.PushFrame 是什么？

如果说上一篇文章 [深入了解 WPF Dispatcher 的工作原理（Invoke/InvokeAsync 部分）](/post/wpf/2017/09/26/dispatcher-invoke-async.html) 中的 `Invoke` 算是偏冷门的写法，那 `ShowDialog` 总该写过吧？有没有好奇过为什么写 `ShowDialog` 的地方可以等新开的窗口返回之后继续执行呢？

```csharp
var w = new FooWindow();
w.ShowDialog();
Debug.WriteLine(w.Bar);
```

看来我们这次有必要再扒开 `Dispatcher.PushFrame` 的源码看一看了。

### PushFrame 的实现原理



#### 参考资料

- PushFrame
  - [Dispatcher.cs](http://referencesource.microsoft.com/#WindowsBase/Base/System/Windows/Threading/Dispatcher.cs)
  - [c# - For what is PushFrame needed? - Stack Overflow](https://stackoverflow.com/questions/41759665/for-what-is-pushframe-needed)
  - 
