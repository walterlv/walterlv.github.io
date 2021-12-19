---
title: "为 NuGet 指定检测的 MSBuild 路径或版本，解决 MSBuild auto-detection: using msbuild version 自动查找路径不合适的问题"
publishDate: 2019-07-23 18:13:54 +0800
date: 2019-07-25 18:11:47 +0800
tags: nuget msbuild visualstudio dotnet
position: problem
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

## 修改环境变量解决

NuGet 的命令行自动查找 MSBuild.exe 时，是通过环境变量中的 `PATH` 变量来找的。会找到 `PATH` 中第一个包含 `msbuild.exe` 文件的路径，将其作为自动查找到的 MSBuild 的路径。

所以，我们的解决方法是，如果找错了，我们就把期望正确的 MSBuild 所在的路径设置到不期望的 MSBuild 路径的前面。就像下图这样，我们把 2019 版本的 MSBuild 设置到了 2017 版本的前面。

![设置环境变量](/static/posts/2019-07-25-18-07-00.png)

以下是 NuGet 项目中自动查找 MSBuild.exe 文件的方法，源代码来自 <https://github.com/NuGet/NuGet.Client/blob/2b45154b8568d6cbf1469f414938f0e3e88e3704/src/NuGet.Clients/NuGet.CommandLine/MsBuildUtility.cs#L986>。

```csharp
private static string GetMSBuild()
{
    var exeNames = new [] { "msbuild.exe" };

    if (RuntimeEnvironmentHelper.IsMono)
    {
        exeNames = new[] { "msbuild", "xbuild" };
    }

    // Try to find msbuild or xbuild in $Path.
    var pathDirs = Environment.GetEnvironmentVariable("PATH")?.Split(new[] { Path.PathSeparator }, StringSplitOptions.RemoveEmptyEntries);

    if (pathDirs?.Length > 0)
    {
        foreach (var exeName in exeNames)
        {
            var exePath = pathDirs.Select(dir => Path.Combine(dir, exeName)).FirstOrDefault(File.Exists);
            if (exePath != null)
            {
                return exePath;
            }
        }
    }

    return null;
}
```

我故意在桌面上放了一个老旧的 MSBuild.exe，然后将此路径设置到环境变量 `PATH` 的前面，出现了编译错误。

![编译错误](/static/posts/2019-07-25-18-11-09.png)

---

**参考资料**

- [NuGet CLI restore command - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/reference/cli-reference/cli-ref-restore)
- [How Can I Tell NuGet What MSBuild Executable to Use? - Stack Overflow](https://stackoverflow.com/a/49823570/6233938)
- [VS2017 MSBuild autodetection takes MSBuild/v14 instead of v15 for WPF project - Stack Overflow](https://stackoverflow.com/a/50014934/6233938)
