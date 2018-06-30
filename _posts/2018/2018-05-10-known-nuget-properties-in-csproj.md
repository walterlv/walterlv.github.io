---
title: "项目文件中的已知 NuGet 属性（使用这些属性，创建 NuGet 包就可以不需要 nuspec 文件啦）"
date_published: 2018-05-10 21:49:21 +0800
date: 2018-06-30 09:25:11 +0800
categories: visualstudio nuget csharp dotnet msbuild
---

知道了 csproj 文件中的一些常用 NuGet 属性，创建 NuGet 包时就可以充分发挥新 Sdk 自动生成 NuGet 包的优势，不需要 nuspec 文件啦。（毕竟 nuspec 文件没有 .csproj 和 .targets 文件强大而又有扩展性。）

---

“项目文件中的已知属性系列”分为两个部分：

- [项目文件中的已知属性（知道了这些，就不会随便在 csproj 中写死常量啦） - 吕毅](/post/known-properties-in-csproj.html)
- 本文：[项目文件中的已知 NuGet 属性（使用这些属性，创建 NuGet 包就可以不需要 nuspec 文件啦） - 吕毅](/post/known-nuget-properties-in-csproj.html)

NuGet 相关的属性也分为全局属性和项属性两类。不过，我更愿意分成三类来说明：

<div id="toc"></div>

### nuspec 属性

当然，这部分的属性也是在 csproj 中使用的，是为了生成 nuspec 文件。

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

不过我们通常没有这么直接去设置，因为大多数属性都是有默认值的，如果不设置，将自动使用默认值。甚至什么都不写也能生成正确的 nuspec 文件。

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

这些属性会影响生成 NuGet 包的过程。

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>

    <!-- 此程序集不可打包，通常在单元测试项目中设置此属性。 -->
    <IsPackable>false</IsPackable>
    <Description></Description>
    <DevelopmentDependency></DevelopmentDependency>
    <!-- 单独指定 NuGet 包应该输出到哪个目录（可以跟项目文件的输出目录不一样）。 -->
    <PackageOutputPath></PackageOutputPath>
    <!-- 如果指定为 true，那么还会额外生成 PackageId.symbols.nupkg 包，
         除了原有包的内容外，还额外包含全部的输出文件，以及源码和项目文件，用于调试。 -->
    <IncludeSymbols>true</IncludeSymbols>
    <!-- 大致与 IncludeSymbols 相同，不过只会额外把 pdb 和 Compile 类型的文件打包到 NuGet 包中。
         如果使用 ProjectReference 引用的项目没有指定 TreatAsPackageReference=false，也会一起被打包。 -->
    <IncludeSource>true</IncludeSource>
    <PackageTypes></PackageTypes>
    <!-- 如果指定为 true，那么生成的 dll 将拷贝到 NuGet 包的 tools 目录下。 -->
    <IsTool>true</IsTool>
    <!-- 如果 lib/**/*dll 中没有发现 dll，NuGet 打包过程中会有警告；
         将这个属性设为 true 可以禁用警告；这在制作纯工具型 NuGet 包是非常有用。 -->
    <NoPackageAnalysis>true</NoPackageAnalysis>
    <MinClientVersion></MinClientVersion>
    <IncludeContentInPack></IncludeContentInPack>
    <!-- 默认情况下，项目输出的 dll 会被打包到 lib 目录下；
         设置了此属性后，就可以打包到其他目录下了。此例打包到 task 目录下 -->
    <BuildOutputTargetFolder>tasks</BuildOutputTargetFolder>
    <ContentTargetFolders></ContentTargetFolders>
    
    <!-- 以下属性都是为了使用单独的 nuspec 文件而准备的；如果不使用 nuspec 文件，通常无需设置这些属性。 -->

    <!-- 默认情况下，使用 dotnet pack 打 NuGet 包时，也会顺便编译；
         但设置此值为 true 后，就会像 nuget.exe 那样不进行编译了。 -->
    <NoBuild>true</NoBuild>
    <!-- 默认是 true，如果指定为 false，那么项目编译输出的 dll 文件将不会被打包到 NuGet 包中。 -->
    <IncludeBuildOutput>false</IncludeBuildOutput>
    <!-- 如果需要额外手工编写 nuspec 文件，那么使用此属性指定绝对或相对路径。 -->
    <NuspecFile>Walterlv.Demo.nuspec</NuspecFile>
    <!-- 生成的属性可以时 nuspec 文件中的占位符生效，
         例如 <file src="$SampleProperty$" target="src/" />  -->
    <NuspecProperties>SampleProperty=Program.cs</NuspecProperties>
    <!-- 如果 NuspecFile 使用相对路径，那么就会相对于此路径；通常不需要指定。 -->
    <NuspecBasePath></NuspecBasePath>

  </PropertyGroup>
</Project>
```

以上没有设置值和注释的属性，我正在查阅资料。

### 项属性

#### 文件

为了脱离 nuspec 文件来打包，csproj 中需要对特殊用途的文件设置特别的 NuGet 属性。

例如 `Pack` 属性可以额外指定一或一组通配符文件需要被打包到 NuGet 包中；`PackagePath` 则指定了打包到 NuGet 包的路径（*NuGet 会通过扩展名来自动识别这是文件夹还是文件，所以可以通过这个属性来重新指定名称，但无法重新指定扩展名*）。

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <Content Include="readme.txt">
      <Pack>true</Pack>
      <PackagePath>\</PackagePath>
    </Content>
    <Content Include="PackageId.targets">
      <Pack>true</Pack>
      <PackagePath>buildMultiTargeting\</PackagePath>
    </Content>
  </PropertyGroup>
</Project>
```

#### 引用

引用中也可以加入一些 NuGet 包的生成属性。

无论是 `<ProjectReference />` 还是 `<PackageReference />`，都可以额外加上 `<IncludeAssets>` `<ExcludeAssets>` `<PrivateAssets>` 属性。

使用方法类似这样：

```xml
<PackageReference Include="Walterlv.Demo" Version="3.0.0-beta">
  <IncludeAssets>all</IncludeAssets>
  <ExcludeAssets>contentFiles</ExcludeAssets>
  <PrivateAssets>contentFiles;analyzers</PrivateAssets>
</PackageReference>
```

或者这样：

```xml
<PackageReference Include="Walterlv.Demo" Version="3.0.0-beta" PrivateAssets="all" />
```

不区分大小写。

- `<IncludeAssets>` 引用的项目或包中的指定部分是本项目的依赖项。默认为 `all`。
- `<ExcludeAssets>` 引用的项目或包中的指定部分不是本项目的依赖项，应该排除。默认为 `none`。
- `<PrivateAssets>` 引用的项目或包中的指定部分依然是本项目的依赖项，但是在打 NuGet 包时不作为依赖项（不会传递到下一个项目）。默认为 `contentfiles;analyzers;build`。

如果你正试图用 NuGet 编写一个编译时工具，那么，你可能需要在所有引用的最后加上如下行，将所有的包引用都设为 `PrivateAssets`。

```xml
<PackageReference Update="@(PackageReference)" PrivateAssets="All" />
```

如果你希望了解 `Reference` `PackageReference` 以及上面 `@` 的含义，可以阅读我的另一篇文章：[理解 C# 项目 csproj 文件格式的本质和编译流程 - walterlv](/post/understand-the-csproj.html)。

### 可能没有开放的内部属性

在 Microsoft.NET.Sdk 中，NuGet 包的打包主要靠的是 `NuGet.Build.Tasks.Pack.targets` 文件中一个名为 `PackTask` 的任务来完成的，它是一个使用了非常多参数的 `Task`。

```xml
<PackTask PackItem="$(PackProjectInputFile)"
          PackageFiles="@(_PackageFiles)"
          PackageFilesToExclude="@(_PackageFilesToExclude)"
          PackageVersion="$(PackageVersion)"
          PackageId="$(PackageId)"
          Title="$(Title)"
          Authors="$(Authors)"
          Description="$(PackageDescription)"
          Copyright="$(Copyright)"
          RequireLicenseAcceptance="$(PackageRequireLicenseAcceptance)"
          LicenseUrl="$(PackageLicenseUrl)"
          ProjectUrl="$(PackageProjectUrl)"
          IconUrl="$(PackageIconUrl)"
          ReleaseNotes="$(PackageReleaseNotes)"
          Tags="$(PackageTags)"
          DevelopmentDependency="$(DevelopmentDependency)"
          BuildOutputInPackage="@(_BuildOutputInPackage)"
          ProjectReferencesWithVersions="@(_ProjectReferencesWithVersions)"
          TargetPathsToSymbols="@(_TargetPathsToSymbols)"
          TargetFrameworks="@(_TargetFrameworks)"
          AssemblyName="$(AssemblyName)"
          PackageOutputPath="$(PackageOutputAbsolutePath)"
          IncludeSymbols="$(IncludeSymbols)"
          IncludeSource="$(IncludeSource)"
          PackageTypes="$(PackageType)"
          IsTool="$(IsTool)"
          RepositoryUrl="$(RepositoryUrl)"
          RepositoryType="$(RepositoryType)"
          SourceFiles="@(_SourceFiles->Distinct())"
          NoPackageAnalysis="$(NoPackageAnalysis)"
          MinClientVersion="$(MinClientVersion)"
          Serviceable="$(Serviceable)"
          FrameworkAssemblyReferences="@(_FrameworkAssemblyReferences)"
          ContinuePackingAfterGeneratingNuspec="$(ContinuePackingAfterGeneratingNuspec)"
          NuspecOutputPath="$(NuspecOutputAbsolutePath)"
          IncludeBuildOutput="$(IncludeBuildOutput)"
          BuildOutputFolder="$(BuildOutputTargetFolder)"
          ContentTargetFolders="$(ContentTargetFolders)"
          RestoreOutputPath="$(RestoreOutputAbsolutePath)"
          NuspecFile="$(NuspecFileAbsolutePath)"
          NuspecBasePath="$(NuspecBasePath)"
          NuspecProperties="$(NuspecProperties)"
          AllowedOutputExtensionsInPackageBuildOutputFolder="$(AllowedOutputExtensionsInPackageBuildOutputFolder)"
          AllowedOutputExtensionsInSymbolsPackageBuildOutputFolder="$(AllowedOutputExtensionsInSymbolsPackageBuildOutputFolder)"/>
</Target>
```

所以总结起来我们还有这些 NuGet 的属性还可以配置（想必下划线开头的属性或集合是 NuGet 内部不愿意公开的属性了）：

```xml
$(PackProjectInputFile)
@(_PackageFiles)
@(_PackageFilesToExclude)
$(PackageVersion)
$(PackageId)
$(Title)
$(Authors)
$(PackageDescription)
$(Copyright)
$(PackageRequireLicenseAcceptance)
$(PackageLicenseUrl)
$(PackageProjectUrl)
$(PackageIconUrl)
$(PackageReleaseNotes)
$(PackageTags)
$(DevelopmentDependency)
@(_BuildOutputInPackage)
@(_ProjectReferencesWithVersions)
@(_TargetPathsToSymbols)
@(_TargetFrameworks)
$(AssemblyName)
$(PackageOutputAbsolutePath)
$(IncludeSymbols)
$(IncludeSource)
$(PackageType)
$(IsTool)
$(RepositoryUrl)
$(RepositoryType)
@(_SourceFiles->Distinct())
$(NoPackageAnalysis)
$(MinClientVersion)
$(Serviceable)
@(_FrameworkAssemblyReferences)
$(ContinuePackingAfterGeneratingNuspec)
$(NuspecOutputAbsolutePath)
$(IncludeBuildOutput)
$(BuildOutputTargetFolder)
$(ContentTargetFolders)
$(RestoreOutputAbsolutePath)
$(NuspecFileAbsolutePath)
$(NuspecBasePath)
$(NuspecProperties)
$(AllowedOutputExtensionsInPackageBuildOutputFolder)
$(AllowedOutputExtensionsInSymbolsPackageBuildOutputFolder)
```

---

#### 参考资料

- [NuGet pack and restore as MSBuild targets - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/reference/msbuild-targets)
- [NuGet PackageReference format (package references in project files) - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/consume-packages/package-references-in-project-files)
