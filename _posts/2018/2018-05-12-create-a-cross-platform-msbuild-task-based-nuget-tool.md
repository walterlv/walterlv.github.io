---
title: "如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包"
publishDate: 2018-05-12 00:04:14 +0800
date: 2019-08-07 14:50:59 +0800
tags: visualstudio csharp dotnet msbuild
---

MSBuild 的 Task 为我们扩展项目的编译过程提供了强大的扩展性，它使得我们可以用 C# 语言编写扩展；利用这种扩展性，我们可以为我们的项目定制一部分的编译细节。NuGet 为我们提供了一种自动导入 .props 和 .targets 的方法，同时还是一个 .NET 的包平台；我们可以利用 NuGet 发布我们的工具并自动启用这样的工具。

制作这样的一个跨平台 NuGet 工具，我们能够为安装此工具的项目提供自动的但定制化的编译细节——例如自动生成版本号，自动生成某些中间文件等。

本文更偏向于入门，只在帮助你一步一步地制作一个最简单的 NuGet 工具包，以体验和学习这个过程。然后我会在另一篇博客中完善其功能，做一个完整可用的 NuGet 工具。

---

关于创建跨平台 NuGet 工具包的博客，我写了两篇。一篇介绍写基于 MSBuild Task 的 dll，一篇介绍写任意的命令行工具，可以是用于 .NET Framework 的 exe，也可以是基于 .NET Core 的 dll，甚至可以是使用本机工具链编译的平台相关的各种格式的命令行工具。内容是相似的但关键的坑不同。我分为两篇可以减少完成单个任务的理解难度：

- [如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包](/post/create-a-cross-platform-msbuild-task-based-nuget-tool)
- [如何创建一个基于命令行工具的跨平台的 NuGet 工具包](/post/create-a-cross-platform-command-based-nuget-tool)

<div id="toc"></div>

## 第零步：前置条件

## 第一步：创建一个项目，用来写工具的核心逻辑

为了方便制作跨平台的 NuGet 工具，新建项目时我们优先选用 .NET Core Library 项目或 .NET Standard Library 项目。

![新建一个项目](/static/posts/2018-05-11-19-26-03.png)

紧接着，我们需要打开编辑此项目的 .csproj 文件，将目标框架改成多框架的，并填写必要的信息。

```xml
<!-- Walterlv.NuGetTool.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <!-- 给一个初始的版本号。 -->
    <Version>1.0.0-alpha</Version>
    <!-- 使用 .NET Framework 4.7 和 .NET Core 2.0。
      要点 1：
        - 加入 net47 的支持是为了能让基于 .NET Framework 的 msbuild 能够使用此工具编译；
        - 加入 netcoreapp2.0 的支持是为了能让基于 .NET Core 的 dotnet build (Roslyn) 能够使用此工具编译；
        - 当然 net47 太新了，只适用于 Visual Studio 2017 的较新版本，如果你需要照顾到更多用户，建议使用 net46。
      要点 2：
        注意，我们使用 NuGet 包来依赖 Task 框架，但此 NuGet 包要求的最低 .NET Framework 版本为 4.6。
        如果需要制作 .NET Framework 4.5 及以下版本，就必须改为引用以下程序集：
        - Microsoft.Build
        - Microsoft.Build.Framework
        - Microsoft.Build.Tasks.v4.0
        - Microsoft.Build.Utilities.v4.0 -->
    <TargetFrameworks>net47;netcoreapp2.0</TargetFrameworks>
    <!-- 这个就是创建项目时使用的名称。 -->
    <AssemblyName>Walterlv.NuGetTool</AssemblyName>
    <!-- 此值设为 true，才会在编译之后生成 NuGet 包。 -->
    <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
    <!-- 作者的 Id，如果要发布到 nuget.org，那么这里就是 NuGet 用户 Id。 -->
    <Authors>walterlv</Authors>
  </PropertyGroup>
</Project>
```

然后，安装如下 NuGet 包：

- Microsoft.Build.Framework: *提供了编写 `ITask` 的框架，有了这个才能写 `ITask`*
- Microsoft.Build.Utilities.Core: *提供了 `ITask` 框架的基本实现，这样才能用更少的代码写完 `Task`*

![安装 NuGet 包](/static/posts/2018-05-11-19-31-51.png)

要特别注意：由于我们是一个 NuGet 工具，不需要被其他项目直接依赖，所以此项目的依赖包不应该传递到下一个项目中。所以**请将所有的 NuGet 包资产都声明成私有的**，方法是在 NuGet 包的引用后面加上 `PrivateAssets="All"`。想了解 `PrivateAssets` 的含义一起相关属性，可以阅读我的另一篇文章[项目文件中的已知 NuGet 属性（使用这些属性，创建 NuGet 包就可以不需要 nuspec 文件啦） - 吕毅](/post/known-nuget-properties-in-csproj)。

```xml
<ItemGroup>
  <PackageReference Include="Microsoft.Build.Framework" Version="15.6.85" />
  <PackageReference Include="Microsoft.Build.Utilities.Core" Version="15.6.85" />
  <PackageReference Update="@(PackageReference)" PrivateAssets="All" />
</ItemGroup>
```

接下来就是取名字的时间了！为 `Class1` 类改一个名字。这个类将成为我们这个 NuGet 工具包的入口类。

> 比如我们想做一个用 Git 提交信息来生成版本号的类，可以叫做 GitVersion；想做一个生成多语言文件的类，可以叫做 LangGenerator。在这里，为了示范而不是真正的实现功能，我取名为 DemoTool。

取好名字之后，让这个类继承自 `Microsoft.Build.Utilities.Task`：

```csharp
// DemoTool.cs
using Microsoft.Build.Utilities;

namespace Walterlv.NuGetTool
{
    public class DemoTool : Task
    {
        public override bool Execute()
        {
            return true;
        }
    }
}
```

这时进行编译，我们的 NuGet 包就会出现在项目的输出目录 `bin\Debug` 下了。

![输出目录下的 NuGet 包](/static/posts/2018-05-11-20-04-21.png)

## 第二步：组织 NuGet 目录

刚刚生成的 NuGet 包还不能真正拿来用。事实上你也可以拿去安装，不过最终的效果只是加了一个毫无作用的引用程序集而已（顺便还带来一堆垃圾的间接引用）。

所以，我们需要进行“一番配置”，使得这个项目编译成一个**NuGet 工具**，而不是一个**依赖包**。

现在，介绍一下 NuGet 预设的目录（如果你想看，可以去解压 .nupkg 文件）：

```csharp
// 根目录，用来放 readme.txt 的（已经有人提 issue 要求加入 markdown 支持了）
+ /
// 用来放引用程序集 .dll，文档注释 .xml 和符号文件 .pdb 的
+ lib/
// 用来放那些与平台相关的 .dll/.pdb/.pri 的
+ runtimes/
// 任意种类的文件，在这个文件夹中的文件会在编译时拷贝到输出目录（保持文件夹结构）
+ content/
// 这里放 .props 和 .targets 文件，会自动被 NuGet 导入，成为项目的一部分（要求文件名与包名相同）
+ build/
// 这里也是放 .props 和 .targets 文件，会自动被 NuGet 导入，成为项目的一部分（要求文件名与包名相同）
+ buildMultiTargeting/
// PowerShell 脚本或者程序，在这里的工具可以在“包管理控制台”(Package Manager Console) 中使用
+ tools/
```

▲ 以上结构可以去官网翻阅原文 [How to create a NuGet package - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/create-packages/creating-a-package?wt.mc_id=MVP)，不过我这里额外写了一个预设目录 `buildMultiTargeting`，官方文档却没有说。

> 注意到我们的 csproj 文件中的 `<TargetFrameworks>` 节点吗？如果指定为单个框架，则自动导入的是 `build` 目录下的；如果指定为多个框架，则自动导入的是 `buildMultiTargeting` 目录下的。

我们的初衷是做一个 NuGet 工具，所以我们需要选择合适的目录来存放我们的输出文件。

我们要放一个 `Walterlv.NuGetTool.targets` 文件到 `build` 和 `buildMultiTargeting` 文件夹中，以便能够让我们定制编译流程。我们要让我们写的 dll（也就是那个 `Task`）能够工作，但是以上任何预定义的文件夹都不能满足我们的要求，于是我们建一个自定义的文件夹，取名为 `tasks`，这样 NuGet 便不会对我们的这个 dll 进行特殊处理，而将处理权全部交给我们。

于是我们自己的目录结构为：

```csharp
+ build/
    - Walterlv.NuGetTool.targets
+ buildMultiTargeting/
    - Walterlv.NuGetTool.targets
+ tasks/
    + net47/
        - Walterlv.NuGetTool.dll
    + netcoreapp2.0/
        - Walterlv.NuGetTool.dll
- readme.txt
```

那么，如何改造我们的项目才能够生成这样的 NuGet 目录结构呢？

我们先在 Visual Studio 里建好文件夹：

![Visual Studio 里的目录结构](/static/posts/2018-05-11-20-40-51.png)

随后去编辑项目的 .csproj 文件，在最后的 `</Project>` 前面添加下面这些项：

```xml
<!-- Walterlv.NuGetTool.csproj -->
<ItemGroup>
  <None Include="Assets\build\**" Pack="True" PackagePath="build\" />
  <None Include="Assets\buildMultiTargeting\**" Pack="True" PackagePath="buildMultiTargeting\" />
  <None Include="Assets\readme.txt" Pack="True" PackagePath="" />
</ItemGroup>
```

`None` 表示这一项要显示到 Visual Studio 解决方案中（其实对于不认识的文件，`None` 就是默认值）；`Include` 表示相对于项目文件的路径（支持通配符）；`Pack` 表示这一项要打包到 NuGet；`PackagePath` 表示这一项打包到 NuGet 中的路径。(*如果你想了解更多 csproj 中的 NuGet 属性，可以阅读我的另一篇文章：[项目文件中的已知 NuGet 属性（使用这些属性，创建 NuGet 包就可以不需要 nuspec 文件啦） - 吕毅](/post/known-nuget-properties-in-csproj)*)

这样的一番设置，我们的 `build`、`buildMultiTargeting` 和 `readme.txt` 准备好了，但是 `tasks` 文件夹还没有。由于我们是把我们生成的 dll 放到 `tasks` 里面，第一个想到的当然是修改输出路径——然而这是不靠谱的，因为 NuGet 并不识别输出路径。事实上，我们还可以设置一个属性 `<BuildOutputTargetFolder>`，将值指定为 `tasks`，那么我们就能够将我们的输出文件打包到 NuGet 对应的 `tasks` 文件夹下了。

至此，我们的 .csproj 文件看起来像如下这样（为了减少行数，我已经去掉了注释）：

```xml
<!-- Walterlv.NuGetTool.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <Version>1.0.0-alpha</Version>
    <AssemblyName>Walterlv.NuGetTool</AssemblyName>
    <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
    <!-- ↓ 新增的属性 -->
    <BuildOutputTargetFolder>tasks</BuildOutputTargetFolder>
    <!-- ↓ 新增的属性 -->
    <NoPackageAnalysis>true</NoPackageAnalysis>
    <!-- ↓ 新增的属性 -->
    <DevelopmentDependency>true</DevelopmentDependency>
    <Authors>walterlv</Authors>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.Build.Framework" Version="15.6.85" />
    <PackageReference Include="Microsoft.Build.Utilities.Core" Version="15.6.85" />
    <!-- ↓ 在第一步中不要忘了这一行 -->
    <PackageReference Update="@(PackageReference)" PrivateAssets="All" />
  </ItemGroup>
  <ItemGroup>
    <Folder Include="Assets\tasks\" />
  </ItemGroup>
  <ItemGroup>
    <!-- ↓ 新增的三项 -->
    <None Include="Assets\build\**" Pack="True" PackagePath="build\" />
    <None Include="Assets\buildMultiTargeting\**" Pack="True" PackagePath="buildMultiTargeting\" />
    <None Include="Assets\readme.txt" Pack="True" PackagePath="" />
  </ItemGroup>
</Project>
```

注意到我同时还在文件中新增了另外两个属性配置 `NoPackageAnalysis` 和 `DevelopmentDependency`。由于我们没有 `lib` 文件夹，所以 NuGet 会给出警告，`NoPackageAnalysis` 将阻止这个警告。`DevelopmentDependency` 是为了说明这是一个开发依赖，设置为 true 将阻止包作为依赖传递给下一个项目。（**事实上这又是官方的一个骗局！因为新版本的 NuGet 竟然去掉了这个功能！**，已经被吐槽了，详见：[PackageReference should support DevelopmentDependency metadata · Issue #4125 · NuGet/Home](https://github.com/NuGet/Home/issues/4125)）。关于这些属性更详细的解释，依然可以参见：[项目文件中的已知 NuGet 属性（使用这些属性，创建 NuGet 包就可以不需要 nuspec 文件啦） - 吕毅](/post/known-nuget-properties-in-csproj)。

现在再尝试编译一下我们的项目，去输出目录下解压查看 nupkg 文件，你就能看到期望的 NuGet 文件夹结构了；建议一个个点进去看，你可以看到我们准备好的空的 `Walterlv.NuGetTool.targets` 文件，也能看到我们生成的 `Walterlv.NuGetTool.dll`。

![生成的 NuGet 包的目录结构](/static/posts/2018-05-11-20-54-45.png)

## 第三步：编写 Target

.targets 文件是对项目功能进行扩展的关键文件，由于安装 NuGet 包会自动导入包中的此文件，所以它几乎相当于我们功能的入口。

现在，我们需要徒手编写这个文件了。

```xml
<!-- Assets\build\Walterlv.NuGetTool.targets -->
<Project>

  <PropertyGroup>
    <!-- 我们使用 $(MSBuildRuntimeType) 来判断编译器是 .NET Core 的还是 .NET Framework 的。
         然后选用对应的文件夹。-->
    <NuGetWalterlvTaskFolder Condition=" '$(MSBuildRuntimeType)' == 'Core'">$(MSBuildThisFileDirectory)..\tasks\netcoreapp2.0\</NuGetWalterlvTaskFolder>
    <NuGetWalterlvTaskFolder Condition=" '$(MSBuildRuntimeType)' != 'Core'">$(MSBuildThisFileDirectory)..\tasks\net47\</NuGetWalterlvTaskFolder>
  </PropertyGroup>

  <UsingTask TaskName="Walterlv.NuGetTool.DemoTool" AssemblyFile="$(NuGetWalterlvTaskFolder)\Walterlv.NuGetTool.dll" />
  <Target Name="WalterlvDemo" BeforeTargets="CoreCompile">
    <DemoTool />
  </Target>

</Project>
```

targets 的文件结构与 csproj 是一样的，你可以阅读我的另一篇文章 [理解 C# 项目 csproj 文件格式的本质和编译流程 - 吕毅](/post/understand-the-csproj) 了解其结构。

上面的文件中，我们指定 `Target` 的执行时机为 `CoreCompile` 之前，也就是编译那些 .cs 文件之前。在这个时机，我们可以修改要编译的 .cs 文件。如果想了解更多关于 `Target` 执行时机或顺序相关的资料，可以阅读：[Target Build Order](https://msdn.microsoft.com/en-us/library/ee216359.aspx)。

别忘了我们还有一个 `buildMultiTargeting` 文件夹，也要放一个几乎一样功能的 targets 文件；不过我们肯定不会傻到复制一个一样的。我们在 `buildMultiTargeting` 文件夹里的 targets 文件中写以下内容，这样我们的注意力便可以集中在前面的 targets 文件中了。

```xml
<!-- Assets\buildMultiTargeting\Walterlv.NuGetTool.targets -->
<Project>
  <!-- 直接 Import 我们在 build 中写的那个 targets 文件。
       NuGet 留下了为多框架项目提供特殊扩展的方案，其实有时候也是很有用的。-->
  <Import Project="..\build\Walterlv.NuGetTool.targets" />
</Project>
```

## 第四部：调试

严格来说，写到这里，我们的跨平台 NuGet 工具已经写完了。在以上状态下，你只需要编译一下，就可以获得一个跨平台的基于 MSBuild Task 的 NuGet 工具。只是——你肯定会非常郁闷——心里非常没谱，这工具到底有没有工作起来！有没有按照我预期的进行工作！如果遇到了 Bug 怎么办！

于是现在我们来掌握一些调试技巧，这样才方便我们一步步完善我们的功能嘛！**额外插一句：以上第一到第三步几乎都是结构化的步骤，其实非常适合用工具来自动化完成的。**

### 让我们的 Target 能够正确找到我们新生成的 dll

你应该注意到，我们的 targets 文件在 `Assets\build` 目录下，而我们的 `Assets` 文件夹下并没有真实的 `tasks` 文件夹（里面是空的）。于是我们希望在调试状态下，dll 能够指向输出目录下。于是我们修改 targets 文件添加配置：

```xml
<!-- Assets\build\Walterlv.NuGetTool.targets -->
<Project>

  <PropertyGroup Condition=" $(IsInDemoToolDebugMode) == 'True' ">
    <NuGetWalterlvTaskFolder Condition=" '$(MSBuildRuntimeType)' == 'Core'">$(MSBuildThisFileDirectory)..\..\bin\$(Configuration)\netcoreapp2.0\</NuGetWalterlvTaskFolder>
    <NuGetWalterlvTaskFolder Condition=" '$(MSBuildRuntimeType)' != 'Core'">$(MSBuildThisFileDirectory)..\..\bin\$(Configuration)\net47\</NuGetWalterlvTaskFolder>
  </PropertyGroup>

  <PropertyGroup Condition=" $(IsInDemoToolDebugMode) != 'True' ">
    <NuGetWalterlvTaskFolder Condition=" '$(MSBuildRuntimeType)' == 'Core'">$(MSBuildThisFileDirectory)..\tasks\netcoreapp2.0\</NuGetWalterlvTaskFolder>
    <NuGetWalterlvTaskFolder Condition=" '$(MSBuildRuntimeType)' != 'Core'">$(MSBuildThisFileDirectory)..\tasks\net47\</NuGetWalterlvTaskFolder>
  </PropertyGroup>
  
  <UsingTask TaskName="Walterlv.NuGetTool.DemoTool" AssemblyFile="$(NuGetWalterlvTaskFolder)\Walterlv.NuGetTool.dll" />
  <Target Name="WalterlvDemo" BeforeTargets="CoreCompile">
    <DemoTool />
  </Target>

</Project>
```

这样，我们就拥有了一个可以供用户设置的属性 `<IsInDemoToolDebugMode>` 了。

### 准备一个用于测试 Task 的测试项目

接着，我们在解决方案中新建一个调试项目 `Walterlv.Debug`（我选用了 .NET Standard 2.0 框架）。然后在它的 csproj 中 `<Import>` 我们刚刚的 .targets 文件，并设置 `<IsInDemoToolDebugMode>` 属性为 `True`：

```xml
<!-- Walterlv.Debug.csproj -->
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
    <IsInDemoToolDebugMode>True</IsInDemoToolDebugMode>
  </PropertyGroup>

  <Import Project="..\Walterlv.NuGetTool\Assets\build\Walterlv.NuGetTool.targets" />
  
</Project>
```

当准备好基本的调试环境之后，我们的解决方案看起来是下面这样的样子：

![带有调试环境的解决方案](/static/posts/2018-05-11-22-02-57.png)

### 让我们自定义的 Task 开始工作，并能够进入断点

最简单能够让 DemoTool 这个自定义的 Task 进入断点的方式当然是加上 `Debugger.Launch();` 了，就像这样：

```csharp
// DemoTool.cs
using System.Diagnostics;
using Microsoft.Build.Utilities;

namespace Walterlv.NuGetTool
{
    public class DemoTool : Task
    {
        public override bool Execute()
        {
            // 新增了启动调试器的代码。
            Debugger.Launch();
            return true;
        }
    }
}
```

这样，一旦此函数开始执行，Windows 将显示一个选择调试器的窗口，我们选择当前打开的 Visual Studio 即可。

![选择调试器](/static/posts/2018-05-11-22-07-18.png)

当然，也有一些比较正统的方法，为了使这篇文章尽可能简单，我只附一张图，如果有需要，可以自己去尝试：

![使用“调试配置”调试](/static/posts/2018-05-11-22-11-59.png)

现在，我们去 Walterlv.Debug 目录下输入 `msbuild` 命令，在输出到如下部分的时候，就会进入我们的断点了：

![进入了断点](/static/posts/2018-05-11-22-15-56.png)

这下，我们的调试环境就全部搭建好了，你可以发挥你的想象力在 Task 里面随意挥洒你的代码！

当然，只要你记得去掉 `Debugger.Launch();`，或者加上 `#if DEBUG` 这样的条件编译，那么随时打包就是一个可以发布的跨平台 NuGet 工具包了。

提示：**一旦调试环境搭建好，你可能会遇到编译 Walterlv.NuGetTool 项目时，发现 dll 被占用的情况，这时，打开任务管理器结束掉 msbuild.exe 进行即可。**

## 第五步：发挥你的想象力

想象力是没有限制的，不过如果不知道 Task 能够为我们提供到底什么样的功能，也是无从下手的。这一节我会说一些 Task 在 C# 代码和 .targets 文件中的互相操作。

### .targets 向 Task 传参数

.targets 向 Task 传参数只需要写一个属性赋值的句子就可以了：

```xml
<!-- Assets\build\Walterlv.NuGetTool.targets -->
<Target Name="WalterlvDemo" BeforeTargets="CoreCompile">
  <DemoTool IntermediateOutputPath="$(IntermediateOutputPath)" />
</Target>
```

这里，`$(IntermediateOutputPath)` 是 msbuild 编译期间会自动设置的全局属性，代表此项目编译过程中临时文件的存放路径（也就是我们常见的 obj 文件夹）。当然，使用 `dotnet build` 或者 `dotnet msbuild` 也是有这样的全局属性的。我们为 `<DemoTool>` 节点也加了一个属性，名为 `IntermediateOutputPath`。

在 DemoTool 的 C# 代码中，只需要写一个字符串属性即可接收这样的传参。

```csharp
// DemoTool.cs
public class DemoTool : Task
{
    public string IntermediateOutputPath { get; set; }

    public override bool Execute()
    {
        Debugger.Launch();
        var intermediateOutputPath = IntermediateOutputPath;
        return true;
    }
}
```

![在 DemoTool 中调试查看传进来的参数](/static/posts/2018-05-11-22-45-50.png)  
▲ 在断点中我们能够看到传进来的参数的值

你可以尽情发挥你的想象力，传入更多让人意想不到的参数，实现不可思议的功能。更多 MSBuild 全局参数，可以参考我的另一篇文章[项目文件中的已知属性（知道了这些，就不会随便在 csproj 中写死常量啦） - 吕毅](/post/known-properties-in-csproj)。

### Task 向 .targets 返回参数

如果只是传入参数，那么我们顶多只能干一些不痛不痒的事情，或者就是两者互相约定了一些常量。什么？你说直接去改源代码？那万一你的代码不幸崩溃了，项目岂不被你破坏了！（当然，你去改了源码，还会破坏 MSBuild 的差量编译。）

我们新定义一个属性，但在属性上面标记 `[Output]` 特性。这样，这个属性就会作为输出参数传到 .targets 里了。

```csharp
// DemoTool.cs
using System.Diagnostics;
using System.IO;
using Microsoft.Build.Framework;
using Microsoft.Build.Utilities;

namespace Walterlv.NuGetTool
{
    public class DemoTool : Task
    {
        public string IntermediateOutputPath { get; set; }

        [Output]
        public string AdditionalCompileFile { get; set; }

        public override bool Execute()
        {
            Debugger.Launch();
            var intermediateOutputPath = IntermediateOutputPath;
            var additional = Path.Combine(intermediateOutputPath, "DoubiClass.cs");
            AdditionalCompileFile = Path.GetFullPath(additional);
            File.WriteAllText(AdditionalCompileFile,
                @"using System;
namespace Walterlv.Debug
{
    public class Doubi
    {
        public string Name { get; }
        private Doubi(string name) => Name = name;
        public static Doubi Get() => new Doubi(""吕毅"");
    }
}");
            return true;
        }
    }
}
```

然后，我们在 .targets 里接收这个输出参数，生成一个属性：

```xml
<!-- Assets\build\Walterlv.NuGetTool.targets -->
<Target Name="WalterlvDemo" BeforeTargets="CoreCompile">
  <DemoTool IntermediateOutputPath="$(IntermediateOutputPath)">
    <Output TaskParameter="AdditionalCompileFile" PropertyName="WalterlvDemo_AdditionalCompileFile" />
  </DemoTool>

  <ItemGroup>
    <Compile Include="$(WalterlvDemo_AdditionalCompileFile)" />
  </ItemGroup>
</Target>
```

这样，我们生成的 Walterlv.Debug 调试项目在编译完成之后，还会额外多出一个“逗比”类。而且——我们甚至能够直接在 Walterlv.Debug 项目的中使用这个编译中生成的新类。

![可以使用额外生成的类](/static/posts/2018-05-11-23-37-47.png)

使用编译生成的新类既不会报错，也不会产生警告下划线，就像原生写的类一样。

如果你要在编译期间替换一个类而不是新增一个类，例如将 Class1.cs 更换成新类，那么需要将其从编译列表中移除：

```xml
<!-- Assets\build\Walterlv.NuGetTool.targets -->
<ItemGroup>
  <Compile Remove="Class1.cs" />
  <Compile Include="$(WalterlvDemo_AdditionalCompileFile)" />
</ItemGroup>
```

需要注意：**编译期间才生成的项（`<ItemGroup>`）或者属性（`<PropertyGroup>`），需要写在 `<Target>` 节点的里面。**如果写在外面，则不是编译期间生效的，而是始终生效的。当写在外面时，要特别留意可能某些属性没有初始化完全，你应该只使用那些肯定能确认存在的属性或文件。

### 在 Target 里编写调试代码

虽然说以上的每一个步骤我都是一边实操一边写的，但即便如此，本文都写了 500 多行了，如果你依然能够不出错地完成以上每一步，那也是万幸了！Task 里我能还能用断点调试，那么 Target 里面怎么办呢？

我们可以用 `<Message>` 节点来输出一些信息：

```xml
<!-- Assets\build\Walterlv.NuGetTool.targets -->
<Target Name="WalterlvDemo" BeforeTargets="CoreCompile">
  <DemoTool IntermediateOutputPath="$(IntermediateOutputPath)">
    <Output TaskParameter="AdditionalCompileFile" PropertyName="WalterlvDemo_AdditionalCompileFile" />
  </DemoTool>

  <Message Text="临时文件的路径为：$(WalterlvDemo_AdditionalCompileFile)" />

  <ItemGroup>
    <Compile Include="$(WalterlvDemo_AdditionalCompileFile)" />
  </ItemGroup>
</Target>
```

![输出信息](/static/posts/2018-05-11-23-50-41.png)

### 在 Task 输出错误或警告

我们继承了 `Microsoft.Build.Utilities.Task`，此类有一个 `Log` 属性，可以用来输出信息。使用 `LogWarning` 方法可以输出警告，使用 `LogError` 可以输出错误。如果输出了错误，那么就会导致编译不通过。

### 加入差量编译支持

如果你觉得你自己写的 `Task` 执行非常耗时，那么建议加入差量编译的支持。关于加入差量编译，可以参考我的另一篇文章[每次都要重新编译？太慢！让跨平台的 MSBuild/dotnet build 的 Target 支持差量编译](/post/msbuild-incremental-build)。

### 本地测试 NuGet 包

在发布 NuGet 包之前，我们可以先在本地安装测试。由于我们在 `C:\Users\lvyi\Desktop\Walterlv.NuGetTool\Walterlv.NuGetTool\bin\Debug` 输出路径下已经有了打包好的 nupkg 文件，所以可以加一个本地 NuGet 源。

我们找一个其他的项目，然后在 Visual Studio 中设置 NuGet 源为我们那个 NuGet 工具项目的输出路径。

![设置本地 NuGet 包源](/static/posts/2018-05-11-23-53-47.png)

这时安装，编译完之后，我们就会发现我们的项目生成的 dll 中多出了一个“逗比(Doubi)”类，并且可以在那个项目中编写使用 `Doubi` 的代码了。

## 总结

不得不说，制作一个跨平台的基于 MSBuild Task 的 NuGet 工具包还是比较麻烦的，我们总结一下：

1. 准备项目的基本配置（设置各种必要的项目属性，安装必要的 NuGet 依赖）
1. 建立好 NuGet 的文件夹结构
1. 编写 Task 和 Target
1. 新增功能、调试和测试

如果你在实践的过程中遇到了各种问题，欢迎在下面留言，一般我会在一天之内给予回复。

如果在阅读这篇文章时存在一些概念理解上的问题，或者不知道如何扩展本文的功能，可能需要阅读下我的另一些文章：

- [理解 C# 项目 csproj 文件格式的本质和编译流程 - 吕毅](/post/understand-the-csproj)
- [项目文件中的已知属性（知道了这些，就不会随便在 csproj 中写死常量啦） - 吕毅](/post/known-properties-in-csproj)
- [项目文件中的已知 NuGet 属性（使用这些属性，创建 NuGet 包就可以不需要 nuspec 文件啦） - 吕毅](/post/known-nuget-properties-in-csproj)

当然，还有一些正在编写，过一段时间可以阅读到。

---

**参考资料**

- [docs.microsoft.com-nuget/Creating-a-Package.md at master · NuGet/docs.microsoft.com-nuget](https://github.com/NuGet/docs.microsoft.com-nuget/blob/master/docs/create-packages/Creating-a-Package.md)
- [NuGet pack and restore as MSBuild targets - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/reference/msbuild-targets?wt.mc_id=MVP)
- [Bundling .NET build tools in NuGet](https://www.natemcmaster.com/blog/2017/11/11/build-tools-in-nuget/)
- [Shipping a cross-platform MSBuild task in a NuGet package](https://www.natemcmaster.com/blog/2017/07/05/msbuild-task-in-nuget/)
- [MSBuild Reserved and Well-Known Properties](https://msdn.microsoft.com/en-us/library/ms164309.aspx)
- [build process - How does MSBuild check whether a target is up to date or not? - Stack Overflow](https://stackoverflow.com/a/6982575/6233938)
- [How to: Build Incrementally](https://msdn.microsoft.com/en-us/library/ms171483.aspx)
- [How To: Implementing Custom Tasks – Part I – MSBuild Team Blog](https://blogs.msdn.microsoft.com/msbuild/2006/01/21/how-to-implementing-custom-tasks-part-i/)
- [Overwrite properties with MSBuild - Stack Overflow](https://stackoverflow.com/a/1367309/6233938)
- [How to Access MSBuild properties inside custom task](https://social.msdn.microsoft.com/Forums/vstudio/en-US/4ba7e9a0-76e6-4b1c-8536-fd76a5b96c79/how-to-access-msbuild-properties-inside-custom-task?forum=vsx)
- [visual studio - How to get property value of a project file using msbuild - Stack Overflow](https://stackoverflow.com/a/39745383/6233938)
- [davidfowl/NuGetPowerTools: A bunch of powershell modules that make it even easier to work with nuget](https://github.com/davidfowl/NuGetPowerTools)
- [MSBuild and Skipping target `"<TargetName>"` because it has no outputs - Stack Overflow](https://stackoverflow.com/q/27377095/6233938)
- [WriteCodeFragment Task](https://msdn.microsoft.com/en-us/library/ff598685.aspx)
- [Don't include dependencies from packages.config file when creating NuGet package - Stack Overflow](https://stackoverflow.com/q/15012963/6233938)
- [NuGet 2.7 Release Notes - Microsoft Docs](https://docs.microsoft.com/zh-cn/nuget/release-notes/nuget-2.7#Development-Only_Dependencies?wt.mc_id=MVP)
- [PackageReference should support DevelopmentDependency metadata · Issue #4125 · NuGet/Home](https://github.com/NuGet/Home/issues/4125)
- [debugging - How to debug MSBuild Customtask - Stack Overflow](https://stackoverflow.com/q/357445/6233938)
