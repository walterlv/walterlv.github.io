---
title: "WPF 窗口在 Visual Studio 调试的时候会被一个莫名其妙的调试层覆盖住"
date: 2022-03-05 10:13:01 +0800
categories: wpf dotnet visualstudio
position: problem
coverImage: /static/posts/2022-03-05-10-02-28.png
---

同样的程序，在使用 Visual Studio 调试的时候和直接运行的时候相比，总会有一些细微之处是不同的。大多数时候这些不同可以忽略，但是一旦这些不同是我们产品需求的一部分的时候，你可能就会发现调试和非调试状态下的行为不同却找不到原因，非常抓狂！

本文记录我遇到的一个 WPF 窗口调试的案例。看完后大家至少知道 Visual Studio 调试时的一个小坑，更进一步则可以在出现奇妙问题的时候打开一个新的思路。

---

<div id="toc"></div>

## UI 自动化

微软有一款自动化办公软件 Power Automate Desktop，它可以录制你对某软件的操作，以便在后续自动化进行这些操作。

一天，我正用它来自动化操作我正在开发中的一款小工具软件（WPF 框架），但发现它竟然无法识别我界面中的任何控件，无论怎么识别，都是一整个窗口。这导致 Power Automate Desktop 的自动化操作对我正开发的软件毫无作用，这怎么能忍！

![正常情况](/static/posts/2022-03-05-10-02-28.png)  
▲ 正常情况（能识别到窗口内的控件）

![异常情况](/static/posts/2022-03-05-10-03-21.png)  
▲ 异常情况（只能识别到一整个窗口）

## Visual Studio 干了啥！

我用 snoop 查看了一下我软件界面里的控件，发现没有什么异常。

不过，意外发现有一个名为“AdornerWindow”的窗口引起了我的注意，直接在 snoop 里将其设为隐藏后，Power Automate Desktop 瞬间即可正常识别我软件里面的各种控件了。

![引起注意的“AdornerWindow”窗口](/static/posts/2022-03-05-10-05-52.png)  
▲ 引起注意的“AdornerWindow”窗口

然而，我不能每次自动化之前先用 snoop 隐藏一下这个窗口吧，所以就打算在我窗口的 `ContentRendered` 事件里把它干掉。这就有了下面这段代码：

```csharp
public MainWindow()
{
    InitializeComponent();
    ContentRendered += RecordingCaptureWindow_ContentRendered;
}

private void RecordingCaptureWindow_ContentRendered(object? sender, EventArgs e)
{
    HandleVisualStudioHacking();
}

/// <summary>
/// 因为 Visual Studio 会在调试状态下向此窗口添加一个全覆盖窗口，导致我们无法捕获到下方控件。所以我们需要将此窗口移除。
/// </summary>
[Conditional("DEBUG")]
private void HandleVisualStudioHacking()
{
    var windows = Application.Current.Windows.OfType<Window>().ToList();
    var thisWindowIndex = windows.IndexOf(this);
    var suspiciousWindowIndex = thisWindowIndex + 1;
    if (suspiciousWindowIndex < windows.Count
        && windows[suspiciousWindowIndex] is { } suspiciousWindow
        && suspiciousWindow.GetType().FullName == "Microsoft.VisualStudio.DesignTools.WpfTap.WpfVisualTreeService.Adorners.AdornerWindow")
    {
        suspiciousWindow.Close();
    }
}
```

因为发现每一个 WPF 窗口上面都会覆盖这样一个透明窗口，所以我拿到主线程所有窗口的列表，找到当前窗口的下一个（因为假想 Visual Studio 总会在我们创建完一个窗口后立即创建覆盖窗口），然后把它关掉。

