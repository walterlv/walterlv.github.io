---
title: "Roslyn 语法树中各种语法节点的含义"
date: 2018-07-18 09:18:43 +0800
categories: roslyn dotnet csharp
published: false
---

使用 Roslyn 进行源码分析时，我们会对很多不同种类的语法节点进行分析。那么有哪些种类的语法节点，各种语法节点的含义是什么呢？

---

<div id="toc"></div>

### 基本概念

```csharp
using System;

namespace Walterlv.Demo
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello Walterlv!");
        }
    }
}
```

以上是一个非常简单但完整的 .cs 文件。

在 Roslyn 的解析中，这就是一个“编译单元”（Compilation Unit）。编译单元是 Roslyn 语法树的根节点。紧接着的 `using System` 是 using 指令（Using Directives）；随后是命名空间声明（Namespace Declaration），包含子节点类型声明（Class Declaration）；类型声明包含子节点方法声明（Method Declaration）。

接下来，我们会介绍 Roslyn 语法树中各种不同种类的节点，以及其含义。

### CompilationUnit
### UsingDirectives
### NamespaceDeclaration
### NamespaceKeyword
### PublicKeyword
### InternalKeyword
### StaticKeyword
### ClassKeyword
### QualifiedName
### IdentifierName
### IdentifierToken
### AttributeList
### Attribute
### ClassDeclaration
### MethodDeclaration
### PropertyDeclaration
### AccessorList
### GetAccessorDeclaration
### SetAccessorDeclaration
### ArrayType
### ArrayRankSpecifier
### OmittedArraySizeExpression

### DotToken
### 
### OpenBraceToken
### CloseBraceToken
### EndOfLineTrivia
### WhitespaceTrivia
