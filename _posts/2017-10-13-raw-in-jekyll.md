---
title: "转义，解决花括号在 Jekyll 被识别成 Liquid 代码的问题"
date: 2017-10-13 00:08:29 +0800
categories: jekyll
tags: jekyll liquid raw
description: 
---

{% assign openTag = '{%' %}

在 [DependencyProperty.UnsetValue 的正确打开方式](/post/xaml/how-to-use-dependencyproperty-unsetvalue.html) 和 [合并 Jekyll 多种类型的页面](/post/jekyll/jekyll-concat.html) 这两篇博客中，我都遇到了代码中的花括号被 Jekyll 识别为 Liquid 代码的问题。

---

然而 Liquid 的问题还需 Liquid 来解。

而 Liquid 的 raw 就是用来解决这个问题的。

```liquid
{{ openTag }} raw %}
{% raw %}{% comment %} 这里是各种包含奇怪花括号 {{{0}}} 的地方 {% endcomment %}{% endraw %}
{{ openTag }} endraw %}
```

#### 参考资料

- [Jekyll 大括号 {{ openTag }} %} 转义 · Xiao](http://xiaohuang.rocks/2016/03/16/b-jekyll/)
