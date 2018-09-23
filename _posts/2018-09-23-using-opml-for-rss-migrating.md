---
title: "使用并解析 OPML 格式的订阅列表来转移自己的 RSS 订阅（概念篇）"
date: 2018-09-23 18:40:34 +0800
categories: dotnet csharp uwp
published: false
---

OPML 全称是 **Outline Processor Markup Language** ，即 **大纲处理标记语言**。目前流行于收集博客的 RSS 源，便于用户转移自己的订阅项目。

本文将介绍这个古老的格式，并提供一个 .NET 上的简易解析器。

---

本文分为两个部分，一个是理解 OPML 格式，一个是解析此格式：

- [概念篇（本文）](/post/using-opml-for-rss-migrating.html)
- [解析篇](/post/deserialize-opml-using-dotnet.html)

<div id="toc"></div>

### OPML 格式

RSS 订阅你应该并不陌生，你可以在我的博客上方看到 RSS 的订阅源按钮，也可以在各大博客站点发现这样的订阅按钮。

![RSS 图标](/static/posts/2018-09-23-feed-icon.svg)  
▲ RSS 图标

图片来源于维基百科，如果你不太了解 RSS，可以直接前往 [RSS - 维基百科，自由的百科全书](https://zh.wikipedia.org/wiki/RSS) 查看或者自己搜索。

OPML 是个古老的格式，第一个版本还是二十世纪六十年代的产物呢（详见 [OPML 1.0 Specification](http://dev.opml.org/spec1.html)）；只不过实际在用的 1.0 版本是 2000 年发布的，2.0 版本是 2007 年发布的。这么古老的格式也不妨碍它依然成为订阅源交换的标准格式。不过我们这篇文章不会去谈历史，我们只谈它的格式以及使用。

OPML 官网对其作用的描述为：

> The purpose of this format is to provide a way to exchange information between outliners and Internet services that can be browsed or controlled through an outliner.
> 
> OPML is also the file format for an outliner application, which is why OPML files may contain information about the size, position and expansion state of the window the outline is displayed in.
> 
> OPML has also become popular as a format for exchanging subscription lists between feed readers and aggregators.

其中最后一行的描述即交换订阅，尤其是 RSS 订阅。

### 典型的 OPML 文件

为了直观地了解 OPML 格式，我直接贴一个我的订阅的极简版文件内容。

```xml
<?xml version="1.0" encoding="UTF-8"?>
<opml version="1.0">
  <head>
    <title>walterlv</title>
  </head>
  <body>
    <outline text="walterlv" title="walterlv" type="rss" xmlUrl="https://walterlv.com/feed.xml" htmlUrl="https://walterlv.com/" />

    <outline title="Team" text="Team">
      <outline text="林德熙" title="林德熙" type="rss" xmlUrl="https://lindexi.gitee.io/lindexi/feed.xml" htmlUrl="https://lindexi.gitee.io/" />
    </outline>

    <outline title="Microsoft" text="Microsoft">
      <outline text="Microsoft .NET Blog" title="Microsoft .NET Blog" type="rss" xmlUrl="https://blogs.msdn.microsoft.com/dotnet/feed/"/>
      <outline text="Microsoft The Visual Studio Blog" title="Microsoft The Visual Studio Blog" type="rss" xmlUrl="https://blogs.msdn.microsoft.com/visualstudio/feed/"/>
    </outline>
  </body>
</opml>
```

你可以很容易地看出它的一些特征。比如以 `opml` 为根，`head` 中包含 `title`，`body` 中包含分组的 `outline`。每一个 `outline` 中包含 `text`, `type`, `xmlUrl` 等属性。接下来我们详细描述这个格式。

### OPML 文件中的节点解释

#### opml 根节点

`<opml>` 是 OPML 格式文件的根节点，其 `version` 属性是必要的。它的值可能为 `1.0` 或 `2.0`；如果是 `1.0`，则视为符合 [OPML 1.0 规范](http://dev.opml.org/spec1.html)；如果是 `2.0`，则视为符合 [OPML 2.0 规范](http://dev.opml.org/spec2.html)。额外的，值也可能是 `1.1`，那么也视为符合 1.0 规范。

`opml` 根节点中包含 `head` 和 `body` 节点。

#### head 节点

`head` 节点可包含 0 个或多个元素：

- `title`
- `dateCreated`
- `dateModified`
- `ownerName`
- `ownerEmail`
- `ownerId`
- `docs`
- `expansionState`
- `vertScrollState`
- `windowTop`
- `windowLeft`
- `windowBottom`
- `windowRight`

#### body 节点

`body` 节点包含一个或多个 `outline` 元素。
