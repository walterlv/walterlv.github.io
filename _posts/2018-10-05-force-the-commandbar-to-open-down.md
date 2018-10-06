---
title: "将 UWP 中 CommandBar 的展开方向改为向下展开"
publishDate: 2018-10-05 19:37:30 +0800
date: 2018-10-06 10:01:54 +0800
categories: uwp
---

在 UWP 中使用 CommandBar 来迅速添加一组功能按钮是非常迅速的，是 UWP 中推荐的交互方案之一。也许你能见到 CommandBar 按你所需向下展开，不过可能更多数情况会看到 CommandBar 的展开方向是向上的。

本文将解释 CommandBar 的展开方向逻辑，并且提供多种方法来解决它展开方向的问题。

---

<div id="toc"></div>

### 为什么我们需要更改 CommandBar 的展开方向？

```xml
<CommandBar Background="#40000000" ClosedDisplayMode="Compact">
    <AppBarButton Icon="Add" Label="添加" ToolTipService.ToolTip="添加一个 RSS 订阅" />
    <AppBarButton Icon="Bullets" Label="编辑" ToolTipService.ToolTip="进入编辑状态" />
</CommandBar>
```

看下图的例子，我们有一个在顶部的 CommandBar，但是它展开的时候方向是向上的，以至于挡住了顶部的标题栏。

![CommandBar 在不合适的方向展开](/static/posts/2018-09-28-commandbar-open-in-unexpected-direction.gif)  
▲ CommandBar 在不合适的方向展开

理论上标题栏是挡不住的。不过，由于流畅设计（Fluent Design）的存在，越来越多的应用开始使用自定义的标题栏，以获得浑然天成的流畅设计效果。而上图就是其中的一个例子。

我们当然希望在顶部的 CommandBar 其展开方向是向下，所以我们需要找到一些方法。

### 将 CommandBar 改为向下展开的几种方法

首先定一个基调：CommandBar 的默认展开方向就是向上，无论你使用哪种方式，本质上都没有解决其展开方向的问题。

所以以下方法都有可能在你的使用场景下失效，除了大杀器 —— 重写 Template。

#### 方法一：使用 Page.TopAppBar 属性

```xml
<Page x:Class="Walterlv.Rssman.MainPage"
      xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
      Background="{ThemeResource ApplicationPageBackgroundThemeBrush}">
    <Page.TopAppBar>
        <CommandBar Background="#40000000" ClosedDisplayMode="Compact">
            <AppBarButton Icon="Add" Label="添加" ToolTipService.ToolTip="添加一个 RSS 订阅" />
            <AppBarButton Icon="Bullets" Label="编辑" ToolTipService.ToolTip="进入编辑状态" />
        </CommandBar>
    </Page.TopAppBar>
    <Grid>
    </Grid>
</Page>
```

如果你并没有做一些奇怪的样式，是一个 Demo 或者是刚开始做的应用，那么此方法应该对你有效。

![Page.TopAppBar 中的 CommandBar](/static/posts/2018-09-28-commandbar-in-top-app-bar.gif)  
▲ Page.TopAppBar 中的 CommandBar

看！现在 CommandBar 向下展开了。这就是我们的解决方案之一。

不过，觉得怪怪的是不是？因为我自定义了标题栏，当然不能让标题栏挡住我的控件啊！

千万不要尝试将你的 Page 设置一个 Margin 让他下移，因为：

![Page.TopAppBar 是应用窗口级别的](/static/posts/2018-09-28-commandbar-in-top-app-bar.gif)  
▲ 无论你设置到哪个 Page 中，无论 Margin 设为多少，就算是给 Frame 外面的 Grid 设置 Margin，通通都是无效的！Page.TopAppBar 在应用窗口级别的。

正如官网中所描述的那样：

> Command bars can be placed at the top of the app window, at the bottom of the app window, and inline.

#### 方法二：更改布局，使得顶部空间不足以展开 CommandBar

CommandBar 的 `ClosedDisplayMode` 设为 `Compact` 时，折叠状态高度 48，展开状态高度 60；在设为 `Minimal` 时，折叠状态高度 24，展开状态依然是 60。

![这种模式下的展开和折叠高度](/static/posts/2018-10-05-16-43-23.png)  
▲ 各种模式下的展开和折叠高度

鉴于 CommandBar 仅在空间不足时才会从向上展开变为向下展开，所以我们可以利用顶部空间的距离差来完成方向的修改。

对于 `Compact` 模式，我们仅能在上方预留不足 12 的尺寸，而对于 `Minimal` 模式，我们则有不大于 36 的尺寸可以预留。

在我们一开始的例子中，我们需要留出标题栏的高度，而标题栏高度为 32，所以使用 `Minimal` 模式时，我们的展开方向自然因为顶部空间不足而向下展开。另外，12 像素除了留白以外也没什么作用，所以实质上 `Compact` 模式并不能通过这种方式解决展开方向的问题。

![在使用 Minimal 的关闭模式时，可以向下展开](/static/posts/2018-10-05-minimal-expand.gif)  
▲ 在使用 Minimal 的关闭模式时，可以向下展开

#### 方法三：设置 DefaultLabelPosition 避开展开方向的问题

如果不容易改展开方向，那么不让 CommandBar 面临展开方向的问题也是一个不错的解决方案 —— 为 CommandBar 设置 `DefaultLabelPosition` 便是这样的方案。

将 `DefaultLabelPosition` 属性设置为 `Right` 或者 `Collapsed` 而不是 `Bottom`，那么 CommandBar 便不再需要展开这些按钮了，因为即便展开也不会显示更多的信息了，除了那个根本不会影响高度的更多项。

![设置为 Collapsed 或者 Right 的 DefaultLabelPosition](/static/posts/2018-10-05-17-06-56.png)  
▲ 设置为 Collapsed 或者 Right 的 DefaultLabelPosition

#### 方法四：修改 CommandBar 的模板

不得不说这真是一个令人难受的方法，因为定义 CommandBar 模板和样式的代码行数有 1400 行左右。但这也是目前依然使用 CommandBar 控件时最好的方案了。

![编辑控件模板的副本](/static/posts/2018-10-05-17-20-17.png)  
▲ 编辑控件模板的副本

现在，使用 Visual Studio 设计器来帮助我们获得 CommandBar 的完整默认样式定义，就像上图那样。于是，我们可以阅读其代码并修改展开方向了。

代码很长，为了能够迅速理解其结构，我将其最关键的大纲部分贴到下面：

```xml
<ControlTemplate x:Key="CommandBarTemplate1">
    <Grid>
        <VisualStateManager.VisualStateGroups>
            <VisualStateGroup x:Name="DisplayModeStates">
                <VisualStateGroup.Transitions>
                    <VisualState From="CompactClosed" To="CompactOpenUp" />
                    <VisualState From="CompactOpenUp" To="CompactClosed" />
                    <VisualState From="CompactClosed" To="CompactOpenDown" />
                    <VisualState From="CompactOpenDown" To="CompactClosed" />
                    <VisualState From="MinimalClosed" To="MinimalOpenUp" />
                    <VisualState From="MinimalOpenUp" To="MinimalClosed" />
                    <VisualState From="MinimalClosed" To="MinimalOpenDown" />
                    <VisualState From="MinimalOpenDown" To="MinimalClosed" />
                    <VisualState From="HiddenClosed" To="HiddenOpenUp" />
                    <VisualState From="HiddenOpenUp" To="HiddenClosed" />
                    <VisualState From="HiddenClosed" To="HiddenOpenDown" />
                    <VisualState From="HiddenOpenDown" To="HiddenClosed" />
                </VisualStateGroup.Transitions>
                <VisualState x:Name="CompactClosed" />
                <VisualState x:Name="CompactOpenUp" />
                <VisualState x:Name="CompactOpenDown" />
                <VisualState x:Name="MinimalClosed" />
                <VisualState x:Name="MinimalOpenUp" />
                <VisualState x:Name="MinimalOpenDown" />
                <VisualState x:Name="HiddenClosed" />
                <VisualState x:Name="HiddenOpenUp" />
                <VisualState x:Name="HiddenOpenDown" />
            </VisualStateGroup>
        </VisualStateManager.VisualStateGroups>
    </Grid>
</ControlTemplate>
```

可以看到，对于每一种 `ClosedDisplayMode`，都有三种状态与之对应 —— Closed、Up 和 Down。当然，Up 就是向上展开时的状态，Down 就是向下展开时的状态。而 Closed、Up 和 Down 之间的状态切换有四种 —— Closed 到 Up、Up 到 Closed、Closed 到 Down 以及 Down 到 Closed。

于是，我们要获得任何时候都向下展开的能力，我们便需要将所有的 Up 状态修改成 Down 的状态。

现在，我们将 将 `<VisualState From="CompactClosed" To="CompactOpenDown" />` 的代码复制到 `<VisualState From="CompactClosed" To="CompactOpenUp" />` 中，`<VisualState From="CompactOpenDown" To="CompactClosed" />` 内部的代码复制到 `<VisualState From="CompactOpenUp" To="CompactClosed" />` 中，将 `<VisualState x:Name="CompactOpenDown" />` 内的代码复制到 `<VisualState x:Name="CompactOpenUp" />` 中。

也就是说，我们将所有 CompactClosed 和 CompactDown 的状态复制到了 CompactClosed 和 CompactUp 的状态中。这样，即便 CommandBar 判定为向上展开，实际上的动画和交互也都是向下展开的了。

以下是这样修改后的效果。

![使用样式更改的展开方向](/static/posts/2018-10-05-expand-by-editing-template.gif)  
▲ 使用样式更改的展开方向

### 究竟应该如何修改 CommandBar 的展开方向

在多数情况下，我想我们并没有特别强烈的需求一定要让 CommandBar 在顶部依然有空间的情况下展开方向向下。

如果有，那通常也是中大型项目，这时 CommandBar 样式和模板所占用的那 1400 行左右的代码也就不显得多了。

但对于小型个人项目而言，可以考虑修改应用程序的外观设计来规避这么长的代码。例如让 CommandBar 始终显示或隐藏文字，或者让 CommandBar 默认为 `Minimal` 的状态。

如果你对其他控件有小型样式的修改需求，可以阅读我的另一篇文章：[UWP 轻量级样式定义（Lightweight Styling）](/post/uwp-lightweight-xaml-styling.html)。
