---
title: "WiX 安装包制作最佳实践：Id、UpgradeCode 应该怎么设置？"
date: 2021-07-14 17:46:49 +0800
tags: dotnet msi wix
position: starter
coverImage: /static/posts/2021-07-14-17-04-08.png
permalink: /post/windows-installer-using-wix-best-practice-product-id-and-upgrade-code.html
---

在 WiX 安装包制作时，Product.wxs 文件中的 `Product` 标签中存在一些属性，这些属性应该如何设置才是比较合适的呢？

---

本文是对我另一篇入门教程博客的一点补充：

- [用 WiX 制作安装包：创建一个简单的 msi 安装包](/post/getting-started-with-wix-toolset-msi-hello-world)

<div id="toc"></div>

## Id、Version

- Id：产品 Id。
- Version：产品版本。

关于这两个值的变化：

- 如果这两个值都没有更改而构建出一个新的 MSI 安装包，那么 Windows Installer 会认为这两个包之间属于“小型更新”（Update）。
- 如果 `Version` 属性更改，而 `Id` 属性没有更改，那么 Windows Installer 会认为这两个包之间属于“次要升级”（Upgrade）。
- 如果这两个值都更改了，那么 Windows Installer 会认为这两个包之间属于“主要升级”（MajorUpgrade）。

特别把这几种升级类型的英文名称拿出来说，是因为我们在 Product.wxs 中配置升级策略时会使用到这些名称。了解这些升级方式有助于我们写出符合预期的升级策略。

如果保持 Product.wxs 文件的 `Product` 元素的 `Id` 属性为 `*`，那么每次构建一个 MSI 文件都会视为一次“主要升级”（MajorUpgrade）。

在没有配置升级策略的情况下，如果有两个不同的 MSI 包设置了相同的 Id 和 Version，那么当安装了其中一个之后，另一个将无法安装。双击 msi 文件时，Windows Installer 将弹出错误框：

![Id 相同的错误](/static/posts/2021-07-14-17-04-08.png)

## UpgradeCode

对于同一个产品，无论其产品 Id、Version 如何变化，都应该保持 `UpgradeCode` 不变，以便 Windows Installer 能准确认为这是同一个产品的“主要升级”（MajorUpgrade）。

---

**参考资料**

- [修补和升级 - Win32 apps - Microsoft Docs](https://docs.microsoft.com/zh-cn/windows/win32/msi/patching-and-upgrades?redirectedfrom=MSDN)
- [Product Identification (ProductCode and UpgradeCode)](https://www.advancedinstaller.com/user-guide/product-identification.html)
- [In WiX, where is the ProductCode specified? - Stack Overflow](https://stackoverflow.com/a/26734471/6233938)
- [ProductCode 属性 - Win32 apps - Microsoft Docs](https://docs.microsoft.com/zh-cn/windows/win32/msi/productcode?redirectedfrom=MSDN)


