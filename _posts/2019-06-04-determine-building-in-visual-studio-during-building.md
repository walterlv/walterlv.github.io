---
title: "MSBuild 在编写编译任务的时候判断当前是否在 Visual Studio 中编译"
date: 2019-06-04 22:23:50 +0800
categories: dotnet msbuild visualstudio
position: knowledge
---

我们这里说的编译任务是 MSBuild 的 Target。虽然只有少部分，但确实有一些情况需要判断是否在 Visual Studio 中编译的时候才需要执行的编译任务，典型的如某些仅为设计器准备的代码。

---

本文需要理解的前置知识是：

- [解读 Microsoft.NET.Sdk 的源码，你能定制各种奇怪而富有创意的编译过程 - walterlv](/post/read-microsoft-net-sdk.html)

而使用 Visual Studio 编译的时候，会自动帮我们设置 `BuildingInsideVisualStudio` 的值为 `True`，所以实际上我们可以使用这个值进行判断。

我们可以在 Microsoft.NET.Sdk 中找到不少使用此属性的编译任务。

比如为了 IO 性能考虑的硬连接，在 Visual Studio 中即便打开也不会使用：

```xml
<!--
  ============================================================
                                      CopyFilesToOutputDirectory

  Copy all build outputs, satellites and other necessary files to the final directory.
  ============================================================
  -->
<PropertyGroup>
  <!-- By default we're not using Hard or Symbolic Links to copy to the output directory, and never when building in VS -->
  <CreateHardLinksForCopyAdditionalFilesIfPossible Condition="'$(BuildingInsideVisualStudio)' == 'true' or '$(CreateHardLinksForCopyAdditionalFilesIfPossible)' == ''">false</CreateHardLinksForCopyAdditionalFilesIfPossible>
  <CreateSymbolicLinksForCopyAdditionalFilesIfPossible Condition="'$(BuildingInsideVisualStudio)' == 'true' or '$(CreateSymbolicLinksForCopyAdditionalFilesIfPossible)' == ''">false</CreateSymbolicLinksForCopyAdditionalFilesIfPossible>
</PropertyGroup>
```

另外 Visual Studio 接管了一部分引用项目的清理工作，所以编译任务里面也将其过滤掉了。

```xml
<!--
  ============================================================
                                      CleanReferencedProjects

  Call Clean target on all Referenced Projects.
  ============================================================
  -->
<Target
    Name="CleanReferencedProjects"
    DependsOnTargets="PrepareProjectReferences">

  <!--
      When building the project directly from the command-line, clean those referenced projects
      that exist on disk.  For IDE builds and command-line .SLN builds, the solution build manager
      takes care of this.
      -->
  <MSBuild
      Projects="@(_MSBuildProjectReferenceExistent)"
      Targets="Clean"
      Properties="%(_MSBuildProjectReferenceExistent.SetConfiguration); %(_MSBuildProjectReferenceExistent.SetPlatform); %(_MSBuildProjectReferenceExistent.SetTargetFramework)"
      BuildInParallel="$(BuildInParallel)"
      Condition="'$(BuildingInsideVisualStudio)' != 'true' and '$(BuildProjectReferences)' == 'true' and '@(_MSBuildProjectReferenceExistent)' != ''"
      ContinueOnError="$(ContinueOnError)"
      RemoveProperties="%(_MSBuildProjectReferenceExistent.GlobalPropertiesToRemove)"/>

</Target>
```

关于如何探索 Microsoft.NET.Sdk 可以阅读我的另一篇博客：

- [解读 Microsoft.NET.Sdk 的源码，你能定制各种奇怪而富有创意的编译过程 - walterlv](https://blog.walterlv.com/post/read-microsoft-net-sdk.html)
