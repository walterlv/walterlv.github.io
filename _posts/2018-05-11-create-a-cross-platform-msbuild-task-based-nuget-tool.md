---
title: "如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包"
date: 2018-05-11 20:04:47 +0800
categories: visualstudio
published: false
---

MSBuild 的 Task 为我们扩展项目的编译过程提供了强大的扩展性，它使得我们可以用 C# 语言编写扩展；利用这种扩展性，我们可以为我们的项目定制一部分的编译细节。NuGet 为我们提供了一种自动导入 .props 和 .targets 的方法，同时还是一个 .NET 的包平台；我们可以利用 NuGet 发布我们的工具并自动启用这样的工具。

制作这样的一个跨平台 NuGet 工具，我们能够为安装此工具的项目提供自动的但定制化的编译细节——例如自动生成版本号，自动生成某些中间文件等。

本文更偏向于入门，只在帮助你一步一步地制作一个最简单的 NuGet 工具包，以体验和学习这个过程。然后我会在另一篇博客中完善其功能，做一个完整可用的 NuGet 工具。

---

<div id="toc"></div>

### 第零步：前置条件

### 第一步：创建一个项目，用来写工具的核心逻辑

为了方便制作跨平台的 NuGet 工具，新建项目时我们优先选用 .NET Core Library 项目或 .NET Standard Library 项目。

![新建一个项目](/static/posts/2018-05-11-19-26-03.png)

紧接着，我们需要打开编辑此项目的 .csproj 文件，将目标框架改成多框架的，并填写必要的信息。

```xml
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

接下来就是取名字的时间了！为 `Class1` 类改一个名字。这个类将成为我们这个 NuGet 工具包的入口类。

> 比如我们想做一个用 Git 提交信息来生成版本号的类，可以叫做 GitVersion；想做一个生成多语言文件的类，可以叫做 LangGenerator。在这里，为了示范而不是真正的实现功能，我取名为 DemoTool。

取好名字之后，让这个类继承自 `Microsoft.Build.Utilities.Task`：

```csharp
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

### 第二步：组织 NuGet 目录

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

▲ 以上结构可以去官网翻阅原文 [How to create a NuGet package - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/create-packages/creating-a-package)，不过我这里额外写了一个预设目录 `buildMultiTargeting`，官方文档却没有说。

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
<ItemGroup>
  <None Include="Assets\build\**" Pack="True" PackagePath="build\" />
  <None Include="Assets\buildMultiTargeting\**" Pack="True" PackagePath="buildMultiTargeting\" />
  <None Include="Assets\readme.txt" Pack="True" PackagePath="" />
</ItemGroup>
```

`None` 表示这一项要显示到 Visual Studio 解决方案中（其实对于不认识的文件，`None` 就是默认值）；`Include` 表示相对于项目文件的路径（支持通配符）；`Pack` 表示这一项要打包到 NuGet；`PackagePath` 表示这一项打包到 NuGet 中的路径。(*如果你想了解更多 csproj 中的 NuGet 属性，可以阅读我的另一篇文章：[项目文件中的已知 NuGet 属性（使用这些属性，创建 NuGet 包就可以不需要 nuspec 文件啦） - 吕毅](http://localhost:4000/post/known-nuget-properties-in-csproj.html)*)

这样的一番设置，我们的 `build`、`buildMultiTargeting` 和 `readme.txt` 准备好了，但是 `tasks` 文件夹还没有。由于我们是把我们生成的 dll 放到 `tasks` 里面，第一个想到的当然是修改输出路径——然而这是不靠谱的，因为 NuGet 并不识别输出路径。事实上，我们还可以设置一个属性 `<BuildOutputTargetFolder>`，将值指定为 `tasks`，那么我们就能够将我们的输出文件打包到 NuGet 对应的 `tasks` 文件夹下了。

至此，我们的 .csproj 文件看起来像如下这样（为了减少行数，我已经去掉了注释）：

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <Version>1.0.0-alpha</Version>
    <AssemblyName>Walterlv.NuGetTool</AssemblyName>
    <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
    <!-- ↓ 新增的属性 -->
    <BuildOutputTargetFolder>tasks</BuildOutputTargetFolder>
    <Authors>walterlv</Authors>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Microsoft.Build.Framework" Version="15.6.85" />
    <PackageReference Include="Microsoft.Build.Utilities.Core" Version="15.6.85" />
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

现在再尝试编译一下我们的项目，去输出目录下解压查看 nupkg 文件，你就能看到期望的 NuGet 文件夹结构了；建议一个个点进去看，你可以看到我们准备好的空的 `Walterlv.NuGetTool.targets` 文件，也能看到我们生成的 `Walterlv.NuGetTool.dll`。

![生成的 NuGet 包的目录结构](/static/posts/2018-05-11-20-54-45.png)

### 第三步：编写 Target

### 第四部：打包成 NuGet

### 第五步：调试与发布

---

#### 参考资料

- [NuGet pack and restore as MSBuild targets - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/reference/msbuild-targets)
- [Bundling .NET build tools in NuGet](https://www.natemcmaster.com/blog/2017/11/11/build-tools-in-nuget/)
- [Shipping a cross-platform MSBuild task in a NuGet package](https://www.natemcmaster.com/blog/2017/07/05/msbuild-task-in-nuget/)
- [MSBuild Reserved and Well-Known Properties](https://msdn.microsoft.com/en-us/library/ms164309.aspx)
- [build process - How does MSBuild check whether a target is up to date or not? - Stack Overflow](https://stackoverflow.com/questions/6982372/how-does-msbuild-check-whether-a-target-is-up-to-date-or-not?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa)
- [How to: Build Incrementally](https://msdn.microsoft.com/en-us/library/ms171483.aspx)
- [How To: Implementing Custom Tasks – Part I – MSBuild Team Blog](https://blogs.msdn.microsoft.com/msbuild/2006/01/21/how-to-implementing-custom-tasks-part-i/)
- [Overwrite properties with MSBuild - Stack Overflow](https://stackoverflow.com/questions/1366840/overwrite-properties-with-msbuild?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa)
- [How to Access MSBuild properties inside custom task](https://social.msdn.microsoft.com/Forums/vstudio/en-US/4ba7e9a0-76e6-4b1c-8536-fd76a5b96c79/how-to-access-msbuild-properties-inside-custom-task?forum=vsx)
- [visual studio - How to get property value of a project file using msbuild - Stack Overflow](https://stackoverflow.com/questions/39732729/how-to-get-property-value-of-a-project-file-using-msbuild)
- [davidfowl/NuGetPowerTools: A bunch of powershell modules that make it even easier to work with nuget](https://github.com/davidfowl/NuGetPowerTools)
- [MSBuild and Skipping target "<TargetName>" because it has no outputs - Stack Overflow](https://stackoverflow.com/questions/27377095/msbuild-and-skipping-target-targetname-because-it-has-no-outputs)
- [WriteCodeFragment Task](https://msdn.microsoft.com/en-us/library/ff598685.aspx)
- [Don't include dependencies from packages.config file when creating NuGet package - Stack Overflow](https://stackoverflow.com/questions/15012963/dont-include-dependencies-from-packages-config-file-when-creating-nuget-package?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa)
- [NuGet 2.7 Release Notes - Microsoft Docs](https://docs.microsoft.com/zh-cn/nuget/release-notes/nuget-2.7#Development-Only_Dependencies)
- [PackageReference should support DevelopmentDependency metadata · Issue #4125 · NuGet/Home](https://github.com/NuGet/Home/issues/4125)
