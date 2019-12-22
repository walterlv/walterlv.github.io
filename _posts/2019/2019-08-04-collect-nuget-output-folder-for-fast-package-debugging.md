---
title: "通过 mklink 收集本地文件系统的所有 NuGet 包输出目录来快速调试公共组件代码"
date: 2019-08-04 21:17:27 +0800
categories: dotnet csharp msbuild visualstudio nuget
position: starter
---

我们做的公共库可能通过 nuget.org 发布，也可能是自己搭建 NuGet 服务器。但是，如果某个包正在开发中，需要快速验证其是否解决掉一些诡异的 bug 的话，除了单元测试这种间接的测试方法，还可以在本地安装未发布的 NuGet 包的方法来快速调试。

本文介绍如何本地打包发布 NuGet 包，然后通过 mklink 收集所有的本地包达到快速调试的目的。

---

<div id="toc"></div>

## 将本地文件夹作为 NuGet 源

我有另一篇博客介绍如何将本地文件夹设置称为 NuGet 包源：

- [全局或为单独的项目添加自定义的 NuGet 源 - walterlv](/post/add-custom-nuget-source.html)

在 Visual Studio 中打开 `工具` -> `选项` -> `NuGet 包管理器` -> `包源` 可以直接将一个本地文件夹设置称为 NuGet 包源。

![管理包源](/static/posts/2019-02-27-11-58-37.png)

其他设置方法可以去那篇博客当中阅读。

## 通过 mklink 收集散落在各处的本地文件夹 NuGet 源

如下图，是我通过 mklink 将散落在各处的 NuGet 包的调试输出目录收集了起来：

![通过 mklink 收集的 NuGet 包源](/static/posts/2019-08-04-21-10-56.png)

比如，点开其中的 `Walterlv.Packages` 可以看到 `Walterlv.Packages` 仓库中输出的 NuGet 包：

![其中的一个 NuGet 输出文件夹](/static/posts/2019-08-04-21-12-20.png)

由于我的每一个文件夹都是指向的 Visual Studio 编译后的输出目录，所以，只需要使用 Visual Studio 重新编译一下项目，文件夹中的 NuGet 包即会更新。

于是，这相当于我在一个文件夹中，包含了我整个计算机上所有库项目的 NuGet 包，只需要将这个文件夹设置称为 NuGet 包源，即可直接调试本地任何一个公共组件库打出来的 NuGet 包。

## 设置源并体验快速调试

如下图，是我将那个收集所有 NuGet 文件夹的目录设置成为了 NuGet 源：

![设置的本地 NuGet 源](/static/posts/2019-08-04-21-15-42.png)

于是，我可以在 Visual Studio 的包管理器中看到所有还没有发布的，依然处于调试状态的各种库：

![各种处于调试状态的各种库](/static/posts/2019-08-04-21-15-26.png)

基于此，我们可以在包还没有编写完的时候调试，验证速度非常快。
