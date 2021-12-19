---
title: "从零开始制作 NuGet 源代码包（全面支持 .NET Core / .NET Framework / WPF 项目）"
publishDate: 2019-06-16 20:53:20 +0800
date: 2021-06-07 15:14:39 +0800
tags: dotnet csharp visualstudio nuget msbuild roslyn wpf
position: starter
---

默认情况下，我们打包 NuGet 包时，目标项目安装我们的 NuGet 包会引用我们生成的库文件（dll）。除此之外，我们也可以专门做 NuGet 工具包，还可以做 NuGet 源代码包。然而做源代码包可能是其中最困难的一种了，目标项目安装完后，这些源码将直接随目标项目一起编译。

本文将从零开始，教你制作一个支持 .NET 各种类型项目的源代码包。

---

<div id="toc"></div>

## 前置知识

在开始制作一个源代码包之间，建议你提前了解项目文件的一些基本概念：

- [理解 C# 项目 csproj 文件格式的本质和编译流程](/post/understand-the-csproj)

当然就算不了解也没有关系。跟着本教程你也可以制作出来一个源代码包，只不过可能遇到了问题的时候不容易调试和解决。

## 制作一个源代码包

接下来，我们将从零开始制作一个源代码包。

我们接下来的将创建一个完整的解决方案，这个解决方案包括：

1. 一个将打包成源代码包的项目
1. 一个调试专用的项目（可选）
1. 一个测试源代码包的项目（可选）

### 第一步：创建一个 .NET 项目

像其他 NuGet 包的引用项目一样，我们需要创建一个空的项目。不过差别是我们需要创建的是控制台程序。

![创建项目](/static/posts/2019-06-16-17-50-20.png)

当创建好之后，`Main` 函数中的所有内容都是不需要的，于是我们删除 `Main` 函数中的所有内容但保留 `Main` 函数。

这时 Program.cs 中的内容如下：

```csharp
namespace Walterlv.PackageDemo.SourceCode
{
    class Program
    {
        static void Main(string[] args)
        {
        }
    }
}
```

双击创建好的项目的项目，或者右键项目 “编辑项目文件”，我们可以编辑此项目的 csproj 文件。

在这里，我将目标框架改成了 `net48`。实际上如果我们不制作动态源代码生成，那么这里无论填写什么目标框架都不重要。在这篇博客中，我们主要篇幅都会是做静态源代码生成，所以你大可不必关心这里填什么。

提示：*如果 net48 让你无法编译这个项目，说明你电脑上没有装 .NET Framework 4.8 框架，请改成 net473, net472, net471, net47, net462, net 461, net46, net45, netcoreapp3.0, netcoreapp2.1, netcoreapp2.0 中的任何一个可以让你编译通过的目标框架即可。*

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net48</TargetFramework>
  </PropertyGroup>

</Project>
```

### 第二步：组织项目的目录结构

接下来，我们会让这个项目像一个 NuGet 包的样子。当然，是 NuGet 源代码包。

请在你的项目当中创建这些文件和文件夹：

```
- Assets
    - build
        + Package.props
        + Package.targets
    - buildMultiTargeting
        + Package.props
        + Package.targets
    - src
        + Foo.cs
    - tools
+ Program.cs
```

在这里，`-` 号表示文件夹，`+` 号表示文件。

Program.cs 是我们一开始就已经有的，可以不用管。src 文件夹里的 Foo.cs 是我随意创建的一个类，你就想往常创建正常的类文件一样创建一些类就好了。

比如我的 Foo.cs 里面的内容很简单：

```csharp
using System;

namespace Walterlv.PackageDemo.SourceCode
{
    internal class Foo
    {
        public static void Print() => Console.WriteLine("Walterlv is a 逗比.");
    }
}
```

props 和 targets 文件你可能在 Visual Studio 的新建文件的模板中找不到这样的模板文件。这不重要，你随便创建一个文本文件，然后将名称修改成上面列举的那样即可。接下来我们会依次修改这些文件中的所有内容，所以无需担心模板自动为我们生成了哪些内容。

为了更直观，我将我的解决方案截图贴出来，里面包含所有这些文件和文件夹的解释。

![目录结构](/static/posts/2019-06-16-18-22-20.png)

我特别说明了哪些文件和文件夹是必须存在的，哪些文件和文件夹的名称一定必须与本文说明的一样。如果你是以教程的方式阅读本文，建议所有的文件和文件夹都跟我保持一样的结构和名称；如果你已经对 NuGet 包的结构有一定了解，那么可自作主张修改一些名称。

### 第三步：编写项目文件 csproj

现在，我们要双击项目名称或者右键“编辑项目文件”来编辑项目的 csproj 文件

![编辑项目文件](/static/posts/2019-06-16-18-41-20.png)

我们编辑项目文件的目的，是让我们前一步创建的项目文件夹结构真正成为 NuGet 包中的文件夹结构。

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net48</TargetFramework>

    <!-- 要求此项目编译时要生成一个 NuGet 包。-->
    <GeneratePackageOnBuild>true</GeneratePackageOnBuild>

    <!-- 这里为了方便，我将 NuGet 包的输出路径设置在了解决方案根目录的 bin 文件夹下，而不是项目的 bin 文件夹下。-->
    <PackageOutputPath>..\bin\$(Configuration)</PackageOutputPath>

    <!-- 创建 NuGet 包时，项目的输出文件对应到 NuGet 包的 tools 文件夹，这可以避免目标项目引用我们的 NuGet 包的输出文件。
         同时，如果将来我们准备动态生成源代码，而不只是引入静态源代码，还可以有机会运行我们 Program 中的 Main 函数。-->
    <BuildOutputTargetFolder>tools</BuildOutputTargetFolder>

    <!-- 此包将不会传递依赖。意味着如果目标项目安装了此 NuGet 包，那么安装目标项目包的项目不会间接安装此 NuGet 包。-->
    <DevelopmentDependency>true</DevelopmentDependency>
    
    <!-- 包的版本号，我们设成了一个预览版；当然你也可以设置为正式版，即没有后面的 -alpha 后缀。-->
    <Version>0.1.0-alpha</Version>
    
    <!-- 设置包的作者。在上传到 nuget.org 之后，如果作者名与 nuget.org 上的账号名相同，其他人浏览包是可以直接点击链接看作者页面。-->
    <Authors>walterlv</Authors>

    <!-- 设置包的组织名称。我当然写成我所在的组织 dotnet 职业技术学院啦。-->
    <Company>dotnet-campus</Company>
  </PropertyGroup>

  <!-- 在生成 NuGet 包之前，我们需要将我们项目中的文件夹结构一一映射到 NuGet 包中。-->
  <Target Name="IncludeAllDependencies" BeforeTargets="_GetPackageFiles">
    <ItemGroup>

      <!-- 将 Package.props / Package.targets 文件的名称在 NuGet 包中改为需要的真正名称。
           因为 NuGet 包要自动导入 props 和 targets 文件，要求文件的名称必须是 包名.props 和 包名.targets；
           然而为了避免我们改包名的时候还要同步改四个文件的名称，所以就在项目文件中动态生成。-->
      <None Include="Assets\build\Package.props" Pack="True" PackagePath="build\$(PackageId).props" />
      <None Include="Assets\build\Package.targets" Pack="True" PackagePath="build\$(PackageId).targets" />
      <None Include="Assets\buildMultiTargeting\Package.props" Pack="True" PackagePath="buildMultiTargeting\$(PackageId).props" />
      <None Include="Assets\buildMultiTargeting\Package.targets" Pack="True" PackagePath="buildMultiTargeting\$(PackageId).targets" />

      <!-- 我们将 src 目录中的所有源代码映射到 NuGet 包中的 src 目录中。-->
      <None Include="Assets\src\**" Pack="True" PackagePath="src" />

    </ItemGroup>
  </Target>

</Project>
```

### 第四步：编写编译文件 targets

接下来，我们将编写编译文件 props 和 targets。注意，我们需要写的是四个文件的内容，不要弄错了。

如果我们做好的 NuGet 源码包被其他项目使用，那么这四个文件中的其中一对会在目标项目被自动导入（Import）。在你理解 [理解 C# 项目 csproj 文件格式的本质和编译流程](/post/understand-the-csproj) 一文内容之前，你可能不明白“导入”是什么意思。但作为从零开始的入门博客，你也不需要真的理解导入是什么意思，只要知道这四个文件中的代码将在目标项目编译期间运行就好。

#### buildMultiTargeting 文件夹中的 Package.props 文件

你只需要将下面的代码拷贝到 buildMultiTargeting 文件夹中的 Package.props 文件即可。注意将包名换成你自己的包名，也就是项目名。

```xml
<Project>

  <PropertyGroup>
    <MSBuildAllProjects>$(MSBuildAllProjects);$(MSBuildThisFileFullPath)</MSBuildAllProjects>
  </PropertyGroup>
  
  <!-- 为了简单起见，如果导入了这个文件，那么我们将直接再导入 ..\build\Walterlv.PackageDemo.SourceCode.props 文件。
       注意到了吗？我们并没有写 Package.props，因为我们在第三步编写项目文件时已经将这个文件转换为真实的包名了。-->
  <Import Project="..\build\Walterlv.PackageDemo.SourceCode.props" />

</Project>
```

#### buildMultiTargeting 文件夹中的 Package.targets 文件

你只需要将下面的代码拷贝到 buildMultiTargeting 文件夹中的 Package.targets 文件即可。注意将包名换成你自己的包名，也就是项目名。

```xml
<Project>

  <PropertyGroup>
    <MSBuildAllProjects>$(MSBuildAllProjects);$(MSBuildThisFileFullPath)</MSBuildAllProjects>
  </PropertyGroup>
  
  <!-- 为了简单起见，如果导入了这个文件，那么我们将直接再导入 ..\build\Walterlv.PackageDemo.SourceCode.targets 文件。
       注意到了吗？我们并没有写 Package.targets，因为我们在第三步编写项目文件时已经将这个文件转换为真实的包名了。-->
  <Import Project="..\build\Walterlv.PackageDemo.SourceCode.targets" />

</Project>
```

#### build 文件夹中的 Package.props 文件

下面是 build 文件夹中 Package.props 文件的全部内容。可以注意到我们几乎没有任何实质性的代码在里面。即便我们在此文件中还没有写任何代码，依然需要创建这个文件，因为后面第五步我们将添加更复杂的代码时将再次用到这个文件完成里面的内容。

现在，保持你的文件中的内容与下面一模一样就好。

```xml
<Project>

  <PropertyGroup>
    <MSBuildAllProjects>$(MSBuildAllProjects);$(MSBuildThisFileFullPath)</MSBuildAllProjects>
  </PropertyGroup>

</Project>
```

#### build 文件夹中的 Package.targets 文件

下面是 build 文件夹中的 Package.targets 文件的全部内容。

我们写了两个编译目标，即 Target。`_WalterlvDemoEvaluateProperties` 没有指定任何执行时机，但帮我们计算了两个属性：

- `_WalterlvDemoRoot` 即 NuGet 包的根目录
- `_WalterlvDemoSourceFolder` 即 NuGet 包中的源代码目录

另外，我们添加了一个 `Message` 任务，用于在编译期间显示一条信息，这对于调试来说非常方便。

`_WalterlvDemoIncludeSourceFiles` 这个编译目标指定在 `CoreCompile` 之前执行，并且执行需要依赖于 `_WalterlvDemoEvaluateProperties` 编译目标。这意味着当编译执行到 `CoreCompile` 步骤时，将在它执行之前插入 `_WalterlvDemoIncludeSourceFiles` 编译目标来执行，而 `_WalterlvDemoIncludeSourceFiles` 依赖于 `_WalterlvDemoEvaluateProperties`，于是 `_WalterlvDemoEvaluateProperties` 会插入到更之前执行。那么在微观上来看，这三个编译任务的执行顺序将是：`_WalterlvDemoEvaluateProperties` -> `_WalterlvDemoIncludeSourceFiles` -> `CoreCompile`。

`_WalterlvDemoIncludeSourceFiles` 中，我们定义了一个集合 `_WalterlvDemoCompile`，集合中包含 NuGet 包源代码文件夹中的所有 .cs 文件。另外，我们又定义了 `Compile` 集合，将 `_WalterlvDemoCompile` 集合中的所有内容添加到 `Compile` 集合中。`Compile` 是 .NET 项目中的一个已知集合，当 `CoreCompile` 执行时，所有 `Compile` 集合中的文件将参与编译。注意到我没有直接将 NuGet 包中的源代码文件引入到 `Compile` 集合中，而是经过了中转。后面第五步中，你将体会到这样做的作用。

我们也添加一个 `Message` 任务，用于在编译期间显示信息，便于调试。

```xml
<Project>

  <PropertyGroup>
    <MSBuildAllProjects>$(MSBuildAllProjects);$(MSBuildThisFileFullPath)</MSBuildAllProjects>
  </PropertyGroup>

  <Target Name="_WalterlvDemoEvaluateProperties">
    <PropertyGroup>
      <_WalterlvDemoRoot>$(MSBuildThisFileDirectory)..\</_WalterlvDemoRoot>
      <_WalterlvDemoSourceFolder>$(MSBuildThisFileDirectory)..\src\</_WalterlvDemoSourceFolder>
    </PropertyGroup>
    <Message Text="1. 初始化源代码包的编译属性" />
  </Target>

  <!-- 引入 C# 源码。 -->
  <Target Name="_WalterlvDemoIncludeSourceFiles"
          BeforeTargets="CoreCompile"
          DependsOnTargets="_WalterlvDemoEvaluateProperties">
    <ItemGroup>
      <_WalterlvDemoCompile Include="$(_WalterlvDemoSourceFolder)**\*.cs" />
      <Compile Include="@(_WalterlvDemoCompile)" />
    </ItemGroup>
    <Message Text="2 引入源代码包中的所有源代码：@(_WalterlvDemoCompile)" />
  </Target>

</Project>
```

#### 这四个文件分别的作用

我们刚刚花了很大的篇幅教大家完成 props 和 targets 文件，那么这四个文件是做什么的呢？

如果安装我们源代码包的项目使用 `TargetFramework` 属性写目标框架，那么 NuGet 会自动帮我们导入 build 文件夹中的两个编译文件。如果安装我们源代码包的项目使用 `TargetFrameworks`（注意复数形式）属性写目标框架，那么 NuGet 会自动帮我们导入 buildMultiTargeting 文件夹中的两个编译文件。

如果你对这个属性不熟悉，请回到第一步看我们一开始创建的代码，你会看到这个属性的设置的。如果还不清楚，请阅读博客：

- [让一个 csproj 项目指定多个开发框架](/post/configure-projects-to-target-multiple-platforms)

#### 体验和查看 NuGet 源代码包

也许你已经从本文拷贝了很多代码过去了，但直到目前我们还没有看到这些代码的任何效果，那么现在我们就可以来看看了。这可算是一个阶段性成果呢！

先编译生成一下我们一直在完善的项目，我们就可以在解决方案目录的 `bin\Debug` 目录下找到一个 NuGet 包。

![生成项目](/static/posts/2019-06-16-19-26-17.png)

![生成的 NuGet 包](/static/posts/2019-06-16-19-29-22.png)

现在，我们要打开这个 NuGet 包看看里面的内容。你需要先去应用商店下载 [NuGet Package Explorer](https://www.microsoft.com/store/productId/9WZDNCRDMDM3)，装完之后你就可以开始直接双击 NuGet 包文件，也就是 nupkg 文件。现在我们双击打开看看。

![NuGet 包中的内容](/static/posts/2019-06-16-19-32-06.png)

我们的体验到此为止。如果你希望在真实的项目当中测试，可以阅读其他博客了解如何在本地测试 NuGet 包。

### 第五步：加入 WPF 项目支持

截至目前，我们只是在源代码包中引入了 C# 代码。如果我们需要加入到源代码包中的代码包含 WPF 的 XAML 文件，或者安装我们源代码包的目标项目包含 WPF 的 XAML 文件，那么这个 NuGet 源代码包直接会导致无法编译通过。至于原因，你需要阅读我的另一篇博客来了解：

- [WPF 程序的编译过程](/post/how-wpf-assemblies-are-compiled)

即便你不懂 WPF 程序的编译过程，你也可以继续完成本文的所有内容，但可能就不会明白为什么接下来我们要那样去修改我们之前创建的文件。

接下来我们将修改这些文件：

- build 文件夹中的 Package.props 文件
- build 文件夹中的 Package.targets 文件

#### build 文件夹中的 Package.props 文件

自微软在 .NET SDK 5.0.2 开始修复了 WPF 项目中 NuGet 代码生成器的 bug 后，已经不需要在这里新增属性了。当然，如果你想增加其他的属性则可以在这里加。

关于这个 bug，详见：[[release/5.0] Support Source Generators in WPF projects by ryalanms · Pull Request #3846 · dotnet/wpf](https://github.com/dotnet/wpf/pull/3846)

~~在这个文件中，我们将新增一个属性 `ShouldFixNuGetImportingBugForWpfProjects`。这是我取的名字，意为“是否应该修复 WPF 项目中 NuGet 包自动导入的问题”。~~

~~我做一个开关的原因是怀疑我们需要针对 WPF 项目进行特殊处理是 WPF 项目自身的 Bug，如果将来 WPF 修复了这个 Bug，那么我们将可以直接通过此开关来关闭我们在这一节做的特殊处理。另外，后面我们将采用一些特别的手段来调试我们的 NuGet 源代码包，在调试项目中我们也会将这个属性设置为 `False` 以关闭 WPF 项目的特殊处理。~~

```diff
<Project>

    <PropertyGroup>
      <MSBuildAllProjects>$(MSBuildAllProjects);$(MSBuildThisFileFullPath)</MSBuildAllProjects>

--      <!-- 当生成 WPF 临时项目时，不会自动 Import NuGet 中的 props 和 targets 文件，这使得在临时项目中你现在看到的整个文件都不会参与编译。
--           然而，我们可以通过欺骗的方式在主项目中通过 _GeneratedCodeFiles 集合将需要编译的文件传递到临时项目中以间接参与编译。
--           WPF 临时项目不会 Import NuGet 中的 props 和 targets 可能是 WPF 的 Bug，也可能是刻意如此。
--           所以我们通过一个属性开关 `ShouldFixNuGetImportingBugForWpfProjects` 来决定是否修复这个错误。-->
--      <ShouldFixNuGetImportingBugForWpfProjects Condition=" '$(ShouldFixNuGetImportingBugForWpfProjects)' == '' ">True</ShouldFixNuGetImportingBugForWpfProjects>
    </PropertyGroup>

  </Project>
```

#### build 文件夹中的 Package.targets 文件

请按照下面的差异说明来修改你的 Package.targets 文件。实际上我们几乎删除任何代码，所以其实你可以将下面的所有内容作为你的新的 Package.targets 中的内容。

```diff
    <Project>

      <PropertyGroup>
        <MSBuildAllProjects>$(MSBuildAllProjects);$(MSBuildThisFileFullPath)</MSBuildAllProjects>
      </PropertyGroup>

++    <PropertyGroup>
++      <!-- 我们增加了一个属性，用于处理 WPF 特殊项目的源代码之前，确保我们已经收集到所有需要引入的源代码。 -->
++      <_WalterlvDemoImportInWpfTempProjectDependsOn>_WalterlvDemoIncludeSourceFiles</_WalterlvDemoImportInWpfTempProjectDependsOn>
++    </PropertyGroup>

      <Target Name="_WalterlvDemoEvaluateProperties">
        <PropertyGroup>
          <_WalterlvDemoRoot>$(MSBuildThisFileDirectory)..\</_WalterlvDemoRoot>
          <_WalterlvDemoSourceFolder>$(MSBuildThisFileDirectory)..\src\</_WalterlvDemoSourceFolder>

++    <!-- 修复旧版本的 Microsoft.NET.Sdk 中，WPF 项目不支持在临时项目中通过 NuGet 包生成源代码的问题。
++         微软自称从 .NET 5.0.2 开始，可通过 IncludePackageReferencesDuringMarkupCompilation 属性来支持在 NuGet 包中生成源代码，该值默认为 true。
++         不过，在低版本的 .NET 中，或者用户主动设置此值为 false 时，依然需要修复此问题。
++         以下是此问题的描述：-->
++    <!-- 当生成 WPF 临时项目时，不会自动 Import NuGet 中的 props 和 targets 文件，这使得在临时项目中你现在看到的整个文件都不会参与编译。
++        然而，我们可以通过欺骗的方式在主项目中通过 _GeneratedCodeFiles 集合将需要编译的文件传递到临时项目中以间接参与编译。
++        WPF 临时项目不会 Import NuGet 中的 props 和 targets 可能是 WPF 的 Bug，也可能是刻意如此。
++        所以我们通过一个属性开关 `ShouldFixNuGetImportingBugForWpfProjects` 来决定是否修复这个错误。-->
++    <ShouldFixNuGetImportingBugForWpfProjects Condition=" '$(IncludePackageReferencesDuringMarkupCompilation)' != 'True' And '$(ShouldFixNuGetImportingBugForWpfProjects)' == '' ">True</ShouldFixNuGetImportingBugForWpfProjects>

        </PropertyGroup>
        <Message Text="1. 初始化源代码包的编译属性" />
      </Target>

      <!-- 引入 C# 源码。 -->
      <Target Name="_WalterlvDemoIncludeSourceFiles"
              BeforeTargets="CoreCompile"
              DependsOnTargets="_WalterlvDemoEvaluateProperties">
        <ItemGroup>
          <_WalterlvDemoCompile Include="$(_WalterlvDemoSourceFolder)**\*.cs" />
++        <_WalterlvDemoAllCompile Include="@(_WalterlvDemoCompile)" />
          <Compile Include="@(_WalterlvDemoCompile)" />
        </ItemGroup>
--      <Message Text="2 引入源代码包中的所有源代码：@(_WalterlvDemoCompile)" />
++      <Message Text="2.1 引入源代码包中的所有源代码：@(_WalterlvDemoCompile)" />
      </Target>

++    <!-- 引入 WPF 源码。 -->
++    <Target Name="_WalterlvDemoIncludeWpfFiles"
++            BeforeTargets="MarkupCompilePass1"
++            DependsOnTargets="_WalterlvDemoEvaluateProperties">
++      <ItemGroup>
++        <_WalterlvDemoPage Include="$(_WalterlvDemoSourceFolder)**\*.xaml" />
++        <Page Include="@(_WalterlvDemoPage)" Link="%(_WalterlvDemoPage.FileName).xaml" />
++      </ItemGroup>
++      <Message Text="2.2 引用 WPF 相关源码：@(_WalterlvDemoPage)" />
++    </Target>

++    <!-- 当生成 WPF 临时项目时，不会自动 Import NuGet 中的 props 和 targets 文件，这使得在临时项目中你现在看到的整个文件都不会参与编译。
++         然而，我们可以通过欺骗的方式在主项目中通过 _GeneratedCodeFiles 集合将需要编译的文件传递到临时项目中以间接参与编译。
++         WPF 临时项目不会 Import NuGet 中的 props 和 targets 可能是 WPF 的 Bug，也可能是刻意如此。
++         所以我们通过一个属性开关 `ShouldFixNuGetImportingBugForWpfProjects` 来决定是否修复这个错误。-->
++    <Target Name="_WalterlvDemoImportInWpfTempProject"
++            AfterTargets="MarkupCompilePass1"
++            BeforeTargets="GenerateTemporaryTargetAssembly"
++            DependsOnTargets="$(_WalterlvDemoImportInWpfTempProjectDependsOn)"
++            Condition=" '$(ShouldFixNuGetImportingBugForWpfProjects)' == 'True' ">
++      <ItemGroup>
++        <_GeneratedCodeFiles Include="@(_WalterlvDemoAllCompile)" />
++      </ItemGroup>
++      <Message Text="3. 正在欺骗临时项目，误以为此 NuGet 包中的文件是 XAML 编译后的中间代码：@(_WalterlvDemoAllCompile)" />
++    </Target>

    </Project>
```

我们增加了 `_WalterlvDemoImportInWpfTempProjectDependsOn` 属性，这个属性里面将填写一个到多个编译目标（Target）的名称（多个用分号分隔），用于告知 `_WalterlvDemoImportInWpfTempProject` 这个编译目标在执行之前必须确保执行的依赖编译目标。而我们目前的依赖目标只有一个，就是 `_WalterlvDemoIncludeSourceFiles` 这个引入 C# 源代码的编译目标。如果你有其他考虑有引入更多 C# 源代码的编译目标，则需要把他们都加上（当然本文是不需要的）。为此，我还新增了一个 `_WalterlvDemoAllCompile` 集合，如果存在多个依赖的编译目标会引入 C# 源代码，则需要像 `_WalterlvDemoIncludeSourceFiles` 一样，将他们都加入到 `Compile` 的同时也加入到 `_WalterlvDemoAllCompile` 集合中。

为什么可能有多个引入 C# 源代码的编译目标？因为本文我们只考虑了引入我们提前准备好的源代码放入源代码包中，而我们提到过可能涉及到动态生成 C# 源代码的需求。如果你有一两个编译目标会动态生成一些 C# 源代码并将其加入到 `Compile` 集合中，那么请将这个编译目标的名称加入到 `_WalterlvDemoImportInWpfTempProjectDependsOn` 属性（注意多个用分号分隔），同时将集合也引入一份到 `_WalterlvDemoAllCompile` 中。

`_WalterlvDemoIncludeWpfFiles` 这个编译目标的作用是引入 WPF 的 XAML 文件，这很容易理解，毕竟我们的源代码中包含 WPF 相关的文件。

**请特别注意**：

1. 我们加了一个 `Link` 属性，并且将其指定为 `%(_WalterlvDemoPage.FileName).xaml`。这意味着我们会把所有的 XAML 文件都当作在项目根目录中生成，如果你在其他的项目中用到了相对或绝对的 XAML 文件的路径，这显然会改变路径。但是，我们没有其他的方法来根据 XAML 文件所在的目录层级来自定指定 `Link` 属性让其在正确的层级上，所以这里才写死在根目录中。
    - 如果要解决这个问题，我们就需要在生成 NuGet 包之前生成此项目中所有 XAML 文件的正确的 `Link` 属性（例如改为 `Views\%(_WalterlvDemoPage.FileName).xaml`），这意味着需要在此项目编译期间执行一段代码，把 Package.targets 文件中为所有的 XAML 文件生成正确的 `Link` 属性。本文暂时不考虑这个问题，但你可以参考 [dotnet-campus/SourceYard](https://github.com/dotnet-campus/SourceYard) 项目来了解如何动态生成 `Link`。
1. 我们使用了 `_WalterlvDemoPage` 集合中转地存了 XAML 文件，这是必要的。因为这样才能正确通过 `%` 符号获取到 `FileName` 属性。

而 `_WalterlvDemoImportInWpfTempProject` 这个编译目标就不那么好理解了，而这个也是完美支持 WPF 项目源代码包的关键编译目标！这个编译目标指定在 `MarkupCompilePass1` 之后，`GenerateTemporaryTargetAssembly` 之前执行。`GenerateTemporaryTargetAssembly` 编译目标的作用是生成一个临时的项目，用于让 WPF 的 XAML 文件能够依赖同项目的 .NET 类型而编译。然而此临时项目编译期间是不会导入任何 NuGet 的 props 或 targets 文件的，这意味着我们特别添加的所有 C# 源代码在这个临时项目当中都是不存在的——如果项目使用到了我们源代码包中的源代码，那么必然因为类型不存在而无法编译通过——临时项目没有编译通过，那么整个项目也就无法编译通过。但是，我们通过在 `MarkupCompilePass1` 和 `GenerateTemporaryTargetAssembly` 之间将我们源代码包中的所有源代码加入到 `_GeneratedCodeFiles` 集合中，即可将这些文件加入到临时项目中一起编译。而原本 `_GeneratedCodeFiles` 集合中是什么呢？就是大家熟悉的 XAML 转换而成的 `xxx.g.cs` 文件。

### 测试和发布源代码包

现在我们再次编译这个项目，你将得到一个支持 WPF 项目的 NuGet 源代码包。

## 完整项目结构和源代码

至此，我们已经完成了编写一个 NuGet 源代码包所需的全部源码。接下来你可以在项目中添加更多的源代码，这样打出来的源代码包也将包含更多源代码。由于我们将将 XAML 文件都通过 `Link` 属性指定到根目录了，所以如果你需要添加 XAML 文件，你将只能添加到我们项目中的 `Assets\src` 目录下，除非做 [dotnet-campus/SourceYard](https://github.com/dotnet-campus/SourceYard) 中类似的动态 `Link` 生成的处理，或者在 Package.targets 文件中手工为每一个 XAML 编写一个特别的 `Link` 属性。

另外，在不改变我们整体项目结构的情况下，你也可以任意添加 WPF 所需的图片资源等。但也需要在 Package.targets 中添加额外的 `Resource` 引用。如果没有 [dotnet-campus/SourceYard](https://github.com/dotnet-campus/SourceYard) 的自动生成代码，你可能也需要手工编写 `Resource`。

接下来我会贴出更复杂的代码，用于处理更复杂的源代码包的场景。

### 目录结构

更复杂源代码包的项目组织形式会是下面这样图这样：

![更复杂的源代码包项目结构](/static/posts/2019-06-16-20-41-40.png)

我们在 Assets 文件夹中新增了一个 assets 文件夹。由于资源在此项目中的路径必须和安装后的目标项目中一样才可以正确用 Uri 的方式使用资源，所以我们在项目文件 csproj 和编译文件 Package.targets 中都对这两个文件设置了 `Link` 到同一个文件夹中，这样才可以确保两边都能正常使用。

我们在 src 文件夹的不同子文件夹中创建了 XAML 文件。按照我们前面的说法，我们也需要像资源文件一样正确在 Package.targets 中设置 Link 才可以确保 Uri 是一致的。注意，我们接下来的源代码中没有在项目文件中设置 Link，原则上也是需要设置的，就像资源一样，这样才可以确保此项目和安装此 NuGet 包中的目标项目具有相同的 XAML Uri。此例子只是因为没有代码使用到了 XAML 文件的路径，所以才能得以幸免。

我们还利用了 tools 文件夹。我们在项目文件的末尾将输出文件拷贝到了 tools 目录下，这样，我们项目的 Assets 文件夹几乎与最终的 NuGet 包的文件夹结构一模一样，非常利于调试。但为了防止将生成的文件上传到版本管理，我在 tools 中添加了 .gitignore 文件：

```
/net*/*
```

### 项目文件

```diff
--  <Project Sdk="Microsoft.NET.Sdk">
++  <Project Sdk="Microsoft.NET.Sdk.WindowsDesktop">
    
      <PropertyGroup>
        <OutputType>Exe</OutputType>
        <TargetFramework>net48</TargetFramework>
++      <UseWpf>True</UseWpf>
    
        <!-- 要求此项目编译时要生成一个 NuGet 包。-->
        <GeneratePackageOnBuild>true</GeneratePackageOnBuild>
    
        <!-- 这里为了方便，我将 NuGet 包的输出路径设置在了解决方案根目录的 bin 文件夹下，而不是项目的 bin 文件夹下。-->
        <PackageOutputPath>..\bin\$(Configuration)</PackageOutputPath>
    
        <!-- 创建 NuGet 包时，项目的输出文件对应到 NuGet 包的 tools 文件夹，这可以避免目标项目引用我们的 NuGet 包的输出文件。
             同时，如果将来我们准备动态生成源代码，而不只是引入静态源代码，还可以有机会运行我们 Program 中的 Main 函数。-->
        <BuildOutputTargetFolder>tools</BuildOutputTargetFolder>
    
        <!-- 此包将不会传递依赖。意味着如果目标项目安装了此 NuGet 包，那么安装目标项目包的项目不会间接安装此 NuGet 包。-->
        <DevelopmentDependency>true</DevelopmentDependency>
    
        <!-- 包的版本号，我们设成了一个预览版；当然你也可以设置为正式版，即没有后面的 -alpha 后缀。-->
        <Version>0.1.0-alpha</Version>
    
        <!-- 设置包的作者。在上传到 nuget.org 之后，如果作者名与 nuget.org 上的账号名相同，其他人浏览包是可以直接点击链接看作者页面。-->
        <Authors>walterlv</Authors>
    
        <!-- 设置包的组织名称。我当然写成我所在的组织 dotnet 职业技术学院啦。-->
        <Company>dotnet-campus</Company>
      </PropertyGroup>
    
++    <!-- 我们添加的其他资源需要在这里 Link 到一个统一的目录下，以便在此项目和安装 NuGet 包的目标项目中可以用同样的 Uri 使用。 -->
++    <ItemGroup>
++      <Resource Include="Assets\assets\Icon.ico" Link="Assets\Icon.ico" Visible="False" />
++      <Resource Include="Assets\assets\Background.png" Link="Assets\Background.png" Visible="False" />
++    </ItemGroup>
      
      <!-- 在生成 NuGet 包之前，我们需要将我们项目中的文件夹结构一一映射到 NuGet 包中。-->
      <Target Name="IncludeAllDependencies" BeforeTargets="_GetPackageFiles">
        <ItemGroup>
    
          <!-- 将 Package.props / Package.targets 文件的名称在 NuGet 包中改为需要的真正名称。
               因为 NuGet 包要自动导入 props 和 targets 文件，要求文件的名称必须是 包名.props 和 包名.targets；
               然而为了避免我们改包名的时候还要同步改四个文件的名称，所以就在项目文件中动态生成。-->
          <None Include="Assets\build\Package.props" Pack="True" PackagePath="build\$(PackageId).props" />
          <None Include="Assets\build\Package.targets" Pack="True" PackagePath="build\$(PackageId).targets" />
          <None Include="Assets\buildMultiTargeting\Package.props" Pack="True" PackagePath="buildMultiTargeting\$(PackageId).props" />
          <None Include="Assets\buildMultiTargeting\Package.targets" Pack="True" PackagePath="buildMultiTargeting\$(PackageId).targets" />
    
          <!-- 我们将 src 目录中的所有源代码映射到 NuGet 包中的 src 目录中。-->
          <None Include="Assets\src\**" Pack="True" PackagePath="src" />

++        <!-- 我们将 assets 目录中的所有源代码映射到 NuGet 包中的 assets 目录中。-->
++        <None Include="Assets\assets\**" Pack="True" PackagePath="assets" />
    
        </ItemGroup>
      </Target>
    
++    <!-- 在编译结束后将生成的可执行程序放到 Tools 文件夹中，使得 Assets 文件夹的目录结构与 NuGet 包非常相似，便于 Sample 项目进行及时的 NuGet 包调试。 -->
++    <Target Name="_WalterlvDemoCopyOutputToDebuggableFolder" AfterTargets="AfterBuild">
++        <ItemGroup>
++        <_WalterlvDemoToCopiedFiles Include="$(OutputPath)**" />
++        </ItemGroup>
++        <Copy SourceFiles="@(_WalterlvDemoToCopiedFiles)" DestinationFolder="Assets\tools\$(TargetFramework)" />
++    </Target>

    </Project>
```

### 编译文件

```diff
    <Project>

      <PropertyGroup>
        <MSBuildAllProjects>$(MSBuildAllProjects);$(MSBuildThisFileFullPath)</MSBuildAllProjects>
      </PropertyGroup>

      <PropertyGroup>
        <!-- 我们增加了一个属性，用于处理 WPF 特殊项目的源代码之前，确保我们已经收集到所有需要引入的源代码。 -->
        <_WalterlvDemoImportInWpfTempProjectDependsOn>_WalterlvDemoIncludeSourceFiles</_WalterlvDemoImportInWpfTempProjectDependsOn>
      </PropertyGroup>

      <Target Name="_WalterlvDemoEvaluateProperties">
        <PropertyGroup>
          <_WalterlvDemoRoot>$(MSBuildThisFileDirectory)..\</_WalterlvDemoRoot>
          <_WalterlvDemoSourceFolder>$(MSBuildThisFileDirectory)..\src\</_WalterlvDemoSourceFolder>
        </PropertyGroup>
        <Message Text="1. 初始化源代码包的编译属性" />
      </Target>

      <!-- 引入主要的 C# 源码。 -->
      <Target Name="_WalterlvDemoIncludeSourceFiles"
              BeforeTargets="CoreCompile"
              DependsOnTargets="_WalterlvDemoEvaluateProperties">
        <ItemGroup>
          <_WalterlvDemoCompile Include="$(_WalterlvDemoSourceFolder)**\*.cs" />
          <_WalterlvDemoAllCompile Include="@(_WalterlvDemoCompile)" />
          <Compile Include="@(_WalterlvDemoCompile)" />
        </ItemGroup>
        <Message Text="2.1 引入源代码包中的所有源代码：@(_WalterlvDemoCompile)" />
      </Target>

      <!-- 引入 WPF 源码。 -->
      <Target Name="_WalterlvDemoIncludeWpfFiles"
              BeforeTargets="MarkupCompilePass1"
              DependsOnTargets="_WalterlvDemoEvaluateProperties">
        <ItemGroup>
--        <_WalterlvDemoPage Include="$(_WalterlvDemoSourceFolder)**\*.xaml" />
--        <Page Include="@(_WalterlvDemoPage)" Link="Views\%(_WalterlvDemoPage.FileName).xaml" />
++        <_WalterlvDemoRootPage Include="$(_WalterlvDemoSourceFolder)FooView.xaml" />
++        <Page Include="@(_WalterlvDemoRootPage)" Link="Views\%(_WalterlvDemoRootPage.FileName).xaml" />
++        <_WalterlvDemoThemesPage Include="$(_WalterlvDemoSourceFolder)Themes\Walterlv.Windows.xaml" />
++        <Page Include="@(_WalterlvDemoThemesPage)" Link="Views\%(_WalterlvDemoThemesPage.FileName).xaml" />
++        <_WalterlvDemoIcoResource Include="$(_WalterlvDemoRoot)assets\*.ico" />
++        <_WalterlvDemoPngResource Include="$(_WalterlvDemoRoot)assets\*.png" />
++        <Resource Include="@(_WalterlvDemoIcoResource)" Link="assets\%(_WalterlvDemoIcoResource.FileName).ico" />
++        <Resource Include="@(_WalterlvDemoPngResource)" Link="assets\%(_WalterlvDemoPngResource.FileName).png" />
        </ItemGroup>
--      <Message Text="2.2 引用 WPF 相关源码：@(_WalterlvDemoPage);@(_WalterlvDemoIcoResource);@(_WalterlvDemoPngResource)" />
++      <Message Text="2.2 引用 WPF 相关源码：@(_WalterlvDemoRootPage);@(_WalterlvDemoThemesPage);@(_WalterlvDemoIcoResource);@(_WalterlvDemoPngResource)" />
      </Target>

      <!-- 当生成 WPF 临时项目时，不会自动 Import NuGet 中的 props 和 targets 文件，这使得在临时项目中你现在看到的整个文件都不会参与编译。
           然而，我们可以通过欺骗的方式在主项目中通过 _GeneratedCodeFiles 集合将需要编译的文件传递到临时项目中以间接参与编译。
           WPF 临时项目不会 Import NuGet 中的 props 和 targets 可能是 WPF 的 Bug，也可能是刻意如此。
           所以我们通过一个属性开关 `ShouldFixNuGetImportingBugForWpfProjects` 来决定是否修复这个错误。-->
      <Target Name="_WalterlvDemoImportInWpfTempProject"
              AfterTargets="MarkupCompilePass1"
              BeforeTargets="GenerateTemporaryTargetAssembly"
              DependsOnTargets="$(_WalterlvDemoImportInWpfTempProjectDependsOn)"
              Condition=" '$(ShouldFixNuGetImportingBugForWpfProjects)' == 'True' ">
        <ItemGroup>
          <_GeneratedCodeFiles Include="@(_WalterlvDemoAllCompile)" />
        </ItemGroup>
        <Message Text="3. 正在欺骗临时项目，误以为此 NuGet 包中的文件是 XAML 编译后的中间代码：@(_WalterlvDemoAllCompile)" />
      </Target>

    </Project>
```

### 开源项目

本文涉及到的所有代码均已开源到：

- [walterlv.demo/Walterlv.PackageDemo at master · walterlv/walterlv.demo](https://github.com/walterlv/walterlv.demo/tree/master/Walterlv.PackageDemo)

## 更多内容

### SourceYard 开源项目

本文服务于开源项目 SourceYard，为其提供支持 WPF 项目的解决方案。[dotnet-campus/SourceYard: Add a NuGet package only for dll reference? By using dotnetCampus.SourceYard, you can pack a NuGet package with source code. By installing the new source code package, all source codes behaviors just like it is in your project.](https://github.com/dotnet-campus/SourceYard)

### 相关博客

更多制作源代码包的博客可以阅读。从简单到复杂的顺序：

- [将 .NET Core 项目打一个最简单的 NuGet 源码包，安装此包就像直接把源码放进项目一样 - 吕毅](/post/the-simplest-way-to-pack-a-source-code-nuget-package)
- [Roslyn 如何基于 Microsoft.NET.Sdk 制作源代码包 - 林德熙](https://blog.lindexi.com/post/roslyn-%E5%A6%82%E4%BD%95%E5%9F%BA%E4%BA%8E-microsoft.net.sdk-%E5%88%B6%E4%BD%9C%E6%BA%90%E4%BB%A3%E7%A0%81%E5%8C%85)
- [制作通过 NuGet 分发的源代码包时，如果目标项目是 WPF 则会出现一些问题（探索篇，含解决方案） - 吕毅](/post/issues-of-nuget-package-import-for-wpf-projects)
- [SourceYard 制作源代码包 - 林德熙](https://blog.lindexi.com/post/sourceyard-%E5%88%B6%E4%BD%9C%E6%BA%90%E4%BB%A3%E7%A0%81%E5%8C%85)
