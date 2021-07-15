---
title: "WiX Toolset 安装包制作入门教程（目录篇）"
publishDate: 2021-07-14 18:54:18 +0800
date: 2021-07-15 20:21:17 +0800
categories: dotnet msi wix
position: starter
---

WiX 全称为 Windows Installer XML，是使用 XML 文件创建 Windows 安装程序的一组工具集。它开源且完全免费。

虽然这一组工具集功能非常强大，但学习曲线较陡峭，在没有人指导的情况下独立完成完整的安装包制作会比较困难。对安装包技术零基础的开发者，甚至仅凭阅读官方文档的教程系列也难以完成 Hello World 级别的安装包制作。所以本系列博客的出现旨在填补官方教程系列的这一空缺，希望零基础的开发者也能在本教程的帮助下独立完成整套安装包的制作。

---

<div id="toc"></div>

## 系列教程说明

1. 截至 2021 年 7 月，WiX 4 尚处在预览阶段，所以本系列教程基于 WiX 3 进行。
2. 本系列教程所需的所有源代码都已在 GitHub 上开源，你可以克隆下来学习和试验，也可以选择性忽略。
3. 如果你在阅读教程时发现有些步骤不对（或者按步骤完成后依然无法跑通，或者遇到了各种奇葩问题），欢迎在评论区留言，或加我的 QQ 交流（450711383）。

## 分类 Hello World

WiX 能制作不同种类的安装包，各类安装包的制作方法不同，做 Hello World 所需的步骤也不一样。所以这里分一下类，每个类别都可从零开始完成整个类别的 Hello World。

你可以挑自己想做的安装包类型，然后直接在这个类别里面从第一篇读至最后一篇。

### msi 格式安装包的 Hello World

1. [安装 WiX Toolset 工具集](/post/getting-started-with-wix-toolset-installing-build-tools)
1. [安装 WiX Toolset Visual Studio 插件](/post/getting-started-with-wix-toolset-installing-visual-studio-extensions)
1. [准备一个用于学习 WiX 安装包制作的 Visual Studio 解决方案](/post/getting-started-with-wix-toolset-create-a-new-learning-vs-solution)
1. [使用 WiX 创建一个简单的 msi 安装包](/post/getting-started-with-wix-toolset-msi-hello-world)

### exe 格式安装包的 Hello World

1. [安装 WiX Toolset 工具集](/post/getting-started-with-wix-toolset-installing-build-tools)
1. [安装 WiX Toolset Visual Studio 插件](/post/getting-started-with-wix-toolset-installing-visual-studio-extensions)
1. [准备一个用于学习 WiX 安装包制作的 Visual Studio 解决方案](/post/getting-started-with-wix-toolset-create-a-new-learning-vs-solution)
1. [使用 WiX 创建一个简单的 msi 安装包](/post/getting-started-with-wix-toolset-msi-hello-world)
1. [使用 WiX 创建一个简单的 exe 安装包](/post/getting-started-with-wix-toolset-exe-hello-world)

### 要求 .NET Framework 前置的 Hello World

1. [安装 WiX Toolset 工具集](/post/getting-started-with-wix-toolset-installing-build-tools)
1. [安装 WiX Toolset Visual Studio 插件](/post/getting-started-with-wix-toolset-installing-visual-studio-extensions)
1. [准备一个用于学习 WiX 安装包制作的 Visual Studio 解决方案](/post/getting-started-with-wix-toolset-create-a-new-learning-vs-solution)
1. [使用 WiX 创建一个简单的 msi 安装包](/post/getting-started-with-wix-toolset-msi-hello-world)
1. [为 WiX 制作的 msi 安装包添加 .NET Framework 环境检查](/post/getting-started-with-wix-toolset-msi-detect-net-framework)
1. [使用 WiX 创建一个简单的 exe 安装包](/post/getting-started-with-wix-toolset-exe-hello-world)
1. [为 WiX 制作的 exe 安装包添加 .NET Framework 前置的安装步骤](/post/getting-started-with-wix-toolset-bundle-detect-and-install-net-framework)

### 使用 WPF 制作安装界面的 Hello World

1. [安装 WiX Toolset 工具集](/post/getting-started-with-wix-toolset-installing-build-tools)
1. [安装 WiX Toolset Visual Studio 插件](/post/getting-started-with-wix-toolset-installing-visual-studio-extensions)
1. [准备一个用于学习 WiX 安装包制作的 Visual Studio 解决方案](/post/getting-started-with-wix-toolset-create-a-new-learning-vs-solution)
1. [使用 WiX 创建一个简单的 msi 安装包](/post/getting-started-with-wix-toolset-msi-hello-world)
1. [使用 WiX 创建一个简单的 exe 安装包](/post/getting-started-with-wix-toolset-exe-hello-world)
1. [为 WiX 制作的 exe 安装包添加 .NET Framework 前置的安装步骤](/post/getting-started-with-wix-toolset-bundle-detect-and-install-net-framework)
1. [使用 WPF 制作安装界面（入门篇）](/post/getting-started-with-wix-toolset-create-a-wpf-installer-ui)

## 你可能在 Hello World 系列中遇到的问题和解决办法汇总

### 方法与汇总

- [如何查看用 WiX 制作的安装包的日志](/post/how-to-view-wix-burn-installer-logs)
- [使用 WiX 创建最简单的安装包过程中可能出现的问题和解决方案汇总](/post/getting-started-with-wix-toolset-the-pit-you-might-step-on)
- [如何调试用 WiX 制作的安装包](/post/how-to-debug-wix-burn-installer)

### 具体问题

- [用 WiX 制作安装包：设置的 .NET Framework 前置会始终安装，即使目标电脑已经自带或装好]()

## 基本概念和原则

在完成了前面的 Hello World 系列教程后，你需要跑完整个流程才算真正做了一个安装包。然而，由于 WiX 本身的入门并不容易，你可能需要了解一些基本的概念才能更容易地完成整个安装流程。

不用担心，这里只会涉及到完成最简流程需要用到的那些概念，更深入的概念我会在其他系列的教程里再说明。

// 未完待续...

## 完成主要安装流程

// 未完待续...


## 可供查阅的资料汇总

- [可在 wxs 中编写的项目引用变量 $(var.ProjectName.Xxx) 系列)]()

## 其他 WiX Toolset 教程系列

- [WiX Toolset 安装包制作中级教程]()

---

**参考资料**

- [WiX Toolset v3 Manual Table of Contents](https://wixtoolset.org/documentation/manual/v3/)
- [WiX Toolset 教程索引页 - 奇葩史 - 博客园](https://www.cnblogs.com/huaxia283611/p/WiX-ToolsetIndex.html)
- [visual studio 2010 - WiX 'Bundle' 'ExePackage' 'DetectCondition' is always false - Stack Overflow](https://stackoverflow.com/questions/14863905/wix-bundle-exepackage-detectcondition-is-always-false)
