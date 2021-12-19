---
title: "Unity3D 入门：为 Unity 的 C# 项目添加 dll 引用或安装 NuGet 包"
publishDate: 2020-04-27 19:36:41 +0800
date: 2020-05-23 14:38:45 +0800
tags: unity csharp
position: starter
coverImage: /static/posts/2020-04-27-20-50-54.png
permalink: /posts/unity-starter-reference-dlls-and-add-nuget-package-for-unity-csharp-projects.html
---

因为 Visual Studio 有强大的包管理器插件，所以即便是不熟悉 NuGet 命令的小伙伴也能轻松安装和管理 NuGet 包。不过，对 Unity C# 项目来说，你并不能直接引用 dll，也不能直接使用自带的 NuGet 包管理器完成 NuGet 包安装。

本文介绍原因和真正的引用方法。

---

<div id="toc"></div>

## 背景

对于传统 .NET/C# 的开发者来说，在解决方案中管理 NuGet 包，在 C# 项目中引用 dll 或 NuGet 包是家常便饭。但在 Unity 项目里面，你可能要改变这一观念——因为 Unity 项目里面实际上并不存在 sln 和 csproj 文件。

简单了解项目根目录的 sln 文件和 csproj 文件将有助于你理解为什么要像本文一样引用 dll 和安装 NuGet 包，因此如果你不了解，建议先阅读：

- [Unity3D 入门：使用 Visual Studio 开发 Unity C# 脚本，说说根目录的那些 sln 和 csproj 文件 - walterlv](/post/unity-starter-the-sln-and-csproj-files.html)

## 如何引用 dll 或者安装 NuGet 包

在 Unity 中，是给 C# 脚本引用 dll 或者安装 NuGet 包，而不能给 C# 项目做 dll 引用。

Unity 中引用 dll 有两种官方途径：

1. `Assets\csc.rsp` 文件，用于指定引用 .NET 运行时的 dll
2. `Assets\Plugins` 文件夹，用于指定引用单独的 dll 文件

当然，这两个能否正常使用，以及扔到 `Plugins` 文件夹中的 dll 应该是什么平台，取决于 Unity 项目的配置。

当然，引用 NuGet 包的话更推荐非官方的方法，详见：

- [如何管理 Unity 项目中的 NuGet 包？使用第三方 NuGet 包管理器——NuGetForUnity](/post/third-party-unity-nuget-management.html)

### 配置运行时和 API 兼容性级别

在 Unity 编辑器中，打开“Edit”->“Project Settings...”->“Player”->“Other Settings”->“Configuration”。

![项目设置](/static/posts/2020-04-27-20-50-54.png)

这里我们关心脚本后端（相当于运行时部分），以及 API 兼容性级别。

![脚本后端和 API 兼容性级别](/static/posts/2020-04-27-20-52-55.png)

脚本后端设置的是脚本如何运行，而 API 兼容性级别设置的是编译时应该使用哪一套 API。

选 Mono 那么使用 Mono 虚拟机运行，选 IL2CPP 那么会编译 IL 到静态的 cpp 文件不依靠 Mono VM。

如果选 .NET 4.x 那么你能引用到 .NET Framework 4.x 子集的 API，如果是 .NET Standard 那么能引用到 .NET Standard 程序集。

你可以通过 [Unity将来时：IL2CPP是什么？ - 知乎](https://zhuanlan.zhihu.com/p/19972689) 简单了解 IL2CPP 是什么。

### mcs.rsp

如果你的 API 兼容性级别是 .NET Standard 2.0，那么你不应该使用此 mcs.rsp 文件。因为当你选择 .NET Standard 2.0 的 API 级别后，.NET Standard 2.0 中的所有依赖就全部引入了，如果还缺，那也不会在 .NET Standard 2.0 里面，你应该考虑后面“Plugins”的引用方式。

接下来，我们说说当你使用 .NET 4.x 的 API 级别时，应该如何使用 mcs.rsp 来引用 dll。

例如对于下图（图来自微软官方文档），希望使用 .NET 4.x 自带的 `HttpClient` 类型。

![缺少 HttpClient 类型](/static/posts/2020-04-27-21-18-05.png)

向 Unity 项目的 Assets 文件夹新建一个 mcs.rsp 文件，里面添加以下内容：

```csharp
-r:System.Net.Http.dll
```

这表示此 Unity 项目中的 C# 脚本引用 .NET Framework 中的 System.Net.Http 程序集。之后，你就能使用诸如 `HttpClient` 这些类型。

你也可以使用同样的方式引用其他的 dll，每行一个。

默认情况下，Unity 会帮我们引用这些 .NET 4.x 的程序集：

- mscorlib.dll
- System.dll
- System.Core.dll
- System.Runtime.Serialization.dll
- System.Xml.dll
- System.Xml.Linq.dll

因此，你不需要手工将它们加入到 mcs.rsp 文件中。

### Plugins

对于 .NET 4.x 或者 .NET Standard 2.0 中不带的类型，那么你应该使用 Plugins 文件夹来解决。

在 Assets 文件夹中新建 Plugins 文件夹，然后将你希望引用的 dll 丢进去就完成了。

#### 引用 dll

因此，如果你已经拥有了 dll 了，那么直接往 Plugins 文件夹扔就好了。但是你需要注意，扔进去的 dll 需要兼容目标运行时（如 Mono 虚拟机）以及目标平台（例如 iOS）。

#### 安装 NuGet 包

原生 Unity 项目不能直接安装 NuGet 包，但可以通过第三方插件实现。

##### 原生

原生 Unity 项目并不能直接安装 NuGet 包，所以实际上对于 NuGet 包的引用是通过把包里的 dll 丢到 Plugins 文件夹来实现的。

既然如此，那就看如何丢进去更有效率了。

微软[官方文档](https://docs.microsoft.com/en-us/visualstudio/cross-platform/unity-scripting-upgrade)的方法是直接从 [nuget.org](https://nuget.org) 上直接把包下载下来，解压，然后将对应平台的 dll 从 lib 文件夹中取出来（例如 API 兼容性级别是 .NET Standard 2.0 的项目，请拷贝 lib/netstandard2.0 中的 dll 出来）。

因为 Unity 编辑器生成了 sln 和 csproj，所以在 Visual Studio 里安装也是可以的，不过这里的安装并不会真实生效，而是我们在 Unity 项目的根目录的 Packages 文件夹中能找到我们安装的 NuGet 包，也是从对应的文件夹中取出来 dll 丢到 Plugins 文件夹中。

##### 第三方

更推荐非官方的方法，详见：

- [如何管理 Unity 项目中的 NuGet 包？使用第三方 NuGet 包管理器——NuGetForUnity](/post/third-party-unity-nuget-management.html)

### 特别注意：反射需要额外支持

如果你前面的脚本后端（Script Backend）选择了 IL2CPP，那么小心 dll 的元数据会丢失，依赖于反射的功能也将崩溃。例如大量依赖于反射的 `Newtonsoft.Json` 库就会在此情况下无法正常工作。

如果你需要用到反射，或者你用到的某库中需要依赖反射功能，那么请在 Assets 文件夹中添加 link.xml 文件，内容如下：

```xml
<linker>
  <assembly fullname="System.Core">
    <type fullname="System.Linq.Expressions.Interpreter.LightLambda" preserve="all" />
  </assembly>
</linker>
```

这将确保 Unity 的字节码剥离过程在导出到 IL2CPP 平台时不会删除必要的数据。

---

**参考资料**

- [Unity - Manual: Referencing additional class library assemblies](https://docs.unity3d.com/Manual/dotnetProfileAssemblies.html?_ga=2.153567932.542818802.1587977026-543747318.1585549821)


