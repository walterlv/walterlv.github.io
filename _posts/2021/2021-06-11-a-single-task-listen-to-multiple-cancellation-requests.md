---
title: ".NET 单个异步任务如何同时监听多个取消请求（CancellationToken）"
date: 2021-06-11 09:13:06 +0800
tags: dotnet
position: knowledge
permalink: /posts/a-single-task-listen-to-multiple-cancellation-requests.html
---

异步编程中，并不是所有时候 `await` 等的都是新的异步任务；有时候同一个异步任务可能被多次等待，并且每个等待都可以有自己的取消请求，即 `CancellationToken`。那么如何在一个异步任务中同时响应多个取消请求呢？

---

<div id="toc"></div>

## 可被多次 `await` 的单个任务

我们先来列举一个最简单的例子，用来作为多次取消请求的示例。

```csharp
class WalterlvDemoClass
{
    private readonly CancellationToken _currentCancellationToken = default;

    public async Task DoSomethingAsync(CancellationToken cancellationToken)
    {
        // 省略真正的异步代码。
    }
}
```

现在，`DoSomethingAsync` 可能被调用多次，但执行的都是同一件事情。当任务完成时所有 `await` 全部等待完成，当任务取消时所有 `await` 全部取消。

## 合并 `CancellationToken`

合并 `CancellationToken` 的方法是：

```csharp
var token = CancellationTokenSource.CreateLinkedTokenSource(token1, token2)
```

合并完成后的 `CancellationToken` 在两者任一个取消时都会被取消。

于是我们前面的 `DoSomethingAsync` 加一行即可：

```diff
    class WalterlvDemoClass
    {
        private readonly CancellationToken _currentCancellationToken = default;

        public async Task DoSomethingAsync(CancellationToken cancellationToken)
        {
++          _currentCancellationToken = CancellationTokenSource.CreateLinkedTokenSource(_currentCancellationToken, cancellationToken);
++
            // 省略真正的异步代码，需要判断取消请求时，判断 _currentCancellationToken。
        }
    }
```

---

**参考资料**

- [How to: Listen for Multiple Cancellation Requests - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/threading/how-to-listen-for-multiple-cancellation-requests)

