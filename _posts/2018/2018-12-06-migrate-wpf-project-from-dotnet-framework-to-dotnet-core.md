---
title: "将基于 .NET Framework 的 WPF 项目迁移到基于 .NET Core 3"
publishDate: 2018-12-06 11:11:10 +0800
date: 2019-05-31 20:11:59 +0800
tags: dotnet wpf
position: starter
coverImage: /static/posts/2018-12-06-10-00-06.png
permalink: /post/migrate-wpf-project-from-dotnet-framework-to-dotnet-core.html
---

在 Connect(); 2018 大会上，微软发布了 .NET Core 3 Preview，以及基于 .NET Core 3 的 WPF；同时还发布了 Visual Studio 2019 预览版。你可以基于 .NET Core 3 创建 WPF 程序。不过，如果你已经有基于 .NET Framework 的 WPF 项目，那么如何快速迁移到基于 .NET Core 的版本呢？

本文将指导大家将现有基于 .NET Framework 的 WPF 项目迁移到基于 .NET Core 3 的版本。

---

<div id="toc"></div>

## 安装 .NET Core 3.0 Preview SDK

前往官网下载：[.NET Core 3.0 downloads for Linux, macOS, and Windows](https://dotnet.microsoft.com/download/dotnet-core/3.0)。

然后安装。

如果你没有安装 Visual Studio 2019 Preview，请前往下载：[Visual Studio 2019](https://visualstudio.microsoft.com/vs/preview/)。

## 编辑 csproj 文件

卸载你原有的 WPF 项目，然后右键“编辑 csproj 文件”。将里面所有的内容改为以下代码：

```xml
<Project Sdk="Microsoft.NET.Sdk.WindowsDesktop">
  <PropertyGroup>
    <TargetFramework>netcoreapp3.0</TargetFramework>
    <UseWPF>true</UseWPF>

    <!-- 如果你的项目是 Exe，则设为 WinExe；如果是 WPF 类库，则删掉这一行 -->
    <OutputType>WinExe</OutputType>

    <!-- 如果你的原有项目中有 App.manifest 文件，则在此加入 -->
    <!-- <ApplicationManifest>Properties\App.manifest</ApplicationManifest> -->

    <!-- 如果你的原有项目中有 App.ico 图标，则在此加入 -->
    <!-- <ApplicationIcon>Properties\App.ico</ApplicationIcon> -->

    <!-- 如果你的原有项目中有自定义的 Main 函数，则在此加入 -->
    <!-- <StartupObject>Walterlv.Whitman.Program</StartupObject> -->
  </PropertyGroup>
  <ItemGroup>

    <!-- 如果你的原有项目中有自己添加的图标文件，则在此加入 -->
    <Resource Include="Properties\App.ico" />

    <!-- 如果你的原有项目中有其他非 .cs、.xaml 文件，则需要在这里加入 -->

  </ItemGroup>
</Project>
```

## 编辑 AssemblyInfo.cs 文件

由于在 .NET Core 中，程序集相关的信息是自动生成的，所以原有 AssemblyInfo.cs 中的大量程序集信息是需要删掉的，不然会出现重复 Attribute 的错误。

看以下代码，红色标记 “--” 的代码是需要删掉的，其他的代码保留。

```diff
--  using System.Reflection;
--  using System.Resources;
--  using System.Runtime.CompilerServices;
    using System.Runtime.InteropServices;
    using System.Windows;
    
--  // General Information about an assembly is controlled through the following
--  // set of attributes. Change these attribute values to modify the information
--  // associated with an assembly.
--  [assembly: AssemblyTitle("Whitman")]
--  [assembly: AssemblyDescription("")]
--  [assembly: AssemblyConfiguration("")]
--  [assembly: AssemblyCompany("")]
--  [assembly: AssemblyProduct("Whitman")]
--  [assembly: AssemblyCopyright("Copyright © walterlv 2018")]
--  [assembly: AssemblyTrademark("")]
--  [assembly: AssemblyCulture("")]
--  
    // Setting ComVisible to false makes the types in this assembly not visible
    // to COM components.  If you need to access a type in this assembly from
    // COM, set the ComVisible attribute to true on that type.
    [assembly: ComVisible(false)]
    
--  //In order to begin building localizable applications, set
--  //<UICulture>CultureYouAreCodingWith</UICulture> in your .csproj file
--  //inside a <PropertyGroup>.  For example, if you are using US english
--  //in your source files, set the <UICulture> to en-US.  Then uncomment
--  //the NeutralResourceLanguage attribute below.  Update the "en-US" in
--  //the line below to match the UICulture setting in the project file.
--  
--  //[assembly: NeutralResourcesLanguage("en-US", UltimateResourceFallbackLocation.Satellite)]
--  
--  
    [assembly: ThemeInfo(
        ResourceDictionaryLocation.None, //where theme specific resource dictionaries are located
                                         //(used if a resource is not found in the page,
                                         // or application resource dictionaries)
        ResourceDictionaryLocation.SourceAssembly //where the generic resource dictionary is located
                                                  //(used if a resource is not found in the page,
                                                  // app, or any theme specific resource dictionaries)
    )]
--  
--  
--  // Version information for an assembly consists of the following four values:
--  //
--  //      Major Version
--  //      Minor Version
--  //      Build Number
--  //      Revision
--  //
--  // You can specify all the values or you can default the Build and Revision Numbers
--  // by using the '*' as shown below:
--  // [assembly: AssemblyVersion("1.0.*")]
--  [assembly: AssemblyVersion("1.0.0.0")]
--  [assembly: AssemblyFileVersion("1.0.0.0")]
```

## 恢复 NuGet 包

打开你原有项目的 packages.config 文件。这里记录了你的项目中已经安装的 NuGet 包。

```xml
<?xml version="1.0" encoding="utf-8"?>
<packages>
  <package id="Microsoft.Toolkit.Wpf.UI.XamlHost" version="5.0.0" targetFramework="net471" />
</packages>
```

我们需要把这个文件里面的内容转换成 PackageReference。按照如下的方式逐一将 `package` 转换成 `PackageReference`。

```xml
<PackageReference Include="Microsoft.Toolkit.Wpf.UI.XamlHost" Version="5.0.0" />
```

这时，csproj 项目文件的内容如下：

```diff
    <Project Sdk="Microsoft.NET.Sdk.WindowsDesktop">
      <PropertyGroup>
        <TargetFramework>netcoreapp3.0</TargetFramework>
        <UseWPF>true</UseWPF>
        <OutputType>WinExe</OutputType>
        <ApplicationManifest>Properties\App.manifest</ApplicationManifest>
        <ApplicationIcon>Properties\App.ico</ApplicationIcon>
        <StartupObject>Walterlv.Whitman.Program</StartupObject>
      </PropertyGroup>
++    <ItemGroup>
++      <PackageReference Include="Microsoft.Toolkit.Wpf.UI.XamlHost" Version="5.0.0" />
++    </ItemGroup>
      <ItemGroup>
        <Resource Include="Properties\App.ico" />
      </ItemGroup>
    </Project>
```

如果你觉得这一步骤比较繁琐，那么可以在本文一开始就按照这篇博客的方式进行操作：[自动将 NuGet 包的引用方式从 packages.config 升级为 PackageReference - walterlv](/post/migrate-packages-config-to-package-reference)。

## 添加 Windows 兼容包

如果你原有的 WPF 项目引用了一些注册表等 Windows 特有的功能，那么你还需要引用一个 Windows 兼容 NuGet 包：

- [Microsoft.Windows.Compatibility](https://www.nuget.org/packages/Microsoft.Windows.Compatibility)

## 编译、运行和修复其他错误

对于比较简单的项目，在经过以上步骤之后，你可能已经可以可以直接跑起来了。

![运行](/static/posts/2018-12-06-10-00-06.png)

对于复杂一些的项目，你可能会遇到其他的编译或运行错误，你需要适当进行一些修复。而产生这些错误的原因是 csproj 文件中删除了太多的东西。你需要将 `<ItemGroup />` 中的一些没有默认添加进来的文件加入进来。

## 更多

如果你只是希望创建基于 .NET Core 3 的新 WPF 项目，那么请阅读我的另一篇博客：[如何创建一个基于 .NET Core 3 的 WPF 项目](/post/create-new-wpf-on-dotnet-core-project)。

可以持续关注官方 WPF on .NET Core 的例子：[samples/wpf/WPF-WinRT at master · dotnet/samples](https://github.com/dotnet/samples/tree/master/wpf/WPF-WinRT)。


