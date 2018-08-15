---
title: "WPF Applications Stop Responding to Touches after Adding or Removing Tablet Devices"
date: 2018-08-15 15:42:00 +0800
categories: wpf windows
version:
  current: English
versions:
  - 中文: /post/wpf-touch-fails-when-tablet-device-changed.html
  - English: #
---

WPF framework handles touch devices and events mostly using its own code and COM components instead of using the windows message loop. Unfortunately, there may be some bugs in the WPF touch handling codes. So we sometimes suffer from the WPF touch failures. This changes after Microsoft introducing .NET Framework 4.7, but the developers have to switch on the `Pointer` message manually with some compliant issues.

In this article, I'll post some codes of WPF to present its potential bugs of touch failure.

---

This post is written in **multiple languages**. Please select yours:

{% include post-version-selector.html %}

<div id="toc"></div>

### The touch failure issue

Even if you write a very simple WPF application which contains only a button, you'll be suffering from the touch failure issue.

What you need is:

1. Run any **WPF application**
1. Keep plugging and unplugging a USB HID tablet device

The actions above helps reproduce touch failure with a small probability. But if you want a larger probability, you should:

- Make a high CPU usage

Probably there may be other conditions such as the .NET Framework version and the Windows version but I'm not sure.

When you put them together, you'll get a full touch failure issue description.

- Run any WPF application with a high CPU usage, and then keep plugging and unplugging a USB HID tablet device, you'll get the WPF application which stops responding to touches.
- If multiple WPF applications are running at the same time, most of them will lose touch.

### Preliminary analysis of the touch failure

WPF use two different threads to collect touch information from tablet devices and convert them to the `Stylus` and `Mouse` event that most of us are familiar to.

1. The *Main* thread of WPF. WPF use windows message loop on this thread to handle mouse message and device change message.
1. The *Stylus Input* thread. WPF run the unmanaged code and call COM component to collect device information and touch information.

The WPF stylus code uses the windows message loop to handle these messages:

- LBUTTONDOWN, LBUTTONUP
- DEVICECHANGE, TABLETADDED, TABLETREMOVED

The *Stylus Input* thread is created by the `PenThreadWorker` class. The `PenThreadWorker` call `GetPenEvent` and `GetPenEventMultiple` in the thread loop to fetch the whole touch events of tablet devices and then it will pass the raw touch data to other touch modules to translate them into regular Stylus/Touch/Mouse events. One of the touch modules is the `WorkerOperationGetTabletsInfo` class which contains an `OnDoWork` method to fetch tablet device count through COM components.

The touch failure comes from the code of the Stylus Input thread.

1. An empty `_handles` array is passed into the `GetPenEventMultiple` method of `PenThreadWorker` and this action may cause infinite waiting.
1. A `COMException` or `ArgumentException` may happen when the `OnDoWork` of `WorkerOperationGetTabletsInfo` is running. This method will catch the exceptions and returns an empty array which will cause the WPF application get empty tablet devices by mistake even if there are tablet devices in actual.

I've simplified the core .NET Framework code of the stylus handling above. You may understand what I mean more clearly by reading these codes:


```csharp
// PenThreadWorker.ThreadProc
while(There are two loops in real)
{
    // The `break` below only exit one loop, not two.
    if (this._handles.Length == 1)
    {
        if (!GetPenEvent(this._handles[0], otherArgs))
        {
            break;
        }
    }
    else if (!GetPenEventMultiple(this._handles, otherArgs))
    {
        break;
    }
    // Other logics.
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
// Other exception handling.
```

I can definitely sure that the `ArgumentException` is the result of the thread-safety issue but I'm not sure whether `COMException` is the same. The `handles` argument is the handles of `ResetEvent`s which are used for the thread syncing between managed code and unmanaged code. So the infinite waiting of `GetPenEventMultiple` is actually a deadlock which is also a thread-safety issue.

Remember that we can make a high CPU usage to increase the probability of reproduction, we can infer that the touch failure issue is caused by the thread-safety issue of WPF stylus handling.

### The solutions to the touch failure

After inferring the preliminary reason, there are only two fundamental solutions left for us:

1. Fix the bug of WPF
    - Only Microsoft can fix this kind of bugs because we cannot rebuild WPF all by our selves.
    - Of course, this kind of patch can be introduced in .NET Framework, or be introduced in the WPF on .NET Core 3.
1. Fix the bug of Windows
    - The COM components provided for WPF may need an update to fix the thread-safety issue or other tablet devices issues.

A more thorough solution is that both of them need to be fixed, but **both can only be done by Microsoft**.

So what can we non-Microsoft developers do?

1. Reduce CPU usage
    - Although this is not controlled by us, if we can reduce some unexpected high CPU usage, we can greatly reduce the probability of WPF touch failure.
  
But what can I do if I'm only a normal user?

1. Re-plug the touch device (if your touch frame can be manually plugged in via USB connection)

### The details analysis for the touch failure

The above conclusions come from the reading and debugging of the .NET Framework source code.

Since WPF touch details involve more types and source code which requires a lot of descriptions, so it is not explained in this article. Read the following article to get a deeper understanding of the touch failure (all of the links are under translating):

- [WPF 插拔触摸设备触摸失效 - lindexi](https://lindexi.gitee.io/post/WPF-%E6%8F%92%E6%8B%94%E8%A7%A6%E6%91%B8%E8%AE%BE%E5%A4%87%E8%A7%A6%E6%91%B8%E5%A4%B1%E6%95%88.html)
- [通过解读 WPF 触摸源码，分析 WPF 插拔设备触摸失效的问题（分析篇） - walterlv](/post/analyze-wpf-losting-touch-when-tablet-device-changed.html)

All of the .NET Framework source code in this article is decompiled by [dnSpy](https://github.com/0xd4d/dnSpy), and the analysis process is basically based on the dnSpy's no-PDB debugging feature.
