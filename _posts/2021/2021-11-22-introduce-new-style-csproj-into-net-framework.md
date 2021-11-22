---
title: "删删删！快速将旧版 .NET Framework 的 WPF 项目格式(csproj) 迁移成新版 SDK 风格的项目格式"
publishDate: 2018-01-16 00:04:28 +0800
date: 2021-11-22 16:39:38 +0800
categories: visualstudio msbuild
position: starter
---

现在再使用 Visual Studio 创建新的 WPF 项目时，将默认引诱你使用 .NET 6（或者 5、.NET Core 3.1）框架和配套的新的 SDK 风格的项目文件（csproj）。

新项目格式的人类可读性比旧项目要高出不少，而且新的 Visual Studio 也为它增加了非常多好用的显示效果和功能。但如果你手头有一个旧的 WPF 项目，要怎么才能使用到新项目格式带来的各种好处呢？本问将带你快速完成迁移，一路删删删。

---

实际上，本文最早发布的时候 WPF on .NET Core 还没有发布，所以步骤会非常繁琐而且改完还有很多的 bug 要修。后来 WPF 和 Visual Studio 经过不断完善，现在再做迁移已经十分简单了。而本文将直接基于 Visual Studio 2022 来讲述（也适用于 VS2019），已经比当初修改要简单上太多了！

<p id="toc"></p>

## 准备工作

为了方便讲述操作，我这里先着手准备一份旧格式的 WPF 项目。在创建项目时选“WPF 应用(.NET Framework)”就会使用旧的格式。下面我给两张新旧功能和 csproj 文件内容的比较，让你直观感受到升级项目到 SDK 风格后的好处。

![(旧项目支持) 左 | 右 (新项目支持)](/static/posts/2021-11-22-16-31-29.png)  
▲ (旧项目支持) 左 | 右 (新项目支持)

![(旧项目格式) 左 | 右 (新项目格式)](/static/posts/2021-11-22-16-32-21.png)  
▲ (旧项目格式) 左 | 右 (新项目格式)

可以很明显发现，新格式文件内容很简单易读，而且 Visual Studio 也针对新格式给出分类的引用。当然，新格式还有更多好处，比如多框架，比如开可空引用类型等。

## 开始迁移

### 第一步：写个基本框架

右键项目，选“卸载项目”；再右键项目，选“编辑项目文件”。请复制以下整块代码，然后粘贴替换掉你原来项目文件里的所有内容：

```xml
<Project Sdk="Microsoft.NET.Sdk.WindowsDesktop">
  <PropertyGroup>
    <TargetFramework>net48</TargetFramework>
    <UseWPF>true</UseWPF>
  </PropertyGroup>
</Project>
```

额外的，根据你项目的实际情况稍作调整：

* 如果期望其他的 .NET Framework 版本，则把 `net48` 改为其他版本（如 `net45`、`net462` 等）
* 如果期望同时拥有 .NET 6 和 .NET Framework 版本，则把 `TargetFramework` 变复数，然后在里面加多个框架（如 `<TargetFrameworks>net6.0-windows;net48</TargetFrameworks>`）

改完之后，右键项目，选“重新加载项目”。

### 第二步：删除不再需要的文件

如果你不知道或不记得曾改过以下这几个文件，那么就应该全删掉。*（这些文件是自动生成的，换言之，如果你明确知道这几个文件你正在用，那么就不要删。）*

* `Properties\Resources.resx`
* `Properties\Resources.Designer.resx`
* `Properties\Settings.resx`
* `Properties\Settings.Designer.resx`
* `App.config`
* `packages.config`

![要删除的文件](/static/posts/2021-11-22-16-19-23.png)

打开 AssemblyInfo.cs，删掉除 `ThemeInfo` 以外的全部内容。*（这些内容是自动生成的，换言之，如果你自己往里面新增了内容，也应保留。）*删完后，应是下面这样：

```csharp
using System.Windows;

[assembly: ThemeInfo(
    ResourceDictionaryLocation.None, //主题特定资源词典所处位置
                                     //(未在页面中找到资源时使用，
                                     //或应用程序资源字典中找到时使用)
    ResourceDictionaryLocation.SourceAssembly //常规资源词典所处位置
                                              //(未在页面中找到资源时使用，
                                              //、应用程序或任何主题专用资源字典中找到时使用)
)]
```

### 第三步：加回以前的引用，改回以前的属性

如果你以前装过一些 NuGet 包，那么重新装一下；如果你以前引用过一些项目，那么重新引用一下。

![重新引用项目](/static/posts/2021-11-22-16-38-21.png)

如果以前设置了一些特殊属性，那么也右键项目，选“属性”，在新的属性面板里面一条条对着改就好：

* 输出类型（类库，还是应用程序）
* 平台目标（Any CPU，还是 x86）
* 其他

![重新修改属性](/static/posts/2021-11-22-16-37-26.png)

---

**参考资料**

*因为本文最早发布的时候 WPF on .NET Core 还没有发布，所以这么简单的内容也参考了如下非常多的资料：*

- [XAML files are not supported · Issue #810 · dotnet/sdk](https://github.com/dotnet/sdk/issues/810)
- [XAML files are not supported · Issue #1467 · dotnet/project-system](https://github.com/dotnet/project-system/issues/1467)
- [Old csproj to new csproj: Visual Studio 2017 upgrade guide](http://www.natemcmaster.com/blog/2017/03/09/vs2015-to-vs2017-upgrade/)
- [Using the new .Csproj without .Net core · Issue #1688 · Microsoft/msbuild](https://github.com/Microsoft/msbuild/issues/1688)
- [c# - WPF App Using new csproj format - Stack Overflow](https://stackoverflow.com/q/44140673/6233938)
- [XAML files are not supported · Issue #1467 · dotnet/project-system](https://github.com/dotnet/project-system/issues/1467)
- [XAML files are not supported · Issue #810 · dotnet/sdk](https://github.com/dotnet/sdk/issues/810)
- [c# - How-to migrate Wpf projects to the new VS2017 format - Stack Overflow](https://stackoverflow.com/a/50550063/6233938)
- [project.json doesn't have a runtimes section, add '“runtimes”: { “win”: { } }' to project.json · Issue #5931 · Microsoft/vsts-tasks](https://github.com/Microsoft/vsts-tasks/issues/5931)
- [Ignore PROJECT.JSON when using .CSPROJ · Issue #394 · Microsoft/msbuild](https://github.com/Microsoft/msbuild/issues/394)
- [dotnet build fails when referencing a project converted to PackageReference · Issue #6294 · dotnet/cli](https://github.com/dotnet/cli/issues/6294)
- [Visual studio project.json does not have a runtime section - Stack Overflow](https://stackoverflow.com/q/45614394/6233938)
