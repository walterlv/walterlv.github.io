---
title: "如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包"
date: 2018-05-11 20:04:47 +0800
categories: visualstudio
published: false
---

MSBuild 的 Task 为我们扩展项目的编译过程提供了强大的扩展性，它使得我们可以用 C# 语言编写扩展；利用这种扩展性，我们可以为我们的项目定制一部分的编译细节。NuGet 为我们提供了一种自动导入 .props 和 .targets 的方法，同时还是一个 .NET 的包平台；我们可以利用 NuGet 发布我们的工具并自动启用这样的工具。

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
         注意，我们使用 NuGet 包来依赖 Task 框架，要求 .NET Framework 最低 4.6。
         如果需要制作 .NET Framework 4.5 及以下版本，就必须改为引用程序集
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
