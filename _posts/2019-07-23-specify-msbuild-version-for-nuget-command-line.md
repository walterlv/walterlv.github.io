---
title: "为 NuGet 指定检测的 MSBuild 路径或版本，解决 MSBuild auto-detection: using msbuild version 自动查找路径不合适的问题"
date: 2019-07-23 14:32:39 +0800
categories: nuget msbuild visualstudio dotnet
position: problem
published: false
---

使用 `nuget restore` 命令还原项目的 NuGet 包的时候，NuGet 会尝试自动检测计算机上已经安装的 MSBuild。不过，如果你同时安装了 Visual Studio 2017 和 Visual Studio 2019，那么 NuGet 有可能找到错误版本的 MSBuild。

本文介绍如何解决自动查找版本错误的问题。

---

<div id="toc"></div>

## 问题

当我们敲下 `nuget restore` 命令的时候，命令行的第 2 行会输出自动检测到的 MSBuild 版本号，就像下面的输出一样：

> NuGet Version: 5.0.2.5988  
> MSBuild auto-detection: using msbuild version '15.9.21.664' from 'C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\MSBuild\15.0\Bin'. Use option -MSBuildVersion to force nuget to use a specific version of MSBuild.

实际上我计算机上同时安装了 Visual Studio 2017 和 Visual Studio 2019，我有两个不同版本的 MSBuild：

- 15.9.21.664
    - 在 `C:\Program Files (x86)\Microsoft Visual Studio\2017\Community\MSBuild\15.0\Bin`
- 16.1.76.45076
    - 在 `C:\Program Files (x86)\Microsoft Visual Studio\2019\Professional\MSBuild\Current\Bin`

要让 NuGet 找到正确版本的 MSBuild.exe，我们有三种方法。

## 使用命令行参数解决

实际上前面 `nuget restore` 命令的输出中就已经可以看出来其中一个解决方法了，即使用 `-MSBuildVersion` 来指定 `MSBuild` 的版本号。

虽然命令行输出中推荐使用了 `-MSBuildVersion` 选项来指定 MSBuild 的版本，但是实际上实现同样功能的有两个不同的选项：

- `-MSBuildPath` 自 NuGet 4.0 开始新增的选项，指定 MSBuild 程序的路径。
- `-MSBuildVersion`

当同时指定上面两个选项时，`-MSBuildPath` 选项优先级高于 `-MSBuildVersion` 选项。

于是我们的 `nuget restore` 命令改成这样写：

```powershell
> nuget restore -MSBuildPath "C:\Program Files (x86)\Microsoft Visual Studio\2019\Professional\MSBuild\Current\Bin"
```

输出现在会使用期望的 MSBuild 了：

```powershell
Using Msbuild from 'C:\Program Files (x86)\Microsoft Visual Studio\2019\Professional\MSBuild\Current\Bin'.
```

## 使用项目文件配置



## 修改全局配置文件

---

**参考资料**

- [NuGet CLI restore command - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/reference/cli-reference/cli-ref-restore)
- [How Can I Tell NuGet What MSBuild Executable to Use? - Stack Overflow](https://stackoverflow.com/a/49823570/6233938)
