---
title: "如何给 GitHub Pages 配置多个域名？"
date: 2020-04-10 15:02:52 +0800
tags: github
position: problem
---

因为以前对域名进行了一些调整，所以实际上我的博客在历年来经历了两个域名 blog.walterlv.com（新）和 walterlv.com（旧）。然而 GitHub Pages 只支持一个自定义域名，所以为了兼容旧域名的访问，如何可以让多个域名对应同一个 GitHub Pages 呢？

---

<div id="toc"></div>

## 背景

- <blog.walterlv.com> （新）
- walterlv.com （旧）

以前不会碰到这样的问题，是因为我并没有使用 GitHub Pages 服务来构建博客，然而现在是了。

GitHub Pages 识别访问的是哪个站点的方式是识别 xxx.github.io 的 xxx 部分，比如默认我只能通过 <walterlv.github.io> 来访问到我通过 GitHub Pages 搭建的博客。因此如果你使用反向代理服务器将一个其他的域名代理到 xxx.github.io 是会得到 404 的——GitHub Pages 不知道你想访问哪个站点。

![GitHub Pages 设置](/static/posts/2020-04-10-10-31-52.png)

这时，在 GitHub Pages 设置里面，你就需要设置一个 Custom domain 来帮助 GitHub Pages 部署的时候知道某个域名实际上是你的，需要用来显示此仓库的 GitHub Pages。

比如我在这里设置了 <blog.walterlv.com>，于是当我将反向代理服务器代理到 walterlv.github.io 时，GitHub Pages 便能正确得知这实际上是 walterlv.github.io 这个仓库的，这才能正确显示 GitHub Pages 页面。

此设置会在你的仓库根目录生成 CNAME 文件，里面仅一行文本，即域名 <blog.walterlv.com>。

然而问题来了，我之前的域名实际上是 walterlv.com，这样，当我设置 DNS 时，如果直接将 walterlv.com 设置到 walterlv.github.io 依然会出现 404。

接下来我们说说解决办法。

## 通过中转仓库

我们需要在 GitHub 上再新建一个仓库，用来中转旧域名中的访问到新的域名。

### 第一步：新建随意名字的仓库

我们新建一个仓库。新建的时候实际上可以无所谓命名，因为这个仓库里面不会真的有内容，多数时候访问实际上是 404 的。但我们创建它只是为了前面提到的那个 CNAME 文件，告诉 GitHub Pages 我们有两个域名而已。

![新建仓库](/static/posts/2020-04-10-14-32-47.png)

这里，我创建了一个名为 oldblog 的仓库，正常情况下，访问这个仓库 GitHub Pages 的域名前缀为 walterlv.github.io/oldblog。

### 第二步：为此仓库添加 GitHub Pages 服务

接着，按照平时去创建 GitHub Pages 服务的方法往这个仓库提交代码。

例如可以在仓库根目录放一个 `_config.yml` 文件（这是 Jekyll 的配置文件），然后直接提交：

```yaml
title: walterlv
author: walterlv
```

当有了一个分支和 Jekyll 的配置文件后，就可以直接使用 GitHub Pages 服务了。在这里，我们将自定义域名填写成旧的域名 walterlv.com。

![为新建的仓库配置 GitHub Pages](/static/posts/2020-04-10-14-42-36.png)

这样，当我们在域名服务器中将 walterlv.com 设置到 walterlv.github.io 时，GitHub Pages 至少知道应该使用这个仓库里的 GitHub Pages 来显示。

### 第三步：创建用于跳转的 404 页面

然而我们并不打算在这个仓库里真的放代码/网页，于是在根目录放一个 404.html 文件：

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <title>正在重定向…… - walterlv</title>
</head>
    <script language="javascript">
        var domain = "blog.walterlv.com";
        var current = window.location.href;
        var target = current.substring(current.indexOf('/', current.indexOf(':') + 3));
        window.location.href = "//" + domain + target;
        location.href = "//" + domain + target;
    </script>
    <body>
        正在重定向……
    </body>
</html>
```

现在，仓库里面是这样的（[walterlv/oldblog](https://github.com/walterlv/oldblog)）：

![仓库文件](/static/posts/2020-04-10-14-54-31.png)

### 第四步：配置 DNS

最后检查你的 DNS 配置：

- 旧域名：walterlv.com -> walterlv.github.io
- 新域名：<blog.walterlv.com> -> walterlv.github.io

到现在，就全部完成。不信你试试，点击链接 <https://walterlv.com/post/multiple-domains-for-github-pages> 会短暂进入一个“正在重定向……”的页面，然后随即跳转到新域名下相同的页面 <https://blog.walterlv.com/post/multiple-domains-for-github-pages>。

### 原理

一个 GitHub Pages 的仓库只能有一个 CNAME 文件，也即我们只能告知 GitHub 我们的一个合理域名。要让 GitHub Pages 支持两个域名，我们不得不建两个仓库，其中第二个仓库的地址为 xxx.walterlv.com/repo-name。在第二个仓库中，我们故意什么都不放，这样会触发 404，我们在 404 页面里面跳转到新的域名即完成了我们的目的。

---

**参考资料**

- [多个域名映射同一个github pages - 守望的个人博客](https://www.yanbinghu.com/2019/03/29/25951.html)
