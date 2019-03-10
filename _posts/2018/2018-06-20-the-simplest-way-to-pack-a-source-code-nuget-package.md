---
title: "将 .NET Core 项目打一个最简单的 NuGet 源码包，安装此包就像直接把源码放进项目一样"
publishDate: 2018-06-20 09:22:34 +0800
date: 2019-01-30 22:33:24 +0800
categories: dotnet visualstudio nuget msbuild
---

NuGet 原本就提供了生成源码包的功能。不过，NuGet 原生的源码包仅用于调试时自带调试信息和调试源码。

本文将以最简单的方式制作一个源码引用包。安装 NuGet 包后，不会生成任何程序集引用，而是相当于将源码直接放入被安装的程序集中一样。

---

<div id="toc"></div>

## 准备工作

我们需要一个可以用来打 NuGet 包的 .NET Core 项目，只需要在 Visual Studio 中新建一个即可。在本例中，我的项目名字是 Walterlv.Demo。

## 将源码加入 NuGet 包

在 [项目文件中的已知 NuGet 属性（使用这些属性，创建 NuGet 包就可以不需要 nuspec 文件啦）](/post/known-nuget-properties-in-csproj.html) 中，我说到了项目文件中的各种 NuGet 属性。在本文中，我们将使用到其中的一部分。

这些属性将设置到项目文件 Walterlv.Demo.csproj 中。

```xml
<!-- 将源码引入包中。 -->
<IncludeSource>true</IncludeSource>
<!-- 如果指定为 true，那么生成的 dll 将拷贝到 NuGet 包的 tools 目录下。 -->
<IsTool>true</IsTool>
```

为了避免将打出来的 NuGet 包作为 dll 被安装的程序集引用，我们需要设置 `<IsTool>true</IsTool>` 属性。这样，生成的 dll 将只会放入 `tools` 文件夹中，而不会被引用。

这时，项目的 csproj 文件像这样：

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
    <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
    <IncludeSource>True</IncludeSource>
    <NoPackageAnalysis>true</NoPackageAnalysis>
    <IsTool>True</IsTool>
    <DevelopmentDependency>true</DevelopmentDependency>
  </PropertyGroup>
  
</Project>
```

设置后编译项目，我们将在输出目录得到 Walterlv.Demo.nupkg 和 Walterlv.Demo.1.0.0.symbols.nupkg 两个文件。

![](/static/posts/2018-06-20-08-36-11.png)

这种带后缀形式的包在只是 NuGet 的辅助包而已，不是主包。在 [How to create NuGet symbol packages - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/create-packages/symbol-packages?wt.mc_id=MVP) 中说明这种 symbols 的包只是用于调试的。然而，我们需要的是将其作为直接引用的主包。这种情况下，Walterlv.Demo.nupkg 因为不能满足我们的目的，所以我们并不能使用它。所以，我们需要做的是，将 Walterlv.Demo.1.0.0.symbols.nupkg 变成主包。

于是，我们编写一个 `<Target />` 将 symbols 包替换主包：

```xml
<Target Condition="$(IncludeSource) == 'True' Or $(IncludeSymbols) == 'True'" Name="UseSymbolsInsteadOfLib" AfterTargets="GenerateNuspec">
  <Delete Files="$(PackageOutputAbsolutePath)$(PackageId).$(PackageVersion).nupkg" />
  <Move SourceFiles="$(PackageOutputAbsolutePath)$(PackageId).$(PackageVersion).symbols.nupkg" DestinationFiles="$(PackageOutputAbsolutePath)$(PackageId).$(PackageVersion).nupkg" />
</Target>
```

这里使用到了 `<Delete />` 和 `<Move />` 两个自带的 Task，用于将功能不全的主包删除，然后将我们的源码包替换成为主包。我此前写过 [如何编写基于 Microsoft.NET.Sdk 的跨平台的 MSBuild Target](/post/write-msbuild-target.html) 介绍了一些自带的 Task。如果你想了解更多 `<Target />` 编写相关的知识，也可以阅读这篇文章。

在增加了上面的一段 `<Target />` 之后，最终我们将只会得到一个 NuGet 包，打开后能发现其中包含源码。

![生成的包](/static/posts/2018-06-20-09-15-55.png)

## 安装 NuGet 包时引入源码

为了让源码能随着包的安装加入到目标项目，我们需要 targets 文件来将源码引入。

在项目中新建 `Assets` 文件夹，这将用来放即将存入 NuGet 包中的文件。新建 `Assets\build\Package.targets` 文件，这个文件会被自动引入到被安装的项目中。

![](/static/posts/2018-06-20-09-14-56.png)

于是我们在 csproj 中额外添加一些代码将这个文件在打包时改名为正确的名称。

```xml
<ItemGroup>
  <None Include="Assets\build\*.targets" Pack="True" PackagePath="build\$(PackageId).targets" />
</ItemGroup>
```

于是，整个 csproj 文件看起来是这样：

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
    <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
    <IncludeSource>True</IncludeSource>
    <NoPackageAnalysis>true</NoPackageAnalysis>
    <IsTool>True</IsTool>
    <DevelopmentDependency>true</DevelopmentDependency>
  </PropertyGroup>
  
  <ItemGroup>
    <None Include="Assets\build\*.targets" Pack="True" PackagePath="build\$(PackageId).targets" />
  </ItemGroup>

  <Target Condition="$(IncludeSource) == 'True'" Name="UseSymbolsInsteadOfLib" AfterTargets="GenerateNuspec">
    <Delete Files="$(PackageOutputAbsolutePath)$(PackageId).$(PackageVersion).nupkg" />
    <Move SourceFiles="$(PackageOutputAbsolutePath)$(PackageId).$(PackageVersion).symbols.nupkg" DestinationFiles="$(PackageOutputAbsolutePath)$(PackageId).$(PackageVersion).nupkg" />
  </Target>

</Project>
```

而至于我们刚刚新建的 Package.targets 文件中，我们也需要为目标项目填写一些内容：

```xml
<Project>

  <Target Name="WalterlvDemoIncludeSource" BeforeTargets="CoreCompile">
    <Message Text="$(MSBuildThisFileDirectory)..\src\Walterlv.Demo\**\*.cs" />
    <ItemGroup>
      <Compile Include="$(MSBuildThisFileDirectory)..\src\Walterlv.Demo\**\*.cs" />
    </ItemGroup>
  </Target>

</Project>
```

这样，一旦目标程序集安装了这个 NuGet 包，便会将所有的 cs 文件加入到目标项目的编译中。

![不会出现编译错误](/static/posts/2018-06-20-09-21-56.png)
