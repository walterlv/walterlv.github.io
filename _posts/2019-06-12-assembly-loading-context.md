---
title: ".NET 的程序集加载上下文"
publishDate: 2019-06-12 16:30:53 +0800
date: 2019-06-13 13:49:44 +0800
categories: dotnet csharp
position: knowledge
---

我们编写的 .NET 应用程序会使用到各种各样的依赖库。我们都知道 CLR 会在一些路径下帮助我们程序找到依赖，但如果我们需要手动控制程序集加载路径的话，需要了解程序集加载上下文。

如果你不了解程序集加载上下文，你可能会发现你加载了程序集却不能使用其中的类型；或者把同一个程序集加载了两次，导致使用到两个明明是一样的类型时却抛出异常提示不是同一个类型的问题。

---

<div id="toc"></div>

## 程序集加载上下文

当你向应用程序域中加载一个程序集时，可能会加载到以下四种不同的上下文中的一种：

1. 默认加载上下文（the Default Load Context）
1. 加载位置加载上下文（the Load-From Context）
1. 仅反射上下文（the Reflection-Only Context）
1. 无上下文

你需要了解这些加载上下文，因为跨不同加载上下文加载的程序集是不能访问其中的类型的。

### 默认加载上下文

- 在全局程序集缓存中发现的类型会加载到默认加载上下文中
- 位于应用程序探测路径中的程序集会加载到默认加载上下文中，这包括了 [ApplicationBase](https://docs.microsoft.com/en-us/dotnet/api/system.appdomainsetup.applicationbase) 和 [PrivateBinPath](https://docs.microsoft.com/en-us/dotnet/api/system.appdomainsetup.privatebinpath) 目录中发现的程序集
- [Assembly.Load](https://docs.microsoft.com/en-us/dotnet/api/system.reflection.assembly.load) 方法的大多数重载都将程序集加载到此上下文中

[ApplicationBase](https://docs.microsoft.com/en-us/dotnet/api/system.appdomainsetup.applicationbase) 和 [PrivateBinPath](https://docs.microsoft.com/en-us/dotnet/api/system.appdomainsetup.privatebinpath) 这两个属性虽然允许被设置，但它们只对新生成的 AppDomain 生效，直接设置当前 AppDomain 中这两个属性的值并不会产生任何效果。

虽然我们不能直接设置这两个属性，但可以在应用程序的 App.config 文件这配置 `configuration -> runtime -> assemblyBinding -> probing.privatePath` 属性来设置多个应用程序执行时的依赖探测路径。

将程序集加载到默认加载上下文中时，会自动加载其依赖项。

使用默认加载上下文时，加载到其他上下文中的依赖项将不可用，并且不能将位于探测路径外部位置的程序集加载到默认加载上下文中。

### 加载位置上下文

当使用 [Assembly.LoadFrom](https://docs.microsoft.com/en-us/dotnet/api/system.reflection.assembly.loadfrom) 方法加载程序集时，程序集会加载到加载位置上下文中。

如果程序集包含依赖，也会自动从加载位置上下文中加载依赖。另外，在加载位置上下文中加载的程序集，可以使用到默认加载上下文中的依赖；**注意，反过来却不成立！**

加载位置上下文的使用需要**谨慎**，因为它会产生一些可能让你感觉到意外的行为。以下意外的行为列表照抄自文档 [Best Practices for Assembly Loading](https://docs.microsoft.com/en-us/dotnet/framework/deployment/best-practices-for-assembly-loading)：

> - 如果已加载一个具有相同标识的程序集，则即使指定了不同的路径，[LoadFrom](https://docs.microsoft.com/en-us/dotnet/api/system.reflection.assembly.loadfrom) 仍返回已加载的程序集。
> - 如果用 [LoadFrom](https://docs.microsoft.com/en-us/dotnet/api/system.reflection.assembly.loadfrom) 加载一个程序集，随后默认加载上下文中的一个程序集尝试按显示名称加载同一程序集，则加载尝试将失败。 对程序集进行反序列化时，可能发生这种情况。
> - 如果用 [LoadFrom](https://docs.microsoft.com/en-us/dotnet/api/system.reflection.assembly.loadfrom) 加载一个程序集，并且探测路径包括一个具有相同标识但位置不同的程序集，则将发生 InvalidCastException、MissingMethodException 或其他意外行为。
> - [LoadFrom](https://docs.microsoft.com/en-us/dotnet/api/system.reflection.assembly.loadfrom) 需要对指定路径的 FileIOPermissionAccess.Read 和 FileIOPermissionAccess.PathDiscovery 或 WebPermission。

### 无上下文

使用反射发出生成的瞬态程序集只能选择在没有下文的情况下进行加载。在没有上下文的情况下进行加载是将具有同一标识的多个程序集加载到一个应用程序域中的唯一方式。这将省去探测成本。

从字节数组加载的程序集都是在没有上下文的情况下加载的，除非程序集的标识（在应用策略后建立）与全局程序集缓存中的程序集标识匹配；在此情况下，将会从全局程序集缓存加载程序集。

在没有上下文的情况下加载程序集具有以下缺点，以下摘抄自 [Best Practices for Assembly Loading](https://docs.microsoft.com/en-us/dotnet/framework/deployment/best-practices-for-assembly-loading)：

> - 无法将其他程序集绑定到在没有上下文的情况下加载的程序集，除非处理 AppDomain.AssemblyResolve 事件。
> - 依赖项无法自动加载。 可以在没有上下文的情况下预加载依赖项、将依赖项预加载到默认加载上下文中或通过处理 AppDomain.AssemblyResolve 事件来加载依赖项。
> - 在没有上下文的情况下加载具有同一标识的多个程序集会导致出现类型标识问题，这些问题与将具有同一标识的多个程序集加载到多个上下文中所导致的问题类似。 请参阅避免将一个程序集加载到多个上下文中。

## 带来的问题

.NET 加载程序集的这种机制可能让你的程序陷入一点点坑：你可以让你的程序加载任意路径下的一个程序集（dll/exe），并且可以执行其中的代码，但你不能依赖那些路径中程序集的特定类型或接口等。

具体一点，比如你定义了一个接口 `IPlugin`，任意路径中的程序集可以实现这个接口，你加载这个程序集之后也可以通过 `IPlugin` 接口调用到程序集中的方法，因为这个接口的定义所在的程序集依然在你的探测路径中，而不是在插件程序集中。位于任意路径下的插件程序集可以访问到位于探测路径中所有程序集的所有 API，但反过来探测路径下的程序集不能访问到其他目录下插件程序集的特定类型或接口等。但是，如果这个程序集中有一些特定的类型如 `WalterlvPlugin`，那么你将不能依赖于这个特定的类型。

我创建了一个控制台程序，用以说明这样的加载上下文机制将带来问题。相关代码可以在我的 GitHub 仓库中找到：

- [walterlv.demo/Walterlv.Demo.AssemblyLoading](https://github.com/walterlv/walterlv.demo/tree/master/Walterlv.Demo.AssemblyLoading/Walterlv.Demo.AssemblyLoading)

其中 Program.cs 文件如下：

```csharp
using System;
using System.Diagnostics;
using System.IO;
using System.Reflection;
using System.Threading.Tasks;

namespace Walterlv.Demo.AssemblyLoading
{
    class Program
    {
        static async Task Main(string[] args)
        {
            await LoadDependencyAssembliesAsync();
            await RunAsync();
            Console.ReadLine();
        }

        private static async Task RunAsync()
        {
            try
            {
                await ThrowAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine(ex.Demystify());
            }

            async Task ThrowAsync() => throw new InvalidOperationException();
        }

        private static async Task LoadDependencyAssembliesAsync()
        {
            var folder = Path.Combine(Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location), "Dependencies");
            Assembly.LoadFile(Path.Combine(folder, "Ben.Demystifier.dll"));
            Assembly.LoadFile(Path.Combine(folder, "System.Collections.Immutable.dll"));
            Assembly.LoadFile(Path.Combine(folder, "System.Reflection.Metadata.dll"));
        }
    }
}
```

项目文件 csproj 文件如下：

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net48</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="Ben.Demystifier" Version="0.1.4" />
  </ItemGroup>
  <Target Name="_ProjectMoveDependencies" AfterTargets="AfterBuild">
    <ItemGroup>
      <_ProjectToMoveFile Include="$(OutputPath)Ben.Demystifier.dll" />
      <_ProjectToMoveFile Include="$(OutputPath)System.Collections.Immutable.dll" />
      <_ProjectToMoveFile Include="$(OutputPath)System.Reflection.Metadata.dll" />
    </ItemGroup>
    <Move SourceFiles="@(_ProjectToMoveFile)" DestinationFolder="$(OutputPath)Dependencies" />
  </Target>
  
</Project>
```

在这个程序中，我们引用了一个 NuGet 包 [Ben.Demystifier](https://www.nuget.org/packages/Ben.Demystifier/)。这个包具体是什么其实并不重要，我只是希望引入一个依赖而已。但是，在项目文件 csproj 中，我写了一个 Target，将这些依赖全部都移动到了 `Dependencies` 文件夹中。这样，我们就可以获得这样目录结构的输出：

```
- Walterlv.exe
- Dependencies
    - Ben.Demystifier.dll
    - System.Collections.Immutable.dll
    - System.Reflection.Metadata.dll
```

如果我们不进行其他设置，那么直接运行程序的话，应该是找不到依赖然后崩溃的。但是现在我们有 `LoadDependencyAssembliesAsync` 方法，里面通过 `Assembly.LoadFile` 加载了这三个程序集。但时机运行时依然会崩溃：

![抛出异常](/static/posts/2019-06-12-11-40-55.png)

明明已经加载了这三个程序集，为什么使用其内部的类型的时候还会抛出异常呢？明明在 Visual Studio 中检查已加载的模块可以发现这些模块都已经加载完毕，但依然无法使用到里面的类型呢？

![已加载模块](/static/posts/2019-06-12-14-18-02.png)

本文将介绍原因和解决办法。

## 解决方法

实际上 .NET 推荐的唯一解决方法是创建新的应用程序域来解决非探测路径下 dll 的依赖问题，在创建新应用程序域的时候设置此应用程序域的探测路径。

但是，我们其实有其他的方法依然在原来的应用程序域中解决依赖问题。

### 使用被遗弃的 API（不推荐）

`AppDomain` 有一个已经被遗弃的 API `AppendPrivatePath`，可以将一个路径加入到探测路径列表中。这样，我们不需要考虑去任意路径加载程序集的问题了，因为我们可以将任意路径设置成探测路径。

```csharp
// 注意，这是一个被遗弃的 API。
AppDomain.CurrentDomain.AppendPrivatePath(folder);
```

关于此 API 为什么会被遗弃，你可以阅读微软的官方博客：[Why is AppDomain.AppendPrivatePath Obsolete? - .NET Blog](https://devblogs.microsoft.com/dotnet/why-is-appdomain-appendprivatepath-obsolete/)。因为你随时可以指定应用程序的探测路径，所以它可能让你的程序以各种不确定的方式加载程序集，于是你的程序将变得很不稳定；可能完全崩溃到你无法预知的程度。

另外，.NET Core 中已经不能使用此 API 了，这非常好！

### 使用 ILRepack / ILMerge 合并依赖

前面我们说过，加载位置上下文中的程序集可以依赖默认加载上下文中的程序集，而反过来却不行。通常默认加载上下文中的程序集是我们的主程序程序集和附属程序集，而加载位置上下文中加载的程序是插件程序集。

如果插件程序集依赖了一些主程序没有的依赖，那么插件可以考虑将所有的依赖合并入插件单个程序集中，避免依赖其他程序集，导致不得不去非探测路径加载程序集。

关于使用 ILRepack 合并依赖的内容，可以阅读我的另一篇博客：

- [.NET 使用 ILRepack 合并多个程序集（替代 ILMerge），避免引入额外的依赖 - walterlv](https://blog.walterlv.com/post/merge-assemblies-using-ilrepack.html)

首先推荐使用 ILRepack 来进行合并，如果你愿意，也可以使用 ILMerge：

- [.NET 使用 ILMerge 合并多个程序集，避免引入额外的依赖](/post/merge-assemblies-using-ilmerge.html)

![使用 ILMerge 合并依赖](/static/posts/2019-06-12-16-05-44.png)

---

**参考资料**

- [Loading .NET Assemblies out of Seperate Folders - Rick Strahl's Web Log](https://weblog.west-wind.com/posts/2016/dec/12/loading-net-assemblies-out-of-seperate-folders)
- [Best Practices for Assembly Loading - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/deployment/best-practices-for-assembly-loading)
- [Why is AppDomain.AppendPrivatePath Obsolete? - .NET Blog](https://devblogs.microsoft.com/dotnet/why-is-appdomain-appendprivatepath-obsolete/)
