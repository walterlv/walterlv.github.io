---
title: ".NET 使用 ILRepack 合并多个程序集（替代 ILMerge），避免引入额外的依赖"
publishDate: 2019-06-13 09:47:28 +0800
date: 2019-06-17 21:30:46 +0800
categories: dotnet csharp
position: knowledge
---

我们有多种工具可以将程序集合并成为一个。比如 ILMerge、Mono.Merge。前者不可定制、运行缓慢、消耗资源（不过好消息是现在开源了）；后者已被弃用、不受支持且基于旧版本的 Mono.Cecil。

而本文介绍用来替代它们的 ILRepack，使用 ILRepack 来合并程序集。

---

<div id="toc"></div>

## 以 NuGet 包的形式使用 ILRepack

ILRepack 提供了可供你项目使用的 NuGet 包。如果你在团队项目当中安装了 ILRepack 的 NuGet 包，那么无论团队其他人是否安装了 ILRepack 的工具，都可以使用 ILRepack 工具。这可以避免要求团队所有成员安装工具或者将工具内置到项目的源代码管理中。

要以 NuGet 包的形式来使用 ILRepack，需要首先安装 ILRepack 的 NuGet 包：

- [NuGet Gallery | ILRepack](https://www.nuget.org/packages/ILRepack/)

或者直接在你的项目的 csproj 文件中添加 `PackageReference`：

```xml
<ItemGroup>
    <PackageReference Include="ILRepack" Version="2.0.17" />
</ItemGroup>
```

我现在有一个项目 Walterlv.Demo.AssemblyLoading，这是一个控制台程序。这个程序引用了一个 NuGet 包 Ben.Demystifier。为此带来了三个额外的依赖。

```
- Walterlv.Demo.AssemblyLoading.exe
- Ben.Demystifier.dll
- System.Collections.Immutable.dll
- System.Reflection.Metadata.dll
```

而我们可以使用 ILRepack 将这些依赖和我们生成的主程序合并成一个程序集，这样分发程序的时候只需要一个程序集即可。

那么，我们现在需要编辑我们的项目文件：

```diff
    <Project Sdk="Microsoft.NET.Sdk">

        <PropertyGroup>
            <OutputType>Exe</OutputType>
            <TargetFramework>net48</TargetFramework>
        </PropertyGroup>
        
        <ItemGroup>
            <PackageReference Include="Ben.Demystifier" Version="0.1.4" />
            <PackageReference Include="ILRepack" Version="2.0.17" />
        </ItemGroup>

++      <Target Name="ILRepack">
++          <Exec Command="&quot;$(ILRepack)&quot; /out:$(OutputPath)$(AssemblyName).exe $(OutputPath)$(AssemblyName).exe $(OutputPath)Ben.Demystifier.dll $(OutputPath)System.Collections.Immutable.dll $(OutputPath)System.Reflection.Metadata.dll" />
++      </Target>
    
    </Project>
```

我们只增加了三行，添加了一个名称为 ILRepack 的 Target。（注意到项目文件中我有额外引用一个其他的 NuGet 包 Ben.Demystifier，这是为了演示将依赖进行合并而添加的 NuGet 包，具体是什么都没有关系，我们只是在演示依赖的合并。）在这个 Target 里面，我们使用 Exec 的 Task 来执行 ILRepack 命令。具体这个命令代表的含义我们在下一节介绍 ILRepack 工具的时候会详细介绍。如果你希望在你的项目当中进行尝试，可以把后面那些代表程序集的名称改为你自己项目中依赖程序集的名称。

现在在编译的时候使用命令 `msbuild /t:ILRepack` 就可以完成程序集的合并了。

注意，你普通编译的话是不会进行 IL 合并的。

如果你希望常规编译也可以进行 IL 合并，或者说希望在 Visual Studio 里面点击生成按钮的时候也能完成 IL 合并的话，那么你还需要增加一个跳板的编译目标 Target。

我将这个名为 `_ProjectRemoveDependencyFiles` 的 Target 增加到了下面。它的目的是在 `AfterBuild` 这个编译目标完成之后（AfterTargets）执行，然后执行前需要先执行（DependsOnTargets）ILRepack 这个 Target。在这个编译目标执行的时候还会将原本的三个依赖删除掉，这样在生成的目录下我们将只会看到我们最终期望的程序集 Walterlv.Demo.AssemblyLoading.exe 而没有其他依赖程序集。

```diff
    <Project Sdk="Microsoft.NET.Sdk">

        <PropertyGroup>
            <OutputType>Exe</OutputType>
            <TargetFramework>net48</TargetFramework>
        </PropertyGroup>

        <ItemGroup>
            <PackageReference Include="Ben.Demystifier" Version="0.1.4" />
            <PackageReference Include="ILRepack" Version="2.0.17" />
        </ItemGroup>

        <Target Name="ILRepack">
            <Exec Command="&quot;$(ILRepack)&quot; /out:$(OutputPath)$(AssemblyName).exe $(OutputPath)$(AssemblyName).exe $(OutputPath)Ben.Demystifier.dll $(OutputPath)System.Collections.Immutable.dll $(OutputPath)System.Reflection.Metadata.dll" />
        </Target>

++      <Target Name="_ProjectRemoveDependencyFiles" AfterTargets="AfterBuild" DependsOnTargets="ILRepack">
++          <ItemGroup>
++              <_ProjectDependencyFile Include="$(OutputPath)Ben.Demystifier.dll" />
++              <_ProjectDependencyFile Include="$(OutputPath)System.Collections.Immutable.dll" />
++              <_ProjectDependencyFile Include="$(OutputPath)System.Reflection.Metadata.dll" />
++              </ItemGroup>
++          <Delete Files="@(_ProjectDependencyFile)" />
++      </Target>

    </Project>
```

最终生成的输出目录下只有我们最终期望生成的程序集：

![最终生成的程序集](/static/posts/2019-06-13-09-30-59.png)

## ILRepack 的命令行使用

相比于 ILMerge，ILRepack 的命令行在尽量贴近 ILMerge 的情况下做得更加简化了。

```powershell
ilrepack /out:Walterlv.Demo.AssemblyLoading.exe Walterlv.Demo.AssemblyLoading.exe Ben.Demystifier.dll System.Collections.Immutable.dll System.Reflection.Metadata.dll
```

其中，`/out` 表示最终的输出程序集的名称或路径，后面没有前缀的参数都是需要合并的程序集的名称或路径。这些需要合并的参数中，第一个参数是主程序集，而后续其他的都是待合并的程序集。区别主程序集和其他程序集的原因是输出的程序集需要有名称、版本号等等信息，而这些信息将使用主程序集中的信息。

如果希望使用 ILRepack 的其他命令，可以考虑使用帮助命令：

```powershell
ilrepack /help
```

或者直接访问 ILRepack 的 GitHub 仓库来查看用法：

- [gluck/il-repack: Open-source alternative to ILMerge](https://github.com/gluck/il-repack)

## 如果解决合并错误？

### 缺少依赖

如果你在使用 ILRepack 合并程序集的过程中出现了缺少依赖的错误，例如下面这样：

```
Mono.Cecil.AssemblyResolutionException: Failed to resolve assembly: 'xxxxxxxxx'
```

![缺少依赖错误提示](/static/posts/2019-06-13-13-51-42.png)

那么你需要做以下两种事情中的任何一种：

1. 将所有依赖合并；
1. 将依赖加入搜索目录。

将所有依赖合并指的是将缺少的依赖也一起作为命令行参数传入要合并的程序集中。

而另一种是增加一个参数 `/lib`，即添加一个被搜索的依赖程序集的目录。将这个目录指定后，则可以正确解析依赖完成合并。而且这些依赖将成为合并后的程序集的依赖，不会合并到程序集中。

```powershell
ilrepack /lib:D:\Dependencies /out:Walterlv.Demo.AssemblyLoading.exe Walterlv.Demo.AssemblyLoading.exe Ben.Demystifier.dll System.Collections.Immutable.dll System.Reflection.Metadata.dll
```

### 没有生成 PDB 文件

如果使用新的基于 Sdk 的项目文件，那么默认生成的 PDB 是 Portable PDB，但是 ILRepack 暂时不支持 Portable PDB，其在内部捕获了异常以至于可以完成合并但不会生成 PDB 文件。

目前此问题在 ILRepack 中还处于打开状态，且持续两年都没关闭了。同时很早就有支持 Portable PDB 的拉取请求，但至今未合并。

以下是 GitHub 社区中的讨论：

- [Mono.Cecil 0.10 support · Issue #182 · gluck/il-repack](https://github.com/gluck/il-repack/issues/182)
- [Migrate to vanilla 0.10 cecil by Alexx999 · Pull Request #236 · gluck/il-repack](https://github.com/gluck/il-repack/pull/236)
- [ERROR: Failed to load assembly while merging .NET Core assembly · Issue #230 · gluck/il-repack](https://github.com/gluck/il-repack/issues/230)
- [Support for portable PDBs · Issue #11 · dotnet/ILMerge](https://github.com/dotnet/ILMerge/issues/11)

---

**参考资料**

- [gluck/il-repack: Open-source alternative to ILMerge](https://github.com/gluck/il-repack)
- [Is it expected that pdb files are not merged? · Issue #217 · gluck/il-repack](https://github.com/gluck/il-repack/issues/217)
