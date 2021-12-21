---
title: "使用 ImageMagick 轻松制作带有多种尺寸的 ico 图标文件"
publishDate: 2021-12-21 11:11:50 +0800
date: 2021-12-21 11:43:40 +0800
categories: windows
position: starter
coverImage: /static/posts/2021-12-21-11-06-12.png
---

ico 图标格式是一种包含多种尺寸位图的容器格式，Windows 用这种格式来作为图标是为了能让文件图标在各种不同显示尺寸下都能看起来清晰可辨。可是，相当多的平面设计软件都没有内嵌 ico 格式的支持（尤其是 macOS 版的），导致设计师很难直接输出 ico 格式的图标。另外，有些自称能 png 转 ico 格式的图片转换器虽然能生成 ico 格式，但这种 ico 格式内只包含一种位图尺寸，导致在很小或很大时图标显示非常模糊。

那么，本文推荐 ImageMagick 这款强大的命令行工具，帮助我们一条命令完成多尺寸 png 图到 ico 格式的转换。虽是牛刀杀鸡，但奈何确实简单方便。

---

<div id="toc"></div>

## ImageMagick 下载安装

### 直接下载

- 官方网站：[ImageMagick – Convert, Edit, or Compose Digital Images](https://imagemagick.org/index.php)
- 官方仓库：[ImageMagick/LICENSE at main · ImageMagick/ImageMagick](https://github.com/ImageMagick/ImageMagick)
- 下载地址：[ImageMagick – Download](https://imagemagick.org/script/download.php)

官方下载地址里，Windows 的下载在最后一项——“Windows Binary Release”。介绍文字很多，如果看不下去的话，直接选 Windows 章节下第一个表格里第一个版本下载即可，这是 64 位系统下的 ImageMagick 安装包，下载完点击安装后即可拥有其完整的命令行工具。

软件基于 Apache 2.0 协议，如果你只是使用它生成的二进制文件，那么可免费用于个人、公司内部或商业用途。

### scoop 安装（推荐）

如果你使用 scoop 来管理软件包，那么只需输入：

```powershell
scoop install imagemagick
```

装完后你将自动拥有其对应的命令行工具，可随时在各个终端输入命令。

## ImageMagick 使用

本来 ImageMagick 转图片用的是 `convert` 命令，但 Windows 下 `convert` 命令转的是磁盘格式（详见[在 Windows 安装期间将 MBR 磁盘转换为 GPT 磁盘](/post/convert-mbr-to-gpt-during-windows-installation.html)），所以我们只能通过 `magick convert` 命令来替代它。

### 多尺寸 png 转 ico 格式

前往包含多尺寸 png 的文件夹中，执行如下命令，将其转为多位图尺寸 ico 格式。

```powershell
magick convert 16.png 24.png 32.png 48.png 256.png walterlv.ico
```

前面的所有参数都是 png 图片，最后一个参数是 ico 输出文件名。ImageMagick 会自动识别 png 的尺寸并设置到 ico 中。

![ImageMagick 转 ico 命令](/static/posts/2021-12-21-11-06-12.png)

