---
title: "如何在 Windows 10 中安装 WSL2 的 Linux 子系统"
publishDate: 2019-07-05 10:18:59 +0800
date: 2020-04-28 20:26:41 +0800
tags: windows linux
position: starter
coverImage: /static/posts/2019-07-05-08-22-01.png
---

本文介绍如何在 Windows 10 中安装 WSL2 的 Linux 子系统

---

<div id="toc"></div>

## 第一步：启用虚拟机平台和 Linux 子系统功能

以管理员权限启动 PowerShell，然后输入以下命令启用虚拟机平台：

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName VirtualMachinePlatform
```

以管理员权限启动 PowerShell，然后输入以下命令启用 Linux 子系统功能：

```powershell
Enable-WindowsOptionalFeature -Online -FeatureName Microsoft-Windows-Subsystem-Linux
```

在以上每一步命令执行完之后，PowerShell 中可能会提示你重新启动计算机。按“Y”可以重新启动。

![启用 VirtualMachinePlatform](/static/posts/2019-07-05-08-22-01.png)

![启用 Microsoft-Windows-Subsystem-Linux](/static/posts/2019-07-05-08-25-26.png)

![正在启用 Linux 子系统](/static/posts/2019-07-05-08-26-11.png)

当然，这个命令跟你在控制面板中启用“适用于 Windows 的 Linux 子系统”功能是一样的。

![在控制面板中启用虚拟机平台和 Linux 子系统](/static/posts/2019-07-05-08-53-22.png)

## 第二步：安装一个 Linux 发行版

打开微软商店应用，在搜索框中输入“Linux”然后搜索，你可以看到搜索结果中有很多的 Linux 发行版可以选择。选择一个你喜欢的 Linux 发行版本然后安装：

![搜索 Linux](/static/posts/2019-07-05-08-30-08.png)

选择一个 Linux 发行版本然后安装：

![安装一个 Linux 发行版](/static/posts/2019-07-05-08-31-34.png)

需要注意，在商店中的安装并没有实际上完成 Linux 子系统的安装，你还需要运行一次已安装的 Linux 发行版以执行真正的安装操作。

![安装 Linux](/static/posts/2019-07-05-09-26-03.png)

## 第三步：启用 WSL2

重要：**你的操作系统版本必须至少大于或等于 Windows 10.0.18917 ！**

使用 `wsl -l` 可以列出当前系统上已经安装的 Linux 子系统名称。注意这里的 `-l` 是列表“list”的缩写，是字母 `l` 不是其他字符。

```powershell
wsl -l
```

如果提示 `wsl` 不是内部或外部命令，说明你没有启用“适用于 Windows 的 Linux 子系统”，请先完成本文第一步。

如果提示没有发现任何已安装的 Linux，说明你没有安装 Linux 发行版，或者只是去商店下载了，没有运行它执行真正的安装，请先完成本文第二步。

使用 `wsl --set-version <Distro> 2` 命令可以设置一个 Linux 发行版的 WSL 版本。命令中 `<Distro>` 替换为你安装的 Linux 发型版本的名称，也就是前面通过 `wsl -l` 查询到的名称。

本文的示例使用的是小白门喜欢的 Ubuntu 发行版。

```powershell
wsl --set-version Ubuntu 2
```

![设置 WSL2](/static/posts/2019-07-05-10-12-35.png)

当然，使用以下命令可以在以后安装 Linux 的时候默认启用 WSL2：

```powershell
wsl --set-default-version 2
```

---

**参考资料**

- [Install WSL 2 - Microsoft Docs](https://docs.microsoft.com/en-us/windows/wsl/wsl2-install)

