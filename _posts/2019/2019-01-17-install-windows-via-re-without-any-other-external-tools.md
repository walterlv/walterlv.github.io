---
title: "不使用 U 盘等任何工具全新安装 Windows 操作系统"
date: 2019-01-17 20:13:38 +0800
tags: windows
position: starter
coverImage: /static/posts/2019-01-17-19-33-15.png
permalink: /post/install-windows-via-re-without-any-other-external-tools.html
---

安装 Windows 有非常多种方法，现在我们要解决的问题是：

1. 手头没有量产的 U 盘，或者懒得花时间去用 iso 文件量产 U 盘；
1. 不想在 Windows 现有系统下安装（可能是为了全新安装，也可能是为了跳过安装序列号/产品密钥）

于是本文教你如何一步一步在 Windows RE 环境下安装操作系统。

---

<div id="toc"></div>

## 准备工作

1. Windows 10 的安装文件
    - 例如 cn_windows_10_consumer_editions_version_1809_updated_jan_2019_x64_dvd_34b4d4fb.iso
1. 现有系统是 Windows 8/8.1/10 操作系统

## 第一步：解压 iso 文件

将 iso 文件解压到一个文件夹中，例如，我解压到 D:\Windows10 文件夹中。

![解压 iso 到一个文件夹中](/static/posts/2019-01-17-19-33-15.png)

## 第二步：重启进入 RE 环境

现在，在开始菜单中点击电源按钮，这时会弹出电源选择菜单。注意：**请按住 Shift 键不放，然后点击重启按钮**，重启按钮点完之后才能松开 Shift 键。

![按住 Shift 键点击重启按钮](/static/posts/2019-01-17-19-34-56.png)

## 第三步：等待进入 RE 环境

这时重启会进入 RE 环境。Windows RE 指的是 [Windows Recovery Environment](https://docs.microsoft.com/en-us/windows-hardware/manufacture/desktop/windows-recovery-environment--windows-re--technical-reference)，也就是 Windows 恢复环境。你可以在这里进行很多系统之外的操作。相比于 PE 需要一个光盘或者 U 盘来承载，RE 是直接在你安装 Windows 8/8.1/10 时直接自带到机器硬盘上的。

![进入 RE 环境](/static/posts/2019-01-17-19-38-03.png)

## 第四步：进入 RE 环境的命令提示符

依次进入 疑难解答 -> 高级选项 -> 命令提示符 -> 选择自己的账号 -> 输入自己的密码

注意，在选择命令提示符之后，计算机还会再重启一次，所以需要等一会儿才会到选择账号的界面。

![疑难解答](/static/posts/2019-01-17-19-44-59.png)

![高级选项](/static/posts/2019-01-17-19-46-03.png)

![命令提示符](/static/posts/2019-01-17-19-47-02.png)

![选择自己的账号](/static/posts/2019-01-17-19-52-19.png)

![输入自己账号的密码](/static/posts/2019-01-17-19-53-46.png)

## 第五步：在命令提示符中找到安装程序

我们一开始将系统解压到了 D:\Windows10 文件夹下。一般来说，现在也应该是在 D 盘的 Windows10 文件夹下。不过有时候你会发现这里的 D 盘并不是你想象中那个 D 盘，你找不到那个文件夹和里面那个安装文件。这个时候可以去 C 盘、E 盘、F 盘等地方也看看。

命令提示符的操作这里就不赘述了，无非是 `D:` 跳转到某个盘符，`cd` 跳转到某个文件夹下，`setup.exe` 打开 setup.exe 这个程序。

![打开 setup.exe](/static/posts/2019-01-17-19-57-34.png)

## 第六步：按照熟悉的安装系统的流程安装操作系统

现在，你应该可以看到熟悉的 Windows 10 安装界面了。

![开始安装 Windows](/static/posts/2019-01-17-20-08-31.png)

比如，你可以在这里跳过产品密钥的输入：

![跳过产品密钥的输入](/static/posts/2019-01-17-20-09-59.png)

![选择 Windows 10 的安装版本](/static/posts/2019-01-17-20-10-45.png)

比如可以使用在 Windows 内部安装无法使用的“自定义”安装方式：

![使用自定义的安装方式](/static/posts/2019-01-17-20-11-17.png)

甚至能在这里格式化所有分区，删除所有磁盘：

![格式化分区或者删除磁盘](/static/posts/2019-01-17-20-12-58.png)

剩下的，祝你好运！


