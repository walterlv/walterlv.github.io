---
title: "制作 Windows 10 安装盘，解决大于 4GB 的 Windows 10 镜像在 UEFI 模式下的安装问题"
date: 2018-02-22 22:14:19 +0800
categories: windows sysprep
tags: U盘 优盘 量产 Windows10 Win10 4GB FAT32 NTFS GPT UEFI
---

制作一个 Windows 安装 U 盘是很容易的，使用 UltraISO 这样的刻录工具量产一个 iso 镜像文件到 U 盘即可。然而随着 Windows 10 版本号的提升，镜像变得越来越大，终于 FAT32 文件系统不再能够容纳得下安装镜像文件 install.wim 了。

本文将介绍如何制作镜像文件大于 4GB 的 UEFI 启动的系统安装盘。

---

<div id="toc"></div>

充分利用 Windows 8 和 Windows 10 中的特性——“快速启动”，我们必须使用 UEFI 模式启动操作系统；这就要求我们制作的 U 盘安装盘必须以 UEFI 模式启动；这就要求 U 盘文件系统必须是 FAT32 的；这就要求我们的系统镜像文件 install.wim 不大于 4GB。然而 Windows 10 1709 的镜像文件就是大于 4GB，于是悲剧诞生……

如果你熟悉如何制作 U 盘安装盘，那么可直接从第二步开始阅读；如果不了解，就直接开始吧！

### 第一步：下载 Windows 10 iso 镜像文件

微软一般不提供 Windows 10 的下载镜像，但 MSDN I Tell You 收集了几乎所有的 Windows 10 正式版本镜像文件，所以可以 [前往 MSDN I Tell You 下载](https://msdn.itellyou.cn/)。

![Windows 10 1709 镜像下载地址](/static/posts/2018-02-22-20-45-09.png)

### 第二步：使用镜像文件制作安装 U 盘

曾经我一直使用 UltraISO 来制作启动 U 盘，毕竟是老牌刻录软件。

![UltraISO](/static/posts/2018-02-22-20-50-17.png)

无论刻录的时候选择了什么样的配置，刻录完之后 U 盘文件系统都会是 FAT32 格式。直到 Windows 10 的前一两个版本，install.wim 都没有超过 4GB，所以我一直以为微软会刻意避免让镜像文件超过 4GB；于是我依然使用它来制作安装盘。然而没有想到的是，当真的超过了 4GB 后，整个刻录过程居然没有报错（虽然事实上证明会安装失败）。

- [为什么 UEFI 方式启动的 U 盘必须使用 FAT32 文件系统？](/post/faq-in-installing-windows.md)

可能因为 UltraISO 太老了，以至于都没有看到对大尺寸镜像文件的支持。于是，我招到了另一款——rufus：

#### 推荐使用开源软件 rufus

- [rufus 官网](https://rufus.akeo.ie/)
- [rufus 的 GitHub 仓库](https://github.com/pbatard/rufus)

官方对它的广告词是：

> The Reliable USB Formatting Utility  
> 靠谱的 U 盘格式化工具

启动后就只有一个设置界面：

![设置界面](/static/posts/2018-02-22-21-19-56.png)

对我们至关重要的选项就是分区方案和目标系统类型（Partition scheme and target system type）：

![分区方案和目标系统类型](/static/posts/2018-02-22-21-20-40.png)

这意味着我们量产后的 U 盘将支持 UEFI 启动，同时支持 GPT 分区。这样，我们便能够以 UEFI 的方式启动 U 盘。

另一个选项是文件系统（File system）：

![文件系统](/static/posts/2018-02-22-21-24-24.png)

由于 Windows 10 的系统镜像大于 4GB，所以我们需要选择 NTFS（exFAT 也行，但此文件系统不太成熟）。

其他保持默认即可，或者按照我图中所选。记得点击此处选择要使用的镜像 iso 文件。

![选择 iso 文件](/static/posts/2018-02-22-21-26-39.png)

点击“开始”后静待进度条结束，我们便得到了一个可以 UEFI 启动的 Windows 安装 U 盘。

#### 观察 rufus 制作的 U 盘

这不是安装过程中必要的步骤，只是为了满足好奇心。

![rufus 制作的安装盘](/static/posts/2018-02-22-22-18-55.png)

可以看到，rufus 实际做了这些事情：

1. 将 U 盘所有内容清除，并转换成 GPT 格式（更多转换信息可阅读我的[另一篇博客](/post/convert-mbr-to-gpt-during-windows-installation.md)）。
1. 将 U 盘分成两个区，一个 FAT，包含用于在 EFI 下加载 NTFS 文件系统所必须的组件；一个 NTFS，包含安装 Windows 所需的真正文件（4GB 的镜像不在话下）。

![4GB 的 install.wim](/static/posts/2018-02-22-22-24-32.png)

### 第三步：重启电脑并选择 UEFI U 盘启动

#### 在 Windows 系统中

按住 Shift，然后点击“重启”按钮，Windows 10 将会在重启后进入 RE 环境：

![Shift + 重启](/static/posts/2018-02-22-21-32-52.png)

在 RE 环境中选择使用可移动存储设备启动即可使用 U 盘启动。

#### 使用更传统的方案

当然，大部分主板都支持开机期间按下 F12 来临时选择启动设备。不过，如果在主板上开启了“快速启动”，那么很有可能根本就来不及按下 F12！这时可以采用上面的方案。

选择带 UEFI 前缀的 U 盘。

不管使用哪一种方案，启动后将看到此时启动的 U 盘会提示正在加载 NTFS EFI loader：

![NTFS EFI loader](/static/posts/2018-02-22-22-22-30.png)

### 第四步：选择 GPT 分区的驱动器，并按套路安装 Windows

在安装界面中，我们需要确保选择的驱动器是 GPT 分区的，因为 UEFI 启动时不支持 MBR 分区表。

如果没有驱动器是 GPT 分区的，该怎么办？可以使用命令转换一个 MBR 分区的驱动器到 GPT 分区。参见 [在 Windows 安装期间将 MBR 驱动器转换为 GPT 驱动器](/post/convert-mbr-to-gpt-during-windows-installation.md)。

接下来，一路下一步并略加设置即可。

---

#### 参考资料

- [Creating Windows 10 UEFI fat32 USB Stick from NTFS Windows 10 ISO not possible · Issue #589 · pbatard/rufus](https://github.com/pbatard/rufus/issues/589)
