---
layout: post
title: "深入了解 WPF Dispatcher 的工作原理（PushFrame 部分）"
date: 2017-09-26 01:00:33 +0800
categories: post wpf
keywords: dotnet wpf dispatcher PushFrame
description: 
---

深耕 WPF 开发的各位程序员大大们一定避不开使用 Dispatcher，就算没怎么直接接触也间接地用到了它。例如我们经常使用 `Window` 的 `ShowDialog` 方法。为什么它能做到“看似阻塞了 UI 线程”，实则又能够让 UI 线程正常响应呢？因为内部使用到了 `Diaptcher.PushFrame`。它在背后究竟做了什么使得能够在不卡死当前线程的情况下好像阻塞了一个方法的继续执行一样。

阅读本文将更深入地了解 Dispatcher 的工作机制。

---

本文是**深入了解 WPF Dispatcher 的工作原理**系列文章的一部分：

- [Invoke/InvokeAsync 部分](/post/wpf/2017/09/26/dispatcher-invoke-async.html)
- [PushFrame 部分](/post/wpf/2017/09/26/dispatcher-push-frame.html)（本文）

### Dispatcher.PushFrame 是什么？

