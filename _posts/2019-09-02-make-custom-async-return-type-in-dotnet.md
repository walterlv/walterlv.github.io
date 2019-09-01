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

那么，本文的内容，就是编写一个这样的 `WalterlvAsyncOperation<T>`，可以作为你编写的异步方法的返回值。

## 一个最简单的异步方法返回值类型

要实现我面前面说到的支持异步的返回值，我们的返回值类型需要具备这些特征：

1. 支持 `await` 异步等待；
1. 支持 `async` 构造异步方法。

要支持 `await` 异步等待比较简单，需要实现两个类型（或者你也可以合并成一个类型来实现），可以参见我的另外两篇博客：

- [.NET 中什么样的类是可使用 await 异步等待的？ - walterlv](/post/what-is-an-awaiter.html)
- [.NET 除了用 Task 之外，如何自己写一个可以 await 的对象？ - walterlv](/post/understand-and-write-custom-awaiter.html)

要支持 `async` 构造异步方法，则需要编写一个 `AsyncMethodBuilder`，这部分代码会更多一点，接下来我们会详细说明。

### 编写一个 Awaitable 和 Awaiter

下面，我写了一个最简单的可等待对象。这个对象几乎仅仅是为了输出每个方法的调用而已。如果要实现更复杂的可用的可等待对象，你需要阅读上文提到的那些博客。

```csharp
using System;
using System.Runtime.CompilerServices;

namespace Walterlv.Demo
{
    public class WalterlvAsyncOperation<T>
    {
        public WalterlvAsyncAwaiter<T> GetAwaiter()
        {
            Console.WriteLine("[IAwaitable] GetAwaiter");
            return new WalterlvAsyncAwaiter<T>();
        }
    }

    public class WalterlvAsyncAwaiter<T> : ICriticalNotifyCompletion
    {
        private bool _isCompleted;

        public bool IsCompleted
        {
            get
            {
                Console.WriteLine("[Awaiter] get_IsCompleted");
                return _isCompleted;
            }
            private set => _isCompleted = value;
        }

        public T GetResult()
        {
            Console.WriteLine("[Awaiter] GetResult");
            return default;
        }

        public void OnCompleted(Action continuation)
        {
            Console.WriteLine("[Awaiter] OnCompleted");
            IsCompleted = true;
            continuation();
        }

        public void UnsafeOnCompleted(Action continuation)
        {
            Console.WriteLine("[Awaiter] UnsafeOnCompleted");
            IsCompleted = true;
            continuation();
        }
    }
}
```

### 编写一个 AsyncMethodBuilder



```diff
    namespace Walterlv.Demo
    {
++      [AsyncMethodBuilder(typeof(WalterlvAsyncOperationMethodBuilder<>))]
        public class WalterlvAsyncOperation<T>
        {
```

```csharp
using System;
using System.Runtime.CompilerServices;
using System.Threading.Tasks;

namespace Walterlv.Demo
{
    public class WalterlvAsyncOperationMethodBuilder<TResult>
    {
        private readonly TaskCompletionSource<TResult> _taskCompletionSource = new TaskCompletionSource<TResult>();

        public static WalterlvAsyncOperationMethodBuilder<TResult> Create()
        {
            Console.WriteLine("[AsyncMethodBuilder] Create");
            return new WalterlvAsyncOperationMethodBuilder<TResult>();
        }

        public void Start<TStateMachine>(ref TStateMachine stateMachine)
            where TStateMachine : IAsyncStateMachine
        {
            Console.WriteLine("[AsyncMethodBuilder] Start");
            stateMachine.MoveNext();
        }

        /// <summary>Associates the builder with the specified state machine.</summary>
        /// <param name="stateMachine">The state machine instance to associate with the builder.</param>
        public void SetStateMachine(IAsyncStateMachine stateMachine)
        {
            Console.WriteLine("[AsyncMethodBuilder] SetStateMachine");
        }

        /// <summary>Marks the task as successfully completed.</summary>
        /// <param name="result">The result to use to complete the task.</param>
        public void SetResult(TResult result)
        {
            Console.WriteLine("[AsyncMethodBuilder] SetResult");
            _taskCompletionSource.SetResult(result);
        }

        /// <summary>Marks the task as failed and binds the specified exception to the task.</summary>
        /// <param name="exception">The exception to bind to the task.</param>
        public void SetException(Exception exception)
        {
            Console.WriteLine("[AsyncMethodBuilder] SetException");
            _taskCompletionSource.SetException(exception);
        }

        /// <summary>Gets the task for this builder.</summary>
        public WalterlvAsyncOperation<TResult> Task
        {
            get
            {
                Console.WriteLine("[AsyncMethodBuilder] get_Task");
                return new WalterlvAsyncOperation<TResult>();
            }
        }

        public void AwaitOnCompleted<TAwaiter, TStateMachine>(ref TAwaiter awaiter, ref TStateMachine stateMachine)
            where TAwaiter : INotifyCompletion
            where TStateMachine : IAsyncStateMachine
        {
            Console.WriteLine("[AsyncMethodBuilder] AwaitOnCompleted");
        }

        public void AwaitUnsafeOnCompleted<TAwaiter, TStateMachine>(ref TAwaiter awaiter, ref TStateMachine stateMachine)
            where TAwaiter : ICriticalNotifyCompletion
            where TStateMachine : IAsyncStateMachine
        {
            Console.WriteLine("[AsyncMethodBuilder] AwaitUnsafeOnCompleted");
        }
    }
}
```

---

**参考资料**

- [Async Return Types (C#) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/async/async-return-types)
- [Extending the async methods in C# - Premier Developer](https://devblogs.microsoft.com/premier-developer/extending-the-async-methods-in-c/)
- [AsyncMethodBuilder.cs](https://referencesource.microsoft.com/#mscorlib/system/runtime/compilerservices/AsyncMethodBuilder.cs)
