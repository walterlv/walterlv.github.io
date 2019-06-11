---
title: "WPF 程序的编译过程"
date: 2019-06-11 16:05:03 +0800
categories: wpf dotnet csharp msbuild visualstudio roslyn
position: knowledge
---

基于 Sdk 的项目进行编译的时候，会使用 Sdk 中附带的 props 文件和 targets 文件对项目进行编译。Microsoft.NET.Sdk.WindowsDesktop 的 Sdk 包含 WPF 项目的编译过程。

而本文介绍 WPF 项目的编译过程，包含 WPF 额外为编译过程添加的那些扩展编译目标，以及这些扩展的编译目标如何一步步完成 WPF 项目的过程。

---

<div id="toc"></div>

## 提前准备

在阅读本文之前，你可能需要提前了解编译过程到底是怎样的。可以阅读：

- [理解 C# 项目 csproj 文件格式的本质和编译流程](/post/understand-the-csproj.html)

如果你不明白上面文章中的一些术语（例如 Target / Task），可能不能理解本文后面的内容。

另外，除了本文所涉及的内容之外，你也可以自己探索编译过程：

- [解读 Microsoft.NET.Sdk 的源码，你能定制各种奇怪而富有创意的编译过程](/post/read-microsoft-net-sdk.html)

WPF 的编译代码都在 Microsoft.WinFx.targets 文件中，你可以通过上面这一篇博客找到这个文件。接下来，我们会一一介绍这个文件里面的编译目标（Target），然后统一说明这些 Target 是如何协同工作，将 WPF 程序编译出来的。

Microsoft.WinFx.targets 的源码可以查看：

- [wpf/Microsoft.WinFx.targets at master · dotnet/wpf](https://github.com/dotnet/wpf/blob/master/src/Microsoft.DotNet.Wpf/src/PresentationBuildTasks/Microsoft.WinFx.targets)

## Target

WPF 在编译期间会执行以下这些 Target，当然 Target 里面实际用于执行任务的是 Task。

知道 Target 名称的话，你可以扩展 WPF 的编译过程；而知道 Task 名称的话，可以帮助理解编译过程实际做的事情。

本文都会列举出来。

### FileClassification

- Target 名称：`FileClassification`
- Task 名称：`FileClassifier`

用于将资源嵌入到程序集。如果资源没有本地化，则嵌入到主程序集；如果有本地化，则嵌入到附属程序集。

在 WPF 项目中，这个 Target 是一定会执行的；但里面的 Task 则是有 `Resource` 类型的编译项的时候才会执行。

### GenerateTemporaryTargetAssembly

Target 名称和 Task 名称相同，都是 `GenerateTemporaryTargetAssembly`。

只要项目当中包含任何一个生成类型为 Page 的 XAML 文件，则会执行此 Target。

关于生成临时程序集的原因比较复杂，可以阅读本文后面的 WPF 程序的编译过程部分来了解。

### MarkupCompilePass1

Target 名称和 Task 名称相同，都是 `MarkupCompilePass1`。

将非本地化的 XAML 文件编译成二进制格式。

### MarkupCompilePass2

Target 名称和 Task 名称相同，都是 `MarkupCompilePass2`。

对 XAML 文件进行第二轮编译，而这一次会引用同一个程序集中的类型。

### DesignTimeMarkupCompilation

这是一个仅在有设计器执行时才会执行的 Target，当这个编译目标执行时，将会直接调用 `MarkupCompilePass1`。

实际上，如果在 Visual Studio 中编译项目，则会调用到这个 Target。而判断是否在 Visual Studio 中编译的方法可以参见：

- [MSBuild 在编写编译任务的时候判断当前是否在 Visual Studio 中编译](/post/determine-building-in-visual-studio-during-building.html)

```xml
<Target Name="DesignTimeMarkupCompilation">

    <!-- Only if we are not actually performing a compile i.e. we are in design mode -->
    <CallTarget Condition="'$(BuildingProject)' != 'true'"
                Targets="MarkupCompilePass1" />
</Target>
```

### MergeLocalizationDirectives

Target 名称和 Task 名称相同，都是 `MergeLocalizationDirectives`。

将本地化属性和一个或多个 XAML 二进制格式文件的注释合并到整个程序集的单一文件中。

```xml
<Target Name="MergeLocalizationDirectives"
        Condition="'@(GeneratedLocalizationFiles)' !=''"
        Inputs="@(GeneratedLocalizationFiles)"
        Outputs="$(IntermediateOutputPath)$(AssemblyName).loc"
>
    <MergeLocalizationDirectives GeneratedLocalizationFiles="@(GeneratedLocalizationFiles)"
                                OutputFile="$(IntermediateOutputPath)$(AssemblyName).loc"/>

    <!--
        Add the merged loc file into _NoneWithTargetPath so that it will be copied to the
        output directory
    -->
    <CreateItem Condition="Exists('$(IntermediateOutputPath)$(AssemblyName).loc')"
                Include="$(IntermediateOutputPath)$(AssemblyName).loc"
                AdditionalMetadata="CopyToOutputDirectory=PreserveNewest; TargetPath=$(AssemblyName).loc" >
        <Output ItemName="_NoneWithTargetPath" TaskParameter="Include"/>
        <Output ItemName="FileWrites" TaskParameter="Include"/>

    </CreateItem>

</Target>
```

### MainResourcesGeneration、SatelliteResourceGeneration

- Target 有两个，`MainResourcesGeneration` 和 `SatelliteResourceGeneration`，分别负责主资源生成和附属资源生成。
- Task 名称：`ResourcesGenerator`

将一个或多个资源（二进制格式的 .jpg、.ico、.bmp、XAML 以及其他扩展名类型）嵌入 .resources 文件中。

### CheckUid、UpdateUid、RemoveUid

- Target 有三个，`CheckUid`、`UpdateUid` 和 `RemoveUid`，分别负责主资源生成和附属资源生成。
- Task 名称：`ResourcesGenerator`

检查、更新或移除 UID，以便将 XAML 文件中所有的 XAML 元素进行本地化。


```xml
<Target Name="CheckUid"
        Condition="'@(Page)' != '' or '@(ApplicationDefinition)' != ''">

    <UidManager MarkupFiles="@(Page);@(ApplicationDefinition)" Task="Check" />

</Target>
```

```xml
<Target Name="UpdateUid"
        Condition="'@(Page)' != '' or '@(ApplicationDefinition)' != ''">

    <UidManager MarkupFiles="@(Page);
                            @(ApplicationDefinition)"
                IntermediateDirectory ="$(IntermediateOutputPath)"
                Task="Update" />

</Target>
```

```xml
<Target Name="RemoveUid"
        Condition="'@(Page)' != '' or '@(ApplicationDefinition)' != ''">
    <UidManager MarkupFiles="@(Page);
                            @(ApplicationDefinition)"

                IntermediateDirectory ="$(IntermediateOutputPath)"
                Task="Remove" />

</Target>
```

### UpdateManifestForBrowserApplication

当编译基于 XAML 的浏览器项目的时候，会给 manifest 文件中添加一个配置 `<hostInBrowser />`。

## WPF 程序的编译过程

### 编译过程图示

上面列举出来的那些 Target 主要是 WPF 几个关键的 Target，在实际编译时会有更多编译 Target 执行。另外有些也不在常规的编译过程中，而是被专门的编译过程执行。

![WPF 程序的编译过程](/static/posts/2019-06-11-11-32-30.png)

图的阅读方法是这样的：

1. 箭头代表依赖关系，如 `CoreCompile` 有一个指向 `DesignTimeMarkupCompilation` 的箭头，表示 `CoreCompile` 执行前会确保 `DesignTimeMarkupCompilation` 执行完毕；
1. 如果一个 Target 有多个依赖，则这些依赖会按顺序执行还没执行的依赖，如 `PrepareResources` 指向了多个 Target `MarkupCompilePass1`、`GenerateTemporaryTargetAssembly`、`MarkupCompilePass2`、`AfterMarkupCompilePass2`、`CleanupTemporaryTargetAssembly`，那么在 `PrepareResources` 执行之前，如果还有没有执行的依赖，会按顺序依次执行；
1. WPF 所有的 Target 扩展都是通过依赖来指定的，也就是说必须基于现有的核心编译过程，图中从绿色或黄色的节点向前倒退的所有依赖都会被执行。

各种颜色代表的含义：

- 蓝色，表示 WPF 扩展的 Target
- 浅蓝色，表示 WPF 扩展的 Target，但是没有执行任何实际的任务，只是提供一个扩展点
- 绿色，表示核心的编译过程，但是被 WPF 编译过程重写了
- 黄色，表示核心的编译过程（即便不是 WPF 程序也会执行的 Target）
- 浅黄色，表示在这张图里面不关心的 Target（不然整个画下来就太多了）
- 紫色，仅在 Visual Studio 编译期间会执行的 WPF 扩展的 Target

### 编译过程描述

我们都知道 XAML 是可以引用 CLR 类型的；如果 XAML 所引用的 CLR 类型在其他被引用的程序集，那么编译 XAML 的时候就可以直接引用这些程序集，因为他们已经编译好了。

但是我们也知道，XAML 还能引用同一个程序集中的 CLR 类型，而此时这个程序集还没有编译，XAML 编译过程并不知道可以如何使用这些类型。同时我们也知道 CLR 类型可是使用 XAML 生成的类型，如果 XAML 没有编译，那么 CLR 类型也无法正常完成编译。这是矛盾的，这也是 WPF 扩展的编译过程会比较复杂的原因之一。

WPF 编译过程有两个编译传递，`MarkupCompilePass1` 和 `MarkupCompilePass2`。

`MarkupCompilePass1` 的作用是将 XAML 编译成二进制格式。如果 XAML 文件包含 `x:Class` 属性，那么就会根据语言生成一份代码文件；对于 C# 语言，会生成“文件名.g.cs”文件。但是 XAML 文件中也有可能包含对同一个程序集中的 CLR 类型的引用，然而这一编译阶段 CLR 类型还没有开始编译，因此无法提供程序集引用。所以如果这个 XAML 文件包含对同一个程序集中 CLR 类型的引用，则这个编译会被推迟到 `MarkupCompilePass2` 中继续。而在 `MarkupCompilePass1` 和 `MarkupCompilePass2` 之间，则插入了 `GenerateTemporaryTargetAssembly` 这个编译目标。

`GenerateTemporaryTargetAssembly` 的作用是生成一个临时的程序集，这个临时的程序集中包含了 `MarkupCompilePass1` 推迟到 `MarkupCompilePass2` 中编译时需要的 CLR 类型。这样，在 `MarkupCompilePass2` 执行的时候，会获得一个包含原本在统一程序集的 CLR 类型的临时程序集引用，这样就可以继续完成 XAML 格式的编译了。在 `MarkupCompilePass2` 编译完成之后，XAML 文件就完全编译完成了。之后，会执行 `CleanupTemporaryTargetAssembly` 清除之前临时编译的程序集。

编译临时程序集时，会生成一个新的项目文件，名字如：`$(项目名)_$(随机字符)_wpftmp.csproj`，在与原项目相同的目录下。

在需要编译一个临时程序集的时候，`CoreCompile` 这样的用于编译 C# 代码文件的编译目标会执行两次，第一次是编译这个临时生成的项目，而第二次才是编译原本的项目。

现在，我们看一段 WPF 程序的编译输出，可以看到看到这个生成临时程序集的过程。

![生成临时项目和程序集](/static/posts/2019-06-11-12-38-40.png)

随后，就是正常的其他的编译过程。

### 关于临时生成程序集

在 WPF 的编译过程中，我想单独将临时生成程序集的部分进行特别说明。因为如果你不了解这一部分的细节，可能在未来的使用中遇到一些临时生成程序集相关的坑。

下面这几篇博客就是在讨论其中的一些坑：

- [制作通过 NuGet 分发的源代码包时，如果目标项目是 WPF 则会出现一些问题](/post/issues-of-nuget-package-import-for-wpf-projects.html)
- [Roslyn 如何基于 Microsoft.NET.Sdk 制作源代码包](https://blog.lindexi.com/post/roslyn-%E5%A6%82%E4%BD%95%E5%9F%BA%E4%BA%8E-microsoft.net.sdk-%E5%88%B6%E4%BD%9C%E6%BA%90%E4%BB%A3%E7%A0%81%E5%8C%85)

我需要摘抄生成临时程序集的一部分源码：

```xml
<PropertyGroup>
    <_CompileTargetNameForLocalType Condition="'$(_CompileTargetNameForLocalType)' == ''">_CompileTemporaryAssembly</_CompileTargetNameForLocalType>
</PropertyGroup>

<Target Name="_CompileTemporaryAssembly"  DependsOnTargets="BuildOnlySettings;ResolveKeySource;CoreCompile" />

<Target Name="GenerateTemporaryTargetAssembly"
        Condition="'$(_RequireMCPass2ForMainAssembly)' == 'true' " >

    <Message Text="MSBuildProjectFile is $(MSBuildProjectFile)" Condition="'$(MSBuildTargetsVerbose)' == 'true'" />

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

    <CreateItem Include="$(IntermediateOutputPath)$(TargetFileName)" >
        <Output TaskParameter="Include" ItemName="AssemblyForLocalTypeReference" />
    </CreateItem>

</Target>
```

我们需要关注这些点：

1. 生成临时程序集时，会调用一个编译目标（Target），这个编译目标的名称由 `_CompileTargetNameForLocalType` 这个私有属性来决定；
1. 当 `_CompileTargetNameForLocalType` 没有指定时，会设置其默认值为 `_CompileTemporaryAssembly` 这个编译目标；
1. `_CompileTemporaryAssembly` 这个编译目标执行时，仅会执行三个依赖的编译目标，`BuildOnlySettings`、`ResolveKeySource`、`CoreCompile`，至于这些依赖目标所依赖的其他编译目标，则会根据新生成的项目文件动态计算。
1. 生成临时程序集和临时程序集的编译过程并不在同一个编译上下文中，这也是为什么只能通过传递名称 `_CompileTargetNameForLocalType` 来执行，而不能直接调用这个编译目标或者设置编译目标的依赖。

新生成的临时项目文件相比于原来的项目文件，包含了这些修改：

1. 添加了第一轮 XAML 编译传递（`MarkupCompilePass1`）时生成的 .g.cs 文件；
1. 将所有引用方式收集到的引用全部换成 `ReferencePath`，这样就可以避免临时项目编译期间再执行一次 `ResolveAssemblyReference` 编译目标来收集引用，避免降低太多性能。

关于引用换成 `ReferencePath` 的内容，可以阅读我的另一篇博客了解更多：

- [在 Target 中获取项目引用的所有依赖（dll/NuGet/Project）的路径](/post/resolve-project-references-using-target.html)

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

注意，虽然新生成的项目文件中有 `PackageReference` 来表示包引用，但由于只有 `_CompileTargetNameForLocalType` 指定的编译目标和相关依赖可以被执行，而 NuGet 包中自动 Import 的部分没有加入到依赖项中，所以实际上包中的 `.props` 和 `.targets` 文件都不会被 `Import` 进来，这可能造成部分 NuGet 包在 WPF 项目中不能正常工作。比如下面这个：

- [制作通过 NuGet 分发的源代码包时，如果目标项目是 WPF 则会出现一些问题](/post/issues-of-nuget-package-import-for-wpf-projects.html)

更典型的，就是 SourceYard 项目，这个 Bug 给 SourceYard 造成了不小的困扰：

- [walterlv.demo/Walterlv.GettingStarted.SourceYard at master · walterlv/walterlv.demo](https://github.com/walterlv/walterlv.demo/tree/master/Walterlv.GettingStarted.SourceYard)

---

**参考资料**

- [WPF MSBuild Task Reference - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/wpf-msbuild-task-reference?view=vs-2019)
- [GenerateTemporaryTargetAssembly.cs](https://referencesource.microsoft.com/#PresentationBuildTasks/BuildTasks/Microsoft/Build/Tasks/Windows/GenerateTemporaryTargetAssembly.cs)
- [Localization Attributes and Comments - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/wpf/advanced/localization-attributes-and-comments)
