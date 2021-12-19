---
title: "好的框架需要好的 API 设计 —— API 设计的六个原则"
publishDate: 2018-06-30 17:23:45 +0800
date: 2019-08-05 12:20:04 +0800
tags: dotnet framework
version:
  current: 中文
versions:
  - 中文: #
  - English: /post/framework-api-design-en.html
coverImage: /static/posts/2018-06-30-15-46-00.png
permalink: /posts/framework-api-design.html
---

说到框架设计，打心底都会觉得很大很宽泛，而 API 设计是框架设计中的重要组成部分。相比于有很多大佬都认可的*面向对象的六大原则*、*23 种常见的设计模式*来说，API 设计确实缺少行业公认的原则或者说设计范式。

不过，没有公认不代表没有。无论是对外提供类库还是提供 url 形式的 API，为了使用者良好的使用体验，依然也是有可以借鉴和参考的经验的。

---

This post is written in **multiple languages**. Please select yours:

{% include post-version-selector.html %}

本文中的 API 设计原则在主要思想上出自 NetBeans 创始人 Jaroslav Tulach 所著的 *Practical API Design* 一书；但原书讲述的所有内容很零散，缺乏系统性。所以我们结合了一些开源项目的 API 升级方式对内容进行了整理，形成六个原则。

<div id="toc"></div>

## API 是什么？

如果要解释 API 这个英文缩写，那一定要说出它的英文原文来：Application Programming Interface，即应用编程接口。虽然[维基百科上有它的定义](https://zh.wikipedia.org/zh-hans/%E5%BA%94%E7%94%A8%E7%A8%8B%E5%BA%8F%E6%8E%A5%E5%8F%A3)，不过还是太复杂了。

在 .NET 中，我们认为 API 包括了所有公开的类、接口、属性、字段、方法，以及类库提供的配置文件（包括格式）、协议等。

## API 设计原则

即便没有学习过任何 API 设计，也没有阅读过设计或重构相关的书籍，只要你有一些编程经验，应该都能够或多或少地评估一组 API 设计得是好是坏。因为——我们都是 API 的使用者，用的 API 多了，也便能体会到各种不同 API 带给我们的不同体验。

我们团队的几个小伙伴开撕之后，写出了以下文辞：

> 我（吕毅）说：  
> 在 API 设计原则里面，无法写出错误代码是为上策，写错了会出现异常次之，仅靠文档约束为下策，连约束都没有只剩坑的需祭天。
>   
> 头像大人云：  
> 故上码伐编译，其次伐异常，其次伐文档，其下祭天。祭天之法，为不得已。

所以，在下面总结的 API 设计原则中，前面四个都是站在使用者的角度来考虑的。

### 可理解性

通常使用者希望使用到某个 API 的时候，为了正确使用这个 API，需要学习一些与这个 API 相关的新知识。而需要新学习的知识越多，我们认为“可理解性”就越低。

为了提升 API 的可理解性，我们在设计 API 的时候建议考虑这些因素：

1. 如果没有必要，不要引入新的概念
1. 防止误用
    - 最好能够避免使用者写出错误的代码（即让错误的代码编译不通过）
    - 如果上面那一条有些难度，则建议在运行时抛出异常（使用者便能够明白为什么自己写错了，改怎么更正）
    - 另外，最好让错误使用的代码变丑（例如非常冗长难以理解，例如 IDE 会显示下划线警告）
    - 不要试图在文档中警告使用者用错了，因为典型的程序员是不看文档的

关于防止误用的一个优秀案例，要属单元测试模拟 Moq 了；可以参考 [Moq 基础系列教程](https://huangtengxiao.gitee.io/post/Moq%E5%9F%BA%E7%A1%80-%E4%B8%80.html) 并上手编写，体验它对防止误用上做出的努力。

### 可见性

我们大多数人的开发工具是功能齐全，傻瓜也能使用的 IDE（集成开发环境），这其实是 IDE 可理解性较好的一个体现。

不过这里要说的是 IDE 的智能感知提示功能；就算没有 IDE，一些常见的代码编辑工具（Visual Studio Code、Sublime、Atom、Notepad++、Vim）也都带有只能感知提示功能。在智能感知提示的帮助下，我们能够在不查阅文档的情况之下了解到当前上下文相关的 API 说明及其简易的使用提示。

如果我们只通过智能感知提示便能够发现一个新 API 并正确使用它，便可以说这个 API 的可见性是好的。

典型的例子是实现或者调用某个函数过程：

1. 实现某个函数的时候，函数的参数类型本来并没有见过，但通过智能感知提示我们能够了解到这个新 API 并正确取到参数中我们期望得到的信息。
1. 调用某个函数的时候，我们需要传入本来并没有见过的参数类型，通过智能感知提示，我们能够知道如何构造或获取这些类型然后正确传进去。
1. 调用完某个函数后我们得到了返回值，我们本来并没有见过这个类型，但通过智能感知提示，我们能够学习到这个新的类型，并知道如何正确使用这个返回值。

如果画一个图来表示较高的可见性和较低的可见性，我想可以画成这样：

![可见性](/static/posts/2018-06-30-15-46-00.png)  
▲ 连接线表示可以通过函数的参数、返回值等得知的新 API

左侧的 API 没有什么规律，知道什么或者不知道什么全凭经验而定。右侧的 API 从入门 API 开始，可以发现可见性较高的其他相关 API；当更深入地使用后，可能可以发现更高级别（通常也更难正确使用）的 API。

当然，并不是说可见性越高越好，如果某些 API 是用来完成某些高级功能，或者这个 API 存在较大的性能开销等，为了避免初学者混淆或者误用，应该适当降低其可见性。

为了更好的可见性，简易在 API 设计的时候：

1. 对于多数常用功能，尽量少提供独立的类；
1. 对于高级功能，尽量与简单功能隔离。

### 一致性

当多个相似功能的 API 之间有相似的使用方法时，使用者只需要很少的迁移成本便可以轻松学会新 API 的正确用法。

比如 LINQ 带来了集合的便捷操作，其中的 `Select` 方法用于查找和转换集合每一项的信息。而 LINQ to XML 虽然不是在操作集合而是在操作 XML，但其也有 `Select` 等方法完成节点的查找和选择。于是，使用者可以通过智能感知提示大致了解到 `Select`/`SelectSingleNode` 的基本正确用法。这便是良好的一致性带来的快速入门体验。

### 简单性

可能有些 API 在经过修改满足了以上可理解性、可见性、一致性之后，极有可能导致一个类或者一组相关类包含了太多方法可用。于是，简单而正确的使用可能就隐藏在众多的 API 中。当然，从面向对象的原则中我们可以说这通常违反了“单一职责原则”。

简单的任务应该有简单的实现，这是 API 设计中简单性应该做到的。这意味着 API 在提供了灵活的功能之后，建议为常用的任务提供更简单的调用方式。

例如，`InkCanvas` 只需要添加下面这样的 XAML 便可完成书写功能：

```xml
<InkCanvas x:Name="inkCanvas" />
```

虽然可以进行更多的定制，但是这不是必须的，更多的定制是属于更高级的功能需求的：

> ```csharp
> // 以下源码来自 https://docs.microsoft.com/en-us/windows/uwp/design/input/pen-and-stylus-interactions
> 
>  // Set supported inking device types.
> inkCanvas.InkPresenter.InputDeviceTypes =
>     Windows.UI.Core.CoreInputDeviceTypes.Mouse |
>     Windows.UI.Core.CoreInputDeviceTypes.Pen;
> 
> // Set initial ink stroke attributes.
> InkDrawingAttributes drawingAttributes = new InkDrawingAttributes();
> drawingAttributes.Color = Windows.UI.Colors.Black;
> drawingAttributes.IgnorePressure = false;
> drawingAttributes.FitToCurve = true;
> inkCanvas.InkPresenter.UpdateDefaultDrawingAttributes(drawingAttributes);
> ```

### 可测性

API 内部本身需要被测试（单元测试、基准测试等）；然而，API 的使用者也应该具备可测性。

典型的反例，比如获取某个配置文件的配置信息的方法是静态方法 `Config.Get("SomeKey")`。那么使用这个 API 的开发者就很难写出能够被单元测试的方法，因为找不到有效的方案来模拟这样的静态方法。

### 兼容性

良好的 API 设计利于未来的版本升级——升级带来的用户兼容性成本较低，或者框架开发者的兼容性包袱较轻。

兼容性有三类：

- 二进制兼容：更新库后，无需重新编译项目，能够直接运行而不会崩溃。
- 源码兼容：更新库后，可以不用修改项目的源代码可编译通过。
- 功能兼容：更新库后，功能表现依旧和更新之前一样。

为了将来的兼容性考虑，设计 API 时建议考虑这些因素：

1. 不要提前公开 API
    - 如果你的某个 API 是为将来预留的，那么不要开放，因为你不清楚未来的设计需求是怎样的，提前公开的 API 在将来改变的可能性非常高）
1. 预留足够的扩展点
    - 没有良好扩展性的 API 通常会因为频繁的需求变更而导致 API 间接变化，这都是兼容性成本。如果在良好的设计下预留了足够的扩展点，那么这样的 API 能够应对未来一段时间内未知的需求变化，使得 API 变化在可控范围内。
    - 要预留扩展点就意味着通常应该使用接口或者抽象的概念来描述 API，建议用清晰定位的接口替代具体的类型。
1. 应该有明确的 API 迁移说明
    - 如果某个 API 过时了，也不建议删除它；应该标记为过时，并告诉使用者新的 API 是什么。当然如果这个 API 会导致出现不可接受的问题，也可以标记它无法通过编译。

## 框架设计

*Practical API Design* 一书认为框架和 API 是等同的。不过从实际行业上的描述来看，框架是更大层面的 API，可以理解为用于完整解决某类问题而开发的一整套 API。

框架的概念可以很大，也可以很小。[Avalonia](https://github.com/AvaloniaUI/Avalonia) 可以称为一个跨平台的 UI 框架，这是很大的框架；其中的 [ReactiveUI](https://github.com/reactiveui/ReactiveUI) 是一个 UI 响应框架（包含 MVVM）。更小的可以有一套多语言框架、一套依赖注入框架等。

实践以上总结的六个原则，我们也许能设计出更多优秀的框架。

---

**参考资料**

- *Practical API Design*, NetBeans 创始人 Jaroslav Tulach 著


