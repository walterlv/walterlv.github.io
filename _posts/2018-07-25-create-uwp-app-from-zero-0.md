---
title: "(1/2) 为了理解 UWP 的启动流程，我从零开始创建了一个 UWP 程序"
date_published: 2018-07-25 09:27:23 +0800
date: 2018-07-27 07:23:44 +0800
categories: uwp msbuild
---

每次使用 Visual Studio 的模板创建一个 UWP 程序，我们会在项目中发现大量的项目文件、配置、应用启动流程代码和界面代码。然而这些文件在 UWP 程序中到底是如何工作起来的？

我从零开始创建了一个 UWP 程序，用于探索这些文件的用途，了解 UWP 程序的启动流程。

---

本文分为两个部分：

- [从零开始创建一个 UWP 项目并完成部署](/post/create-uwp-app-from-zero-0.html)
- [从零开始编写一个 UWP 应用程序和窗口](/post/create-uwp-app-from-zero-1.html)

本文将一个普通项目改造成 UWP 项目，重点在了解 UWP 的项目文件组成。

<div id="toc"></div>

### 从最简单的项目模板开始

虽然可以从零开始写一个 csproj 文件，不过这并没有什么技术含量，因为新的 csproj 文件实在是非常简单。参见：

- [理解 C# 项目 csproj 文件格式的本质和编译流程](/post/understand-the-csproj.html)
- [将 WPF、UWP 以及其他各种类型的旧 csproj 迁移成基于 Microsoft.NET.Sdk 的新 csproj](/post/introduce-new-style-csproj-into-net-framework.html)

于是，我创建一个 .NET Core 控制台应用。当然，其它简单的如 .NET Standard 库都是一样的，反正最后都会被我改得面目全非。

![创建 .NET Core 控制台应用](/static/posts/2018-07-24-20-37-18.png)

于是我得到了一个 csproj 项目文件和包含有应用程序入口的 Program.cs 文件。

![两个文件](/static/posts/2018-07-24-20-42-51.png)

其中 csproj 文件内容非常简单：

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>netcoreapp2.1</TargetFramework>
  </PropertyGroup>
</Project>
```

Program.cs 文件也是：

```csharp
// using System;

namespace Walterlv.Demo.ZeroUwp
{
    class Program
    {
        static void Main(string[] args)
        {
            // 这一句需要删除，因为 UWP 程序中不能使用控制台。
            // Console.WriteLine("Hello World!");
        }
    }
}
```

不过，这两个文件都会被改掉的，已经无所谓里面是什么内容了。

### 将项目改造成 UWP 项目

UWP 程序的输出类型是 `AppContainerExe`，而不是一般的 Library 或者 Exe。

另外，基于 Microsoft.NET.Sdk 的新 csproj 格式不支持 UWP 应用程序。所以我希望借助第三方的 MSBuild.Sdk.Extras 来编译 UWP 的项目。参见 [新 csproj 对 WPF/UWP 支持不太好？有第三方 SDK 可以用！MSBuild.Sdk.Extras](/post/use-msbuild-sdk-extras-for-wpf-and-uwp.html)。

然而实际情况也不容乐观，因为此第三方 Sdk 只支持 UWP 的库程序，而不支持应用程序容器。所以即便修改为以下方式，最终也因为缺少 Visual Studio RunCommand 的支持，而导致无法启动。

```xml
<Project Sdk="MSBuild.Sdk.Extras/1.6.41">

  <PropertyGroup>
    <OutputType>AppContainerExe</OutputType>
    <TargetFrameworks>uap10.0.17134</TargetFrameworks>
  </PropertyGroup>

</Project>
```

使用以上新 Sdk 的 csproj 格式，我完整地写完了整个 csproj 文件和后续步骤，依然无法解决下面这个错误提示框：

![RunCommand Property is not defined](/static/posts/2018-07-25-08-31-09.png)  
▲ 无法启动

所以我们依然只能使用传统的 csproj 文件格式。里面大部分的内容从模板中复制而来。事实上，我寻找了很多资料，都没有找到让支持 Sdk 的新 csproj 格式支持 UWP 的主程序。

```xml
<?xml version="1.0" encoding="utf-8"?>
<Project ToolsVersion="15.0" DefaultTargets="Build" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <Import Project="$(MSBuildExtensionsPath)\$(MSBuildToolsVersion)\Microsoft.Common.props" Condition="Exists('$(MSBuildExtensionsPath)\$(MSBuildToolsVersion)\Microsoft.Common.props')" />
  <PropertyGroup>
    <Configuration Condition=" '$(Configuration)' == '' ">Debug</Configuration>
    <Platform Condition=" '$(Platform)' == '' ">x86</Platform>
    <ProjectGuid>{09A58639-DC50-41C1-8BCE-A2217A1D3327}</ProjectGuid>
    <OutputType>AppContainerExe</OutputType>
    <AppDesignerFolder>Properties</AppDesignerFolder>
    <RootNamespace>Walterlv.Demo.ZeroUwp</RootNamespace>
    <AssemblyName>Walterlv.Demo.ZeroUwp</AssemblyName>
    <DefaultLanguage>en-US</DefaultLanguage>
    <TargetPlatformIdentifier>UAP</TargetPlatformIdentifier>
    <TargetPlatformVersion Condition=" '$(TargetPlatformVersion)' == '' ">10.0.17134.0</TargetPlatformVersion>
    <TargetPlatformMinVersion>10.0.15063.0</TargetPlatformMinVersion>
    <MinimumVisualStudioVersion>14</MinimumVisualStudioVersion>
    <FileAlignment>512</FileAlignment>
    <ProjectTypeGuids>{A5A43C5B-DE2A-4C0C-9213-0A381AF9435A};{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}</ProjectTypeGuids>
    <WindowsXamlEnableOverview>true</WindowsXamlEnableOverview>
    <DebugSymbols>true</DebugSymbols>
    <OutputPath>bin\x86\Debug\</OutputPath>
    <DefineConstants>DEBUG;TRACE;NETFX_CORE;WINDOWS_UWP</DefineConstants>
    <DebugType>full</DebugType>
    <PlatformTarget>x86</PlatformTarget>
    <UseVSHostingProcess>false</UseVSHostingProcess>
    <ErrorReport>prompt</ErrorReport>
    <Prefer32Bit>true</Prefer32Bit>
  </PropertyGroup>
  <PropertyGroup>
    <RestoreProjectStyle>PackageReference</RestoreProjectStyle>
  </PropertyGroup>
  <ItemGroup>
    <Compile Include="Program.cs" />
    <Compile Include="Properties\AssemblyInfo.cs" />
  </ItemGroup>
  <ItemGroup>
    <AppxManifest Include="Package.appxmanifest">
      <SubType>Designer</SubType>
    </AppxManifest>
  </ItemGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.NETCore.UniversalWindowsPlatform">
      <Version>6.1.5</Version>
    </PackageReference>
  </ItemGroup>
  <PropertyGroup Condition=" '$(VisualStudioVersion)' == '' or '$(VisualStudioVersion)' &lt; '14.0' ">
    <VisualStudioVersion>14.0</VisualStudioVersion>
  </PropertyGroup>
  <Import Project="$(MSBuildExtensionsPath)\Microsoft\WindowsXaml\v$(VisualStudioVersion)\Microsoft.Windows.UI.Xaml.CSharp.targets" />
</Project>
```

### 编写 AppxManifest

项目改造成 UWP 项目后，似乎已经完成了大部分了，但此时直接运行会有编译错误，因为我缺少 UWP 程序必要的 AppxManifest.xml 文件。

![缺少 AppxManifest.xml 文件](/static/posts/2018-07-24-20-58-01.png)

事实上，AppxManifest.xml 的创建是非常繁琐的；通常是编译过程帮我们根据 Package.appxmanifest 文件自动生成的。然而创建一个 Package.appxmanifest 也是很麻烦的。至少，要让 Visual Studio 能够直接打开这个文件所需的最小代码量是下面这些（不能编译通过）：

```xml
<?xml version="1.0" encoding="utf-8"?>
<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
         xmlns:mp="http://schemas.microsoft.com/appx/2014/phone/manifest"
         xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
         xmlns:uap2="http://schemas.microsoft.com/appx/manifest/uap/windows10/2"
         xmlns:uap3="http://schemas.microsoft.com/appx/manifest/uap/windows10/3"
         xmlns:iot="http://schemas.microsoft.com/appx/manifest/iot/windows10"
         xmlns:mobile="http://schemas.microsoft.com/appx/manifest/mobile/windows10"
         IgnorableNamespaces="uap mp uap3 iot uap2 mobile">
  <Identity Name="walterlv.zerouwp" Publisher="CN=walterlv" Version="0.1.0.0" />
  <mp:PhoneIdentity PhoneProductId="97f5137d-c6be-4395-9af0-bbfdcea40fa7" PhonePublisherId="00000000-0000-0000-0000-000000000000" />
  <Properties>
    <DisplayName>Walterlv.ZeroUwp</DisplayName>
    <PublisherDisplayName>walterlv</PublisherDisplayName>
    <Logo>Assets\StoreLogo.png</Logo>
  </Properties>
  <Dependencies>
    <TargetDeviceFamily Name="Windows.Universal" MinVersion="10.0.0.0" MaxVersionTested="10.0.0.0" />
  </Dependencies>
  <Resources>
    <Resource Language="x-generate" />
  </Resources>
  <Applications>
    <Application Id="App" Executable="$targetnametoken$.exe" EntryPoint="Walterlv.ZeroUwp.Program">
      <uap:VisualElements DisplayName="Walterlv.ZeroUwp">
      </uap:VisualElements>
    </Application>
  </Applications>
</Package>
```

可以阅读这些文档了解如何完成这份文件的编写：

- [Identity (Windows 10) - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/uwp/schemas/appxpackage/uapmanifestschema/element-identity)
- [pm:PhoneIdentity (Windows 10) - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/uwp/schemas/appxpackage/uapmanifestschema/element-pm-phoneidentity)

具体来说，`<Identity />` 是此程序包的标识符，需要在整个应用商店范围内唯一（如果将此包与应用商店关联，这个值会自动更新，所以不用在意填成什么）。`<mp:PhoneIdentity />` 是此程序包在移动设备上的标识符，应用的更新会依据此标识符的 GUID 来唯一确定，格式必须是 GUID。

事实上，虽然依然无法完成编译，但此时可以通过在 Visual Studio 中打开这份文件来观察还缺少哪些必要的信息需要填写。

![填写缺少的信息](/static/posts/2018-07-24-21-24-14.png)

事实上，我们缺少的信息并不多，只有四个，都从 Package/Applications/Application 开始：

- uap:VisualElements@Description
- uap:VisualElements@BackgroundColor
- uap:VisualElements@Square150x150Logo
- uap:VisualElements@Square44x44Logo
- uap:VisualElements/uap:DefaultTile@Wide310x150Logo

这是 XPath 语法，详见：[XML 的 XPath 语法](/post/xml-xpath.html)

同时，我们还真的需要相应的图片：

![UWP 程序所需的最少 Logo](/static/posts/2018-07-25-09-27-08.png)

建议从 UWP 程序模板中复制，也可以去这里下载：[UWP 程序所需的最少 Logo 资源-CSDN下载](https://download.csdn.net/download/wpwalter/10562268)。

补充完毕之后，完整的文件如下：

```xml
<?xml version="1.0" encoding="utf-8"?>
<Package xmlns="http://schemas.microsoft.com/appx/manifest/foundation/windows10"
         xmlns:mp="http://schemas.microsoft.com/appx/2014/phone/manifest"
         xmlns:uap="http://schemas.microsoft.com/appx/manifest/uap/windows10"
         xmlns:uap2="http://schemas.microsoft.com/appx/manifest/uap/windows10/2"
         xmlns:uap3="http://schemas.microsoft.com/appx/manifest/uap/windows10/3"
         xmlns:iot="http://schemas.microsoft.com/appx/manifest/iot/windows10"
         xmlns:mobile="http://schemas.microsoft.com/appx/manifest/mobile/windows10"
         IgnorableNamespaces="uap mp uap3 iot uap2 mobile">
  <Identity Name="walterlv.zerouwp" Publisher="CN=walterlv" Version="0.1.0.0" />
  <Properties>
    <DisplayName>Walterlv.ZeroUwp</DisplayName>
    <PublisherDisplayName>walterlv</PublisherDisplayName>
    <Logo>Assets\StoreLogo.png</Logo>
  </Properties>
  <Dependencies>
    <TargetDeviceFamily Name="Windows.Universal" MinVersion="10.0.0.0" MaxVersionTested="10.0.0.0" />
  </Dependencies>
  <Resources>
    <Resource Language="x-generate" />
  </Resources>
  <Applications>
    <Application Id="App" Executable="$targetnametoken$.exe" EntryPoint="Walterlv.ZeroUwp.Program">
      <uap:VisualElements DisplayName="Walterlv.ZeroUwp" Description="Walterlv.ZeroUwp is a demo application to learn how uwp application runs." BackgroundColor="transparent" Square150x150Logo="Assets\Square150x150Logo.png" Square44x44Logo="Assets\Square44x44Logo.png">
        <uap:DefaultTile Wide310x150Logo="Assets\Wide310x150Logo.png">
        </uap:DefaultTile>
      </uap:VisualElements>
    </Application>
  </Applications>
</Package>
```

不能忘掉，这份文件还需要添加到 csproj 项目文件中：

```xml
<!-- 新增了此节点，即 AppxManifest 和相关资源。 -->
  <ItemGroup>
    <AppxManifest Include="Package.appxmanifest">
      <SubType>Designer</SubType>
    </AppxManifest>
    <Content Include="Assets\Square150x150Logo.scale-200.png" />
    <Content Include="Assets\Square44x44Logo.scale-200.png" />
    <Content Include="Assets\StoreLogo.png" />
    <Content Include="Assets\Wide310x150Logo.scale-200.png" />
  </ItemGroup>
```

### 编写 AssemblyInfo.cs

由于没有新的基于 Sdk 的 csproj 文件支持，所以我们需要自己编写 AssemblyInfo.cs 文件，并放入到 Properties 文件夹中。

```csharp
using System.Reflection;
using System.Runtime.InteropServices;

[assembly: AssemblyTitle("Walterlv.Demo.ZeroUwp")]
[assembly: AssemblyProduct("Walterlv.Demo.ZeroUwp")]
[assembly: AssemblyCopyright("Copyright © walterlv 2018")]
[assembly: AssemblyVersion("0.1.0.0")]
[assembly: AssemblyFileVersion("0.1.0.0")]
[assembly: ComVisible(false)]
```

最后，csproj 文件会如下面这样。

```xml
<?xml version="1.0" encoding="utf-8"?>
<Project ToolsVersion="15.0" DefaultTargets="Build" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <Import Project="$(MSBuildExtensionsPath)\$(MSBuildToolsVersion)\Microsoft.Common.props" Condition="Exists('$(MSBuildExtensionsPath)\$(MSBuildToolsVersion)\Microsoft.Common.props')" />
  <PropertyGroup>
    <Configuration Condition=" '$(Configuration)' == '' ">Debug</Configuration>
    <Platform Condition=" '$(Platform)' == '' ">x86</Platform>
    <ProjectGuid>{7B81D14B-6094-44E1-9B2F-F577995A3CAF}</ProjectGuid>
    <OutputType>AppContainerExe</OutputType>
    <AppDesignerFolder>Properties</AppDesignerFolder>
    <RootNamespace>Walterlv.Demo.ZeroUwp</RootNamespace>
    <AssemblyName>Walterlv.Demo.ZeroUwp</AssemblyName>
    <DefaultLanguage>en-US</DefaultLanguage>
    <TargetPlatformIdentifier>UAP</TargetPlatformIdentifier>
    <TargetPlatformVersion Condition=" '$(TargetPlatformVersion)' == '' ">10.0.17134.0</TargetPlatformVersion>
    <TargetPlatformMinVersion>10.0.17134.0</TargetPlatformMinVersion>
    <MinimumVisualStudioVersion>14</MinimumVisualStudioVersion>
    <FileAlignment>512</FileAlignment>
    <ProjectTypeGuids>{A5A43C5B-DE2A-4C0C-9213-0A381AF9435A};{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}</ProjectTypeGuids>
    <WindowsXamlEnableOverview>true</WindowsXamlEnableOverview>
  </PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)|$(Platform)' == 'Debug|x86'">
    <DebugSymbols>true</DebugSymbols>
    <OutputPath>bin\x86\Debug\</OutputPath>
    <DefineConstants>DEBUG;TRACE;NETFX_CORE;WINDOWS_UWP</DefineConstants>
    <NoWarn>;2008</NoWarn>
    <DebugType>full</DebugType>
    <PlatformTarget>x86</PlatformTarget>
    <UseVSHostingProcess>false</UseVSHostingProcess>
    <ErrorReport>prompt</ErrorReport>
    <Prefer32Bit>true</Prefer32Bit>
  </PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)|$(Platform)' == 'Release|x86'">
    <OutputPath>bin\x86\Release\</OutputPath>
    <DefineConstants>TRACE;NETFX_CORE;WINDOWS_UWP</DefineConstants>
    <Optimize>true</Optimize>
    <NoWarn>;2008</NoWarn>
    <DebugType>pdbonly</DebugType>
    <PlatformTarget>x86</PlatformTarget>
    <UseVSHostingProcess>false</UseVSHostingProcess>
    <ErrorReport>prompt</ErrorReport>
    <Prefer32Bit>true</Prefer32Bit>
    <UseDotNetNativeToolchain>true</UseDotNetNativeToolchain>
  </PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)|$(Platform)' == 'Debug|ARM'">
    <DebugSymbols>true</DebugSymbols>
    <OutputPath>bin\ARM\Debug\</OutputPath>
    <DefineConstants>DEBUG;TRACE;NETFX_CORE;WINDOWS_UWP</DefineConstants>
    <NoWarn>;2008</NoWarn>
    <DebugType>full</DebugType>
    <PlatformTarget>ARM</PlatformTarget>
    <UseVSHostingProcess>false</UseVSHostingProcess>
    <ErrorReport>prompt</ErrorReport>
    <Prefer32Bit>true</Prefer32Bit>
  </PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)|$(Platform)' == 'Release|ARM'">
    <OutputPath>bin\ARM\Release\</OutputPath>
    <DefineConstants>TRACE;NETFX_CORE;WINDOWS_UWP</DefineConstants>
    <Optimize>true</Optimize>
    <NoWarn>;2008</NoWarn>
    <DebugType>pdbonly</DebugType>
    <PlatformTarget>ARM</PlatformTarget>
    <UseVSHostingProcess>false</UseVSHostingProcess>
    <ErrorReport>prompt</ErrorReport>
    <Prefer32Bit>true</Prefer32Bit>
    <UseDotNetNativeToolchain>true</UseDotNetNativeToolchain>
  </PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)|$(Platform)' == 'Debug|x64'">
    <DebugSymbols>true</DebugSymbols>
    <OutputPath>bin\x64\Debug\</OutputPath>
    <DefineConstants>DEBUG;TRACE;NETFX_CORE;WINDOWS_UWP</DefineConstants>
    <NoWarn>;2008</NoWarn>
    <DebugType>full</DebugType>
    <PlatformTarget>x64</PlatformTarget>
    <UseVSHostingProcess>false</UseVSHostingProcess>
    <ErrorReport>prompt</ErrorReport>
    <Prefer32Bit>true</Prefer32Bit>
  </PropertyGroup>
  <PropertyGroup Condition="'$(Configuration)|$(Platform)' == 'Release|x64'">
    <OutputPath>bin\x64\Release\</OutputPath>
    <DefineConstants>TRACE;NETFX_CORE;WINDOWS_UWP</DefineConstants>
    <Optimize>true</Optimize>
    <NoWarn>;2008</NoWarn>
    <DebugType>pdbonly</DebugType>
    <PlatformTarget>x64</PlatformTarget>
    <UseVSHostingProcess>false</UseVSHostingProcess>
    <ErrorReport>prompt</ErrorReport>
    <Prefer32Bit>true</Prefer32Bit>
    <UseDotNetNativeToolchain>true</UseDotNetNativeToolchain>
  </PropertyGroup>
  <PropertyGroup>
    <RestoreProjectStyle>PackageReference</RestoreProjectStyle>
  </PropertyGroup>
  <ItemGroup>
    <Compile Include="Properties\AssemblyInfo.cs" />
    <Compile Include="Program.cs" />
    <Compile Include="VisualProperties.cs" />
  </ItemGroup>
  <ItemGroup>
    <AppxManifest Include="Package.appxmanifest">
      <SubType>Designer</SubType>
    </AppxManifest>
    <Content Include="Assets\Square150x150Logo.scale-200.png" />
    <Content Include="Assets\Square44x44Logo.scale-200.png" />
    <Content Include="Assets\StoreLogo.png" />
    <Content Include="Assets\Wide310x150Logo.scale-200.png" />
  </ItemGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.NETCore.UniversalWindowsPlatform">
      <Version>6.1.5</Version>
    </PackageReference>
  </ItemGroup>
  <PropertyGroup Condition=" '$(VisualStudioVersion)' == '' or '$(VisualStudioVersion)' &lt; '14.0' ">
    <VisualStudioVersion>14.0</VisualStudioVersion>
  </PropertyGroup>
  <Import Project="$(MSBuildExtensionsPath)\Microsoft\WindowsXaml\v$(VisualStudioVersion)\Microsoft.Windows.UI.Xaml.CSharp.targets" />
</Project>
```

一个说明：如果运行时出现本机错误，那么可能是上面的 csproj 文件没有配置正确。如果出现下图所示的错误，建议先考虑将以上 csproj 文件中的所有内容复制到你的项目文件中再试。

![本机错误](/static/posts/2018-07-25-09-28-42.png)

### 完成部署和运行

以上所有内容是一个 UWP 程序完成编译并运行所需的最少信息了。

此时运行，我们只会看到一个空的窗口，就像这样：

![空的窗口](/static/posts/2018-07-25-08-57-17.png)

Main 函数中的断点是可以进入的：

![Main 函数中的断点](/static/posts/2018-07-25-09-01-42.png)

不过，如果继续运行，会提示错误。因为我们的程序并没有显示任何 UWP 的界面。

![无法继续运行](/static/posts/2018-07-25-09-02-19.png)

### 总结与后续

在本文中，我们了解到 UWP 项目所需的最少文件有：

- *.csproj 项目文件
    - 这是整个从零开始的 UWP 程序中最复杂的一个文件，因为目前没有找到任何一个 Sdk 支持 UWP 的主程序工程。
- Package.appxmanifest 文件
    - 这是 UWP 应用程序的清单文件。事实上，这不是最终的清单文件，而是用于在项目中填写信息的文件；从前面的错误信息中我们了解到，最终的清单文件是 AppxManifest.xml。
- Assets 文件夹中的四张图片
    - StoreLogo、Square44x44Logo、Square150x150Logo 和 Wide310x150Logo 是清单文件能够正常生成所需的最少 Logo 资源
- AssemblyInfo.cs
    - 由于缺少 Project@Sdk 的支持，所以我们必须编写 AssemblyInfo.cs 文件来指定版本信息。
- Program.cs
    - 这是一开始我们就添加好的文件，就是放 Main 函数的地方。虽然我们什么都没写，但已经能够进入断点了。

接下来我们将从 Main 函数开始，完成一个 UWP 程序的启动：[(2/2) 为了理解 UWP 的启动流程，我从零开始创建了一个 UWP 程序](/post/create-uwp-app-from-zero-1.html)。
