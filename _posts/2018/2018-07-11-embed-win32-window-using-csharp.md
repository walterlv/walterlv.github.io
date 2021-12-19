---
title: "WPF 同一窗口内的多线程/多进程 UI（使用 SetParent 嵌入另一个窗口）"
publishDate: 2018-07-11 21:35:58 +0800
date: 2019-03-21 10:13:01 +0800
tags: wpf dotnet csharp windows
coverImage: /static/posts/2018-07-11-21-31-07.png
permalink: /posts/embed-win32-window-using-csharp.html
---

WPF 的 UI 逻辑只在同一个线程中，这是学习 WPF 开发中大家几乎都会学习到的经验。如果希望做不同线程的 UI，大家也会想到使用另一个窗口来实现，让每个窗口拥有自己的 UI 线程。然而，就不能让同一个窗口内部使用多个 UI 线程吗？

阅读本文将收获一份 Win32 函数 `SetParent` 及相关函数的使用方法。

---

WPF 同一个窗口中跨线程访问 UI 有多种方法：

- [使用 VisualTarget (本文)](/post/multi-thread-ui-using-visualtarget-in-wpf)
- [使用 SetParent 嵌入另一个窗口](/post/embed-win32-window-using-csharp)

前者使用的是 WPF 原生方式，做出来的跨线程 UI 可以和原来的 UI 相互重叠遮挡。后者使用的是 Win32 的方式，实际效果非常类似 `WindowsFormsHost`，新线程中的 UI 在原来的所有 WPF 控件上面遮挡。另外，后者不止可以是跨线程，还可以跨进程。

<div id="toc"></div>

## 准备必要的 Win32 函数

完成基本功能所需的 Win32 函数是非常少的，只有 `SetParent` 和 `MoveWindow`。

```csharp
[DllImport("user32.dll")]
public static extern bool SetParent(IntPtr hWnd, IntPtr hWndNewParent);

[DllImport("user32.dll", SetLastError = true)]
public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);
```

`SetParent` 用于指定传统的窗口父子关系。有多传统呢？呃……就是 Windows 自诞生以来的那种传统。在传统的 Win32 应用程序中，每一个控件都有自己的窗口句柄，它们之间通过 `SetParent` 进行连接；可以说一个 Button 就是一个窗口。而我们现在使用 `SetParent` 其实就是在使用传统 Win32 程序中的控件的机制。

`MoveWindow` 用于指定窗口相对于其父级的位置，我们使用这个函数来决定新嵌入的窗口在原来界面中的位置。

## 启动后台 UI 线程

启动一个后台的 WPF UI 线程网上有不少线程的方法，但大体思路是一样的。我之前在 [如何实现一个可以用 await 异步等待的 Awaiter](/post/write-custom-awaiter) 一文中写了一个利用 `async`/`await` 做的更高级的版本。

为了继续本文，我将上文中的核心文件抽出来做成了 GitHubGist，访问 [Custom awaiter with background UI thread](https://gist.github.com/walterlv/ca0fc857eae04c1088aebcb8d636d1cb) 下载那三个文件并放入到自己的项目中。

- `AwaiterInterfaces.cs` *为实现 async/await 机制准备的一些接口，虽然事实上可以不需要，不过加上可以防逗比。*
- `DispatcherAsyncOperation.cs` *这是我自己实现的自定义 awaiter，可以利用 awaiter 的回调函数机制规避线程同步锁的使用。*
- `UIDispatcher.cs` *用于创建后台 UI 线程的类型，这个文件包含本文需要使用的核心类，使用到了上面两个文件。*

在使用了上面的三个文件的情况下，创建一个后台 UI 线程并获得用于执行代码的 `Dispatcher` 只需要一句话：

```csharp
// 传入的参数是线程的名称，也可以不用传。
var dispatcher = await UIDispatcher.RunNewAsync("Background UI");
```

在得到了后台 UI 线程 Dispatcher 的情况下，无论做什么后台线程的 UI 操作，只需要调用 `dispatcher.InvokeAsync` 即可。

我们使用下面的句子创建一个后台线程的窗口并显示出来：

```csharp
var backgroundWindow = await dispatcher.InvokeAsync(() =>
{
    var window = new Window();
    window.SourceInitialized += OnSourceInitialized;
    window.Show();
    return window;
});
```

在代码中，我们监听了 `SourceInitialized` 事件。这是 WPF 窗口刚刚获得 Windows 窗口句柄的时机，在此事件中，我们可以最早地拿到窗口句柄以便进行 Win32 函数调用。

```csharp
private void OnSourceInitialized(object sender, EventArgs e)
{
    // 在这里可以获取到窗口句柄。
}
```

## 嵌入窗口

为了比较容易写出嵌入窗口的代码，我将核心部分代码贴出来：

```csharp
class ParentWindow : Window
{
    public ParentWindow()
    {
        InitializeComponent();
        Loaded += OnLoaded;
    }

    private async void OnLoaded(object sender, RoutedEventArgs e)
    {
        // 获取父窗口的窗口句柄。
        var hwnd = (HwndSource) PresentationSource.FromVisual(this);
        _parentHwnd = hwnd;

        // 在后台线程创建子窗口。
        var dispatcher = await UIDispatcher.RunNewAsync("Background UI");
        await dispatcher.InvokeAsync(() =>
        {
            var window = new Window();
            window.SourceInitialized += OnSourceInitialized;
            window.Show();
        });
    }

    private void OnSourceInitialized(object sender, EventArgs e)
    {
        var childHandle = new WindowInteropHelper((Window) sender).Handle;
        SetParent(childHandle, _parentHwnd.Handle);
        MoveWindow(childHandle, 0, 0, 300, 300, true);
    }
    
    private HwndSource _parentHwnd;
    
    [DllImport("user32.dll")]
    public static extern bool SetParent(IntPtr hWnd, IntPtr hWndNewParent);

    [DllImport("user32.dll", SetLastError = true)]
    public static extern bool MoveWindow(IntPtr hWnd, int X, int Y, int nWidth, int nHeight, bool bRepaint);
}
```

具体执行嵌入窗口的是这一段：

```csharp
private void OnSourceInitialized(object sender, EventArgs e)
{
    var childHandle = new WindowInteropHelper((Window) sender).Handle;
    SetParent(childHandle, _parentHwnd.Handle);
    MoveWindow(childHandle, 0, 0, 300, 300, true);
}
```

最终显示时会将后台线程的子窗口显示到父窗口的 (0, 0, 300, 300) 的位置和大小。可以试试在主线程写一个 `Thread.Sleep(5000)`，在卡顿的事件内，你依然可以拖动子窗口的标题栏进行拖拽。

![嵌入了后台线程的窗口](/static/posts/2018-07-11-21-31-07.png)

当然，如果你认为外面那一圈窗口的非客户区太丑了，使用普通设置窗口属性的方法去掉即可：

```csharp
await dispatcher.InvokeAsync(() =>
{
    var window = new Window
    {
        BorderBrush = Brushes.DodgerBlue,
        BorderThickness = new Thickness(8),
        Background = Brushes.Teal,
        WindowStyle = WindowStyle.None,
        ResizeMode = ResizeMode.NoResize,
        Content = new TextBlock
        {
            Text = "walterlv.github.io",
            HorizontalAlignment = HorizontalAlignment.Center,
            VerticalAlignment = VerticalAlignment.Center,
            Foreground = Brushes.White,
            FontSize = 24,
        }
    };
    window.SourceInitialized += OnSourceInitialized;
    window.Show();
});
```

![](/static/posts/2018-07-11-21-33-55.png)

## 源码

以上代码中使用到了我之前的一些源码，这几个文件可分别从以下链接找到并下载到你的项目中：

1. [Annotations.cs](https://github.com/walterlv/sharing-demo/blob/master/src/Walterlv.Core/Annotations/Annotations.cs)
1. [AwaiterInterfaces.cs](https://gist.github.com/walterlv/ca0fc857eae04c1088aebcb8d636d1cb#file-awaiterinterfaces-cs)
1. [DispatcherAsyncOperation.cs](https://gist.github.com/walterlv/ca0fc857eae04c1088aebcb8d636d1cb#file-dispatcherasyncoperation-cs)
1. [UIDispatcher.cs](https://gist.github.com/walterlv/ca0fc857eae04c1088aebcb8d636d1cb#file-uidispatcher-cs)
1. [VisualTargetPresentationSource.cs](https://github.com/walterlv/sharing-demo/blob/master/src/Walterlv.Demo.WPF/Utils/Threading/VisualTargetPresentationSource.cs)


