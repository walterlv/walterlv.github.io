---
title: "在 HTML 超链接上添加可交互的 ToolTip"
date: 2018-03-08 18:39:40 +0800
tags: web html css
permalink: /posts/add-tooltip-for-html-a.html
---

当鼠标滑过超链接的那一刻，我们都能想象出一个熟悉的白色提示框从鼠标指针所在的位置淡入。那是 ToolTip 提示框。HTML 中我们能通过简单的属性设置获得 ToolTip，但如果希望 ToolTip 是能交互的，那么就阅读本文吧！

---

<div id="toc"></div>

## 原生 ToolTip

先来看看 HTML 原生自带的 ToolTip：

<a title="你看到了什么？对，这就是原生自带的 ToolTip！" href="#">请将鼠标划至这里</a>

代码非常简单：

```html
<a title="你看到了什么？对，这就是原生自带的 ToolTip！" href="#">请将鼠标划至这里</a>
```

## 可交互 ToolTip

可交互的 ToolTip 就没那么幸运了，没有自带。于是，我们可考虑通过自己拼接的 html 容器来实现。效果像这样：

<span class="tooltip">
    <span><a href="https://walterlv.github.io">请将鼠标划至这里</a></span>
    <span class="tooltip-text" style="background:#eee;padding:2px 0;border-radius: 0.5rem;">这是 <a href="https://walterlv.github.io">内部的链接哦</a></span>
</span>

这是靠一组 html 容器和一些配套的 css 来实现的。

```html
<span class="tooltip">
    <span><a href="https://walterlv.github.io">请将鼠标划至这里</a></span>
    <span class="tooltip-text">这是<a href="https://walterlv.github.io">内部的链接哦</a></span>
</span>
```

```css
.tooltip .tooltip-text
{
    visibility: hidden;
    width: 14rem;
    margin-left: -7rem;
    bottom: 100%;
    left: 50%;
    background: #eee;
    border-radius: 0.5rem;
    text-align: center;
    padding: 2px 0;
    position: absolute;
    z-index: 1
}

.tooltip:hover .tooltip-text
{
    visibility: visible
}
```

本博客底部的版权信息中使用到了这种交互式 ToolTip。

