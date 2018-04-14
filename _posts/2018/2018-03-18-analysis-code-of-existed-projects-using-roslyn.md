---
title: "Roslyn 入门：使用 Roslyn 静态分析现有项目中的代码"
date_published: 2018-03-18 20:45:22 +0800
date: 2018-03-30 19:15:07 +0800
categories: visualstudio dotnet csharp
---

Roslyn 是微软为 C# 设计的一套分析器，它具有很强的扩展性。以至于我们只需要编写很少量的代码便能够分析我们的项目文件。

作为 Roslyn 入门篇文章，你将可以通过本文学习如何开始编写一个 Roslyn 扩展项目，如何开始分析一个解决方案（.sln）中项目（.csproj）的代码文件（.cs）。

---

如果你希望真实地静态分析一个实际项目，并且理解这样的分析过程是如何进行的（而不只是写个 demo），那么本文的所有内容都将是必要的。

<div id="toc"></div>

### 准备工作

为了能够进行后面关键的操作，我们需要先有一个能跑起来的项目。

![](/static/posts/2018-03-18-18-51-26.png)  
▲ 在 Visual Studio 新建项目，选择“控制台程序(.NET Framework)”

在目前（{% include date.html date=page.date %}），如果我们需要像本文一样分析现有的解决方案和项目，那么 **.NET Framework 是必须的**；如果只是分析单个文件，那么也可以选择 .NET Core。

当然，如果你有一个现成的 .NET Core 项目，可以通过修改 .csproj 文件改成 .NET Framework 的：

![](/static/posts/2018-03-18-18-57-00.png)

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <!-- 从 netcoreapp2.0 改成 net471，因为 NuGet 包中的 ValueTuple 与 net47 不兼容，所以只能选择 net471 或以上  -->
    <TargetFramework>net471</TargetFramework>
  </PropertyGroup>
</Project>
```

现在，我们有了一个可以开始写代码的 Program.cs 文件，接下来就可以正式开始入门了。

### 安装必要的 NuGet 包

在 NuGet 包管理器中搜索并安装 Microsoft.CodeAnalysis 包 —— 这是一个包含 Roslyn 所有 API 的各种 NuGet 包的合集。

![Microsoft.CodeAnalysis](/static/posts/2018-03-18-19-00-19.png)

当然，如果你只是做一些特定的事情，当然不需要安装这么全的 NuGet 包，像 [Roslyn 静态分析 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E9%9D%99%E6%80%81%E5%88%86%E6%9E%90.html) 的 demo 中就不需要安装所有 NuGet 包。

**特别注意**！！！如果前面你是通过 .NET Core 项目改过来的，那么**还需要额外安装以下三个 NuGet 包，否则运行时会无法打开解决方案和项目**。

- `Microsoft.Build`
- `Microsoft.Build.Tasks.Core`
- `System.Threading.Tasks.Dataflow`

### 打开一个解决方案/项目和其中的文件

现在，我们使用这些代码打开解决方案。我以 [MSTestEnhancer](https://github.com/dotnet-campus/MSTestEnhancer/) 为例：

```csharp
// 打开 MSTestEnhancer(https://github.com/dotnet-campus/MSTestEnhancer/) 解决方案文件。
// 注意这里的 MSBuildWorkspace.Create() 会返回 WorkSpace 的实例。
// 虽然 WorkSpace 是跨平台的，但是 MSBuildWorkspace 仅在 Windows 下可用。
var solution = await MSBuildWorkspace.Create().OpenSolutionAsync(
    @"D:\Developments\Open\MSTestEnhancer\MSTest.Extensions.sln");
    
// 从解决方案中选出 MSTest.Extensions 项目。
var project = solution.Projects.First(x => x.Name == "MSTest.Extensions");

// 从 MSTest.Extensions 项目中选出我们要分析的 ContractTestContext.cs 文件。
// 这里只是一个示例，所以我们只分析一个文件。你可以从 Documents 集合中找出这个项目的所有文件进行分析。
var document = project.Documents.First(x =>
        x.Name.Equals("ContractTestContext.cs", StringComparison.InvariantCultureIgnoreCase));
```

### 分析代码

我们要分析的代码大致是这样的：

```csharp
// 这里是 using，省略。
// 这里是命名空间，省略。
public class ContractTestContext<T>
{
    // 这是代码的细节，省略。
}
```

现在，我们开始使用 Roslyn API 找出里面的泛型 `T`。

这里，我们必须引入一个概念 —— Syntax Rewriter。

#### 语法重写——Syntax Rewriter

Roslyn 对 C# 代码进行分析的一个非常关键的 API 是 `CSharpSyntaxRewriter`——这是一个专门用来给你继承的类。`CSharpSyntaxRewriter` 是**访问者模式**中访问者的一个实现，如果你不了解访问者模式，推荐阅读 [23种设计模式（9）：访问者模式 - CSDN博客](http://blog.csdn.net/zhengzhb/article/details/7489639#reply) 进行了解，否则我们后面的代码你将只能跟着我写，而不能明白其中的含义。

当你阅读到这里时，我开始假设你已经了解了访问者模式了。

我们每个人都可能会写出不同的基于 Roslyn 的分析器，这些分析器通常都会对不同文件的 C# 语法树进行不同的操作；于是，我们通过重写 `CSharpSyntaxRewriter` 可以实现各种各样不同的操作。在访问者模式中，由于 C# 的语法在一个 C# 版本发布之后就会确定，其中各种各样类型的语法对应访问者模式中的各种不同类型的数据，Roslyn 为我们构建的语法树对应访问者模式中需要访问的庞大的数据结构。由于 Roslyn 的语法树是非常庞大的，以至于对其进行遍历也是一个非常复杂的操作；所以 Roslyn 通过访问者模式为我们封装了这种复杂的遍历过程，我们只需要重写 `CSharpSyntaxRewriter` 就可以实现对某种特定语法节点的操作。

现在，我们编写一个用于找出泛型参数 `T` 的 Syntax Rewriter。

```csharp
class TypeParameterVisitor : CSharpSyntaxRewriter
{
    public override SyntaxNode VisitTypeParameterList(TypeParameterListSyntax node)
    {
        var lessThanToken = this.VisitToken(node.LessThanToken);
        var parameters = this.VisitList(node.Parameters);
        var greaterThanToken = this.VisitToken(node.GreaterThanToken);
        return node.Update(lessThanToken, parameters, greaterThanToken);
    }
}
```

其实这段代码就是 `CSharpSyntaxRewriter` 基类中的代码，我把它贴出来可以帮助我们理解它。**你也依然需要将他放入到我们的项目中**，因为我们接下来的代码就开始要使用它了。

如果你想了解更多语法节点，推荐另一篇入门文章：[Roslyn 入门：使用 Visual Studio 的语法可视化（Syntax Visualizer）窗格查看和了解代码的语法树](/post/roslyn-syntax-visualizer.html)。

#### 访问泛型参数

现在，我们继续在之前打开解决方案和项目文件的代码后面增添代码：

```csharp
// 从我们一开始打开的项目文件中获取语法树。
var tree = await document.GetSyntaxTreeAsync();
var syntax = tree.GetCompilationUnitRoot();

// 使用我们刚刚重写 CSharpSyntaxRewriter 的类来访问语法树。
var visitor = new TypeParameterVisitor();
var node = visitor.Visit(syntax);

// 得到的 node 是新的语法树节点，
// 如果我们在 `TypeParameterVisitor` 中修改了语法树，
// 那么这里就会得到修改后的 node 节点。
// 我们可以通过这个 node 节点做各种后续的操作。
```

如果我们使用 node 的方式是修改代码，那么可以使用 `var text = node.GetText();` 来得到新的语法树生成的代码，使用这段文本替换之前的文本可以达到修改代码的目的。不过，这不是本文的重点，本文的重点依然在入门。

现在，整合以上的三大段代码，你的项目应该能够完整地跑起来了。哪三段？1. 打开项目文件；2. `TypeParameterVisitor`；3. 访问泛型参数。其中 1 和 3 写在一个方法中，2 是一个新类。

#### 分析这个泛型参数

直到现在，我们所写的任何代码都还只是为了使使用 Roslyn API 的代码能够跑起来，没有进行任何实质上的分析。接下来，我们会修改 `CSharpSyntaxRewriter` 以进行真正的分析。不过在此之前，我假设上面的代码你是能正常跑起来而且没有错误的。（*如果不行，就在下面留言吧！留言有邮件通知的，我会在第一时间回复你。*）

如果你不了解 Roslyn，强烈建议去 `VisitTypeParameterList` 重写方法中打一个断点观察 `lessThanToken` `parameters` `greaterThanToken` 这几个实例的含义。`lessThanToken` 就是 `<`，`greaterThanToken` 就是 `>`；而 `parameters` 是一个泛型参数列表，在这里，是一个 `T`。

现在，我们构造一个自己的泛型参数列表试试，名字不是 `T` 了，而是 `TParameter`。

```csharp
var parameters = new SeparatedSyntaxList<TypeParameterSyntax>();
parameters = parameters.Add(SyntaxFactory.TypeParameter("TParameter"));
```

特别注意：`SeparatedSyntaxList` 的 `Add` 操作**不会**修改原集合，而是会返回一个新的集合！所以上面 `Add` 之后的赋值语句不能少！这样的设计应该是为了避免遍历语法树的时候语法树被修改导致遍历不可控。

于是，我们的 `TypeParameterVisitor` 变成了这样：

```csharp
class TypeParameterVisitor : CSharpSyntaxRewriter
{
    public override SyntaxNode VisitTypeParameterList(TypeParameterListSyntax node)
    {
        // 构造一个自己的泛型列表，名字改为了 TParameter。
        var parameters = new SeparatedSyntaxList<TypeParameterSyntax>();
        parameters = parameters.Add(SyntaxFactory.TypeParameter("TParameter"));

        // 依然保留之前的更新语法节点的方法。
        // 这样，我们将会在语法树访问结束后得到新的语法树。
        var lessThanToken = this.VisitToken(node.LessThanToken);
        var greaterThanToken = this.VisitToken(node.GreaterThanToken);
        return node.Update(lessThanToken, parameters, greaterThanToken);
    }
}
```

### 总结

我们总共编写了两个关键类：

- Program
    - Main（用于打开项目和文件，并调用 TypeParameterVisitor 遍历语法树）  
    *需要注意，Main 函数只有 C#7.2 及以上才支持 `async`，如果没有这么高，需要再编写一个新函数，然后在 Main 里面调用它。*
- TypeParameterVisitor
    - VisitTypeParameterList（用于遍历和修改语法树中的泛型参数列表）

以上便是分析和修改 Roslyn 语法树的简单实例了，我将整个 Program.cs 文件贴在下面，以便整体查看。

```csharp
using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;
using Microsoft.CodeAnalysis.CSharp.Syntax;
using Microsoft.CodeAnalysis.MSBuild;

namespace Walterlv.Demo.Roslyn
{
    class Program
    {
        static void Main(string[] args)
        {
            RunAsync().Wait();
        }

        private static async Task RunAsync()
        {
            var solution = await MSBuildWorkspace.Create().OpenSolutionAsync(
                @"D:\Developments\Open\MSTestEnhancer\MSTest.Extensions.sln");
            var project = solution.Projects.First(x => x.Name == "MSTest.Extensions");
            var document = project.Documents.First(x =>
                x.Name.Equals("ContractTestContext.cs", StringComparison.InvariantCultureIgnoreCase));

            var tree = await document.GetSyntaxTreeAsync();
            var syntax = tree.GetCompilationUnitRoot();

            var visitor = new TypeParameterVisitor();
            var node = visitor.Visit(syntax);

            var text = node.GetText();
            File.WriteAllText(document.FilePath, text.ToString());
        }
    }

    class TypeParameterVisitor : CSharpSyntaxRewriter
    {
        public override SyntaxNode VisitTypeParameterList(TypeParameterListSyntax node)
        {
            var syntaxList = new SeparatedSyntaxList<TypeParameterSyntax>();
            syntaxList = syntaxList.Add(SyntaxFactory.TypeParameter("TParameter"));

            var lessThanToken = this.VisitToken(node.LessThanToken);
            var greaterThanToken = this.VisitToken(node.GreaterThanToken);
            return node.Update(lessThanToken, syntaxList, greaterThanToken);
        }
    }
}
```

---

#### 参考资料

- [23种设计模式（9）：访问者模式 - CSDN博客](http://blog.csdn.net/zhengzhb/article/details/7489639#reply)
- [John Koerner - Using a CSharp Syntax Rewriter](https://johnkoerner.com/csharp/using-a-csharp-syntax-rewriter/)
- [Learn Roslyn Now: Part 5 CSharpSyntaxRewriter – Shotgun Debugging](https://joshvarty.com/2014/08/15/learn-roslyn-now-part-5-csharpsyntaxrewriter/)
- [Code Generation with Roslyn: a Skeleton Class from UML - Federico Tomassetti - Software Architect](https://tomassetti.me/code-generation-with-roslyn-a-skeleton-class-from-uml/)
