---
layout: post
title: "如何向整个 Git 仓库补提交一个文件"
date: 2017-09-13 19:10:47 +0800
categories: git
permalink: /git/2017/09/13/add-file-to-whole-git-repository.html
keywords: git
description: 提交了很多次之后，突然发现一开始就忘记提交了某个重要文件（比如 .gitignore），本文将教你如何将这个文件补上。
---

微软在 [Reference Source](https://referencesource.microsoft.com/) 里开放了 .NET Framework 多个版本的源码。为了更方便地阅读这些源码，我们把每一个版本都下载下来后按顺序提交到 git 仓库中。

但是！！！居然忘了在第一次提交之前放一个 .gitignore 文件！如果没有这个文件，那我们每次打开源码查看都会带来一大堆不明所以的修改文件。那么多的源码，绝对不会想重新挨个版本再提交一次。于是找到了一条可以解决这个问题的 git 命令。

---



```bash
git filter-branch --index-filter "cp /C/仓库外面某个路径下的/.gitignore . && git add .gitignore"
```

执行之后，`C:\仓库外面某个路径下的\.gitignore` 文件就被添加到了当前分支的第一次提交里面，并且查看后面任何一次提交对应的全部文件时，都会有这个文件。

如果希望此操作对所有分支生效，则加一个 `--all` 参数，即：

```bash
git filter-branch --index-filter "cp /C/仓库外面某个路径下的/.gitignore . && git add .gitignore" -- --all
```

写这个命令时需要注意：
- git 在 Bash 里写的时候，`C:\` 需要写成 `/C/`。
- `-- --all` 中的 `--` 是用来区分路径和提交的，官方说法是：

```bash
fatal: ambiguous argument 'cp /C/仓库外面某个路径下的/.gitignore . && git add .g
itignore': unknown revision or path not in the working tree.
Use '--' to separate paths from revisions, like this:
'git <command> [<revision>...] -- [<file>...]'
```

执行了此命令后，所有的提交其实都被重写了，提交号已经改变。如果你从未推送到远端过，那么恭喜，你已经在神不知鬼不觉中添加了一个 .gitignore 文件，就像是第一次提交就加了这个文件一样。

但是，如果此前有推送到过远程分支，请慎重！因为你的此次推送的命令和其他人首次拉取的命令将有所改变：

推送（所有分支，强制）：

```bash
$ git push --all -f
```

拉取（获取 + 重置）

```bash
$ git fetch
$ git reset origin/master --hard
```

**参考资料**

- [GIT: How do I add a file to the first commit (and rewrite history in the process)?](https://stackoverflow.com/questions/21353584/git-how-do-i-add-a-file-to-the-first-commit-and-rewrite-history-in-the-process)
