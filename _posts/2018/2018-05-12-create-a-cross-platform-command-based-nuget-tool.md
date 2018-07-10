---
title: "如何创建一个基于命令行工具的跨平台的 NuGet 工具包"
date_published: 2018-05-12 09:09:02 +0800
date: 2018-07-10 10:27:11 +0800
categories: visualstudio csharp dotnet msbuild
---

命令行可是跨进程通信的一种非常方便的手段呢，只需启动一个进程传入一些参数即可完成一些很复杂的任务。NuGet 为我们提供了一种自动导入 .props 和 .targets 的方法，同时还是一个 .NET 的包平台；我们可以利用 NuGet 发布我们的工具并自动启用这样的工具。

制作这样的一个跨平台 NuGet 工具，我们能够为安装此工具的项目提供自动的但定制化的编译细节——例如自动生成版本号，自动生成某些中间文件等。

本文更偏向于入门，只在帮助你一步一步地制作一个最简单的 NuGet 工具包，以体验和学习这个过程。然后我会在另一篇博客中完善其功能，做一个完整可用的 NuGet 工具。

---

关于创建跨平台 NuGet 工具包的博客，我写了两篇。一篇介绍写基于 MSBuild Task 的 dll，一篇介绍写任意的命令行工具，可以是用于 .NET Framework 的 exe，也可以是基于 .NET Core 的 dll，甚至可以是使用本机工具链编译的平台相关的各种格式的命令行工具。内容是相似的但关键的坑不同。我分为两篇可以减少完成单个任务的理解难度：

- [如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包](/post/create-a-cross-platform-msbuild-task-based-nuget-tool.html)
- [如何创建一个基于命令行工具的跨平台的 NuGet 工具包](/post/create-a-cross-platform-command-based-nuget-tool.html)

<div id="toc"></div>

### 第零步：前置条件

### 第一步：创建一个项目，用来写工具的核心逻辑

为了方便制作跨平台的 NuGet 工具，新建项目时我们优先选用 .NET Core 控制台项目。

![新建一个项目](/static/posts/2018-05-12-07-46-48.png)

紧接着，我们需要打开编辑此项目的 .csproj 文件，填写必要的信息（尤其是 `<GeneratePackageOnBuild>`，确保编译时会生成 NuGet 包）。

```xml
<!-- Walterlv.NuGetTool.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <!-- 输出为 exe（其实对于 .NET Core 依然是 dll，除非进行发布）。 -->
    <OutputType>Exe</OutputType>
    <!-- 给一个初始的版本号。 -->
    <Version>1.0.0-alpha</Version>
    <!-- 由于 .NET Core 本身即具备跨平台的特性，所以我们直接基于 .NET Core 开发 -->
    <TargetFramework>netcoreapp2.0</TargetFramework>
    <!-- 这个就是创建项目时使用的名称。 -->
    <AssemblyName>Walterlv.NuGetTool</AssemblyName>
    <!-- 此值设为 true，才会在编译之后生成 NuGet 包。 -->
    <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
    <!-- 作者的 Id，如果要发布到 nuget.org，那么这里就是 NuGet 用户 Id。 -->
    <Authors>walterlv</Authors>
  </PropertyGroup>
</Project>
```

接下来随便在 Program.cs 里写什么代码，这取决于你希望这个 NuGet 工具做什么。

```csharp
using System;

namespace Walterlv.NuGetTool
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

这时进行编译，我们的 NuGet 包就会出现在项目的输出目录 `bin\Debug` 下了。

![输出目录下的 NuGet 包](/static/posts/2018-05-12-07-52-23.png)

### 第二步：组织 NuGet 目录

刚刚生成的 NuGet 包还不能真正拿来用。事实上你也可以拿去安装，不过最终的效果只是加了一个毫无作用的引用程序集而已（事实上就是把你写的程序作为普通 dll 引用了）。

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

我们要放一个 `Walterlv.NuGetTool.targets` 文件到 `build` 和 `buildMultiTargeting` 文件夹中，以便能够让我们定制编译流程。我们要让我们写的 .NET Core 工具程序能够工作，所以我们将生成的输出程序放到 tools 目录下。

于是我们自己的目录结构为：

```csharp
+ build/
    - Walterlv.NuGetTool.targets
+ buildMultiTargeting/
    - Walterlv.NuGetTool.targets
+ tools/
    + netcoreapp2.0/
        - Walterlv.NuGetTool.dll
- readme.txt
```

提醒一下，.NET Core 生成的程序，如果没有针对特定平台发布，输出的是 dll。

那么，如何改造我们的项目才能够生成这样的 NuGet 目录结构呢？

我们先在 Visual Studio 里建好文件夹：

![Visual Studio 里的目录结构](/static/posts/2018-05-12-07-57-30.png)

随后去编辑项目的 .csproj 文件，在最后的 `</Project>` 前面添加下面这些项：

```xml
<!-- Walterlv.NuGetTool.csproj -->
<ItemGroup>
  <None Include="Assets\build\**" Pack="True" PackagePath="build\" />
  <None Include="Assets\buildMultiTargeting\**" Pack="True" PackagePath="buildMultiTargeting\" />
  <None Include="Assets\readme.txt" Pack="True" PackagePath="" />
</ItemGroup>
```

`None` 表示这一项要显示到 Visual Studio 解决方案中（其实对于不认识的文件，`None` 就是默认值）；`Include` 表示相对于项目文件的路径（支持通配符）；`Pack` 表示这一项要打包到 NuGet；`PackagePath` 表示这一项打包到 NuGet 中的路径。(*如果你想了解更多 csproj 中的 NuGet 属性，可以阅读我的另一篇文章：[项目文件中的已知 NuGet 属性（使用这些属性，创建 NuGet 包就可以不需要 nuspec 文件啦） - 吕毅](/post/known-nuget-properties-in-csproj.html)*)

这样的一番设置，我们的 `build`、`buildMultiTargeting` 和 `readme.txt` 准备好了，但是 `tools` 文件夹还没有。由于我们是把我们生成的命令行工具放到 `tools` 里面，第一个想到的当然是修改输出路径——然而这是不靠谱的，因为 NuGet 并不识别输出路径。事实上，我们还可以设置一个属性 `<BuildOutputTargetFolder>`，将值指定为 `tools`，那么我们就能够将我们的输出文件打包到 NuGet 对应的 `tools` 文件夹下了。

至此，我们的 .csproj 文件看起来像如下这样（为了减少行数，我已经去掉了注释）：

```xml
<!-- Walterlv.NuGetTool.csproj -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <Version>1.0.0-alpha</Version>
    <AssemblyName>Walterlv.NuGetTool</AssemblyName>
    <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
    <!-- ↓ 新增的属性 -->
    <BuildOutputTargetFolder>tools</BuildOutputTargetFolder>
    <!-- ↓ 新增的属性 -->
    <NoPackageAnalysis>true</NoPackageAnalysis>
    <!-- ↓ 新增的属性 -->
    <DevelopmentDependency>true</DevelopmentDependency>
    <Authors>walterlv</Authors>
  </PropertyGroup>
  <ItemGroup>
    <Folder Include="Assets\tools\" />
  </ItemGroup>
  <ItemGroup>
    <!-- ↓ 新增的三项 -->
    <None Include="Assets\build\**" Pack="True" PackagePath="build\" />
    <None Include="Assets\buildMultiTargeting\**" Pack="True" PackagePath="buildMultiTargeting\" />
    <None Include="Assets\readme.txt" Pack="True" PackagePath="" />
  </ItemGroup>
</Project>
```

注意到我同时还在文件中新增了另外两个属性配置 `NoPackageAnalysis` 和 `DevelopmentDependency`。由于我们没有 `lib` 文件夹，所以 NuGet 会给出警告，`NoPackageAnalysis` 将阻止这个警告。`DevelopmentDependency` 是为了说明这是一个开发依赖，设置为 true 将阻止包作为依赖传递给下一个项目。（**事实上这又是官方的一个骗局！因为新版本的 NuGet 竟然去掉了这个功能！**，已经被吐槽了，详见：[PackageReference should support DevelopmentDependency metadata · Issue #4125 · NuGet/Home](https://github.com/NuGet/Home/issues/4125)）。关于这些属性更详细的解释，依然可以参见：[项目文件中的已知 NuGet 属性（使用这些属性，创建 NuGet 包就可以不需要 nuspec 文件啦） - 吕毅](/post/known-nuget-properties-in-csproj.html)。

现在再尝试编译一下我们的项目，去输出目录下解压查看 nupkg 文件，你就能看到期望的 NuGet 文件夹结构了；建议一个个点进去看，你可以看到我们准备好的空的 `Walterlv.NuGetTool.targets` 文件，也能看到我们生成的 `Walterlv.NuGetTool.dll`。

![生成的 NuGet 包的目录结构](/static/posts/2018-05-12-08-03-01.png)

### 第三步：编写 Target

.targets 文件是对项目功能进行扩展的关键文件，由于安装 NuGet 包会自动导入包中的此文件，所以它几乎相当于我们功能的入口。

现在，我们需要徒手编写这个文件了。

```xml
<!-- Assets\build\Walterlv.NuGetTool.targets -->
<Project>

  <PropertyGroup>
    <NuGetWalterlvToolPath>$(MSBuildThisFileDirectory)..\tools\netcoreapp2.0\Walterlv.NuGetTool.dll</NuGetWalterlvToolPath>
  </PropertyGroup>

  <Target Name="WalterlvDemo" BeforeTargets="CoreCompile">
    <Exec Command="dotnet $(NuGetWalterlvToolPath)" />
  </Target>

</Project>
```

targets 的文件结构与 csproj 是一样的，你可以阅读我的另一篇文章 [理解 C# 项目 csproj 文件格式的本质和编译流程 - 吕毅](/post/understand-the-csproj.html) 了解其结构。

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

### 第四部：调试

严格来说，写到这里，我们的跨平台 NuGet 工具已经写完了。在以上状态下，你只需要编译一下，就可以获得一个跨平台的基于 MSBuild Task 的 NuGet 工具。只是——你肯定会非常郁闷——心里非常没谱，这工具到底有没有工作起来！有没有按照我预期的进行工作！如果遇到了 Bug 怎么办！

于是现在我们来掌握一些调试技巧，这样才方便我们一步步完善我们的功能嘛！**额外插一句：以上第一到第三步几乎都是结构化的步骤，其实非常适合用工具来自动化完成的。**

#### 让我们的 Target 能够正确找到我们新生成的 dll

你应该注意到，我们的 targets 文件在 `Assets\build` 目录下，而我们的 `Assets` 文件夹下并没有真实的 `tools` 文件夹（里面是空的）。于是我们希望在调试状态下，dll 能够指向输出目录下。于是我们修改 targets 文件添加配置：

```xml
<!-- Assets\build\Walterlv.NuGetTool.targets -->
<Project>

  <PropertyGroup Condition=" $(IsInDemoToolDebugMode) == 'True' ">
    <NuGetWalterlvToolPath>$(MSBuildThisFileDirectory)..\..\bin\$(Configuration)\netcoreapp2.0\Walterlv.NuGetTool.dll</NuGetWalterlvToolPath>
  </PropertyGroup>

  <PropertyGroup Condition=" $(IsInDemoToolDebugMode) != 'True' ">
    <NuGetWalterlvToolPath>$(MSBuildThisFileDirectory)..\tools\netcoreapp2.0\Walterlv.NuGetTool.dll</NuGetWalterlvToolPath>
  </PropertyGroup>

  <Target Name="WalterlvDemo" BeforeTargets="CoreCompile">
    <Exec Command="dotnet $(NuGetWalterlvToolPath)" />
  </Target>

</Project>
```

这样，我们就拥有了一个可以供用户设置的属性 `<IsInDemoToolDebugMode>` 了。

#### 准备一个用于测试此命令行工具的测试项目

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

![带有调试环境的解决方案](/static/posts/2018-05-12-08-13-03.png)

#### 调试命令行项目

为了保持根兄弟文章的结构一致，我依然保留了“调试项目”这一部分内容，但其实大家都懂，不是吗？—— **一个控制台程序，谁不会调试啊**！！！

但是——如果你希望能够在 MSBuild 或者 `dotnet build` 的环境下调试，就会发现，普通的调试方法并不能得到这样的环境——例如项目特定的参数。

加一句 `Debugger.Launch();` 是最简单的方法了。

```csharp
// Program.cs
using System;
using System.Diagnostics;

namespace Walterlv.NuGetTool
{
    class Program
    {
        static void Main(string[] args)
        {
            // 新增了启动调试器的代码。
            Debugger.Launch();
            Console.WriteLine("Hello World!");
        }
    }
}
```

这样，在使用 `msbuild` 或者 `dotnet build` 时，就会弹出一个调试器选择界面。

![选择调试器](/static/posts/2018-05-11-22-07-18.png)

当然，也有一些比较正统的方法，为了使这篇文章尽可能简单，我只附一张图，如果有需要，可以自己去尝试：

![使用“调试配置”调试](/static/posts/2018-05-12-08-40-14.png)

现在，即使我们去 Walterlv.Debug 目录下输入 `msbuild` 命令或 `dotnet build` 命令，也能进入我们的断点了：

### 第五步：发挥你的想象力

想象力是没有限制的，我们只需要在 .targets 文件里面向我们的控制台程序传入合适的参数，即可完成非常多的功能。

#### .targets 向控制台程序传参数

.targets 向控制台程序传参数只需要按照普通控制台程序传参的方式就可以了：

```xml
<!-- Assets\build\Walterlv.NuGetTool.targets -->
<Target Name="WalterlvDemo" BeforeTargets="CoreCompile">
  <Exec Command="dotnet $(NuGetWalterlvToolPath) -i $(IntermediateOutputPath)" />
</Target>
```

这里，`$(IntermediateOutputPath)` 是 msbuild 编译期间会自动设置的全局属性，代表此项目编译过程中临时文件的存放路径（也就是我们常见的 obj 文件夹）。当然，使用 `dotnet build` 或者 `dotnet msbuild` 也是有这样的全局属性的。

在 Program.cs 中，只需要解析命令行参数即可接收这样的传参。

```csharp
// Program.cs
using System;
using System.Diagnostics;

namespace Walterlv.NuGetTool
{
    class Program
    {
        static void Main(string[] args)
        {
            Debugger.Launch();
            var intermediateOutputPath = args[1];
            Console.WriteLine("Hello World!");
        }
    }
}
```

你可以尽情发挥你的想象力，传入更多让人意想不到的参数，实现不可思议的功能。更多 MSBuild 全局参数，可以参考我的另一篇文章[项目文件中的已知属性（知道了这些，就不会随便在 csproj 中写死常量啦） - 吕毅](/post/known-properties-in-csproj.html)。

#### 控制台程序向 .targets 返回数据

控制台程序的输出（也就是 `Console.WriteLine()` 那个）是能够直接和 MSBuild 的 Target 进行数据交换的。

有两种不同的方式：

1. 直接传数据，这些数据可以被捕获成属性或者项，具体可以阅读我的另一篇博客：
    - [如何使用 MSBuild Target（Exec）中的控制台输出](/post/exec-task-of-msbuild-target.html)
1. 报告编译警告和编译错误，具体可以阅读我的另一篇博客：
    - [如何在 MSBuild Target（Exec）中报告编译错误和编译警告](/post/standard-error-warning-format.html)

#### 使用命令执行完之后的结果

如果只是传入参数，那么我们顶多只能干一些不痛不痒的事情，我们应该使用我们的控制台程序做一些什么。什么？你说直接去改源代码？那万一你的代码不幸崩溃了，项目岂不被你破坏了！（当然，你去改了源码，还会破坏 MSBuild 的差量编译。）

所以，我们应该建立一种约定，要求控制台程序生成一些什么，然后在 .targets 里面取出使用。

```csharp
// Program.cs
using System;
using System.Diagnostics;
using System.IO;

namespace Walterlv.NuGetTool
{
    class Program
    {
        static void Main(string[] args)
        {
            Debugger.Launch();
            var additionalCompileFile = args[1];
            File.WriteAllText(additionalCompileFile,
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
            Console.WriteLine("Hello World!");
        }
    }
}
```

然后，我们需要在 .targets 文件里接收这个输出参数。然而命令行调用与 [如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包 - 吕毅](/post/create-a-cross-platform-msbuild-task-based-nuget-tool.html) 中所写的 Task 不同，命令行调用的后面是不能够立刻应用命令行调用的结果的，因为此时命令还没有结束。

所以我们需要写一个新的 Target，来使用命令行程序执行后的结果。

```xml
<!-- Assets\build\Walterlv.NuGetTool.targets -->
<Target Name="WalterlvDemo" BeforeTargets="CoreCompile">
  <Exec Command="dotnet $(NuGetWalterlvToolPath) -i $(IntermediateOutputPath)Doubi.cs" />
</Target>

<Target Name="WalterlvDemoUseResult" AfterTargets="WalterlvDemo" BeforeTargets="CoreCompile">
  <ItemGroup>
    <Compile Include="$(IntermediateOutputPath)Doubi.cs" />
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
  <Compile Include="$(IntermediateOutputPath)Doubi.cs" />
</ItemGroup>
```

需要注意：**编译期间才生成的项（`<ItemGroup>`）或者属性（`<PropertyGroup>`），需要写在 `<Target>` 节点的里面。**如果写在外面，则不是编译期间生效的，而是始终生效的。当写在外面时，要特别留意可能某些属性没有初始化完全，你应该只使用那些肯定能确认存在的属性或文件。

#### 加入差量编译支持

在本文的例子中，当你每次编译时，虽然核心的编译流程不怎么耗时，不过那个命令却是每次都执行。如果你觉得此命令的执行非常耗时，那么建议加入差量编译的支持。关于加入差量编译，可以参考我的另一篇文章[每次都要重新编译？太慢！让跨平台的 MSBuild/dotnet build 的 Target 支持差量编译](/post/msbuild-incremental-build.html)。

#### 本地测试 NuGet 包

在发布 NuGet 包之前，我们可以先在本地安装测试。由于我们在 `C:\Users\lvyi\Desktop\Walterlv.NuGetTool\Walterlv.NuGetTool\bin\Debug` 输出路径下已经有了打包好的 nupkg 文件，所以可以加一个本地 NuGet 源。

我们找一个其他的项目，然后在 Visual Studio 中设置 NuGet 源为我们那个 NuGet 工具项目的输出路径。

![设置本地 NuGet 包源](/static/posts/2018-05-11-23-53-47.png)

这时安装，编译完之后，我们就会发现我们的项目生成的 dll 中多出了一个“逗比(Doubi)”类，并且可以在那个项目中编写使用 `Doubi` 的代码了。

### 总结

制作一个跨平台的基于控制台的 NuGet 工具包虽然无关步骤比较多，但总体还算不太难，我们总结一下：

1. 准备项目的基本配置（设置各种必要的项目属性）
1. 建立好 NuGet 的文件夹结构
1. 编写 Target
1. 新增功能、调试和测试

如果你在实践的过程中遇到了各种问题，欢迎在下面留言，一般我会在一天之内给予回复。

如果在阅读这篇文章时存在一些概念理解上的问题，或者不知道如何扩展本文的功能，可能需要阅读下我的另一些文章：

- [理解 C# 项目 csproj 文件格式的本质和编译流程 - 吕毅](/post/understand-the-csproj.html)
- [项目文件中的已知属性（知道了这些，就不会随便在 csproj 中写死常量啦） - 吕毅](/post/known-properties-in-csproj.html)
- [项目文件中的已知 NuGet 属性（使用这些属性，创建 NuGet 包就可以不需要 nuspec 文件啦） - 吕毅](/post/known-nuget-properties-in-csproj.html)

当然，还有一些正在编写，过一段时间可以阅读到。

---

#### 参考资料

- [NuGet pack and restore as MSBuild targets - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/reference/msbuild-targets)
- [Bundling .NET build tools in NuGet](https://www.natemcmaster.com/blog/2017/11/11/build-tools-in-nuget/)
- [MSBuild Reserved and Well-Known Properties](https://msdn.microsoft.com/en-us/library/ms164309.aspx)
- [build process - How does MSBuild check whether a target is up to date or not? - Stack Overflow](https://stackoverflow.com/questions/6982372/how-does-msbuild-check-whether-a-target-is-up-to-date-or-not?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa)
- [How to: Build Incrementally](https://msdn.microsoft.com/en-us/library/ms171483.aspx)
- [Exec Task](https://msdn.microsoft.com/en-us/library/x8zx72cd.aspx)
- [Overwrite properties with MSBuild - Stack Overflow](https://stackoverflow.com/questions/1366840/overwrite-properties-with-msbuild?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa)
- [visual studio - How to get property value of a project file using msbuild - Stack Overflow](https://stackoverflow.com/questions/39732729/how-to-get-property-value-of-a-project-file-using-msbuild)
- [davidfowl/NuGetPowerTools: A bunch of powershell modules that make it even easier to work with nuget](https://github.com/davidfowl/NuGetPowerTools)
- [MSBuild and Skipping target "<TargetName>" because it has no outputs - Stack Overflow](https://stackoverflow.com/questions/27377095/msbuild-and-skipping-target-targetname-because-it-has-no-outputs)
- [Don't include dependencies from packages.config file when creating NuGet package - Stack Overflow](https://stackoverflow.com/questions/15012963/dont-include-dependencies-from-packages-config-file-when-creating-nuget-package?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa)
- [NuGet 2.7 Release Notes - Microsoft Docs](https://docs.microsoft.com/zh-cn/nuget/release-notes/nuget-2.7#Development-Only_Dependencies)
- [PackageReference should support DevelopmentDependency metadata · Issue #4125 · NuGet/Home](https://github.com/NuGet/Home/issues/4125)
