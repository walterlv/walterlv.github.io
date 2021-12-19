---
title: "通过解读 WPF 触摸源码，分析 WPF 插拔设备触摸失效的问题（问题篇）"
publishDate: 2018-08-15 15:42:08 +0800
date: 2018-08-19 19:09:56 +0800
tags: wpf windows
version:
  current: 中文
versions:
  - 中文: #
  - English: /post/wpf-touch-fails-when-tablet-device-changed-en.html
permalink: /posts/wpf-touch-fails-when-tablet-device-changed.html
---

在 .NET Framework 4.7 以前，WPF 程序的触摸处理是基于操作系统组件但又自成一套的，这其实也为其各种各样的触摸失效问题埋下了伏笔。再加上它出现得比较早，触摸失效问题也变得更加难以解决。即便是 .NET Framework 4.7 以后也需要开发者手动开启 `Pointer` 消息，并且存在兼容性问题。

本文将通过解读 WPF 触摸部分的源码，分析 WPF 插拔设备触摸失效的问题。随后，会给微软报这个 Bug。

---

This post is written in **multiple languages**. Please select yours:

{% include post-version-selector.html %}

所谓“触摸失效”，指的是无论你如何使用手指或触摸笔在触摸屏上书写、交互，程序都没有任何反应。而使用鼠标操作则能正常使用。

- 本文所述的“触摸失效问题”我在 [WPF 程序无法触摸操作](/wpf/2017/09/12/touch-not-work-in-wpf.html) 一文中有所提及，但本文偏向于分析其内部发生的原因。

- 本文与 [林德熙](https://blog.lindexi.com/) 的 [WPF 插拔触摸设备触摸失效](https://blog.lindexi.com/post/WPF-%E6%8F%92%E6%8B%94%E8%A7%A6%E6%91%B8%E8%AE%BE%E5%A4%87%E8%A7%A6%E6%91%B8%E5%A4%B1%E6%95%88.html) 所述的是同一个问题。那篇文章会更多的偏向于源码解读，而本文更多地偏向于分析触摸失效的过程。

---

<div id="toc"></div>

## WPF 程序插拔设备导致触摸失效问题

无论你写的 WPF 程序多么简单，哪怕只有一个最简单的窗口带着一个可以交互的按钮，本文所述的触摸失效问题你都可能遇到。

具体需要的条件为：

1. 运行 **任意的 WPF 程序**
1. **插拔带有触摸的 HID 设备**（可以是物理插拔，也可以是驱动或软件层面的插拔）

以上虽说是必要条件，但如果要提高触摸失效的复现概率，需要制造一个较高的 CPU 占用：

- 当前系统中有 **较高的 CPU 占用率**

可能还有一些尚不确定的条件：

- 是否对 .NET Framework 的版本有要求？
- 是否对 Windows 操作系统的版本有要求？

将以上所有条件组合起来，对于触摸失效的问题描述为：

- 当运行任意的 WPF 程序时，如果此时操作系统有较高的 CPU 占用，并且此时存在带有触摸的 HID 设备插拔，那么此 WPF 程序可能出现“触摸失效”问题，即此后此程序再也无法触摸操作了。
- 如果此时系统中同时运行了多个 WPF 程序，多个 WPF 程序可能都会在此时出现触摸失效问题。

## 触摸失效原因初步分析

WPF 从收集设备触摸到大多数开发者所熟知的 `Stylus` 和 `Mouse` 事件需要两个不同的线程完成。

1. 主线程，负责进行 Windows 消息循环
1. StylusInput 线程，负责从 WPF 非托管代码和 COM 组件中获得触摸信息

主线程中的 Windows 消息循环处理这些消息：

- LBUTTONDOWN, LBUTTONUP
- DEVICECHANGE, TABLETADDED, TABLETREMOVED

Stylus Input 线程主要由 `PenThreadWorker` 类创建，在线程循环中使用 `GetPenEvent` 和 `GetPenEventMultiple` 这两个函数来获取整个触摸设备中的触摸事件，并将触摸的原始信息向 WPF 的其他触摸处理模块传递。传递的其中一个模块是 `WorkerOperationGetTabletsInfo` 类，其的 `OnDoWork` 方法中会通过 COM 组件获取触摸设备个数。

而导致触摸失效的错误代码就发生在以上 Stylus Input 线程的处理中。

1. `PenThreadWorker` 的 `GetPenEventMultiple` 方法传入的 `_handles` 为空数组，这会导致进行无限的等待。
1. `WorkerOperationGetTabletsInfo` 的 `OnDoWork` 因为 COM 组件错误出现 `COMException` 或因为线程安全问题出现 `ArgumentException`；此时方法内部会 `catch` 然后返回空数组，这使得即时存在触摸设备也会因此而识别为不存在。

为了方便理解以上的两个 Bug，可以看看我简化后的 .NET Framework 源码：

```csharp
// PenThreadWorker.ThreadProc
while(这里是两层循环，简化成一个以便理解)
{
    // 以下的 break 都只退出一层循环而已。
    if (this._handles.Length == 1)
    {
        if (!GetPenEvent(this._handles[0], 其他参数))
        {
            break;
        }
    }
    else if (!GetPenEventMultiple(this._handles, 其他参数))
    {
        break;
    }
    // 后续逻辑。
}
```

```csharp
// WorkerOperationGetTabletsInfo.OnDoWork
try
{
    _tabletDeviceInfo = PenThreadWorker.GetTabletInfoHelper(pimcTablet);
}
catch(COMException)
{
    _tabletDevicesInfo = new TabletDeviceInfo[0];
}
catch(ArgumentException)
{
    _tabletDevicesInfo = new TabletDeviceInfo[0];
}
// 其他异常。
```

以上的问题分析中，`ArgumentException` 异常几乎可以肯定是线程安全问题所致；`COMException` 不能确定；而 `GetPenEventMultiple` 中的参数 `handles` 实际上是用来进行非托管和托管代码线程同步用的 `ResetEvent` 集合，所以实际上也是线程同步问题导致的死锁。

同时联系以上必要复现步骤中，如果当前存在高 CPU 占用则可以大大提高复现概率；我们几乎可以推断，此问题是 WPF 对触摸的处理存在线程安全的隐患所致。

## 此触摸失效问题的解决方法

在推断出初步原因后，根本的解决方法其实只剩下两个了：

1. 修复 WPF 的 Bug
    - 由于我们无法编译 .NET Framework 的源码，所以几乎只能由微软来修复这个 Bug，即需要新版本的 WPF 来解决这个线程安全隐患
    - 当然，此问题的修复可以跟随 .NET Framework 更新，也可以跟随即将推出的 .NET Core 3 进行更新。
1. 更新 Windows（传说中的补丁）
    - 新的 Windows 提供给 WPF 的 COM 组件可能也需要修复线程安全或其他与触摸硬件相关的问题

比较彻底的方案是以上两者都需要修复，但都 **只能由微软来完成**。

那我们非微软开发者可以做些什么呢？

1. 降低 CPU 占用率
    - 虽然这不由我们控制，不过我们如果能降低一些意料之外的高 CPU 占用，则可以大幅降低 WPF 触摸失效问题出现的概率。

然而作为用户又可以做些什么呢？

1. 重新插拔触摸设备（如果你的触摸框是通过 USB 连接可以手工插拔的话）

## 触摸失效问题的分析过程

以上结论的得出，离不开对 .NET Framework 源码的解读和调试。

由于 WPF 的触摸原理涉及到较多类型和源码，需要大量篇幅描述，所以不在本文中说明。阅读以下文章可以更加深入地了解这个触摸失效的问题：

- [WPF 插拔触摸设备触摸失效 - lindexi](https://blog.lindexi.com/post/WPF-%E6%8F%92%E6%8B%94%E8%A7%A6%E6%91%B8%E8%AE%BE%E5%A4%87%E8%A7%A6%E6%91%B8%E5%A4%B1%E6%95%88.html)
- [通过解读 WPF 触摸源码，分析 WPF 插拔设备触摸失效的问题（分析篇） - walterlv](/post/analyze-wpf-losting-touch-when-tablet-device-changed)

本文所有的 .NET Framework 源码均由 [dnSpy](https://github.com/0xd4d/dnSpy) 反编译得出，分析过程也基本是借助 dnSpy 的无 pdb 调试特性进行。关于 dnSpy 的更多使用，可以阅读：

- [断点调试 Windows 源代码 - lindexi](https://blog.lindexi.com/post/%E6%96%AD%E7%82%B9%E8%B0%83%E8%AF%95-Windows-%E6%BA%90%E4%BB%A3%E7%A0%81.html)
- [神器如 dnSpy，无需源码也能修改 .NET 程序 - walterlv](/post/edit-and-recompile-assembly-using-dnspy)

