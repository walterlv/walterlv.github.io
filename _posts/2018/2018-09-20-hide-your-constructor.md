---
title: "只有你能 new 出来！.NET 隐藏构造函数的 n 种方法（Builder Pattern / 构造器模式）"
publishDate: 2018-09-20 20:53:37 +0800
date: 2018-11-27 13:08:55 +0800
tags: dotnet csharp
coverImage: /static/posts/2018-09-20-20-30-36.png
permalink: /post/hide-your-constructor.html
---

如果你给类写了一个公有构造函数，那么这个类就能被其他开发者 new 出来。如果你不想让他们 new 出来，把构造函数 `private` 就好了呀。

然而还有更多奇怪的方式来隐藏你类的构造方法。

---

<div id="tic"></div>

## 为什么要隐藏构造函数？

有些类型，只有组件的设计者才知道如何正确创建其类型的实例，多数开发者都无法正确将其创建出来。典型的如 `string`：绝大多数开发者都不能正确创建出 `string` 的实例，但通过写一个字符串由编译器去创建，或者使用 `StringBuilder` 来构造则不容易出错。

再或者，我们只希望开发者使用到某个抽象的实例，而不是具体的类型，那么这个时候开发者也需要有方法能够拿到抽象接口的实例。我们可能会使用工厂或者某些其他的方法让开发者在不知道具体类型的时候获取到抽象类型的实例。

这正是构造器模式的典型应用场景。在维基百科中对它适用性的描述为：

> 在以下情况使用生成器模式：
> 
> - 当创建复杂对象的算法应该独立于该对象的组成部分以及它们的装配方式时；
> - 当构造过程必须允许被构造的对象有不同的表示时。

详见：[生成器模式 - 维基百科，自由的百科全书](https://zh.wikipedia.org/wiki/%E7%94%9F%E6%88%90%E5%99%A8%E6%A8%A1%E5%BC%8F)

接下来，我们使用一些奇怪的方式来创建对象的实例，完完全全把构造函数隐藏起来。

## 隐式转换和显式转换

典型的像 `long a = 1;`，`bool? b = true` 这都是语法级别的隐式转换。这真的只是语法级别的隐式转换，实际上这两个都是编译器原生支持，编译时即已转换为真实的类型了。

```csharp
[System.Runtime.Versioning.NonVersionable]
public static implicit operator Nullable<T>(T value)
{
    return new Nullable<T>(value);
}

[System.Runtime.Versioning.NonVersionable]
public static explicit operator T(Nullable<T> value)
{
    return value.Value;
}
```

于是我们可以考虑写一个神奇的类，其创建是通过隐式转换来实现的：

```csharp
Fantastic fantastic = "walterlv";
Console.WriteLine(fantastic);
```

以上代码的输出是 `walterlv is fantastic`。

```csharp
namespace Walterlv.Demo.Patterns
{
    public class Fantastic
    {
        private readonly string _value;
        private Fantastic(string value) => _value = value;
        public static implicit operator Fantastic(string value) => new Fantastic(value);
        public override string ToString() => $"{_value ?? "null"} is fantastic.";
    }
}
```

而使用显式转换，我们还可以写出更奇怪的代码来。比如下面这个，我们的实例是通过强制转换一个 `null` 来实现的：

```csharp
Fantastic fantastic = (IFantastic) null;
Console.WriteLine(fantastic);
```

以上代码的输出是 ` is fantastic` 字符串。呃……前面有个空格。

```csharp
namespace Walterlv.Demo.Patterns
{
    public class Fantastic
    {
        private readonly IFantastic _value;
        private Fantastic(IFantastic value) => _value = value;
        public static implicit operator Fantastic(IFantastic value) => new Fantastic(value);
        public override string ToString() => $"{_value} is fantastic.";
    }

    public class IFantastic
    {
    }
}
```

那个 `IFantastic` 必须得是一个类，而不能是接口，因为隐式转换不能从接口转，也不能转到接口。

![不能定义从接口进行的隐式转换](/static/posts/2018-09-20-20-30-36.png)  
▲ 不能定义从接口进行的隐式转换

## 运算符重载

使用运算符重载，也可以让类型实例的构造隐藏起来。比如下面的 `Scope` 类型，从字符串创建，然后通过与不同的字符串进行位或运算来得到其他的 `Scope` 的实例。

```csharp
Scope scope = "A";
var full = scope | "B" | "C";
Console.WriteLine(full);
```

当然这段代码也少不了隐式转换的作用。

以上 `Scope` 类型的实现在 github 上开源，其表示 OAuth 2.0 中的 `Scope`。

[ERMail/Scope.cs](https://github.com/walterlv/ERMail/blob/master/src/ERMail.Core/OAuth/Scope.cs)

关于运算符重载的更多内容，可以参考我的另外两篇文章：

- [C# 中那些可以被重载的操作符，以及使用它们的那些丧心病狂的语法糖 - walterlv](/post/overridable-operators-in-csharp)
- [C# 空合并操作符（??）不可重载？其实有黑科技可以间接重载！ - walterlv](/post/overload-null-coalescing-operator-in-csharp)


