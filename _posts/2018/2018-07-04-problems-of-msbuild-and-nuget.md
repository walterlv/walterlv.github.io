---
title: "MSBuild/Roslyn 和 NuGet 的 100 个坑"
publishDate: 2018-07-04 21:29:29 +0800
date: 2019-04-12 09:38:58 +0800
categories: msbuild nuget visualstudio dotnet
---

MSBuild 不愧是强大的编译器，它提供的扩展机制让你几乎可以编译任何类型的文件或项目；Roslyn 是全新编写的一套编译器，不过它保留了 MSBuild 的大部分机制；NuGet 是 .NET 生态系统中的包管理机制，被原生集成在新的 Microsoft.NET.Sdk 中。

不过，他们的坑还是挺多的；本文就是他们 100 个坑的集合。

---

<div id="toc"></div>

## 系列博客

这是兄弟篇中的一篇，关于 MSBuild/Roslyn 和 NuGet 的 100 个坑：

- [MSBuild/Roslyn 和 NuGet 的 100 个坑](/post/problems-of-msbuild-and-nuget.html)

由于这篇博客是大量坑的记录，所以是它建立在你已经对 MSBuild/Roslyn 和 NuGet 有一些了解的基础之上的。我摘取了一些入门系列文章，也许你可以通过阅读这些来了解下：

- [理解 C# 项目 csproj 文件格式的本质和编译流程](/post/understand-the-csproj.html)
- [迁移 csproj 文件到基于 Microsoft.NET.Sdk](/post/introduce-new-style-csproj-into-net-framework.html)
- [创建基于 MSBuild Task 的跨平台的 NuGet 工具包](/post/create-a-cross-platform-msbuild-task-based-nuget-tool.html)
- [创建基于命令行工具的跨平台的 NuGet 工具包](/post/create-a-cross-platform-command-based-nuget-tool.html)

当然还有更多，可以访问 <https://walterlv.github.io/categories#nuget>。

## 100 个坑

### 不可用的源

NuGet 可以指定多个包源。既可以在 Visual Studio 中配置，也可以在配置文件中配置。

![在 Visual Studio 中配置](/static/posts/2018-07-04-20-44-01.png)

![NuGet 配置文件](/static/posts/2018-07-04-20-40-19.png)

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" protocolVersion="3" />
    <add key="Debug" value="C:\Users\lvyi\Desktop\TroukawDerjalyem\DejaiJacir\bin" />
  </packageSources>
  <disabledPackageSources>
    <add key="Microsoft Visual Studio Offline Packages" value="true" />
  </disabledPackageSources>
</configuration>
```

不过，只要有任何一个源不可用，那么你任何一个项目都别想再成功还原（restore）包了。

比如：

- 某个国外的源因为某些不可描述的原因无法连通
- 某个源暂时挂掉了，服务不可用
- 某个本地的源，文件夹不存在了

是的，不管还有多少个或者，只要死了一个，还原都没有用了。

这种情况，唯一的办法就是把那个不再可用的源从配置中删除，或者临时禁用掉出问题的源。

### 不存在的版本（新版本已修复）

如果某个包的特定版本在所有源中不存在，那么安装此包的项目再也无法更新或者卸载此包了（也就别想再编译通过了）。

不过目前这种问题只存在于旧的 `packages.config` 形式的 NuGet 包管理系统中。如果已经升级成 `PackageReference`，那么就没有这个问题了。

### 编译不通过后无法安装和更新 NuGet 包

有些情况下，会因为项目没有办法完成编译导致无法安装和更新某些 NuGet 包；但编译不通过其实就是这个 NuGet 包导致的（比如某个测试包）。大面积注释确保编译通过虽然说是一种可以尝试的手段，但毕竟还是太低效了。

这时，通过手工修改项目文件来实现手工更新 NuGet 包不失为一种尝试手段。

### 项目文件 Sdk 的来回切换

MSBuild 15.0 为项目文件的根节点 `Project` 带来了 `Sdk` 属性，也就是说 Visual Studio 2017 开始支持。

[将 WPF、UWP 以及其他各种类型的旧 csproj 迁移成 Sdk 风格的 csproj](/post/introduce-new-style-csproj-into-net-framework.html) 一文讲述了如何为项目文件添加 Sdk 属性，以便项目能够体验到最新的 Microsoft.NET.Sdk 编译体验。其中的 NuGet 原生支持是非常清爽的。

升级时很清爽，降级就不爽了！这种情况会发生在新分支中进行了项目文件升级，随后切换回之前的分支；这时相当于在降级。但是，降级时会编译不通过，并提示：

> Your project.json doesn't have a runtimes section. You should add '"runtimes": { "win": { } }' to your project.json and then re-run NuGet restore.

其实这是只有新的项目文件才会出现的编译错误，而错误原因是 NuGet 的缓存文件中与包引用相关的信息已经不正确了，需要运行 `nuget restore` 或者 `dotnet restore` 重新更新此文件才行。但是，只有使用了 Sdk 风格的 csproj 文件才会在执行了此命令后重新生成正确的包引用缓存文件；原来的格式并不会生成此文件，也就是说，无法修复。

唯一的解决办法就是清除项目中的所有 NuGet 缓存，使用 `git clean -xdf`。

### 依赖的项目会自动转为依赖的 NuGet 包

如果你给一个项目 A 打 NuGet 包，但这个项目引用此解决方案中的另一个项目 B。那么这时打包，NuGet 会认为 A 包依赖于 B 包。

事实上，B 包极有可能是不存在的，也就是说，你打的 A 包并没有办法给大家正常使用。

### .nuget.g.props 和 .nuget.g.targets

使用 `Microsoft.NET.Sdk` 作为 Sdk 的项目文件会自动在 obj 文件夹下生成 `project.assets.json`、`$(ProjectName).csproj.nuget.cache`、`$(ProjectName).csproj.nuget.g.props` 和 `$(ProjectName).csproj.nuget.g.targets` 文件；其中 `.nuget.g.props` 和 `.nuget.g.targets` 中生成了 `Import` 包中编译相关文件的代码。例如：

```xml
<Project ToolsVersion="14.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <ImportGroup Condition=" '$(ExcludeRestorePackageImports)' != 'true' ">
    <Import Project="$(NuGetPackageRoot)walterlv.demo.tools\3.0.27-alpha\build\Walterlv.Demo.Tools.targets" Condition="Exists('$(NuGetPackageRoot)walterlv.demo.tools\3.0.27-alpha\build\Walterlv.Demo.Tools.targets')" />
  </ImportGroup>
</Project>
```

然而，有时会出现包中的文件并没有 Import 成功的情况，或者已经 Import，但却不明原因的无法完成编译。（我的 Visual Studio 版本 2017.7.4，Microsoft.NET.Sdk 版本 2.1.300。）

这时，把这两个文件重新在 csproj 中 Import 一次却能正常。具体来说是这样（`Walterlv.Demo` 是项目名称）：

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <Import Condition=" Exists('obj\Walterlv.Demo.csproj.nuget.g.props') " Project="obj\Walterlv.Demo.csproj.nuget.g.props" />

  <PropertyGroup>
    <TargetFramework>net45</TargetFramework>
    <LanguageTargets>$(MSBuildToolsPath)\Microsoft.CSharp.targets</LanguageTargets>
  </PropertyGroup>
  
  <ItemGroup>
    <PackageReference Include="Cvte.Core" Version="2.1.0.293" />
  </ItemGroup>

  <Import Condition=" Exists('obj\Walterlv.Demo.csproj.nuget.g.targets') " Project="obj\Walterlv.Demo.csproj.nuget.g.targets" />

</Project>

```

这里我们不通过直接修改 `obj\Walterlv.Demo.csproj.nuget.g.props` 和 `obj\Walterlv.Demo.csproj.nuget.g.targets` 文件是因为这两个文件不在版本管理中；而且如果执行 `nuget restore` 或者 `dotnet restore` 后会重新生成。
