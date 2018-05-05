---
title: "WPF/UWP 的 Grid 布局竟然有 Bug，还不止一个！了解 Grid 中那些未定义的布局规则"
date: 2018-05-05 15:43:33 +0800
categories: wpf uwp xaml
version:
  current: 中文
versions:
  - 中文: #
  - English: /post/the-bugs-of-grid-en.html
---

只要你用 XAML 写代码，我敢打赌你一定用各种方式使(nuè)用(dài)过 `Grid`。不知你有没有在此过程中看到过 `Grid` 那些匪夷所思的布局结果呢？

本文将带你来看看 `Grid` 布局中的 Bug。

---

This post is written in **multiple languages**. Please select yours:

{% include post-version-selector.html %}

<div id="toc"></div>

### 无限空间下的比例

先上一段代码，直接复制到你的试验项目中运行：

```xml
<Canvas>
    <Grid Height="100">
        <Grid.ColumnDefinitions>
            <ColumnDefinition Width="100" />
            <ColumnDefinition Width="*" />
            <ColumnDefinition Width="2*" />
        </Grid.ColumnDefinitions>
        <Border Grid.Column="0" Background="CornflowerBlue" Width="150" />
        <Border Grid.Column="1" Background="Tomato" Width="150" />
        <Border Grid.Column="2" Background="Teal" Width="150" />
    </Grid>
</Canvas>
```

第一列固定 `100`，第二列占 1 个比例的 `*`，第三列占 2 个比例的 `*`。你觉得最终的效果中，第二个 `Border` 和第三个 `Border` 的可见尺寸分别是多少呢？

<br>

按

<br>

下

<br>

F5

<br>

运

<br>

行

<br>

看

<br>

看

<br>

结

<br>

果

![](/static/posts/2018-05-05-14-15-13.png)

预料到了吗？虽然第二列和第三列的比例是 1:2，但最终的可见比例却是 1:1。

这里是有破绽的，因为你可能会怀疑第三列其实已经是第二列的两倍，只是右侧是空白，看不出来。那么现在，我们去掉 `Canvas`，改用在父 `Grid` 中右对齐，也就是如下代码：

```xml
<Grid HorizontalAlignment="Right">
    <Grid.ColumnDefinitions>
        <ColumnDefinition Width="100" />
        <ColumnDefinition Width="*" />
        <ColumnDefinition Width="2*" />
    </Grid.ColumnDefinitions>
    <Border Grid.Column="0" Background="CornflowerBlue" Width="150" />
    <Border Grid.Column="1" Background="Tomato" Width="150" />
    <Border Grid.Column="2" Background="Teal" Width="150" />
</Grid>
```

运行后，你会发现最右侧是没有空白的，也就是说第二列和第三列确实不存在 1:2 的比例——它们是等宽的。

![](/static/posts/2018-05-05-14-33-09.png)

那么那一段失去的空间去哪里了呢？让我们缩小窗口：

![缩小窗口](/static/posts/2018-05-05-space-move.gif)

竟然在左侧还有剩余空间的情况下，右侧就开始压缩元素空间了！我们能说那段丢失的一个 * 长度的空白到左边去了吗？显然不能。

不过，我们能够猜测，压缩右侧元素开始于最小 1:2 的比例正好不足时出现。

### 刚好不够分的比例

右对齐能够帮助我们区分右侧是否真的占有空间。那么我们继续右对齐做试验。

现在，我们将第二列的 `Border` 做成跨第二和第三两列的元素。第三列的 `Border` 放到第二列中。（也就是说，我们第三列不放元素了。）

```xml
<Grid HorizontalAlignment="Right">
    <Grid.ColumnDefinitions>
        <ColumnDefinition Width="100" />
        <ColumnDefinition Width="*" />
        <ColumnDefinition Width="2*" />
    </Grid.ColumnDefinitions>
    <Border Grid.Column="0" Background="CornflowerBlue" Width="150" />
    <Border Grid.Column="1" Grid.ColumnSpan="2" Background="Tomato" Width="150" />
    <Border Grid.Column="1" Background="Teal" Width="150" />
</Grid>
```

运行看看，在得知前一节现象的情况下，新的现象并没有出现多大的意外。第三列凭空消失，第二列与之之间依然失去了 1:2 的比例关系。

![](/static/posts/2018-05-05-14-43-04.png)

然而，我们还可以缩小窗口。

缩

<br>

小

<br>

窗

<br>

口

<br>

后

<br>

竟

<br>

然

![](/static/posts/2018-05-05-space-appear.gif)

为什么在缩小窗口的时候突然间出现了那个红色的 `Border`？为什么在红色 `Border` 的右边还留有空白？

如果说第一节中我们认识到右对齐时右边剩余的空白空间会丢掉，那么为什么此时右边剩余的空白空间会突然出现？

我试着稍微增加第二个 `Border` 的宽度，突然间，刚刚缩小窗口时的行为也能复现！

![](/static/posts/2018-05-05-a-little-longer.gif)

### 自动尺寸也能玩比例

现在，我们抛弃之前的右对齐测试方法，也不再使用预期按比例划分空间的 `*`。我们使用 `Auto` 来实现比例功能。

```xml
<Grid>
    <Grid.ColumnDefinitions>
        <ColumnDefinition Width="Auto" />
        <ColumnDefinition Width="Auto" />
        <ColumnDefinition Width="Auto" />
    </Grid.ColumnDefinitions>
    <Border Width="159" Grid.ColumnSpan="3" HorizontalAlignment="Center" Background="PaleGreen" />
    <Border Width="28" HorizontalAlignment="Left" Background="#7FFF6347" />
    <Border Width="51" Grid.Column="1" HorizontalAlignment="Center" Background="#7FC71585" />
    <Border Width="28" Grid.Column="2" HorizontalAlignment="Right" Background="#7F008080" />
</Grid>
```

具体说来，我们有四个 `Border` 了，放在 `Auto` 尺寸的三列中。第一个 `Border` 横跨三列，尺寸比其他总和都长，达到了 159；剩下的三个 `Border` 各占一列，其中两边等长，中间稍长。

![](/static/posts/2018-05-05-15-02-21.png)

那么实际布局中各列是怎么分的呢？以下是设计器为我们显示的列宽：

![](/static/posts/2018-05-05-15-04-07.png)

`46`、`69`、`46` 是怎么来的？莫非是 `46:69` 与 `28:51` 相同？然而实际计算结果却并不是！

可万一这是计算误差呢？

那么我们再来看看三个 `Border` 的另外两组值：`50:50:50` 和 `25:50:25`。

![](/static/posts/2018-05-05-15-08-41.png)  
▲ `50:50:50`

![](/static/posts/2018-05-05-15-09-29.png)  
▲ `25:50:25`

`50:50:50` 最终得到的是相同比例，但是 `25:50:25` 得到的列宽比例与 `1:2` 相去甚远。也就是说，其实 `Grid` 内部并没有按照元素所需的尺寸来按比例计算列宽。

### 相同比例也能有不同尺寸

在上一节的试验中，不管比例如何，至少相同的设置尺寸带来了相同的最终可见尺寸。然而，就算是这一点，也是能被颠覆的。

现在，我们将 3 列换成 4 列，`Border` 数量换成 6 个。

```xml
<Grid>
    <Grid.ColumnDefinitions>
        <ColumnDefinition Width="Auto" />
        <ColumnDefinition Width="Auto" />
        <ColumnDefinition Width="Auto" />
        <ColumnDefinition Width="Auto" />
    </Grid.ColumnDefinitions>
    <Border Width="159" Grid.ColumnSpan="3" HorizontalAlignment="Center" Background="PaleGreen" />
    <Border Width="159" Grid.Column="1" Grid.ColumnSpan="3" HorizontalAlignment="Center" Background="PaleGreen" />
    <Border Width="28" HorizontalAlignment="Left" Background="#7FFF6347" />
    <Border Width="51" Grid.Column="1" HorizontalAlignment="Center" Background="#7FC71585" />
    <Border Width="51" Grid.Column="2" HorizontalAlignment="Center" Background="#7FC71585" />
    <Border Width="28" Grid.Column="3" HorizontalAlignment="Right" Background="#7F008080" />
</Grid>
```

具体来说，第一个 `Border` 跨前三列，第二个 `Border` 跨后三列，跟前一节的长 `Border` 一样长。第三和第六个 `Border` 分在两边，与之前的短 `Border` 一样短。中间的两个 `Border` 与之前中间的 `Border` 一样长。就像下图所示的这样。

![](/static/posts/2018-05-05-15-18-14.png)

那么此时布局出来的列宽是多少呢？

![](/static/posts/2018-05-05-15-21-03.png)  
▲ 32:65:65:39

等等！那个 39 是怎么来的？如果前一节里相等尺寸的 `Border` 会得到相等尺寸的列宽，那么这里也将颠覆！事实上，即便此时列宽比例与元素所需比例一致，在这种布局下也是有无穷多个解的。WPF 只是从这无穷多个解中挑选了一个出来——而且，还无法解释！

### 总结 Grid 未定义的规则

总而言之，言而总之，`Grid` 布局在特殊情况下是有一些不合常理的。我称之为“未定义的规则”。这些未定义的规则总结起来有以下三点：

1. 在无穷大布局空间时的 * 的比例
1. 在跨多列布局时 * 的比例
1. 在全 Auto 尺寸时各列尺寸

不过你也可能会吐槽我的用法不对，可是，作为一个连表现行为都公开的 API，其行为也是 API 的一部分，应该具有明确可追溯可文档化的行为；而不是由用户去探索，最终无法猜测可发生事情的行为。

微软没有任何官方文档公开了这些诡异的行为，我也没有在任何第三方资料中找到这样的行为（这些都是我自己总结的）。我认为，微软没有为此公开文档是因为行为太过诡异，无法编写成文档！

你可能还会质疑，可以去 [Reference Source](https://referencesource.microsoft.com/) 查阅 `Grid` 布局的源码，那样就能解释这些诡异的行为了。确实如此，那里是这一切诡异布局背后的罪魁祸首。

我阅读过 `Grid` 的布局源码，但没能全部理解，而且在阅读的过程中发现了一些微软官方承认的 Bug（我也没有能力去解决它）。

不过，我整整三天的时间写了一个全新的 `Grid` 布局算法（*感谢 @[林德熙](https://lindexi.github.io/lindexi/) 抽出时间跟我探讨 `Grid` 的布局算法*）。在新的算法中，对于微软公开的 `Grid` 布局行为，我跟它的表现是一样的。对于本文中提到的各种 Bug，我找不到手段实现跟它一模一样的布局结果，但是，我可以文档化地完全确定 `Grid` 整个布局的所有行为。包括以上所有我认为的“未定义的规则”。

新 `Grid` 布局算法的源码在 GitHub 上，我提交给了 Avalonia：[A new grid layout algorithm to improve performance and fix some bugs by walterlv · Pull Request #1517 · AvaloniaUI/Avalonia](https://github.com/AvaloniaUI/Avalonia/pull/1517/files)。
