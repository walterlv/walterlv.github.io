---
title: "用 dotTrace 进行性能分析时，各种不同性能分析选项的含义和用途"
publishDate: 2018-11-12 16:14:37 +0800
date: 2018-11-28 16:25:46 +0800
tags: dotnet
coverImage: /static/posts/2018-11-12-15-29-04.png
permalink: /post/dottrace-profiler-options.html
---

对 .NET 程序进行性能分析，dotTrace 能应对绝大多数的场景。在开启一个进程进行性能分析之前，我们会看到一些性能分析选项（Profiler Options）。本文将介绍这几个选项的含义，并用实际的例子来说明其用途。

---

<div id="toc"></div>

## dotTrace 的性能分析选项

你可以前往 [Download dotTrace: .NET Performance Profiler by JetBrains](https://www.jetbrains.com/profiler/download/) 下载 dotTrace。

本文要说的就是下图右边的那四个选项，在启动一个进程进行性能分析之前可以看得见的。

![dotTrace 启动进程进行性能分析的界面](/static/posts/2018-11-12-15-29-04.png)  
▲ dotTrace 启动进程进行性能分析的界面

有四个选项：

- Sampling
- Tracing
- Line-by-Line
- Timeline

## Sampling 采样

界面中的描述为：

> Accurate measurement of call time. Optimal for most use cases.

使用此选项进行启动进程后，会准确测量不同方法的执行时间，但不会统计方法的调用次数。

这适用于大多数场景。尤其是如果你还没有对你的程序进行过任何性能分析的情况下，先使用这个选项进行一个初步分析大致确定性能问题是很方便的。

## Tracing 追踪

界面中的描述为：

> Accurate measurement of calls number. Optimal for analyzing algorithm complexity.

会准确地测量调用次数。但在此选项下，时间的测量将由于性能分析的开销过大而可能不准确。

如果你使用 Sampling 分析方式得不到你想要的性能分析数据的时候，你可能用得到此选项。例如，当你分析算法复杂度，需要明确知道方法的调用次数，而不需要知道方法的准确执行时间的时候。

## Line-by-line 逐行

界面中只写了一句根本无法理解的话：

> Advanced use cases only.

仅仅说了这是高级使用场景，名没有说什么样的场景。

这个选项下，分析器会测量每行代码。由于性能分析的开销过于巨大，调用时间的测量也是不准确的。如果要降低此选项下的开销，你可以使用过滤器仅分析特定的方法。关于使用过滤器，可以阅读官方文档 [Profiler Options - Help - dotTrace](https://www.jetbrains.com/help/profiler/Profiler_Options.html#filters)。

当你已经通过其他方法得知性能问题出现在哪个具体的方法时你可能需要用到这个选项，这会分析此方法的每一行代码。

## Timeline 时间线

界面中的描述为：

> Measurement of temporal performance data. Optimal for most use cases including analysis of multi-threaded applications.

收集有关线程状态、应用程序事件和其他多线程数据的时态数据。此方法基于 Windows 的事件跟踪器（ETW）。

推荐用于大多数情况，尤其是分析多线程应用程序的时候。你可以用这个选项来确定 UI 卡顿或不响应的原因，可以分析过多的 GC（垃圾回收），可以分析不均匀的工作负载分配、IO 不足或者其他各种异常。

由于需要用到 Windows 的事件跟踪器（ETW），所以你可能遭遇 ETW 相关的问题。具体可以阅读 [用 dotTrace 进行性能分析时，Timeline 打不开？无法启动进程？也许你需要先开启系统性能计数器的访问权限](/post/dottrace-timeline-not-working)。

---

**参考资料**

- [Profiler Options - Help - dotTrace](https://www.jetbrains.com/help/profiler/Profiler_Options.html)


