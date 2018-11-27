---
title: "C# 空合并操作符（??）不可重载？其实有黑科技可以间接重载！"
publishDate: 2018-09-15 14:59:10 +0800
date: 2018-11-27 13:08:55 +0800
categories: csharp
---

`??` 操作符叫做 null-coalescing operator，即 null 合并运算符。如果此运算符的左操作数不为 null，则此运算符将返回左操作数；否则返回右操作数。

在微软的官方 C# 文档中，此操作符被定义为不可重载。不过我们有方法可以间接实现这样的重载。

---

<div id="toc"></div>

### 运算符重载

你可以阅读 [C# 中那些可以被重载的操作符，以及使用它们的那些丧心病狂的语法糖](/post/overridable-operators-in-csharp.html) 了解 C# 中提供的所有可以重载的操作符。在此文中，`??` 被明确定义为不可重载。

你更可以在微软官方文档中找到这样的说法：

- [Overloadable operators (C# Programming Guide)](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/statements-expressions-operators/overloadable-operators)
- [可重载运算符（C# 编程指南）](https://docs.microsoft.com/zh-cn/dotnet/csharp/programming-guide/statements-expressions-operators/overloadable-operators)

> =, ., ?:, ??, ->, =>, f(x), as, checked, unchecked, default, delegate, is, new, sizeof, typeof  
> These operators cannot be overloaded.  
> 这些运算符无法进行重载。

### 编写 NullableString 的 ?? 重载

我们先写一个空壳子。连构造函数都是 `private` 的，这个类当然几乎不可用啦。

特别注意，我们的 `Walterlv.NullableString` 用的是 `struct` 类型，这样能与 `Nullable<T>` 的用法上接近。也就是说，我们可以确保其值实际上永不为 null。

```csharp
namespace Walterlv
{
    public struct NullableString
    {
        private readonly string _value;

        private NullableString(string value)
        {
            _value = value;
        }
    }
}
```

现在我们挑战一下官方说好了不能重载的 `??` 重载（作死）：

![试着重载 ??](/static/posts/2018-09-15-10-45-58.png)  
▲ 试着重载 ??

很明显，既不是可重载的一员运算符也不是可重载的二元运算符。

现在我们试试隐式转换：

```csharp
public static implicit operator NullableString(string value)
{
    return new NullableString(value);
}

public static implicit operator string(NullableString nullableString)
{
    return nullableString._value;
}
```

然而这样的写法实际上并无实际用途。

但是，我们可以在 `NullableString` 后面加上 `?`：

```csharp
public static implicit operator NullableString?(string value)
{
    return string.IsNullOrEmpty(value) ? (NullableString?) null : new NullableString(value);
}

public static implicit operator string(NullableString? nullableString)
{
    return nullableString?.ToString() ?? string.Empty;
}
```

也就是说，C# 竟然允许隐式转换的时候，参数和返回值都不是此类型。当然，实际上这只对 `Nullable<T>` 生效，如果你试图写别的类型，是不可以的。

为了方便，我们重写一下 `ToString()`，部分场景下可以代替隐式转换，少写一些代码。

```csharp
public override string ToString()
{
    return string.IsNullOrEmpty(_value) ? string.Empty : _value;
}
```

于是，我们的 `NullableString` 类型的完整代码如下：

```csharp
namespace Walterlv
{
    public readonly struct NullableString
    {
        private readonly string _value;

        private NullableString(string value)
        {
            _value = value;
        }

        public static implicit operator NullableString?(string value)
        {
            return string.IsNullOrEmpty(value) ? (NullableString?) null : new NullableString(value);
        }

        public static implicit operator string(NullableString? nullableString)
        {
            return nullableString?.ToString() ?? string.Empty;
        }

        public override string ToString()
        {
            return string.IsNullOrEmpty(_value) ? string.Empty : _value;
        }
    }
}
```

注释就你自己添加吧。

### 一些注意事项

这里有一些好玩的事情需要分享。比如我们写出如下代码：

```csharp
NullableString? value = "";
var value0 = value?.ToString();
var value1 = value.ToString();
```

你觉得 `value0` 和 `value1` 分别会得到什么呢？

<br/>
<br/>
<br/>
<br/>
<br/>

呃……

`value0` 得到 `null`，而 `value1` 得到 `""`。

另外，如果你将一开始的初始值设为 `null`，那又可以得到什么结果呢？

```csharp
NullableString? value = null;
var value0 = value?.ToString();
var value1 = value.ToString();
```

一样的，`value0` 得到 `null`，而 `value1` 得到 `""`。

另外，你可以从 `null` 强转出你需要的类：

```csharp
var value = (NullableString?) null;
```
