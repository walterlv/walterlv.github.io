---
title: "nuget.exe 还原解决方案 NuGet 包的时候出现错误：调用的目标发生了异常。Error parsing the nested project section in solution file."
publishDate: 2019-07-25 08:24:41 +0800
date: 2019-07-25 18:55:25 +0800
categories: msbuild visualstudio dotnet
position: problem
---

我这里使用 Visual Studio 2019 能好好编译的一个项目，发现在另一个小伙伴那里却编译不通过，是在 NuGet 还原那里报告了错误：

> 调用的目标发生了异常。Error parsing the nested project section in solution file.

本文介绍如何解决这样的问题。

---

出现此问题，是因为解决方案里面出现了当前 MSBuild 版本不认识的项目类型。

我在另外的博客中写了解决方案中项目类型的内容：

- [理解 Visual Studio 解决方案文件格式（.sln） - walterlv](/post/understand-the-sln-file.html)
- [解决方案文件 sln 中的项目类型 GUID - walterlv](/post/a-list-of-project-type-guids.html)

如果单单只是 MSBuild 编译，那么出现不认识的项目类型还可以忽略，但这是 nuget 包进行还原的过程，这会导致包还原失败，出现错误：

> NuGet Version: 5.1.0.6013
> 
> MSBuild auto-detection: using msbuild version '15.9.21.664' from 'C:\Program Files (x86)\Microsoft Visual Studio\2017\Enterprise\MSBuild\15.0\Bin'. Use option -MSBuildVersion to force nuget to use a specific version of MSBuild.
> 
> Error parsing solution file at C:\walterlv\Walterlv.Demo\Walterlv.Demo.sln: 调用的目标发生了异常。  Error parsing the nested project section in solution file.  

于是解决方法是使 NuGet 能够找到正确的 MSBuild.exe 的版本。

我在另一篇博客中有写一些决定 MSBuild.exe 版本的方法：

- [为 NuGet 指定检测的 MSBuild 路径或版本，解决 MSBuild auto-detection: using msbuild version 自动查找路径不合适的问题 - walterlv](/post/specify-msbuild-version-for-nuget-command-line.html)

可以通过设置环境变量的方式来解决自动查找版本错误的问题。

你可以看到本文后面附带了很多的参考资料，但实际上这里的所有资料都没有帮助我解决掉任何问题。这个问题的本质是 nuget 识别到了旧版本的 MSBuild.exe。

---

**参考资料**

- [Nested project issues · Issue #7040 · dotnet/corefx](https://github.com/dotnet/corefx/issues/7040)
- [Fixed nested project issues in msbuild by svick · Pull Request #7041 · dotnet/corefx](https://github.com/dotnet/corefx/pull/7041/files)
- [MSBuild: Command Line Build error: Solution file error MSB5023: Error parsing the nested project section - Stack Overflow](https://stackoverflow.com/q/36777583/6233938)
- [MSBuild detecting wrong version of Visual Studio](https://social.msdn.microsoft.com/Forums/windows/en-US/30bcd671-58f6-4613-baa0-1ebdb55bd3f3/msbuild-detecting-wrong-version-of-visual-studio?forum=msbuild)
- [VS2017 MSBuild autodetection takes MSBuild/v14 instead of v15 for WPF project - Stack Overflow](https://stackoverflow.com/q/49997388/6233938)
- [How Can I Tell NuGet What MSBuild Executable to Use? - Stack Overflow](https://stackoverflow.com/q/49822757/6233938)
- [NuGet CLI restore command - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/reference/cli-reference/cli-ref-restore)
