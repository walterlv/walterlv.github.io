---
layout: post
title: "[译] 搭建一个托管在 GitHub Pages 的 Jekyll 博客，并添加 Disqus 评论功能"
date: 2017-09-15 20:50:20 +0800
categories: jekyll
keywords: jekyll
description: 搭建一个博客，并且看起来还不错。
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

### 部署 Jekyll 博客

要部署你的博客，你只需要做以下任意一件事即可：

1. 手动生成静态博客

```bash
jekyll build
```

执行完后会将静态页面全部生成到 _site 文件夹下，然后把这个文件夹用 HTML 服务进行托管即可：

- 在远程服务器上运行 Apache
- 扔到亚马逊 S3 上作为静态站点
- 拷贝到 Dropbox 上作为公开的文件夹（不确定有没有用，算了还是别试了……）（译者注：这句话是原作者说的，不关我的事……）

1. 用 GitHub Pages 托管，而你需要做的只是在 GitHub 上建一个这种名字的仓库：

```
your_github_username.github.io
```

每次你把你的 Jekyll 博客仓库推送到 GitHub 仓库上，GitHub 就会自动为你生成和部署静态站点。

### 使用 Disqus 为你的博客添加评论功能

添加 Disqus 评论功能非常简单：

- 去 [Disqus](https://disqus.com/) 创建个账号
- 一步步开通 Disqus 站点账号之后，进入到 Universal Code install instructions 页面
- 将 Disqus 提供的代码贴到 _layout / post.html 文件里面

(译者注：国内接入社会化评论需取得 ICP 备案，也就是说随着国内使用人数的增多，Disqus 随时有被屏蔽的可能性。)

### 添加发邮件功能

Clean-Blog 模板（译者注：就是原文博主用的那个模板）自带一个非常棒的“联系我”页，不过他发邮件用的是 PHP 脚本，GItHub Pages 不会执行任何 PHP 脚本，所以这对我们来说根本没用。

不过好在还有其他很多提供邮件发送功能的服务商可用，我选的是 [formspree](https://formspree.io/) 因为他简单还免费。

因为我并不需要验证整个邮件表单是否有效（只需要验证值的合法性、检查下邮件格式对不对），所以我直接把 jqBootstrapValidation 删掉只用纯 HTML5 验证。

“联系我”表单使用 JavaScript 提交，所以我依然保留了这部分代码，然后稍稍做了点修改：

```javascript
$(function() {
    $("#contactForm").submit(function(e) {
      e.preventDefault();
      $.ajax({
        url: "//formspree.io/my@email.com", 
        method: "POST",
        data: $(this).serialize(),
        dataType: "json",
        success: function(data){
          // Success message
          $('#success').html("<div class='alert alert-success'>");
          $('#success > .alert-success').html("<button type='button' class='close' data-dismiss='alert' aria-hidden='true'>&times;")
              .append("</button>");
          $('#success > .alert-success')
              .append("<strong>Your message has been sent. </strong>");
          $('#success > .alert-success')
              .append('</div>');

          //clear all fields
          $('#contactForm').trigger("reset");
        },
        error: function(){
          // Fail message
          $('#success').html("<div class='alert alert-danger'>");
          $('#success > .alert-danger').html("<button type='button' class='close' data-dismiss='alert' aria-hidden='true'>&times;")
              .append("</button>");
          $('#success > .alert-danger').append("<strong>Sorry it seems that my mail server is not responding. Please try again later!");
          $('#success > .alert-danger').append('</div>');
          //clear all fields
          $('#contactForm').trigger("reset");
        }
      });
    });
});
```
于是现在你不用写后端也能发邮件啦！

以上。

如果你觉得这篇教程还有提升空间，欢迎留言评论。

本文源码在这里：[vdaubry.github.io](https://github.com/vdaubry/vdaubry.github.io)（译者注：翻译版的在这里 [walterlv.github.io](https://github.com/walterlv/walterlv.github.io)）
