---
title: "Windows 的 UAC 设置中的通知等级实际上只有两个档而已"
date: 2019-03-19 17:43:47 +0800
tags: windows
position: knowledge
---

Windows 系统中的 UAC 设置界面有四种不同的选项可以选，但实际上真正有意义的只有两个选项。

本文将介绍 UAC 这四个档设置的区别，帮助你合理的设置你的电脑。

---

## UAC 设置界面

在 Windows 10 任务栏的搜索框中输入 `uac` 可以直接打开 UAC 设置界面。

![搜索“更改用户账户控制设置”](/static/posts/2019-03-19-16-40-47.png)

下图是“用户账户控制设置”界面，想必小伙伴们应该已经很熟悉了。它有四个档：

- 始终通知
- 当应用试图安装软件或更改计算机设置时通知，使用安全桌面
- 当应用试图安装软件或更改计算机设置时通知，不使用安全桌面
- 从不通知

![用户账户控制设置](/static/posts/2019-03-17-18-42-26.png)

## 实际上只有两个档

然而在微软的 Raymond Chen（陈瑞孟）在 [There are really only two effectively distinct settings for the UAC slider](https://devblogs.microsoft.com/oldnewthing/?p=94105) 一文中说实际上只有两个档：

- 始终通知
- 辣鸡

Windows 系统是通过让一些 UAC 提权动作变成静默提权的方式来避免通知过多的问题，主要是让那些“看起来没什么危害的”系统设置不用通知。但是，这相当于开了一个后门，程序可以很容易注入到 explorer.exe 中然后获得提权，或者通过白名单方式把自己加入到静默提权中。

有了这个后门，大家就可以找到各种绕过 UAC 弹窗的方法，比如 [NSudo](https://github.com/M2Team/NSudo)、[UACME](https://github.com/hfiref0x/UACME)、QuickAdmin。你根本阻止不完这些绕过 UAC 弹窗的方法！

微软说：“绕过 UAC 弹窗不是漏洞，所以我们不会修补。” *(也许将来绕过 UAC 弹窗的恶意软件泛滥的时候，微软就会做点什么了)*

微软已经提供了全部弹窗这个选项，明明可以阻止各类程序绕过 UAC，但为什么默认设置是这个可以绕过的选项呢？

—— 因为**用户**希望如此。

Windows Vista 中，确实只有始终通知和关闭 UAC 两个选项，而且始终通知是默认选项；实际上 UAC 也确实只有这两个有实际意义的选项。但是始终通知会使得系统日常使用过程中真的有非常多的 UAC 弹窗，只要你试图修改一些可能影响其他用户的设置或者可能与 Windows 系统安全有关的操作，都会弹出 UAC 弹窗。大多数用户都会觉得这么多的 UAC 弹窗是很烦的。所以 Windows 7 开始不得不引入两个额外的中间状态，让一些已知的提权操作变成静默的，不弹 UAC 窗口。默认值是中间状态，因为大多数用户希望是这样的提醒级别。

## 中间档的差别

进程在试图提权的时候，会弹出 UAC 提示。对于 Windows 管理员账户来说，在控制面板里面的大量操作可能都是在影响所有用户，如果全部通知，那么在控制面板里面点击的很多功能都会弹出 UAC 提示（例如修改时间，这是个影响所有用户的操作，而且有些安全软件可能会因为系统时间改变而失效）。

那两个中间档就是指：

- 在控制面板里的管理操作不用弹出提示
- 在 Windows 资源管理器内部操作的时候不用弹出提示（启动子进程依然需要）
- 打开任务管理器的时候不用弹出提示
- 更改防火墙设置的时候不用弹出提示
- 打开 UAC 设置界面的时候不用弹出提示

## 我的建议

现在 Windows 10 都发布了很多个版本了，离 UAC 最初引入到 Windows 系统中时已经过去了十多年时间，这么长的时间，足够很多应用兼容 Medium 的权限级别了。

如果你不了解 Medium 权限级别，可以阅读我的另一篇博客：[Windows 中的 UAC 用户账户控制 - 吕毅](/post/windows-user-account-control)。

即便我们现在选择“始终通知”，也不会比当初 Windows 7 刚刚发布时的通知多了，更不会比当初 Windows Vista 刚刚引入时多。因为应用的 UAC 弹窗少了，而对 Windows 的管理操作也不是经常进行。

我现在日常使用的是“管理员账户 + 始终通知”，在某些情况下可能会使用“标准账户 + 始终通知”。并不会觉得多出了很多 UAC 弹窗。

目前感觉最明显的多出来的弹窗是：

- 打开任务管理器的时候会弹窗
- 添加防火墙信任的时候会弹窗
- 在资源管理器中修改系统目录的时候会弹窗
- 在 Windows 设置应用中的一些设置会弹窗

## 更多关于 UAC 的博客

- [Windows 中的 UAC 用户账户控制 - 吕毅](/post/windows-user-account-control)
- [应用程序清单 Manifest 中各种 UAC 权限级别的含义和效果 - 吕毅](/post/requested-execution-level-of-application-manifest)
- [在 Windows 系统上降低 UAC 权限运行程序（从管理员权限降权到普通用户权限） - 吕毅](/post/start-process-with-lowered-uac-privileges)
- [Windows 下使用 runas 命令以指定的权限启动一个进程（非管理员、管理员） - 吕毅](/post/start-process-in-a-specific-trust-level)

---

**参考资料**

- [The Old New Thing - There are really only two effectively distinct settings for the UAC slider](https://devblogs.microsoft.com/oldnewthing/?p=94105)
