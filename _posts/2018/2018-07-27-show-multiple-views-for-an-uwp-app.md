---
title: "理解 UWP 视图的概念，让 UWP 应用显示多个窗口（多视图）"
publishDate: 2018-07-27 09:19:14 +0800
date: 2018-12-14 09:54:00 +0800
tags: uwp
coverImage: /static/posts/2018-07-27-08-37-42.png
permalink: /post/show-multiple-views-for-an-uwp-app.html
---

UWP 应用多是一个窗口完成所有业务的，事实上我也推荐使用这种单一窗口的方式。不过，总有一些特别的情况下我们需要用到不止一个窗口，那么 UWP 中如何使用多窗口呢？

---

<div id="toc"></div>

## 为什么 UWP 需要多窗口？

多窗口在传统 Win32 的开发当中是司空见惯的事儿了，不过我个人非常不喜欢，因为 Windows 系统上的多窗口太多坑。以下是我以前写的关于传统多窗口开发中的一些坑（除此之外还有更多）：

- [关闭模态窗口后，父窗口居然跑到了其他窗口的后面](/post/fix-owner-window-dropping-down-when-close-a-modal-child-window)
- [WPF 程序无法触摸操作？我们一起来找原因和解决方法！](/wpf/2017/09/12/touch-not-work-in-wpf.html)

使用多窗口的原因很简单 —— 允许用户多任务处理。从这个角度来说，传统 Win32 使用“模态”多窗口的方式简直是低效的同时还带来 Bug！

微软官方文档中列举了一些例子：例如一边写邮件一边参考以往的邮件；一边看正在播放的音乐一边浏览播放列表；一次性打开多份文章然后稍后一起阅读等。

## UWP 视图的概念

在学习如何编写 UWP 多窗口之前，我们需要了解一些 UWP 视图（View）的概念。

在 [CoreApplication/Application、CoreWindow/Window 之间的区别](/post/core-application-window-of-uwp) 一文中，我描述了 UWP 视图的一些概念：

> `CoreApplication` 管理一个 UWP 应用中的所有视图（View），而 `CoreApplication` 直接管理的视图是 `CoreApplicationView`；也就是说，UWP 应用 `CoreApplication` 管理所有的应用视图 `CoreApplicationView`。而一个 `CoreApplicationView` 包含一个窗口和一个线程调度模型，即 `CoreWindow` 和 `CoreDispatcher`。
> 
> `CoreWindow` 就是我们所理解的窗口。为了方便使用，`Windows.UI.XAML.Window` 类型封装了这个 `CoreWindow`。`CoreDispatcher` 是基于消息循环的线程调度模型，正是因为有了消息循环，所以此窗口才能一直显示而不被销毁。

在 [为了理解 UWP 的启动流程，我从零开始创建了一个 UWP 程序](/post/create-uwp-app-from-zero-1) 一文中，我们也能体会到 `CoreApplication` 和 `CoreWindow` 之间的关系，了解消息循环在应用中的作用。

![UWP 应用视图](/static/posts/2018-07-27-08-37-42.png)

## UWP 多窗口

在了解到 UWP 视图的概念之后，严格意义上说，这一节的标题应该叫做 “UWP 多视图”。

我画了一个思维导图来描述它们之间的关系。`CoreApplication` 有静态方法 `CreateNewView`，调用后能够创建新的 `CoreApplicationView`，这包含一个完整的 `CoreWindow` 和 `CoreDispatcher`。

![UWP 创建应用视图](/static/posts/2018-07-27-08-48-53.png)

创建并显示一个新 `CoreApplicationView` 的代码如下：

```csharp
private async void OnLoaded(object sender, RoutedEventArgs e)
{
    // 创建一个 CoreApplicationView，即新的应用视图。
    var applicationView = CoreApplication.CreateNewView();

    // 一个应用视图有自己的 Id，稍后我们创建应用视图的时候，需要记录这个 Id。
    int newViewId = 0;

    // 使用新应用视图的 CoreDispatcher 线程调度模型来执行新视图中的操作。
    await applicationView.Dispatcher.RunAsync(CoreDispatcherPriority.Normal, () =>
    {
        // 在新的应用视图中，我们将新的窗口内容设置为 ThePageInNewView 页面。
        Frame frame = new Frame();
        frame.Navigate(typeof(ThePageInNewView), null);
        Window.Current.Content = frame;
        Window.Current.Activate();

        // 记录新应用视图的 Id，这样才能稍后切换。
        newViewId = ApplicationView.GetForCurrentView().Id;
    });

    // 使用刚刚记录的新应用视图 Id 显示新的应用视图。
    var viewShown = await ApplicationViewSwitcher.TryShowAsStandaloneAsync(newViewId);
}
```

创建完后的效果如下图：

![UWP 多窗口](/static/posts/2018-07-27-08-58-16.png)

## 管理多个 UWP 视图

我们平时开发 UWP 应用的时候很少去关心 `CoreApplicationView`，因为默认情况下 UWP 能为我们做很多管理应用视图的工作。

`CoreApplication` 有一个 `MainView` 属性，即我们一开始运行 UWP 应用时的那个应用视图。如果我们有不止一个应用视图显示出来，那么这时点击主窗口的关闭按钮将不再是关闭，而是隐藏。如果要关闭，需要调用 `Application.Exit`。

`CoreApplication` 有 `Views` 属性储存所有的 `CoreApplicationView`，我们可以使用此集合来管理多个视图。使用 `ApplicationViewSwitcher.SwitchAsync` 并传入视图 Id 可以切换视图的显示。

```csharp
await ApplicationViewSwitcher.SwitchAsync(viewIdToShow);
```

---

**参考资料**

- [Show multiple views for an app - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/design/layout/show-multiple-views?wt.mc_id=MVP)


