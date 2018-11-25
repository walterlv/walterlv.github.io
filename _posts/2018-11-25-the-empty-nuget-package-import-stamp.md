---
title: "csproj 文件中那个空的 NuGetPackageImportStamp 是干什么的？"
date: 2018-11-25 21:45:39 +0800
categories: visualstudio nuget
---

当我们在传统格式的 csproj 项目文件中安装 NuGet 包后，有时会在项目文件中发现空的 `NuGetPackageImportStamp` 节点。这个空的节点让我们这波强迫症患者觉得有点难以接受，关键是手工删除之后也没发现有什么副作用。

那么为什么会出现这个节点？它究竟有什么作用？

---

<div id="toc"></div>

### 空的 NuGetPackageImportStamp 节点

NuGetPackageImportStamp 节点只会出现在传统的 csproj 文件中。如果你不清楚我这里指的传统的和新的 csproj 文件格式，那么可以阅读我的另一篇文章来了了解它们的区别：[将 WPF、UWP 以及其他各种类型的旧 csproj 迁移成基于 Microsoft.NET.Sdk 的新 csproj](https://walterlv.com/post/introduce-new-style-csproj-into-net-framework.html)。

简单说来，在 `Project` 根节点中可以指定 `Sdk` 特性的 csproj 文件格式是新的 csproj 格式。由于 `Sdk` 特性的存在，使得很多的项目文件的功能得以有一个默认的实现。

而传统的 csproj 由于没有指定 `Sdk` 特性，所以很多的特性如果需要执行，需要先 `Import` 到 csproj 中，或者不断地修改 csproj 文件的内容以添加新的功能。

空的 NuGetPackageImportStamp 节点只会出现在传统的 csproj 文件中。如果你使用新格式的 csproj 文件，那么无论你如何安装 NuGet 包，都是不会看到 `NuGetPackageImportStamp` 节点出现的。

`NuGetPackageImportStamp` 在传统 csproj 文件中是这样的：

```diff
    <?xml version="1.0" encoding="utf-8"?>
    <Project ToolsVersion="15.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
      <PropertyGroup>
++      <NuGetPackageImportStamp>
++      </NuGetPackageImportStamp>
      </PropertyGroup>
    </Project>
```

文件已经经过过度简化，肯定是编译不过的了。不过，你可以意会。它会在某些 NuGet 包安装完后出现在 csproj 文件中。

### 什么情况下会出现 NuGetPackageImportStamp 节点

你也许会发现，并不是所有的 NuGet 包安装完后都会出现 `NuGetPackageImportStamp` 节点。实际上，只有那些会导致新 `Import` 文件部件的 NuGet 包才会出现这样的节点。

我们来了做个实验。

#### 不会新增 NuGetPackageImportStamp

在项目中安装 [Newtonsoft.Json](https://www.nuget.org/packages/Newtonsoft.Json)。安装完后，你会看到仓库中有两个文件发生了变化：

![两个文件发生了变化](/static/posts/2018-11-25-15-52-50.png)  
▲ 两个文件发生了变化

一个是 packages.config 文件，这是传统的 NuGet 包管理方式所需要的一个文件，用于记录当前项目中管理的 NuGet 包信息。

```diff
    <?xml version="1.0" encoding="utf-8"?>
    <packages>
++    <package id="Newtonsoft.Json" version="11.0.2" targetFramework="net473" />
    </packages>
```

另一个是 csproj 文件：

```diff
    <?xml version="1.0" encoding="utf-8"?>
    <Project ToolsVersion="15.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
      <ItemGroup>
++      <Reference Include="Newtonsoft.Json, Version=11.0.0.0, Culture=neutral, PublicKeyToken=30ad4fe6b2a6aeed, processorArchitecture=MSIL">
++        <HintPath>..\..\packages\Newtonsoft.Json.11.0.2\lib\net45\Newtonsoft.Json.dll</HintPath>
++      </Reference>
        <Reference Include="System" />
      <ItemGroup>
    </Project>
```

我们发现，安装 [Newtonsoft.Json](https://www.nuget.org/packages/Newtonsoft.Json) 是不会导致项目中新增 `NuGetPackageImportStamp` 节点的。

#### 会新增 NuGetPackageImportStamp

现在，我们换另一个 NuGet 包来安装：[StyleCop.MSBuild](https://www.nuget.org/packages/StyleCop.MSBuild)。

同样是两个文件的变化，一个是 packages.config 文件。

```diff
    <?xml version="1.0" encoding="utf-8"?>
    <packages>
++    <package id="StyleCop.MSBuild" version="5.0.0" targetFramework="net471" developmentDependency="true" />
    </packages>
```

另一个是 csproj 文件：

```diff
    <?xml version="1.0" encoding="utf-8"?>
    <Project ToolsVersion="15.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
      <Import Project="..\..\packages\StyleCop.MSBuild.5.0.0\build\StyleCop.MSBuild.targets" Condition="Exists('..\..\packages\StyleCop.MSBuild.5.0.0\build\StyleCop.MSBuild.targets')" />
      <PropertyGroup>
++      <NuGetPackageImportStamp>
++      </NuGetPackageImportStamp>
      </PropertyGroup>
++    <Target Name="EnsureNuGetPackageBuildImports" BeforeTargets="PrepareForBuild">
++      <PropertyGroup>
++        <ErrorText>This project references NuGet package(s) that are missing on this computer. Use NuGet Package Restore to download them.  For more information, see http://go.microsoft.com/fwlink/?LinkID=322105. The missing file is {0}.</ErrorText>
++      </PropertyGroup>
++      <Error Condition="!Exists('..\..\packages\StyleCop.MSBuild.5.0.0\build\StyleCop.MSBuild.targets')" Text="$([System.String]::Format('$(ErrorText)', '..\..\packages\StyleCop.MSBuild.5.0.0\build\StyleCop.MSBuild.targets'))" />
++    </Target>
    </Project>
```

我们发现，安装此 [StyleCop.MSBuild](https://www.nuget.org/packages/StyleCop.MSBuild) NuGet 包的情况下，csproj 文件中新增了两个大的内容块：

1. `NuGetPackageImportStamp`
1. 用于 Import 一个 `targets` 文件的 `Target`

### NuGetPackageImportStamp 的出现目的

我们发现 `NuGetPackageImportStamp` 其实是伴随着 `Import` 而出现的。而微软官方的注释也是诡异地说出了它的原因：

> The overrides should ensure that Sets NuGetPackageImportStamp to a new random guid.  
> This is a hack to let the project system know it is out of date.  
> The value does not matter, it just needs to change.

这是为了让 Visual Studio 运行的时候，能够检测到 csproj 文件改变，以便重新加载这个项目，因为需要 Import 新的内容。在以前的 Visual Studio 版本中，会随机写下一段字符串；在新的版本中，它是个空字符串。

由于新的 csproj 文件能够识别到外部 Import 文件的改变，所以其实并不需要这样的机制来让 Visual Studio 感知到文件的改变。

以下是 NuGet 客户端设置此值的代码：

```csharp
/// <summary>
/// This method should be on the UI thread. The overrides should ensure that
/// Sets NuGetPackageImportStamp to a new random guid. This is a hack to let the project system know it is out
/// of date.
/// The value does not matter, it just needs to change.
/// </summary>
protected static void UpdateImportStamp(IVsProjectAdapter vsProjectAdapter)
{
    ThreadHelper.ThrowIfNotOnUIThread();

    var propStore = vsProjectAdapter.VsHierarchy as IVsBuildPropertyStorage;
    if (propStore != null)
    {
        // <NuGetPackageImportStamp>af617720</NuGetPackageImportStamp>
        var stamp = Guid.NewGuid().ToString().Split('-')[0];
        try
        {
            propStore.SetPropertyValue(NuGetImportStamp, string.Empty, (uint)_PersistStorageType.PST_PROJECT_FILE, stamp);
        }
        catch (Exception ex1)
        {
            ExceptionHelper.WriteErrorToActivityLog(ex1);
        }

        // Remove the NuGetImportStamp so that VC++ project file won't be updated with this stamp on disk,
        // which causes unnecessary source control pending changes.
        try
        {
            propStore.RemoveProperty(NuGetImportStamp, string.Empty, (uint)_PersistStorageType.PST_PROJECT_FILE);
        }
        catch (Exception ex2)
        {
            ExceptionHelper.WriteErrorToActivityLog(ex2);
        }
    }
}
```
