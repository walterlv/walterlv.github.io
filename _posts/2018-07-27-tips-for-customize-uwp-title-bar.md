---
title: "UWP 扩展/自定义标题栏的方法，一些概念和一些注意事项"
date_published: 2018-07-27 14:17:44 +0800
date: 2018-07-27 18:25:22 +0800
categories: uwp
---

在 Windows 10 的前几个版本中将页面内容扩展到标题栏上还算简单，主要是没什么坑。直到一些新控件的引入和一些外观设计趋势变化之后，扩展标题栏开始出现一些坑了。

本文将重温 UWP 自定义标题栏或者扩展标题栏的方法，但更重要的是解决一些坑。

---

<div id="toc"></div>

### 扩展/自定义标题栏

要扩展标题栏，只需要拿到 `CoreApplicationView` 的实例，然后设置 `TitleBar` 的 `ExtendViewIntoTitleBar` 属性为 `true` 即可。

```csharp
var applicationView = CoreApplication.GetCurrentView();
applicationView.TitleBar.ExtendViewIntoTitleBar = true;
```

要自定义标题栏，只需要拿到 `ApplicationView` 的实例，然后设置 `TitleBar` 里各种属性接口。

```csharp
var titleBar = ApplicationView.GetForCurrentView().TitleBar;
titleBar.BackgroundColor = Colors.Khaki;
titleBar.ButtonBackgroundColor = Colors.Transparent;
```

### 一些概念

那么问题来了，为什么前者需要拿到 `CoreApplicationView` 的实例，后者需要拿到 `ApplicationView` 的实例？它们到底是什么区别？

在 [理解 UWP 视图的概念](/post/show-multiple-views-for-an-uwp-app.html) 一文中，我提到过 `CoreApplication`、`CoreWindow` 和 `CoreDispatcher` 之间的关系。继续借用那篇文章中的图：

![UWP 创建应用视图](/static/posts/2018-07-27-08-48-53.png)

其中，`Window` 是对 `CoreWindow` 的封装，提供了更多与 XAML 相关的功能。这里的 `ApplicationView` 也是这样，是对 `CoreApplication` 的封装，提供了 XAML 相关的功能。

具体来说，`CoreWindow` 是与操作系统、与整个应用打交道的类型，提供了诸如窗口的尺寸、位置、输入状态等设置或调用；`Window` 是与应用内 UI 打交道的类型，比如可以设置窗口内显示的 UI，设置内部哪个控件属于标题栏，获取此窗口内的 `Compositor`。与之对应的，`CoreApplicationView` 是应用与操作系统交互，与窗口消息循环机制协同工作的类型，包含窗口客户区和非客户区设置；`ApplicationView` 也是与应用内 UI 打交道的类型，它可以使用 XAML 相关的类型对应用程序视图进行更方便的设置。

总结起来，`CoreWindow` 和 `CoreApplicationView` 提供更加核心的操作系统或应用底层功能，而 `Window` 和 `ApplicationView` 对前者进行了封装，使得我们能够使用 `Windows.UI.Xaml` 命名空间下的类型对窗口和应用视图进行控制。

于是，我们便能够理解为什么扩展标题栏和设置标题栏颜色会使用到两个不一样的类型了。

`ExtendViewIntoTitleBar` 是改变了窗口的客户区（Client Area）和非客户区（Non-client Area）组成，这是传统 Win32 编程中的概念，是更接近操作系统底层的概念。`BackgroundColor` 和 `ButtonBackgroundColor` 这里需要用到 `Windows.UI.Xaml` 命名空间中的颜色，而 `CoreApplicationView` 太底层，无法使用 XAML 颜色。

### 一些坑

#### 控件在标题栏区域无法交互

想必当你扩展到标题栏后，在标题栏区域增加一些按钮的时候，肯定会遇到下面的情况：

![控件的一半无法交互](/static/posts/2018-07-27-not-interactive.gif)  
▲ 按钮在标题栏区域的一半无法交互

这显然是无法接受的。

然而，当我们将一个 XAML 控件指定为标题栏之后，就只会是那个控件所在的区域响应标题栏操作，其他地方就会恢复正常。

```csharp
// TitleBar 是我在 XAML 中写的一个 x:Name="TitleBar" 的控件。
Window.Current.SetTitleBar(TitleBar);
```

![设置了一个标题栏](/static/posts/2018-07-27-set-titlebar.gif)  
▲ 按钮在标题栏区域现在可以交互了

特别说明一下，`SetTitleBar` 传入的是 `UIElement` 类型的实例，也就是说这也是 XAML 交互的一部分。我们需要使用 `Window` 的实例，而不是 `CoreWindow` 的实例。

#### 更高的标题栏，或者被遮挡

如果被指定为标题栏的控件更大，超出标题栏区域了，它还会成为标题栏吗？如果被其他控件遮挡了，它还会响应标题栏事件吗？

实际看来，无论它多大，都能响应标题栏事件；但被遮挡的部分就真的被遮挡了，没有标题栏响应。

![更高的标题栏，或者被遮挡](/static/posts/2018-07-27-titlebar-been-covered.gif)  
▲ 更高的标题栏，或者被遮挡

事实上，指定为标题栏的控件可以在界面的任何地方，不需要一定在顶部。只不过，绝大多数不作死的应用都不会这样设置吧！

#### 在什么时机调用？

扩展标题栏用的是 `CoreApplicationView`，自定义标题栏颜色用的是 `ApplicationView`，将控件指定为标题栏用的是 `Window`。如果我们的应用只有一个视图，其实我们随便找一个初始化的地方调用就好了。但如果我们的应用有多个视图，那么给非主要视图调用的时候就需要在其初始化之后了。阅读 [理解 UWP 视图的概念，让 UWP 应用显示多个窗口（多视图）](/post/show-multiple-views-for-an-uwp-app.html) 了解如何编写多个视图的 UWP 应用，了解非主要视图的初始化时机。

当然，如果你比较极客，从 `Main` 函数开始写 UWP 应用，就像我在 [为了理解 UWP 的启动流程，我从零开始创建了一个 UWP 程序](/post/create-uwp-app-from-zero-1.html) 一文中做的一样，那么你也需要等到初始化完毕之后才能调用（至少是 `SetWindow` 之后了）。

### 适配移动设备

移动设备上并不是标题栏，而是状态了和虚拟按键。关于扩展视图到这些区域，可以阅读 [win10 uwp 标题栏 - 林德熙](https://lindexi.gitee.io/post/win10-uwp-%E6%A0%87%E9%A2%98%E6%A0%8F.html)。

---

#### 参考资料

- [Title bar customization - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/design/shell/title-bar)
