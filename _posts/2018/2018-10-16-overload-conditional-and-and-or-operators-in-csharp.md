---
title: "C# 重载条件逻辑运算符（&& 和 ||）"
publishDate: 2018-10-16 21:04:28 +0800
date: 2018-12-14 09:54:00 +0800
categories: csharp
---

在微软的官方文档中，规定 `&&` 和 `||` 运算符不可被重载，但允许通过重载 `&`、`|`、`true` 和 `false` 实现间接重载。

本文将介绍重载方法和原理。感谢 [Opportunity](https://disqus.com/by/OpportunityLiu/) 的指导。

---

<div id="toc"></div>

### 条件逻辑运算符是可以重载的

在微软的官方文档 [true Operator (C# Reference) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/true-operator?wt.mc_id=MVP) 中，解释了 `&&` 和 `||` 这两个条件逻辑运算符的重载方法：

> A type cannot directly overload the Caseal logical operators (`&&` and `||`), but an equivalent effect can be achieved by overloading the regular logical operators and operators `true` and `false`.
> 
> 类型不能直接重载条件逻辑运算符（`&&` 和 `||`），但通过重载常规逻辑运算符 `&`、`|` 及运算符 `true` 和 `false` 可以达到同样的效果。

也就是说，在官方的概念中，`&&` 和 `||` 是允许被重载的，只是不能直接重载。

原因在于，`&&` 和 `||` 是短路运算符（Circuit Operator），具有短路求值特性。具体来说，`A && B` 运算中，如果 `A` 是 `false`，那么 `B` 的值便不会计算；同样的，`A || B` 中，如果 `A` 是 `true`，那么 `B` 的值也不会计算。

于是，如果允许自定义 `&&` 和 `||` 运算符，那么必然会导致这个运算符重载的方法有两个参数传入，于是这两个参数一定会被计算值；这样就无法实现短路求值了。于是对于 `&&` 和 `||` 的重载采用的方案是重载 `&` 和 `|` 运算符，然后重载 `true` 和 `false` 运算符来指定短路求值。

### 试错实验

我们写一个类型进行实验：

```csharp
using System;

namespace Walterlv.Demo
{
    public class Case
    {
        public static bool operator &(Case a, Case b)
        {
            throw new NotImplementedException();
        }
    }
}
```

直接使用 `&` 是没有问题的，但如果使用 `&&` 就会提示错误。

```csharp
var a = new Case();
var b = new Case();
if (a && b)
{
}
```

> Error CS0217: In order to be applicable as a short circuit operator a user-defined logical operator ('Case.operator &(Case, Case)') must have the same return type and parameter types
> 
> Error CS0217: 为了可以像短路运算符一样应用，用户定义的逻辑运算符(“Case.operator &(Case, Case)”)的返回类型和参数类型必须相同
 
也就是说，本身重载 `&` 运算符的时候允许返回不同的类型；但如果希望 `&&` 运算符在此重载下也生效，就必须确保 `&` 的返回类型与参数中的类型相同。

```csharp
public static Case operator &(Case a, Case b)
{
    throw new NotImplementedException();
}
```

```csharp
var a = new Case();
var b = new Case();
var c = a && b;
```

改为相同的类型后，还会继续提示需要定义 `true` 和 `false` 运算符。

> Error CS0218: In order for 'Case.operator &(Case, Case)' to be applicable as a short circuit operator, its declaring type 'Case' must define operator true and operator false

### 重载 && 和 ||

以下代码中，`true` 表示字符串中包含大写字母，`false` 表示字符串中不包含大写字母（`null` 和没有大小写的区域也属于不包含大写字母）。`&` 运算符仅留下两者共有的字符；`|` 则取所有字符。

```csharp
public class Case
{
    private string _value;

    public Case(string value)
    {
        _value = value;
    }

    public static Case operator &(Case a, Case b)
    {
        if (a is null || b is null) return null;
        if (a._value is null || b._value is null) return new Case(null);
        return new Case(new string(b._value.Except(a._value.Except(b._value)).ToArray()));
    }

    public static Case operator |(Case a, Case b) => new Case(a._value + b._value);

    public static bool operator true(Case a)
        => a?._value != null && !a._value.ToLower(CultureInfo.CurrentCulture).Equals(a._value);

    public static bool operator false(Case a)
        => a?._value == null || a._value.ToLower(CultureInfo.CurrentCulture).Equals(a._value);
        
    public override string ToString() => _value;
}
```

### 测试重载了条件逻辑运算符的类型

我们测试以上代码所用的代码如下：

```csharp
var a = new Case("A");
var b = new Case("b");
Console.WriteLine(a);
Console.WriteLine(b);
Console.WriteLine(a ? "a 是 truthy" : "a 是 falsy");
Console.WriteLine(b ? "b 是 truthy" : "b 是 falsy");
Console.WriteLine(a & b);
Console.WriteLine(a | b);
Console.WriteLine(a && b);
Console.WriteLine(a || b);
```

以上各个 `Console.WriteLine` 的输出为：

```
[1] A
[2] b
[3] a 是 truthy
[4] b 是 falsy
[5] 
[6] Ab
[7] 
[8] A
```

注意，空行其实指的是输出 `null`。

### truthy 和 falsy

刚刚的测试代码中，我们使用了 truthy 和 falsy 概念，而这是逻辑判断概念：

- 如果在逻辑判断中，对象与 `true` 等价，但其数值上并非 `true`（不等于 `true`），那么称此对象为 truthy；
- 如果在逻辑判断中，对象与 `false` 等价，但其数值上并非 `false`（不等于 `false`），那么称此对象为 falsy。

### 对以上测试输出的解释

第 5 行由于 `a` 和 `b` 没有共有字符，所以得到 `null`。

第 7 行的执行过程是这样的：

1. 对 `a` 求值，即 `a` 本身；
1. 对 `a` 进行 truthy / falsy 逻辑判断，得到 truthy；
1. 由于 `a` 为 truthy，对于 `&&` 运算符而言，可以对 b 求值，于是对 `b` 求值得到 `b` 本身；
1. 对 `a` 和 `b` 进行 `&` 运算，得到 ` `，也就是 `null`。

第 8 行的执行过程是这样的：

1. 对 `a` 求值，即 `a` 本身；
1. 对 `a` 进行 truthy / falsy 逻辑判断，得到 truthy；
1. 由于 `a` 为 truthy，对于 `||` 运算符而言，已无需对 `b` 求值，最终得到的结果为 `a`，也就是 `A`。

---

#### 参考资料

- [C# 中那些可以被重载的操作符 - walterlv - 请阅读文章末尾的评论](/post/overridable-operators-in-csharp.html#comment-4147325525)
- [true Operator (C# Reference) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/true-operator?wt.mc_id=MVP)
- [JavaScript: Truthy? Falsy? - 格物致知](https://amobiz.github.io/2015/09/28/javascript-truthy-falsy/)
