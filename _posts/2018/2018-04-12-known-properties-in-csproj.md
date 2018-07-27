---
title: "项目文件中的已知属性（知道了这些，就不会随便在 csproj 中写死常量啦）"
date_published: 2018-04-12 21:03:52 +0800
date: 2018-07-27 12:36:48 +0800
categories: visualstudio nuget csharp dotnet msbuild
---

知道了 csproj 文件中的一些常用属性，修改文件的时候就不会写很多的垃圾代码。

---

“项目文件中的已知属性系列”分为两个部分：

- 本文：[项目文件中的已知属性（知道了这些，就不会随便在 csproj 中写死常量啦） - 吕毅](/post/known-properties-in-csproj.html)
- [项目文件中的已知 NuGet 属性（使用这些属性，创建 NuGet 包就可以不需要 nuspec 文件啦） - 吕毅](/post/known-nuget-properties-in-csproj.html)

什么？你的 csproj 文件太长不想看？说明你用了旧格式的 csproj，阅读我的另一篇文章 [将 WPF、UWP 以及其他各种类型的旧 csproj 迁移成基于 Microsoft.NET.Sdk 的新 csproj](/post/introduce-new-style-csproj-into-net-framework.html) 将它转为新格式之后，你就会觉得这么简短精炼的 csproj 文件，真不忍将它写杂。

比如通过以下写法，可以将所有的 *.xaml.cs 文件折叠到对应的 *.xaml 文件下，而不需要像旧 csproj 格式那样每个文件都写一份：

> ```xml
> <Compile Update="**\*.xaml.cs">
>     <DependentUpon>%(Filename)</DependentUpon>
> </Compile>
> ```

<div id="toc"></div>

### 编译上下文

以下属性是基本的输出路径属性，可以在 Microsoft.NET.DefaultOutputPaths.targets 找到。

+ `$(Configuration)`
    - 这就是我们传说中决定 Debug 还是 Release 的属性。如果没有指定，默认是 Debug。本身没有什么意义，因为各种其他行为判断了这个属性的值，于是就有了编译差别。
+ `$(Platform)`
    - 默认是 `AnyCPU`，还可以是 `x86`、`x64` 或者 `ARM`。

+ `$(BaseOutputPath)`
    - 输出路径的起始位置。如果没有指定，就是 `bin\`。修改这个属性可以间接修改 `OutputPath`。
+ `$(OutputPath)`
    - 输出路径，默认有两种可能的值。如果 `AnyCPU` 编译，就是 `$(BaseOutputPath)$(Configuration)\`；否则就是 `$(BaseOutputPath)$(PlatformName)\$(Configuration)\`
    
+ `$(BaseIntermediateOutputPath)`
    - 临时生成路径的起始位置。如果没有指定，就是 `obj\`。修改这个属性可以间接修改 `IntermediateOutputPath`。
+ `$(IntermediateOutputPath)`
    - 临时生成路径，默认有两种可能的值。如果 `AnyCPU` 编译，就是 `$(BaseIntermediateOutputPath)$(Configuration)\`；否则就是 `$(BaseIntermediateOutputPath)$(PlatformName)\$(Configuration)\`

---

以下属性控制哪些文件应该被默认包含在编译中，可以在 Microsoft.NET.TargetFrameworkInference.targets 找到。

+ `$(EnableDefaultItems)`
    - 默认为 `true`，如果指定为 `false`，那么就不自动将 .cs 和 .resx 文件引入。
+ `$(DefaultItemExcludes)`
    - 默认为输出路径（`OutputPath`）和临时生成路径（`IntermediateOutputPath`）下的所有文件。
+ `$(AppendTargetFrameworkToOutputPath)`
    - 默认我们生成路径会包含 `net47` 或者 `netcoreapp2.1` 这样的一层文件夹，如果指定为 `false`，这一层文件夹就不会生成了。

---

下面是 Microsoft.NET.Sdk 中的一部分源码，在 Microsoft.NET.Sdk.DefaultItems.props 文件中，可以发现还有更多与控制自动引入文件相关的属性。

```xml
<ItemGroup Condition=" '$(EnableDefaultItems)' == 'true' ">
  <Compile Include="**/*$(DefaultLanguageSourceExtension)" Exclude="$(DefaultItemExcludes);$(DefaultExcludesInProjectFolder)" Condition=" '$(EnableDefaultCompileItems)' == 'true' " />
  <EmbeddedResource Include="**/*.resx" Exclude="$(DefaultItemExcludes);$(DefaultExcludesInProjectFolder)" Condition=" '$(EnableDefaultEmbeddedResourceItems)' == 'true' " />
</ItemGroup>
<ItemGroup Condition=" '$(EnableDefaultItems)' == 'true' And '$(EnableDefaultNoneItems)' == 'true' ">
  <None Include="**/*" Exclude="$(DefaultItemExcludes);$(DefaultExcludesInProjectFolder)" />
  <None Remove="**/*$(DefaultLanguageSourceExtension)" />
  <None Remove="**/*.resx" />
</ItemGroup>
```

---

以下属性是 Microsoft.NET.Sdk 中的各种 Target 使用的配置属性，设置这些属性也影响到生成过程。

```xml
<Project>
  <PropertyGroup>
    <!-- 此程序集的版本，这是很多其他版本号未设置时的默认值。而此值的默认值是 1.0.0 -->
    <Version>3.1.2-beta</Version>

    <!-- 以下属性是当引用的 dll 出现版本冲突时，用于自动生成绑定重定向的。
         详见：https://www.erikheemskerk.nl/transitive-nuget-dependencies-net-core-got-your-back/ -->

    <AutoGenerateBindingRedirects>true</AutoGenerateBindingRedirects>
    <GenerateBindingRedirectsOutputType>true</GenerateBindingRedirectsOutputType>
  </PropertyGroup>
</Project>
```

可以阅读 [解读 Microsoft.NET.Sdk 的源码，你能定制各种奇怪而富有创意的编译过程](/post/read-microsoft-net-sdk.html) 和  [Reading the Source Code of Microsoft.NET.Sdk, Writing the Creative Extension of Compiling](/post/read-microsoft-net-sdk-en.html) 了解更多 Microsoft.NET.Sdk 源码。

### 文件路径

#### 项路径

写在 csproj 文件中 ItemGroup 组中的每一个元素即“项”。

对以下这一项进行说明的话：

> ```xml
> <ItemGroup>  
>     <Compile Include="src\Program.cs" />  
> </ItemGroup> 
> ```

那么，可用的属性有：

+ `%(FullPath)`
    - 文件的完全路径，例如: `C:\Users\walterlv\GitHub\Demo\Walterlv.DemoProject\src\Program.cs`
+ `%(RootDir)`
    - 文件所在的根目录，例如: `C:\`
+ `%(Filename)`
    - 文件名（不含扩展名），例如: `Program`
+ `%(Extension)`
    - 文件扩展名，例如: `.cs`
+ `%(RelativeDir)`
    - 文件所在的文件夹，例如: `src\`
+ `%(Directory)`
    - 除了根目录之外的目录，例如: `walterlv\GitHub\Demo\Walterlv.DemoProject\src\`
+ `%(RecursiveDir)`
    - 如果项是用通配符写的，那么此值表示匹配到某一项时的目录，例如: `walterlv\GitHub\Demo\Walterlv.DemoProject\src\`
+ `%(Identity)`
    - 项的标识符，也就是 Include 里写的东西，例如: `src\Program.cs`
+ `%(ModifiedTime)`
    - 文件的修改时间，例如: `2018-04-12 21:00:43.7851385`
+ `%(CreatedTime)`
    - 文件的创建时间，例如: `2018-04-12 21:01:50.1417635`
+ `%(AccessedTime)`
    - 文件最近被访问的时间，例如: `2018-04-12 21:02:15.4132476`

#### 全局路径

* 项目文件
    + `$(MSBuildProjectFullPath)`
        - 项目文件的绝对路径，例如: `C:\Users\walterlv\GitHub\Demo\Walterlv.DemoProject.csproj`
    + `$(MSBuildProjectDirectory)`
        - 项目所在的文件夹，例如: `C:\Users\walterlv\GitHub\Demo`
    + `$(MSBuildProjectFile)`
        - 项目文件的完整名称，例如: `Walterlv.DemoProject.csproj`
    + `$(MSBuildProjectName)`
        - 项目文件的名称，不含扩展名，例如 `Walterlv.DemoProject`
    + `$(MSBuildProjectExtension)`
        - 项目文件的扩展名，例如: `.csproj`
    + `$(MSBuildProjectDirectoryNoRoot)`
        - 项目文件去除驱动器的路径，包含反斜杠

* 部件（例如 .props 文件或 .targets 文件，当然也包含 .csproj 文件）
    + `$(MSBuildThisFileFullPath)`
        - 用这个属性的文件所在的绝对路径，例如 `C:\Users\walterlv\.nuget\packages\walterlv.nuget.demo\2.13.0\build\netstandard2.0\Walterlv.NuGet.Demo.targets`
    + `$(MSBuildThisFileDirectory)`
        - 此文件所在的文件夹，例如: `C:\Users\walterlv\.nuget\packages\walterlv.nuget.demo\2.13.0\build\netstandard2.0\`
    + `$(MSBuildThisFile)`
        - 此文件的完整名称，例如 `Walterlv.NuGet.Demo.targets`
    + `$(MSBuildThisFileName)`
        - 此文件的名称，不含扩展名，例如 `Walterlv.NuGet.Demo`
    + `$(MSBuildThisFileExtension)`
        - 此文件的扩展名，例如 `.targets`
    + `$(MSBuildThisFileDirectoryNoRoot)`
        - 此文件去除驱动器的路径，包含反斜杠

* 环境
    + `$(MSBuildStartupDirectory)`
        - 启动 MSBuild 时的路径，类似于工作目录（输入 msbuild 命令时所在的那个文件夹）

* 工具
    + `$(MSBuildToolsPath)`
        - MSBuild 工具所在的路径
    + `$(MSBuildToolsVersion)`
        - 此次编译锁使用的工具的版本

另外还有一些在新的 SDK 中几乎不会在日常开发中用到的全局属性：

- `$(MSBuildBinPath)`: MSBuild 程序所在的路径
- `$(MSBuildExtensionsPath)`: 自定义 targets 所在的路径
- `$(MSBuildExtensionsPath32)`: 自定义 targets 所在的路径
- `$(MSBuildExtensionsPath64)`: 自定义 targets 所在的路径
- `$(MSBuildLastTaskResult)`: 如果前一个 Task 结束后成功，则为 true；否则为 false
- `$(MSBuildNodeCount)`: 编译时并发的进程数，与命令行中的 `/maxcpucount` 时一个意思
- `$(MSBuildProgramFiles32)`: 通常是 `C:\Program Files (x86)`
- `$(MSBuildProjectDefaultTargets)`: 在 `Project` 根节点上设置的默认 Targets，例如: `<Project DefaultTargets="A;B;C" >`
- `$(MSBuildBinPath)`: MSBuild 程序所在的路径
- `$(MSBuildBinPath)`: MSBuild 程序所在的路径
- `$(MSBuildBinPath)`: MSBuild 程序所在的路径
- `$(MSBuildBinPath)`: MSBuild 程序所在的路径

如果希望了解在 csproj 中创建 NuGet 包时可用的属性，请参考我的另一篇博客：[项目文件中的已知 NuGet 属性（知道了这些，创建 NuGet 包就可以不需要 nuspec 文件啦） - 吕毅](/post/known-nuget-properties-in-csproj.html)。

---

#### 参考资料

- [MSBuild Well-known Item Metadata](https://msdn.microsoft.com/en-us/library/ms164313.aspx)
