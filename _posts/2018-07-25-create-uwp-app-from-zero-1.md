---
title: "(2/2) 为了理解 UWP 的启动流程，我从零开始创建了一个 UWP 程序"
date_published: 2018-07-25 21:20:36 +0800
date: 2018-07-28 19:50:08 +0800
categories: uwp dotnet csharp
---

每次使用 Visual Studio 的模板创建一个 UWP 程序，我们会在项目中发现大量的项目文件、配置、应用启动流程代码和界面代码。然而这些文件在 UWP 程序中到底是如何工作起来的？

我从零开始创建了一个 UWP 程序，用于探索这些文件的用途，了解 UWP 程序的启动流程。

---

本文分为两个部分：

- [从零开始创建一个 UWP 项目并完成部署](/post/create-uwp-app-from-zero-0.html)
- [从零开始编写一个 UWP 应用程序和窗口](/post/create-uwp-app-from-zero-1.html)

本文将从 Main 函数开始，一步步跑起来一个应用程序，显示一个窗口，并在窗口中显示一些内容。重点在了解在 UWP 中运行应用程序，并显示窗口。

<div id="toc"></div>

### 启动应用

在上一篇文章中的末尾，我们成功启动了程序并进入了 Main 函数的断点，但实际上运行会报错。我们能看见一个窗口显示出来，随后提示进程已启动，但应用尚未运行。

> The Walterlv.Demo.ZeroUwp.exe process started, but the activation request failed with error 'The app didn't start'.

是的，我们只有一个什么都没做的 Main 函数，进程当然能够成功启动；但我们需要能够启动应用。那么 UWP 的应用是什么呢？是 CoreApplication。

所以我们使用 `CoreApplication` 类型执行 `Run` 静态方法。

![CoreApplication.Run](/static/posts/2018-07-25-10-24-17.png)

此方法要求传入一个 `IFrameworkViewSource`。事实上 UWP 已经有一个 `IFrameworkViewSource` 的实现了，是 `FrameworkViewSource`。不过，我希望自己写一个，了解其原理。

所以，就用 ReSharper 生成了 `IFrameworkViewSource` 的一个实现：

```csharp
using Windows.ApplicationModel.Core;

namespace Walterlv.Demo.ZeroUwp
{
    internal sealed class WalterlvViewSource : IFrameworkViewSource
    {
        public IFrameworkView CreateView() => new WalterlvFrameworkView();
    }
}
```

`IFrameworkViewSource` 接口中只有一个方法 `CreateView`，返回一个新的 `IFrameworkView` 的实例。

只是写一个 `NotImplementedException` 的异常，当然是跑不起来的，得返回一个真的 `IFrameworkView` 的实例。UWP 自带的实现为 `FrameworkView`，那么我也自己实现一个。

这次需要实现的方法会多一些：

```csharp
using Windows.ApplicationModel.Core;
using Windows.UI.Core;

namespace Walterlv.Demo.ZeroUwp
{
    internal sealed class WalterlvFrameworkView : IFrameworkView
    {
        public void Initialize(CoreApplicationView applicationView) => throw new System.NotImplementedException();
        public void SetWindow(CoreWindow window) => throw new System.NotImplementedException();
        public void Load(string entryPoint) => throw new System.NotImplementedException();
        public void Run() => throw new System.NotImplementedException();
        public void Uninitialize() => throw new System.NotImplementedException();
    }
}
```

因此，我们需要理解这些方法的执行时机以及含义才能正确实现这些方法。庆幸的是，这些方法的含义都能在官方文档中找到（其实就是平时看到的注释）：

- [IFrameworkView.Initialize(CoreApplicationView)](https://docs.microsoft.com/en-us/uwp/api/windows.applicationmodel.core.iframeworkview.initialize)
- [IFrameworkView.Load(String)](https://docs.microsoft.com/en-us/uwp/api/windows.applicationmodel.core.iframeworkview.load)
- [IFrameworkView.Run](https://docs.microsoft.com/en-us/uwp/api/windows.applicationmodel.core.iframeworkview.run)
- [IFrameworkView.SetWindow(CoreWindow)](https://docs.microsoft.com/en-us/uwp/api/windows.applicationmodel.core.iframeworkview.setwindow)
- [IFrameworkView.Uninitialize](https://docs.microsoft.com/en-us/uwp/api/windows.applicationmodel.core.iframeworkview.uninitialize)

为了方便查看，我将其整理到这些方法上作为注释。

顺便的，下面这些方法刚好是按照应用生命周期的顺序被调用，也就是 `Initialize`->`SetWindow`->`Load`->`Run`->`Uninitialize`。

```csharp
/// <summary>
/// 当应用启动时将执行此方法。进行必要的初始化。
/// </summary>
public void Initialize(CoreApplicationView applicationView) { }

/// <summary>
/// 每次应用需要显示一个窗口的时候，此方法就会被调用。用于为当前应用程序显示一个新的窗口视图。
/// </summary>
public void SetWindow(CoreWindow window) { }

/// <summary>
/// 会在 <see cref="Run"/> 方法执行之前执行。如果需要使用外部资源，那么这时需要将其加载或激活。
/// </summary>
public void Load(string entryPoint) { }

/// <summary>
/// 当此方法调用时，需要让应用内的视图（View）显示出来。
/// </summary>
public void Run() { }

/// <summary>
/// 当应用退出时将执行此方法。如果应用启动期间使用到了外部资源，需要在此时进行释放。
/// </summary>
public void Uninitialize() { }
```

在此接口的所有方法留空地实现完以后，我们的 UWP 应用终于能跑起来了。当按下 F5 调试之后，不会再提示错误，而是依次执行这五个方法后，正常退出应用。

### 启动窗口

注意到以上所有方法都留空之后，应用程序很快就退出了。这与我们开发传统 Win32 应用时的效果是一致的 —— 是的，我们缺一个消息循环。我们需要一个不断处理的消息循环用来阻断主线程的退出，同时又能够不断响应消息。而这样的方法需要写到 `Run()` 方法里面。

UWP 中开启一个消息循环是非常容易的，不过我们需要一个 `CoreDispatcher` 对象。在我们目前的接口实现中，`CoreDispatcher` 对象可以从 `CoreWindow` 中获取到。所以我们需要在 `SetWindow` 方法中拿到 `CoreWindow` 的实例，然后在 `Run` 中使用它开启窗口消息循环。

```csharp
public void SetWindow(CoreWindow window)
{
    _window = window;
}

public void Run()
{
    _window.Activate();
    _window.Dispatcher.ProcessEvents(CoreProcessEventsOption.ProcessUntilQuit);
}

private CoreWindow _window;
```

![开启消息循环](/static/posts/2018-07-25-15-19-57.png)  
▲ 开启了消息循环之后，应用不会直接退出了

你可以通过阅读 [理解 UWP 视图的概念，让 UWP 应用显示多个窗口（多视图）](/post/show-multiple-views-for-an-uwp-app.html) 一文来了解 UWP 应用（`CoreApplication`）、应用视图（`CoreApplicationView`）、窗口（`CoreWindow`/`Window`）、线程调度模型（`CoreDispatcher`）之间的关系。

### 在窗口中显示点东西

我们使用 `CompositionAPI` 可以在窗口中创建 `Visual` 并显示出来。

```csharp
public void SetWindow(CoreWindow window)
{
    _window = window;

    var compositor = new Compositor();
    var root = compositor.CreateContainerVisual();
    var compositionTarget = compositor.CreateTargetForCurrentView();
    compositionTarget.Root = root;

    var child = compositor.CreateSpriteVisual();
    child.Size = new Vector2(100f, 100f);
    child.Brush = compositor.CreateColorBrush(Color.FromArgb(0xFF, 0x00, 0x80, 0xFF));
    root.Children.InsertAtTop(child);
}
```

![窗口中新增的 Visual](/static/posts/2018-07-25-20-44-19.png)

### 在窗口中做一些交互

`CoreWindow` 除了为我们提供了消息循环之外，也可以提供交互。监听 `PointerMoved` 事件，我们可以做一些简单的交互。

下面我用 Git 标准差异比较的方式添加了交互的代码 `PointerMoved`：

```diff
  public void SetWindow(CoreWindow window)
  {
      _window = window;
+     _window.PointerMoved += OnPointerMoved;
  
      var compositor = new Compositor();
-     var root = compositor.CreateContainerVisual();
+     _root = compositor.CreateContainerVisual();
      var compositionTarget = compositor.CreateTargetForCurrentView();
-     compositionTarget.Root = _root;
+     compositionTarget.Root = _root;
  
      var child = compositor.CreateSpriteVisual();
      child.Size = new Vector2(100f, 100f);
      child.Brush = compositor.CreateColorBrush(Color.FromArgb(0xFF, 0x00, 0x80, 0xFF));
-     root.Children.InsertAtTop(child);
+     _root.Children.InsertAtTop(child);
  }

+ private void OnPointerMoved(CoreWindow sender, PointerEventArgs args)
+ {
+     var visual = _root.Children.First();
+     var position = args.CurrentPoint.Position;
+     visual.Offset = new Vector3((float) (position.X - 50f), (float) (position.Y - 50f), 0f);
+ }

  private CoreWindow _window;
+ private ContainerVisual _root;
```

能够完成一些简单的交互。

![窗口内的交互](/static/posts/2018-07-25-interaction.gif)

### 特别注意 GC

如果你真的按照以上步骤写出了一个 UWP 程序并且跑起来了，你会发现过一会儿就炸了。

![ObjectDisposedException](/static/posts/2018-07-28-19-40-03.png)

这是因为 `compositor` 我们是作为变量放到方法中的，很容易就被 GC 掉。最好将它放到字段中储存起来，避免被 GC。

```csharp
private Compositor _compositor;
```

### 总结

在本文中，我们了解到 UWP 的应用程序启动中也一样需要有窗口消息循环。不过 UWP 中创建消息循环还是非常简单的。

我们使用 CompositionAPI 进行了一些界面显示和简单的交互。了解到即便是如此复杂的 UWP 程序，其启动流程也没有那么复杂。

不过，如果你阅读了前面一篇 [(1/2) 为了理解 UWP 的启动流程，我从零开始创建了一个 UWP 程序](/post/create-uwp-app-from-zero-0.html)，会发现复杂的部分都在项目文件和系统的部分。
