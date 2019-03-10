---
title: "GitHub 的 Pull Request 和 GitLab 的 Merge Request 有区别吗？"
date: 2017-10-12 09:13:40 +0800
categories: git
permalink: /post/git/pull-request-merge-request.html
tags: git merge pull request
description: 
---

在 GitHub 上混久了，对 Pull Request 就……；在 GitLab 上混久了，对 Merge Request 就……然而它们之间有不同吗？为什么要用两个不同的名称？

---

要追溯这两个名称，需要追溯 GitHub 和 GitLab 引以为傲的 git 工作流。这也是本文参考链接中一定要附上 GitLab 工作流的重要原因。

众所周知 git 是一个**分布式**的版本管理系统，但为了团队成员之间能够高效地协作，必须有至少一个服务器用于给团队所有成员之间同步代码。而这一点又有点类似于集中式的版本管理。

对于项目的核心成员，集中式版本管理和分布式版本管理贡献代码的方式并没有多大差异（这里不要纠结个人使用层面的差异，只谈论为仓库贡献代码的方式）。但对于非项目核心成员来说，集中式的版本管理就非常痛苦了，因为他们找不到方式来提交自己的代码（请忽略低效的发邮件补丁吧……）。然而分布式版本管理则解决了这个问题：非项目核心成员可以克隆仓库，这样就得到了一个自己具有完全读写权限的仓库，贡献的代码可以完全同步到这个具有完全读写权限的仓库中。

为了让非核心成员提交的代码被核心成员接纳，非核心成员会向核心成员提出“申请（Request）”去自己的仓库指定分支中“拉取(pull)”最新的修改，这便是 Pull Request 的来源。

那么 Merge Request 又是什么呢？GitLab 对此的解释是——一样的，没有区别。Merge 只是在强调最后的那个动作“合并（Merge）”。

- GitHub、Bitbucket 和码云（Gitee.com）选择 Pull Request 作为这项功能的名称
- GitLab 和 Gitorious 选择 Merge Request 作为这项功能的名称

---

**参考资料**

- [GitLab Documentation](https://docs.gitlab.com/ce/workflow/gitlab_flow.html)
- [git - Pull request vs Merge request - Stack Overflow](https://stackoverflow.com/questions/22199432/pull-request-vs-merge-request)
- [码云平台帮助文档_V1.2](http://git.mydoc.io/)
