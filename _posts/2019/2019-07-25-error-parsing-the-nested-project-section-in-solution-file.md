---
title: "nuget.exe 还原解决方案 NuGet 包的时候出现错误：调用的目标发生了异常。Error parsing the nested project section in solution file."
publishDate: 2019-07-25 08:24:41 +0800
date: 2019-07-25 19:35:37 +0800
categories: msbuild visualstudio dotnet
position: problem
---

我这里使用 Visual Studio 2019 能好好编译的一个项目，发现在另一个小伙伴那里却编译不通过，是在 NuGet 还原那里报告了错误：

> 调用的目标发生了异常。Error parsing the nested project section in solution file.

本文介绍如何解决这样的问题。

---

## 原因

此问题的原因可能有多种：

1. 解决方案里面 `Project` 和 `EndProject` 不成对，导致某个项目没有被识别出来
1. 解决方案中 Global 部分的项目 Id 没有在 `Project` 部分发现对应的项目
1. 解决方案里面出现了当前 MSBuild 版本不认识的项目类型

## 解决方法

### `Project` 和 `EndProject` 不成对

`Project` 和 `EndProject` 不成对通常是合并分支时，自动解冲突解错了导致的，例如像下面这样：

```
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Walterlv.Demo", "Walterlv.Demo\Walterlv.Demo.csproj", "{DC0B1D44-5DF4-4590-BBFE-072183677A78}"
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Walterlv.Demo2", "Walterlv.Demo2\Walterlv.Demo2.csproj", "{98FF9756-B95A-4FDB-9858-5106F486FBF3}"
EndProject
```

而解决方法，就是补全缺失的 `EndProject` 行：

```diff
    Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Walterlv.Demo", "Walterlv.Demo\Walterlv.Demo.csproj", "{DC0B1D44-5DF4-4590-BBFE-072183677A78}"
++  EndProject
    Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Walterlv.Demo2", "Walterlv.Demo2\Walterlv.Demo2.csproj", "{98FF9756-B95A-4FDB-9858-5106F486FBF3}"
    EndProject
```

### Global 部分的项目 Id 没有在 `Project` 部分发现对应的项目

这是说，如果在 `Global` 部分通过项目 Id 引用了一些项目，但是这些项目没有在前面 `Project` 部分定义。例如下面的 sln 片段：

```diff
    Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Walterlv.Demo2", "Walterlv.Demo2\Walterlv.Demo2.csproj", "{98FF9756-B95A-4FDB-9858-5106F486FBF3}"
    EndProject
    Global
    	GlobalSection(SolutionConfigurationPlatforms) = preSolution
    		Debug|Any CPU = Debug|Any CPU
    		Release|Any CPU = Release|Any CPU
    	EndGlobalSection
    	GlobalSection(ProjectConfigurationPlatforms) = postSolution
    		{98FF9756-B95A-4FDB-9858-5106F486FBF3}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
    		{98FF9756-B95A-4FDB-9858-5106F486FBF3}.Debug|Any CPU.Build.0 = Debug|Any CPU
    		{98FF9756-B95A-4FDB-9858-5106F486FBF3}.Release|Any CPU.ActiveCfg = Release|Any CPU
    		{98FF9756-B95A-4FDB-9858-5106F486FBF3}.Release|Any CPU.Build.0 = Release|Any CPU
    	EndGlobalSection
    	GlobalSection(SolutionProperties) = preSolution
    		HideSolutionNode = FALSE
    	EndGlobalSection
    	GlobalSection(NestedProjects) = preSolution
--  		{DC0B1D44-5DF4-4590-BBFE-072183677A78} = {20B61509-640C-492B-8B33-FB472CCF1391}
    		{98FF9756-B95A-4FDB-9858-5106F486FBF3} = {20B61509-640C-492B-8B33-FB472CCF1391}
    	EndGlobalSection
    	GlobalSection(ExtensibilityGlobals) = postSolution
    		SolutionGuid = {F2F1AD1B-207B-4731-ABEB-92882F89B155}
    	EndGlobalSection
    EndGlobal
```

上面红框标注的项目 Id `{DC0B1D44-5DF4-4590-BBFE-072183677A78}` 在前面的 `Project` 部分是没有定义的，于是出现问题。这通常也是合并冲突所致。

解决方法是删掉这个多于的配置，或者在前面加回误删的 `Project` 节点，如：

```
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Walterlv.Demo", "Walterlv.Demo\Walterlv.Demo.csproj", "{DC0B1D44-5DF4-4590-BBFE-072183677A78}"
EndProject
```

### 出现了当前 MSBuild 版本不认识的项目类型

可能是 nuget 识别出来的 MSBuild 版本过旧，也可能是没有安装对应的工作负载。

检查你的项目是否安装了需要的工作负载，比如做 Visual Studio 插件开发需要插件工作负载。可以阅读：

- [如何安装和准备 Visual Studio 扩展/插件开发环境 - walterlv](/post/how-to-prepare-visual-studio-extension-development-environment)

我在另外的博客中写了解决方案中项目类型的内容：

- [理解 Visual Studio 解决方案文件格式（.sln） - walterlv](/post/understand-the-sln-file)
- [解决方案文件 sln 中的项目类型 GUID - walterlv](/post/a-list-of-project-type-guids)

而如果是 nuget 自动识别出来的 MSBuild 版本过旧，则你会同时看到下面的这段提示：

> NuGet Version: 5.1.0.6013
> 
> MSBuild auto-detection: using msbuild version '15.9.21.664' from 'C:\Program Files (x86)\Microsoft Visual Studio\2017\Enterprise\MSBuild\15.0\Bin'. Use option -MSBuildVersion to force nuget to use a specific version of MSBuild.
> 
> Error parsing solution file at C:\walterlv\Walterlv.Demo\Walterlv.Demo.sln: 调用的目标发生了异常。  Error parsing the nested project section in solution file.  

于是解决方法是使 NuGet 能够找到正确的 MSBuild.exe 的版本。

我在另一篇博客中有写一些决定 MSBuild.exe 版本的方法：

- [为 NuGet 指定检测的 MSBuild 路径或版本，解决 MSBuild auto-detection: using msbuild version 自动查找路径不合适的问题 - walterlv](/post/specify-msbuild-version-for-nuget-command-line)

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
