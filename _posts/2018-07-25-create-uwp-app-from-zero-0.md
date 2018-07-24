---
title: "(1/2) 为了理解 UWP 的启动流程，我从零开始创建了一个 UWP 程序"
date: 2018-07-24 20:33:23 +0800
categories: uwp
published: false
---



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
using System;

namespace Walterlv.Demo.ZeroUwp
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello World!");
        }
    }
}
```

不过，这两个文件都会被改掉的，已经无所谓里面是什么内容了。

### 将项目改造成 UWP 项目

UWP 程序的输出类型是 `AppContainerExe`，而不是一般的 Library 或者 Exe。

另外，基于 Microsoft.NET.Sdk 的新 csproj 格式不支持 UWP 应用程序，所以我需要借助第三方的 MSBuild.Sdk.Extras 来编译 UWP 的项目。参见 [新 csproj 对 WPF/UWP 支持不太好？有第三方 SDK 可以用！MSBuild.Sdk.Extras](/post/use-msbuild-sdk-extras-for-wpf-and-uwp.html)。

```xml
<Project Sdk="MSBuild.Sdk.Extras/1.6.41">

  <PropertyGroup>
    <OutputType>AppContainerExe</OutputType>
    <TargetFrameworks>uap10.0.17134</TargetFrameworks>
  </PropertyGroup>

</Project>
```

修改了 `TargetFramework` 为 `uap10.0.17134` 之后，我等待了很长的时间等待 17134 的 NuGet 包完成还原。

等 Visual Studio 的还原是可以的，敲命令的还原也是可以的：

```powershell
PS> dotnet restore
```

![还原 NuGet 包](/static/posts/2018-07-24-20-53-20.png)

![NuGet 包还原完成](/static/posts/2018-07-24-20-56-14.png)

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
<Project Sdk="MSBuild.Sdk.Extras/1.6.41">
  <PropertyGroup>
    <OutputType>AppContainerExe</OutputType>
    <TargetFrameworks>uap10.0.17134</TargetFrameworks>
  </PropertyGroup>
  <ItemGroup>
    <AppxManifest Include="Package.appxmanifest" SubType="Designer" />
  </ItemGroup>
</Project>
```

### 完成编译

在以上 AppxManifest 文件完成之后，我们还有其它的编译错误：

> Error	MSB3779	The processor architecture of the project being built "Any CPU" is not supported by the referenced SDK "Microsoft.VCLibs, Version=14.0". Please consider changing the targeted processor architecture of your project (in Visual Studio this can be done through the Configuration Manager) to one of the architectures supported by the SDK: "x86, x64, ARM, ARM64".	Walterlv.Demo.ZeroUwp	C:\Program Files (x86)\Microsoft SDKs\UWPNuGetPackages\microsoft.net.uwpcoreruntimesdk\2.1.2\tools\CoreRuntime\Microsoft.Net.CoreRuntime.targets	136	

也就是说，我们需要将默认的 AnyCPU 编译改成 x86, x64, ARM 或 ARM64。

所以我们在 csproj 中添加 `<PlatformTarget>x86</PlatformTarget>`：

```xml
<Project Sdk="MSBuild.Sdk.Extras/1.6.41">

  <PropertyGroup>
    <OutputType>AppContainerExe</OutputType>
    <TargetFrameworks>uap10.0.17134</TargetFrameworks>
    <PlatformTarget>x86</PlatformTarget>
  </PropertyGroup>

  <ItemGroup>
    <AppxManifest Include="Package.appxmanifest" SubType="Designer" />
  </ItemGroup>

</Project>
```

于是，我们首次真正完成项目的 UWP 改造，因为此时可以编译通过了。

```
1>------ Rebuild All started: Project: Walterlv.Demo.ZeroUwp, Configuration: Debug Any CPU ------
1>Walterlv.Demo.ZeroUwp -> C:\Users\walterlv\OpenSource\Walterlv.Demo.ZeroUwp\bin\Debug\uap10.0.17134\Walterlv.Demo.ZeroUwp.exe
========== Rebuild All: 1 succeeded, 0 failed, 0 skipped ==========
```

### 完成部署和运行

