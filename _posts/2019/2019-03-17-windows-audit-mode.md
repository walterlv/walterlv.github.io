---
title: "启用 Windows 审核模式（Audit Mode），以 Administrator 账户来设置电脑的开箱体验"
date: 2019-03-17 20:02:05 +0800
categories: windows
position: knowledge
---

在你刚刚安装完 Windows，在 Windows 开箱体验输入以创建你的用户账户之前，你可以按下 Ctrl + Shift + F3 来进入审核模式。

本文将介绍审核模式。

---

<div id="toc"></div>

## OOBE

OOBE，Out-of-Box Experience，开箱体验。对于 Windows 系统来说，就是当你买下电脑回来，兴奋地打开电脑开机后第一个看到的界面。

具体来说，就是设置你的账号以及各种个性化设置的地方。

本文即将要说的审核模式就是在这里开启的。*当然你设置完账号也一样能开启，但开箱就是要来个干净整洁嘛，所以就是应该在还没有账号的时候进入审核模式。*

## 进入审核模式

在 OOBE 界面中，按下 Ctrl + Shift + F3 两次即会进入审核模式。

实际上此时进入的账号是 Administrator 账号。我在 [Windows 中的 UAC 用户账户控制](/post/windows-user-account-control.html) 一文中说到，Administrator 账号下启动进程获取到的访问令牌都是完全访问令牌。所以在这里 UWP 程序是无法运行的（逃

当你进入审核模式之后，会看到自动启动了一个 sysprep 的程序，它位于 `C:\Windows\System32\Sysprep` 目录下。

![系统准备工具](/static/posts/2019-03-17-20-00-59.png)

在审核模式下，重启也会继续进入审核模式。如果要关闭审核模式，则需要在 sysprep 程序中把下一次的启动选项改为开箱体验。

关于清理选项中的“通用”：如果你只为这台电脑或这个型号的电脑设置开箱体验，那么就关闭“通用”；如果把这个开箱体验做好之后会拷贝副本到其他型号的电脑上，那么就勾选“通用”。区别就是是否清理掉设备的特定的驱动文件。

![清理 - 通用](/static/posts/2019-03-17-20-01-53.png)

当然，你现在就可以去 `C:\Windows\System32\Sysprep` 目录中启动 sysprep.exe，然后给你的电脑再带来一次开箱体验。

## 审核模式有什么作用？

从进入审核模式时打开的 sysprep.exe 程序可以看出来，这个模式主要就是为了准备开箱体验的。

你可以在这里以 Administrator 权限来为此计算机安装驱动，为将来此计算机的所有用户安装应用、存放一些你认为他们需要的文件。而这一切操作都不需要特地创建一个账号。可以说 Administrator 账户内置到系统里，主要的目的就是这个了，临时使用。而目前就是在审核模式中制作开箱体验。

---

**参考资料**

- [Boot Windows to Audit Mode or OOBE - Microsoft Docs](https://docs.microsoft.com/en-us/windows-hardware/manufacture/desktop/boot-windows-to-audit-mode-or-oobe)
