---
title: "在 Target 中获取项目引用的所有依赖（dll/NuGet/Project）的路径"
publishDate: 2019-01-14 15:38:10 +0800
date: 2019-03-04 22:15:01 +0800
tags: msbuild visualstudio
position: knowledge
---

在项目编译成 dll 之前，如何分析项目的所有依赖呢？可以在在项目的 Target 中去收集项目的依赖。

本文将说明如何在 Target 中收集项目依赖的所有 dll 的文件路径。

---

<div id="toc"></div>

## 编写 Target

```xml
<Target Name="WalterlvDemoTarget" BeforeTargets="CoreCompile">
    <Message Text="References:" />
    <Message Text="@(Reference)" />
  </Target>
```

这个 Target 的作用是将项目的所有 `Reference` 节点作为集合输出出来。然而实际上如果真的编译这个项目，会发现我们得到的结果有一些问题：

1. 实际上其值就是写到每一个 Reference 里面的字符串的集合
    - 比如引用了 System.Xaml，那么这里就会是 System.Xaml
1. 如果引用是通过 ProjectReference 进行的项目引用，那么这里就没有目标项目的 dll

所以，我们需要一个新的属性来查找引用的 dll。通过 [研究 Microsoft.NET.Sdk 的源码](/post/read-microsoft-net-sdk)，我发现有 `ReferencePath` 属性可以使用，于是将 Target 改为这样：

```xml
<Target Name="WalterlvDemoTarget" BeforeTargets="CoreCompile;ResolveAssemblyReference">
    <Message Text="ReferencePaths:" />
    <Message Text="@(ReferencePath)" />
  </Target>
```

现在得到的所有依赖字符串则没有以上的问题。

注意，我在 `BeforeTargets` 上增加了一个 `ResolveAssemblyReference`。

## 以上 Target 的输出

引用通常很多，所以我将以上的输出单独放到这里来，避免影响到上面一节知识的阅读。

### Reference 的输出

可以看到，Reference 的输出几乎就是 Reference 中写的字符串本身。

```
CefSharp, Version=57.0.0.0, Culture=neutral, PublicKeyToken=40c4b6fc221f4138, processorArchitecture=x86
CefSharp.Core, Version=57.0.0.0, Culture=neutral, PublicKeyToken=40c4b6fc221f4138, processorArchitecture=x86
CefSharp.WinForms, Version=57.0.0.0, Culture=neutral, PublicKeyToken=40c4b6fc221f4138, processorArchitecture=x86
Microsoft.Expression.Interactions, Version=4.5.0.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35, processorArchitecture=MSIL
System.IO.Compression.FileSystem
System.Windows.Interactivity, Version=4.5.0.0, Culture=neutral, PublicKeyToken=31bf3856ad364e35, processorArchitecture=MSIL
WindowsFormsIntegration
C:\Users\walterlv\.nuget\packages\walterlv.demopackage\1.0.0.0\lib\net47\Walterlv.DemoPackageLibrary.dll
PresentationCore
System.ComponentModel.Composition
System.Configuration
System.Windows.Forms
WindowsBase
PresentationFramework
System.Xaml
System.ServiceModel
System
System.Data
System.Data.DataSetExtensions
System.Management
System.Net.Http
System.Runtime.Serialization
System.ServiceProcess
System.Web
System.Xml
System.Xml.Linq
System.Drawing
Microsoft.CSharp
System.Core
```

### ReferencePath 的输出

可以看到，ReferencePath 则是将所有的 dll 的路径也输出了，而且即便是项目引用，项目编译好的 dll 的路径也在。

```
D:\Walterlv\Demo\Walterlv.Demo\Code\_Externals\Refs\Cef\x86\CefSharp.Core.dll
D:\Walterlv\Demo\Walterlv.Demo\Code\_Externals\Refs\Cef\x86\CefSharp.dll
D:\Walterlv\Demo\Walterlv.Demo\Code\_Externals\Refs\Cef\x86\CefSharp.WinForms.dll
C:\Users\walterlv\.nuget\packages\walterlv.demopackage\1.0.0.0\lib\net47\Walterlv.DemoPackageLibrary.dll
D:\Walterlv\Demo\Walterlv.Demo\Walterlv.Library1\bin\Debug\Walterlv.Library1.dll
D:\Walterlv\Demo\Walterlv.Demo\Walterlv.Library2\bin\Debug\Walterlv.Library2.dll
D:\Walterlv\Demo\Walterlv.Demo\Walterlv.Library3\bin\Debug\Walterlv.Library3.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Microsoft.CSharp.dll
D:\Walterlv\Demo\Walterlv.Demo\Code\_Externals\Refs\Microsoft.Expression.Interactions.dll
C:\Users\walterlv\.nuget\packages\windowsapicodepackshell\1.1.0.8\lib\NET45\Microsoft.WindowsAPICodePack.dll
C:\Users\walterlv\.nuget\packages\windowsapicodepackshell\1.1.0.8\lib\NET45\Microsoft.WindowsAPICodePack.Shell.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\mscorlib.dll
C:\Users\walterlv\.nuget\packages\newtonsoft.json\11.0.2\lib\net45\Newtonsoft.Json.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\PresentationCore.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\PresentationFramework.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\System.ComponentModel.Composition.dll
C:\Users\walterlv\.nuget\packages\system.composition.attributedmodel\1.0.31\lib\portable-net45+win8+wp8+wpa81\System.Composition.AttributedModel.dll
C:\Users\walterlv\.nuget\packages\system.composition.convention\1.0.31\lib\portable-net45+win8+wp8+wpa81\System.Composition.Convention.dll
C:\Users\walterlv\.nuget\packages\system.composition.hosting\1.0.31\lib\portable-net45+win8+wp8+wpa81\System.Composition.Hosting.dll
C:\Users\walterlv\.nuget\packages\system.composition.runtime\1.0.31\lib\portable-net45+win8+wp8+wpa81\System.Composition.Runtime.dll
C:\Users\walterlv\.nuget\packages\system.composition.typedparts\1.0.31\lib\portable-net45+win8+wp8+wpa81\System.Composition.TypedParts.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\System.Configuration.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\System.Core.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\System.Data.DataSetExtensions.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\System.Data.dll
C:\Users\walterlv\.nuget\packages\system.data.sqlite.core\1.0.97\lib\net45\System.Data.SQLite.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\System.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\System.Drawing.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\System.IO.Compression.FileSystem.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\System.Management.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\System.Net.Http.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\System.Runtime.Serialization.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\System.ServiceModel.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\System.ServiceProcess.dll
C:\Users\walterlv\.nuget\packages\system.valuetuple\4.5.0\ref\portable-net40+sl4+win8+wp8\System.ValueTuple.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\System.Web.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\System.Windows.Forms.dll
D:\Walterlv\Demo\Walterlv.Demo\Code\_Externals\Refs\System.Windows.Interactivity.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\System.Xaml.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\System.Xml.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\System.Xml.Linq.dll
C:\Users\walterlv\.nuget\packages\texteditorplus\1.0.0.903\lib\NET45\TextEditorPlus.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\WindowsBase.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\WindowsFormsIntegration.dll
C:\Users\walterlv\.nuget\packages\wpfmediakit\3.0.2.78\lib\NET45\WPFMediaKit.dll
obj\Debug\Interop.IWshRuntimeLibrary.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Collections.Concurrent.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Collections.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.ComponentModel.Annotations.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.ComponentModel.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.ComponentModel.EventBasedAsync.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Diagnostics.Contracts.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Diagnostics.Debug.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Diagnostics.Tools.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Diagnostics.Tracing.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Dynamic.Runtime.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Globalization.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.IO.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Linq.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Linq.Expressions.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Linq.Parallel.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Linq.Queryable.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Net.NetworkInformation.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Net.Primitives.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Net.Requests.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.ObjectModel.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Reflection.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Reflection.Emit.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Reflection.Emit.ILGeneration.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Reflection.Emit.Lightweight.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Reflection.Extensions.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Reflection.Primitives.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Resources.ResourceManager.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Runtime.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Runtime.Extensions.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Runtime.InteropServices.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Runtime.InteropServices.WindowsRuntime.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Runtime.Numerics.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Runtime.Serialization.Json.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Runtime.Serialization.Primitives.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Runtime.Serialization.Xml.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Security.Principal.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.ServiceModel.Duplex.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.ServiceModel.Http.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.ServiceModel.NetTcp.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.ServiceModel.Primitives.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.ServiceModel.Security.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Text.Encoding.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Text.Encoding.Extensions.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Text.RegularExpressions.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Threading.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Threading.Tasks.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Threading.Tasks.Parallel.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Xml.ReaderWriter.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Xml.XDocument.dll
C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETFramework\v4.5\Facades\System.Xml.XmlSerializer.dll
```

## 解读原因

解析引用的 dll 的路径的 Task 是 `ResolveAssemblyReference`，你可以在 [Microsoft.NET.Sdk 文件夹](/post/read-microsoft-net-sdk) 中找到它。如果想知道 Task 是什么意思，可以阅读：[理解 C# 项目 csproj 文件格式的本质和编译流程](/post/understand-the-csproj)。

```xml
<ResolveAssemblyReference
    Assemblies="@(Reference)"
    AssemblyFiles="@(_ResolvedProjectReferencePaths);@(_ExplicitReference)"
    TargetFrameworkDirectories="@(_ReferenceInstalledAssemblyDirectory)"
    InstalledAssemblyTables="@(InstalledAssemblyTables);@(RedistList)"
    IgnoreDefaultInstalledAssemblyTables="$(IgnoreDefaultInstalledAssemblyTables)"
    IgnoreDefaultInstalledAssemblySubsetTables="$(IgnoreInstalledAssemblySubsetTables)"
    CandidateAssemblyFiles="@(Content);@(None)"
    SearchPaths="$(AssemblySearchPaths)"
    AllowedAssemblyExtensions="$(AllowedReferenceAssemblyFileExtensions)"
    AllowedRelatedFileExtensions="$(AllowedReferenceRelatedFileExtensions)"
    TargetProcessorArchitecture="$(ProcessorArchitecture)"
    AppConfigFile="@(_ResolveAssemblyReferencesApplicationConfigFileForExes)"
    AutoUnify="$(AutoUnifyAssemblyReferences)"
    SupportsBindingRedirectGeneration="$(GenerateBindingRedirectsOutputType)"
    IgnoreVersionForFrameworkReferences="$(IgnoreVersionForFrameworkReferences)"
    FindDependencies="$(_FindDependencies)"
    FindSatellites="$(BuildingProject)"
    FindSerializationAssemblies="$(BuildingProject)"
    FindRelatedFiles="$(BuildingProject)"
    Silent="$(ResolveAssemblyReferencesSilent)"
    TargetFrameworkVersion="$(TargetFrameworkVersion)"
    TargetFrameworkMoniker="$(TargetFrameworkMoniker)"
    TargetFrameworkMonikerDisplayName="$(TargetFrameworkMonikerDisplayName)"
    TargetedRuntimeVersion="$(TargetedRuntimeVersion)"
    StateFile="$(ResolveAssemblyReferencesStateFile)"
    InstalledAssemblySubsetTables="@(InstalledAssemblySubsetTables)"
    TargetFrameworkSubsets="@(_ReferenceInstalledAssemblySubsets)"
    FullTargetFrameworkSubsetNames="$(FullReferenceAssemblyNames)"
    FullFrameworkFolders="$(_FullFrameworkReferenceAssemblyPaths)"
    FullFrameworkAssemblyTables="@(FullFrameworkAssemblyTables)"
    ProfileName="$(TargetFrameworkProfile)"
    LatestTargetFrameworkDirectories="@(LatestTargetFrameworkDirectories)"
    CopyLocalDependenciesWhenParentReferenceInGac="$(CopyLocalDependenciesWhenParentReferenceInGac)"
    DoNotCopyLocalIfInGac="$(DoNotCopyLocalIfInGac)"
    ResolvedSDKReferences="@(ResolvedSDKReference)"
    WarnOrErrorOnTargetArchitectureMismatch="$(ResolveAssemblyWarnOrErrorOnTargetArchitectureMismatch)"
    IgnoreTargetFrameworkAttributeVersionMismatch ="$(ResolveAssemblyReferenceIgnoreTargetFrameworkAttributeVersionMismatch)"
    FindDependenciesOfExternallyResolvedReferences="$(FindDependenciesOfExternallyResolvedReferences)"
    ContinueOnError="$(ContinueOnError)"
    Condition="'@(Reference)'!='' or '@(_ResolvedProjectReferencePaths)'!='' or '@(_ExplicitReference)' != ''"
    >

    <Output TaskParameter="ResolvedFiles" ItemName="ReferencePath"/>
    <Output TaskParameter="ResolvedFiles" ItemName="_ResolveAssemblyReferenceResolvedFiles"/>
    <Output TaskParameter="ResolvedDependencyFiles" ItemName="ReferenceDependencyPaths"/>
    <Output TaskParameter="RelatedFiles" ItemName="_ReferenceRelatedPaths"/>
    <Output TaskParameter="SatelliteFiles" ItemName="ReferenceSatellitePaths"/>
    <Output TaskParameter="SerializationAssemblyFiles" ItemName="_ReferenceSerializationAssemblyPaths"/>
    <Output TaskParameter="ScatterFiles" ItemName="_ReferenceScatterPaths"/>
    <Output TaskParameter="CopyLocalFiles" ItemName="ReferenceCopyLocalPaths"/>
    <Output TaskParameter="SuggestedRedirects" ItemName="SuggestedBindingRedirects"/>
    <Output TaskParameter="FilesWritten" ItemName="FileWrites"/>
    <Output TaskParameter="DependsOnSystemRuntime" PropertyName="DependsOnSystemRuntime"/>
    <Output TaskParameter="DependsOnNETStandard" PropertyName="_DependsOnNETStandard"/>
</ResolveAssemblyReference>
```

从这个 Task 中可以看出，它还输出了以下这些属性或集合：

- ReferenceDependencyPaths
- ReferenceSatellitePaths
- ReferenceCopyLocalPaths
    - 这是需要拷贝到本地的那些 dll 的路径（不含框架自带的 dll）
- SuggestedBindingRedirects
- FileWrites
    - 要写入的一些缓存文件
- DependsOnSystemRuntime
    - 以上都是集合，唯独这是一个布尔值，表示是否依赖系统运行时
