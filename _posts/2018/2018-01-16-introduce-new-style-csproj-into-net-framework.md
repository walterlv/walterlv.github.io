---
title: "将 WPF、UWP 以及其他各种类型的旧 csproj 迁移成基于 Microsoft.NET.Sdk 的新 csproj"
publishDate: 2018-01-16 00:04:28 +0800
date: 2018-07-04 21:07:56 +0800
categories: visualstudio msbuild
---

写过 .NET Standard 类库或者 .NET Core 程序的你一定非常喜欢微软为他们新开发的项目文件（对于 C#，则是 csproj 文件）。这种文件非常简洁，组织一个庞大的项目也只需要聊聊二三十行；也非常易读，你可以轻易地修改其代码而不用经过过多的提前学习。当然，微软曾经尝试过用 project.json 来组织项目文件，不过只有短短的预览版阶段用过，此后就废弃了。

然而组织传统 .NET Framework 类库的 csproj 文件却极其庞大且难以理解。而本文将提供一种迁移方法，帮助你完成这样的迁移，以便体验新 csproj 文件带来的诸多好处。

---

**更新**：

感谢小伙伴 [KodamaSakuno (神樹桜乃)](https://github.com/KodamaSakuno) 的指导，我们可以有第三方的解决方案 MSBuild.Sdk.Extras 来更简单地完成迁移。阅读 [MSBuild.Sdk.Extras](/post/use-msbuild-sdk-extras-for-wpf-and-uwp.html) 来了解更多。

<p id="toc"></p>

### 新 csproj 文件的优势与直观体验

如果你已经体验过新 csproj 文件的好处，那么直接前往下一节即可。没体验过的话就来体验一下吧！

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net471</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="MSTest.TestAdapter" Version="1.2.0" />
    <PackageReference Include="MSTest.TestFramework" Version="1.2.0" />
  </ItemGroup>
  <ItemGroup>
    <ProjectReference Include="..\Walterlv.Demo.csproj" />
  </ItemGroup>
  <ItemGroup>
    <Reference Include="System.ComponentModel.Composition" />
  </ItemGroup>
</Project>
```

这是我的一个单元测试项目的 csproj 文件，是不是非常简洁？基于 .NET Framework 4.7.1，引用 MSTest v2，测试 Walterlv.Demo 项目，引用了一个 .NET Framework 类库。

其依赖的显示也非常简洁：

![简洁的依赖](/static/posts/2018-01-15-23-33-41.png)

而传统的 csproj 文件是怎样的呢？

```xml
<?xml version="1.0" encoding="utf-8"?>
<Project ToolsVersion="15.0" DefaultTargets="Build" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <Import Project="..\packages\MSTest.TestAdapter.1.2.0\build\net45\MSTest.TestAdapter.props" Condition="Exists('..\packages\MSTest.TestAdapter.1.2.0\build\net45\MSTest.TestAdapter.props')" />
  <PropertyGroup>
    <Configuration Condition=" '$(Configuration)' == '' ">Debug</Configuration>
    <Platform Condition=" '$(Platform)' == '' ">AnyCPU</Platform>
    <ProjectGuid>{F0E83A94-D65F-492D-AF5B-CC43666FE676}</ProjectGuid>
    <OutputType>Library</OutputType>
    <AppDesignerFolder>Properties</AppDesignerFolder>
    <RootNamespace>Walterlv.UnitTests.Demo</RootNamespace>
    <AssemblyName>Walterlv.UnitTests.Demo</AssemblyName>
    <TargetFrameworkVersion>v4.7.1</TargetFrameworkVersion>
    <FileAlignment>512</FileAlignment>
    <ProjectTypeGuids>{3AC096D0-A1C2-E12C-1390-A8335801FDAB};{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}</ProjectTypeGuids>
    <VisualStudioVersion Condition="'$(VisualStudioVersion)' == ''">15.0</VisualStudioVersion>
    <VSToolsPath Condition="'$(VSToolsPath)' == ''">$(MSBuildExtensionsPath32)\Microsoft\VisualStudio\v$(VisualStudioVersion)</VSToolsPath>
    <ReferencePath>$(ProgramFiles)\Common Files\microsoft shared\VSTT\$(VisualStudioVersion)\UITestExtensionPackages</ReferencePath>
    <IsCodedUITest>False</IsCodedUITest>
    <TestProjectType>UnitTest</TestProjectType>
    <NuGetPackageImportStamp>
    </NuGetPackageImportStamp>
    <TargetFrameworkProfile />
  </PropertyGroup>
  <PropertyGroup Condition=" '$(Configuration)|$(Platform)' == 'Debug|AnyCPU' ">
    <DebugSymbols>true</DebugSymbols>
    <DebugType>full</DebugType>
    <Optimize>false</Optimize>
    <OutputPath>bin\Debug\</OutputPath>
    <DefineConstants>DEBUG;TRACE</DefineConstants>
    <ErrorReport>prompt</ErrorReport>
    <WarningLevel>4</WarningLevel>
  </PropertyGroup>
  <PropertyGroup Condition=" '$(Configuration)|$(Platform)' == 'Release|AnyCPU' ">
    <DebugType>pdbonly</DebugType>
    <Optimize>true</Optimize>
    <OutputPath>bin\Release\</OutputPath>
    <DefineConstants>TRACE</DefineConstants>
    <ErrorReport>prompt</ErrorReport>
    <WarningLevel>4</WarningLevel>
  </PropertyGroup>
  <ItemGroup>
    <Reference Include="Microsoft.VisualStudio.TestPlatform.TestFramework, Version=14.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a, processorArchitecture=MSIL">
      <HintPath>..\packages\MSTest.TestFramework.1.2.0\lib\net45\Microsoft.VisualStudio.TestPlatform.TestFramework.dll</HintPath>
    </Reference>
    <Reference Include="Microsoft.VisualStudio.TestPlatform.TestFramework.Extensions, Version=14.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a, processorArchitecture=MSIL">
      <HintPath>..\packages\MSTest.TestFramework.1.2.0\lib\net45\Microsoft.VisualStudio.TestPlatform.TestFramework.Extensions.dll</HintPath>
    </Reference>
    <Reference Include="System" />
    <Reference Include="System.ComponentModel.Composition" />
    <Reference Include="System.Core" />
  </ItemGroup>
  <ItemGroup>
    <Compile Include="DemoTest.cs" />
    <Compile Include="Properties\AssemblyInfo.cs" />
  </ItemGroup>
  <ItemGroup>
    <None Include="packages.config" />
  </ItemGroup>
  <Import Project="$(VSToolsPath)\TeamTest\Microsoft.TestTools.targets" Condition="Exists('$(VSToolsPath)\TeamTest\Microsoft.TestTools.targets')" />
  <Import Project="$(MSBuildToolsPath)\Microsoft.CSharp.targets" />
  <Target Name="EnsureNuGetPackageBuildImports" BeforeTargets="PrepareForBuild">
    <PropertyGroup>
      <ErrorText>这台计算机上缺少此项目引用的 NuGet 程序包。使用“NuGet 程序包还原”可下载这些程序包。有关更多信息，请参见 http://go.microsoft.com/fwlink/?LinkID=322105。缺少的文件是 {0}。</ErrorText>
    </PropertyGroup>
    <Error Condition="!Exists('..\packages\MSTest.TestAdapter.1.2.0\build\net45\MSTest.TestAdapter.props')" Text="$([System.String]::Format('$(ErrorText)', '..\packages\MSTest.TestAdapter.1.2.0\build\net45\MSTest.TestAdapter.props'))" />
    <Error Condition="!Exists('..\packages\MSTest.TestAdapter.1.2.0\build\net45\MSTest.TestAdapter.targets')" Text="$([System.String]::Format('$(ErrorText)', '..\packages\MSTest.TestAdapter.1.2.0\build\net45\MSTest.TestAdapter.targets'))" />
  </Target>
  <Import Project="..\packages\MSTest.TestAdapter.1.2.0\build\net45\MSTest.TestAdapter.targets" Condition="Exists('..\packages\MSTest.TestAdapter.1.2.0\build\net45\MSTest.TestAdapter.targets')" />
</Project>
```

而且，还要搭配一个 packages.config 文件来描述 NuGet。

从对比中我们就能明显看出新 csproj 文件的优势：

1. 文件小，易读易写
1. 在版本管理中更容易解冲突
1. NuGet 包的引用没有路径要求，这意味着开发者可以任意指定 NuGet 包的位置
1. 嵌套的引用不需要重复指定（如果 A 引用了 B，B 引用了 C；那么 A 不需要显式引用 C 也能调用到 C）
1. 可以一遍编辑 csproj 一边打开项目，互不影响
1. 可以指定多个开发框架，详见 [让一个项目指定多个开发框架 - 吕毅的博客](/post/configure-projects-to-target-multiple-platforms.html)

### 迁移普通 .NET Framework 类库的项目文件

目前只有基于 .NET Core 和 .NET Standard 的普通项目能够使用这种新的 csproj 文件。在 GitHub 的讨论（[XAML files are not supported · Issue #1467 · dotnet/project-system](https://github.com/dotnet/project-system/issues/1467)）中，.NET Core 的开发者们是这么说的。

不过，.NET Framework 项目也能够有限地得到支持。具体可支持的类型以及迁移方法我的小伙伴写了一篇博客，请前往此处查看：[从以前的项目格式迁移到 VS2017 新项目格式 - 林德熙](https://lindexi.github.io/lindexi/post/%E4%BB%8E%E4%BB%A5%E5%89%8D%E7%9A%84%E9%A1%B9%E7%9B%AE%E6%A0%BC%E5%BC%8F%E8%BF%81%E7%A7%BB%E5%88%B0-VS2017-%E6%96%B0%E9%A1%B9%E7%9B%AE%E6%A0%BC%E5%BC%8F.html)。

目前没有自动的迁移方法，至少在我的实际迁移过程中，只有少数项目能够直接编译通过。由于以上我的小伙伴给出了具体的迁移方法，所以此处我只给出迁移思路。

#### 手动迁移

**第一步：**将以下代码复制到原有的 csproj 文件中（不管原来的文件里有多少内容）

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net47</TargetFramework>
  </PropertyGroup>
</Project>
```

**第二步：**修改目标 .NET Framework 框架版本号，比如 net45、net462、net472。

**第三步：**安装此前已经安装好的 NuGet 包，或者把原来的 packages.config 文件里的 NuGet 配置复制到 csproj 文件中，并统一修改格式：

从

```xml
<package id="MSTest.TestAdapter" version="1.2.0" targetFramework="net45" />
<package id="MSTest.TestFramework" version="1.2.0" targetFramework="net45" />
```

修改成

```xml
<PackageReference Include="MSTest.TestAdapter" Version="1.2.0" />
<PackageReference Include="MSTest.TestFramework" Version="1.2.0" />
```

**第四步：**引用此前引用过的类库文件和项目引用

**第五步：**删除 Properties 文件夹和里面的所有文件，因为这些信息已经被 csproj 文件记录并自动生成了。

#### 手动迁移过程中可能遇到的坑

如果你的项目比较小，比较新，比较少折腾，那么走完上面的五个步骤基本上你应该能够直接编译通过并运行了。不过，能做到这些的项目其实真不多，基本上或多或少都会遇到一些坑。

比如，你可能曾经排除出项目之外的文件现在又回来了——现在，你需要重新将他们排除，或者直接删除掉！

比如，你可能放入项目的不止有 cs 文件，还有其他各种用途的资源——你需要重新选中他们然后在属性面板中设置文件的生成属性。

比如，你可能有一些 xaml 文件——这时，你需要看本文的下一个章节 [迁移 WPF/UWP 这类 XAML UI 类库的项目文件](/post/introduce-new-style-csproj-into-net-framework.html#%E8%BF%81%E7%A7%BB-wpfuwp-%E8%BF%99%E7%B1%BB-xaml-ui-%E7%B1%BB%E5%BA%93%E7%9A%84%E9%A1%B9%E7%9B%AE%E6%96%87%E4%BB%B6)。

#### 自动迁移

自动迁移的方法我写了一篇新的博客，请阅读 [自动将 NuGet 包的引用方式从 packages.config 升级为 PackageReference](/post/migrate-packages-config-to-package-reference.html)。当然，目前自动迁移还只是 NuGet 引用方式的改变，加上文件通配符的帮助，我们的 csproj 文件即使依然是旧格式，也能非常简洁。

### 迁移 WPF/UWP 这类 XAML UI 类库的项目文件

UWP 项目已经是 .NET Core 了，然而它依然还在采用旧样式的 csproj 文件，这让人感到不可思议。然而我并不知道是否是因为旧版本的 Visual Studio 2017 不支持在新 csproj 中编译 XAML。

包含 XAML 的 WPF/UWP 项目需要额外添加以下至少三个节点（`LanguageTargets`、`Page.Generator`、`Compile.DependentUpon`）：

```xml
<PropertyGroup>
  <LanguageTargets>$(MSBuildToolsPath)\Microsoft.CSharp.targets</LanguageTargets>
</PropertyGroup>
<ItemGroup>
  <Compile Update="**\*.xaml.cs" DependentUpon="%(Filename)" />
  <Page Include="**\*.xaml" SubType="Designer" Generator="MSBuild:Compile" />
</ItemGroup>
```

如果这只是一个简单的 WPF/UWP 类库，那么这些节点其实就足够了。不过，如果这是一个启动项目（`exe`），那么还需要添加应用程序定义 `ApplicationDefinition` 和其他启动属性。于是，整个 csproj 文件看起来是这样：

```xml
<Project Sdk="Microsoft.NET.Sdk" ToolsVersion="15.0">
  <PropertyGroup>
    <LanguageTargets>$(MSBuildToolsPath)\Microsoft.CSharp.targets</LanguageTargets>
    <TargetFramework>net47</TargetFramework>

    <!-- 如果没有跨平台要求，且想去掉控制台窗口，则设为 WinExe -->
    <OutputType>Exe</OutputType>
    <!-- <OutputType>WinExe</OutputType> -->
    
    <!-- 设置为 App.xaml 的类名（含命名空间） -->
    <StartupObject />
  </PropertyGroup>

  <ItemGroup>
    <!-- App.xaml -->
    <ApplicationDefinition Include="App.xaml" SubType="Designer" Generator="MSBuild:Compile" />

    <!-- XAML elements -->
    <Page Include="**\*.xaml" Exclude="App.xaml" SubType="Designer" Generator="MSBuild:Compile" />
    <Compile Update="**\*.xaml.cs" DependentUpon="%(Filename)" />

    <!-- Resources -->
    <EmbeddedResource Update="Properties\Resources.resx" Generator="ResXFileCodeGenerator" LastGenOutput="Resources.Designer.cs" />
    <Compile Update="Properties\Resources.Designer.cs" AutoGen="True" DependentUpon="Resources.resx" DesignTime="True" />

    <!-- Settings -->
    <None Update="Properties\Settings.settings" Generator="SettingsSingleFileGenerator" LastGenOutput="Settings.Designer.cs" />
    <Compile Update="Properties\Settings.Designer.cs" AutoGen="True" DependentUpon="Settings.settings" />

  </ItemGroup>

  <ItemGroup>
    <Reference Include="PresentationCore" />
    <Reference Include="PresentationFramework" />
    <Reference Include="System.Xaml" />
    <Reference Include="WindowsBase" />
  </ItemGroup>
</Project>
```

需要注意，`<OutputType />`、`<StartupObject />` 和 `<ApplicationDefinition />` 如果是类库则需要去掉。

特别注意！**WPF 或者 UWP 项目迁移成新项目之后，默认新建的 XAML 文件会不可见，每次都需要手工去 csproj 中删掉自动增加的错误的 XAML 编译类型。**

#### 迁移中各种诡异的报错及其解决方法

对于带 XAML 的项目，如果在迁移过程中放弃了，试图恢复成原来的方案，那么在编译时会发生一个诡异的错误：

> Your project.json doesn't have a runtimes section. You should add '"runtimes": { "win": { } }' to your project.json and then re-run NuGet restore.

![错误](/static/posts/2018-01-15-13-05-29.png)

![错误](/static/posts/2018-01-16-10-49-49.png)

就是试图迁移的那个项目！无论依赖了谁还是被谁依赖，都是此项目发生“NuGet”错误。

其实这是只有新的项目文件才会出现的编译错误，而错误原因是 NuGet 的缓存文件中与包引用相关的信息已经不正确了，需要运行 `nuget restore` 或者 `dotnet restore` 重新更新此文件才行。但是，只有使用了 `Microsoft.NET.Sdk` 的新 csproj 文件才会在执行了此命令后重新生成正确的包引用缓存文件；原来的格式并不会生成此文件，也就是说，无法修复。

唯一的解决办法就是清除项目中的所有 NuGet 缓存，使用 `git clean -xdf`。

### 迁移之后的劣势

迁移成新的 csproj 格式之后，新格式中不支持的配置会丢失。

- **ProjectTypeGuid** 这个属性标志着此项目的类型，比如指定为 WPF 自定义控件库的项目新建文件的模板有自定义控件，而普通类库则不会有。
- 特别注意！WPF 或者 UWP 项目迁移成新项目之后，默认新建的 XAML 文件会不可见，每次都需要手工去 csproj 中删掉自动增加的错误的 XAML 编译类型。

### 什么都不用管的第三方迁移方案

感谢小伙伴 [KodamaSakuno (神樹桜乃)](https://github.com/KodamaSakuno) 的指导，我们可以有第三方的解决方案 MSBuild.Sdk.Extras 来更简单地完成迁移。阅读 [MSBuild.Sdk.Extras](/post/use-msbuild-sdk-extras-for-wpf-and-uwp.html) 来了解更多。相比于以上全文的迁移以及带来的劣势，第三方方案并没有发现明显的缺陷，推荐使用！

---

#### 参考资料

- [XAML files are not supported · Issue #810 · dotnet/sdk](https://github.com/dotnet/sdk/issues/810)
- [XAML files are not supported · Issue #1467 · dotnet/project-system](https://github.com/dotnet/project-system/issues/1467)
- [Old csproj to new csproj: Visual Studio 2017 upgrade guide](http://www.natemcmaster.com/blog/2017/03/09/vs2015-to-vs2017-upgrade/)
- [Using the new .Csproj without .Net core · Issue #1688 · Microsoft/msbuild](https://github.com/Microsoft/msbuild/issues/1688)
- [c# - WPF App Using new csproj format - Stack Overflow](https://stackoverflow.com/questions/44140673/wpf-app-using-new-csproj-format)
- [XAML files are not supported · Issue #1467 · dotnet/project-system](https://github.com/dotnet/project-system/issues/1467)
- [XAML files are not supported · Issue #810 · dotnet/sdk](https://github.com/dotnet/sdk/issues/810)
- [c# - How-to migrate Wpf projects to the new VS2017 format - Stack Overflow](https://stackoverflow.com/questions/43693591/how-to-migrate-wpf-projects-to-the-new-vs2017-format)
- [project.json doesn't have a runtimes section, add '“runtimes”: { “win”: { } }' to project.json · Issue #5931 · Microsoft/vsts-tasks](https://github.com/Microsoft/vsts-tasks/issues/5931)
- [Ignore PROJECT.JSON when using .CSPROJ · Issue #394 · Microsoft/msbuild](https://github.com/Microsoft/msbuild/issues/394)
- [dotnet build fails when referencing a project converted to PackageReference · Issue #6294 · dotnet/cli](https://github.com/dotnet/cli/issues/6294)
- [Visual studio project.json does not have a runtime section - Stack Overflow](https://stackoverflow.com/questions/45614394/visual-studio-project-json-does-not-have-a-runtime-section)
