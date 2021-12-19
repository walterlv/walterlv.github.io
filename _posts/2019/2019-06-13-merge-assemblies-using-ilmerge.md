---
title: ".NET 使用 ILMerge 合并多个程序集，避免引入额外的依赖"
publishDate: 2019-06-13 08:43:39 +0800
date: 2019-06-17 21:34:41 +0800
tags: dotnet csharp
position: knowledge
coverImage: /static/posts/2019-06-13-08-08-00.png
permalink: /posts/merge-assemblies-using-ilmerge.html
---

我们有多种工具可以将程序集合并成为一个。打包成一个程序集可以避免分发程序的时候带上一堆依赖而出问题。

ILMerge 可以用来将多个程序集合并成一个程序集。本文介绍使用 ILMerge 工具和其 NuGet 工具包来合并程序集和其依赖。

---

<div id="toc"></div>

## 以 NuGet 包的形式使用 ILMerge

ILMerge 提供了可供你项目使用的 NuGet 包。如果你在团队项目当中安装了 ILMerge 的 NuGet 包，那么无论团队其他人是否安装了 ILMerge 的工具，都可以使用 ILMerge 工具。这可以避免要求团队所有成员安装工具或者将工具内置到项目的源代码管理中。

要以 NuGet 包的形式来使用 ILMerge，需要首先安装 ILMerge 的 NuGet 包：

- [NuGet Gallery | ilmerge](https://www.nuget.org/packages/ilmerge)

或者直接在你的项目的 csproj 文件中添加 `PackageReference`：

```xml
<ItemGroup>
    <PackageReference Include="ILMerge" Version="3.0.29" />
</ItemGroup>
```

我现在有一个项目 Walterlv.Demo.AssemblyLoading，这是一个控制台程序。这个程序引用了一个 NuGet 包 Ben.Demystifier。为此带来了三个额外的依赖。

```
- Walterlv.Demo.AssemblyLoading.exe
- Ben.Demystifier.dll
- System.Collections.Immutable.dll
- System.Reflection.Metadata.dll
```

而我们可以使用 ILMerge 将这些依赖和我们生成的主程序合并成一个程序集，这样分发程序的时候只需要一个程序集即可。

那么，我们现在需要编辑我们的项目文件：

```diff
    <Project Sdk="Microsoft.NET.Sdk">

        <PropertyGroup>
            <OutputType>Exe</OutputType>
            <TargetFramework>net48</TargetFramework>
        </PropertyGroup>
        
        <ItemGroup>
            <PackageReference Include="Ben.Demystifier" Version="0.1.4" />
            <PackageReference Include="ILMerge" Version="3.0.29" />
        </ItemGroup>

++      <Target Name="ILMerge">
++          <Exec Command="&quot;$(ILMergeConsolePath)&quot; /ndebug /target:exe /out:$(OutputPath)$(AssemblyName).exe /log $(OutputPath)$(AssemblyName).exe /log $(OutputPath)Ben.Demystifier.dll /log $(OutputPath)System.Collections.Immutable.dll /log $(OutputPath)System.Reflection.Metadata.dll /targetplatform:v4" />
++      </Target>
    
    </Project>
```

我们只增加了三行，添加了一个名称为 ILMerge 的 Target。（注意到项目文件中我有额外引用一个其他的 NuGet 包 Ben.Demystifier，这是为了演示将依赖进行合并而添加的 NuGet 包，具体是什么都没有关系，我们只是在演示依赖的合并。）在这个 Target 里面，我们使用 Exec 的 Task 来执行 ILMerge 命令。具体这个命令代表的含义我们在下一节介绍 ILMerge 工具的时候会详细介绍。如果你希望在你的项目当中进行尝试，可以把所有 `/log` 参数之后的那些程序集名称改为你自己的名称。

那么在编译的时候使用命令 `msbuild /t:ILMerge` 就可以完成程序集的合并了。

注意，你普通编译的话是不会进行 IL 合并的。

如果你希望常规编译也可以进行 IL 合并，或者说希望在 Visual Studio 里面点击生成按钮的时候也能完成 IL 合并的话，那么你还需要增加一个跳板的编译目标 Target。

我将这个名为 `_ProjectRemoveDependencyFiles` 的 Target 增加到了下面。它的目的是在 `AfterBuild` 这个编译目标完成之后（AfterTargets）执行，然后执行前需要先执行（DependsOnTargets）ILMerge 这个 Target。在这个编译目标执行的时候还会将原本的三个依赖删除掉，这样在生成的目录下我们将只会看到我们最终期望的程序集 Walterlv.Demo.AssemblyLoading.exe 而没有其他依赖程序集。

```diff
    <Project Sdk="Microsoft.NET.Sdk">

        <PropertyGroup>
            <OutputType>Exe</OutputType>
            <TargetFramework>net48</TargetFramework>
        </PropertyGroup>
        
        <ItemGroup>
            <PackageReference Include="Ben.Demystifier" Version="0.1.4" />
            <PackageReference Include="ILMerge" Version="3.0.29" />
        </ItemGroup>

        <Target Name="ILMerge">
            <Exec Command="&quot;$(ILMergeConsolePath)&quot; /ndebug /target:exe /out:$(OutputPath)$(AssemblyName).exe /log $(OutputPath)$(AssemblyName).exe /log $(OutputPath)Ben.Demystifier.dll /log $(OutputPath)System.Collections.Immutable.dll /log $(OutputPath)System.Reflection.Metadata.dll /targetplatform:v4" />
        </Target>

++      <Target Name="_ProjectRemoveDependencyFiles" AfterTargets="AfterBuild" DependsOnTargets="ILMerge">
++          <ItemGroup>
++              <_ProjectDependencyFile Include="$(OutputPath)Ben.Demystifier.dll" />
++              <_ProjectDependencyFile Include="$(OutputPath)System.Collections.Immutable.dll" />
++              <_ProjectDependencyFile Include="$(OutputPath)System.Reflection.Metadata.dll" />
++          </ItemGroup>
++          <Delete Files="@(_ProjectDependencyFile)" />
++      </Target>
    
    </Project>
```

最终生成的输出目录下只有我们最终期望生成的程序集：

![最终生成的程序集](/static/posts/2019-06-13-08-08-00.png)

## 以命令行工具的形式使用 ILMerge

你可以在这里下载到 ILMerge：

- [Download ILMerge from Official Microsoft Download Center](https://www.microsoft.com/en-us/download/details.aspx?id=17630)

实际上 ILMerge 已经开源，你可以在 GitHub 上找到它：

- [dotnet/ILMerge: ILMerge is a static linker for .NET Assemblies.](https://github.com/dotnet/ILMerge)

装完之后，如果将 ILMerge 的可执行目录加入到环境变量，那么你将可以在任意的目录下在命令行中直接使用 ILMerge 命令了。加入环境变量的方法我就不用说了，可以在网上搜索到非常多的资料。

ILMerge 装完的默认目录在 `C:\Program Files (x86)\Microsoft\ILMerge`，所以如果你保持默认路径安装，那么几乎可以直接把这个路径加入到环境变量中。

那么 ILMerge 的命令行如何使用呢？它的参数列表是怎样的呢？

我们来写一个简单的例子：

```powershell
ilmerge /ndebug /target:exe /out:Walterlv.Demo.AssemblyLoading.exe /log Walterlv.Demo.AssemblyLoading.exe /log Ben.Demystifier.dll /log System.Collections.Immutable.dll /log System.Reflection.Metadata.dll /targetplatform:v4
```

其中：

- `/ndebug` 表示以非调试版本编译，如果去掉，将会生成 pdb 文件
- `/target` 合并之后的程序集类型，如果是控制台程序，则为 exe
- `/out` 输出文件的名称（或路径）（此路径可以和需要合并的程序集名称相同，这样在合并完之后会覆盖同名称的那个程序集）
- `/log` 所有需要合并的程序集名称（或路径）
- `/targetplatform` 目标平台，如果是 .NET Framework 4.0 - .NET Framework 4.8 之间，则都是 v4

在合并完成之后，我们反编译可以发现程序集中已经包含了依赖程序集中的全部类型了。

![合并后的程序集](/static/posts/2019-06-13-08-40-58.png)

## 以封装的 NuGet 包来使用 ILRepack

安装 NuGet 包：

- [NuGet Gallery - ILRepack.Lib.MSBuild.Task](https://www.nuget.org/packages/ILRepack.Lib.MSBuild.Task/)

之后，你就能直接使用 `ILRepack` 这个编译任务了，而不是在 MSBuild 中使用 Exec 来间接执行 ILRepack 的任务。

关于此 NuGet 包的使用，GitHub 中有很棒的例子，可以查看：

- [peters/ILRepack.MSBuild.Task: MSBuild task for ILRepack which is an open-source alternative to ILMerge.](https://github.com/peters/ILRepack.MSBuild.Task)

## 需要注意

如果使用新的基于 Sdk 的项目文件，那么默认生成的 PDB 是 Portable PDB，但是 ILMerge 暂时不支持 Portable PDB，会在编译时提示错误：

```
An exception occurred during merging:
ILMerge.Merge:  There were errors reported in dotnetCampus.EasiPlugin.Sample's metadata.
        数组维度超过了支持的范围。
   在 ILMerging.ILMerge.Merge()
   在 ILMerging.ILMerge.Main(String[] args)
```

或者英文提示：

```
An exception occurred during merging:
ILMerge.Merge:        There were errors reported in ReferencedProject's metadata.
      Array dimensions exceeded supported range.
   at ILMerging.ILMerge.Merge()
   at ILMerging.ILMerge.Main(String[] args)
```

目前，GitHub 上有 issue 在追踪此问题：

- [Support for portable PDBs · Issue #11 · dotnet/ILMerge](https://github.com/dotnet/ILMerge/issues/11)

---

**参考资料**

- [[C#]使用ILMerge将源DLL合并到目标EXE(.NET4.6.2) - cnc - 博客园](https://www.cnblogs.com/cncc/p/7777374.html)
- [dotnet/ILMerge: ILMerge is a static linker for .NET Assemblies.](https://github.com/dotnet/ILMerge)
- [NuGet Gallery - ilmerge](https://www.nuget.org/packages/ilmerge)
- [jbevain/cecil: Cecil is a library to inspect, modify and create .NET programs and libraries.](https://github.com/jbevain/cecil)
- [gluck/il-repack: Open-source alternative to ILMerge](https://github.com/gluck/il-repack)
- [Support for portable PDBs · Issue #11 · dotnet/ILMerge](https://github.com/dotnet/ILMerge/issues/11)
- [Merging assemblies using ILRepack - Meziantou's blog](https://www.meziantou.net/merging-assemblies-using-ilrepack.htm)
- [peters/ILRepack.MSBuild.Task: MSBuild task for ILRepack which is an open-source alternative to ILMerge.](https://github.com/peters/ILRepack.MSBuild.Task)


