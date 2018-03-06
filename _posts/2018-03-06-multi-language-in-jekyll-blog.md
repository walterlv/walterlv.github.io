---
title: "为带有多种语言的 Jekyll 博客添加多语言选择"
date_published: 2018-03-06 14:47:40 +0800
date: 2018-03-06 18:38:26 +0800
categories: jekyll web html css
version:
  current: 简体中文
versions:
  - English: #
  - русский: #
  - 繁體中文: #
  - 简体中文: #
  - 日本語: #
  - ไทย: #
---

我有几篇博客是用多种语言编写的，一开始我是在每篇博客中添加其他语言的链接，但多语言博客多了之后就成了复制粘贴了。是时候做一个通用的布局来实现多语言博客了！

本文将为大家提供一个我编写好的多语言博客选择器（MIT License）。

---

先来看看效果。现在，请选择一个阅读语言：{% include post-version-selector.html %}

不要惊讶：其实这里的每一种语言都指向了你正在阅读的简体中文😜。

<div id="toc"></div>

### 编写一个简单的语言选择器

html 里可以用 `<select>` 来做选择器。当然，本文只是用 `<select>` 当作例子，你也可以做成表格型的、链接型的或者其他更多更炫酷的样子。

`<select>` 的最简例子（可以直接写到 markdown 里）：

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

这就可以生效了。

### 引入页面配置元数据

毕竟博客有多篇，终归要引入配置的。现在我们为这篇文章配置两种语言。*（考虑到更通用的情况，我将一种语言定义为一种 version。）*

> ```yml
> version:
>   current: 简体中文
> versions:
>   - English: /post/multi-language-in-jekyll-blog.html
>   - 中文: /post/multi-language-in-jekyll-blog.html
> ```

这个配置是要放到博客 markdown 的元数据头里的。

### 制作布局文件

为了更加通用，我在 `_include` 文件夹中新建了 `post-version-selector.html` 的布局文件，然后在每一个需要引入语言选择器的地方加上 {% raw %}`{% include post-version-selector.html %}`{% endraw %}。*（比如本文一开始的那个语言选择器就是通过在那个地方加上了这句话生成的。）*

现在，我们把之前写的 `select` 搬到 `post-version-selector.html` 文件中，并引入页面中配置好的各语言路径。

{% raw %}
```html
{%- comment -%} MIT Licensed {%- endcomment -%}
{%- if page.versions -%}
  <select onchange="self.location.href=options[selectedIndex].value">
    {%- for version_hash in page.versions -%}
      {%- for version in version_hash -%}
        {%- assign key = version[0] -%}
        {%- assign value = version[1] -%}
        {%- if page.version.current == key -%}
          <option value="{{ site.baseurl }}{{ page.url }}" selected="selected">{{ key }}</option>
        {%- else -%}
          <option value="{{ value }}">{{ key }}</option>
        {%- endif -%}
      {%- endfor -%}
    {%- endfor -%}
  </select>
{%- endif -%}
```
{% endraw %}

统一解释一下：

1. 这里使用的 liquid 语言标记中都添加了短线 `-`，即 {% raw %}`{%- if condition -%}{%- endif -%}`{% endraw %}，这是为了将 liquid 语言占用的空行移除掉。
    - 不同于原生的 html，在 markdown 中的 html 是受到空行影响的，如果 `<select>` 的各个 `<option>` 之间有空行，那么整个 `select` 会被 `markdown` 解析器活生生拆掉。
1. liquid 中如果要遍历 key-value 值，需要使用 `for` 来取出其中的 key 和 value。
    - 就是 {% raw %}`{%- for version in version_hash -%}`{% endraw %} 这一行，虽然有个 `for`，但其实只会执行一次。

---

#### 参考资料

- [jekyll - Iterate over hashes in liquid templates - Stack Overflow](https://stackoverflow.com/questions/8206869/iterate-over-hashes-in-liquid-templates)
- [How can I set the default value for an HTML `<select>` element? - Stack Overflow](https://stackoverflow.com/questions/3518002/how-can-i-set-the-default-value-for-an-html-select-element)
- [超详细的HTML `<select>` 标签用法及技巧介绍_w3cschool](https://www.w3cschool.cn/htmltags/tag-select.html)
- [Whitespace control – Liquid template language](http://shopify.github.io/liquid/basics/whitespace/)
