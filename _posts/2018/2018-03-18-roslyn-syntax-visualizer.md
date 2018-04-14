---
title: "Roslyn 入门：使用 Visual Studio 的语法可视化（Syntax Visualizer）窗格查看和了解代码的语法树"
date: 2018-03-18 20:50:09 +0800
categories: visualstudio dotnet csharp
---

使用 Visual Studio 提供的 Syntax Visualizer，我们可以实时看到一个代码文件中的语法树。这对我们基于 Roslyn 编写静态分析和修改工具非常有帮助。本文将介绍如何安装它和使用它。

---

这里是 Visual Studio 的语法可视化（Syntax Visualizer）：

![Syntax Visualizer](/static/posts/2018-03-18-20-51-14.png)

正在分析的代码文件是 [MSTestEnhancer](https://github.com/dotnet-campus/MSTestEnhancer/) 中的 `ContractTestContext.cs`；也就是我的另一篇文章 [Roslyn 入门：使用 Roslyn 静态分析现有项目中的代码](/post/analysis-code-of-existed-projects-using-roslyn.html) 中所采用的例子。

如果你是 Visual Studio 2017.6，并且在安装 Visual Studio 时选择了 Visual Studio 扩展，那么你什么都不用做就已经安装好了。否则，你需要去 [.NET Compiler Platform SDK - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=VisualStudioProductTeam.NETCompilerPlatformSDK) 下载安装。

安装完之后，去“视图->其它窗口”中就可以找到“Syntax Visualizer”。

![视图->其它窗口->Syntax Visualizer](/static/posts/2018-03-18-20-59-08.png)

现在，我们在代码文件中任意地移动光标、选择代码块，都可以在 Syntax Visualizer 中看到对应的语法节点。这对我们基于 Roslyn 编写静态分析和修改工具非常有帮助。
