---
title: "XAML 很少人知道的科技"
publishDate: 2019-04-01 12:04:57 +0800
date: 2019-04-06 09:49:14 +0800
categories: dotnet csharp wpf uwp
position: knowledge
published: false
---

在此处编辑 blog.walterlv.com 的博客摘要

---

<div id="toc"></div>

## Thickness 可以用空格分隔

当你用设计器修改元素的 Margin 时，你会看到用逗号分隔的 `Thickness` 属性。使用设计器或者属性面板时，使用逗号是默认的行为。

不过你有试过，使用空格分隔吗？

```xml
<Button Margin="10 12 0 0" />
```

---

**参考资料**