---
title: "如何监视 WPF 中的所有窗口，在所有窗口中订阅事件或者附加 UI"
date: 2019-06-28 08:38:21 +0800
tags: wpf dotnet csharp
position: problem
permalink: /posts/how-to-monitor-all-windows-of-wpf-application.html
---

由于 WPF 路由事件（主要是隧道和冒泡）的存在，我们很容易能够通过只监听窗口中的某些事件使得整个窗口中所有控件发生的事件都被监听到。然而，如果我们希望监听的是整个应用程序中所有的事件呢？路由事件的路由可并不会跨越窗口边界呀？

本文将介绍我编写的应用程序窗口监视器，来监听整个应用程序中所有窗口中的路由事件。这样的方法可以用来无时无刻监视 WPF 程序的各种状态。

---

其实问题依旧摆在那里，因为我们依然无法让路由事件跨越窗口边界。更麻烦的是，我们甚至不知道应用程序有哪些窗口，这些窗口都是什么时机显示出来的。

`Application` 类中有一个属性 `Windows`，这是一个 `WindowCollection` 类型的属性，可以用来获取当前已经被 `Application` 类管理的所有的窗口的集合。当然 `Application` 类内部还有一个属性 `NonAppWindowsInternal` 用来管理与此 `Application` 没有逻辑关系的窗口集合。

于是，我们只需要遍历 `Windows` 集合便可以获得应用程序中的所有窗口，然后对每一个窗口监听需要的路由事件。

```csharp
var app = Application.Current;
foreach (Window window in app.Windows)
{
    // 在这里监听窗口中的事件。
}
```

等等！这种操作意味着将来新打开的窗口是不会被监听到事件的。

我们有没有方法拿到新窗口的显示事件呢？遗憾的是——并不行。

但是，我们有一些变相的处理思路。比如，由于 Windows 系统的特性，整个用户空间内，统一时刻只能有一个窗口能处于激活状态。我们可以利用当前窗口的激活与非激活的切换时机再去寻找新的窗口。

于是，一开始的时候，我们可以监听一些窗口的激活事件。如果执行这段初始化代码的时候没有任何窗口是激活的状态，那么就监听所有窗口的激活事件；如果有一个窗口是激活的，那么就监听这个窗口的取消激活事件。

```csharp
private void InitializeActivation()
{
    var app = Application.Current;
    var availableWindows = app.Windows.ToList();
    var activeWindow = availableWindows.FirstOrDefault(x => x.IsActive);
    if (activeWindow == null)
    {
        foreach (var window in availableWindows)
        {
            window.Activated -= Window_Activated;
            window.Activated += Window_Activated;
        }
    }
    else
    {
        activeWindow.Deactivated -= Window_Deactivated;
        activeWindow.Deactivated += Window_Deactivated;
        UpdateActiveWindow(activeWindow);
    }
}

private void UpdateActiveWindow(Window window)
{
    // 当前激活的窗口已经发生了改变，可以在这里为新的窗口做一些事情了。
}
```

在 `Window_Activated` 和 `Window_Deactivated` 事件中，我们主要也是在做初始化。

现在思路基本上全部清晰了，于是我将我写的 `ApplicationWindowMonitor` 类的全部源码贴出来。

```csharp
using System;
using System.Linq;
using System.Windows;
using System.Windows.Threading;

namespace Walterlv.Windows
{
    public sealed class ApplicationWindowMonitor
    {
        private readonly Application _app;
        private readonly Predicate<Window> _windowFilter;
        private Window _lastActiveWindow;

        public ApplicationWindowMonitor(Application app, Predicate<Window> windowFilter = null)
        {
            _app = app ?? throw new ArgumentNullException(nameof(app));
            _windowFilter = windowFilter;
            _app.Dispatcher.InvokeAsync(InitializeActivation, DispatcherPriority.Send);
        }

        private void InitializeActivation()
        {
            var availableWindows = _app.Windows.OfType<Window>().Where(FilterWindow).ToList();
            var activeWindow = availableWindows.FirstOrDefault(x => x.IsActive);
            if (activeWindow == null)
            {
                foreach (var window in availableWindows)
                {
                    window.Activated -= Window_Activated;
                    window.Activated += Window_Activated;
                }
            }
            else
            {
                activeWindow.Deactivated -= Window_Deactivated;
                activeWindow.Deactivated += Window_Deactivated;
                UpdateActiveWindow(activeWindow);
            }
        }

        private void Window_Activated(object sender, EventArgs e)
        {
            var window = (Window) sender;
            window.Activated -= Window_Activated;
            window.Deactivated -= Window_Deactivated;
            window.Deactivated += Window_Deactivated;
            UpdateActiveWindow(window);
        }

        private void Window_Deactivated(object sender, EventArgs e)
        {
            var availableWindows = _app.Windows.OfType<Window>().Where(FilterWindow).ToList();
            foreach (var window in availableWindows)
            {
                window.Deactivated -= Window_Deactivated;
                window.Activated -= Window_Activated;
                window.Activated += Window_Activated;
            }
        }

        private void UpdateActiveWindow(Window window)
        {
            if (!Equals(window, _lastActiveWindow))
            {
                try
                {
                    OnActiveWindowChanged(_lastActiveWindow, window);
                }
                finally
                {
                    _lastActiveWindow = window;
                }
            }
        }

        private bool FilterWindow(Window window) => _windowFilter == null || _windowFilter(window);

        public event EventHandler<ActiveWindowEventArgs> ActiveWindowChanged;

        private void OnActiveWindowChanged(Window oldWindow, Window newWindow)
        {
            ActiveWindowChanged?.Invoke(this, new ActiveWindowEventArgs(oldWindow, newWindow));
        }
    }
}
```

使用方法是：

```csharp
var app = Application.Current;
var monitor = new ApplicationWindowMonitor(app);
monitor.ActiveWindowChanged += OnActiveWindowChanged;

void OnActiveWindowChanged(object sender, ActiveWindowEventArgs e)
{
    var newWindow = e.NewWindow;
    // 一旦有一个新的获得焦点的窗口出现，就可以在这里执行一些代码。
}
```

另外，我在 `ApplicationWindowMonitor` 的构造函数中加入了一个过滤窗口的委托。比如你可以让窗口的监听只对主要的几个窗口生效，而对一些信息提示窗口忽略等等。

