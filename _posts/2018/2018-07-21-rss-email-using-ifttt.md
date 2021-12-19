---
title: "使用 IFTTT 做 RSS 的邮件订阅服务"
date: 2018-07-21 17:40:56 +0800
tags: miscellaneous
coverImage: /static/posts/2018-07-21-17-10-57.png
permalink: /post/rss-email-using-ifttt.html
---

IFTTT 是一个奇特的网络服务。它本身没有提供什么功能，但因为它的工作方式类似编程，所以你可以拿它做各种各样难以想象的事情。

本文将使用 IFTTT 做一个 RSS 的邮件订阅服务。

---

<div id="toc"></div>

## IFTTT

IFTTT 这种神奇的名字还是需要介绍一下的 —— 读作 [ɪft]，意思是 **If This Then That**。

直接翻译，是“如果这个，那就那个”。这其实挺有趣的，因为这就像编程语言中的 if 语句：

```vb
If This Then That()
```

这个句子本身并不涉及什么功能，但我们能通过修改这个语句中的 `This` 和 `That` 来达到执行各种功能的效果。

![if this then that](/static/posts/2018-07-21-17-10-57.png)

## 做一个 RSS 邮件订阅服务

首先，前往 IFTTT：<https://ifttt.com/>。你需要注册一个账号，在登录后再进行下面的操作。

在首页，我们能找到 MyApplets 标签，进去后，我们便可以新建我们的 RSS 邮件订阅服务。

![MyApplets](/static/posts/2018-07-21-17-22-43.png)

在 MyApplets 页面，点击 New Applet 新建一个 Applet。

![New Applet](/static/posts/2018-07-21-17-23-56.png)

这时，我们能看到一个大大的 “if +this then that” 的短语。注意到 this 的颜色不同，而且前面有一个加号 —— 这是一个大大的按钮，提醒你当前的步骤是修改 this。

![if +this then that](/static/posts/2018-07-21-17-24-22.png)

点击 this 之后，我们发现 IFTTT 为我们提供了大量的 this 触发源。

![琳琅满目的触发源](/static/posts/2018-07-21-17-27-36.png)

找到 RSS Feed，随后选择 New feed item。

![New feed item](/static/posts/2018-07-21-17-33-18.png)

贴上一个 RSS 的链接 <https://walterlv.github.io/feed.xml>：

![https://walterlv.github.io/feed.xml](/static/posts/2018-07-21-17-34-45.png)

创建完成之后，我们又能看到大量的动作：

![琳琅满目的动作](/static/posts/2018-07-21-17-36-09.png)

选择邮件：

![Send me an email](/static/posts/2018-07-21-17-36-52.png)

然后可选修改邮件中的格式：

![Fill in the email form](/static/posts/2018-07-21-17-38-12.png)

完成：

![Finish](/static/posts/2018-07-21-17-39-12.png)

这样，当我的博客中有新的文章发布的一小时内，邮箱中就可以收到邮件通知了。

---

**参考资料**

- [IFTTT - 维基百科，自由的百科全书](https://zh.wikipedia.org/wiki/IFTTT)


