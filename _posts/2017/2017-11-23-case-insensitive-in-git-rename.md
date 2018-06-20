---
title: "解决 Git 重命名时遇到的大小写不敏感的问题"
date_published: 2017-11-23 16:51:07 +0800
date: 2018-06-20 10:44:33 +0800
categories: windows git
---

Windows/MacOS 操作系统文件的大小写是不敏感的，不管文件路径是何种奇怪的大小写，我们始终可以以另一种大小写的方式访问到这个路径种的文件或者文件夹。Linux 操作系统文件的大小写却是敏感的，不同大小写意味着不同的路径。于是，Windows 下的 A 文件在 Docs 文件夹下，B 文件在 docs 文件夹下，最终效果是 A B 都在 docs 文件夹下；而同样的情况放到 Linux 中，A B 就在两个不同的文件夹。

Git 是大小写不敏感的，导致跨操作系统共享的 Git 仓库就会遇到上面的情况。如果重命名的文件或文件夹只有大小写不同，那么对 Git  来说甚至都没有变化。阅读本文将解决 Git 大小写不敏感导致的重命名无效的问题。

---

**更新：**Windows 10 1803 更新已经可以支持区分大小写的文件夹了，于是此问题迎刃而解，后面会详细说明。

<p id="toc"></p>

### 让人困扰的大小写问题

让我对此问题产生困扰的是下面这张图，`Docs` 和 `docs` 两个文件夹分开了：

![](/static/posts/2017-11-23-15-42-24.png)  
▲ 分离的两个文件夹

`Docs` 改名为 `docs`，于是只有新增的文件才在 `docs` 文件夹下，旧文件依然在 `Docs` 中。`README.md` 中的链接可就遭殃了，还要注意大小写！

![](/static/posts/2017-11-23-16-10-51.png)  
▲ 稍不注意，就 404 了

### 走的弯路

这种问题怎么看都不像是我一个人会遇到的问题，堆栈网上讨论肯定很多。至少截至本文发表时，[How do I commit case-sensitive only filename changes in Git?](https://stackoverflow.com/questions/17683458/how-do-i-commit-case-sensitive-only-filename-changes-in-git) 中问题已经得到了 600+ 个赞，回答累计得到 1400+ 个赞了……

里面探讨的方法归结起来两个：

- `git mv -f OldFileNameCase newfilenamecase`
- `git config core.ignorecase false`

#### 尝试方法二：core.ignorecase false

第二种方法看起来更简单，于是我第一时间在我的全局 git 配置文件（`C:\Users\lvyi\.gitconfig`）中添加了一项：

```ini
[core]
    ignorecase = false
```

这时，`git status` 就能发现我的 git 仓库中 `Docs` 文件夹下的所有文件已经标记为修改了，都变成了 `docs`，于是愉快的提交推送：

```bash
$ git add .
$ git commit -m "Docs 文件夹改名为 docs 文件夹"
$ git push
```

然而去其他系统上看——居然有 `Docs` 和 `docs` 两份文件夹！！！而且比之前更严重，这一次可是里面的文件都完全重复了一份啊！！！

这时注意到 `git add .` 时，其实文件都是“新增”的，并不是“重命名”：

![](/static/posts/2017-11-23-16-32-35.png)

看来需要使用第一种方法了。

#### 尝试方法一：mv

我写下命令：

```bash
$ git mv -f ./Docs ./docs -f
```

执行……推送后最终效果居然和第一种方法一样！依然是有 `Docs` 和 `docs` 两份文件夹。

### 尝试出的可行的方法

这是堆栈网那位只有 70+ 赞的方法的改进版本。先将文件夹重命名为临时文件夹，然后再从临时文件夹恢复成正常文件夹。

但是（划重点）**中间需要先 commit 一次，否则和前面的方法效果一样，会存在两份文件夹！**

```bash
$ git mv ./Docs ./docs.bak
$ git add .
$ git commit -m "改名（第 1/2 步）"

$ git mv ./docs.bak/ ./docs
$ git add .
$ git commit -m "改名（第 2/2 步）"

$ git push
```

中间的 `git add .` 其实是可以不需要的，因为 `mv` 命令会自动将修改加入暂存区。

至此，文件夹才真的做了仅大小写的改名。

### 使用 Windows 10 四月更新的特性（推荐）

我在 [Windows 10 四月更新，文件夹名称也能区分大小写？](/post/case-sensitive-in-windows-file-system.html) 一文中提到可以使用 `fsutil.exe file SetCaseSensitiveInfo` 使某个特定的文件夹支持区分大小写。

经过尝试，使用此方法后，git 能够支持一次提交完美解决仅大小写的文件夹改名问题，完全不用管 git 的某种配置或其他任何因素。

首先，使用管理员权限在当前文件夹启动 PowerShell：

![](/static/posts/2018-06-20-10-43-02.png)

然后允许一下命令，以便开启此文件夹的大小写敏感功能。

```powershell
> fsutil.exe file SetCaseSensitiveInfo . enable
```

随后，你可以像一般重命名一样去修改文件夹名称，然后像普通提交一样去 git commit。直接能生成一个仅修改文件夹名称大小写的新提交。

---

#### 参考资料

- [How do I commit case-sensitive only filename changes in Git? - Stack Overflow](https://stackoverflow.com/questions/17683458/how-do-i-commit-case-sensitive-only-filename-changes-in-git)
