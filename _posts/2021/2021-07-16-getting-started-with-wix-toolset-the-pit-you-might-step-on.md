---
title: "使用 WiX 创建最简单的安装包过程中可能出现的问题和解决方案汇总"
date: 2021-07-16 11:50:15 +0800
categories: dotnet msi wix
position: problem
---

本文是 [WiX Toolset 安装包制作入门教程](/post/getting-started-with-wix-toolset) 系列中的番外篇，可前往阅读完整教程。

用 WiX 制作安装包还是有些门槛的。如果你没有完全按照我教程中提供的步骤来执行（例如你用了自己的项目名，却在复制关键代码时没有改成自己的），那么极有可能在最终生成安装包后无法运行。

本文记录一些跟着教程做时可能遇到的常见问题，帮助你在遇到问题后能及时找到解决方案。如果看完还没有解决你的问题，欢迎留言探讨，也可以尝试 [调试 WiX 制作的安装包](/post/how-to-debug-wix-burn-installer)。

---

<div id="toc"></div>

## 无法启动 exe 安装包

- [用 WiX Burn 制作托管安装包：出现 `0x80070002` 错误](/post/wix-managed-bootstrapper-application-error-80070002)
- [用 WiX Burn 制作托管安装包：出现 `0x80131508` 错误](/post/wix-managed-bootstrapper-application-error-80131508)

## .NET Framework 始终会安装

- [用 WiX 制作安装包：设置的 .NET Framework 前置会始终安装，即使目标电脑已经自带或装好](/post/wix-burn-always-install-netfx-even-if-already-installed)
