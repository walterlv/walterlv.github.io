---
layout: post
title: "WPF 程序无法触摸操作？我们一起来找原因和解决方法！"
publishDate: 2017-09-12 07:34:00 +0800
date: 2018-03-19 19:30:45 +0800
categories: wpf
permalink: /wpf/2017/09/12/touch-not-work-in-wpf.html
description: WPF 程序可能出现各种各样的触摸失效的问题，这里进行了一些总结。
---

WPF 自诞生以来就带着微软先生的傲慢。微软说 WPF 支持触摸，于是 WPF 就真的支持触摸了。对，我说的是“支持触摸”，那种摸上去能点能动的；偶尔还能带点儿多指的炫酷效果。但是，WPF 推出那会儿，绝大部分开发者都还没有触摸屏呢，开发个程序要怎么验证支不支持触摸呢？微软先生无奈地决定——你写鼠标的代码就好了，我帮你转换！于是……一大波 BUG 袭来……

---

<div id="toc"></div>

### WPF 触摸失效的分类

我将 WPF 的触摸失效总结成三种不同的类型。

1. 触摸下 Stylus/Touch 事件正常触发，但不提升为 Mouse 事件；导致仅使用 Mouse 事件的控件无法使用
1. 触摸下 Stylus/Touch 有触发，但触发点位置在 (0, 0) 处或上一个触摸点处；导致即使触发了，当前控件也收不到
1. 触摸下无 Stylus/Touch 事件，也不提升为 Mouse 事件，但鼠标下有 Mouse 事件；导致整个界面完全无法触摸使用

#### 第一种情况

使用触摸或者触笔操作时，如果 `Up` 事件中发生了任何异常，会导致 `StylusLogic.PostProcessInput` 的后续逻辑不会正确执行，这就包括了用于清理触控资源的 StylusTouchDevice.OnDeactivate 方法。需要注意的是：`Up` 事件不止是 `TouchUp` 或者 `StylusUp`，`MouseUp` 也会引发这样的触摸失效。

而在 `StylusTouchDevice.OnDeactivate` 方法中，会重置 `StylusLogic.CurrentMousePromotionStylusDevice` 属性为 `null` 或 `NoMousePromotionStylusDevice`。此方法不执行会直接导致 `StylusLogic.ShouldPromoteToMouse` 方法对当前触控设备的判断出现错误，持续返回 `false`，即不会再执行触控转鼠标的逻辑，出现触摸无效的现象。

#### 第二种情况

如果 WPF 的 StylusUp 事件被阻断（例如 `e.Handled = true`，或者在 StylusUp 事件中弹出一个模态窗口），则下一次触摸时获取到的点坐标将是上一次被阻断时的点坐标。于是，阻断后的第一次点击必将点中之前点的那个点，而不管现在点中了什么。如果阻断时点在新窗口外，则几乎相当于触摸失效。需要注意的是，这种情况下 `MouseUp` 的 `e.Handled = true` 是可以使用而不会导致触摸失效的。

#### 第三种情况

WPF 程序在启动期间，如果触摸组件发生了异常，极有可能会使得触摸根本就没有初始化成功！

比如，`System.Windows.Input.StylusLogic.RegisterStylusDeviceCore(StylusDevice stylusDevice)` 方法在启动时抛出 `System.InvalidOperationException`，虽然内部有 `catch`，但实际获取到的 `TabletDevice` 个数是 0 个，根本无法获取触摸设备，于是触摸无效。

或者，在 `WorkerOperationGetTabletsInfo.OnDoWork` 方法中，获取到了错误的触摸设备个数：

```csharp
IPimcManager pimcManager = UnsafeNativeMethods.PimcManager;
uint count;
pimcManager.GetTabletCount(out count);
```

### 解决之道

目前为止，这三种问题都没有根本的解决办法，但是我们可以规避。

#### 第一种情况

我们没有办法阻止每一处的 Up 事件，所以我的做法是在禁止那些可能会在 `Up` 中引发异常的操作监听 `Up` 事件，而是统一由我封装好的 `Down/Move/Up` 中进行分发。在我的 `Up` 中 `catch` 所有异常，随后延迟引发。

```csharp
try
{
    // 分发真正业务上的 Up 事件。
    DeliverUpEvent(e);
}
catch (Exception ex)
{
    // 使用触摸或者触笔操作时，如果 Up 事件中发生了任何异常，会导致 StylusLogic.PostProcessInput 的后续逻辑不会正确执行，
    // 这就包括了用于清理触控资源的 StylusTouchDevice.OnDeactivate 方法。
    // 
    // 而在 StylusTouchDevice.OnDeactivate 方法中，会重置 StylusLogic.CurrentMousePromotionStylusDevice 属性
    // 为 null 或 NoMousePromotionStylusDevice。此方法不执行会直接导致 StylusLogic.ShouldPromoteToMouse 方法
    // 对当前触控设备的判断出现错误，持续返回 false，即不会再执行触控转鼠标的逻辑，出现触摸无效的现象。
    // 
    // 这里通过 InvokeAsync 的方式再次抛出异常是为了在保证 Stylus 逻辑不出错的情况下，将异常暴露。
    Dispatcher.CurrentDispatcher.InvokeAsync(() =>
    {
        ExceptionDispatchInfo.Capture(ex).Throw();
    });
}
```

#### 第二种情况

一样的，我们没有办法阻止每一处的 Up 事件。于是我们只能要求多人开发项目中的每一位开发人员都注意不要在 `StylusUp` 中 `e.Handled = true`。

然而，要求每一个人都这么做是不现实的，尤其是团队成员不稳定的情况下。目前我还没有找到具体可实施的自动化的解决办法，不过我最近正在尝试的 Roslyn 扩展可能可以解决这样的问题。有关 Roslyn 扩展的开发，可以阅读我的另一篇文章：[Roslyn 入门：使用 Roslyn 静态分析现有项目中的代码](/post/analysis-code-of-existed-projects-using-roslyn.html)。

#### 第三种情况

启动时触摸设备获取错误的问题我还没有一个彻底的解决方案，目前是检测第一次机会异常，并在发现错误堆栈是以上情况的时候重新启动应用程序。能够采取这样的策略是因为此异常发生在我们的 `App` 类初始化之后 `MainWindow` 显示出来之前。

#### 更多的想法

期待你有更多的想法，我希望在我们的交流之下，能够帮助更多人发现和解决 WPF 的触摸失效问题，甚至更多 WPF 的疑难杂症。
