---
title: "用 WiX 制作安装包：准备一个用于学习 WiX 安装包制作的 Visual Studio 解决方案"
date: 2021-07-14 17:47:10 +0800
tags: dotnet msi wix
position: starter
coverImage: /static/posts/2021-07-14-14-59-59.png
permalink: /post/getting-started-with-wix-toolset-create-a-new-learning-vs-solution.html
---

本文是 [WiX Toolset 安装包制作入门教程](/post/getting-started-with-wix-toolset) 系列中的一篇，可前往阅读完整教程。

严格来说，本文算不得教程，只是带大家创建一个需要被打包的项目。如果你本身对使用 Visual Studio 开发非常得心应手，本文完全可以跳过，你可以用你的任何一个现成的项目进行练手。

---

<div id="toc"></div>

## 创建示例项目

我这里拿一个控制台项目示例，当作被打包的对象。

![启动 Visual Studio 创建新项目](/static/posts/2021-07-14-14-59-59.png)  
▲ 启动 Visual Studio 创建新项目

![选择控制台应用程序作为模板](/static/posts/2021-07-14-15-08-59.png)  
▲ 选择控制台应用程序作为模板

![输入好项目和解决方案名称](/static/posts/2021-07-14-15-09-51.png)  
▲ 输入好项目和解决方案名称

![选好目标框架](/static/posts/2021-07-14-15-10-53.png)  
▲ 选好目标框架

那么，我们就创建好了一个最简单的项目：

![一个简单的项目](/static/posts/2021-07-14-15-12-10.png)

我们后续学习打包时，就需要打包这个项目生成的应用。

## 加入 git 版本管理

为了避免学习过程中各种修改导致文件无法还原，建议大家将此新项目加入到 git 版本管理中。

![创建 Git 存储库](/static/posts/2021-07-14-15-14-42.png)  
▲ 创建 Git 存储库

![仅限本地](/static/posts/2021-07-14-15-15-18.png)  
▲ 仅限本地

现在，我们已经准备了一个最简单的项目，可以开始后续 WiX 打包的正式学习了。


