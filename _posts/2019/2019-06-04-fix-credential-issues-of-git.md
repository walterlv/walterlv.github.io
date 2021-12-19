---
title: "git 配置错误导致无法推送远端仓库？本文介绍各种修复方式"
date: 2019-06-04 15:31:18 +0800
tags: git windows
position: problem
coverImage: /static/posts/2019-06-04-14-39-41.png
permalink: /post/fix-credential-issues-of-git.html
---

无论你使用原生的 git 命令行，还是使用其他的 GUI 客户端来管理你的 git 仓库，都会遇到 git 远程仓库的身份认证机制。如果在某个远程仓库第一次认证的时候输入了错误的信息，那么 git 以及一部分 git GUI 客户端会记住这个错误的身份认证信息，使得以后也不能继续与远程仓库进行交互了。

本文介绍如何清除 git 的身份认证信息，以便你可以重新获得输入正确身份认证的机会。

---

<div id="toc"></div>

## 凭据管理器

如果你使用基于 https 的身份认证方式操作 git 远端，并且输入了错误的密码，那么这部分密码将保存在 Windows 的凭据管理器中。

在 Windows 搜索框中搜索“凭据管理器”或者在控制面板中进入“用户账户”->“凭据管理器”可以打开凭据管理界面。我们需要选择右边的“Windows 凭据”标签。

随后，在下方的“普通凭据”中，找到出现问题的 git 远程仓库地址，然后展开，将其删除。

![凭据管理器](/static/posts/2019-06-04-14-39-41.png)

删除之后，再次在 git 命令行或者基于 git 命令行的客户端的 GUI 客户端中使用 git 操作远端仓库将会重新提示输入这个远端仓库的用户名和密码。

## .ssh

基于 SSH 的身份认证方式需要自己手工方式都是需要自己手动配置好才可以正常使用的，不会给你像 https 那样输错密码的机会。如果配置错误则不能操作远端仓库。当然，配错了直接删掉重新再来一次就好了。参见网上一大堆的配置方法：[git-ssh 配置和使用 - fedl - SegmentFault 思否](https://segmentfault.com/a/1190000002645623)。

![配置好的 SSH](/static/posts/2019-06-04-14-57-50.png)

## TortoiseGitPlink

另外，有一些客户端如 Tortoise 会自带一份认证管理工具。TortoiseGit 自带了 TortoiseGitPlink，它声称比自带的 SSH 要好用但问题是你得单独为它配置一遍……（逃

命名 SSH 配好了而没有配 TortoiseGitPlink 的时候，它分分钟挂给你看：

![TortoiseGitPlink](/static/posts/2019-06-04-14-55-01.png)

那么如何修复呢？

### 方法一：替换 SSH 客户端

替换为与 git 命令行相同的 SSH 客户端可以避免重复配置公私钥对。

打开 TortoiseGit 的设置页面，切换到“网络”标签，然后将 SSH 客户端改为 SSH。通常在 `C:\Program Files\Git\usr\bin` 目录中，如果没找到，也可以去 `C:\Program Files (x86)\Git\bin\ssh.exe` 目录寻找。

![SSH 客户端](/static/posts/2019-06-04-15-22-34.png)

### 方法二：导入已有的 SSH 配置

打开 `C:\Program Files\TortoiseGit\bin\puttygen.exe` 程序，然后点击“Load”，选择 git 客户端早已配好的 ssh 私钥。如果打开文件对话框中你找不到密钥文件，可能需要将过滤器设置为所有文件（`*.*`）。（如果之前没配好 SSH，那么建议去配置一下，不然 SSH 的认证方式将只有 TortoiseGit 客户端工具可用。本节接下来的内容将默认你已经配好 SSH，在远端仓库添加了公钥。）

![puttygen](/static/posts/2019-06-04-15-13-15.png)

![导入成功](/static/posts/2019-06-04-15-17-17.png)

导入成功之后，点击保存私钥，选择一个合适的路径存下来。

随后，打开 `C:\Program Files\TortoiseGit\bin\puttygen.exe` 程序。打开之后，你会在任务栏通知区域看到它的图标，右键点击 `Add Key` 然后选择我们刚刚保存的私钥。

![Add Key](/static/posts/2019-06-04-15-25-17.png)

随后，你需要保持 `puttygen.exe` 一直处于运行状态，以便 TortoiseGit 可以一直使用。

---

**参考资料**

- [git - Remove saved credentials from TortoiseGit - Stack Overflow](https://stackoverflow.com/a/31782500/6233938)
- [git - my old username is still in use - Stack Overflow](https://stackoverflow.com/a/39944557/6233938)
- [windows - How to solve TortoiseGitPlink Fatal Error? - Stack Overflow](https://stackoverflow.com/questions/28106717/how-to-solve-tortoisegitplink-fatal-error)


