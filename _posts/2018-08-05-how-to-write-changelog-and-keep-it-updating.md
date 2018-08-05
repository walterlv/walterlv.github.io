---
title: "发布了一款库（或工具包），如何持续地编写更新日志（ChangeLog）？"
date: 2018-08-05 17:35:23 +0800
categories: dotnet
---

据说程序员最讨厌的两件事是 “别人没有写文档” 和 “要我写文档”。

编写更新日志可是也落入此怪圈呢！

---

<div id="toc"></div>

### 程序员不写文档

来自 GitHub 的开源调查问卷结果直接显示，最令人头痛的莫过于文档了：

> Incomplete or outdated documentation is a pervasive problem, observed by 93% of respondents, yet 60% of contributors say they rarely or never contribute to documentation. When you run into documentation issues, help a maintainer out and open a pull request that improves them.

▲ 来自 <http://opensourcesurvey.org>

### 自动化

我曾经试图找到一些自动化的方式来生成更新日志，例如：

- 查找 git 提交日志
- 查找 issues 问题

然而，这样生成的日志真难看懂！不信你试着把一个项目的 Issues 列表读一遍？

### 更新日志应该包含哪些内容

站在库的使用者的角度来看，程序员们希望看到什么样的更新日志，不希望看到什么样的更新日志？

1. 添加的接口
1. 现有接口的改变
1. 未来即将删除的接口
1. 此版本已经删除的接口
1. 此版本修复的 Bug
1. 此版本的安全性改进

然而这些都写了会让编写者很痛苦的……

### 手工和自动化的结合

当存在 API 比较工具的时候，我们可以很容易地比较各个版本间 API 的变化，包括新增、改变、即将移除和已经移除。而这部分的内容由工具生成是没什么阅读障碍的。

另一部分，描述功能的手工编写会比较容易阅读。例如新增的功能、修改的功能、已经删除的功能。

### 优秀文档的参考

以下是 UWP 的开发文档，属手工和自动化结合生成。

![UWP 文档](/static/posts/2018-08-05-17-34-12.png)
