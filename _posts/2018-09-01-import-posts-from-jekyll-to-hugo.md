---
title: "从 Jekyll 博客迁移到 Hugo 博客"
date: 2018-09-01 08:18:30 +0800
categories: site
published: false
---

同为静态博客，Hugo 以其静态站点的快速生成速度而闻名。以我的博客为例，Jekyll 的生成时间接近 30 秒，但 Hugo 生成同样的站点只需要不到 1 秒。Hugo 提供了不少优秀漂亮的主题，然而我自己的博客样式相当大部分是我自己写的，所以只用社区提供的主题是不能完全完成我的迁移的。所以我需要手工迁移一部分。

本文将介绍如何将一个经过丰富自定义的 Jekyll 博客迁移到 Hugo。

---

### 充分利用 hugo import 命令

GitHub 大神 [coderzh](https://github.com/coderzh) 在一个重要的 [PR](https://github.com/gohugoio/hugo/pull/1469) 中帮助我们完成了很大一部分的自动迁移工作，他为 Hugo 添加了 `import` 命令，可以只通过一条命令就完成最主要部分的迁移工作。

```bash
$ hugo import jekyll your-jekyll-dir target-dir
```

这里的自动迁移帮助我们做了这些事情：

1. 格式化 Markdown 的 YAML 元数据
1. 迁移静态资源

### 修改未迁移完全的 YAML 元数据

关于元数据，迁移之前是这样的：

```yaml
title: "从 Jekyll 博客迁移到 Hugo 博客"
publishDate: 2018-08-19 20:42:42 +0800
date: 2018-08-21 07:58:54 +0800
categories: site
```

然而迁移完后是这样的：

```yaml
categories: site
date: "2018-08-19T07:58:54Z"
publishDate: 2018-08-19 20:42:42 +0800
title: 从 Jekyll 博客迁移到 Hugo 博客
```

很明显，Hugo 官网推荐使用的 `publishDate` 字段并没有真正完成迁移。

### 补充未迁移完全的静态资源

`hugo import` 命令已经帮我们完成了多数静态资源的迁移。

---

#### 参考资料

- [Hugo Documentation - Hugo](https://gohugo.io/documentation/)
- [Hugo中文文档](http://www.gohugo.org/)
- [使用Hugo Import一键迁移Jekyll - Hugo中文文档](http://www.gohugo.org/post/coderzh-hugo-import-from-jekyll/)
- [码云 Pages 新玩法，支持 Hexo 和 Hugo – 码云 Gitee 官方博客](https://blog.gitee.com/2018/07/05/hexo_hugo/)
- [零基础使用Hugo和GitHub Pages创建自己的博客 - 宋净超的博客|Cloud Native Developer Advocate|jimmysong.io](https://jimmysong.io/posts/building-github-pages-with-hugo/)
- [Hugo静态网站生成器中文教程 - nanshu.wang](http://nanshu.wang/post/2015-01-31/)
