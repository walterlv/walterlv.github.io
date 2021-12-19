---
title: "VMware Workstation 与 Device/Credential Guard 不兼容。在禁用 Device/Credential Guard 后，可以运行 VMware Workstation"
date: 2020-06-10 08:58:01 +0800
tags: windows
position: problem
coverImage: /static/posts/2020-06-08-08-53-37.png
permalink: /posts/vmware-wants-to-disable-credential-guard.html
---

VMware Workstation 与 Device/Credential Guard 不兼容。在禁用 Device/Credential Guard 后，可以运行 VMware Workstation。有关更多详细信息，请访问 <http://www.vmware.com/go/turnoff_CG_DG>。

---

我在系统升级到 Windows 10 2004 后，启动 VMware 的任一台虚拟机时会弹出错误提示框：

![不兼容](/static/posts/2020-06-08-08-53-37.png)

嗯，图标题中的“lindexi”就是小伙伴[林德熙](https://blog.lindexi.com/)；他在我的电脑上运行了一台虚拟机远程使用。然而怎么能随随便便就让虚拟机挂掉呢？得在他醒来之前偷偷修好。

提示框中的 Device/Credential Guard 就是 Windows 10 系统的“内核隔离”。

按照以下步骤逐一执行，直到修复。

## 特别前提

VMware 从 15.5.5 版本开始，已支持在启用了 Hyper-V 的 Windows 10 主机上运行：

1. 使用 WSL 和 Device/Credential Guard 等功能时，用户仍可运行 VMware Workstation 虚拟机
2. 需要 Windows 10 20H1 版本及以上系统

因此，如果你觉得不想折腾，直接将 VMware 升级到 15.5.5 以上即可。

![15.5.5](/static/posts/2020-06-10-08-55-34.png)

图来自于 [kkwpsv（李少珺）](https://blog.sdlsj.net/)。

## 第一步：关闭内核隔离，然后重启

![关闭内核隔离](/static/posts/2020-06-08-09-03-28.png)

要找到“内核隔离”开关，直接在开始菜单搜索“内核隔离”或者“Credential Guard”即可。如果搜不到，去任务栏右下角找到“Windows 安全中心”双击打开。

## 第二步：禁用设备防护

打开“组策略”，进入 本地计算机策略 -> 计算机配置 -> 管理模板 -> 系统 -> Device Guard -> 基于虚拟化的安全性。

选择已禁用。

![禁用基于虚拟化的安全性](/static/posts/2020-06-10-08-41-37.png)

## 第三步：关闭 Hyper-V

在“启用或关闭 Windows 功能”里，关闭掉 Hyper-V 虚拟机（也需要重启）。

![关闭 Hyper-V](/static/posts/2020-06-10-08-48-21.png)

## 第四步：运行命令

以管理员身份运行以下命令：

```powershell
bcdedit /set hypervisorlaunchtype off
```

然后重启计算机。

---

**参考资料**

- [Windows沙盒和vmware workstation似乎只能存在一个-远景论坛-微软极客社区](http://bbs.pcbeta.com/forum.php?mod=viewthread&tid=1813168&page=1#pid49133290)


