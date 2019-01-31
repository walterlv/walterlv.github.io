---
title: "int? 竟然真的可以是 null！.NET/C# 确定可空值类型 Nullable<T> 实例的真实类型"
publishDate: 2019-01-06 20:41:50 +0800
date: 2019-01-08 18:01:14 +0800
categories: csharp dotnet
position: knowledge
---

使用 `Nullable<T>` 我们可以为原本不可能为 `null` 的值类型像引用类型那样提供一个 `null` 值。不过注意：`Nullable<T>` 本身也是个 `struct`，是个值类型哦。这意味着你随时可以调用 `.HasValue` 这样的方法，而不用担心会出现 `NullReferenceException`。

等等！除了本文提到的一些情况。

---

<div id="toc"></div>

### Nullable<T> 中的 null

注意看以下的代码。我们创建了一个值为 `null` 的 `int?`，然后依次输出 `value` 的值、`value.GetType()`。

你觉得可以得到什么结果呢？

```csharp
public class Program
{
    public static void Main(string[] args)
    {
        int? value = GetValue(null);

        Console.WriteLine($"value = {value}");
        Console.WriteLine($"type  = {value.GetType()}");
        Console.WriteLine($"TYPE  = {typeof(int?)}");

        Console.ReadLine();
    }

    private static int? GetValue(int? source) => source;
}
```

<br>

结果是……

<br>

果是……

<br>

是……

<br>

……

<br>

…

<br>

崩掉了……

![NullReferenceException](/static/posts/2019-01-06-19-32-19.png)

那么我们在 `value` 后面加个空传递运算符：

```diff
--  Console.WriteLine($"type  = {value.GetType()}");
++  Console.WriteLine($"type  = {value?.GetType()}");
```

现在再次运行，我们确认了 `value?.GetType()` 的值为 `null`；而 `typeof(int?)` 的类型为 `Nullable<Int32>`。

![null 的类型](/static/posts/2019-01-06-19-36-36.png)

然而，我们现在将 `value` 的值从 `null` 改为 `1`：

```diff
--  int? value = GetValue(null);
++  int? value = GetValue(1);
```

竟然 `value.GetType()` 得到的类型是 `Int32`。

![1 的类型](/static/posts/2019-01-06-19-38-00.png)

于是我们可以得出结论：

1. 对于可空值类型，当为 `null` 时，`GetType()` 会出现空引用异常；
1. 对于可空值类型，当不为 `null` 时，`GetType()` 返回的是对应的基础类型，而不是可空值类型；
1. `typeof(int?)` 能够得到可空值类型。

### Object.GetType() 和 is 对 Nullable<T> 的作用

在 [docs.microsoft.com](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/nullable-types/how-to-identify-a-nullable-type) 中，有一段对此的描述：

> When you call the [Object.GetType](https://docs.microsoft.com/en-us/dotnet/api/system.object.gettype) method on an instance of a nullable type, the instance is [boxed](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/nullable-types/using-nullable-types#boxing-and-unboxing) to [Object](https://docs.microsoft.com/en-us/dotnet/api/system.object). As boxing of a non-null instance of a nullable type is equivalent to boxing of a value of the underlying type, [GetType](https://docs.microsoft.com/en-us/dotnet/api/system.object.gettype) returns a [Type](https://docs.microsoft.com/en-us/dotnet/api/system.type) object that represents the underlying type of a nullable type.

意思是说，当你对一个可空值类型 `Nullable<T>` 调用 `Object.GetType()` 方法的时候，这个实例会被装箱，会被隐式转换为一个 `object` 对象。然而对可空值类型的装箱与对值类型本身的装箱是同样的操作，所以调用 `GetType()` 的时候都是返回这个对象对应的实际基础类型。例如对一个 `int?` 进行装箱和对 `int` 装箱得到的 `object` 对象是一样的，于是 `GetType()` 实际上是不能区分这两种情况的。

那什么样的装箱会使得两个不同的类型被装箱为同一个了呢？

[另一篇文档](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/nullable-types/using-nullable-types)描述了 `Nullable<T>` 装箱的过程：

> - If HasValue returns false, the null reference is produced.
> - If HasValue returns true, a value of the underlying value type T is boxed, not the instance of Nullable<T>.

- 如果 `HasValue` 返回 `false`，那么就装箱一个 `null`
- 如果 `HasValue` 返回 `true`，那么就将 `Nullable<T>` 中的 `T` 进行装箱，而不是 `Nullable<T>` 的实例。

这才是为什么 `GetType()` 会得到以上结果的原因。

同样的，也不能使用 `is` 运算符来确定这个类型到底是不是可空值类型：

```csharp
Console.WriteLine($"value is int  = {value is int}");
Console.WriteLine($"value is int? = {value is int?}");
```

最终得到两者都是 `True`。

![用 is 确定类型](/static/posts/2019-01-06-20-14-28.png)

### 应该如何判断可空值类型的真实类型

使用 `Nullable.GetUnderlyingType(type)` 方法，能够得到一个可空值类型中的基础类型，也就是得到 `Nullable<T>` 中 `T` 的类型。如果得不到就返回 `null`。

所以使用以下方法可以判断 `type` 的真实类型。

```csharp
bool IsNullable(Type type) => Nullable.GetUnderlyingType(type) != null;
```

然而，这个 `type` 的实例怎么来呢？根据前面的示例代码，我们又不能调用 `GetType()` 方法。

实际上，这个 `type` 的实例就是拿不到，在运行时是不能确定的。我们只能在编译时确定，就像下面这样：

```csharp
bool IsOfNullableType<T>(T _) => Nullable.GetUnderlyingType(typeof(T)) != null;
```

如果你是运行时拿到的可空值类型的实例，那么实际上此方法也是无能为力的。

```csharp
public class Program
{
    public static void Main(string[] args)
    {
        Console.Title = "walterlv's demo";

        int? value = GetValue(1);
        object o = value;
        Console.WriteLine($"value is nullable? {IsOfNullableType(value)}");
        Console.WriteLine($"o     is nullable? {IsOfNullableType(o)}");

        Console.ReadLine();
    }

    private static int? GetValue(int? source) => source;

    static bool IsOfNullableType<T>(T _) => Nullable.GetUnderlyingType(typeof(T)) != null;
}
```

![运行时是拿不到的](/static/posts/2019-01-06-20-27-41.png)

---

#### 参考资料

- [c# - Nullable type is not a nullable type? - Stack Overflow](https://stackoverflow.com/q/785358/6233938)
- [How to: Identify a nullable type - C# Programming Guide - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/nullable-types/how-to-identify-a-nullable-type)
- [Using nullable types - C# Programming Guide - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/nullable-types/using-nullable-types)
