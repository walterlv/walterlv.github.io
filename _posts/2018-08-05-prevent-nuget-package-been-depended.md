---
title: "帮助官方 NuGet 解掉 Bug，制作绝对不会传递依赖的 NuGet 包"
date: 2018-07-30 19:41:18 +0800
categories: nuget msbuild
published: false
---

如果你希望做一个 NuGet 工具包，那么这个包一定不能作为依赖传递给下一个包。典型的例子，做一个生成版本号的工具 NuGet 包，或者做一个代码分析器。

本文将解决 NuGet 的几个坑，真正做到绝对没有的依赖传递。

---

<div id="toc"></div>

### 我们遇到了什么问题

如果你使用了 GitVersion 这款 NuGet 包来自动修改你的版本号，那么你可能会遇到这个问题。[GitTools/GitVersion: Easy Semantic Versioning (http://semver.org) for projects using Git](https://github.com/GitTools/GitVersion) 

假想我们希望开发一个 NuGet 包 Walterlv.PackageDemo.A。另一位小伙伴想要使用我 A 包的功能做一个 Walterlv.PackageDemo.B 包。于是其他小伙伴可以安装 B 包去做自己的项目 C。

那么，除非我在 B 包安装完之后，明确在 B 的 csproj 文件中写以下代码，否则 B 包发布出去后，安装 B 包的项目 C 就会同时安装上 A 包。

```xml
<ItemGroup>
  <PackageReference Include="Walterlv.PackageDemo.A" Version="1.0.0" PrivateAssets="All" />
</ItemGroup>
```

显然，由于 A 是个工具包，只是为了给安装了 A 的 B 包提供版本号或其他编译期功能的。C 不需要这样的功能！

然而我们希望做出来的 A 包具备这样的特点：

1. 小伙伴给 B 安装 A 包的时候，不用额外为 A 包写配置依赖的代码；
1. 小伙伴为 C 安装 B 的时候，不会出现 A 乱入的情况。

如果你依然对这样的问题存有疑惑，可以阅读以下文章，这是切实的例子。

- [如何创建一个基于命令行工具的跨平台的 NuGet 工具包](/post/create-a-cross-platform-command-based-nuget-tool.html)
- [如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包](/post/create-a-cross-platform-msbuild-task-based-nuget-tool.html)

### 官方提供的解决方案

官方在非常早期的 2.7 版本就提供了 `developmentDependency` 属性，可以在 nuspec 文件中写。但实际上这个属性在后面版本的 NuGet 开发中就丢掉了。不生效。

官方提供了 `IsTool` 属性可以使用，但这依然不能阻止 B 安装了 A 包之后，C 包被迫安装 A 包的问题。

### 我提供的强力解决方案

我们创建一个项目 Walterlv.PackageDemo.A 模拟前面提到的包 A，创建一个项目 Walterlv.PackageDemo.B 模拟前面提到的包 B，创建一个项目 Walterlv.ProjectDemo.C 模拟前面的项目 C。注意，实际场景中，这三个项目通常在不同的仓库中，由不同的开发者开发。

![创建项目 A、B、C](/static/posts/2018-07-30-19-52-46.png)

