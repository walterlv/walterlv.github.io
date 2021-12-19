---
title: "NullReferenceException，就不应该存在！"
publishDate: 2017-11-30 00:08:27 +0800
date: 2019-04-16 10:47:57 +0800
tags: csharp dotnet
permalink: /posts/wipe-out-null-reference-exception.html
---

如果要你说出 .NET 中的三个异常，`NullReferenceException` 一定会成为其中一个；如果说出 .NET 中的一个异常，`NullReferenceException` 也会被大多数人说出来。它让这么多人印象深刻，是因为它在项目中实在是太常见了，常见到每一个 C#/.NET 入门者必然会遇到。

然而，这个异常本不应该存在！

---

<p id="toc"></p>

## null

- [The worst mistake of computer science - Lucidchart](https://www.lucidchart.com/techblog/2015/08/31/the-worst-mistake-of-computer-science/)
- [计算机科学中的最严重错误，造成十亿美元损失 - 文章 - 伯乐在线](http://blog.jobbole.com/93667/)

## NullReferenceException 的可恨之处

你说 `NullReferenceException` 可以告诉你程序中某个字段为 null，告诉你程序发生了 BUG。

可是这是真的吗？说真的一定是因为用 Visual Studio 调试了，Visual Studio 告诉了我们异常发生在哪一句，哪个字段为 null。然而从真实用户或其他日志那里收集回来的数据是没有也不可能有这些信息的。这是因为 **`NullReferenceException` 异常除了调用栈（StackTrace）之外不能提供其他额外的异常信息**，连变量或字段名都不能提供。于是，当从异常日志准备分析异常原因的时候，只能猜，猜到底为 `null` 的是谁！

另外，**`NullReferenceException` 异常发生的地方一定不是真正出错的地方**！因为我们尝试去调用某个属性或方法时假设了它不为 `null`，这意味着它为 `null` 就是个错误。但是，从异常的调用栈中我们却找不到任何痕迹能够告诉我们是哪里给它设置成了 `null`（或者是从未赋值过）。现在，又只能猜，猜到底是什么时候通过什么方式将字段设为了 `null`！

举个例子：

```csharp
public class Walterlv
{
    private string _value;

    public void SetValue(string value)
    {
        _value = value;
    }

    public void DoSomething()
    {
        Console.WriteLine(_value.Length);
    }
}
```

`SetValue` 可以在任何时候被任何方法调用，指不定某个时候 `_value` 就被设为 `null` 了。那么 `DoSomething` 被调用的时候，直接就会抛出 `NullReferenceException`。这个方法比较简单，我们猜 `_value` 为 `null` 基本不会有问题了，方法复杂一点儿就难猜了。然而真正让 `_value` 为 `null` 的罪魁祸首就找不到了，因为它发生在 `SetValue` 中。

总结起来，可恨之处有亮点：

1. 不能知道为 `null` 的是哪个变量、字段或属性；
1. 不能知道为什么为 `null`。

而这两点直接与异常机制相悖。异常就是要提供足够我们诊断错误的信息，让我们在开发中避免发生这样的错误。

## NullReferenceException 的替代方案

既然 `NullReferenceException` 没能给我们提供足够的信息，那么我们就自己来提供这些信息。

`ArgumentNullException` 就是一个不错的替代异常，说它好因为有两点：

1. 在错误发生的最开始就报告了错误，避免错误的蔓延。  
  因为 `SetValue` 中发生了异常后，获取到的调用栈是导致 `_value` 为 `null` 的调用栈。
1. 告知了为 `null` 的参数名称。

靠以上两点，当发生异常时，我们能唯一确定 `_value` 为 `null` 的原因，而这才是本质错误。

可是，如果并不是参数问题导致了 `null`，那我们还能用什么异常呢？`InvalidOperationException` 是个不错的方案，它的默认异常提示语是“*对象当前的状态使得该操作无效*”。当程序此时此刻的状态让我们获取不到某个数据致使数据为 `null` 时，可以写一个新的提示语告知此时到底是什么样的状态错误才使得获取到的数据为 `null`。当然，这比 `ArgumentNullException` 的信息准确性还是差了点儿。

当然，还有一个替代方案，就是在 `Console.WriteLine(_value.Length);` 之前先对 `_value` 进行 `null` 判断。可是，你能说出 `_value` 为 `null` 代表什么意义吗？为什么为 `null` 时不应该输出？如果这个问题回答不上来，那么你的这个 `null` 判断为你的程序埋藏了一个更深的 BUG——**当用户反馈软件行为不正常时，你甚至连异常信息都没收集到**！硕大一个程序，你**甚至都无法定位到底是哪个模块发生了错误**！！！

## 对待 null，建议的约定

当了解了 `NullReferenceException` 的缺陷，再了解了其替代方案后，其实我们会发现一个问题：

- 其实**多数时候根本就不应该存在 `null`**

`null` 带来了两个困惑：

1. 意义不明确。相比于异常，`null` 并不能告知我们到底发生了什么。
1. 使用方不知道究竟应不应该判空，也难以理清楚判空究竟意味着什么。

所以，为了解决这些困惑，我建议在开发中以如下方式对待我们的 `null`：

1. **对任何可被外部模块调用的方法的参数进行 `null` 判断，并在参数为 `null` 时抛出 `ArgumentNullException`。**
1. **不要在方法中返回 `null`。如果你无法根据现有状态完成方法承诺的任务，请抛出具体的异常并给出真实的原因。**
1. **如果确实要用 `null` 在程序中代表某种状态，请确定这能够代表某种唯一确定的状态，并强制要求使用方判空。**

其中，对于第 2 点，不用担心异常导致雪崩，因为 `try-catch-finally` 就是用来恢复错误防止雪崩的，在需要防止雪崩的地方恢复错误即可。但要注意异常依然需要报告，可由程序统一处理这些未经处理的异常。

对于第 3 点，`JetBrains` 为我们提供了 `JetBrains.Annotations`，这是一组 100+ 个的 `Attribute`，以 NuGet 包的形式提供。强烈建议在 `null` 代表了某种特殊意义的地方标记 `[CanBeNull]`；这样，ReSharper 插件将提醒我们这些地方必须要进行判空。C# 8.0 极有可能为我们带来“可空引用类型”或者“非空引用类型”；如果真的带来了，这将比 `JetBrains.Annotations` 拥有更大的强制性，帮助我们避免出现意外的 `null` 引用，帮助我们在可能为 `null` 的地方强制判空。再次重申：**我们使用 `null` 一定是因为它代表了某种确定的特殊含义，而不是代表了一堆不明所以的错误！**

