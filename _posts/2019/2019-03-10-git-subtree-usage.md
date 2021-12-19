---
title: "git subtree 的使用"
publishDate: 2019-03-10 19:04:18 +0800
date: 2020-04-17 15:01:24 +0800
tags: git
position: starter
---

本文收集 git subtree 的使用。

---

<div id="toc"></div>

## 将 B 仓库添加为 A 仓库的一个子目录

在 A 仓库的根目录输入命令：

```bash
$ git subtree add --prefix=SubFolder/B https://github.com/walterlv/walterlv.git master
```

这样，B 仓库的整体，会被作为 A 仓库中一个 `SubFolder/B` 的子文件夹，同时保留 B 仓库中的整个日志记录。

## 从 A 仓库中分离出一个子文件夹成为 B 仓库

在 A 仓库的根目录输入命令：

```bash
git subtree split --prefix=SubFolder/B -b b-branch
```

这样，`SubFolder/B` 文件夹便会被分离到新创建的 `b-branch` 分支。随后，如果你需要将分离的子文件夹推送到新仓库的话，直接将这个分支推送过去就可以了。

## 将 A 仓库中的 B 子目录推送回 B 仓库

```bash
$ git subtree push --prefix=SubFolder/B https://github.com/walterlv/walterlv.git master
```

当然，如果你经常需要使用 subtree 命令，还是建议将那个远端设置一个别名，例如设置 `walterlv`：

```bash
$ git remote add walterlv https://github.com/walterlv/walterlv.git
```

那么，上面的命令可以简单一点：

```bash
$ git subtree push --prefix=SubFolder/B walterlv master
```

后面，我们命令都会使用新的远端名称。

## 将 B 仓库中的新内容拉回 A 仓库的子目录

```bash
$ git subtree pull --prefix=SubFolder/B walterlv master
```
