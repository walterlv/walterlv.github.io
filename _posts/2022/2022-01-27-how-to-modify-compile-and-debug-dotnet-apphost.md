---
title: "如何编译、修改和调试 dotnet runtime 仓库中的 apphost nethost comhost ijwhost"
date: 2022-01-27 17:06:47 +0800
categories: dotnet
position: problem
---

.NET 以 MIT 协议开源，于是任何人都可以尝试对其进行一丢丢的修改以实现一些原本很难实现的功能，例如[在多个可执行程序（exe）之间共享同一个私有部署的 .NET 运行时](http://blog.walterlv.com/post/share-self-deployed-dotnet-runtime-among-multiple-exes)。在这个例子中，我们修改了 AppHost 添加了一个可以定制 .NET 运行时路径的功能，这就需要我们能编译、修改和调试 dotnet/runtime 仓库里的 apphost 部分。

本文将以 dotnetCampus.AppHost 库的原理为例，介绍 dotnet/runtime 仓库里 corehost 部分的编译、修改和调试。

---

<div id="toc"></div>

## 仓库和代码

首先记得先把仓库拉下来：

- [dotnet/runtime: .NET is a cross-platform runtime for cloud, mobile, desktop, and IoT apps.](https://github.com/dotnet/runtime)

如果有产品化需求，记得切到对应的 Tag（例如 v6.0.1 等）。

CoreHost 相关的代码在 src\native\corehost 文件夹中。文件夹中的代码是以 CMakeList 方式管理的零散 C++ 文件（和头文件），可以使用 [CMake](https://cmake.org/download/) 里的 cmake-gui 工具来打开、管理和编译。不过我依然更喜欢使用 Visual Studio 来打开和编辑这些文件。Visual Studio 支持 CMake 工作区，详见 [CMake projects in Visual Studio](https://docs.microsoft.com/en-us/cpp/build/cmake-projects-in-visual-studio)。不过这些 CMakeList.txt 并没有针对 Visual Studio 做较好的适配，所以实际上个人认为最好的视图方式是 Visual Studio 的文件夹视图，或者 Visual Studio Code。

## 编译

差量编译整个 dotnet/runtime 仓库大约需要 15 分钟，但是前 2 分钟就可以完成 CoreHost 部分的编译。也就是说，你可以直接考虑按照我在[另一篇文章](http://blog.walterlv.com/post/how-to-compile-dotnet-runtime)里描述的那样直接编整个 dotnet/runtime；如果不想等太久，大可在输出路径里等着，生成了就可以 Ctrl+C 取消后续编译。

所以，大可以考虑直接用如下方法编译：

- [修改 .NET 运行时、框架和库，从编译 dotnet runtime 仓库开始 - walterlv](http://blog.walterlv.com/post/how-to-compile-dotnet-runtime)

```powershell
# 例如：
.\build.cmd -a x64 -c Release
```

编译好的 CoreHost 相关文件可以在这个文件夹里找到：

- x64: `.\artifacts\bin\win-x64.Release\corehost`
- x86: `.\artifacts\bin\win-x86.Release\corehost`
- arm: `.\artifacts\bin\win-arm.Release\corehost`
- arm64: `.\artifacts\bin\win-arm64.Release\corehost`

## 修改

在 [dotnet-campus/dotnetCampus.AppHost](https://github.com/dotnet-campus/dotnetCampus.AppHost) 项目中，我们试图让一个本来不支持在编译时定制的“.NET 运行时路径”变成可以在编译时定制。关于这个库的功能和用法可以参考：

- [在多个可执行程序（exe）之间共享同一个私有部署的 .NET 运行时 - walterlv](http://blog.walterlv.com/post/share-self-deployed-dotnet-runtime-among-multiple-exes)

所以，到底如何才能支持多个可执行程序共享同一个私有部署的 .NET 运行时呢？这部分内容较多，会打断大家的全局思路，所以我单独将其写到了另一篇：

- [谈 dotnetCampus.AppHost 的工作原理 - walterlv](http://blog.walterlv.com/post/how-does-the-dotnet-campus-apphost-work)

## 调试

在阅读了 [谈 dotnetCampus.AppHost 的工作原理 - walterlv](http://blog.walterlv.com/post/how-does-the-dotnet-campus-apphost-work) 之后，你可以了解到我实现编译时设置 .NET 运行时路径的原理是在编译目标 exe 时替换了一个“占位符”。那么，我们需要把目标 exe 编出来才能调试真实场景下的 AppHost 工作过程。

1. 首先设置环境变量 `set COREHOST_TRACE=1` 以开启 AppHost 的日志追踪。
2. 其次设置环境变量 `set COREHOST_TRACEFILE=host.txt` 在目标 exe 运行时将追踪的日志存放到工作目录的 host.txt 文件中。
3. 运行目标 exe，到你差不多希望执行到的地方后，查看 host.txt 文件的内容。（注意，此文件的写入方式是追加，所以多次运行 exe 时并不会覆盖之前调试所产生的日志，要记得删除文件哦！）

这里的日志还是非常详细的，基本上 AppHost 执行过程中的每一个分支都能检查到。例如，我截取一下使用 dotnetCampus.AppHost 库编译出来的某示例 exe 的日志文件的前几行：

```plaintext

```

所以，在你修改 CoreHost 的代码时，记得加上充足的追踪日志，以方便后续的调试。

---

**参考资料**

- [CMake projects in Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/cpp/build/cmake-projects-in-visual-studio)
