---
title: "项目文件中的已知 NuGet 属性（知道了这些，创建 NuGet 包就可以不需要 nuspec 文件啦）"
date: 2018-05-10 13:35:13 +0800
categories: visualstudio nuget csharp dotnet
published: false
---

知道了 csproj 文件中的一些常用 NuGet 属性，创建 NuGet 包时就可以充分发挥新 Sdk 自动生成 NuGet 包的优势，不需要 nuspec 文件啦。（毕竟 nuspec 文件没有 .csproj 和 .targets 文件强大而又有扩展性。）

---

“项目文件中的已知属性系列”分为两个部分：

- [项目文件中的已知属性（知道了这些，就不会随便在 csproj 中写死常量啦） - 吕毅](/post/known-properties-in-csproj.html)
- 本文：[项目文件中的已知 NuGet 属性（知道了这些，创建 NuGet 包就可以不需要 nuspec 文件啦） - 吕毅](/post/known-nuget-properties-in-csproj.html)

NuGet 相关的属性也分为全局属性和项属性两类。不过，我更愿意分成三类来说明：

<div id="toc"></div>

### nuspec 属性

当然，这部分的属性也是在 csproj 中使用的，只不过与生成的 NuGet 包关联。

使用方法像这样：

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <PackageId>Walterlv.Demo</PackageId>
    <PackageVersion>3.2.0-beta</PackageVersion>
    <TargetFramework>net46</TargetFramework>
  </PropertyGroup>
</Project>
```

不过我们通常没有这么直接去设置，因为大多数属性都是有默认值的，如果不设置，将自动使用默认值。

- `$(PackageId)`: NuGet 包的唯一 Id，对应 NuGet 的 Id 属性。这个 Id 需要在整个服务器（例如 nuget.org）上唯一，如果没设置，则使用 `$(AssemblyName)`；例如 `Newtonsoft.Json`。
- `$(PackageVersion)`: NuGet 包的包版本，可以使用语义版本号（参见[语义版本号（Semantic Versioning） - 吕毅](/post/semantic-version.html)），如果没设置，则使用 `$(Version)`；例如 `3.2.0-beta`。
- `$(PackageVersionPrefix)`: 包版本前缀，默认为空。
- `$(PackageVersionSuffix)`: 包版本后缀，默认为空。
- `$(Authors)`: 包的作者；建议指定成在 nuget.org 上的用户名，这样访客可以点击包作者查看到包作者的信息；多个名字用分号分隔。
- `$(Title)`: 包的显示名称，如果没设置，则使用 `$(PackageId)`。
- `$(PackageDescription)`: 包的描述文字，如果填写了，则用户在浏览包的时候可以看到。
- `$(Copyright)`: 包的版权声明
- `$(PackageRequireLicenseAcceptance)`: 是个布尔值，如果为 true，则在安装包之前要求同意协议。
- `$(PackageLicenseUrl)`: 此 NuGet 包协议所在的 url。
- `$(PackageProjectUrl)`: 此 NuGet 包的项目 url。
- `$(PackageIconUrl)`: 此 NuGet 包的图标 url，无论是 nuget.org 还是 Visual Studio 都将从这个 url 下载包的图标。
- `$(PackageTags)`: 标签，用分号分隔；指定多个标签有助于用户在 nuget.org 上搜索到你的 NuGet 包。
- `$(PackageReleaseNotes)`: 这个版本的 Release 记录。
- `$(RepositoryUrl)`: 仓库 url，例如 <https://github.com/dotnet-campus/MSTestEnhancer.git>
- `$(RepositoryType)`: 仓库类型，例如 git、tfs。
- `$(RepositoryBranch)`: **NuGet 4.7 才开始的新属性！**此包对应的仓库分支，例如 `master`。
- `$(RepositoryCommit)`: **NuGet 4.7 才开始的新属性！**此包对应的提交号，例如 `2d3ef96ee704d7896eeb2d88fbc987b2004ff786`。
- `$(PackageType)`: *我还没有理解到此属性的作用。*

以上有些信息在每次 NuGet 发布之前都是要改的，例如：`$(PackageVersion)`、`$(PackageReleaseNotes)`、`$(RepositoryCommit)`。所以很明显——**这不是用来给开发者设置的属性，是用于辅助我们生成打包工具的。**

### 配置属性

- `$(IsPackable)`: 
- `$(Description)`: 
- `$(DevelopmentDependency)`: 
- `$(PackageOutputPath)`: 
- `$(IncludeSymbols)`: 
- `$(IncludeSource)`: 
- `$(PackageTypes)`: 
- `$(IsTool)`: 
- `$(RepositoryUrl)`: 
- `$(RepositoryType)`: 
- `$(NoPackageAnalysis)`: 
- `$(MinClientVersion)`: 
- `$(IncludeBuildOutput)`: 
- `$(IncludeContentInPack)`: 
- `$(BuildOutputTargetFolder)`: 
- `$(ContentTargetFolders)`: 
- `$(NuspecFile)`: 
- `$(NuspecBasePath)`: 
- `$(NuspecProperties)`: 

### 项属性

---

#### 参考资料

- [NuGet pack and restore as MSBuild targets - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/reference/msbuild-targets)
