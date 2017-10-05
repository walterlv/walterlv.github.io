---
layout: post
title: "使用 filter-branch 从 Git 历史中删除一个文件"
date: 2017-09-19 20:19:04 +0800
categories: git
permalink: /git/2017/09/19/delete-file-using-filter-branch.html
keywords: git filter-branch delete
description: 使用 Git 官方提供的方法 filter-branch 从 Git 的提交历史中删除一个文件。
---

昨天帮助小伙伴[从 Git 提交历史中删除了一个文件](/git/2017/09/18/delete-a-file-from-whole-git-history.html)，虽然一开始尝试使用 filter-branch，但是因为需要的时间太久，就放弃了，转而使用 cherry-pick 的方案。

但是，毕竟 Git 官方给的方案是 filter-branch，所以今天就在另一位小伙伴的帮助下好好阅读 Git 官方文档：[Git - 重写历史](https://git-scm.com/book/zh/v2/Git-%E5%B7%A5%E5%85%B7-%E9%87%8D%E5%86%99%E5%8E%86%E5%8F%B2) 和 [Git - git-filter-branch Documentation](https://git-scm.com/docs/git-filter-branch)。

---

原来参数中是可以指定查找范围的！几万个提交的仓库，既然是当天加的文件，当然没必要遍历整个仓库，数了数大概是 20+ 个提交之前加的，于是写出了如下命令：

```bash
git filter-branch --tree-filter 'git rm file-name-to-remove.zip' HEAD~30..HEAD
```

最后那个参数就是从当前分支的前 30 次提交开始遍历，这样就会快很多。

下面的输入和输出是我在拿上一篇博客文件做试验，删掉那篇博客。整个仓库有 125 次提交，但只需遍历参数里指定的 5 个。

```bash
$ git filter-branch --tree-filter 'rm _posts/2017-09-18-delete-a-file-from-whole-git-history.md' HEAD~5..HEAD
Rewrite f74ff6c8057dcfdf96822989a09c357ae07cd2f8 (5/5) (2 seconds passed, remaining 0 predicted)
Ref 'refs/heads/master' was rewritten
```

#### 参考资料

- [Git - 重写历史](https://git-scm.com/book/zh/v2/Git-%E5%B7%A5%E5%85%B7-%E9%87%8D%E5%86%99%E5%8E%86%E5%8F%B2)
- [Git - git-filter-branch Documentation](https://git-scm.com/docs/git-filter-branch)
- [Link Intersystems – Remove directories and files permanently from git](http://www.link-intersystems.com/blog/2014/07/17/remove-directories-and-files-permanently-from-git/)
