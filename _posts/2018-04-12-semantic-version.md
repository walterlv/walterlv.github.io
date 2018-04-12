---
title: "语义版本号（Semantic Versioning）"
date: 2018-04-12 20:20:39 +0800
categories: visualstudio nuget csharp dotnet
---

版本号格式不陌生吧，.NET 传统的版本号格式类似这样 1.5.1254.0。本文将推荐一种新的版本号格式——语义版本号，格式类似这样 1.4.6-beta。我推荐语义版本号是因为这样的版本号自包含语义，而且这样的语义能够在版本库中体现出来。

---

<div id="toc"></div>

### 传统的版本号

如果你只是知道传统版本号由四个部分组成，那么建议去官方文档 [Assembly Versioning](https://docs.microsoft.com/en-us/dotnet/framework/app-domains/assembly-versioning) 了解一下这种版本号的定义。它分为 `主版本号`.`次版本号`.`构建号`.`修订号` 四个部分，但是后面的一个或多个部分可以省略。

![AssemblyVersion](/static/posts/2018-04-12-19-48-26.png)

例如，1.5.1254.0 表示主版本号是 1，次版本号是 5；在 1.5 的版本下，第 1255 次构建，并且在这次构建之后没有进行修订。如果你是一个库的发布者，那么主版本号的改变意味着 API 出现不兼容的修改；次版本号改变意味着 API 出现兼容的修改（通常是新增）。

![new Version()](/static/posts/2018-04-12-19-48-01.png)

然而我们如何能够准确地向所有人传递这样的版本规则呢？当我们在向全世界提供一个库（比如 NuGet 包）的时候，我们怎么让团队所有人都知道我们正在为哪个版本开发新功能呢？我们又应该在何时更新程序集或者 NuGet 的版本号呢（在功能开发开始？差不多完成？临近发布？）？

传统的版本号记录不了这些信息，于是我们不得不用一些额外的方式来记录，这就增加了维护成本。

### 语义版本号

语义版本号由五个部分组成 `主版本号`、`次版本号`、`补丁号`、`预发布版本标签` 和 `构建号`。举例看看语义版本号是什么样的吧（摘自 [NuGet Package Version Reference](https://docs.microsoft.com/en-us/nuget/reference/package-versioning)）：

- 1.0.1
- 1.0.1-rc
- 1.0.1-beta
- 1.0.1-alpha2
- 1.0.1-alpha
- 1.0.1-aaa

NuGet 4.3.0 以上，并且 Visual Studio 2017 的 15.3 以上版本开始支持语义版本号 2.0（Semantic Versioning 2.0.0）。

- 1.0.0-alpha.1
    - 2.0 版本的语义版本号在预发布标签后面使用 `.` 来区分预发布的不同版本，这样就能避免 `alpha2` 在字符串比较上大于 `alpha10` 的问题。（否则得写成 `alpha02` 了。）
- 1.0.0+`githash`
    - 2.0 版本的语义版本号在最后使用 `+` 来表示 git 版本库相关的信息，这样为持续集成（CI）时自动生成版本号提供了方便。
- 1.0.0-beta.5+4
    - 表示这是准备发布 1.0.0 的第 5/6 个 beta 版本之后，又新增了 4 个 git 提交。（是不是意义更加明确？）

### 如何在项目中使用语义版本号？

如果你希望方便，在执行 `dotnet build` 或 `dotnet pack` 命令之后能够直接得到使用语义版本号的 NuGet 包，那么你必须拥有一个新格式的 csproj，就是 .NET Core 带来的那种新格式。如果你的格式是旧的，可以阅读我的另一篇文章 [将 WPF、UWP 以及其他各种类型的旧样式的 csproj 文件迁移成新样式的 csproj 文件](/post/introduce-new-style-csproj-into-net-framework.html) 迁移成新格式。

这样，在 csproj 文件中将版本号写为以下方式即可：

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <Version>1.6.2-beta</Version>
    <!-- <PackageId>Walterlv.DemoPackage</PackageId> -->
    <!-- <TargetFrameworks>netstandard2.0;net471</TargetFrameworks> -->
  </PropertyGroup>
</Project>
```

你还可以考虑在编译的时候进行改变，即执行编译命令的时候传入版本号：

```powershell
# 以下三种都行
> dotnet build /p:Version=1.6.2-beta
> dotnet msbuild /p:Version=1.6.2-beta
> msbuild /p:Version=1.6.2-beta
```

当然，你还可以使用响应文件来简化参数，详情可阅读我的另一篇博客 [使用 MSBuild 响应文件 (rsp) 来指定 dotnet build 命令行编译时的大量参数](/post/msbuild-response-files.html)。

如果希望自动化地在项目中生成语义版本号，可阅读我的另一篇博客 [使用 GitVersion 在编译或持续构建时自动使用语义版本号（Semantic Versioning）](/post/automatically-semantic-versioning-using-git-version-task.html)。

---

#### 参考资料

- [Semantic Versioning 2.0.0 - Semantic Versioning](https://semver.org/)
- [Semantic Versioning & auto-incremented NuGet package versions - Xavier Decoster](https://www.xavierdecoster.com/post/2013/04/29/semantic-versioning-auto-incremented-nuget-package-versions.html)
- [NuGet Package Version Reference - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/reference/package-versioning)
- [Pre-release versions in NuGet packages - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/create-packages/prerelease-packages)
- [Versioning NuGet packages in a continuous delivery world: part 1 – Microsoft DevOps Blog](https://blogs.msdn.microsoft.com/devops/2016/05/03/versioning-nuget-packages-cd-1/)
- [Versioning NuGet packages in a continuous delivery world: part 3 – Microsoft DevOps Blog](https://blogs.msdn.microsoft.com/devops/2016/05/26/versioning-nuget-packages-cd-3/)
- [Supporting Semantic Versioning 2.0.0](https://blog.nuget.org/20140924/supporting-semver-2.0.0.html)
