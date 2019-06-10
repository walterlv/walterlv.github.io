---
title: "制作通过 NuGet 分发的源代码包时，如果目标项目是 WPF 则会出现一些问题"
date: 2019-06-10 19:55:59 +0800
categories: dotnet csharp wpf nuget visualstudio msbuild roslyn
position: problem
---

在使用 NuGet 包来分发源代码时，如果目标项目是 WPF 项目，那么会有一大堆的问题。

本文将这些问题列举出来并进行分析。

---

<div id="toc"></div>

## 源代码包

源代码包不是 NuGet 官方的概念，而是林德熙和我在 GitHub 上做的一个项目，目的是将你的项目以源代码的形式发布成 NuGet 包。在安装此 NuGet 包后，目标项目将获得这些源代码。

你可以通过以下博客了解如何制作一个源代码包。

- [将 .NET Core 项目打一个最简单的 NuGet 源码包，安装此包就像直接把源码放进项目一样 - 吕毅](/post/the-simplest-way-to-pack-a-source-code-nuget-package.html)
- [Roslyn 如何基于 Microsoft.NET.Sdk 制作源代码包 - 林德熙](https://blog.lindexi.com/post/roslyn-%E5%A6%82%E4%BD%95%E5%9F%BA%E4%BA%8E-microsoft.net.sdk-%E5%88%B6%E4%BD%9C%E6%BA%90%E4%BB%A3%E7%A0%81%E5%8C%85)
- [SourceYard 制作源代码包 - 林德熙](https://blog.lindexi.com/post/sourceyard-%E5%88%B6%E4%BD%9C%E6%BA%90%E4%BB%A3%E7%A0%81%E5%8C%85)

这可以避免因为安装 NuGet 包后带来的大量程序集引用，因为程序集数量太多对程序的启动性能有很大的影响：

- [C# 程序集数量对软件启动性能的影响 - 林德熙](https://blog.lindexi.com/post/c-%E7%A8%8B%E5%BA%8F%E9%9B%86%E6%95%B0%E9%87%8F%E5%AF%B9%E8%BD%AF%E4%BB%B6%E5%90%AF%E5%8A%A8%E6%80%A7%E8%83%BD%E7%9A%84%E5%BD%B1%E5%93%8D)

然而制作一个 NuGet 的坑很多，详见：

- [MSBuild/Roslyn 和 NuGet 的 100 个坑](/post/problems-of-msbuild-and-nuget.html)

## 基础代码：最小的例子

为了让 NuGet 源代码包对 WPF 项目问题暴露得更彻底一些，我们需要一个最简单的例子来说明这一问题。我将它放在了我的 Demo 项目中：

- [walterlv.demo/Walterlv.GettingStarted.SourceYard at master · walterlv/walterlv.demo](https://github.com/walterlv/walterlv.demo/tree/master/Walterlv.GettingStarted.SourceYard)

但为了让博客理解起来更顺畅，我还是将关键的源代码贴出来。

### 用于打源代码包的项目 Walterlv.SourceYard.Demo

为了尽可能避免其他因素的影响，我们这个源码包只做这些事情：

1. 包含一个 targets 文件，用于给目标项目引入源代码；
1. 包含一个几乎没有什么代码的 C# 代码文件，用于测试是否正常引入了源代码包；
1. 项目的 csproj 文件，用于控制源代码包的编译过程。

具体来说，我们的目录结构是这样的：

```
- Walterlv.SourceYard.Demo
    - Assets
        - build
            - Package.targets
        - src
            - Foo.cs
```

Walterlv.SourceYard.Demo.targets 中的内容如下：

```xml
<Project>

  <PropertyGroup>
    <MSBuildAllProjects>$(MSBuildAllProjects);$(MSBuildThisFileFullPath)</MSBuildAllProjects>
  </PropertyGroup>

  <Target Name="_WalterlvIncludeSomeCode" BeforeTargets="CoreCompile">
    <ItemGroup>
      <Compile Include="$(MSBuildThisFileDirectory)..\src\Foo.cs" />
    </ItemGroup>
  </Target>
  
</Project>
```

Foo.cs 中的内容如下：

```csharp
using System;

namespace Walterlv.SourceYard
{
    internal class Foo
    {
        public static void Run() => Console.WriteLine("walterlv is a 逗比.");
    }
}
```

而项目文件（csproj）如下：

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>net48</TargetFramework>
    <PackageOutputPath>..\bin\$(Configuration)</PackageOutputPath>
    <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
    <BuildOutputTargetFolder>tools</BuildOutputTargetFolder>
    <PackageRequireLicenseAcceptance>false</PackageRequireLicenseAcceptance>
    <Version>0.1.0-alpha</Version>
    <Authors>walterlv</Authors>
    <Company>dotnet-campus</Company>
  </PropertyGroup>

  <!-- 在编译结束后将需要的源码拷贝到 NuGet 包中 -->
  <Target Name="IncludeAllDependencies" BeforeTargets="_GetPackageFiles">
    <ItemGroup>
      <None Include="Assets\build\Package.targets" Pack="True" PackagePath="build\$(PackageId).targets" />
      <None Include="Assets\src\**" Pack="True" PackagePath="src" />
    </ItemGroup>
  </Target>
  
</Project>
```

这样，编译完成之后，我们可以在 `..\bin\Debug` 目录下找到我们已经生成好的 NuGet 包，其目录结构如下：

```
- Walterlv.SourceYard.Demo.nupkg
    - build
        - Walterlv.SourceYard.Demo.targets
    - src
        - Foo.cs
    - tools
        - net48
            - Walterlv.SourceYard.Demo.dll
```

其中，那个 Walterlv.SourceYard.Demo.dll 完全没有作用。我们是通过项目中设置了属性 `BuildOutputTargetFolder` 让生成的文件跑到这里来的，目的是避免安装此 NuGet 包之后，引用了我们生成的 dll 文件。因为我们要引用的是源代码，而不是 dll。

### 用于验证源代码包的项目 Walterlv.GettingStarted.SourceYard.Sample

现在，我们新建另一个简单的控制台项目用于验证这个 NuGet 包是否正常工作。

项目文件就是很简单的项目文件，只是我们安装了刚刚生成的 NuGet 包 Walterlv.SourceYard.Demo.nupkg。

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net48</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Walterlv.SourceYard.Demo" Version="0.1.0-alpha" />
  </ItemGroup>

</Project>
```

而 Program.cs 文件中的内容很简单，只是简单地调用了我们源码包中的 `Foo.Run()` 方法。

```csharp
using System;
using Walterlv.SourceYard;

namespace Walterlv.GettingStarted.SourceYard.Sample
{
    class Program
    {
        static void Main(string[] args)
        {
            Foo.Run();
            Console.WriteLine("Hello World!");
        }
    }
}
```

### 编译

现在，编译我们的项目，发现完全可以正常编译，就像我在这篇博客中说到的一样：

- [将 .NET Core 项目打一个最简单的 NuGet 源码包，安装此包就像直接把源码放进项目一样 - 吕毅](/post/the-simplest-way-to-pack-a-source-code-nuget-package.html)

但是，事情并不那么简单。接下来全部剩下的都是问题。

## 不可思议的错误

### 普通控制台项目

当我们不进行任何改变，就是以上的代码，对 `Walterlv.GettingStarted.SourceYard.Sample` 项目进行编译（记得提前 `nuget restore`），我们可以得到正常的控制台输出。

注意，我使用了 `msbuild /t:Rebuild` 命令，在编译前进行清理。

```powershell
PS D:\Walterlv.Demo\Walterlv.GettingStarted.SourceYard.Sample> msbuild /t:Rebuild
用于 .NET Framework 的 Microsoft (R) 生成引擎版本 16.1.76+g14b0a930a7
版权所有(C) Microsoft Corporation。保留所有权利。

生成启动时间为 2019/6/10 17:32:50。
项目“D:\Walterlv.Demo\Walterlv.GettingStarted.SourceYard.Sample\Walt
erlv.GettingStarted.SourceYard.Sample.csproj”在节点 1 上(Rebuild 个目标)。
_CheckForNETCoreSdkIsPreview:
C:\Program Files\dotnet\sdk\3.0.100-preview5-011568\Sdks\Microsoft.NET.Sdk\targets\Microsoft.NET.RuntimeIdentifierInfer
ence.targets(157,5): message NETSDK1057: 你正在使用 .NET Core 的预览版。请查看 https://aka.ms/dotnet-core-preview [D:\Walterlv.Demo\Walterlv.GettingStarted.SourceYard.Sample\Walterlv.GettingStarted.
SourceYard.Sample.csproj]
CoreClean:
  正在创建目录“obj\Debug\net48\”。
PrepareForBuild:
  正在创建目录“bin\Debug\net48\”。
GenerateBindingRedirects:
  ResolveAssemblyReferences 中没有建议的绑定重定向。
GenerateTargetFrameworkMonikerAttribute:
正在跳过目标“GenerateTargetFrameworkMonikerAttribute”，因为所有输出文件相对于输入文件而言都是最新的。
CoreCompile:
  C:\Program Files (x86)\Microsoft Visual Studio\2019\Professional\MSBuild\Current\Bin\Roslyn\csc.exe /noconfig /unsafe
  - /checked- /nowarn:1701,1702,1701,1702 /nostdlib+ /platform:AnyCPU /errorreport:prompt /warn:4 /define:TRACE;DEBUG;N
  ETFRAMEWORK;NET48 /highentropyva+ /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFra
  mework\v4.8\mscorlib.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v
  4.8\System.Core.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\S
  ystem.Data.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\System
  .dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\System.Drawing.d
  ll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\System.IO.Compress
  ion.FileSystem.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\Sy
  stem.Numerics.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\Sys
  tem.Runtime.Serialization.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramew
  ork\v4.8\System.Xml.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4
  .8\System.Xml.Linq.dll" /debug+ /debug:portable /filealign:512 /optimize- /out:obj\Debug\net48\Walterlv.GettingStarte
  d.SourceYard.Sample.exe /ruleset:"C:\Program Files (x86)\Microsoft Visual Studio\2019\Professional\Team Tools\Static
  Analysis Tools\\Rule Sets\MinimumRecommendedRules.ruleset" /subsystemversion:6.00 /target:exe /warnaserror- /utf8outp
  ut /deterministic+ Program.cs "C:\Users\lvyi\AppData\Local\Temp\.NETFramework,Version=v4.8.AssemblyAttributes.cs" C:\
  Users\lvyi\.nuget\packages\walterlv.sourceyard.demo\0.1.0-alpha\build\..\src\Foo.cs obj\Debug\net48\Walterlv.GettingS
  tarted.SourceYard.Sample.AssemblyInfo.cs /warnaserror+:NU1605
  对来自后列目录的编译器使用共享编译: C:\Program Files (x86)\Microsoft Visual Studio\2019\Professional\MSBuild\Current\Bin\Roslyn
_CopyAppConfigFile:
  正在将文件从“D:\Developments\Open\Walterlv.Demo\Walterlv.GettingStarted.SourceYard\Walterlv.GettingStarted.SourceYard.Sampl
  e\obj\Debug\net48\Walterlv.GettingStarted.SourceYard.Sample.exe.withSupportedRuntime.config”复制到“D:\Developments\Open\
  Walterlv.Demo\Walterlv.GettingStarted.SourceYard\Walterlv.GettingStarted.SourceYard.Sample\bin\Debug\net48\Walterlv.G
  ettingStarted.SourceYard.Sample.exe.config”。
CopyFilesToOutputDirectory:
  正在将文件从“D:\Developments\Open\Walterlv.Demo\Walterlv.GettingStarted.SourceYard\Walterlv.GettingStarted.SourceYard.Sampl
  e\obj\Debug\net48\Walterlv.GettingStarted.SourceYard.Sample.exe”复制到“D:\Developments\Open\Walterlv.Demo\Walterlv.Getti
  ngStarted.SourceYard\Walterlv.GettingStarted.SourceYard.Sample\bin\Debug\net48\Walterlv.GettingStarted.SourceYard.Sam
  ple.exe”。
  Walterlv.GettingStarted.SourceYard.Sample -> D:\Developments\Open\Walterlv.Demo\Walterlv.GettingStarted.SourceYard\Wa
  lterlv.GettingStarted.SourceYard.Sample\bin\Debug\net48\Walterlv.GettingStarted.SourceYard.Sample.exe
  正在将文件从“D:\Developments\Open\Walterlv.Demo\Walterlv.GettingStarted.SourceYard\Walterlv.GettingStarted.SourceYard.Sampl
  e\obj\Debug\net48\Walterlv.GettingStarted.SourceYard.Sample.pdb”复制到“D:\Developments\Open\Walterlv.Demo\Walterlv.Getti
  ngStarted.SourceYard\Walterlv.GettingStarted.SourceYard.Sample\bin\Debug\net48\Walterlv.GettingStarted.SourceYard.Sam
  ple.pdb”。
已完成生成项目“D:\Developments\Open\Walterlv.Demo\Walterlv.GettingStarted.SourceYard\Walterlv.GettingStarted.SourceYard.Sample
\Walterlv.GettingStarted.SourceYard.Sample.csproj”(Rebuild 个目标)的操作。


已成功生成。
    0 个警告
    0 个错误

已用时间 00:00:00.59
```

当然，贴一张图片可能更能体现编译通过：

![可以编译通过](/static/posts/2019-06-10-17-45-21.png)

上面的输出非常多，但我们提取一下关键的点：

1. 有输出的 Target 有这些：`CoreClean` -> `PrepareForRebuild` -> `GenerateBindingRedirects` -> `GenerateTargetFrameworkMonikerAttribute` -> `CoreCompile` -> `_CopyAppConfigFile` -> `CopyFilesToOutputDirectory`。
1. 在 CoreCompile 这个编译任务里面，所有需要编译的 C# 代码有这些：`Program.cs "C:\Users\lvyi\AppData\Local\Temp\.NETFramework,Version=v4.8.AssemblyAttributes.cs" C:\  Users\lvyi\.nuget\packages\walterlv.sourceyard.demo\0.1.0-alpha\build\..\src\Foo.cs obj\Debug\net48\Walterlv.GettingStarted.SourceYard.Sample.AssemblyInfo.cs`。

可以注意到，编译期间成功将 `Foo.cs` 文件加入了编译。

### WPF 项目

现在，我们将我们的项目升级成 WPF 项目。编辑项目文件。

```diff
--  <Project Sdk="Microsoft.NET.Sdk">
++  <Project Sdk="Microsoft.NET.Sdk.WindowsDesktop">

    <PropertyGroup>
        <OutputType>Exe</OutputType>
        <TargetFramework>net48</TargetFramework>
++      <UseWPF>true</UseWPF>
    </PropertyGroup>

    <ItemGroup>
        <PackageReference Include="Walterlv.SourceYard.Demo" Version="0.1.0-alpha" />
    </ItemGroup>

    </Project>
```

现在编译，依然不会出现任何问题，跟控制台程序一模一样。

但一旦在你的项目中放上一个 XAML 文件，问题立刻变得不一样了。

```xml
<UserControl x:Class="Walterlv.GettingStarted.SourceYard.Sample.DemoControl"
             xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
             xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
             xmlns:local="clr-namespace:Walterlv.GettingStarted.SourceYard.Sample">
</UserControl>
```

```powershell
PS D:\Walterlv.Demo\Walterlv.GettingStarted.SourceYard.Sample> msbuild /t:Rebuild
用于 .NET Framework 的 Microsoft (R) 生成引擎版本 16.1.76+g14b0a930a7
版权所有(C) Microsoft Corporation。保留所有权利。

生成启动时间为 2019/6/10 17:43:18。
项目“D:\Walterlv.Demo\Walterlv.GettingStarted.SourceYard.Sample\Walt
erlv.GettingStarted.SourceYard.Sample.csproj”在节点 1 上(Rebuild 个目标)。
_CheckForNETCoreSdkIsPreview:
C:\Program Files\dotnet\sdk\3.0.100-preview5-011568\Sdks\Microsoft.NET.Sdk\targets\Microsoft.NET.RuntimeIdentifierInfer
ence.targets(157,5): message NETSDK1057: 你正在使用 .NET Core 的预览版。请查看 https://aka.ms/dotnet-core-preview [D:\Walterlv.Demo\Walterlv.GettingStarted.SourceYard.Sample\Walterlv.GettingStarted.
SourceYard.Sample.csproj]
CoreClean:
  正在删除文件“D:\Developments\Open\Walterlv.Demo\Walterlv.GettingStarted.SourceYard\Walterlv.GettingStarted.SourceYard.Sampl
  e\obj\Debug\net48\Walterlv.GettingStarted.SourceYard.Sample.csprojAssemblyReference.cache”。
  正在删除文件“D:\Developments\Open\Walterlv.Demo\Walterlv.GettingStarted.SourceYard\Walterlv.GettingStarted.SourceYard.Sampl
  e\obj\Debug\net48\Demo.g.cs”。
  正在删除文件“D:\Developments\Open\Walterlv.Demo\Walterlv.GettingStarted.SourceYard\Walterlv.GettingStarted.SourceYard.Sampl
  e\obj\Debug\net48\Walterlv.GettingStarted.SourceYard.Sample_MarkupCompile.cache”。
  正在删除文件“D:\Developments\Open\Walterlv.Demo\Walterlv.GettingStarted.SourceYard\Walterlv.GettingStarted.SourceYard.Sampl
  e\obj\Debug\net48\Walterlv.GettingStarted.SourceYard.Sample_MarkupCompile.lref”。
GenerateBindingRedirects:
  ResolveAssemblyReferences 中没有建议的绑定重定向。
项目“D:\Developments\Open\Walterlv.Demo\Walterlv.GettingStarted.SourceYard\Walterlv.GettingStarted.SourceYard.Sample\Walt
erlv.GettingStarted.SourceYard.Sample.csproj”(1)正在节点 1 上生成“D:\Developments\Open\Walterlv.Demo\Walterlv.GettingStarted.S
ourceYard\Walterlv.GettingStarted.SourceYard.Sample\Walterlv.GettingStarted.SourceYard.Sample_vobqk5lg_wpftmp.csproj”(2
) (_CompileTemporaryAssembly 个目标)。
CoreCompile:
  C:\Program Files (x86)\Microsoft Visual Studio\2019\Professional\MSBuild\Current\Bin\Roslyn\csc.exe /noconfig /unsafe
  - /checked- /nowarn:1701,1702,1701,1702 /nostdlib+ /platform:AnyCPU /errorreport:prompt /warn:4 /define:TRACE;DEBUG;N
  ETFRAMEWORK;NET48 /highentropyva+ /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFra
  mework\v4.8\mscorlib.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v
  4.8\PresentationCore.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v
  4.8\PresentationFramework.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramew
  ork\v4.8\System.Core.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v
  4.8\System.Data.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\S
  ystem.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\System.Draw
  ing.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\System.IO.Com
  pression.FileSystem.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4
  .8\System.Numerics.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.
  8\System.Runtime.Serialization.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETF
  ramework\v4.8\System.Windows.Controls.Ribbon.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\F
  ramework\.NETFramework\v4.8\System.Xaml.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framew
  ork\.NETFramework\v4.8\System.Xml.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.N
  ETFramework\v4.8\System.Xml.Linq.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NE
  TFramework\v4.8\UIAutomationClient.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.
  NETFramework\v4.8\UIAutomationClientsideProviders.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Micros
  oft\Framework\.NETFramework\v4.8\UIAutomationProvider.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\Mi
  crosoft\Framework\.NETFramework\v4.8\UIAutomationTypes.dll" /reference:"C:\Program Files (x86)\Reference Assemblies\M
  icrosoft\Framework\.NETFramework\v4.8\WindowsBase.dll" /debug+ /debug:portable /filealign:512 /optimize- /out:obj\Deb
  ug\net48\Walterlv.GettingStarted.SourceYard.Sample.exe /ruleset:"C:\Program Files (x86)\Microsoft Visual Studio\2019\
  Professional\Team Tools\Static Analysis Tools\\Rule Sets\MinimumRecommendedRules.ruleset" /subsystemversion:6.00 /tar
  get:exe /warnaserror- /utf8output /deterministic+ Program.cs D:\Developments\Open\Walterlv.Demo\Walterlv.GettingStart
  ed.SourceYard\Walterlv.GettingStarted.SourceYard.Sample\obj\Debug\net48\Demo.g.cs obj\Debug\net48\Walterlv.GettingSta
  rted.SourceYard.Sample_vobqk5lg_wpftmp.AssemblyInfo.cs /warnaserror+:NU1605
  对来自后列目录的编译器使用共享编译: C:\Program Files (x86)\Microsoft Visual Studio\2019\Professional\MSBuild\Current\Bin\Roslyn
Program.cs(2,16): error CS0234: 命名空间“Walterlv”中不存在类型或命名空间名“SourceYard”(是否缺少程序集引用?) [D:\Developments\Open\Walterlv.Demo\
Walterlv.GettingStarted.SourceYard\Walterlv.GettingStarted.SourceYard.Sample\Walterlv.GettingStarted.SourceYard.Sample_
vobqk5lg_wpftmp.csproj]
已完成生成项目“D:\Developments\Open\Walterlv.Demo\Walterlv.GettingStarted.SourceYard\Walterlv.GettingStarted.SourceYard.Sample
\Walterlv.GettingStarted.SourceYard.Sample_vobqk5lg_wpftmp.csproj”(_CompileTemporaryAssembly 个目标)的操作 - 失败。

已完成生成项目“D:\Developments\Open\Walterlv.Demo\Walterlv.GettingStarted.SourceYard\Walterlv.GettingStarted.SourceYard.Sample
\Walterlv.GettingStarted.SourceYard.Sample.csproj”(Rebuild 个目标)的操作 - 失败。


生成失败。

“D:\Developments\Open\Walterlv.Demo\Walterlv.GettingStarted.SourceYard\Walterlv.GettingStarted.SourceYard.Sample\Walter
lv.GettingStarted.SourceYard.Sample.csproj”(Rebuild 目标) (1) ->
“D:\Developments\Open\Walterlv.Demo\Walterlv.GettingStarted.SourceYard\Walterlv.GettingStarted.SourceYard.Sample\Walter
lv.GettingStarted.SourceYard.Sample_vobqk5lg_wpftmp.csproj”(_CompileTemporaryAssembly 目标) (2) ->
(CoreCompile 目标) ->
  Program.cs(2,16): error CS0234: 命名空间“Walterlv”中不存在类型或命名空间名“SourceYard”(是否缺少程序集引用?) [D:\Developments\Open\Walterlv.Dem
o\Walterlv.GettingStarted.SourceYard\Walterlv.GettingStarted.SourceYard.Sample\Walterlv.GettingStarted.SourceYard.Sampl
e_vobqk5lg_wpftmp.csproj]

    0 个警告
    1 个错误

已用时间 00:00:00.87
```

因为上面有编译错误但看不出来，所以我们贴一张图，可以很容易看出来有编译错误。

![出现编译错误](/static/posts/2019-06-10-17-44-40.png)

并且，如果对比两张图，会发现 CoreCompile 中的内容已经不一样了。变化主要是 `/reference` 参数和要编译的文件列表参数。

`/reference` 参数增加了 WPF 需要的库。

```diff
    mscorelib.dll
++  PresentationCore.dll
++  PresentationFramework.dll
    System.Core.dll
    System.Data.dll
    System.dll
    System.Drawing.dll
    System.IO.Compression.FileSystem.dll
    System.Numerics.dll
    System.Runtime.Serialization.dll
++  System.Windows.Controls.Ribbon.dll
++  System.Xaml.dll
    System.Xml.dll
    System.Xml.Linq.dll
++  UIAutomationClient.dll
++  UIAutomationClientsideProviders.dll
++  UIAutomationProvider.dll
++  UIAutomationTypes.dll
++  WindowsBase.dll
```

但是要编译的文件却既有新增，又有减少：

```diff
    Program.cs
++  D:\Developments\Open\Walterlv.Demo\Walterlv.GettingStarted.SourceYard\Walterlv.GettingStarted.SourceYard.Sample\obj\Debug\net48\Demo.g.cs
--  "C:\Users\lvyi\AppData\Local\Temp\.NETFramework,Version=v4.8.AssemblyAttributes.cs"
--  C:\Users\lvyi\.nuget\packages\walterlv.sourceyard.demo\0.1.0-alpha\build\..\src\Foo.cs
--  obj\Debug\net48\Walterlv.GettingStarted.SourceYard.Sample.AssemblyInfo.cs
++  obj\Debug\net48\Walterlv.GettingStarted.SourceYard.Sample_vobqk5lg_wpftmp.AssemblyInfo.cs
```

同时，我们还能注意到还临时生成了一个新的项目文件：

> 项目“D:\Walterlv.Demo\Walterlv.GettingStarted.SourceYard.Sample\Walterlv.GettingStarted.SourceYard.Sample.csproj”(1)正在节点 1 上生成“D:\Walterlv.Demo\Walterlv.GettingStarted.SourceYard.Sample\Walterlv.GettingStarted.SourceYard.Sample_vobqk5lg_wpftmp.csproj”(2) (_CompileTemporaryAssembly 个目标)。

新的项目文件有一个后缀 `_vobqk5lg_wpftmp`，同时我们还能注意到编译的 `AssemblyInfo.cs` 文件前面也有相同的后缀 `_vobqk5lg_wpftmp`：

- $(项目名)_$(随机字符)_wpftmp.csproj
- $(项目名)_$(随机字符)_wpftmp.AssemblyInfo.cs

我们几乎可以认为，当项目是编译成 WPF 时，执行了不同的编译流程。

## 修复错误

