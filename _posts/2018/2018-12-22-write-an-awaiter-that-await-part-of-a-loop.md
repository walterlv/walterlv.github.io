---
title: ".NET 编写一个可以异步等待循环中任何一个部分的 Awaiter"
date: 2018-12-22 19:50:54 +0800
categories: dotnet csharp
position: problem
---

[林德熙](https://blog.lindexi.com/) 小伙伴希望保存一个文件，并且希望如果出错了也要不断地重试。然而我认为如果一直错误则应该对外抛出异常让调用者知道为什么会一直错误。

这似乎是一个矛盾的要求。然而最终我想到了一个办法：让重试一直进行下去，谁需要关心异常谁就去 `catch` 异常，不需要关心异常的模块则跟着一直重试直到成功。

我们通过编写一个自己的 Awaiter 来实现，本文将说明其思路和最终实现的代码。

---

<div id="toc"></div>

## Awaiter 系列文章

入门篇：

- [.NET 中什么样的类是可使用 await 异步等待的？](/post/what-is-an-awaiter.html)
- [定义一组抽象的 Awaiter 的实现接口，你下次写自己的 await 可等待对象时将更加方便](/post/abstract-awaitable-and-awaiter.html)
- [.NET 除了用 Task 之外，如何自己写一个可以 await 的对象？](/post/understand-and-write-custom-awaiter.html)

实战篇：

- [在 WPF/UWP 中实现一个可以用 await 异步等待 UI 交互操作的 Awaiter](/post/write-dispatcher-awaiter-for-ui.html)
- [.NET 编写一个可以异步等待循环中任何一个部分的 Awaiter](/post/write-an-awaiter-that-await-part-of-a-loop.html)

## 遇到了什么问题

有一个任务，可能会出错，然而重试有可能可以解决。典型的例子是写入文件，你可能因为其他进程占用的问题而导致无法写入，然而一段时间之后重试是可以解决的。

现在，不同业务对这同一个操作有不同的需求：

- 有的业务不关心写入结果到底如何
- 有的业务由于时间有限，只能接受几次的重试
- 有的业务关心写入过程中的异常
- 而有的业务非常闲，只要一直写入就行了，最终成功告诉我就好

![不同业务有不同的重试需求](/static/posts/2018-12-22-16-03-05.png)

可是，我们如何在一个任务中同时对所有不同的业务需求进行不同种类的响应呢？

## 思路

我的思路是：

1. 当有业务发起请求之后，就开启一个不断重试的任务；
1. 针对这个请求的业务，返回一个专为此业务定制的可等待对象；
1. 如果在重试完成之前，还有新的业务请求发起，那么则返回一个专为此新业务定制的可等待对象；
1. 一旦重试任务成功完成，那么所有的可等待对象强制返回成功；
1. 而如果重试中有的可等待对象已经等待结束但任务依旧没有成功，则在可等待对象中引发任务重试过程中发生过的异常。

这样，任务不断重试。而且，无论多少个业务请求到来，都只是加入到循环中的一部分来，不会开启新的循环任务。每个业务的等待时长和异常处理都是自己的可等待对象中处理的，不影响循环任务的继续执行。

## 关于源代码说明

本文所述的所有源代码可以在 <https://gist.github.com/walterlv/d2aecd02dfad74279713112d44bcd358> 查看和下载到最新版本。

### 期望如何使用这个新的 Awaiter

```csharp
public class WalterlvDemo
{
    // 记录一个可以重试的循环。
    private readonly PartialAwaitableRetry _loop;

    public WalterlvDemo()
    {
        // 初始化一个可以重试的循环，循环内部执行的方法是 TryCoreAsync。
        _loop = new PartialAwaitableRetry(TryCoreAsync);
    }

    // 如果外界期望使用这个类试一下，那么就调用此方法。默认尝试 10 次，但也可以指定为 -1 尝试无数次。
    public ContinuousPartOperation TryAsync(int tryCount = 10)
    {
        // 加入循环中，然后返回一个可以异步等待 10 次循环的对象。
        return _loop.JoinAsync(tryCount);
    }

    // 此方法就是循环的内部执行的方法。
    private async Task<OperationResult> TryCoreAsync(PartialRetryContext context)
    {
        // 每 1 秒执行一次循环重试，当然你也可以尝试指数退避。
        await Task.Delay(1000).ConfigureAwait(false);

        // 执行真正需要重试而且可能出现异常的方法。
        await DoSomethingIOAsync().ConfigureAwait(false);

        // 如果执行成功，那么就返回 true。当然，上面的代码如果出现了异常，也是可以被捕获到的。
        return true;
    }

    // 这就是那个有可能会出错，然后出错了需要不断重试的方法。
    private async Task DoSomethingIOAsync()
    {
        // 省略实际执行的代码。
    }
}
```

### 写一个可以不断循环的循环，并允许不同业务加入等待

上面的代码中，我们使用到了两个新的类型：用于循环执行某个委托的 `PartialAwaitableRetry`，以及用于表示单次执行结果的 `OperationResult`。

以下只贴出此代码的关键部分，全部源码请至本文末尾查看或下载。

```csharp
public class PartialAwaitableRetry
{
    // 省略构造函数和部分字段，请至本文文末查看完整代码。
    private readonly List<CountLimitOperationToken> _tokens = new List<CountLimitOperationToken>();

    public ContinuousPartOperation JoinAsync(int countLimit)
    {
        var token = new CountLimitOperationToken(countLimit);

        // 省略线程安全代码，请至本文文末查看完整代码。
        _tokens.Add(token);
        if (!_isLooping)
        {
            Loop();
        }

        return token.Operation;
    }

    private async void Loop()
    {
        while(true)
        {
            await _loopItem.Invoke(context).ConfigureAwait(false);
            // 省略线程安全处理和异常处理，请至本文文末查看完整代码。
            foreach (var token in _tokens)
            {
                token.Pass(1);
            }
        }
    }
}
```

维护一个 `CountLimitOperationToken` 的集合，然后在每次循环的时候更新集合中的所有项。这样，通过 `JsonAsync` 创建的每一个可等待对象就能更新其状态 —— 将异常传入或者将执行的次数传入。

由于我们在创建可等待对象 `CountLimitOperationToken` 的时候，传入了等待循环的次数，所以我么可以在 `CountLimitOperationToken` 内部实现每次更新循环执行次数和异常的时候，更新其等待状态。如果次数已到，那么就通知异步等待完成。

关于 `OperationResult` 类，是个简单的运算符重载，用于表示单次循环中的成功与否的状态和异常情况。可以在本文文末查看其代码。

### 写一个可等待对象，针对不同业务返回不同的可等待对象实例

我写了三个不同的类来完成这个可等待对象：

- `CountLimitOperationToken`
    - 上面的代码中我们使用到了这个类型，目的是为了生成 `ContinuousPartOperation` 这个可等待对象。
    - 我将这个 Token 和实际的 Awaitable 分开，是为了隔离执行循环任务的代码和等待循环任务的代码，避免等待循环任务的代码可以修改等待的过程。
- `ContinuousPartOperation`
    - 这个是实际的可等待对象，这个类型的实例可以直接使用 `await` 关键字进行异步等待，也可以使用 `Wait()` 方法进行同步等待。
    - 我把这个 Awaitable 和 Awaiter 分开，是为了隔离 `await` 关键字的 API 和编译器自动调用的方法。避免编译器的大量方法干扰使用者对这个类的使用。
- `ContinuousPartOperation.Awaiter`
    - 这是实际上编译器自动调用方法的一个类，有点类似于我们为了支持 `foreach` 而实现的 `IEnumerator`。（而集合应该继承 `IEnumerable`）

所以其实这三个类是在干同一件事情，都是为了实现一个可 `await` 异步等待的对象。

关于如何编写一个自己的 Awaiter，可以参考我的 Awaiter 入门篇章：

- [.NET 中什么样的类是可使用 await 异步等待的？](/post/what-is-an-awaiter.html)
- [定义一组抽象的 Awaiter 的实现接口，你下次写自己的 await 可等待对象时将更加方便](/post/abstract-awaitable-and-awaiter.html)
- [.NET 除了用 Task 之外，如何自己写一个可以 await 的对象？](/post/understand-and-write-custom-awaiter.html)

以及实战篇章：

- [在 WPF/UWP 中实现一个可以用 await 异步等待 UI 交互操作的 Awaiter](/post/write-dispatcher-awaiter-for-ui.html)
- [.NET 编写一个可以异步等待循环中任何一个部分的 Awaiter](/post/write-an-awaiter-that-await-part-of-a-loop.html)

这几个类的实际代码可以在文末查看和下载。

## 附全部源码

<script src="https://gist.github.com/walterlv/d2aecd02dfad74279713112d44bcd358.js"></script>
