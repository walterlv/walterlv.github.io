---
title: "为博客或个人站点的 Markdown 添加 LaTeX 公式支持"
publishDate: 2018-05-26 10:20:16 +0800
date: 2018-08-12 14:51:35 +0800
tags: site web vscode
coverImage: /static/posts/2018-05-26-10-18-53.png
permalink: /posts/add-latex-support-for-web-pages.html
---

LaTeX 是一套排版系统，原生包含对科学和技术型文档内容的支持，而 LaTeX 公式（LaTeX math and equations）则是这种支持中非常重要的一部分。如果能够在博客或个人站点中使用到 LaTeX 的排版系统，或者说只是其中的数学公式部分，对学术性（或者只是使用到了部分数学原理）文章来说将会非常方便。

本文将推荐一些脚本，以便添加 LaTeX 数学公式的支持。

---

## 为站点添加 LaTeX 公式支持

在你的站点中添加 `MathJax.js` 的支持即可。比如添加下面这段代码：

```html
<script type="text/javascript" src="https://cdn.mathjax.org/mathjax/latest/MathJax.js?config=TeX-AMS-MML_HTMLorMML"></script>
```

比如机器学习中的线性模型：

$$h_\theta(x) = \theta_1 x_1 + \theta_2 x_2 + ... \theta_n x_n = \sum_{i=1}^n \theta_i x_i$$

以及它的向量形式：

$$h_\theta(x) = \theta^T x$$

可以使用如下的 LaTeX 公式写出：

```
$$h_\theta(x) = \theta_1 x_1 + \theta_2 x_2 + ... \theta_n x_n = \sum_{i=1}^n \theta_i x_i$$
$$h_\theta(x) = \theta^T x$$
```

而你所需做的，仅仅只是在 `<head>` 中加入如上那段 js 脚本。

如果你希望写出更复杂的 LaTeX 公式，可以参考 [Latex 公式速查](https://lindexi.oschina.io/lindexi/post/Latex-%E5%85%AC%E5%BC%8F%E9%80%9F%E6%9F%A5.html)。

## 为 VSCode 编辑器添加 LaTeX 公式支持

在 VSCode 插件商店中搜索 *latex* 可以得到不少的插件，我使用的是目前有 106K 下载量的 *Markdown+Math* 插件。

在 VSCode 中，只需要预览 Markdown，即可看到这样的 LaTeX 公式支持：

![](/static/posts/2018-05-26-10-18-53.png)

**参考资料**

- [Easily Add LaTeX Support To Jekyll](http://cushychicken.github.io/easy-latex-in-jekyll)
- [Latex 公式速查](https://lindexi.oschina.io/lindexi/post/Latex-%E5%85%AC%E5%BC%8F%E9%80%9F%E6%9F%A5.html)


