---
title: "使用一句 git 命令将仓库的改动推送到所有的远端"
publishDate: 2019-02-20 11:26:00 +0800
date: 2019-03-09 09:12:32 +0800
categories: git
position: problem
---

git 支持一个本地仓库包含多个远端（remote），这对于开源社区来说是一个很重要的功能，可以实时获取到最新的开源代码且能推送到自己的仓库中提交 pull request。

有时候多个远端都是自己的，典型的就是 GitHub Pages 服务了，推送总是希望这几个远端能够始终和本地仓库保持一致。本文将介绍一个命令推送到所有远端的方法。

---

我的博客同时发布在 GitHub 仓库 <https://github.com/walterlv/walterlv.github.io> 和 Gitee 仓库 <http://gitee.com/walterlv/walterlv>。由于这两个远端的 Pages 服务没有打通，所以我总是需要同时将博客推送到两个不同的远端中。

## 第一步：设置多个远端（remote）

使用你平常使用的方法添加多个 git 远端。

例如：

```bash
git remote add github https://github.com/walterlv/walterlv.github.io.git --no-tags
```

需要注意，对于不是 origin 的远端，建议不要拉取 tags，所以我加了 `--no-tags` 选项。

我添加了两个新的远端（github 和 gitee）之后，打开你仓库 .git 文件夹中的 config 文件，应该可以看到如下的内容：

```ini
[remote "origin"]
	url = https://github.com/walterlv/walterlv.github.io.git
	fetch = +refs/heads/*:refs/remotes/origin/*
[branch "master"]
	remote = origin
	merge = refs/heads/master
[remote "github"]
	url = https://github.com/walterlv/walterlv.github.io.git
	fetch = +refs/heads/*:refs/remotes/github/*
	tagopt = --no-tags
[remote "gitee"]
	url = https://gitee.com/walterlv/walterlv.git
	fetch = +refs/heads/*:refs/remotes/gitee/*
	tagopt = --no-tags
```

## 第二步：添加一个名为 all 的新远端

现在，我们要添加一个名为 all 的新远端，并且在里面添加两个 url。由于这个步骤没有 git 命令行的帮助，所以你需要手工修改 config 文件中的内容。

```ini
[remote "all"]
	url = https://github.com/walterlv/walterlv.github.io.git
	url = https://gitee.com/walterlv/walterlv.git
	tagopt = --no-tags
```

如果你有更多需要同步的远端，那么就在里面添加更多的 url。

## 开始使用一个命令同步所有的仓库

现在，你可以使用一句命令将本地的修改推送到所有的远端了。

```bash
git push all
```

我现在自己的博客仓库就是这样的推送方式。于是你可以在以下多个地址打开阅读我的博客：

- <https://walterlv.com/>
- <https://blog.walterlv.com/>
- <https://walterlv.github.io/>
- <https://walterlv.gitee.io/>
- <https://walterlv.oschina.io/>
