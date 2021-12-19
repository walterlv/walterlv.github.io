---
title: ".NET 使用 JustAssembly 比较两个不同版本程序集的 API 变化"
publishDate: 2019-02-24 17:09:17 +0800
date: 2019-03-10 21:30:49 +0800
tags: dotnet csharp
position: starter
coverImage: /static/posts/2019-02-24-16-59-29.png
permalink: /posts/compare-api-between-two-assemblies-using-just-assembly.html
---

最近我大幅度重构了我一个库的项目结构，使之使用最新的项目文件格式（基于 Microsoft.NET.Sdk）并使用 SourceYard 源码包来打包其中的一些公共代码。不过，最终生成了一个新的 dll 之后却心有余悸，不知道我是否删除或者修改了某些 API，是否可能导致我原有库的使用者出现意料之外的兼容性问题。

另外，准备为一个产品级项目更新某个依赖库，但不知道更新此库对我们的影响有多大，希望知道目前版本和希望更新的版本之间的 API 差异。

索性发现了 JustAssembly 可以帮助我们分析程序集 API 的变化。本文将介绍如何使用 JustAssembly 来分析不同版本程序集 API 的变化。

---

<div id="toc"></div>

## 下载和安装 JustAssembly

[JustAssembly](https://github.com/telerik/justassembly) 是 [Telerik](https://github.com/telerik) 开源的一款程序集分析工具。

你可以去它的官网下载并安装：[Assembly Diff Tool for .NET - JustAssembly](https://www.telerik.com/justassembly)。

## 开始比较

启动 JustAssembly，在一开始丑陋（逃）的界面中选择旧的和新的 dll 文件，然后点击 `Load`。

![选择旧的和新的 dll 文件](/static/posts/2019-02-24-16-59-29.png)

然后，你就能看到新版本的 API 相比于旧版本的差异了。

![新版本的 API 相比于旧版本的差异](/static/posts/2019-02-24-17-03-03.png)

## 关于比较结果的说明

在差异界面中，差异有以下几种显示：

1. 没有差异
    - 以白色底显示
1. 新增
    - 以绿色底辅以 `+` 符号显示
1. 删除
    - 以醒目的红色底辅以 `-` 符号显示
1. 有部分差异
    - 以蓝紫色底辅以 `~` 符号显示

这里可能需要说明一下“部分差异”：由于差异是以树状结构显示的，所以如果子节点有新增，那么父节点因为既有新增又存在未修改的节点，所以会以“有部分差异”的方式显示。

对于每一个差异，双击可以去看差异的代码详情。

上图我的 SourceFusion 项目在版本更新的时候只有新增的 API，没有修改和删除的 API，所以还是一个比较健康的 API 更新。

---

**参考资料**

- [telerik/JustAssembly: Assembly Diff and Analysis Tool](https://github.com/telerik/justassembly)
- [Assembly Diff Tool for .NET - JustAssembly](https://www.telerik.com/justassembly)


