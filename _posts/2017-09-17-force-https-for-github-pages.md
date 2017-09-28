---
layout: post
title: "让 GitHub Pages 强制使用 HTTPS（含码云的 gitee/oschina.io）"
date: 2017-09-17 16:01:34 +0800
date_modified: 2017-09-29 07:33:03 +0800
categories: jekyll
keywords: jekyll https
description: 对于 GitHub Pages，了解如何强制使用 https；对于码云 gitee.io 和 oschina.io，了解如何强制重定向到 https。
---

一天晚上在手机上浏览自己的博客时，发现居然充斥着各种恶心的广告！顿时内心犹如一万只神兽呼啸而过，不过又能怪谁呢？！

为避免引起读者不适，不贴图，只放链接，感兴趣自己点开看：[图 2](/assets/2017-09-17-ads-over-http-2.png)、[图 1](/assets/2017-09-17-ads-over-http-1.png)。

gitee.io）。

---

### GitHub Pages

去自己的 GitHub Pages 仓库页找了找设置项（https://github.com/walterlv/walterlv.github.io/settings），果然发现了有强制 https 设置。

![Enforce HTTPS](/assets/2017-09-17-15-44-17.png)

开启后再打开 [walterlv.github.io](https://walterlv.github.io/)，果然 https 了。

### 码云的 Pages 服务

GitHub Pages 设置得这么轻松，想必码云的 Pages 服务应该也不难吧……

去这里找：

![Pages 服务](/assets/2017-09-17-15-49-03.png)

没有。去设置里找，还是没有……

于是去码云 QQ 群里问了问，得到答复是直接在地址栏输入 [https://walterl.gitee.io](https://walterl.gitee.io/) 就会是 https 的。

可是，大多数读者怎么会去注意到去输入 https 呢？只好做重定向了。

于是在 Jekyll 的 GitHub 仓库中找到有人在讨论此问题：[https://github.com/jekyll/jekyll-redirect-from/issues/18](https://github.com/jekyll/jekyll-redirect-from/issues/18)。

根据其中的讨论，我在所有页面的头文件（其实就是 /_includes/head.html 文件）中写下了这么一段代码：

```html
<script>
    if ((window.location.protocol != "https:"))
        window.location = window.location.toString().replace(/^http:/, "https:");
</script>
```

本地跑起来一看，傻眼了，居然本机下是 https://localhost:4000，这肯定无法打开页面啊。好吧，那就对本机多做个判断，于是形成了下面这段代码：

```html
<script>
    // 判断非本机且未使用 https 时，强制重定向到 https。
    if ((!window.location.host.startsWith("localhost")) && (window.location.protocol != "https:"))
        window.location = window.location.toString().replace(/^http:/, "https:");
</script>
```

现在本文用的就是这个。不信？往上看，把地址栏里 https 的 s 去掉回车，是不是还是 https？
