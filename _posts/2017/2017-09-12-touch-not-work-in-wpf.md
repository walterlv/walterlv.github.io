---
layout: post
title: "WPF 程序无法触摸操作"
date_published: 2017-09-12 07:34:00 +0800
date: 2017-12-20 23:10:18 +0800
categories: wpf
permalink: /wpf/2017/09/12/touch-not-work-in-wpf.html
description: WPF 程序可能出现各种各样的触摸失效的问题，这里进行了一些总结。
---

WPF 自诞生以来就带着微软先生的傲慢。微软说 WPF 支持触摸，于是 WPF 就真的支持触摸了。对，我说的是“支持触摸”，那种摸上去能点能动的；偶尔还能带点儿多指的炫酷效果。但是，WPF 推出那会儿，绝大部分开发者都还没有触摸屏呢，开发个程序要怎么验证支不支持触摸呢？微软先生无奈地决定——你写鼠标的代码就好了，我帮你转换！于是……一大波 BUG 袭来……

---

### WPF 的触摸失效有三种可能：

1. 触摸下 Stylus/Touch 事件正常触发，但不提升为 Mouse 事件；导致仅使用 Mouse 事件的控件无法使用
1. 触摸下无 Stylus/Touch 事件，也不提升为 Mouse 事件，但鼠标下有 Mouse 事件；导致整个界面完全无法触摸使用
1. 触摸下 Stylus/Touch 有触发，但触发点位置在 (0, 0) 处或上一个触摸点处；导致即使触发了，当前控件也收不到

### 第一种情况

使用触摸或者触笔操作时，如果 `Up` 事件中发生了任何异常，会导致 `StylusLogic.PostProcessInput` 的后续逻辑不会正确执行，
这就包括了用于清理触控资源的 StylusTouchDevice.OnDeactivate 方法。

而在 `StylusTouchDevice.OnDeactivate` 方法中，会重置 `StylusLogic.CurrentMousePromotionStylusDevice` 属性
为 `null` 或 `NoMousePromotionStylusDevice`。此方法不执行会直接导致 `StylusLogic.ShouldPromoteToMouse` 方法
对当前触控设备的判断出现错误，持续返回 `false`，即不会再执行触控转鼠标的逻辑，出现触摸无效的现象。

### 第二种情况

WPF 程序在启动期间，如果触摸组件发生了异常，极有可能会使得触摸根本就没有初始化成功！

比如，`System.Windows.Input.StylusLogic.RegisterStylusDeviceCore(StylusDevice stylusDevice)` 方法在启动时抛出 `System.InvalidOperationException`，虽然内部有 `catch`，但实际获取到的 `TabletDevice` 个数是 0 个，根本无法获取触摸设备，于是触摸无效。

或者，在 `WorkerOperationGetTabletsInfo.OnDoWork` 方法中，获取到了错误的触摸设备个数：

```csharp
IPimcManager pimcManager = UnsafeNativeMethods.PimcManager;
uint count;
pimcManager.GetTabletCount(out count);
```

### 第三种情况

如果 WPF 的 StylusUp 事件被阻断（例如 `e.Handled = true`，或者在 StylusUp 事件中弹出一个模态窗口），则下一次触摸时获取到的点坐标将是上一次被阻断时的点坐标。于是，阻断后的第一次点击必将点中之前点的那个点，而不管现在点中了什么。如果阻断时点在新窗口外，则几乎相当于触摸失效。
