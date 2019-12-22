---
title: "WPF 同一窗口内的多线程 UI（VisualTarget）"
publishDate: 2017-10-30 23:38:21 +0800
date: 2018-09-05 13:47:01 +0800
categories: wpf dotnet csharp
---

WPF 的 UI 逻辑只在同一个线程中，这是学习 WPF 开发中大家几乎都会学习到的经验。如果希望做不同线程的 UI，大家也会想到使用另一个窗口来实现，让每个窗口拥有自己的 UI 线程。然而，就不能让同一个窗口内部使用多个 UI 线程吗？

阅读本文将收获一份对 `VisualTarget` 的解读以及一份我封装好的跨线程 UI 控件 [DispatcherContainer.cs](https://github.com/walterlv/sharing-demo/blob/master/src/Walterlv.Demo.WPF/Utils/Threading/DispatcherContainer.cs)。

---

WPF 同一个窗口中跨线程访问 UI 有多种方法：

- [使用 VisualTarget (本文)](/post/multi-thread-ui-using-visualtarget-in-wpf)
- [使用 SetParent 嵌入另一个窗口](/post/embed-win32-window-using-csharp)

前者使用的是 WPF 原生方式，做出来的跨线程 UI 可以和原来的 UI 相互重叠遮挡。后者使用的是 Win32 的方式，实际效果非常类似 `WindowsFormsHost`，新线程中的 UI 在原来的所有 WPF 控件上面遮挡。另外，后者不止可以是跨线程，还可以跨进程。

<div id="toc"></div>

## 几个必备的组件

微软给 `VisualTarget` 提供的注释是：

> 提供跨线程边界将一个可视化树连接到另一个可视化树的功能。

注释中说 `VisualTarget` 就是用来连接可视化树（`VisualTree`）的，而且可以跨线程边界。也就是说，这是一个专门用来使同一个窗口内部包含多个不同 UI 线程的类型。

所以，我们的目标是使用 `VisualTarget` 显示跨线程边界的 UI。

`VisualTarget` 本身继承自 `CompositionTarget`，而不是 `Visual`；其本身并不是可视化树的一部分。但是它的构造函数中可以传入一个 `HostVisual` 对象，这个对象是一个 `Visual`，如果将此 `HostVisual` 放入原 UI 线程的可视化树上，那么 `VisualTarget` 就与主 UI 线程连接起来了。

另外一半，`VisualTarget` 需要连接另一个异步线程的可视化树。然而，`VisualTarget` 提供了 `RootVisual` 属性，直接给此属性赋一个后台 UI 控件作为其值，即连接了另一个 UI 线程的可视化树。

**总结起来**，其实我们只需要 `new` 一个 `VisualTarget` 的新实例，构造函数传入一个 UI 线程的可视化树中的 `HostVisual` 实例，`RootVisual` 属性设置为另一个 UI 线程中的控件，即可完成跨线程可视化树的连接。

事实上经过尝试，我们真的只需要这样做就可以让另一个线程上的 UI 呈现到当前的窗口上，同一个窗口。*读者可以自行编写测试代码验证这一点，我并不打算在这里贴上试验代码，因为后面会给出完整可用的全部代码。*

## 完善基本功能

虽说 `VisualTarget` 的基本使用已经可以显示一个跨线程的 UI 了，但是其实功能还是欠缺的。

一个典型的情况是，后台线程的这部分 UI 没有连接到 `PresentationSource`；而 `Visual.PointFromScreen`、`Visual.PointFromScreen` 这样的方法明确需要连接到 `PresentationSource` 才行。参见这里：[In WPF, under what circumstances does Visual.PointFromScreen throw InvalidOperationException? - Stack Overflow](https://stackoverflow.com/questions/2154211/in-wpf-under-what-circumstances-does-visual-pointfromscreen-throw-invalidoperat)。

可是，应该如何将 `RootVisual` 连接到 `PresentationSource` 呢？我从 Microsoft.DwayneNeed 项目中找到了方法。这是源码地址：[Microsoft.DwayneNeed - Home](http://microsoftdwayneneed.codeplex.com/)。

做法是重写属性和方法：

```csharp
public override Visual RootVisual
{
    get => _visualTarget.RootVisual;
    set
    {
        // 此处省略大量代码。
    }
}
protected override CompositionTarget GetCompositionTargetCore()
{
    return _visualTarget;
}
```

[`Microsoft.DwayneNeed`](http://microsoftdwayneneed.codeplex.com/) 中有 `VisualTargetPresentationSource` 的完整代码，我自己只为这个类添加了 `IDisposable` 接口，用于 `Dispose` 掉 `VisualTarget` 的实例。我需要这么做是因为我即将提供可修改后台 UI 线程控件的方法。

## 让方法变得好用

为了让整个多线程 UI 线程的使用行云流水，我准备写一个 `DispatcherContainer` 类来优化多线程 UI 的使用体验。期望的使用方法是给这个控件的实例设置 `Child` 属性，这个 `Child` 是后台线程创建的 UI。然后一切线程同步相关的工作全部交给此类来完成。

在我整理后，使用此控件只需如此简单：

```xml
<Grid Background="#FFEEEEEE">
    <local:DispatcherContainer x:Name="Host"/>
</Grid>
```

```csharp
await Host.SetChildAsync<MyUserControl>();
```

其中，`MyUserControl` 是控件的类型，可以是你写的某个 XAML 用户控件，也可以是其他任何控件类型。用这个方法创建的控件，直接就是后台 UI 线程的。

当然，如果你需要自己控制初始化逻辑，可以使用委托创建控件。

```csharp
await Host.SetChildAsync(() =>
{
    var box = new TextBox
    {
        Text = "吕毅 - walterlv",
        Margin = new Thickness(16),
    };
    return box;
});
```

下图即是用以上代码创建的后台线程文本框。

![后台线程的文本框](/static/posts/2017-10-30-23-16-46.png)

甚至，你已经有线程的后台 UI 控件了，或者你希望自己来创建后台的 UI 控件，则可以这样：

```csharp
// 创建一个后台线程的 Dispatcher。
// 其中，UIDispatcher 是我自己封装的方法，在 GitHub 上以 MIT 协议开源。
// https://github.com/walterlv/sharing-demo/blob/master/src/Walterlv.Demo.WPF/Utils/Threading/UIDispatcher.cs
var dispatcher = await UIDispatcher.RunNewAsync("walterlv's testing thread");

// 使用这个后台线程的 Dispatcher 创建一个自己的用户控件。
var control = await dispatcher.InvokeAsync(() => new MyUserControl());

// 将这个用户控件放入封装好的 DispatcherContainer 中。
// DispatcherContainer 是我自己封装的方法，在 GitHub 上以 MIT 协议开源。
// https://github.com/walterlv/sharing-demo/blob/master/src/Walterlv.Demo.WPF/Utils/Threading/DispatcherContainer.cs
await Host.SetChildAsync(control);
```

注意到我们自己创建的控件已经运行在后台线程中了：

![运行在后台线程中](/static/posts/2017-10-30-23-24-39.png)

## 完整的代码

以下所有代码均可点击进入 GitHub 查看。

核心的代码包含两个类：

- [VisualTargetPresentationSource](https://github.com/walterlv/sharing-demo/blob/master/src/Walterlv.Demo.WPF/Utils/Threading/VisualTargetPresentationSource.cs) 这是实现异步 UI 的关键核心，用于连接两个跨线程边界的可视化树，并同时提供连接到 `PresentationSource` 的功能。（由于我对 PresentationSource 的了解有限，此类绝大多数代码都直接来源于 [Microsoft.DwayneNeed - Home](http://microsoftdwayneneed.codeplex.com/)。）
- [DispatcherContainer](https://github.com/walterlv/sharing-demo/blob/master/src/Walterlv.Demo.WPF/Utils/Threading/DispatcherContainer.cs) 当使用我封装好的多线程 UI 方案时（其实就是把这几个类自己带走啦），这个类才是大家编程开发中主要面向的 API 类啊！

其他辅助型代码：

- [UIDispatcher](https://github.com/walterlv/sharing-demo/blob/master/src/Walterlv.Demo.WPF/Utils/Threading/UIDispatcher.cs) 这并不是重点，此类型只是为了方便地创建后台 `Dispatcher`。
- [DispatcherAsyncOperation](https://github.com/walterlv/sharing-demo/blob/master/src/Walterlv.Demo.Sharing/Utils/Threading/DispatcherAsyncOperation.cs) 此类型只是为了让 `UIDispatcher` 中的方法更好写一些。
- [AwaiterInterfaces](https://github.com/walterlv/sharing-demo/blob/master/src/Walterlv.Core/Threading/AwaiterInterfaces.cs) 这是一组可有可无的接口；给 `DispatcherAsyncOperation` 继承的接口，但是不继承也没事，一样能跑。

这些辅助型代码的含义可以查看我的另一篇博客：[如何实现一个可以用 await 异步等待的 Awaiter - walterlv](/post/write-custom-awaiter)。

---

**参考资料**
- [WPF Round Table Part 2: Multi UI Threaded Control - //InterKnowlogy/ Blogs](http://blogs.interknowlogy.com/2014/12/03/wpf-round-table-part-2-multi-ui-threaded-control/)
- [Multithreaded UI: HostVisual – Presentation Source](https://blogs.msdn.microsoft.com/dwayneneed/2007/04/26/multithreaded-ui-hostvisual/)
- [Microsoft.DwayneNeed - Home](http://microsoftdwayneneed.codeplex.com/)
