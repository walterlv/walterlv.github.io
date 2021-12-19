---
title: "git fetch 失败，因为 unable to resolve reference 'refs/remotes/origin/xxx': reference broken"
publishDate: 2019-09-03 12:46:08 +0800
date: 2019-09-05 14:37:15 +0800
tags: git
position: problem
coverImage: /static/posts/2019-09-03-11-52-12.png
---

我在使用 `git fetch` 命令的时候，发现竟然会失败，提示错误 `error: cannot lock ref 'refs/remotes/origin/xxx': unable to resolve reference 'refs/remotes/origin/xxx': reference broken`。

本文介绍如何修复这样的错误，并探索此错误产生的原因。

---

<div id="toc"></div>

## 错误

在使用 `git fetch` 命令之后，发现竟然出现了错误，错误输出如下：

```bash
$ git fetch --all --prune
Fetching origin
error: cannot lock ref 'refs/remotes/origin/next/release': unable to resolve reference 'refs/remotes/origin/next/release': reference broken
From git***.***.com:walterlv/demo-project
 ! [new branch]            next/release        -> origin/next/release  (unable to update local ref)
error: cannot lock ref 'refs/remotes/origin/feature/ai': unable to resolve reference 'refs/remotes/origin/feature/ai': reference broken
 ! [new branch]            feature/ai          -> origin/feature/ai  (unable to update local ref)
error: cannot lock ref 'refs/remotes/origin/release': unable to resolve reference 'refs/remotes/origin/release': reference broken
 ! [new branch]            release             -> origin/release  (unable to update local ref)
error: Could not fetch origin
```

## 修复

前往仓库路径，然后删除这些分支对应的文件。

1. 前往仓库所在的本地文件夹；
1. 进入子目录 `.git\refs\remotes`；
1. 一个个对着上面失败的分支，将其删除。

![删除错误的分支](/static/posts/2019-09-03-11-52-12.png)

比如在我的错误例子中，要删除的文件分别是：

- `.git\refs\remotes\origin\next\release`
- `.git\refs\remotes\origin\feature\ai`
- `.git\refs\remotes\origin\release`

随后，重新尝试 `git fetch`，git 会重新生成这些分支文件，因此不用担心会删出问题：

```bash
$ git fetch --all --prune
Fetching origin
From gitlab.gz.cvte.cn:t/tech-app/dev/win/app/easinote
   a1fd2551f7..cfb662e870  next/release  -> origin/next/release
 * [new branch]            feature/ai    -> origin/feature/ai
   97d72dfc8f..ceb346c8e2  release       -> origin/release
```

<!-- ## 原因

---

**参考资料** -->

