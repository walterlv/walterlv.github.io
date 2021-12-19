---
title: "C#/.NET 中的契约式编程，以及 ReSharper 为我们提供的契约特性"
publishDate: 2017-12-20 23:04:21 +0800
date: 2019-03-14 12:57:32 +0800
tags: csharp dotnet
coverImage: /static/posts/2017-12-20-22-19-10.png
permalink: /posts/contracts-in-csharp.html
---

> 将文档放到代码里面，文档才会及时地更新！

微软从 .NET Framework 4.0 开始，增加了 `System.Diagnostics.Contracts` 命名空间，用来把契约文档融入代码。然而后面一直不冷不热，Visual Studio 都没天然支持。

ReSharper 也提供了 ReSharper Annotations，在 ReSharper 插件工作的情况下能够进行静态契约的验证。

C#8.0 的可空引用类型是 Roslyn 对 null 的验证，这个可能更加强大，既可以是编译警告，也可以是编译错误。

---

<p id="toc"></p>

## 契约式编程

当你调用某个类库里面的方法时，你如何能够知道传入的参数是否符合规范？如何能够知道方法调用结束之后是否要对结果进行判断？

```csharp
T DoSomething<T>(T parent) where T : class;
```

▲ 对于上面的方法，你知道 `null` 传入参数是合理的吗？返回的参数需要判空吗？

代码的编写者可能是这么写的：

```csharp
public T DoSomething<T>(T parent) where T : class
{
    if (parent == null)
    {
        throw new ArgumentNullException(nameof(parent));
    }
    // 后续逻辑。
}
```

有些静态代码检查工具也许可以根据这里的参数判断代码块来认定为此处的参数不能为 null，但这种判断代码无处不在，静态检查工具如何能够有效地捕获每一处的检查呢？难道我们真的要去翻阅文档吗？然而除非是专门提供 SDK 的团队，否则文档通常都会滞后于代码，那么对于这些契约的修改可能就不太准确。

于是，契约式编程就应运而生。

它将前置条件（Precondition）、后置条件（Postcondition）、不变量（Invariant）等代码分离出来，按照特定的格式编写以便能够被静态检查工具分析出来。

有了静态分析工具以及契约代码的帮助，Visual Studio 的智能感知提示将能够直接告诉我们代码编写的潜在问题，而不必等到运行时再抛出异常，那时将降低开发效率，将增加生产环境运行的风险。

## 几种不同的契约方法

### ReSharper Annotations

ReSharper 并没有将其称之为“契约”，因为它真的只是“文档级别”的约束，只会在写代码的时候具备一定程度的静态分析能力以便给出提示，并不提供运行时的检查。不过，ReSharper 会为我们生成运行时检查的代码。只要是装了 ReSharper 插件并用它写过代码的，应该都见过 ReSharper Annotations 了，因为它会在我们试图添加契约代码时自动添加契约标记（Attribute）。

![提示生成](/static/posts/2017-12-20-22-19-10.png)  
▲ 生成 ReSharper Annotations

如果错过了首次提示，可以在 ReSharper 的设置界面中生成 Annotations 的代码。（复制一份代码然后新建一个文件粘贴。）

![手动生成](/static/posts/2017-12-20-22-14-55.png)  
▲ 手动生成 ReSharper Annotations

#### ReSharper 中常用的契约 Attribute

- CanBeNull
    * 表示参数或返回值可能为 `null`。
- CannotApplyEqualityOperator
    * 表示某个类型的相等比较不应该用 `==` 或 `!=`，而应该用 `Equals`。
- ItemCanBeNull
    * 表示集合参数或集合返回值里某一项可能为 `null`。
    * 或者表示 `Task<T>` 返回值中的 `T` 可能为 `null`。
- ItemNotNull
    * 表示集合参数或集合返回值里每一项都不为 `null`。
    * 或者表示 `Task<T>` 返回值中的 `T` 不为 `null`。
- LinqTunnel
    * 表示某个方法就像 linq 方法一样。
- LocalizationRequired
    * 表示参数字符串需要被本地化。
- NotNull
    * 表示参数或返回值不可能为 null。
- PathReference
    * 表示参数字符串是一个路径。
- Pure
    * 表示方法不会修改任何状态（这意味着如果连返回值都不用，那调用了也相当于什么都没做）。
- RegexPattern
    * 表示参数字符串是一个正则表达式（会被 ReSharper 代码着色）。
- 还有 100+ 个……

- ContractAnnotation
    * 详见 [Contract Annotations - Help - ReSharper](https://www.jetbrains.com/help/resharper/Contract_Annotations.html)，可以使用约定的语法写出更复杂的契约。

我的朋友[林德熙](https://lindexi.github.io/lindexi/)在 [使用 Resharper 特性](https://lindexi.github.io/lindexi/post/%E4%BD%BF%E7%94%A8-Resharper-%E7%89%B9%E6%80%A7.html) 一文中有这些契约对编写代码的更详细的效果描述和截图。

### System.Diagnostics.Contracts

此命名空间下的 `Contract` 类型定义了几个方法，覆盖了我们编写一个方法所要遵循的契约模式。

```csharp
private T DoSomething<T>(T parent) where T : class
{
    // * 要开始此任务必须先满足某些条件（Requires，RequiresAlways，EndContractBlock）
    // 做一些操作。
    // * 此时认定一定满足某个条件（Assume）
    // 继续执行一些操作。
    // * 操作执行完后一定满足某组条件（Ensures，EnsuresOnThrows）
}
```

以上代码中，星号（*）表示契约代码，其他表示方法内的普通代码。一个典型的例子如以下代码所示：

```csharp
private T DoSomething<T>(T parent) where T : class
{
    // * 要开始此任务必须先满足某些条件（Requires，EndContractBlock）
    Contract.Requires<ArgumentNullException>(parent != null);

    // 做一些操作。

    // * 此时认定一定满足某个条件（Assume）
    Contract.Assume(parent != null);

    // 继续执行一些操作。

    // * 操作执行完后一定满足某组条件（Ensures，EnsuresOnThrows）
    Contract.EnsuresOnThrow<InvalidOperationException>(Value != null);
}
```

在这里，`Requires` 是真的会抛出异常的，但 `Assume` 和 `EnsuresOnThrow` 是需要写条件编译符为 `CONTRACTS_FULL` 的。

![前置条件失败](/static/posts/2018-01-04-14-26-42.png)

或者，这样用普通的抛异常的方式。如果使用普通方式抛出异常，需要遵循 `if-then-throw` 的模式，即有问题立刻就抛出异常。例如下面对 `null` 的判断就符合这样的模式。

```csharp
private T DoSomething<T>(T parent) where T : class
{
    // * 要开始此任务必须先满足某些条件（Requires，EndContractBlock）
    if (parent == null) throw new ArgumentNullException(nameof(parent));
    Contract.EndContractBlock();

    // 做一些操作。

    // * 此时认定一定满足某个条件（Assume）
    Contract.Assume(parent != null);

    // 继续执行一些操作。

    // * 操作执行完后一定满足某组条件（Ensures，EnsuresOnThrows）
    Contract.EnsuresOnThrow<InvalidOperationException>(Value != null);
}
```

当然也可以不止是这样简单的判断，也可以调用其他方法，但要求方法必须是 `[Pure]` 方法，即方法执行完之后，除了返回一个值之外，不改变应用程序的任何状态。

对此契约的静态分析微软有提供工具：[Microsoft/CodeContracts: Source code for the CodeContracts tools for .NET](https://github.com/Microsoft/CodeContracts)，ReSharper 对此也有一丁点儿的支持。

### Roslyn

Roslyn 相比于任何第三方契约的优势在于它甚至能在语法层面形成契约（[比如 C#8.0 中的可空引用类型](/post/nullable-reference-in-csharp)）。

## 实际应用

事实上在 GitHub 中，使用各种契约的都有，不过以 ReSharper Annotations 和 System.Diagnostics.Contracts 的居多；C#8.0 的可空引用类型等到 8.0 发布以后再看吧。

在实际应用中，并没有严格的说哪一个更好哪一个一般，两者都可以用，只要我们有分析和提示此契约的工具，就可以在项目中推行开来。

但是，**基于契约编写代码的模式却能帮助我们写出更加健壮的代码来**。也就是说，用哪个并不重要，重要的是——**用起来**！

---

**参考资料**

- [Code Contracts - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/debug-trace-profile/code-contracts?wt.mc_id=MVP)
- [.NET 4.0 中的契约式编程 - Angel Lucifer - 博客园](http://www.cnblogs.com/lucifer1982/archive/2009/03/21/1418642.html)
- [C# 中参数验证方式的演变 -.net-火龙果软件工程](http://www.uml.org.cn/net/201510303.asp)
- [Contract Annotations - Help - ReSharper](https://www.jetbrains.com/help/resharper/Contract_Annotations.html)


