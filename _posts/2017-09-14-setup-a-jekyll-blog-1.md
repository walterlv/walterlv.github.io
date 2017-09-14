---
layout: post
title: "[译] 搭建一个基于 GitHub Pages 的 Jekyll 博客（包含评论功能）"
date: 2017-09-14 23:16:14 +0800
categories: jekyll
keywords: jekyll
description: 搭建一个博客，并且看起来还不错。
published: false
---

本文翻译自 [Setup up a jekyll blog using github pages and disqus comments](http://vdaubry.github.io/2014/10/19/setup-a-jekyll-blog/)，原作者 [Vincent Daubry](http://vdaubry.github.io)。

想不想马上就开始搭建个人博客，简单易学，还好看？这篇文章将教你用 [Jekyll](http://jekyllcn.com/) 搭建博客，配上一款养眼的主题，然后跑在 [GitHub Pages](https://pages.github.com/) 上。

---

### 为什么选用静态的站点生成器？

相比于使用类似 WordPress 这样的 CMS（译者注：内容管理系统，允许用户在 Web 上创建和发布内容），我们有几条理由来选择使用静态站点生成器。对于本文来说，我们主要关注于 Jekyll 带给我们的简单：
- 上手容易（熟悉 Markdown 的话就更好了）
- 相当少的设置
- 部署方便，不需要运行服务器端程序
- 可以直接放到 GitHub 上用（感谢 [GitHub Pages](https://pages.github.com/)）

即便是静态站点生成器，[这里](https://staticsitegenerators.net/)也列出了很多款，那凭什么选择 Jekyll？
- 这可是当下最流行的静态站点生成器之一（[不信看这里](https://www.staticgen.com/)）
- GitHub 在用（GitHub 创始人 Tom Preston-Werner 编写）
- 基于 Ruby 生态系统

### 挑选一款 Jekyll 博客主题

默认的模板在设计上只能说一般般，不过你可以从 [jekyllthemes.org](http://jekyllthemes.org/) 找到更棒的模板。你正在阅读的本站博客用的是 [Read Only](https://github.com/old-jekyll-templates/Read-Only-Jekyll-Theme) 模板，把它克隆下来你就可以开始啦。（译者注：原文博客用的模板是 [clean-blog](https://github.com/BlackrockDigital/startbootstrap-clean-blog-jekyll)）

强烈推荐把每个页面顶部那张默认的大图换一张，在 [stock-up](http://www.sitebuilderreport.com/stock-up) 你可以找到很多基于[知识共享许可协议](https://creativecommons.org/licenses/?lang=zh)的高清大图。

为了在本地预览效果，你需要先安装 Jekyll，参见[这里](http://jekyllcn.com/)。不过总体来说再复杂也只是这一句：

```bash
gem install jekyll
```

（译者注：然而 Windows 系统上复杂一点点，上面那个命令在 Windows 上其实是跑不起来的，如果你没有配好环境，请先阅读 [在 Windows 系统上安装 Jekyll 环境](2017-09-14-setup-a-jekyll-blog-on-windows.html)。）

为了让 Jekyll 在你的电脑上跑起来，请阅读 [Jekyll 基本用法](http://jekyllcn.com/docs/usage/)。
