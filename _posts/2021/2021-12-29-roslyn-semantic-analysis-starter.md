---
title: "使用 Roslyn 对 C# 代码进行语义分析"
date: 2021-12-29 08:47:18 +0800
categories: dotnet roslyn csharp
position: starter
---

Roslyn 是微软为 C# 设计的一套分析器，它具有很强的扩展性。以至于我们只需要编写很少量的代码便能够分析我们的源代码。之前我写过一些使用 Roslyn 进行[语法分析](http://blog.walterlv.com/post/analysis-code-of-existed-projects-using-roslyn.html)的文章。使用语法分析，可以轻松为代码编写提供各种错误报告以及修改代码（[见这里](http://blog.walterlv.com/post/develop-a-code-analyzer-for-both-nuget-and-visual-studio-extension.html)）。而使用语义分析，你可以像在运行时使用反射一样，在编译时访问源代码中的各种类型、属性、方法等，特别适合用来分析引用、生成代码等。当然，实际项目里面将两者结合起来可以做到更多的效果。

---

<div id="toc"></div>

本文将以 [dotnetCampus.Ipc](https://github.com/dotnet-campus/dotnetCampus.Ipc) 项目里的自动生成 IPC 代理类型作为示例，来介绍如何使用 Roslyn 进行语法分析。本文会更偏碎片化。

## 第一步：找到编译信息和语法树

在开始后面的实际语义分析之前，你需要先拿到以下对象的实例：

- `Microsoft.CodeAnalysis.SyntaxTree`：包含单个文件里所有语法节点的语法树
- `Microsoft.CodeAnalysis.Compilation`: 包含整个编译项目的编译信息

你有以下方法可以拿到这些对象。

### 如果你正在编写代码分析器（Analyzer）和修改器（CodeFix）

代码分析器和修改器的入口方法可以得到一个 `SyntaxNodeAnalysisContext` 类型的参数，这个参数里面就可以拿到 `Compilation` 的实例。

同时，在这个入口方法中，你也很容易就得到一个语法节点“`SyntaxNode`”的实例，而每一个语法节点都有 `SyntaxTree` 属性可以拿到语法树。

关于代码分析器（Analyzer）和修改器（CodeFix）可以参考我之前的这些博客：

- 可参考：[基于 Roslyn 同时为 Visual Studio 插件和 NuGet 包开发 .NET/C# 源代码分析器 Analyzer 和修改器 CodeFixProvider - walterlv](http://blog.walterlv.com/post/develop-a-code-analyzer-for-both-nuget-and-visual-studio-extension.html)
- 可参考：[使用基于 Roslyn 的 Microsoft.CodeAnalysis.PublicApiAnalyzers 来追踪项目的 API 改动，帮助保持库的 API 兼容性 - walterlv](http://blog.walterlv.com/post/track-api-changes-using-roslyn-public-api-analyzers.html)
- 可参考：[使用 Roslyn 分析代码注释，给 TODO 类型的注释添加负责人、截止日期和 issue 链接跟踪 - walterlv](http://blog.walterlv.com/post/comment-analyzer-and-code-fix-using-roslyn.html)

### 如果你正在编写代码生成器（Generator）

代码生成器的入口方法带有一个 `GeneratorExecutionContext` 类型的参数，而它直接就有我们需要的两种对象。

- `GeneratorExecutionContext.Compilation` 即整个项目的编译信息；
- `GeneratorExecutionContext.Compilation.SyntaxTrees` 包含整个项目正在参与编译的所有非生成器生成的代码的语法树。

<!-- ### 如果你自己单独做分析

如果你是自己做单独的代码分析（没有加入到项目的编译过程），那么也可以通过 `CSharpSyntaxTree.ParseText(sourceCode, new CSharpParseOptions(LanguageVersion.Latest));` 来拿到一段文本的语法树（`SyntaxTree`）。

不过，自己分析单个文件的话，`Compilation` 就不好拿到了，因为根本就没有项目。 -->

## 第二步：获取语义模型和语义符号

使用这句，可以拿到一个语法树的语义模型：

```csharp
var semanticModel = compilation.GetSemanticModel(syntaxTree);
```

通过这个语义模型，你可以找到每一个语法节点所对应的语义符号到底是什么。

接下来的部分，你需要先拥有 Roslyn 语法分析的基本能力才能完成，因为要拿到一个语义符号，你需要先拿到其对应的语法节点（至少是第一个节点）。例如，拿到一个语法树（`SyntaxTree`）中的类型定义，可以用下面的方法：

```csharp
// 遍历语法树中的所有节点，找到所有类型定义的节点。
var classDeclarationSyntaxes = from node in syntaxTree.GetRoot().DescendantNodes()
                               where node.IsKind(SyntaxKind.ClassDeclaration)
                               select (ClassDeclarationSyntax) node;
```

这样，针对这个语法树里面的每一个类型定义，我们都可以拿到其对应的语义了：

```csharp
foreach (var classDeclarationSyntax in classDeclarationSyntaxes)
{
    if (semanticModel.GetDeclaredSymbol(classDeclarationSyntax) is { } classDeclarationSymbol)
    {
        // 在这里使用你的类型定义语义符号。
    }
}
```

## 第三步：使用语义模型

经过了前两个步骤，Roslyn 语义分析最难的部分就结束了（没错，两句代码就结束了）。

接下来对语义符号的使用你可以简单想象成就是在使用反射功能的编译形式而已。你可以简单地获得类型的命名空间，获得类型的特性（`Attribute`）；获得类型的成员，成员的特性……

```csharp
// 获取类型的命名空间。
var namespace = classDeclarationSymbol.ContainingNamespace;
```

```csharp
// 获得基类，获得接口。
var baseType = classDeclarationSymbol.BaseType;
var interfaces = classDeclarationSymbol.Interfaces;
```

```csharp
// 获取类型的成员。
var members = classDeclarationSymbol.GetMembers();
```

```csharp
// 获取成员的类型，然后忽略掉属性里面的方法。
foreach (var member in members)
{
    if (member is IMethodSymbol method && method.MethodKind is MethodKind.PropertyGet or MethodKind.PropertySet)
    {
        continue;
    }

    // 其他成员。
}
```

```csharp
// 获得方法的形参数列表。
var parameters = method.Parameters;
```

```csharp
// 获得方法的返回值类型。
var returnType = method.ReturnType;
```

还有更多。由于使用起来非常地直观而简单，所以就自己探索吧！

---

**参考资料**

- [roslyn/source-generators.md at main · dotnet/roslyn](https://github.com/dotnet/roslyn/blob/main/docs/features/source-generators.md)
- [roslyn/source-generators.cookbook.md at main · dotnet/roslyn](https://github.com/dotnet/roslyn/blob/main/docs/features/source-generators.cookbook.md)
