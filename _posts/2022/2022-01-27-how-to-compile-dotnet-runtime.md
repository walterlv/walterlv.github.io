---
title: "修改 .NET 运行时、框架和库，从编译 dotnet runtime 仓库开始"
publishDate: 2022-01-27 15:39:14 +0800
date: 2022-01-27 15:43:53 +0800
categories: dotnet
position: starter
coverImage: /static/posts/2022-01-27-15-33-26.png
---

.NET 以 MIT 协议开源，于是任何人都可以尝试对其进行一丢丢的修改以实现一些原本很难实现的功能，例如[在多个可执行程序（exe）之间共享同一个私有部署的 .NET 运行时](http://blog.walterlv.com/post/share-self-deployed-dotnet-runtime-among-multiple-exes)。然而，对其的修改得能够编译生成期望的文件才行。本文介绍一下如何编译 dotnet/runtime 仓库，日常使用非常简单，所以如果只是轻微修改的话，本文大概就够了。

---

首先记得先把仓库拉下来：

- [dotnet/runtime: .NET is a cross-platform runtime for cloud, mobile, desktop, and IoT apps.](https://github.com/dotnet/runtime)

如果有产品化需求，记得切到对应的 Tag（例如 v6.0.1 等）。

<div id="toc"></div>

## 编译命令

在 Windows 系统上，编译入口在 build.cmd 文件中。如果想简单调试用，那么直接双击或在终端中执行一下它就够了。

不过，以下命令可能更常用些：

```powershell
# 编译 win-x64 Release 版本（实际系统为你编译所用的系统）
.\build.cmd -a x64 -c Release
```

```powershell
# 编译 win-x86 Release 版本（实际系统为你编译所用的系统）
.\build.cmd -a x86 -c Release
```

![在 PowerShell 中编译 dotnet runtime](/static/posts/2022-01-27-15-33-26.png)

首次编译会慢一些，需要拉一些包以及下载一些工具，如果有些工具一直无法下载的话，可能需要考虑一下魔法上网。如果没有改动代码的话，不需要做其他额外设置即可完成编译。在首次编译完成后，后续差量编译大约 15 分钟能完成。

等全部编译完成后，你可以在 `artifacts` 路径中找到所有输出的文件，按需取用即可。

## 更详细的命令

在仓库的 eng\build.ps1 文件里，有一个 `Get-Help` 函数，可以输出帮助信息。

你也可以直接通过此命令得到完全的帮助信息输出：

```powershell
.\build.cmd -h
```

帮助信息输出如下：

```powershell
Common settings:
  -arch (-a)                     Target platform: x86, x64, arm, arm64, or wasm.
                                 Pass a comma-separated list to build for multiple architectures.
                                 [Default: Your machine's architecture.]
  -binaryLog (-bl)               Output binary log.
  -configuration (-c)            Build configuration: Debug, Release or Checked.
                                 Checked is exclusive to the CLR subset. It is the same as Debug, except code is
                                 compiled with optimizations enabled.
                                 Pass a comma-separated list to build for multiple configurations.
                                 [Default: Debug]
  -help (-h)                     Print help and exit.
  -librariesConfiguration (-lc)  Libraries build configuration: Debug or Release.
                                 [Default: Debug]
  -os                            Target operating system: windows, Linux, OSX, Android or Browser.
                                 [Default: Your machine's OS.]
  -runtimeConfiguration (-rc)    Runtime build configuration: Debug, Release or Checked.
                                 Checked is exclusive to the CLR runtime. It is the same as Debug, except code is
                                 compiled with optimizations enabled.
                                 [Default: Debug]
  -runtimeFlavor (-rf)           Runtime flavor: CoreCLR or Mono.
                                 [Default: CoreCLR]
  -subset (-s)                   Build a subset, print available subsets with -subset help.
                                 '-subset' can be omitted if the subset is given as the first argument.
                                 [Default: Builds the entire repo.]
  -verbosity (-v)                MSBuild verbosity: q[uiet], m[inimal], n[ormal], d[etailed], and diag[nostic].
                                 [Default: Minimal]
  -vs                            Open the solution with Visual Studio using the locally acquired SDK.
                                 Path or any project or solution name is accepted.
                                 (Example: -vs Microsoft.CSharp or -vs CoreCLR.sln)

Actions (defaults to -restore -build):
  -build (-b)             Build all source projects.
                          This assumes -restore has been run already.
  -clean                  Clean the solution.
  -pack                   Package build outputs into NuGet packages.
  -publish                Publish artifacts (e.g. symbols).
                          This assumes -build has been run already.
  -rebuild                Rebuild all source projects.
  -restore                Restore dependencies.
  -sign                   Sign build outputs.
  -test (-t)              Incrementally builds and runs tests.
                          Use in conjuction with -testnobuild to only run tests.

Libraries settings:
  -allconfigurations      Build packages for all build configurations.
  -coverage               Collect code coverage when testing.
  -framework (-f)         Build framework: net6.0 or net48.
                          [Default: net6.0]
  -testnobuild            Skip building tests when invoking -test.
  -testscope              Scope tests, allowed values: innerloop, outerloop, all.

Native build settings:
  -cmakeargs              User-settable additional arguments passed to CMake.
  -ninja                  Use Ninja to drive the native build. (default)
  -msbuild                Use MSBuild to drive the native build. This is a no-op for Mono.
  -pgoinstrument          Build the CLR with PGO instrumentation.
Command-line arguments not listed above are passed through to MSBuild.
The above arguments can be shortened as much as to be unambiguous.
(Example: -con for configuration, -t for test, etc.).

Here are some quick examples. These assume you are on a Windows x64 machine:

* Build CoreCLR for Windows x64 on Release configuration:
.\build.cmd clr -c release

* Cross-compile CoreCLR runtime for Windows ARM64 on Release configuration.
.\build.cmd clr.runtime -arch arm64 -c release

* Build Debug libraries with a Release runtime for Windows x64.
.\build.cmd clr+libs -rc release

* Build Release libraries and their tests with a Checked runtime for Windows x64, and run the tests.
.\build.cmd clr+libs+libs.tests -rc checked -lc release -test

* Build Mono runtime for Windows x64 on Release configuration.
.\build.cmd mono -c release

* Build Release coreclr corelib, crossgen corelib and update Debug libraries testhost to run test on an updated corelib.
.\build.cmd clr.corelib+clr.nativecorelib+libs.pretest -rc release

* Build Debug mono corelib and update Release libraries testhost to run test on an updated corelib.
.\build.cmd mono.corelib+libs.pretest -rc debug -c release


For more information, check out https://github.com/dotnet/runtime/blob/main/docs/workflow/README.md
```

