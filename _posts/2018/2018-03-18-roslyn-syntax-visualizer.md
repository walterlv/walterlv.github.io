---
title: "Roslyn 入门：使用 Visual Studio 的语法可视化（Syntax Visualizer）窗格查看和了解代码的语法树"
publishDate: 2018-03-18 20:50:09 +0800
date: 2019-01-16 21:09:09 +0800
categories: visualstudio dotnet csharp roslyn
---

使用 Visual Studio 提供的 Syntax Visualizer，我们可以实时看到一个代码文件中的语法树。这对我们基于 Roslyn 编写静态分析和修改工具非常有帮助。本文将介绍如何安装它和使用它。

---

本文是 Roslyn 入门系列之一：

- [Roslyn 入门：使用 Visual Studio 的语法可视化（Syntax Visualizer）窗格查看和了解代码的语法树（本文）](/post/roslyn-syntax-visualizer.html)
- [Roslyn 入门：使用 .NET Core 版本的 Roslyn 编译并执行跨平台的静态的源码](/post/compile-and-invoke-code-using-roslyn.html)
- [Roslyn 入门：使用 Roslyn 静态分析现有项目中的代码](/post/analysis-code-of-existed-projects-using-roslyn.html)

这里是 Visual Studio 的语法可视化（Syntax Visualizer）：

![Syntax Visualizer](/static/posts/2018-03-18-20-51-14.png)

正在分析的代码文件是 [MSTestEnhancer](https://github.com/dotnet-campus/MSTestEnhancer/) 中的 `ContractTestContext.cs`；也就是我的另一篇文章 [Roslyn 入门：使用 Roslyn 静态分析现有项目中的代码](/post/analysis-code-of-existed-projects-using-roslyn.html) 中所采用的例子。

语法可视化树中有三种不同颜色的节点：

- 蓝色：[SyntaxNode](https://docs.microsoft.com/zh-cn/dotnet/api/microsoft.codeanalysis.syntaxnode?view=roslyn-dotnet)，表示声明、语句、子句和表达式等语法构造。
- 绿色：[SyntaxToken](https://docs.microsoft.com/zh-cn/dotnet/api/microsoft.codeanalysis.syntaxtoken?view=roslyn-dotnet)，表示关键字、标识符、运算符等标点。
- 红色：[SyntaxTrivia](https://docs.microsoft.com/zh-cn/dotnet/api/microsoft.codeanalysis.syntaxtrivia?view=roslyn-dotnet)，代表语法上不重要的信息，例如标记、预处理指令和注释之间的空格。

如果你是 Visual Studio 2017.6，并且在安装 Visual Studio 时选择了 Visual Studio 扩展，那么你什么都不用做就已经安装好了。否则，你需要去 [.NET Compiler Platform SDK - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=VisualStudioProductTeam.NETCompilerPlatformSDK) 下载安装。

安装完之后，去“视图->其它窗口”中就可以找到“Syntax Visualizer”。

![视图->其它窗口->Syntax Visualizer](/static/posts/2018-03-18-20-59-08.png)

现在，我们在代码文件中任意地移动光标、选择代码块，都可以在 Syntax Visualizer 中看到对应的语法节点。这对我们基于 Roslyn 编写静态分析和修改工具非常有帮助。

---

**参考资料**

- [Get started with syntax analysis (Roslyn APIs) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/roslyn-sdk/get-started/syntax-analysis)
