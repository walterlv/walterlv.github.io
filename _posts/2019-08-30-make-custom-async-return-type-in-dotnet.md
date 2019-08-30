---
title: "C# 实现自己的异步方法返回值类型（AsyncMethodBuilder）"
date: 2019-08-30 14:25:50 +0800
categories: csharp dotnet
position: knowledge
published: false
---

我们习惯了在异步方法中返回 `Task`、`Task<T>` 或者仅仅是 `void`。如果你使用 C# 7.0 即以上，并且安装了 [System.Threading.Tasks.Extensions](https://www.nuget.org/packages/System.Threading.Tasks.Extensions/) 的 NuGet 包，会发现也可以使用 `ValueTask`、`ValueTask<T>` 还有 `IAsyncEnumerable<T>` 和 `IAsyncEnumerator<T>`。

那么，我们能否自己实现一个可以作为异步方法返回值的类型呢？答案是可以的，那么请阅读本文。

---

<div id="toc"></div>

## 异步方法返回值

在阅读本文之前，我需要确认你想阅读的和我希望讲的是同样的知识。

```csharp
public async Task<T> Foo<T>()
{
    await Task.Delay(1000);
    return $"walterlv is presenting {typeof(T).Name}.";
}
```

对于这段代码，我们注意到返回值是 `Task<T>`。你还可以写成本文一开始提到的各种类型，但你不能写成随便一个类型：

```csharp
public async WalterlvAsyncOperation<T> Foo<T>()
{
    await Task.Delay(1000);
    return $"walterlv is presenting {typeof(T).Name}.";
}
```

---

**参考资料**

- [Async Return Types (C#) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/async/async-return-types)
- [Extending the async methods in C# - Premier Developer](https://devblogs.microsoft.com/premier-developer/extending-the-async-methods-in-c/)
