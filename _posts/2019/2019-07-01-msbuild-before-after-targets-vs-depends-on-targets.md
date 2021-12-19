---
title: ".NET / MSBuild 扩展编译时什么时候用 BeforeTargets / AfterTargets 什么时候用 DependsOnTargets？"
date: 2019-07-01 16:43:43 +0800
tags: visualstudio msbuild nuget dotnet
position: principle
permalink: /posts/msbuild-before-after-targets-vs-depends-on-targets.html
---

在为 .NET 项目扩展 MSBuild 编译而编写编译目标（Target）时，我们会遇到用于扩展编译目标用的属性 `BeforeTargets` `AfterTargets` 和 `DependsOnTargets`。

这三个应该分别在什么情况下用呢？本文将介绍其用法。

---

## `BeforeTargets` / `AfterTargets`

`BeforeTargets` 和 `AfterTargets` 是用来扩展编译用的。

如果你希望在某个编译任务开始执行一定要执行你的编译目标，那么请使用 `BeforeTargets`。例如我想多添加一个文件加入编译，那么写：

```xml
<Target Name="_WalterlvIncludeSourceFiles"
        BeforeTargets="CoreCompile">
  <ItemGroup>
    <Compile Include="$(MSBuildThisFileFullPath)..\src\Foo.cs" />
  </ItemGroup>
</Target>
```

这样，一个 Foo.cs 就会在编译时加入到被编译的文件列表中，里面的 `Foo` 类就可以被使用了。这也是 NuGet 源代码包的核心原理部分。关于 NuGet 源代码包的制作方法，可以扩展阅读：

- [将 .NET Core 项目打一个最简单的 NuGet 源码包，安装此包就像直接把源码放进项目一样](/post/the-simplest-way-to-pack-a-source-code-nuget-package)
- [从零开始制作 NuGet 源代码包（全面支持 .NET Core / .NET Framework / WPF 项目）](/post/build-source-code-package-for-wpf-projects)

如果你希望一旦执行完某个编译任务之后执行某个操作，那么请使用 `AfterTargets`。例如我想在编译完成生成了输出文件之后，将这些输出文件拷贝到另一个调试目录，那么写：

```xml
<Target Name="CopyOutputLibToFastDebug" AfterTargets="AfterBuild">
  <ItemGroup>
    <OutputFileToCopy Include="$(OutputPath)$(AssemblyName).dll"></OutputFileToCopy>
    <OutputFileToCopy Include="$(OutputPath)$(AssemblyName).pdb"></OutputFileToCopy>
  </ItemGroup>
  <Copy SourceFiles="@(OutputFileToCopy)" DestinationFolder="$(MainProjectPath)"></Copy>
</Target>
```

这种写法可以进行快速的组件调试。下面这篇博客就是用到了 `AfterTargets` 带来的此机制来实现的：

- [Roslyn 让 VisualStudio 急速调试底层库方法](https://blog.lindexi.com/post/roslyn-%E8%AE%A9-visualstudio-%E6%80%A5%E9%80%9F%E8%B0%83%E8%AF%95%E5%BA%95%E5%B1%82%E5%BA%93%E6%96%B9%E6%B3%95)

如果 `BeforeTargets` 和 `AfterTargets` 中写了多个 Target 的名称（用分号分隔），那么只要任何一个准备执行或者执行完毕，就会触发此 Target 的执行。

## `DependsOnTargets`

而 `DependsOnTargets` 是用来指定依赖的。

`DependsOnTargets` 并不会直接帮助你扩展一个编译目标，也就是说如果你只为你的 Target 写了一个名字，然后添加了 `DependsOnTargets` 属性，那么你的 Target 在编译期间根本都不会执行。

但是，使用 `DependsOnTargets`，你可以更好地控制执行流程和其依赖关系。

例如上面的 `CopyOutputLibToFastDebug` 这个将输出文件复制到另一个目录的编译目标（Target），依赖于一个 `MainProjectPath` 属性，因此计算这个属性值的编译目标（Target）应该设成此 Target 的依赖。

当 A 的 `DependsOnTargets` 设置为 `B;C;D` 时，那么一旦准备执行 A 时将会发生：

- 如果 B C D 中任何一个曾经已经执行过，那么就忽略（因为已经执行过了）
- 如果 B C D 中还有没有执行的，就立刻执行

## 实践

当我们实际上在扩展编译的时候，我们会用到不止一个编译目标，因此这几个属性都是混合使用的。但是，你应该在合适的地方编写合适的属性设置。

例如我们做一个 NuGet 包，这个 NuGet 包的 .targets 文件中写了下面几个 Target：

1. _WalterlvEvaluateProperties
    - 用于初始化一些属性和参数，其他所有的 Target 都依赖于这些参数
1. _WalterlvGenerateStartupObject
    - 生成一个类，包含 Main 入口点函数，然后将入口点设置成这个类
1. _WalterlvIncludeSourceFiles
    - 为目标项目添加一些源代码，这就包含刚刚新生成的入口点类
1. _WalterlvPackOutput
    - 将目标项目中生成的文件进行自定义打包

那么我们改如何为每一个 Target 设置正确的属性呢？

第一步：找出哪些编译目标是真正完成编译任务的，这些编译目标需要通过 `BeforeTargets` 和 `AfterTarget` 设置扩展编译。

于是我们可以找到 `_WalterlvIncludeSourceFiles`、`_WalterlvPackOutput`。

- `_WalterlvIncludeSourceFiles` 需要添加参与编译的源代码文件，因此我们需要将 `BeforeTargets` 设置为 `CoreCompile`。
- `_WalterlvPackOutput` 需要在编译完成后进行自定义打包，因此我们将 `AfterTargets` 设置为 `AfterBuild`。这个时候可以确保文件已经生成完毕可以使用了。

第二步：找到依赖关系，这些依赖关系需要通过 `DependsOnTargets` 来执行。

于是我们可以找到 `_WalterlvEvaluateProperties`、`_WalterlvGenerateStartupObject`。

- `_WalterlvEvaluateProperties` 被其他所有的编译目标使用了，因此，我们需要将后面所有的 `DependsOnTargets` 属性设置为 `_WalterlvEvaluateProperties`。
- `_WalterlvGenerateStartupObject` 生成的入口点函数被 `_WalterlvIncludeSourceFiles` 加入到编译中，因此 `_WalterlvIncludeSourceFiles` 的 `DependsOnTargets` 属性需要添加 `_WalterlvGenerateStartupObject`（添加方法是使用分号“;”分隔）。

将所有的这些编译任务合在一起写，将是下面这样：

```xml
<Target Name="_WalterlvEvaluateProperties">
</Target>
<Target Name="_WalterlvGenerateStartupObject"
        DependsOnTargets="_WalterlvEvaluateProperties">
</Target>
<Target Name="_WalterlvIncludeSourceFiles"
        BeforeTargets="CoreCompile"
        DependsOnTargets="_WalterlvEvaluateProperties;_WalterlvGenerateStartupObject">
</Target>
<Target Name="_WalterlvPackOutput"
        AfterTargets="AfterBuild"
        DependsOnTargets="_WalterlvEvaluateProperties">
</Target>
```

## 具体依赖于抽象

我们平时在编写代码时会考虑面向对象的六个原则，其中有一个是依赖倒置原则，即具体依赖于抽象。

你不这么写代码当然不会带来错误，但会带来维护性困难。在编写扩展编译目标的时候，这一条同样适用。

假如我们要写的编译目标不止上面这些，还有更多：

- _WalterlvConvertTemplateCompileToRealCompile
    - 包里有一些模板代码，会在编译期间转换为真实代码并加入编译
- _WalterlvConditionalImportedSourceCode
    - 会根据 NuGet 包用户的设置有条件地引入一些额外的源代码

那么这个时候我们前面写的用于引入源代码的 `_WalterlvIncludeSourceFiles` 编译目标其依赖的 Target 会更多。似乎看起来应该这么写了：

```xml
<Target Name="_WalterlvIncludeSourceFiles"
        BeforeTargets="CoreCompile"
        DependsOnTargets="_WalterlvEvaluateProperties;_WalterlvGenerateStartupObject;_WalterlvConvertTemplateCompileToRealCompile;_WalterlvConditionalImportedSourceCode">
</Target>
```

但你小心：

1. 这个列表会越来越长，而且指不定还会增加一些边边角角的引入的新的源代码呢
1. `_WalterlvConditionalImportedSourceCode` 是有条件的，而我们 `DependsOnTargets` 这样的写法会导致这个 Target 的条件失效

这里更抽象的编译目标是 `_WalterlvIncludeSourceFiles`，我们的依赖关系倒置了！

为了解决这样的问题，我们引入一个新的属性 `_WalterlvIncludeSourceFilesDependsOn`，如果有编译目标在编译过程中生成了新的源代码，那么就需要将自己加入到此属性中。

现在的源代码看起来是这样的：

```xml
<!-- 这里是一个文件 -->

<PropertyGroup>
  <_WalterlvIncludeSourceFilesDependsOn>
    $(_WalterlvIncludeSourceFilesDependsOn);
    _WalterlvGenerateStartupObject
  </_WalterlvIncludeSourceFilesDependsOn>
</PropertyGroup>

<Target Name="_WalterlvEvaluateProperties">
</Target>
<Target Name="_WalterlvGenerateStartupObject"
        DependsOnTargets="_WalterlvEvaluateProperties">
</Target>
<Target Name="_WalterlvIncludeSourceFiles"
        BeforeTargets="CoreCompile"
        DependsOnTargets="$(_WalterlvIncludeSourceFilesDependsOn)">
</Target>
<Target Name="_WalterlvPackOutput"
        AfterTargets="AfterBuild"
        DependsOnTargets="_WalterlvEvaluateProperties">
</Target>
```

```xml
<!-- 这里是另一个文件 -->

<PropertyGroup>
  <_WalterlvIncludeSourceFilesDependsOn>
    $(_WalterlvIncludeSourceFilesDependsOn);
    _WalterlvConvertTemplateCompileToRealCompile;
    _WalterlvConditionalImportedSourceCode
  </_WalterlvIncludeSourceFilesDependsOn>
</PropertyGroup>

<PropertyGroup Condition=" '$(UseWalterlvDemoCode)' == 'True' ">
  <_WalterlvIncludeSourceFilesDependsOn>
    $(_WalterlvIncludeSourceFilesDependsOn);
    _WalterlvConditionalImportedSourceCode
  </_WalterlvIncludeSourceFilesDependsOn>
</PropertyGroup>

<Target Name="_WalterlvConvertTemplateCompileToRealCompile"
        DependsOnTargets="_WalterlvEvaluateProperties">
</Target>
<Target Name="_WalterlvConditionalImportedSourceCode"
        Condition=" '$(UseWalterlvDemoCode)' == 'True' "
        DependsOnTargets="_WalterlvEvaluateProperties">
</Target>
```

实际上，Microsoft.NET.Sdk 内部有很多的编译任务是通过这种方式提供的扩展，例如：

- BuildDependsOn
- CleanDependsOn
- CompileDependsOn

你可以阅读我的另一篇博客了解更多：

- [通过重写预定义的 Target 来扩展 MSBuild / Visual Studio 的编译过程](/post/extend-the-visual-studio-build-process)

