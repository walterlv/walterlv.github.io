---
title: "从 git 的历史记录中彻底删除文件或文件夹"
date: 2019-06-23 16:43:41 +0800
tags: git
position: starter
permalink: /post/remove-files-or-folders-from-git-history.html
---

如果你对外开源的代码中出现了敏感信息（例如你将私钥上传到了仓库中），你可能需要考虑将这个文件从 git 的历史记录中完全删除掉。

本文介绍如何从 git 的历史记录中彻底删除文件或文件夹。

---

## 第一步：修改本地历史记录

彻底删除文件：

```powershell
git filter-branch --force --index-filter 'git rm --cached --ignore-unmatch walterlv.xml' --prune-empty --tag-name-filter cat -- --all
```

其中 `walterlv.xml` 是本来不应该上传的私钥文件，于是使用此命令彻底删除。后面的命令 `--tag-name-filter` 指所有相关的标签都需要更新。

彻底删除文件夹：

```powershell
git filter-branch --force --index-filter 'git rm --cached -r --ignore-unmatch WalterlvDemoFolder' --prune-empty --tag-name-filter cat -- --all
```

删除文件夹时需要额外带一个 `-r` 选项，并指定文件夹名称，这里的例子是 `WalterlvDemoFolder`。

## 第二步：强制推送到远端仓库

刚刚我们的操作仅仅发生在本地仓库，敏感信息需要删除的仓库通常都在远端，于是我们一定要将修改推送到远端仓库。

需要推送的目标分支包括我们所有长期维护的分支，这通常就包括了 `master` 分支和所有的标签。

于是使用推送命令：

```powershell
git.exe push origin master:master --tags --force
```

