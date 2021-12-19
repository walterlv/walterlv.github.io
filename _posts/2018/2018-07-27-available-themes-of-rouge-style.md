---
title: "语法高亮不够漂亮？这里有你想要的 Rouge 主题"
publishDate: 2018-07-27 22:15:25 +0800
date: 2018-08-12 14:51:50 +0800
tags: site
coverImage: /static/posts/2018-07-27-21-10-28.png
---

写了那么久的代码，找到了满意的代码着色风格吗？想必文本编辑器的代码着色风格你已经找到了中意的了，那么你在网上 post 上去的代码呢？

Rouge 是一款基于 Ruby 的语法高亮工具，能为你的代码生成漂亮的语法高亮样式。本文将介绍如何使用它，并为大家提供它默认的语法高亮样式预览。

---

## 在 Jekyll 中使用 Rouge 语法高亮插件

Jekyll 中的 `__config.yml` 文件记录了 Jekyll 的最核心配置。其中，`markdown` 字段的值表示使用哪一款插件来将 Markdown 文本转换为 HTML 页面结构。

GitHub 推荐使用的 Jekyll 的 Markdown 插件为 kramdown。kramdown 是一个强大且高性能的文本转换引擎，你可以通过阅读 [kramdown 和 markdown 较大的差异比较 - Hom](http://gohom.win/2015/11/06/Kramdown-note/) 了解 kramdown 的强大之处。

不过，我们现在关系的是它可以使用的语法高亮工具 —— Rouge。在 Jekyll 的配置文件中这样配置它们：

```yml
markdown: kramdown
kramdown:
  input: GFM
  syntax_highlighter: rouge
```

其中，`input: GFM` 指的是 [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)。

Rouge 支持的语言可以前往此处查看：[Rouge](http://rouge.jneen.net/)

## 生成 Rouge 语法高亮样式

当然，以上配置只是告诉 kramdown 转换引擎在转换 Markdown 为 HTML 的时候，使用 rouge 格式的样式（具体只语法高亮所用的 css 的 class）。我们需要另外使用 rougify 工具生成对应的样式文件才行。

你需要先配好 Ruby 环境。如果没有配好，推荐阅读 [快速在 Windows 上搭建 Jekyll 开发环境](/post/setup-jekyll-in-windows) 快速配置。

随后，你便可以使用命令来安装 Rouge。

```bash
$ gem install rouge
```

安装之后，使用以下命令查看自带的样式有哪些：

```bash
$ rougify help style
```

随后得到的输出中可以得知样式有很多种。

```bash
usage: rougify style [<theme-name>] [<options>]

Print CSS styles for the given theme.  Extra options are
passed to the theme.  Theme defaults to thankful_eyes.

options:
  --scope       (default: .highlight) a css selector to scope by

available themes:
  base16, base16.dark, base16.light, base16.monokai, base16.monokai.dark, base16.monokai.light, base16.solarized, base16.solarized.dark, base16.solarized.light, colorful, github, gruvbox, gruvbox.dark, gruvbox.light, igorpro, molokai, monokai, monokai.sublime, thankful_eyes, tulip
```

使用以下命令生成一个 github 风格的样式到 assets/css/syntax.css 文件中：

```bash
$ rougify style github > assets/css/syntax.css
```

别忘了在你的 `<head>` 中把这份 css 文件加进去哦！

{% raw %}
```html
<link rel="stylesheet" href="{{ "/assets/css/syntax.css" | prepend: site.baseurl }}">
```
{% endraw %}

## Rouge 自带语法高亮主题预览

虽然 Rouge 自带了很多种不同的语法高亮样式，但都没有办法直接看到语法高亮的效果。于是我尝试了一些，并贴出了我的 C# 代码在 Rouge 自带语法高亮主题下的效果。

一般来说很难找到一种语法高亮适用于各种语言，所以选择的时候推荐选一个差不多的，然后再慢慢改。

以下每张图片的后面都标注了这种风格主题再 rouge 中的名称，使用上一节中提到的命令可以生成语法高亮样式。

![github](/static/posts/2018-07-27-21-10-28.png)  
▲ github 需要额外设置前景色 `#24292e`

![colorful](/static/posts/2018-07-27-21-03-49.png)  
▲ colorful

![monokai.sublime](/static/posts/2018-07-27-21-13-59.png)  
▲ monokai.sublime

![tulip](/static/posts/2018-07-27-21-15-26.png)  
▲ tulip

![thankful_eyes](/static/posts/2018-07-27-21-16-08.png)  
▲ thankful_eyes

![monokai](/static/posts/2018-07-27-21-17-22.png)  
▲ monokai

![molokai](/static/posts/2018-07-27-21-18-25.png)  
▲ molokai

![igorpro](/static/posts/2018-07-27-21-20-10.png)  
▲ igorpro

![gruvbox.dark](/static/posts/2018-07-27-21-21-30.png)  
▲ gruvbox.dark

![gruvbox](/static/posts/2018-07-27-21-21-30.png)  
▲ gruvbox

![base16](/static/posts/2018-07-27-21-29-40.png)  
▲ base16

## 我修改的样式

我发现我以前的样式与 monokai.sublime 是很接近的。这应该算是巧合，因为此前我是仿我的 VSCode 主题 [One Dark Pro Vivid](https://marketplace.visualstudio.com/items?itemName=zhuangtongfa.Material-theme)。

既然如此，我就直接基于 monokai.sublime 修改好了。我将默认文字颜色从白色 `#ffffff` 改成了 `#bbbbbb`，然后将 diff 的颜色也修改成 monokai 的样式。

![monokai 的diff](/static/posts/2018-07-27-22-07-36.png)

[点击下载 syntax.monokai.sublime.css](/assets/css/syntax.css)

---

**参考资料**

- [Plugins - Jekyll • Simple, blog-aware, static sites](https://jekyllrb.com/docs/plugins/)
- [kramdown 和 markdown 较大的差异比较 - Hom](http://gohom.win/2015/11/06/Kramdown-note/)
- [GitHub Flavored Markdown Spec](https://github.github.com/gfm/)
- [jneen/rouge: A pure-ruby code highlighter that is compatible with pygments http://rouge.jneen.net/](https://github.com/jneen/rouge)
- [Rouge](http://rouge.jneen.net/)

