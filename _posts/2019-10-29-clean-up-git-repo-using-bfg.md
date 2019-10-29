---
title: "清理 git 仓库太繁琐？试试 bfg！删除敏感信息删除大文件一句命令搞定"
date: 2019-10-29 11:05:08 +0800
categories: git
position: starter
---

你可能接触过 `git-filter-branch` 来清理 git 仓库，不过同时也能体会到这个命令使用的繁琐，以及其超长的执行时间。

现在，你可以考虑使用 `bfg` 来解决问题了！

---

<div id="toc"></div>

## 安装 bfg

### 传统方式安装（不推荐）

1. 下载安装 [Java 运行时](https://www.java.com/zh_CN/download/)
2. 下载安装 [bfg.jar](https://search.maven.org/classic/remote_content?g=com.madgag&a=bfg&v=LATEST)

这里并不推荐使用传统方式安装，因为传统方式安装后，`bfg` 不会成为你计算机的命令。在实际使用工具的时候，你必须为你的每一句命令加上 `java -jar bfg.jar` 前缀来使用 Java 运行时间接运行。

### 使用包管理器 scoop 安装

如果你使用包管理器 scoop，那么安装将会非常简单，只需要以下几个命令。

- `scoop install bfg`
- `scoop bucket add java`
- `scoop install java/openjdk`

安装 bfg：

```powershell
PS C:\Users\lvyi> scoop install bfg
Installing 'bfg' (1.13.0) [64bit]
bfg-1.13.0.jar (12.8 MB) [============================================================================================================================] 100%
Checking hash of bfg-1.13.0.jar ... ok.
Linking ~\scoop\apps\bfg\current => ~\scoop\apps\bfg\1.13.0
Creating shim for 'bfg'.
'bfg' (1.13.0) was installed successfully!
'bfg' suggests installing 'java/oraclejdk' or 'java/openjdk'.
```

安装 Java 源：

```powershell
PS C:\Users\lvyi> scoop bucket add java
Checking repo... ok
The java bucket was added successfully.
```

安装 Jdk：

```powershell
scoop install java/openjdk
Installing 'openjdk' (13.0.1-9) [64bit]
openjdk-13.0.1_windows-x64_bin.zip (186.9 MB) [=========================================================================>                             ]  72%
```
## 准备工作

当你准备好清理你的仓库的时候，需要进行一些准备。

1. 克隆一个镜像仓库（`git clone` 命令加上 `--mirror` 参数）
    - 这样，当你 `git push` 的时候，会更新远端仓库的所有引用
1. `cd` 到你要清理的仓库路径的根目录
    - 如果你没有前往根目录，那么本文后面的所有命令的最后面你都应该加上路径
1. 可能需要解除保护
    - 如果本文后面的命令你遇到了受保护的提交，那么需要在所有命令的后面加上 `--no-blob-protection` 参数

## 常见用法

### 删除误上传的大文件

使用下面的命令，可以将仓库历史中大于 500M 的文件都删除掉。

```powershell
> bfg --strip-blobs-bigger-than 500M
```

### 删除特定的一个或多个文件

删除 `walterlv.snk` 文件：

```powershell
> bfg --delete-files walterlv.snk
```

删除 walterlv.snk 或 lindexi.snk 文件：

```powershell
> bfg --delete-files {walterlv,lindexi}.snk
```

比如原来仓库结构是这样的：

```
- README.md
- Security.md
- walterlv.snk
+ test
    - lindexi.snk
```

那么删除完后，根目录的 walterlv.snk 和 test 子目录下的 lindexi.snk 就都删除了。

### 删除文件夹

删除名字为 walterlv 的文件夹：

```powershell
> bfg --delete-folders walterlv
```

此命令可以与上面的 `--delete-files` 放在一起执行：

```powershell
> bfg --delete-folders walterlv --delete-files walterlv.snk
```

<!-- ### 删除敏感的密码信息

 -->

## 推回远端仓库

当你在本地操作完镜像仓库之后，可以将其推回原来的远端仓库了。

```powershell
> git push
```

最后，有一个不必要的操作。就是回收已经没有引用的旧提交，这可以减小本地仓库的大小：

```powershell
> git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

---

**参考资料**

- [BFG Repo-Cleaner by rtyley](https://rtyley.github.io/bfg-repo-cleaner/)
