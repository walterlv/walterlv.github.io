---
title: "合并 Jekyll 多种类型的页面"
date: 2017-10-12 23:48:50 +0800
categories: jekyll
tags: jekyll concat liquid
description: 
---

以前胡思乱想时，有时会讲给小伙伴们听，有时会将想法在微信上发给自己，但多数时候是没有后文的，让胡思乱想烂在脑中。还好多数时候我记得，就像我亲自记得 3 岁时候的一些故事一样。

但今天大脑被一些凌乱的事情撑爆了，心情极度低落。正好近期学着写博客，于是想把一些胡思乱想的事情写在自己的站点上。

阅读本文，将学到如何用 Jekyll 做多种类型的页面，并在首页的列表中将这些不同种类的页面合并按日期排序。

---

### 制作除博客之外的新页面类型

Jekyll 不止支持博客（post）页面类型，也可以支持自定义页面类型。当然博客是它唯一的内建类型（hard-coded type）。

我希望独立于博客写一些其他的胡思乱想的随笔。为了避免影响到正常博客的列表，我决定采用自定义页面类型。

##### **第一步：在 _config.yml 文件中添加自定义页面类型集合**

```yml
collections:
  article:
    output: true
```

其中，`article` 是我为自定义类型取的名称。

##### **第二步：添加自定义页面类型文件夹**

需要在 Jekyll 项目根目录建立一个 _article 文件夹，此名称与第一步的类型名称一致，前面加下划线。

此后，在这个文件夹里放跟 _posts 文件夹中一样规则的文件用于写文章。

##### **（可选）第三步：添加自定义页面类型默认元数据**

```
defaults:
  - scope:
      path: "_article"
      type: "article"
    values:
      layout: "post"
      author: "walterlv 吕毅"
```

这里我让 article 类型使用 post 类型的页面布局。

##### **（可选）第四步：添加自定义页面类型的页面列表**

就像 posts 列表的页面一样制作一个 article 列表。

可以参考我的 posts 布局文件和 article 布局文件，两者几乎一样都是可以的，只是 article 遍历的时候使用 `site.article`。

### 制作一个合并了博客和其他页面类型的页面列表

我希望在首页中混杂我的博客和胡思乱想，于是必须将两种不同类型的集合合并。

使用如下代码：

{% raw %}
```liquid
{% assign all_posts = "" | split: "" %}
{% for article in site.article %}
    {% assign all_posts = all_posts | push: article %}
{% endfor %}
{% for post in site.posts %}
    {% assign all_posts = all_posts | push: post %}
{% endfor %}
{% assign all_posts = all_posts | sort: date | reverse %}
```
{% endraw %}

由于 Jekyll 没有 concat 方法，所以只好一个个地将集合项添加进新集合。集合生成好后，按照日期排序。

此后，遍历以生成列表的时候使用 `all_posts` 集合即可。

---

#### 参考资料

- [Concat arrays in Jekyll(liquid)](https://gist.github.com/BryanSchuetz/52012affd9318ba59e19a74639a8c16a)
- [Sorting & ordering collections · Issue #2515 · jekyll/jekyll](https://github.com/jekyll/jekyll/issues/2515)
- [jekyll - For loops in Liquid: using reversed in conjunction with limit:1 - Stack Overflow](https://stackoverflow.com/questions/12465521/for-loops-in-liquid-using-reversed-in-conjunction-with-limit1)
