---
title: "用 WiX 制作安装包：安装 WiX Toolset 系列 Visual Studio 插件"
date: 2021-07-14 17:47:10 +0800
tags: dotnet msi wix
position: starter
coverImage: /static/posts/2021-07-14-11-29-43.png
---

本文是 [WiX Toolset 安装包制作入门教程](/post/getting-started-with-wix-toolset) 系列中的一篇，可前往阅读完整教程。

本文介绍安装 WiX Toolset 的两款 Visual Studio 插件，以便你能直接在 Visual Studio 里完整整套安装包的制作，无需使用命令行工具。对初学 WiX 的开发者来说比较友好。

---

<div id="toc"></div>

## 关于插件

Wix Toolset Visual Studio Extension 为 Visual Studio 带来了这些功能：

1. 通过模板创建 WiX 项目
1. 支持 .wixproj 这个 WiX 专属的项目格式（只是新扩展名，里面的内容还是其他各种项目格式都用的那种）
1. 为 WiX 打包项目提供专属的属性面板页，可供设置一些基本的属性

反正，装了这款插件能让你更容易编写和管理 WiX 安装包相关文件。

## 安装插件

截至目前（2021年7月），WiX Toolset 的 Visual Studio 扩展最高支持到 VS2019，因此你需要在不高于 VS2019 的扩展管理里面下载插件。

方法是：

1. 启动 Visual Studio 2019，选“继续但无需代码”；
2. 选菜单“扩展”->“管理扩展”；
3. 在“联机”页中搜索“WiX”，找到“Wix Toolset Visual Studio 2019 Extension”，然后点“下载”；
4. 接下来，关闭所有已经打开的 Visual Studio，等待自动弹出的插件安装界面；
5. 在 VSIX Installer 界面中，点击“Modify”以应用插件的安装。

![启动 Visual Studio 2019](/static/posts/2021-07-14-11-29-43.png)

![打开“管理扩展”](/static/posts/2021-07-14-14-43-45.png)

![在 VSIX Installer 中点击“Modify”](/static/posts/2021-07-14-14-47-25.png)

## 其他说明

WiX 插件暂不支持 Visual Studio 2022，毕竟到了 Visual Studio 2022 开始 VS 使用 AMD64 架构了。

如果你有自己的插件需要升级到支持 VS2022，可阅读我的另一篇博客：

- [Visual Studio 2022 出来啦！教你如何将 VS2019 的 VSIX 扩展/插件项目迁移到 VS2022](/post/add-vs2019-extension-support-to-vs2022.html)

