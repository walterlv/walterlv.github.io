---
title: "帮助官方 NuGet 解掉 Bug，制作绝对不会传递依赖的 NuGet 包"
publishDate: 2018-08-05 21:22:12 +0800
date: 2019-02-27 16:34:26 +0800
categories: nuget msbuild
---

如果你希望做一个 NuGet 工具包，那么这个包一定不能作为依赖传递给下一个包。典型的例子，做一个生成版本号的工具 NuGet 包，或者做一个代码分析器。

本文将解决 NuGet 的几个坑，真正做到绝对没有的依赖传递。

---

<div id="toc"></div>

## 我们遇到了什么问题

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

## 官方提供的解决方案

~~官方在非常早期的 2.7 版本就提供了 `developmentDependency` 属性，可以在 nuspec 文件中写。但实际上这个属性在后面版本的 NuGet 开发中就丢掉了。不生效。~~

~~官方提供了 `IsTool` 属性可以使用，但这依然不能阻止 B 安装了 A 包之后，C 包被迫安装 A 包的问题。~~

**更新：**

官方的 NuGet 在更新到 4.9 及以上之后，此属性再次生效。添加方法是在 csproj 文件中添加一行属性：

```xml
<DevelopmentDependency></DevelopmentDependency>
```

添加后，如果开发者安装了此 NuGet 包，将自动生成以下代码，于是依赖就不会传递。

```
<PackageReference Include="dotnetCampus.SourceYard" Version="0.1.7213-alpha">
    <PrivateAssets>all</PrivateAssets>
    <IncludeAssets>runtime; build; native; contentfiles; analyzers; buildtransitive</IncludeAssets>
</PackageReference>
```

由于官方解决掉这个 Bug，所以你只需要更新到 NuGet 4.9 以上的版本即可。后面的博客内容无需阅读。

至于如何查看自己的 NuGet 版本号，请参见：[获取 Nuget 版本号 - 林德熙](https://blog.lindexi.com/post/%E8%8E%B7%E5%8F%96-nuget-%E7%89%88%E6%9C%AC%E5%8F%B7)

## ~~我试图寻找的解决方案~~

### ~~为 A 项目添加去除依赖的代码~~

~~我们创建一个项目 Walterlv.PackageDemo.A 模拟前面提到的包 A，创建一个项目 Walterlv.PackageDemo.B 模拟前面提到的包 B，创建一个项目 Walterlv.ProjectDemo.C 模拟前面的项目 C。注意，实际场景中，这三个项目通常在不同的仓库中，由不同的开发者开发。~~

![创建项目 A、B、C](/static/posts/2018-07-30-19-52-46.png)

~~不过，为了方便起见，我打算直接在一个解决方案中模拟这样的效果：~~

![在一个解决方案中模拟](/static/posts/2018-08-05-20-40-37.png)

~~我在 A 中试图创建一个 build\Walterlv.PackageDemo.A.props 或 build\Walterlv.PackageDemo.A.targets 文件，并在里面写一些阻止 A 被依赖的代码。~~

```xml
<Project>

  <ItemGroup>
    <PackageReference Update="Walterlv.PackageDemo.A" PrivateAssets="All" />
  </ItemGroup>

</Project>
```

~~为了通用一点，我取名为 Package.targets 文件，并在 A 项目编译的时候改名为 Walterlv.PackageDemo.A.targets。~~

![Package.targets 文件](/static/posts/2018-08-05-21-05-18.png)  
▲ 项目的结构

~~以下是 A 项目的 csproj 文件，包含将 Package.targets 在打包 NuGet 包时改名的部分。~~

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>netcoreapp2.1</TargetFramework>
    <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
  </PropertyGroup>

  <ItemGroup>
    <None Include="Assets\build\Package.targets" Pack="True" PackagePath="build\$(PackageId).targets" />
  </ItemGroup>

</Project>
```

### ~~在 B 项目中进行测试~~

~~本地调试当然用不着推送到 <https://nuget.org>。我们本地新建一个源，专门用于调试。~~

~~在 “工具 -> 选项 -> NuGet 包管理器” 中，我们可以设置 NuGet 源：~~

![添加调试用的 NuGet 源](/static/posts/2018-08-05-21-02-07.png)  
▲ 添加调试用的 NuGet 源

~~我们把刚刚 A 项目的输出目录填进去添加一个新的源。于是我们就能在 B 项目中安装 A 包了。~~

~~于是 B 项目的 csproj 文件全文内容如下：~~

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>netcoreapp2.1</TargetFramework>
    <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Walterlv.PackageDemo.A" Version="1.0.0" />
  </ItemGroup>

</Project>
```

~~当以上 A 和 B 项目被 Visual Studio 编译的时候，一切符合预期；就像下图这样，B 项目中没有声明对 A 的依赖：~~

![B 项目的 NuGet 包](/static/posts/2018-08-05-21-15-42.png)

### ~~令人遗憾的结果~~

~~然而使用命令行编译的时候，就不按照预期工作了；如下图这样，B 项目中出现了对 A 的依赖。~~

![B 项目的 NuGet 包，有依赖](/static/posts/2018-08-16-16-37-56.png)

~~命令行编译时使用这些命令效果都是一样的不管用。~~

```powershell
nuget restore
msbuild
```

```powershell
dotnet restore
dotnet build
```

~~不过，令人难以置信的时，如果此时 Visual Studio 打开了此项目，命令行编译却能符合预期。~~

~~另外，我还尝试将 Package.targets 中的所有内容放到 `<Target />` 里面以获得延迟到编译期执行的效果，但结论依然与上面一致，即仅能在 Visual Studio 中正常工作。~~

```xml
<Project>

  <Target Name="ForceWalterlvDemoPrivateAssets" BeforeTargets="CollectPackageReferences">
    <ItemGroup>
      <PackageReference Update="Walterlv.PackageDemo.A" PrivateAssets="All" />
    </ItemGroup>
  </Target>

</Project>
```
