---
title: ".NET/C# 判断某个类是否是泛型类型或泛型接口的子类型"
date: 2018-09-01 16:28:05 +0800
tags: dotnet csharp
permalink: /post/is-subclass-of-raw-generic-or-implemented-raw-generic.html
---

.NET 中提供了很多判断某个类型或实例是某个类的子类或某个接口的实现类的方法，然而这事情一旦牵扯到泛型就没那么省心了。

本文将提供判断泛型接口实现或泛型类型子类的方法。

---

<div id="toc"></div>

## .NET 中没有自带的方法

对于实例，.NET 中提供了这些方法来判断：

```csharp
if (instance is Foo || instance is IFoo)
{
}
```

对于类型，.NET 中提供了这些方法来判断：

```csharp
if (typeof(Foo).IsAssignableFrom(type) || typeof(IFoo).IsAssignableFrom(type))
{
}
```

或者，如果不用判断接口，只判断类型的话：

```csharp
if (type.IsSubClassOf(typeof(Foo)))
{
}
```

对于 `typeof` 关键字，不止可以写 `typeof(Foo)`，还可以写 `typeof(Foo<>)`。这可以得到泛型版本的 `Foo<T>` 的类型。

不过，如果你试图拿这个泛型版本的 `typeof(Foo<>)` 执行上述所有判断，你会发现所有的 `if` 条件都会是 `false`。

## 我们需要自己编写方法

`typeof(Foo<>)` 和 `typeof(Foo<SomeClass>)` 之间的关系就是 `GetGenericTypeDefinition` 函数带来的关系。

所以我们可以充分利用这一点完成泛型类型的判断。

比如，我们要判断接口：

```csharp
public static bool HasImplementedRawGeneric(this Type type, Type generic)
{
    // 遍历类型实现的所有接口，判断是否存在某个接口是泛型，且是参数中指定的原始泛型的实例。
    return type.GetInterfaces().Any(x => generic == (x.IsGenericType ? x.GetGenericTypeDefinition() : x));
}
```

而如果需要判断类型，那么就需要遍历此类的基类了：

```csharp
public static bool IsSubClassOfRawGeneric([NotNull] this Type type, [NotNull] Type generic)
{
    if (type == null) throw new ArgumentNullException(nameof(type));
    if (generic == null) throw new ArgumentNullException(nameof(generic));

    while (type != null && type != typeof(object))
    {
        isTheRawGenericType = IsTheRawGenericType(type);
        if (isTheRawGenericType) return true;
        type = type.BaseType;
    }

    return false;

    bool IsTheRawGenericType(Type test)
        => generic == (test.IsGenericType ? test.GetGenericTypeDefinition() : test);
}
```

于是，我们可以把这两个方法合成一个，用于实现类似 `IsAssignableFrom` 的效果，不过这回将支持原始接口（也就是 `typeof(Foo<>)`）。

```csharp
/// <summary>
/// 判断指定的类型 <paramref name="type"/> 是否是指定泛型类型的子类型，或实现了指定泛型接口。
/// </summary>
/// <param name="type">需要测试的类型。</param>
/// <param name="generic">泛型接口类型，传入 typeof(IXxx&lt;&gt;)</param>
/// <returns>如果是泛型接口的子类型，则返回 true，否则返回 false。</returns>
public static bool HasImplementedRawGeneric([NotNull] this Type type, [NotNull] Type generic)
{
    if (type == null) throw new ArgumentNullException(nameof(type));
    if (generic == null) throw new ArgumentNullException(nameof(generic));

    // 测试接口。
    var isTheRawGenericType = type.GetInterfaces().Any(IsTheRawGenericType);
    if (isTheRawGenericType) return true;

    // 测试类型。
    while (type != null && type != typeof(object))
    {
        isTheRawGenericType = IsTheRawGenericType(type);
        if (isTheRawGenericType) return true;
        type = type.BaseType;
    }

    // 没有找到任何匹配的接口或类型。
    return false;

    // 测试某个类型是否是指定的原始接口。
    bool IsTheRawGenericType(Type test)
        => generic == (test.IsGenericType ? test.GetGenericTypeDefinition() : test);
}
```

