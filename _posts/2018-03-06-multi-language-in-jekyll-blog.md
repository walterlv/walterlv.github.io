---
title: "为带有多种语言的 Jekyll 博客添加多语言选择"
date: 2018-03-06 08:52:56 +0800
categories: jekyll web html css
versions:
  - current: 简体中文
  - English: /post/multi-language-in-jekyll-blog.html
  - русский: /post/multi-language-in-jekyll-blog.html
  - 繁體中文: /post/multi-language-in-jekyll-blog.html
  - 简体中文: /post/multi-language-in-jekyll-blog.html
  - 日本語: /post/multi-language-in-jekyll-blog.html
  - ไทย: /post/multi-language-in-jekyll-blog.html
published: false
---

我有几篇博客是用多种语言编写的，一开始我是在每篇博客中添加其他语言的链接，但多语言博客多了之后就成了复制粘贴了。是时候做一个通用的布局来实现多语言博客了！

本文将为大家提供一个我编写好的多语言博客选择器（MIT License）。

---

先来看看效果。现在，请选择一个阅读语言：

{% include post-version-selector.md %}

不要惊讶：其实这里的每一种语言在内部都

---

#### 参考资料

- [jekyll - Iterate over hashes in liquid templates - Stack Overflow](https://stackoverflow.com/questions/8206869/iterate-over-hashes-in-liquid-templates)
- [How can I set the default value for an HTML `<select>` element? - Stack Overflow](https://stackoverflow.com/questions/3518002/how-can-i-set-the-default-value-for-an-html-select-element)
- [超详细的HTML `<select>` 标签用法及技巧介绍_w3cschool](https://www.w3cschool.cn/htmltags/tag-select.html)
- [Whitespace control – Liquid template language](http://shopify.github.io/liquid/basics/whitespace/)
