---
title: "让 MSBuild Target 支持 Clean"
date: 2019-01-16 15:20:39 +0800
tags: msbuild visualstudio
position: knowledge
permalink: /post/support-clean-for-msbuild-target.html
---

我们有时候会使用解决方案的清理（Clean）功能来解决一些项目编译过程中非常诡异的问题。这通常是一些 Target 生成了一些错误的中间文件，但又不知道到底是哪里错了。

我们自己编写 Target 的时候，也可能会遇到这样的问题，所以让我们自己的 Target 也能支持 Clean 可以在遇到诡异问题的时候，用户可以自己通过清理解决方案来消除错误。

---

以下代码来自于 [SourceFusion/Package.targets](https://github.com/dotnet-campus/SourceFusion/blob/master/src/SourceFusion.Tool/Assets/build/Package.targets)。这是我主导开发的一个预编译框架，用于在编译期间执行各种代码，以便优化代码的运行期性能。

```xml
<PropertyGroup>
    <CleanDependsOn>$(CleanDependsOn);_SourceFusionClean</CleanDependsOn>
</PropertyGroup>

  <!--清理 SourceFusion 计算所得的文件-->
<Target Name="_SourceFusionClean">
    <PropertyGroup>
        <_DefaultSourceFusionWorkingFolder Condition="'$(_DefaultSourceFusionWorkingFolder)' == ''">obj\$(Configuration)\</_DefaultSourceFusionWorkingFolder>
        <SourceFusionWorkingFolder Condition="'$(SourceFusionWorkingFolder)' == ''">$(_DefaultSourceFusionWorkingFolder)</SourceFusionWorkingFolder>
        <SourceFusionToolsFolder>$(SourceFusionWorkingFolder)SourceFusion.Tools\</SourceFusionToolsFolder>
        <SourceFusionGeneratedCodeFolder>$(SourceFusionWorkingFolder)SourceFusion.GeneratedCodes\</SourceFusionGeneratedCodeFolder>
    </PropertyGroup>
    <RemoveDir Directories="$(SourceFusionToolsFolder);$(SourceFusionGeneratedCodeFolder)" />
</Target>
```

这段代码的作用便是支持 Visual Studio 中的解决方案清理功能。通过指定 `CleanDependsOn` 属性的值给一个新的 Target，使得在 Clean 的时候，这个 Target 能够执行。我在 Target 中删除了我生成的所有中间文件。

你可以通过阅读 [通过重写预定义的 Target 来扩展 MSBuild / Visual Studio 的编译过程](/post/extend-the-visual-studio-build-process) 来了解这个 Target 是如何工作起来的。

---

**参考资料**

- [How to: Clean a Build - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/how-to-clean-a-build?view=vs-2017)

