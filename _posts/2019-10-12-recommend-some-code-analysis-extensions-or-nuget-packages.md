---
title: "推荐 .NET/C# 开发者安装的几款代码分析插件或对应的代码分析 NuGet 包"
date: 2019-10-12 11:07:16 +0800
categories: dotnet csharp
position: principle
---

如果你使用的是旧版本的 Visual Studio，那么默认的代码分析规则集是“最小建议规则集”。基于这个，写出来的代码其实只能说是能跑通过而已。随着 Roslyn 的发布，带来了越来越多更强大的代码分析器，可以为编写高质量的代码带来更多的帮助。

作为 .NET/C# 开发者，强烈建议安装本文推荐的几款代码分析器。

---

<div id="toc"></div>

## 推荐

1. Visual Studio 2019 自带的分析器
1. Microsoft Code Analysis
    - VS 扩展：[Microsoft Code Analysis 2019 - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=VisualStudioPlatformTeam.MicrosoftCodeAnalysis2019)
    - NuGet 包： [Microsoft.CodeAnalysis.FxCopAnalyzers](https://www.nuget.org/packages/Microsoft.CodeAnalysis.FxCopAnalyzers)
1. Code Cracker
    - VS 扩展：[Code Cracker for C#](https://marketplace.visualstudio.com/items?itemName=GiovanniBassi-MVP.CodeCrackerforC)
    - NuGet 包：[codecracker.CSharp](https://www.nuget.org/packages/codecracker.CSharp/)

## 类型

这里的分析器分为 Visual Studio 扩展形式的分析器和 NuGet 包形式的分析器。

Visual Studio 扩展形式的分析器可以让你一次安装对所有项目生效，但缺点是不能影响编译过程，只能作为在 Visual Studio 中编写代码时给出提示。

NuGet 包形式的分析器可以让某个项目中的所有成员享受到同样的代码分析提示（无论是否安装插件），但缺点是仅针对单个项目生效。

## 简介

### Visual Studio 2019 自带的分析器

![重构提示](/static/posts/2019-10-12-10-19-55.png)

![IDE0051](/static/posts/2019-10-12-10-20-39.png)

上图生效的分析器就是 Visual Studio 2019 自带的分析器。在可能有问题的代码上，Visual Studio 的代码编辑器会显示一些文字效果来提醒你代码问题。比如这张图就是提示私有成员 `Foo` 未使用。

Visual Studio 2019 自带的分析器的诊断 ID 都是以 `IDE` 开头，因此你可以通过这个前缀来区分是否是 Visual Studio 2019 自带的分析器提示的。

另外，自带的分析器可谓非常强大，除了以上这种提示之外，还可以提示一些重复代码的修改。比如你修改了某段代码，它会提示你相似的代码也可能需要修改。

### Microsoft Code Analysis

Microsoft Code Analysis 分为两种用法，一个是 Visual Studio 扩展的形式，你可以[去这里](https://marketplace.visualstudio.com/items?itemName=VisualStudioPlatformTeam.MicrosoftCodeAnalysis2019)下载安装或者去 Visual Studio 的扩展管理界面搜索安装；另一个是 NuGet 包的形式，你可以直接在项目的 NuGet 管理界面安装 [Microsoft.CodeAnalysis.FxCopAnalyzers](https://www.nuget.org/packages/Microsoft.CodeAnalysis.FxCopAnalyzers)。

这款分析器也是微软主推的代码分析器，可以分析 API 设计问题、全球化与本地化问题、稳定性问题、性能问题、安全性问题、代码使用问题等非常多的种类。

比如下图是稳定性的一个问题，直接 `catch` 了一个 `Exception` 基类：

![catch](/static/posts/2019-10-12-10-35-47.png)

![配置提示](/static/posts/2019-10-12-10-35-56.png)

虽然你可以通过配置规则严重性来消除提示，但是这样写通常代码也比较容易出现一些诡异的问题而难以定位。

Microsoft Code Analysis 分析器的诊断 ID 都是以 `CA` 开头，因此你可以通过这个前缀来区分是否是 Microsoft Code Analysis 分析器提示的。

[Microsoft.CodeAnalysis.FxCopAnalyzers](https://www.nuget.org/packages/Microsoft.CodeAnalysis.FxCopAnalyzers) 的 NuGet 包实际上是一组分析器的合集，包括：

- [Microsoft.CodeAnalysis.FxCopAnalyzers](https://www.nuget.org/packages/Microsoft.CodeAnalysis.FxCopAnalyzers)
    - 主分析器，分析各种代码问题
- [Microsoft.CodeQuality.Analyzers](https://www.nuget.org/packages/Microsoft.CodeQuality.Analyzers)
    - 专门分析代码质量的分析器（比如没有使用某个参数）
- [Microsoft.NetCore.Analyzers](https://www.nuget.org/packages/Microsoft.NetCore.Analyzers)
    - 如果你在使用 .NET Core 或者 .NET Standard，那么此分析器会告诉你更恰当地使用框架提供的 API（如果 API 恰好与 .NET Framework 桌面应用相同，那么 .NET Framework 桌面应用也因此受益）
- [Microsoft.NetFramework.Analyzers](https://www.nuget.org/packages/Microsoft.NetFramework.Analyzers)
    - 如果你在使用 .NET Framework 开发桌面应用，那么此分析器会告诉你更恰当地使用框架提供的 API

### Code Cracker

Code Cracker 是第三方开发者开发的，代码已在 GitHub 上开源：

- [code-cracker/code-cracker: An analyzer library for C# and VB that uses Roslyn to produce refactorings, code analysis, and other niceties.](https://github.com/code-cracker/code-cracker)

由于这款分析器的出现比 Visual Studio 2019 早很多，所以待 Visual Studio 2019 出现的时候，他们已经出现了一些规则的重复（意味着你可能同一个问题会被 Visual Studio 报一次，又被 Code Cracker 报一次）。

虽然部分重复，但 Code Cracker 依然提供了很多 Visual Studio 2019 和 Microsoft Code Analysis 都没有带的代码质量提示。

比如，如果你代码中的文档注释缺少了某个参数的注释，那么它会给出提示：

![CC0097](/static/posts/2019-10-12-10-43-03.png)

Code Cracker 支持的所有种类的代码分析都可以在这里查得到：

- [All diagnostics - Code Cracker](http://code-cracker.github.io/diagnostics.html)

## 配置代码分析严重程度

你的项目中对于某项规则严重性的看法也许跟微软或其他第三方分析器不一样，因此你需要自己配置规则集的严重性。

关于如何配置代码分析严重程度，你可以阅读：

- [使用 .editorconfig 配置 .NET/C# 项目的规则严重性 - walterlv](/post/use-editor-config-file-to-config-diagnostic-severities)
