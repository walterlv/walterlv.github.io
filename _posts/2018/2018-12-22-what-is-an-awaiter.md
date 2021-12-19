---
title: ".NET 中什么样的类是可使用 await 异步等待的？"
publishDate: 2018-12-22 19:52:17 +0800
date: 2018-12-23 15:17:11 +0800
tags: dotnet
position: knowledge
---

我们已经知道 `Task` 是可等待的，但是去看看 `Task` 类的实现，几乎找不到哪个基类、接口或者方法属性能够告诉我们与 `await` 相关。

而本文将探索什么样的类是可使用 await 异步等待的？

---

[Dixin's Blog - Understanding C# async / await (2) The Awaitable-Awaiter Pattern](https://weblogs.asp.net/dixin/understanding-c-sharp-async-await-2-awaitable-awaiter-pattern) 一文解决了我们的疑惑。`async`/`await` 是给编译器用的，只要我们的类包含一个 `GetAwaiter` 方法，并返回合适的对象，我们就能让这个类的实例被 `await` 使用了。

既然需要一个 `GetAwaiter` 方法，那我们先随便写个方法探索一下：

```csharp
Test DoAsync()
{
    return new Test();
}
class Test
{
    void GetAwaiter()
    {
    }
}
```

尝试调用：

```csharp
await DoAsync();
```

编译器告诉我们：

> Test.GetAwaiter() 不可访问，因为它具有一定的保护级别。

原来 GetAwaiter 方法需要是可以被调用方访问到的才行。

于是我们将 `GetAwaiter` 前面的访问修饰符改成 `public`。现在提示变成了：

> await 要求类型 Test 包含适当的 GetAwaiter 方法。

考虑到一定要获取到某个对象才可能有用，于是我们返回一个 Test2 对象：

```csharp
public class Test
{
    public Test2 GetAwaiter()
    {
        return new Test2();
    }
}

public class Test2
{
}
```

这时编译器又告诉我们：

> Test2 未包含 IsCompleted 的定义。

加上 `public bool IsCompleted { get; }`，编译器又说：

> Test2 不实现 INotifyCompletion。

于是我们实现之，编译器又告诉我们：

> Test2 未包含 GetResult 的定义。

于是我们加上一个空的 `GetResult` 方法，现在编译器终于不报错了。

现在我们一开始的 `DoAsync` 和辅助类型变成了这样：

```csharp
// 注：此处为试验代码。
private Test DoAsync()
{
    return new Test();
}

public class Test
{
    public Test2 GetAwaiter()
    {
        return new Test2();
    }
}

public class Test2 : INotifyCompletion
{
    public bool IsCompleted { get; }
    public void GetResult() { }
    public void OnCompleted(Action continuation) { }
}
```

总结起来，要想使一个方法可被 `await` 等待，必须具备以下条件：

1. 这个方法返回一个类 A 的实例，这个类 A 必须满足后面的条件。
1. 此类 A 有一个可被访问到的 `GetAwaiter` 方法（扩展方法也行，这算是黑科技吗？），方法返回类 B 的实例，这个类 B 必须满足后面的条件；
1. 此类 B 实现 `INotifyCompletion` 接口，且拥有 `bool IsCompleted { get; }` 属性、`GetResult()` 方法、`void OnCompleted(Action continuation)` 方法。

更多编写自定义 Awaiter 的文章可以阅读：

入门篇：

- [.NET 中什么样的类是可使用 await 异步等待的？](/post/what-is-an-awaiter)
- [定义一组抽象的 Awaiter 的实现接口，你下次写自己的 await 可等待对象时将更加方便](/post/abstract-awaitable-and-awaiter)
- [.NET 除了用 Task 之外，如何自己写一个可以 await 的对象？](/post/understand-and-write-custom-awaiter)

实战篇：

- [在 WPF/UWP 中实现一个可以用 await 异步等待 UI 交互操作的 Awaiter](/post/write-dispatcher-awaiter-for-ui)
- [.NET 编写一个可以异步等待循环中任何一个部分的 Awaiter](/post/write-an-awaiter-that-await-part-of-a-loop)

---

**参考资料**

- [Dixin's Blog - Understanding C# async / await (2) The Awaitable-Awaiter Pattern](https://weblogs.asp.net/dixin/understanding-c-sharp-async-await-2-awaitable-awaiter-pattern)
