---
title: "如何最快速地将旧的 NuGet 包 (2.x, packages.config) 升级成新的 NuGet 包 (4.x, PackageReference) "
date_published: 2018-05-13 17:07:23 +0800
date: 2018-05-13 20:51:10 +0800
categories: visualstudio nuget
---

最近我将项目格式进行了升级，从旧的 csproj 升级成了新的 csproj；NuGet 包管理的方式也从 `packages.config` 升级成了 `PackageReference`。然而迁移完才发现，这个项目竟然还依赖了大量的从 NuGet 2.x 时代发布的 NuGet 包，这些包并不能在 `PackageReference` 下好好工作。

于是，我准备将所有这些包都进行升级。本文将介绍最简单的升级步骤。

---

<div id="toc"></div>

### 回顾遇到的问题

如果你之前迁移过 csproj 文件，可能会遇到问题。关于迁移 csproj 文件，可以阅读：[将 WPF、UWP 以及其他各种类型的旧样式的 csproj 文件迁移成新样式的 csproj 文件 - 吕毅](/post/introduce-new-style-csproj-into-net-framework.html)。

如果你并没有迁移过 csproj 文件，只是升级了 NuGet 的包管理方式，也可能会遇到问题。关于自动迁移 NuGet 包管理方式，可以阅读：[自动将 NuGet 包的引用方式从 packages.config 升级为 PackageReference - 吕毅](/post/migrate-packages-config-to-package-reference.html)。

在自动迁移那篇文章中，我提到了一些兼容性问题，最大的莫过于 Install.ps1 脚本不再执行：

> 使用 PackageReference 后，在安装和写在的过程中 install.ps1 脚本将不再执行。如果有一些行为依赖于此脚本，那么这个 NuGet 包的行为可能不正常。
> 
> 但是，不用担心！install.ps1 的存在是因为 packages.config 不支持 PackageReference 中的一些新特性（例如 NuGet 包中新的目录结构，例如包中自带的 msbuild targets）。所以，如果 NuGet 包在发布时满足目录要求，那么即便 install.ps1 不用执行也能保证包的行为正常。

虽然我提到不用担心，但其实旧的一些包里并没有准备 build 文件夹，也没有准备 props 或者 targets 文件。所以一小部分特别依赖于 install.ps1 的 NuGet 包是没有办法在新格式中生效的。

### 最简升级步骤

知道了问题所在，那么我们的根本便是将 Install.ps1 升级成新的 props 或者 targets。

如果你不清楚 props 或者 targets 是什么意思，或者不知道怎么写它们，可以阅读我的另一篇文章[理解 C# 项目 csproj 文件格式的本质和编译流程 - 吕毅](/post/understand-the-csproj.html)。

#### 第一步：将 install.ps1 翻译成 targets

最简单的方法，直接去安装好 NuGet 的项目的 csproj 文件中去看究竟生成了那些代码。一般来说，这些 install.ps1 中多是生成 `Target` 节点。

而我们要做的，就是新建一个 build 文件夹，在其中新建 `PackageId`.targets 文件，以便将生成的 `Target` 节点中的内容复制过去。前面那一句的 `PackageId` 指的是这个 NuGet 包的包 Id。比如，在我的例子中，是 Walterlv.NuGetDemo.targets。

比如，生成的 `Target` 节点是这样的：

```xml
<!-- 项目 csproj 文件 -->
<Target Name="WalterlvNuGetDemo" BeforeTargets="AfterCompile">
  <ItemGroup>
    <BinCopyItems Include="..\..\packages\Walterlv.NuGetDemo.1.2.3.0\tools\bin\*.*" />
    <x64CopyItems Include="..\..\packages\Walterlv.NuGetDemo.1.2.3.0\tools\bin_x64\*.*" />
    <x86CopyItems Include="..\..\packages\Walterlv.NuGetDemo.1.2.3.0\tools\bin_x86\*.*" />
  </ItemGroup>
  <Copy SourceFiles="@(BinCopyItems)" DestinationFolder="$(OutputPath)" SkipUnchangedFiles="True" />
  <Copy SourceFiles="@(x86CopyItems)" DestinationFolder="$(OutputPath)x86" SkipUnchangedFiles="True" />
  <Copy SourceFiles="@(x64CopyItems)" DestinationFolder="$(OutputPath)x64" SkipUnchangedFiles="True" />
</Target>
```

那么，直接将这些文件复制到 PackageId.targets 文件中：

```xml
<!-- Walterlv.NuGetDemo.targets 文件 -->
<Project>
  <Target Name="WalterlvNuGetDemo" BeforeTargets="AfterCompile">
    <ItemGroup>
      <BinCopyItems Include="..\..\packages\Walterlv.NuGetDemo.1.2.3.0\tools\bin\*.*" />
      <x64CopyItems Include="..\..\packages\Walterlv.NuGetDemo.1.2.3.0\tools\bin_x64\*.*" />
      <x86CopyItems Include="..\..\packages\Walterlv.NuGetDemo.1.2.3.0\tools\bin_x86\*.*" />
    </ItemGroup>
    <Copy SourceFiles="@(BinCopyItems)" DestinationFolder="$(OutputPath)" SkipUnchangedFiles="True" />
    <Copy SourceFiles="@(x86CopyItems)" DestinationFolder="$(OutputPath)x86" SkipUnchangedFiles="True" />
    <Copy SourceFiles="@(x64CopyItems)" DestinationFolder="$(OutputPath)x64" SkipUnchangedFiles="True" />
  </Target>
</Project>
```

然后，修改其中的路径，将相对于安装项目路径的地方更换成相对于此 targets 文件的路径：

```xml
<!-- Walterlv.NuGetDemo.targets 文件 -->
<Project>
  <Target Name="WalterlvNuGetDemo" BeforeTargets="AfterCompile">
    <ItemGroup>
      <BinCopyItems Include="$(MSBuildThisFileDirectory)..\tools\bin\*.*" />
      <x64CopyItems Include="$(MSBuildThisFileDirectory)..\tools\bin_x64\*.*" />
      <x86CopyItems Include="$(MSBuildThisFileDirectory)..\tools\bin_x86\*.*" />
    </ItemGroup>
    <Copy SourceFiles="@(BinCopyItems)" DestinationFolder="$(OutputPath)" SkipUnchangedFiles="True" />
    <Copy SourceFiles="@(x86CopyItems)" DestinationFolder="$(OutputPath)x86" SkipUnchangedFiles="True" />
    <Copy SourceFiles="@(x64CopyItems)" DestinationFolder="$(OutputPath)x64" SkipUnchangedFiles="True" />
  </Target>
</Project>
```

#### 第二步：修改 nuspec 文件，加入 targets

接着，去 nuspec 文件中，删除 Install.ps1 和 Uninstall.ps1，然后新增我们刚刚写的 targets 文件。

```xml
<files>
  <!-- 省略其他一些文件 -->
  <file src="tools\bin\DemoNativeLib.dll" target="tools\bin"/>
  <!-- 删除 <file src="tools\Install.ps1" target="tools"/> -->
  <!-- 删除 <file src="tools\Uninstall.ps1" target="tools"/> -->
  <!-- 省略其他一些文件 -->
  <file src="build\Walterlv.NuGetDemo.targets" target="build"/>
</files>
```

#### 重新打包和测试 NuGet 包

以上改完了之后，基本上就迁移完了。

这样的改动是最小的，既能够保证旧的 packages.config 能够顺利迁移，也能保证新的 PackageReference 行为保持不变。
