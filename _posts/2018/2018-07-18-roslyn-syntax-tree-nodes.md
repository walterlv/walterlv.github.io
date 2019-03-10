---
title: "Roslyn 语法树中的各种语法节点及每个节点的含义"
date: 2018-07-18 20:24:00 +0800
categories: roslyn dotnet csharp
---

使用 Roslyn 进行源码分析时，我们会对很多不同种类的语法节点进行分析。如果能够一次性了解到各种不同种类的语法节点，并明白其含义和结构，那么在源码分析的过程中将会更加得心应手。

本文将介绍 Roslyn 中各种不同的语法节点、每个节点的含义，以及这些节点之间的关系和语法树结构。

---

<div id="toc"></div>

## 基本概念

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

## 语法节点

### 语法树

**CompilationUnit**，是语法树的根节点。

### 关键字

**UsingKeyword**、**NamespaceKeyword**、**PublicKeyword**、**InternalKeyword**、**PrivateKeyword**、**ProtectedKeyword**、**StaticKeyword**、**ClassKeyword**、**InterfaceKeyword**、**StructKeyword**。

分别是 C# 的各种关键字：`using`, `namespace`, `public`, `internal`, `private`, `protected`, `static`, `class`, `interface`, `struct`。

**InKeyword**、**OutKeyword**、**RefKeyword**、**ReturnKeyword**、**ConstKeyword**、**DefaultKeyword**。

分别是 C# 的另一波关键字 `in`、`out`、`ref`、`return`、`const`、`default`。

**ByteKeyword**、**CharKeyword**、**IntKeyword**、**LongKeyword**、**BoolKeyword**、**FloatKeyword**、**DoubleKeyword**、**DecimalKeyword**。

分别是 C# 中的基元类型关键字`byte`、`char`、`int`、`long`、`bool`、`float`、`double`、`decimal`。需要注意的是，`var` 和 `dynamic` 并不是基元类型关键字，在语法节点中，它是 IdentifierName。

**AsyncKeyword**、**AwaitKeyword**。

分别是 `async`、`await` 关键字。

**TrueKeyword**、**FalseKeyword**。

分别是 `true` 和 `false` 关键字。

**LockKeyword**、**CheckedKeyword**、**UncheckedKeyword**、**UnsafeKeyword**、**FixedKeyword**。

分别是 `lock`、`checked`、`unchecked`、`unsafe`、`fixed` 关键字。

### 符号

**DotToken**、**SemicolonToken**、**OpenBraceToken**、**CloseBraceToken**、**LessThanToken**、**GreaterThanToken**、**OpenParenToken**、**CloseParenToken**。

分别是 C# 中的各种符号：`.`, `;`, `{`, `}`, `<`, `>`, `(`, `)`。

### 空白

**EndOfLineTrivia** 表示换行，**WhitespaceTrivia** 表示空格，**EndOfFileToken** 表示文件的末尾。

通常，这两个语法节点会在另一个节点的里面，作为另一个节点的最后一部分。比如 `using Walterlv.Demo;` 是一个 UsingDirective，它的最后一个节点 Semicolon 中就会包含换行符 EndOfLineTrivia。

### 指令

**UsingDirective** 是 `using` 指令。一个 `using` 指令包含一个 UsingKeyword，一个 QualifiedName 和一个 Semicolon（`;`）。

### 声明

**NamespaceDeclaration**、**ClassDeclaration**、**MethodDeclaration**、**PropertyDeclaration**、**FieldDeclaration**、**VariableDeclaration**。

分别是命名空间、类型、方法、属性、。

其中，属性声明包含一个 **AccessorList**，即属性访问器列表，访问期列表可以包含 **GetAccessorDeclaration**（属性 get）、**SetAccessorDeclaration**（属性 set）的声明。

这些声明通常是嵌套存在的。例如一个常规的文件的第 0、1 级语法节点通常是这样的：

+ CompilationUnit
    - UsingDirective
    - UsingDirective
    - NamespaceDeclaration
    - EndOfFileToken

类型声明是命名空间声明的子节点，类型成员的声明是类型声明的子节点。

### 名称和标识符

- **QualifiedName**
    - 限定名称，可以理解为完整的名称。
    - 例如命名空间 Walterlv.DemoTool 的限定名称就是这个全称 Walterlv.DemoTool；类型 Walterlv.DemoTool.Foo 的限定名称也是这个全程 Walterlv.DemoTool.Foo。
- **IdentifierName**
    - 标识名称，当前上下文下的唯一名称。
    - 例如 Walterlv 和 DemoTool 都是 Walterlv.DemoTool 这个命名空间的标识符。
- **IdentifierToken**
    - 标识符，具体决定 IdentifierName 的一个字符串。
    - 这其实与 IdentifierName 是一样的意思，但是在语法树上的不同节点。
- **GenericName**
    - 泛型名称，即 Foo<T> 这种。

### 特性

**AttributeList**、**Attribute**。

一个允许添加特性的地方，如果添加了特性，那么可以得到 AttributeList 节点，内部包含了多个 Attribute 子节点。

### 形参和实参

形参是 parameter，实参是 argument。前者是定义的参数，后者是实际传入的参数。

语法节点中有两种不同的形参和实参，一个是泛型，一个是普通参数。

- **ParameterList**
    - 形参列表，出现在方法声明中，即 `void Foo(string a, bool b)` 中的 `(string a, bool b)` 部分。
- **Parameter**
    - 形参，即以上例子中的 `string a` 和 `bool b` 部分。
- **ArgumentList**
    - 实参列表，出现在方法调用中，即 `this.Foo(a, b)` 中的 `(a, b)` 部分。
- **Argument**
    - 实参，即以上例子中的 `a` 和 `b` 部分。
- **TypeParameterList**
    - 泛型形参列表，出现在类型声明或者方法声明中，即 `void Foo<T1, T2>(string a)` 中的 `<T1, T2>` 部分。
- **TypeParameter**
    - 泛型形参，即以上例子中的 `T1` 和 `T2` 部分。
- **TypeArgumentList**
    - 泛型实参列表，出现在使用泛型参数的地方，例如 `this.Foo<T1, T2>()` 中的 `<T1, T2>` 部分。
- **TypeArgument**
    - 泛型实参，即以上例子中的 `T1` 和 `T2` 部分。

### 语句块

- **Block**
    - 即用 `{` 和 `}` 包裹的语句代码。
    - 当然并不是所有 `{` 和 `}` 包裹的都是语句（例如类型声明就不是），里面真正有代码时才是语句。
- **EqualsValueClause**
    - 等号子句，例如 `= null`。我们经常称之为“赋值”语句。

### 语句

一个语句是指包含分号在内的实际执行的句子。

- **LocalDeclarationStatement**
    - 本地变量声明语句，即 `var a = 0;` 这样的句子；其中，去掉分号的部分即前面我们提到的变量声明 VariableDeclaration。
    - 一个本地变量声明的语句也可以不包含赋值。
- **ExpressionStatement**
    - 表达式语句，即 `this.Foo();` 这样的一次方法调用。如果去掉分号，剩下的部分是表达式（Expression）。
- **IfStatement**
    - if 语句，即一个完整的 `if`-`else if`-`else`。
- **ForStatement**
    - for 语句。
- **ForEachStatement**
    - for 语句。
- **WhileStatement**
    - while 语句，即一个完整的 `while`。
- **DoStatement**
    - do-while 语句。
- **DefaultStatement**
    - `default();` 语句。
- **ReturnStatement**
    - return 语句。
- **CheckedStatement**
    - checked 语句。
- **UncheckedStatement**
    - checked 语句。
- **UnsafeStatement**
    - unsafe 语句。
- **FixedStatement**
    - unsafe 语句。

### 表达式

- **EqualsExpression**
    - 相等判断表达式，即 `a == b`。
- **InvocationExpression**
    - 调用表达式，即 `Class.Method(xxx)` 或 `instance.Method(xxx)` 这种完整的调用。
- **SimpleMemberAccessExpression**
    - 这是 InvocationExpression 的子节点，是方法调用除去参数列表的部分，即 `Class.Method` 或 `instance.Method`。
    - 如果是获取属性（没有参数列表），那么也是这个节点。
- **AwaitExpression**
    - await 表达式，即 `await this.Foo()` 这样的调用。
- **DefaultExpression**
    - `default()` 表达式。
- **TrueLiteralExpression**
    - `true` 表达式。
- **FalseLiteralExpression**
    - `false` 表达式。
- **ParenthesizedLambdaExpression**
    - 带括号的 lambda 表达式，例如：
    - `() => xxx`、`(a) => xxx`、`(a, b) => xxx`、`(int a, string b) => xxx`
    - `() => { }`、`(a) => { }`、`(a, b) => { }`、`(int a, string b) => { }`
- **SimpleLambdaExpression**
    - 不带括号的 lambda 表达式，例如：
    - `a => xxx`、`a => { }`

### 基元类型

**PredefinedType** 是所有基元类型的节点。它的子节点可能是 BoolKeyword、StringKeyword 或其它基元类型的关键字。

### C# 内建类型

**NullableType**、**TupleType**、**ArrayType**。

这三个分别是 C# 中语法级别支持的类型，分别是可空类型、元组类型和数组类型。

- NullableType
    - 即 `bool?` 这种用于创建 `Nullable<bool>` 的语法。
- TupleType
    - 即 `(bool, string)` 这种用于创建 `ValueTuple<bool, string>` 的语法。
- ArrayType
    - 即 `[]` 这种用于创建数组类型的语法。
