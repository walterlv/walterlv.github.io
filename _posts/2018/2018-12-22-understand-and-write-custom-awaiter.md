---
title: ".NET 除了用 Task 之外，如何自己写一个可以 await 的对象？"
publishDate: 2018-12-22 19:53:10 +0800
date: 2018-12-23 15:17:09 +0800
tags: dotnet csharp
position: starter
coverImage: /static/posts/2018-12-22-13-40-55.png
---

.NET 中的 `async` / `await` 写异步代码用起来真的很爽，就像写同步一样。我们可以在各种各样的异步代码中看到 `Task` 返回值，这样大家便可以使用 `await` 等待这个方法。不过，有时需要写一些特别的异步方法，这时需要自己来实现一个可以异步等待的对象。

本文将讲述如何实现一个可等待对象，一个自定义的 Awaiter。

---

<div id="toc"></div>

## Awaiter 系列文章

入门篇：

- [.NET 中什么样的类是可使用 await 异步等待的？](/post/what-is-an-awaiter)
- [定义一组抽象的 Awaiter 的实现接口，你下次写自己的 await 可等待对象时将更加方便](/post/abstract-awaitable-and-awaiter)
- [.NET 除了用 Task 之外，如何自己写一个可以 await 的对象？](/post/understand-and-write-custom-awaiter)

实战篇：

- [在 WPF/UWP 中实现一个可以用 await 异步等待 UI 交互操作的 Awaiter](/post/write-dispatcher-awaiter-for-ui)
- [.NET 编写一个可以异步等待循环中任何一个部分的 Awaiter](/post/write-an-awaiter-that-await-part-of-a-loop)

## 可等待对象

我们希望大家在调用下面的 `CallWalterlvAsync` 方法的时候，可以使用 `await` 关键字来异步等待：

```csharp
await CallWalterlvAsync();
```

```csharp
public WalterlvOperation CallWalterlvAsync()
{
    // 返回一个 WalterlvOperation，以便外面调用方可以异步等待。
    return new WalterlvOperation();
}
```

所以我们需要实现一个 `WalterlvOperation`。

## 编写基本的 Awaiter 框架代码

先写一个空的类型，然后为它编写一个空的 `GetAwaiter` 方法，返回新的 `WalterlvAwaiter` 类型。

```csharp
/// <summary>
/// 委托 walterlv 来完成一项特殊的任务。
/// 通过在代码当中调用，可以让他在现实中为你做一些事情。
/// </summary>
public class WalterlvOperation
{
    public WalterlvAwaiter GetAwaiter()
    {
        return new WalterlvAwaiter();
    }
}
```

接着，我们编写 `WalterlvAwaiter` 类：

```csharp
public class WalterlvAwaiter : INotifyCompletion
{
    public bool IsCompleted { get; }
    public void GetResult() { }
    public void OnCompleted(Action continuation) { }
}
```

必须实现 `INotifyCompletion` 接口，此接口带来了 `OnCompleted` 方法。另外两个方法不是接口带来的，但是也是实现一个自定义的 `Awaiter` 必要的方法。

在你编写完以上两段代码之后，你的 `await` 就可以编译通过了。

额外说明一下，`GetResult` 方法是可以修改返回值的，只要返回值不是 `void`，那么 `await` 等待的地方将可以在 `await` 完成之后获得一个返回值。

```csharp
public class WalterlvAwaiter : INotifyCompletion
{
    public bool IsCompleted { get; }
    public string GetResult() { }
    public void OnCompleted(Action continuation) { }
}
```

```csharp
// 于是你可以拿到一个字符串类型的返回值。
string result = await CallWalterlvAsync("写博客");
```

## 实现基本的 Awaiter

以上代码只能编译通过，但实际上如果你跑起来，会发现 `await` 一旦进入，是不会再往下执行的。因为我们还没有实现 `WalterlvAwaiter` 类型。

最重要的，是需要调用 `OnCompleted` 方法传入的 `continuation` 委托。

```csharp
public void OnCompleted(Action continuation)
{
    continuation.Invoke();
}
```

像以上这么写之后，`await` 之后的代码便可以执行了。

如果你只是希望了解如何实现一个 Awaiter，那么写出以上的代码就足以。因为这才是最本质最核心的 Awaiter 的实现。

不过，以上代码的执行是立即执行，没有任何异步的效果。因为 `OnCompleted` 被调用的时候，我们立刻调用了 `continuation` 的执行。

## 实现异步的 Awaiter

要真正达到异步的效果，`OnCompleted` 执行的时候，我们不能立刻去调用参数传进来的委托，而只是将他记录下来，等到任务真正完成的时候再去调用。

以下的代码就不再是通用的代码了，你需要针对你的不同业务去设计如何异步完成一个任务，然后再通知到异步等待的代码继续执行。

例如，现在我们期望 walterlv 代理去写博客，于是我们为 `WalterlvOperation` 加一点功能，真正去做一些异步的事情。

`CallWalterlvAsync` 的实现现在真的开启了一个异步操作。

```csharp
public WalterlvOperation CallWalterlvAsync(string task)
{
    var operation = new WalterlvOperation(task);
    operation.Start();
    return operation;
}
```

然后为了实现我们自己添加的 `Start` 方法，我们在里面去做一些事情。里面第一句就离开了当前线程前往线程池中的其他线程去执行 `Console.WriteLine` 了。

```csharp
/// <summary>
/// 委托 walterlv 来完成一项特殊的任务。
/// 通过在代码当中调用，可以让他在现实中为你做一些事情。
/// </summary>
public class WalterlvOperation
{
    private readonly string _task;
    private readonly WalterlvAwaiter _awaiter;

    public WalterlvOperation(string task)
    {
        _task = task;
        _awaiter = new WalterlvAwaiter();
    }

    public async void Start()
    {
        await Task.Delay(100).ConfigureAwait(false);
        Console.WriteLine($"walterlv 已经收到任务：{_task}");
        Console.WriteLine($"开始执行");
        await Task.Delay(2000).ConfigureAwait(false);
        Console.WriteLine($"walterlv 已经完成 {_task}。");
        _awaiter.ReportCompleted();
    }

    /// <summary>
    /// 返回一个可等待对象，以便能够使用 await 关键字进行异步等待。
    /// </summary>
    public WalterlvAwaiter GetAwaiter()
    {
        return _awaiter;
    }
}
```

于是现在可以通过下面的代码来要求 walterlv 去写博客了。

```csharp
await CallWalterlvAsync("写博客");
```

然而实际上，我们上面还留了一个 `_awaiter.ReportCompleted` 方法没有实现。由于我们的操作全部是异步的了，这个方法的实现就是为了通知所有正在使用 `await` 等待的代码，异步任务完成了，可以继续往后面执行了。

```csharp
public class WalterlvAwaiter : INotifyCompletion
{
    private Action _continuation;
    public bool IsCompleted { get; private set; }

    public void GetResult()
    {
        // 这个函数我们暂时还没有真正实现，因为需要进行同步等待比较复杂。
        // 我们将在本文后面附的其他博客中实现。
    }

    public void OnCompleted(Action continuation)
    {
        // 当这个 Awaiter 被 await 等待的时候，此代码会被调用。
        // 每有一处 await 执行到，这里就会执行一次，所以在任务完成之前我们需要 +=。
        if (IsCompleted) 
        {
            continuation?.Invoke();
        }
        else
        {
            _continuation += continuation;
        }
    }

    public void ReportCompleted()
    {
        // 由 WalterlvOperation 来通知这个任务已经完成。
        IsCompleted = true;
        var continuation = _continuation;
        _continuation = null;
        continuation?.Invoke();
    }
}
```

现在运行程序，会按照异步任务来执行，可以异步等待：

```csharp
static async Task Main(string[] args)
{
    await CallWalterlvAsync("写博客");
    Console.Read();
}
```

![程序运行结果](/static/posts/2018-12-22-13-40-55.png)

