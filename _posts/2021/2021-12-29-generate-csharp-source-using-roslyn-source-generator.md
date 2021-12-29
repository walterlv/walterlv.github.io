---
title: "使用 Source Generator 在编译你的 .NET 项目时自动生成代码"
date: 2021-12-29 14:04:25 +0800
categories: dotnet csharp roslyn
position: starter
coverImage: /static/posts/2021-12-29-13-26-13.png
---

本文将带你为你的某个库添加自动生成代码的逻辑。

本文以 [dotnetCampus.Ipc 项目](https://github.com/dotnet-campus/dotnetCampus.Ipc)为例，来说明如何为一个现成的 .NET 类库添加自动生成代码的功能。这是一个在本机内进行进程间通信的库，在你拥有一个 IPC 接口和对应的实现之后，本库还会自动帮你生成通过 IPC 代理访问的代码。由于项目加了 Roslyn 的 SourceGenerator 功能，所以当你安装了 [dotnetCampus.Ipc NuGet 包](https://www.nuget.org/packages/dotnetCampus.Ipc) 后，这些代码将自动生成，省去了手工编写的费神。

---

<div id="toc"></div>

## dotnetCampus.Ipc 简介

例如你有一个接口 `IWalterlv` 和其对应的实现 `WalterlvImpl`：

```csharp
public interface IWalterlv
{
    Task<string> GetUrlAsync();
}

public class WalterlvImpl : IWalterlv
{
    public Task<string> GetUrlAsync()
    {
        return Task.FromResult("https://blog.walterlv.com");
    }
}
```

那么只需要在 `WalterlvImpl` 上标记这是一个 IPC 对象即可：

```diff
++  [IpcPublic(typeof(IWalterlv))]
    public class WalterlvImpl : IWalterlv
```

这时，编译这个项目，将会自动生成这样的两个类：

- `WalterlvIpcProxy`：负责代理访问 IPC 对方
- `WalterlvIpcJoint`：负责接收对方的 IPC 访问，然后对接到本地真实实例

![IPC 自动生成的类](/static/posts/2021-12-29-13-26-13.png)

那么本文就以它为例子说明如何编写一个代码生成器：

1. 开始编写一个基本的代码生成器
2. 使用代码生成器生成需要的代码
3. 将代码生成器加入到现有的 NuGet 包中
4. 调试代码生成器

## 一个基本的代码生成器

创建一个项目，例如 `dotnetCampus.Ipc.Analyzers`，然后编辑其项目文件（csproj）。至少要包含以下内容：

- `TargetFramework` 必须是 `netstandard2.0`，目前（Visual Studio 2022 和 MSBuild 17）不支持其他任何框架。
- 引用 `Microsoft.CodeAnalysis.Analyzers` 和 `Microsoft.CodeAnalysis.CSharp` 并且不对外传递他们的依赖。

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
    <AppendTargetFrameworkToOutputPath>false</AppendTargetFrameworkToOutputPath>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.CodeAnalysis.Analyzers" Version="3.3.3" PrivateAssets="all" />
    <PackageReference Include="Microsoft.CodeAnalysis.CSharp" Version="4.0.1" PrivateAssets="all" />
  </ItemGroup>

</Project>
```

这里的 `AppendTargetFrameworkToOutputPath` 是可选的，目的是去掉生成路径下的 `netstandard2.0` 文件夹。

接着创建一个代码生成器类：

```csharp
[Generator]
public class ProxyJointGenerator : ISourceGenerator
{
    public void Initialize(GeneratorInitializationContext context)
    {
    }

    public void Execute(GeneratorExecutionContext context)
    {
    }
}
```

这样，你就写好了一个基本的生成器的代码框架了，剩下的就是往里面填内容了。

## 生成代码

`Initialize` 方法可进行一些初始化，你可以在这里订阅代码的变更通知，可以要求监听某些 C# 甚至是非代码文件的修改。本文是入门向，所以不涉及到这个方法。

接下来我们大部分的代码都将从那个 `Execute` 方法开始。

例如，我们可以随便写一个：

```csharp
// 这段代码来自 https://docs.microsoft.com/zh-cn/dotnet/csharp/roslyn-sdk/source-generators-overview
public void Execute(GeneratorExecutionContext context)
{
    // find the main method
    var mainMethod = context.Compilation.GetEntryPoint(context.CancellationToken);

    // build up the source code
    string source = $@"
using System;

namespace {mainMethod.ContainingNamespace.ToDisplayString()}
{{
    public static partial class {mainMethod.ContainingType.Name}
    {{
        static partial void HelloFrom(string name)
        {{
            Console.WriteLine($""Generator says: Hi from '{{name}}'"");
        }}
    }}
}}
";
    // add the source code to the compilation
    context.AddSource("generatedSource", source);
}
```

这里的 `AddSource` 就是将代码添加到你的项目中了。

而我在 dotnetCampus.Ipc 库中编写的生成代码会稍微复杂一点，会根据项目中标记了 `IpcPublic` 的类的代码动态生成对这个类的代理访问和对接代码，使用的是 Roslyn 进行语义分析。可参见：[使用 Roslyn 对 C# 代码进行语义分析 - walterlv](/post/roslyn-semantic-analysis-starter)。

```csharp
public void Execute(GeneratorExecutionContext context)
{
    foreach (var ipcObjectType in FindIpcPublicObjects(context.Compilation))
    {
        try
        {
            var contractType = ipcObjectType.ContractType;
            var proxySource = GenerateProxySource(ipcObjectType);
            var jointSource = GenerateJointSource(ipcObjectType);
            var assemblySource = GenerateAssemblyInfoSource(ipcObjectType);
            context.AddSource($"{contractType.Name}.proxy", SourceText.From(proxySource, Encoding.UTF8));
            context.AddSource($"{contractType.Name}.joint", SourceText.From(jointSource, Encoding.UTF8));
            context.AddSource($"{contractType.Name}.assembly", SourceText.From(assemblySource, Encoding.UTF8));
        }
        catch (DiagnosticException ex)
        {
            context.ReportDiagnostic(ex.ToDiagnostic());
        }
        catch (Exception ex)
        {
            context.ReportDiagnostic(Diagnostic.Create(DIPC001_UnknownError, null, ex));
        }
    }
}
```

这段代码的含义为：

1. 通过自己写的 `FindIpcPublicObjects` 方法找到目前项目里所有的标记了 `IpcPublic` 特性的类；
2. 为这个类生成代理类（Proxy）；
3. 为这个类生成对接类（Joint）；
4. 为这些类生成关系（AssemblyInfo）；
5. 将这些新生成的代码都加入到项目中进行编译；
6. 如果中间出现了未知异常，则用自己编写的 `DiagnosticException` 异常类辅助报告编译错误。

这里只介绍创建代码分析器的一般方法，更多生成器代码可以前往仓库浏览：[dotnetCampus.Ipc 项目](https://github.com/dotnet-campus/dotnetCampus.Ipc)。

## 为 NuGet 包添加生成代码的功能

现在，我们要将这个生成代码的功能添加到 NuGet 包中。最终打出的 NuGet 包会是下面这样：

![IPC 带有代码生成器的 NuGet 包](/static/posts/2021-12-29-13-44-41.png)

为了生成这样的包，我们需要：

1. 添加解决方案依赖，确保编译 dotnetCampus.Ipc 之前，dotnetCampus.Ipc.Analyzers 项目已完成编译；
2. 将 dotnetCampus.Ipc.Analyzers.dll 加入到 NuGet 包中。

对于 1，在解决方案上右键->“项目依赖项”，然后在 dotnetCampus.Ipc 项目上把 dotnetCampus.Ipc.Analyzers 勾上。

![设置解决方案项目依赖](/static/posts/2021-12-29-13-47-44.png)

对于 2，我们需要修改真正打包的那个项目，也就是 dotnetCampus.Ipc 项目，在其 csproj 文件的末尾添加：

```xml
<Target Name="_IncludeAllDependencies" BeforeTargets="_GetPackageFiles">
  <ItemGroup>
    <None Include="..\dotnetCampus.Ipc.Analyzers\bin\$(Configuration)\**\*.dll" Pack="True" PackagePath="analyzers\dotnet\cs" />
  </ItemGroup>
</Target>
```

这样便能生成我们期望的 NuGet 包了。等打包发布后，就能出现本文一开始说的能生成代码的效果了。

## 调试代码生成器

代码生成器编写更复杂的时候，调试就成了一个问题。接下来我们说说如何调试代码生成器。

这种代码的调试，大家可能很容易就想到了用 `Debugger.Launch()` 来调试，就像这样：

```diff
    public void Initialize(GeneratorInitializationContext context)
    {
++      System.Diagnostics.Debugger.Launch();
    }
```

但是，用什么项目的编译来触发这个调试呢？总不可能在某个项目上安装上这个 NuGet 包吧……那样效率太低了。

我们再建一个 `dotnetCampus.Ipc.Test` 项目，在其 csproj 文件上加上这么一行：

```xml
<ItemGroup>
  <ProjectReference Include="..\..\src\dotnetCampus.Ipc.Analyzers\dotnetCampus.Ipc.Analyzers.csproj" OutputItemType="Analyzer" ReferenceOutputAssembly="false" />
</ItemGroup>
```

`OutputItemType="Analyzer"` 表示将项目添加为分析器，`ReferenceOutputAssembly="false"` 表示此项目无需引用分析器项目的程序集。

这样，编译此 `dotnetCampus.Ipc.Test` 项目时，就会触发选择调试器的界面，你就能调试你的代码生成器了。

使用这种方式引用，相比于 NuGet 包引用来说，项目的分析器列表里无法看到生成的代码。如果需要在这种情况下看到代码，你可能需要在 `context.AddSource` 那里打上一个断点，来看生成的代码是什么样的。

当然，除了用项目引用的方式，你还能直接引用最终的 dll：

```xml
<ItemGroup>
  <Analyzer Include="..\..\src\dotnetCampus.Ipc.Analyzers\bin\$(Configuration)\dotnetCampus.Ipc.Analyzers.dll" OutputItemType="Analyzer" ReferenceOutputAssembly="false" />
</ItemGroup>
```

---

**参考资料**

- [源生成器 - Microsoft Docs](https://docs.microsoft.com/zh-cn/dotnet/csharp/roslyn-sdk/source-generators-overview)
- [roslyn/source-generators.md at main · dotnet/roslyn](https://github.com/dotnet/roslyn/blob/main/docs/features/source-generators.md)
- [roslyn/source-generators.cookbook.md at main · dotnet/roslyn](https://github.com/dotnet/roslyn/blob/main/docs/features/source-generators.cookbook.md)

