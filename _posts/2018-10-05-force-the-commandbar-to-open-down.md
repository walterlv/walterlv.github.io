---
title: "将 UWP 中 CommandBar 的打开方向改为向下打开"
date: 2018-09-30 17:14:14 +0800
categories: uwp
published: false
---

在 UWP 中使用 CommandBar 来迅速添加一组功能按钮是非常迅速的，是 UWP 中推荐的交互方案之一。也许你能见到 CommandBar 按你所需向下打开，不过可能更多数情况会看到 CommandBar 的打开方向是向上的。

本文将解释 CommandBar 的打开方向逻辑，并且提供多种方法来解决它打开方向的问题。

---

<div id="toc"></div>

### 为什么我们需要更改 CommandBar 的打开方向？

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

我们当然希望在顶部的 CommandBar 其打开方向是向下，所以我们需要找到一些方法。

### 将 CommandBar 改为向下打开的几种方法

首先定一个基调：CommandBar 的默认打开方向就是向上，无论你使用哪种方式，本质上都没有解决其展开方向的问题。

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
▲ 无论你设置到哪个 Page 中，无论 Margin 设为多少，就算是给 Frame 外面的 Grid 设置 Margin，通通都是无效的！TopAppBar 在应用窗口级别的。



> Command bars can be placed at the top of the app window, at the bottom of the app window, and inline.
