---
title: "为带有多种语言的 Jekyll 博客添加多语言选择"
date: 2018-03-06 08:52:56 +0800
categories: jekyll web html css
version:
  - current: 简体中文
versions:
  - English: #
  - русский: #
  - 繁體中文: #
  - 简体中文: #
  - 日本語: #
  - ไทย: #
published: false
---

我有几篇博客是用多种语言编写的，一开始我是在每篇博客中添加其他语言的链接，但多语言博客多了之后就成了复制粘贴了。是时候做一个通用的布局来实现多语言博客了！

本文将为大家提供一个我编写好的多语言博客选择器（MIT License）。

---

先来看看效果。现在，请选择一个阅读语言：{% include post-version-selector.html %}

不要惊讶：其实这里的每一种语言都指向了你正在阅读的简体中文😜。

### 编写一个简单的语言选择器

html 里可以用 `<select>` 来做选择器。当然，本文只是用 `<select>` 当作例子，你也可以做成表格型的、链接型的或者其他更多更炫酷的样子。

`<select>` 的最简例子：

> ```html
> <select>
>   <option value="/post/multi-language-in-jekyll-blog.html">English</option>
>   <option value="/post/multi-language-in-jekyll-blog.html">中文</option>
> </select>
> ```

来看看效果：
<select style="{display:inline}">
  <option value="#">English</option>
  <option value="#">中文</option>
</select>

然而，我们希望在点击的时候自动跳转到对应的链接。于是，我们为 `select` 的 `onchange` 事件添加处理函数：

> ```html
> <select onchange="self.location.href=options[selectedIndex].value">
>   <option value="/post/multi-language-in-jekyll-blog.html">English</option>
>   <option value="/post/multi-language-in-jekyll-blog.html">中文</option>
> </select>
> ```

再试试选择一下：
<select style="{display:inline}" onchange="self.location.href=options[selectedIndex].value">
  <option value="/post/multi-language-in-jekyll-blog.html">English</option>
  <option value="/post/multi-language-in-jekyll-blog.html">中文</option>
</select>

{% raw %}
```html
{%- if page.versions -%}
<p>
  {%- comment -%} 从 page.versions 中查找 current 的值，并存到 current_version 中。 {%- endcomment -%}
  {%- for version_hash in page.versions -%}
    {%- for version in version_hash -%}
      {%- assign key = version[0] -%}
      {%- assign value = version[1] -%}
      {%- if key == "current" -%}
        {%- assign current_version = value -%}
        {%- break -%}
      {%- endif -%}
    {%- endfor -%}
  {%- endfor -%}

  {%- comment -%} 从 page.versions 中遍历所有版本的值，并作为选项显示到 select 中。 {%- endcomment -%}
  <select name="filter" id="filter" onchange="self.location.href=options[selectedIndex].value">
    {%- for version_hash in page.versions -%}
      {%- for version in version_hash -%}
        {%- assign key = version[0] -%}
        {%- assign value = version[1] -%}
        {%- if key != 'current' -%}
          {% comment %} 如果当前值等于 current_version，则选中此值。 {% endcomment %}
          {%- if current_version == key -%}
            <option value="{{ site.baseurl }}{{ page.url }}" selected="selected">{{ key }}</option>
          {%- else -%}
            <option value="{{ value }}">{{ key }}</option>
          {%- endif -%}
        {%- endif -%}
      {%- endfor -%}
    {%- endfor -%}
  </select>
</p>
{%- endif -%}
```
{% endraw %}

---

#### 参考资料

- [jekyll - Iterate over hashes in liquid templates - Stack Overflow](https://stackoverflow.com/questions/8206869/iterate-over-hashes-in-liquid-templates)
- [How can I set the default value for an HTML `<select>` element? - Stack Overflow](https://stackoverflow.com/questions/3518002/how-can-i-set-the-default-value-for-an-html-select-element)
- [超详细的HTML `<select>` 标签用法及技巧介绍_w3cschool](https://www.w3cschool.cn/htmltags/tag-select.html)
- [Whitespace control – Liquid template language](http://shopify.github.io/liquid/basics/whitespace/)
