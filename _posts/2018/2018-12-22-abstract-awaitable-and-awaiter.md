---
title: "定义一组抽象的 Awaiter 的实现接口，你下次写自己的 await 可等待对象时将更加方便"
publishDate: 2018-12-22 19:52:44 +0800
date: 2018-12-23 15:17:04 +0800
tags: dotnet csharp
position: knowledge
coverImage: /static/posts/2018-12-22-14-05-42.png
---

我在几篇文章中都说到了在 .NET 中自己实现 Awaiter 情况。`async` / `await` 写异步代码用起来真的很爽，就像写同步一样。然而实现 Awaiter 没有现成的接口，它需要你按照编译器的要求为你的类型添加一些具有特定名称的属性和方法。然而没有接口的帮助，我们编写起来就很难获得工具（如 ReSharper）自动生成代码的支持。

本文将分享我提取的自己实现 Awaiter 的接口。你只需要实现这些接口当中的 2 个，就能正确实现一个 Awaitable 和 Awaiter。

---

<div id="toc"></div>

## 接口代码

你可以在 GitHub 上找到这段代码：<https://github.com/walterlv/sharing-demo/blob/master/src/Walterlv.Core/Threading/AwaiterInterfaces.cs>。

```csharp
public interface IAwaitable<out TAwaiter> where TAwaiter : IAwaiter
{
    TAwaiter GetAwaiter();
}

public interface IAwaitable<out TAwaiter, out TResult> where TAwaiter : IAwaiter<TResult>
{
    TAwaiter GetAwaiter();
}

public interface IAwaiter : INotifyCompletion
{
    bool IsCompleted { get; }

    void GetResult();
}

public interface ICriticalAwaiter : IAwaiter, ICriticalNotifyCompletion
{
}

public interface IAwaiter<out TResult> : INotifyCompletion
{
    bool IsCompleted { get; }

    TResult GetResult();
}

public interface ICriticalAwaiter<out TResult> : IAwaiter<TResult>, ICriticalNotifyCompletion
{
}
```

## 接口实现

在 ReSharper 工具的帮助下，你可以在继承接口之后快速编写出实现代码来：

![使用 ReSharper 快速实现 Awaiter](/static/posts/2018-12-22-14-05-42.png)  
▲ 使用 ReSharper 快速实现 Awaiter

![使用 ReSharper 快速实现 Awaitable](/static/posts/2018-12-22-14-09-23.png)  
▲ 使用 ReSharper 快速实现 Awaitable

于是我们可以迅速得到一对可以编译通过的 Awaitable 和 Awaiter：

```csharp
public sealed class Awaiter : IAwaiter<string>
{
    public void OnCompleted(Action continuation)
    {
        throw new NotImplementedException();
    }

    public bool IsCompleted { get; }

    public string GetResult()
    {
        throw new NotImplementedException();
    }
}

public sealed class Awaitable : IAwaitable<Awaiter, string>
{
    public Awaiter GetAwaiter()
    {
        throw new NotImplementedException();
    }
}
```

当然，你也可以在一个类里面实现这两个接口：

```csharp
public sealed class Awaiter : IAwaiter<string>, IAwaitable<Awaiter, string>
{
    public void OnCompleted(Action continuation)
    {
        throw new NotImplementedException();
    }

    public bool IsCompleted { get; }

    public string GetResult()
    {
        throw new NotImplementedException();
    }

    public Awaiter GetAwaiter()
    {
        return this;
    }
}
```

## 实现业务需求

我有另外两篇文章在实现真正可用的 Awaiter：

- [在 WPF/UWP 中实现一个可以用 await 异步等待 UI 交互操作的 Awaiter](/post/write-custom-awaiter)
- [.NET 除了用 Task 之外，如何自己写一个可以 await 的对象？](/post/understand-and-write-custom-awaiter)

## 更多 Awaiter 系列文章

入门篇：

- [.NET 中什么样的类是可使用 await 异步等待的？](/post/what-is-an-awaiter)
- [定义一组抽象的 Awaiter 的实现接口，你下次写自己的 await 可等待对象时将更加方便](/post/abstract-awaitable-and-awaiter)
- [.NET 除了用 Task 之外，如何自己写一个可以 await 的对象？](/post/understand-and-write-custom-awaiter)

实战篇：

- [在 WPF/UWP 中实现一个可以用 await 异步等待 UI 交互操作的 Awaiter](/post/write-dispatcher-awaiter-for-ui)
- [.NET 编写一个可以异步等待循环中任何一个部分的 Awaiter](/post/write-an-awaiter-that-await-part-of-a-loop)

