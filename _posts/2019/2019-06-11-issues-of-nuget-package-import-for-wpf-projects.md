---
title: "制作通过 NuGet 分发的源代码包时，如果目标项目是 WPF 则会出现一些问题（探索篇，含解决方案）"
date: 2019-06-11 15:30:40 +0800
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

- [将 .NET Core 项目打一个最简单的 NuGet 源码包，安装此包就像直接把源码放进项目一样 - 吕毅](/post/the-simplest-way-to-pack-a-source-code-nuget-package)
- [Roslyn 如何基于 Microsoft.NET.Sdk 制作源代码包 - 林德熙](https://blog.lindexi.com/post/roslyn-%E5%A6%82%E4%BD%95%E5%9F%BA%E4%BA%8E-microsoft.net.sdk-%E5%88%B6%E4%BD%9C%E6%BA%90%E4%BB%A3%E7%A0%81%E5%8C%85)
- [SourceYard 制作源代码包 - 林德熙](https://blog.lindexi.com/post/sourceyard-%E5%88%B6%E4%BD%9C%E6%BA%90%E4%BB%A3%E7%A0%81%E5%8C%85)

这可以避免因为安装 NuGet 包后带来的大量程序集引用，因为程序集数量太多对程序的启动性能有很大的影响：

- [C# 程序集数量对软件启动性能的影响 - 林德熙](https://blog.lindexi.com/post/c-%E7%A8%8B%E5%BA%8F%E9%9B%86%E6%95%B0%E9%87%8F%E5%AF%B9%E8%BD%AF%E4%BB%B6%E5%90%AF%E5%8A%A8%E6%80%A7%E8%83%BD%E7%9A%84%E5%BD%B1%E5%93%8D)

然而制作一个 NuGet 的坑很多，详见：

- [MSBuild/Roslyn 和 NuGet 的 100 个坑](/post/problems-of-msbuild-and-nuget)

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

- [将 .NET Core 项目打一个最简单的 NuGet 源码包，安装此包就像直接把源码放进项目一样 - 吕毅](/post/the-simplest-way-to-pack-a-source-code-nuget-package)

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

### 找出原因

要了解问题到底出在哪里了，我们需要知道 WPF 究竟在编译过程中做了哪些额外的事情。WPF 额外的编译任务主要在 Microsoft.WinFX.targets 文件中。在了解了 WPF 的编译过程之后，这个临时的程序集将非常容易理解。

我写了一篇讲解 WPF 编译过程的博客，在解决这个问题之前，建议阅读这篇博客了解 WPF 是如何进行编译的：

- [WPF 程序的编译过程](/post/how-wpf-assemblies-are-compiled)

在了解了 WPF 程序的编译过程之后，我们知道了前面一些疑问的答案：

1. 那个临时的项目文件是如何生成的；
1. 那个临时项目文件和原始的项目文件有哪些不同；
1. 编译临时项目文件时，哪些编译目标会执行，哪些编译目标不会执行。

在那篇博客中，我们解释到新生成的项目文件会使用 `ReferencePath` 替代其他方式收集到的引用，这就包含项目引用和 NuGet 包的引用。

在使用 `ReferencePath` 的情况下，无论是项目引用还是 NuGet 包引用，都会被换成普通的 dll 引用，因为这个时候目标项目都已经编译完成，包含可以被引用的程序集。

以下是我在示例程序中抓取到的临时生成的项目文件的内容，与原始项目文件之间的差异：

```diff
    <Project Sdk="Microsoft.NET.Sdk.WindowsDesktop">
        <PropertyGroup>
            <OutputType>Exe</OutputType>
            <TargetFramework>net48</TargetFramework>
            <UseWPF>true</UseWPF>
            <GenerateTemporaryTargetAssemblyDebuggingInformation>True</GenerateTemporaryTargetAssemblyDebuggingInformation>
        </PropertyGroup>
        <ItemGroup>
            <PackageReference Include="Walterlv.SourceYard.Demo" Version="0.1.0-alpha" />
        </ItemGroup>
++      <ItemGroup>
++          <ReferencePath Include="C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\mscorlib.dll" />
++          <ReferencePath Include="C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\PresentationCore.dll" />
++          <ReferencePath Include="C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\PresentationFramework.dll" />
++          <ReferencePath Include="C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\System.Core.dll" />
++          <ReferencePath Include="C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\System.Data.dll" />
++          <ReferencePath Include="C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\System.dll" />
++          <ReferencePath Include="C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\System.Drawing.dll" />
++          <ReferencePath Include="C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\System.IO.Compression.FileSystem.dll" />
++          <ReferencePath Include="C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\System.Numerics.dll" />
++          <ReferencePath Include="C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\System.Runtime.Serialization.dll" />
++          <ReferencePath Include="C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\System.Windows.Controls.Ribbon.dll" />
++          <ReferencePath Include="C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\System.Xaml.dll" />
++          <ReferencePath Include="C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\System.Xml.dll" />
++          <ReferencePath Include="C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\System.Xml.Linq.dll" />
++          <ReferencePath Include="C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\UIAutomationClient.dll" />
++          <ReferencePath Include="C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\UIAutomationClientsideProviders.dll" />
++          <ReferencePath Include="C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\UIAutomationProvider.dll" />
++          <ReferencePath Include="C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\UIAutomationTypes.dll" />
++          <ReferencePath Include="C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.8\WindowsBase.dll" />
++      </ItemGroup>
++      <ItemGroup>
++          <Compile Include="D:\Developments\Open\Walterlv.Demo\Walterlv.GettingStarted.SourceYard\Walterlv.GettingStarted.SourceYard.Sample\obj\Debug\net48\Demo.g.cs" />
++      </ItemGroup>
    </Project>
```

你可能已经注意到了我在项目中设置了 `GenerateTemporaryTargetAssemblyDebuggingInformation` 属性，这个属性可以让 WPF 临时生成的项目文件保留下来，便于进行研究和调试。在前面 `GenerateTemporaryTargetAssembly` 的源码部分我们已经贴出了这个属性使用的源码，只是前面我们没有说明其用途。

注意，虽然新生成的项目文件中有 `PackageReference` 来表示包引用，但由于只有 `_CompileTargetNameForLocalType` 指定的编译目标和相关依赖可以被执行，而 NuGet 包中自动 Import 的部分没有加入到依赖项中，所以实际上包中的 `.props` 和 `.targets` 文件都不会被 `Import` 进来，这可能造成部分 NuGet 包在 WPF 项目中不能正常工作。比如本文正片文章都在探索的这个 Bug。

更典型的，就是 SourceYard 项目，这个 Bug 给 SourceYard 造成了不小的困扰：

- [walterlv.demo/Walterlv.GettingStarted.SourceYard at master · walterlv/walterlv.demo](https://github.com/walterlv/walterlv.demo/tree/master/Walterlv.GettingStarted.SourceYard)

### 解决问题

这个问题解决起来其实并不如想象当中那么简单，因为：

1. WPF 项目的编译包含两个编译上下文，一个是正常的编译上下文，另一个是临时生成的项目文件编译的上下文；正常的编译上下文编译到 `MarkupCompilePass1` 和 `MarkupCompilePass2` 之间的 `GenerateTemporaryTargetAssembly` 编译目标时，会插入一段临时项目文件的编译；
1. 临时项目文件的编译中，会执行 `_CompileTargetNameForLocalType` 内部属性指定的编译目标，虽然相当于开放了修改，但由于临时项目文件中不会执行 NuGet 相关的编译目标，所以不会自动 Import NuGet 包中的任何编译目标和属性定义；换句话说，我们几乎没有可以自动 Import 源码的方案。

如果我们强行将 `_CompileTargetNameForLocalType` 替换成我们自己定义的类型会怎么样？

这是通过 NuGet 包中的 .targets 文件中的内容，用来强行替换：

```xml
<Project>

  <PropertyGroup>
    <MSBuildAllProjects>$(MSBuildAllProjects);$(MSBuildThisFileFullPath)</MSBuildAllProjects>
    <_CompileTargetNameForLocalType>_WalterlvCompileTemporaryAssembly</_CompileTargetNameForLocalType>
  </PropertyGroup>

  <Target Name="_WalterlvCompileTemporaryAssembly" />
  
</Project>
```

我们在属性中将临时项目的编译目标改成了我们自己的目标，但会直接出现编译错误，找不到我们定义的编译目标。当然这个编译错误出现在临时生成的程序集上。

![编译错误](/static/posts/2019-06-11-14-21-48.png)

原因就在于这个 .targets 文件没有自动被 Import 进来，于是我们定义的 `_WalterlvCompileTemporaryAssembly` 在临时生成的项目编译中根本就不存在。

我们失去了通过 NuGet 自动被 Import 的时机！

既然我们失去了通过 NuGet 被自动 Import 的时机，那么我们只能另寻它法：

1. 帮助微软修复 NuGet 在 WPF 临时生成的项目中依然可以自动 Import 编译文件 .props 和 .targets；
1. 直接修改项目文件，使其直接或间接 Import 我们希望 Import 进来的编译文件 .props 和 .targets。
1. 寻找其他可以被自动 Import 的时机进行自动 Import；
1. 不管时机了，从 `GenerateTemporaryTargetAssembly` 这个编译任务入手，修改其需要的参数；

#### 方案一：帮助微软修复（等待中）

// TODO：正在组织 issues 和 pull request

无论结果如何，等待微软将这些修改发布也是需要一段时间的，这段时间我们需要使用方案二和方案三来顶替一段时间。

#### 方案二：修改项目文件（可行，但不好）

方案二的其中一种实施方案是下面这篇文章在最后一小节说到的方法：

- [Roslyn 如何基于 Microsoft.NET.Sdk 制作源代码包](https://blog.lindexi.com/post/roslyn-%E5%A6%82%E4%BD%95%E5%9F%BA%E4%BA%8E-microsoft.net.sdk-%E5%88%B6%E4%BD%9C%E6%BA%90%E4%BB%A3%E7%A0%81%E5%8C%85#%E8%A7%A3%E5%86%B3-xaml-%E6%89%BE%E4%B8%8D%E5%88%B0%E6%96%B9%E6%B3%95%E9%97%AE%E9%A2%98)

具体来说，就是修改项目文件，在项目文件的首尾各加上 NuGet 自动生成的那些 Import 来自 NuGet 中的所有编译文件：

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <Import Condition="Exists('obj\$(MSBuildProjectName).csproj.nuget.g.props') " Project="obj\$(MSBuildProjectName).csproj.nuget.g.props" />

  <!-- 项目文件中的原有其他代码。 -->

  <Import Condition="Exists('obj\$(MSBuildProjectName).csproj.nuget.g.targets') " Project="obj\$(MSBuildProjectName).csproj.nuget.g.targets" />
</Project>
```

另外，可以直接在这里 Import 我们 NuGet 包中的编译文件，但这些不如以上方案来得靠谱，因为上面的代码可以使得项目文件的修改完全确定，不用随着开发计算机的不同或者 NuGet 包的数量和版本不同而变化。

如果打算选用方案二，那么上面这种实施方式是最推荐的实施方式。

当然需要注意，此方案的副作用是会多出重复导入的编译警告。在清楚了 WPF 的编译过程之后，是不是能理解了这个警告的原因了呢？是的，对临时项目来说，由于没有自动 Import，所以这里的 Import 不会导致临时项目出现问题；但对于原项目来说，由于默认就会 Import NuGet 中的那两个文件，所以如果再次 Import 就会重复导入。

![重复导入的编译警告](/static/posts/2019-06-11-14-42-19.png)

#### 方案三：寻找其他自动 Import 的时机（不可行）

Directory.Build.props 和 Directory.Build.targets 也是可以被自动 Import 的文件，这也是在 Microsoft.NET.Sdk 中将其自动导入的。

关于这两个文件的自动导入，可以阅读博客：

- [Roslyn 使用 Directory.Build.props 文件定义编译](https://blog.lindexi.com/post/roslyn-%E4%BD%BF%E7%94%A8-directory.build.props-%E6%96%87%E4%BB%B6%E5%AE%9A%E4%B9%89%E7%BC%96%E8%AF%91)

但是，如果我们使用这两个文件帮助自动导入，将造成导入循环，这会形成编译错误！

![因导入循环造成的编译错误](/static/posts/2019-06-11-14-54-57.png)

#### 方案四：设置 GenerateTemporaryTargetAssembly 编译任务

`GenerateTemporaryTargetAssembly` 的代码如下：

```xml
<GenerateTemporaryTargetAssembly
        CurrentProject="$(MSBuildProjectFullPath)"
        MSBuildBinPath="$(MSBuildBinPath)"
        ReferencePathTypeName="ReferencePath"
        CompileTypeName="Compile"
        GeneratedCodeFiles="@(_GeneratedCodeFiles)"
        ReferencePath="@(ReferencePath)"
        IntermediateOutputPath="$(IntermediateOutputPath)"
        AssemblyName="$(AssemblyName)"
        CompileTargetName="$(_CompileTargetNameForLocalType)"
        GenerateTemporaryTargetAssemblyDebuggingInformation="$(GenerateTemporaryTargetAssemblyDebuggingInformation)"
        >

</GenerateTemporaryTargetAssembly>
```

可以看到它的的参数有：

- CurrentProject，传入了 `$(MSBuildProjectFullPath)`，表示项目文件的完全路径，修改无效。
- MSBuildBinPath，传入了 `$(MSBuildBinPath)`，表示 MSBuild 程序的完全路径，修改无效。
- ReferencePathTypeName，传入了字符串常量 `ReferencePath`，这是为了在生成临时项目文件时使用正确的引用路径项的名称。
- CompileTypeName，传入了字符串常量 `Compile`，这是为了在生成临时项目文件时使用正确的编译项的名称。
- GeneratedCodeFiles，传入了 `@(_GeneratedCodeFiles)`，包含生成的代码文件，也就是那些 .g.cs 文件。
- ReferencePath，传入了 `@(ReferencePath)`，也就是目前已收集到的所有引用文件的路径。
- IntermediateOutputPath，传入了 `$(IntermediateOutputPath)`，表示临时输出路径，当使用临时项目文件编译时，生成的临时程序集将放在这个目录中。
- AssemblyName，传入了 `$(AssemblyName)`，表示程序集名称，当生成临时程序集的时候，将参考这个程序集名称。
- CompileTargetName，传入了 `$(_CompileTargetNameForLocalType)`，表示当生成了新的项目文件后，要使用哪个编译目标来编译这个项目。
- GenerateTemporaryTargetAssemblyDebuggingInformation，传入了 `$(GenerateTemporaryTargetAssemblyDebuggingInformation)`，表示是否要为了调试保留临时生成的项目文件和程序集。

可能为我们所用的有：

- `@(_GeneratedCodeFiles)`，我们可以把我们需要 Import 进来的源代码伪装成生成的 .g.cs 文件

好吧，就这一个了。其他的并不会对我们 Import 源代码造成影响。

于是回到我们本文一开始的 Walterlv.SourceYard.Demo.targets 文件，我们将内容修改一下，增加了一个 `_ENSdkImportInTempProject` 编译目标。它在 `MarkupCompilePass1` 之后执行，因为这是 XAML 的第一轮编译，会创造 `_GeneratedCodeFiles` 这个集合，将 XAML 生成 .g.cs 文件；在 `GenerateTemporaryTargetAssembly` 之前执行，因为这里会生成一个新的临时项目，然后立即对其进行编译。我们选用这个之间的时机刚好可以在产生 `_GeneratedCodeFiles` 集合之后修改其内容。

```diff
    <Project>

      <PropertyGroup>
        <MSBuildAllProjects>$(MSBuildAllProjects);$(MSBuildThisFileFullPath)</MSBuildAllProjects>
      </PropertyGroup>

      <Target Name="_WalterlvIncludeSomeCode" BeforeTargets="CoreCompile">
        <ItemGroup>
          <Compile Include="$(MSBuildThisFileDirectory)..\src\Foo.cs" />
        </ItemGroup>
      </Target>
      
++    <Target Name="_ENSdkImportInTempProject" AfterTargets="MarkupCompilePass1" BeforeTargets="GenerateTemporaryTargetAssembly">
++      <ItemGroup>
++        <_GeneratedCodeFiles Include="$(MSBuildThisFileDirectory)..\src\Foo.cs" />
++      </ItemGroup>
++    </Target>
++    
    </Project>
```

现在重新再编译，我们本文一开始疑惑的各种问题，现在终于无警告无错误地解决掉了。

![解决掉的源代码包问题](/static/posts/2019-06-11-15-25-50.png)

## 解决关键

如果你觉得本文略长，希望立刻获得解决办法，可以：

1. 直接使用 “方案四” 中新增的那一段代码；
1. 阅读我的另一篇专门的只说解决方案的博客：[如何为 WPF 项目制作源代码包（SourceYard 基础原理篇，解决 WPF 项目编译问题和 NuGet 包中的各种问题）](/post/build-source-code-nuget-package-for-wpf-projects)

---

**参考资料**

- [msbuild is adding a random hash and wpftmp to my AssemblyName during build - Developer Community](https://developercommunity.visualstudio.com/content/problem/210156/msbuild-is-adding-a-random-hash-and-wpftmp-to-my-a.html)
- [WPF .Targets Files - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/wpf-dot-targets-files)
- [MarkupCompilePass2 Task - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/markupcompilepass2-task)
