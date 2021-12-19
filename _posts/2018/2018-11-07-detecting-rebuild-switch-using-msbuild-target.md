---
title: "编写 Target 检测 MSBuild / dotnet build 此次编译是否是差量编译"
publishDate: 2018-11-07 21:24:56 +0800
date: 2018-12-25 07:43:28 +0800
tags: visualstudio msbuild
version:
  current: 中文
versions:
  - 中文: #
  - English: /post/detecting-rebuild-switch-using-msbuild-target-en.html
---

MSBuild 或 Roslyn 编译项目时均支持差量编译，毕竟为了性能。我在 [每次都要重新编译？太慢！让跨平台的 MSBuild/dotnet build 的 Target 支持差量编译](/post/msbuild-incremental-build) 一文中介绍了如何使一个 Target 支持差量编译。在那篇文章中我说到差量编译会导致 Target 不执行；也就是说，如果一个 Target 对后续的编译会产生影响，那么一定不能设置为差量编译。

不过，真的会写出一些非常耗时的 Target，但是它会对后续的编译产生影响。这些 Target 如果要做差量编译，那么就不能直接使用原生的差量编译方案了。本文将介绍如何处理这样的情况。

---

<div id="toc"></div>

## 我们遇到的问题

SourceFusion 是一个预编译框架，它在你编译期间对你的代码做一些改变。[dotnet-campus/SourceFusion: SourceFusion is a pre-compile framework based on Roslyn. It helps you to build high-performance .NET code.](https://github.com/dotnet-campus/SourceFusion)。

这意味着，这个耗时的 Target 是会改变后续的编译的，典型的是 —— 它会在编译期间增加和删除几个源代码文件。如果完全使用 Target 原生的差量编译，那么一旦这个 Target 跳过，那么也就不会增加和删除任何源代码文件了。

## 解决方案

解决方案是，我们写一个前置的 Target，这个 Target 支持差量编译。于是我们可以利用它的差量编译特性得知当前是否处于差量编译的状态。

```xml

<Target Name="_WalterlvDemoRebuildingTest" BeforeTargets="WalterlvDemoCoreTarget"
        Inputs="$(MSBuildProjectFullPath)" Outputs="$(WalterlvDemoFolder)RebuildingTest.txt">
  <ItemGroup>
    <RebuildingTestLine Include="true" />
  </ItemGroup>
  <CallTarget Targets="_WalterlvDemoRebuildingTestInitialize" />
  <WriteLinesToFile File="$(WalterlvDemoFolder)RebuildingTest.txt" Lines="@(RebuildingTestLine)" Overwrite="True" />
</Target>

<Target Name="_WalterlvDemoRebuildingTestInitialize">
  <PropertyGroup>
    <WalterlvDemoRebuildRequired>true</SourceFusionRebuildRequired>
  </PropertyGroup>
</Target>

```

随后再写一个新的 Target。这个新的 Target 没有任何 `BeforeTargets` 或者 `AfterTargets` 的设置。也就是说，如果没有显式地去执行它或者将它设置为默认的 Target，它将完全不会执行。而我们在这个 Target 里面会设置一个属性，标记此时正在处于“重新编译”的状态（即不是差量状态）。

我们使用那个支持差量编译的 Target，通过 CallTarget 来显式调用这个新的 Target。如果当前处于差量状态，那么这个 CallTarget 不会执行；而如果处于全量编译状态，那么 CallTarget 就会调用那个新的 Target 以便设置一个属性。

上面写了两个 Target，但涉及到三个 Target：

- `_WalterlvDemoRebuildingTest` 是我给这个差量编译测试 Target 取的名字
- `_WalterlvDemoRebuildingTestInitialize` 是差量编译初始化赋值的 Target
- `WalterlvDemoCoreTarget` 是那个耗时的 Target。

根据我在 [每次都要重新编译？太慢！让跨平台的 MSBuild/dotnet build 的 Target 支持差量编译](/post/msbuild-incremental-build) 一文中的差量编译的做法，我使用 `$(MSBuildProjectFullPath)` 也就是 csproj 文件的改变来决定差量检测的输入，用一个临时的文件 `RebuildingTest.txt` 来决定差量编译的输出。在这里，我们一定需要一个文件来输出，这样 MSBuild 或者 Roslyn 检测差量的时候才能正确完成。这样，为了得到这个文件，我们实际上需要通过这个 Target 真的写一个文件出来，所以我们用了 `WriteLinesToFile`。

实际上，我们真正需要的是 `WalterlvDemoRebuildRequired` 这个属性，而这个属性我们在 `_WalterlvDemoRebuildingTestInitialize` 中进行设置。在 `_WalterlvDemoRebuildingTest` 中，只有全量编译时才会调用 `_WalterlvDemoRebuildingTestInitialize` 而差量编译是不会调用的。所以差量编译时，`WalterlvDemoRebuildRequired` 不会初始化。

这样，我们便可以通过这个属性判断是否设置为 `true` 来得知当前是否处于全量编译状态。

## 后续使用

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

## 一些坑

如果不写那个新的 Target 是否可行呢？我们能否把这个属性的赋值直接放到差量编译的那个 `_WalterlvDemoRebuildingTest` 中？

其实这是不靠谱的。

MSBuild 在计算属性的时候，不同的 csproj 格式、不同版本的计算情况不同。实际上在不断的试验中我并没有找到哪些情况下差量 Target 的属性会被计算哪些情况不会被计算。所以最好的办法是 —— 不要依赖于这些不确定的属性变化。

所以我们写一个新的 Target，Target 执行则属性赋值，不执行则不赋值，非常确定。

---

**参考资料**

- [CallTarget Task - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/calltarget-task)
- [How to: Build Incrementally - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/how-to-build-incrementally)
- [Property Functions - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/property-functions)
