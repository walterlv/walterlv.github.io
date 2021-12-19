---
title: "在 Roslyn 分析语法树时添加条件编译符号的支持"
date: 2018-12-24 22:36:28 +0800
tags: roslyn csharp visualstudio msbuild
position: knowledge
coverImage: /static/posts/2018-12-24-22-29-21.png
permalink: /post/roslyn-syntax-tree-supporting-preprocessor-symbols.html
---

我们在代码中会写 `#if DEBUG` 或者 `[Conditional("DEBUG")]` 来使用已经定义好的条件编译符号。而定义条件编译符号可以在代码中使用 `#define WALTERLV` 来实现，也可以通过在项目属性中设置条件编译符号（Conditional Compilation Symbols）来实现。

然而如果我们没有做任何特殊处理，那么使用 Roslyn 分析使用了条件编译符号的源码时，就会无法识别这些源码。

---

如果你不知道条件编译符号是什么或者不知道怎么设置，请参见：

- [.NET/C# 项目如何优雅地设置条件编译符号？](/post/how-to-define-preprocessor-symbols)

<div id="toc"></div>

我们在使用 Roslyn 分析语法树时，会创建语法树的一个实例。如果使用默认的构造函数，那么就不会识别设置了条件编译符号的语句，如下图：

![不识别条件编译符号](/static/posts/2018-12-24-22-29-21.png)

而实际上构造函数的参数中带有 `preprocessorSymbols` 参数，即预处理符号。在传入此预处理符号的情况下，Roslyn 就可以识别此符号了：

![识别的条件编译符号](/static/posts/2018-12-24-22-33-05.png)

方法是传入 `preprocessorSymbols` 参数：

```csharp
var preprocessorSymbols = new[] {"DEBUG", "TRACE", "WALTERLV", "NETCOREAPP2_1"};
var syntaxTree = CSharpSyntaxTree.ParseText(originalText, new CSharpParseOptions(
    LanguageVersion.Latest, DocumentationMode.None, SourceCodeKind.Regular, preprocessorSymbols)
```

此后，你可以拿 `syntaxTree` 做其他事情了：

```csharp
var compileTypeVisitor = new CompileTypeVisitor();
compileTypeVisitor.Visit(syntaxTree.GetRoot());
Types = compileTypeVisitor.Types.ToList();
```

当然这段代码你可能编译不通过，因为这是另一篇博客中的源码：

- [Roslyn 入门：使用 Roslyn 静态分析现有项目中的代码](/post/analysis-code-of-existed-projects-using-roslyn)

本文所用的查看语法树的插件，你可以查看另一篇博客：

- [Roslyn 入门：使用 Visual Studio 的语法可视化（Syntax Visualizer）窗格查看和了解代码的语法树](/post/roslyn-syntax-visualizer)


