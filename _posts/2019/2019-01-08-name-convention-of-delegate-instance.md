---
title: "C# 中委托实例的命名规则"
date: 2019-01-08 17:09:07 +0800
tags: dotnet csharp
position: starter
---

我们知道一个类中的属性应该用名词或名词性短语，方法用动词或动宾短语；但是委托的实例却似乎有一些游离。因为在 .NET 中委托代表的是一个动作，既可以把它看作是名词，也可以看作是动词。在用法上，既可以像属性和变量一样被各种传递，也可以像一个方法一样被调用。

那么委托实例的命名，应该遵循属性和变量的命名，还是遵循方法的命名呢？

---

委托的实例可以当作属性或者变量使用：

```csharp
var action = () => Console.WriteLine("walterlv is a 逗比");
```

委托的实例也可以当作方法使用：

```csharp
var action = () => Console.WriteLine("walterlv is a 逗比");
action();
```

于是委托的命名方式迁就名词还是动词呢？

在微软的官方文档 [Naming Guidelines](https://docs.microsoft.com/en-us/dotnet/standard/design-guidelines/naming-guidelines) 中提到了 .NET 中约定的命名方式。对于委托的命名，实际上只在 [Names of Type Members](https://docs.microsoft.com/en-us/dotnet/standard/design-guidelines/names-of-type-members#names-of-events) 中提到了，不过提及的实际上是事件型的委托，而不是一般的委托实例。然后，微软其他地方的官方文档中也没有单独提及委托的命名方式。

为了弄清楚第一方代码的命名规则，我去 <https://source.dot.net/> 上找了一些使用了委托的代码，然后发现，对于 `Action` 和 `Func` 系列委托的命名，有以下这些（部分名称只保留了后缀进行合并）：

使用名词的：

- action
- function
- callback
- continuation
- method
- factory
- valueFactory
- creator
- valueGetter
- initializer
- _target
- attributeComputer
- argumentsPromise
- taskProvider

使用动词的：

- getSource

使用缩略词的：

- localInit

我把缩略词单独拿出来，是因为缩写了以下就看不出来这到底是缩自名词还是缩自动词。

基本上可以确定：

委托实例的命名是 —— 一个表示动作的**名词**！

---

**参考资料**

- [Source Browser](https://source.dot.net/)
