---
title: "如何使用 MyGet 这个激进的 NuGet 源体验日构建版本的 .NET Standard / .NET Core"
publishDate: 2019-03-04 22:29:23 +0800
date: 2019-03-10 16:57:26 +0800
tags: dotnet csharp visualstudio msbuild nuget
position: starter
coverImage: /static/posts/2019-02-27-11-58-37.png
---

很多库都会在 nuget.org 上发布预览版本，不过一般来说这个预览版本也是大多可用的。然而想要体验日构建版本，这个就没有了，毕竟要照顾绝大多数开发者嘛……

本文介绍如何使用 MyGet 这个激进的 NuGet 源，介绍如何使用框架级别的库的预览版本如 .NET Standard 的预览版本。

---

<div id="toc"></div>

## 加入 MyGet 这个 NuGet 源

添加 NuGet 源的方法在我和林德熙的博客中都有说明：

- [全局或为单独的项目添加自定义的 NuGet 源 - 吕毅](/post/add-custom-nuget-source)
- [VisualStudio 给项目添加特殊的 Nuget 的链接 - 林德熙](https://lindexi.gitee.io/post/VisualStudio-%E7%BB%99%E9%A1%B9%E7%9B%AE%E6%B7%BB%E5%8A%A0%E7%89%B9%E6%AE%8A%E7%9A%84-Nuget-%E7%9A%84%E9%93%BE%E6%8E%A5.html)

简单点，就是在 Visual Studio 中打开 `工具` -> `选项` -> `NuGet 包管理器` -> `包源`：

![管理包源](/static/posts/2019-02-27-11-58-37.png)

然后把 MyGet 的源添加进去：

- <https://dotnet.myget.org/F/dotnet-core/api/v3/index.json>

如果你想添加其他的 NuGet 源，可以参见我的另一篇博客：[我收集的各种公有 NuGet 源 - 吕毅](/post/public-nuget-sources)。

## 使用 .NET Standard 的预览版本

因为我们在使用 .NET Standard 库的时候，是直接作为目标框架来选择的，就像下面的项目文件内容一样：

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
  </PropertyGroup>
  
</Project>
```

然而，如果你直接把 `TargetFramework` 中的值改为预览版本，是无法使用的。因为 `TargetFramework` 的匹配是按照字符串来匹配的，并不会解析成库和版本号。关于这一点可以如何得知的，可以参考我的另一篇博客（中英双语）：

- [解读 Microsoft.NET.Sdk 的源码，你能定制各种奇怪而富有创意的编译过程 - 吕毅](/post/read-microsoft-net-sdk)
- [Reading the Source Code of Microsoft.NET.Sdk, Writing the Creative Extension of Compiling - walterlv](/post/read-microsoft-net-sdk-en)

然而实际上的使用方法很简单，就是直接用正常的方法安装对应的 NuGet 包：

```
PM> Install-Package NETStandard.Library -Version 2.1.0-preview1-27119-01
```

或者直接去 csproj 中添加 `PackageReference`。

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="NETStandard.Library" Version="2.1.0-preview1-27119-01" />
  </ItemGroup>
  
</Project>
```

至于版本号如何确定，请直接前往 MyGet 网站查看：[dotnet-core - NETStandard.Library - MyGet](https://dotnet.myget.org/feed/dotnet-core/package/nuget/NETStandard.Library)。

这个时候，.NET Standard 的预览版标准库会使用以替换 .NET Standard 2.0 的正式版本库。

