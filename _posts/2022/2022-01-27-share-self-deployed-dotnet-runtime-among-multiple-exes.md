---
title: "在多个可执行程序（exe）之间共享同一个私有部署的 .NET 运行时"
publishDate: 2022-01-27 12:48:23 +0800
date: 2022-01-27 16:52:33 +0800
categories: dotnet
position: problem
---

从 .NET Core 3 开始，.NET 应用就支持独立部署自己的 .NET 运行时。可以不受系统全局安装的 .NET 运行时影响，特别适合国内这种爱优化精简系统的情况……鬼知道哪天就被优化精简了一个什么重要 .NET 运行时组件呢！然而，如果你的项目会生成多个 exe 程序，那么他们每个独立发布时，互相之间的运行时根本不互通。即便编译时使用完全相同的 .NET 框架（例如都设为 net6.0），最终也无法共用运行时文件。

那么，还有没有方法能在多个 exe 之间共享运行时而又不受制于系统安装的版本呢？有！

---

<div id="toc"></div>

## 问题

例如，你要部署的应用程序文件夹结构是这样的（只看 exe 和文件夹，不看其他文件）：

```
- Walterlv.Demo.exe
- Walterlv.Updater.exe
+ 1.2.1
    - Walterlv.SubProcess.exe
```

那么，以上这些 exe 是应该发布成“依赖框架”（Framework Dependent）还是“独立”（Self Contained）呢？

如果是“依赖框架”，那么发布完后，需要目标系统先安装有 .NET 运行时，而这个系统全局的 .NET 运行时会被各个不同的应用影响，谁知道会不会被精简或被魔改呢！如果是“独立”，那么这几个 exe 之间的运行时不会共享，每个都占用了大量的存储空间，用来放一模一样的 .NET 运行时和库文件，而且如果放一起的话还跑不起来——就算后续修复了跑不起来的 bug，上面那个多级文件夹之间共享这些 .NET 运行时文件也是一个令人头疼的事情。

## 官方解决方案

GitHub 上其实也有人在讨论如何共享运行时的问题：

- [Support deploying multiple exes as a single self-contained set · Issue #53834 · dotnet/runtime](https://github.com/dotnet/runtime/issues/53834)
- [How to share self contained runtime? · Issue #52974 · dotnet/runtime](https://github.com/dotnet/runtime/issues/52974)

官方给出了一个解决方案：

- 设置 `DOTNET_ROOT` 环境变量

那么，我们把 runtime 文件夹放到以上根目录，然后设一下 `DOTNET_ROOT` 就可以让这些 .NET 的 exe 脱离系统安装的 .NET 运行了。

等等！是不是有什么问题？

1. 这个 `DOTNET_ROOT` 环境变量怎么设？安装软件的时候安装包去系统里设一下吗？这一设不就跟在系统全局安装一个意思吗？
2. 这个环境变量能设相对路径吗？肯定不行，因为不同文件夹下的 exe 如果希望共享同一个独立部署的运行时，那么相对路径肯定不同。
3. 如果每个 exe 设自己的 `DOTNET_ROOT` 环境变量呢？那谁来设呢？难不成还要专门为每一个 exe 写一个非托管的启动器用来设环境变量吗？真是杀鸡用牛刀啊！

## 我们的解决方案

鉴于官方目前仍没有比较省心的共享独立部署 .NET 运行时的方案，我们就不得不自己操刀来干这件事情。为此，我们开发了一个 dotnetCampus.AppHost 库，其原理是允许你单独修改每个 exe 所查找的 .NET 运行时路径。

### dotnetCampus.AppHost 库

- 你可以在 NuGet 上拿到此库：[dotnetCampus.AppHost](https://www.nuget.org/packages/dotnetCampus.AppHost)。
- 项目在 GitHub 上开源：[dotnet-campus/dotnetCampus.AppHost](https://github.com/dotnet-campus/dotnetCampus.AppHost)

### 使用方法

第一步：在 exe 入口项目上安装 NuGet 包：[dotnetCampus.AppHost](https://www.nuget.org/packages/dotnetCampus.AppHost)。

第二步：修改项目，加入一行设置将来运行时要用的 .NET 运行时路径。

```diff
    <Project Sdk="Microsoft.NET.Sdk">

      <PropertyGroup>
        <OutputType>Exe</OutputType>
        <TargetFramework>net6.0</TargetFramework>
++      <!-- 可以是相对路径，也可以是绝对路径。但既然要私有部署，当然选相对路径更好。这里瞎写一个 runtime\6.0.1 -->
++      <DCAppHostDotnetRoot>runtime\6.0.1</DCAppHostDotnetRoot>
      </PropertyGroup>

      <ItemGroup>
        <PackageReference Include="dotnetCampus.AppHost" Version="1.0.0-alpha04" />
      </ItemGroup>

    </Project>
```

第三步：在编译（dotnet build）完你的项目后，记得把 .NET 运行时的整个文件夹打包到你项目对应的文件夹下。

例如，对于本文一开始举例的项目，就可以指定成自己设的文件夹：

```
+ runtime
    + 6.0.1
        - dotnet.exe
        + host
        + shared
        + swidtag
- Walterlv.Demo.exe
- Walterlv.Updater.exe
+ 1.2.1
    - Walterlv.SubProcess.exe
```

这样，为 Walterlv.Demo 和 Walterlv.Updater 项目设置 `DCAppHostDotnetRoot` 为 `runtime\6.0.1`；为 Walterlv.SubProcess 项目设置 `DCAppHostDotnetRoot` 为 `..\runtime\6.0.1`，他们就可以共用一个私有部署的运行时了。

那，这个 .NET 运行时文件夹哪里来呢？当然是官网下啦：

- <https://dotnet.microsoft.com/en-us/download/dotnet/6.0/runtime>

下载完安装后，可以在以下文件夹提取到：

* C:\Program Files\dotnet
* C:\Program Files(x86)\dotnet

其中，前者适用于编译成 x64 的应用程序（例如设置 `PlatformTarget` 为 `x64` 或设置 `RuntimeIdentifier` 为 `win-x64` 的程序），后者适用于编译成 x86 的应用程序（例如设置 `PlatformTarget` 为 `x86` 或设置 `RuntimeIdentifier` 为 `win-x86` 的程序）。

### 适用

目前，dotnetCampus.AppHost 支持的框架与平台如下，还在继续添加其他框架和平台的支持：

- [x] net6.0
    - [x] win-x64
    - [x] win-x86
    - [ ] win-arm
    - [ ] win-arm64
- [ ] net5.0
    - [ ] win-x64
    - [ ] win-x86
    - [ ] win-arm
    - [ ] win-arm64
- [ ] ~~netcoreapp3.1~~
    - [ ] ~~win-x64~~
    - [ ] ~~win-x86~~
    - [ ] ~~win-arm~~
    - [ ] ~~win-arm64~~
- [ ] ~~netcoreapp3.0~~
    - [ ] ~~win-x64~~
    - [ ] ~~win-x86~~
    - [ ] ~~win-arm~~
    - [ ] ~~win-arm64~~

对于多框架项目，可以放心安装而不需要做框架判断。只有在需要生成 AppHost 的时候才会设置 .NET 运行时，不需要生成时不会报错，需要生成而无法生成时才会报错。

## 原理

挖个坑，稍后填。

---

**参考资料**

- [dotnet core 应用是如何跑起来的 通过AppHost理解运行过程](https://blog.lindexi.com/post/dotnet-core-%E5%BA%94%E7%94%A8%E6%98%AF%E5%A6%82%E4%BD%95%E8%B7%91%E8%B5%B7%E6%9D%A5%E7%9A%84-%E9%80%9A%E8%BF%87AppHost%E7%90%86%E8%A7%A3%E8%BF%90%E8%A1%8C%E8%BF%87%E7%A8%8B.html)
- [dotnet 桌面端基于 AppHost 的配置式自动切换更新后的应用程序路径](https://blog.lindexi.com/post/dotnet-%E6%A1%8C%E9%9D%A2%E7%AB%AF%E5%9F%BA%E4%BA%8E-AppHost-%E7%9A%84%E9%85%8D%E7%BD%AE%E5%BC%8F%E8%87%AA%E5%8A%A8%E5%88%87%E6%8D%A2%E6%9B%B4%E6%96%B0%E5%90%8E%E7%9A%84%E5%BA%94%E7%94%A8%E7%A8%8B%E5%BA%8F%E8%B7%AF%E5%BE%84.html)
- [Support deploying multiple exes as a single self-contained set · Issue #53834 · dotnet/runtime](https://github.com/dotnet/runtime/issues/53834)
- [How to share self contained runtime? · Issue #52974 · dotnet/runtime](https://github.com/dotnet/runtime/issues/52974)
- [DOTNET_ROOT does not work as the doc says. · Issue #64244 · dotnet/runtime](https://github.com/dotnet/runtime/issues/64244)
- [.NET environment variables - .NET CLI - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/core/tools/dotnet-environment-variables#dotnet_root-dotnet_rootx86)
- [Write a custom .NET runtime host - .NET - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/core/tutorials/netcore-hosting)
- [runtime/fxr_resolver.cpp at v6.0.1 · dotnet/runtime](https://github.com/dotnet/runtime/blob/v6.0.1/src/native/corehost/fxr_resolver.cpp#L55)
- [runtime/native-hosting.md at main · dotnet/runtime](https://github.com/dotnet/runtime/blob/main/docs/design/features/native-hosting.md)
- [samples/core/hosting at main · dotnet/samples](https://github.com/dotnet/samples/tree/main/core/hosting)
- [c# - While a self-contained .NetCore app is running, what's the best way to start another .NetCore app sharing the same runtime? - Stack Overflow](https://stackoverflow.com/q/63222315/6233938)
