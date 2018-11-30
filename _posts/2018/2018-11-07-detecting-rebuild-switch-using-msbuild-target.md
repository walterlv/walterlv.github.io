---
title: "编写 Target 检测 MSBuild / dotnet build 此次编译是否是差量编译"
publishDate: 2018-11-07 21:24:56 +0800
date: 2018-11-28 16:25:46 +0800
categories: visualstudio msbuild
---

MSBuild 或 Roslyn 编译项目时均支持差量编译，毕竟为了性能。我在 [每次都要重新编译？太慢！让跨平台的 MSBuild/dotnet build 的 Target 支持差量编译](/post/msbuild-incremental-build.html) 一文中介绍了如何使一个 Target 支持差量编译。在那篇文章中我说到差量编译会导致 Target 不执行；也就是说，如果一个 Target 对后续的编译会产生影响，那么一定不能设置为差量编译。

不过，真的会写出一些非常耗时的 Target，但是它会对后续的编译产生影响。这些 Target 如果要做差量编译，那么就不能直接使用原生的差量编译方案了。本文将介绍如何处理这样的情况。

---

<div id="toc"></div>

### 我们遇到的问题

SourceFusion 是一个预编译框架，它在你编译期间对你的代码做一些改变。[dotnet-campus/SourceFusion: SourceFusion is a pre-compile framework based on Roslyn. It helps you to build high-performance .NET code.](https://github.com/dotnet-campus/SourceFusion)。

这意味着，这个耗时的 Target 是会改变后续的编译的，典型的是 —— 它会在编译期间增加和删除几个源代码文件。如果完全使用 Target 原生的差量编译，那么一旦这个 Target 跳过，那么也就不会增加和删除任何源代码文件了。

### 解决方案

解决方案是，我们写一个前置的 Target，这个 Target 支持差量编译。于是我们可以利用它的差量编译特性得知当前是否处于差量编译的状态。

```xml
<Target Name="_WalterlvDemoRebuildingTest" BeforeTargets="WalterlvDemoCoreTarget"
        Inputs="$(MSBuildProjectFullPath)" Outputs="$(WalterlvDemoFolder)RebuildingTest.txt">
  <PropertyGroup>
    <WalterlvDemoRebuildRequired>true</WalterlvDemoRebuildRequired>
  </PropertyGroup>
  <ItemGroup>
    <RebuildingTestLine Include="true" />
  </ItemGroup>
  <WriteLinesToFile File="$(WalterlvDemoFolder)RebuildingTest.txt" Lines="@(RebuildingTestLine)" Overwrite="True" />
</Target>
```

上面的 Target 中，`_WalterlvDemoRebuildingTest` 是我给这个差量编译测试 Target 取的名字，`WalterlvDemoCoreTarget` 是那个耗时的 Target。

根据我在 [每次都要重新编译？太慢！让跨平台的 MSBuild/dotnet build 的 Target 支持差量编译](/post/msbuild-incremental-build.html) 一文中的差量编译的做法，我使用 `$(MSBuildProjectFullPath)` 也就是 csproj 文件的改变来决定差量检测的输入，用一个临时的文件 `RebuildingTest.txt` 来决定差量编译的输出。

在这里，我们一定需要一个文件来输出，这样 MSBuild 或者 Roslyn 检测差量的时候才能正确完成。这样，为了得到这个文件，我们实际上需要通过这个 Target 真的写一个文件出来，所以我们用了 `WriteLinesToFile`。

实际上，我们真正需要的是 `WalterlvDemoRebuildRequired` 这个属性。我们可以通过这个属性判断为 `true` 来得知当前并非差量状态，而是需要重新编译。

### 后续使用

对于我们真实的耗时的 Target，则需要检测这个 `WalterlvDemoRebuildRequired` 的值，进行不同的处理。

```xml
<Target Name="WalterlvDemoCoreTarget" BeforeTargets="CoreCompile">
  <PropertyGroup>
    <WalterlvDemoRebuildRequired Condition="'$(WalterlvDemoRebuildRequired)' == ''">false</WalterlvDemoRebuildRequired>
  </PropertyGroup>
  <Exec ConsoleToMSBuild="True" Command="WalterlvDemo.exe -r $(WalterlvDemoRebuildRequired)" />
</Target>
```

我们在核心的 Target 里面判断 `WalterlvDemoRebuildRequired` 的值，如果没有被设置，说明前面的 Target 没有执行，也就是“被差量”了，我们就可以将之指定为 false。

这样，核心的 Target 里面，也就是 WalterlvDemo.exe 执行参数中，就可以拿到正确的差量状态了。`true` 表示正在重新编译，而 `false` 表示正在差量编译。
