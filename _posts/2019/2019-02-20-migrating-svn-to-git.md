---
title: "将 svn 仓库迁移到 git 仓库"
date: 2019-02-20 10:22:31 +0800
tags: git
position: starter
coverImage: /static/posts/2019-02-20-10-11-00.png
permalink: /post/migrating-svn-to-git.html
---

我找到了一个很久很久以前编写的项目，然而当时是使用 svn 进行版本管理的。然而现在的版本管理全部是 git，不愿意再装一个 svn 工具来管理这些古老的项目，于是打算将其迁移到 git 中。

本文介绍如何将古老的 svn 项目迁移到 git。

---

<div id="toc"></div>

## 找回 svn 仓库的 url

如果你能记得你 svn 仓库的 url，或者这个仓库是一个纯本地仓库，那么你直接复制这个 url 就好了。

然而如果这是一个有 svn 远程服务器的仓库，那么你可能依然需要临时安装一下 svn 工具。我们只是为了拿回 url 而已。

这里我使用当时使用的小乌龟 [TortoiseSVN](https://tortoisesvn.net/index.zh.html)。在 svn 仓库空白处右击选择版本库浏览器（Repo-browser），小乌龟会自动定位到当前仓库所在的远程 svn 服务器的对应文件夹。

![版本库浏览器](/static/posts/2019-02-20-10-11-00.png)

我们所要做的只有一件事——复制顶部那个 url。

得到了这个 url 后，像我这种洁癖就卸载 TortoiseSVN 了。

## 将 svn 仓库迁移到 git 仓库

### 命令行

在一个新的文件夹中，我们输入如下命令：

```bash
git.exe svn clone "https://svn.walterlv.com/LvYi/Timer" ".\Walterlv.RepoFromSvn"
```

如果那个 svn 目录中包含 `trunk`、`branches` 和 `tags` 结构，那么可以在后面添加相应的参数以便在 clone 完成后保留分支和标签信息。

```bash
git.exe svn clone "https://svn.walterlv.com/LvYi/Timer" ".\Walterlv.RepoFromSvn" -T trunk -b branches -t tags
```

需要注意的是，上面的 `Walterlv.RepoFromSvn` 文件夹是不允许提前存在的，如果存在将无法迁移成功。

### TortoiseGit

这里特地照顾一下从 TortoiseSVN 迁移来继续考虑 [TortoiseGit](https://tortoisegit.org/) 的小伙伴。在 TortoiseGit 中的操作是：

1. 在某个文件夹中右键（或者 Shift+右键）
1. 选择克隆
1. 按照下图填写来自 url 的远程服务器 url 和本地文件夹，并打勾“从SVN版本库”

![TortoiseGit 上的迁移 SVN 操作](/static/posts/2019-02-20-10-19-21.png)

---

**参考资料**

- [Git - Migrating to Git](https://git-scm.com/book/en/v2/Git-and-Other-Systems-Migrating-to-Git)
- [How to get svn remote repository URL? - Stack Overflow](https://stackoverflow.com/questions/9128344/how-to-get-svn-remote-repository-url)
- [Migrate from Subversion (SVN) to Git - Microsoft Docs](https://docs.microsoft.com/en-us/azure/devops/articles/perform-migration-from-svn-to-git?view=azure-devops)


