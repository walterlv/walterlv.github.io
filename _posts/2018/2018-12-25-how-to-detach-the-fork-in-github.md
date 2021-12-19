---
title: "出于迁移项目的考虑，GitHub 中 Fork 出来的项目，如何与原项目断开 Fork 关系？"
publishDate: 2018-12-25 11:36:23 +0800
date: 2019-01-15 19:50:33 +0800
tags: github git
position: problem
coverImage: /static/posts/2018-12-25-09-50-53.png
---

如果需要为 GitHub 上的项目做贡献，我们通常会 Fork 到自己的名称空间下。在推送代码之后添加 pull request 时，GitHub 会自动为我们跨仓库建立 pull request 的连接，非常方便。但是，如果 Fork 是出于项目的迁移，例如从个人名下迁移到某个组织下或者反过来，那么这种自动的 pull request 的设置就很影响效率了。

那么这种情况如何处理呢？如何断开 Fork 连接呢？

---

在 GitHub 的官方帮助页面 [Commit was made in a fork](https://help.github.com/articles/why-are-my-contributions-not-showing-up-on-my-profile/#commit-was-made-in-a-fork) 中，有这一段话：

> To detach the fork and turn it into a standalone repository on GitHub, contact [GitHub Support](https://github.com/contact) or [GitHub Premium Support](https://premium.githubsupport.com/). If the fork has forks of its own, let support know if the forks should move with your repository into a new network or remain in the current network. For more information, see "[About forks](https://help.github.com/articles/about-forks/)."

也就是说，你是不能通过自己的操作来断开 Fork 联系的。这是当然的，毕竟随意就能断开的话，开源的一方就非常容易失去对源码的控制权，这很不利于开源社区的贡献。

你需要做的，是进入 GitHub 支持页面 <https://github.com/contact> 在里面填写你的请求，要求 GitHub 官方支持人员手动断开 Fork 关联。

![填写请求](/static/posts/2018-12-25-09-50-53.png)

填写完之后，等待 GitHub 官方人员处理：

![保持联系](/static/posts/2018-12-25-09-51-27.png)

当 GitHub 官方人员处理完之后，会给出回复邮件，告知 Fork 关系已经反转：

![主仓库已经改变](/static/posts/2019-01-15-19-50-26.png)

---

**参考资料**

- [Delete fork dependency of a GitHub repository - Stack Overflow](https://stackoverflow.com/a/16052845/6233938)
- [Why are my contributions not showing up on my profile? - User Documentation](https://help.github.com/articles/why-are-my-contributions-not-showing-up-on-my-profile/#commit-was-made-in-a-fork)
- [Contact GitHub](https://github.com/contact)

