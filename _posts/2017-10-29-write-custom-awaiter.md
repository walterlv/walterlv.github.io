---
title: "如何实现一个可以用 await 异步等待的 Awaiter"
date: 2017-10-29 15:33:59 +0800
categories: dotnet csharp wpf uwp
---

.NET 和 C# 共同给我们带来的 `async`/`await` 异步编程模型（TAP）用起来真的很爽。为了实现异步等待，我们只需要在一切能够能够异步等待的方法前面加上 `await` 即可。能够异步等待的最常见的类型莫过于 `Task`，但也有一些其他类型。即便有些耗时操作没有返回可等待的类型，我们也可以用一句 `Task.Run(action)` 来包装（[同步转异步 - 林德熙](https://lindexi.gitee.io/lindexi/post/win10-uwp-%E5%BC%82%E6%AD%A5%E8%BD%AC%E5%90%8C%E6%AD%A5.html) 中也有说明）；不过副作用就是 `Run` 里面的方法在后台线程执行了（谁知道这是好处呢还是坏处呢 ^_^）。

问题就在于，有些“耗时”操作根本就无法放入后台线程，典型的莫过于“耗时”的 UI 操作。本文将通过实现一个适用于 UI 的可等待类型来解决这种 UI 的“耗时”等待问题。

---

<div id="toc"></div>

### 我们的需求

这里说的 UI “耗时”，“耗时”打了引号，是因为严格来说并不是真的卡死了 UI，而是某个函数的执行需要更多的 UI 操作才能技术。这句话可能比较难懂，但举两个例子就好懂了。

1. 某个函数的执行需要显示一个用户控件，用户填写控件中的信息并确定后，函数才继续执行。这种感觉很像模态窗口，但我们却是在同一个窗口内实现，不能通过模态窗口来实现我们的功能。（UWP 中的 `ContentDialog` 就是这么干的。）
1. 我们需要在后台线程创建一个控件，创建完毕之后在原线程返回。这样我们就能得到一个在后台线程创建的控件了。

本文将以实现第 2 条为目标，一步步完善我们的代码，并做出一个非常通用的 UI 可等待类出来。最终你会发现，我们的代码也能轻松应对第 1 条的需求。

### 什么样的类是可等待的？

我们已经知道 `Task` 是可等待的，但是去看看 `Task` 类的实现，几乎找不到哪个基类、接口或者方法属性能够告诉我们与 `await` 相关。所以，`await` 的实现可能是隐式的。

幸运的是，[Dixin's Blog - Understanding C# async / await (2) The Awaitable-Awaiter Pattern](https://weblogs.asp.net/dixin/understanding-c-sharp-async-await-2-awaitable-awaiter-pattern) 一文解决了我们的疑惑。`async`/`await` 是给编译器用的，只要我们的类包含一个 `GetAwaiter` 方法，并返回合适的对象，我们就能让这个类的实例被 `await` 使用了。

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

编译期告诉我们：

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

于是我们加上一个空的 `GetResult` 方法，现在编译期终于不报错了。

现在我们一开始的 `DoAsync` 和辅助类型变成了这样：

```csharp
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

### 定义抽象的 Awaiter/Awaitable

这里我们发现一个神奇的现象——明明那些属性和方法都是不可缺少的，却并没有接口来约束它们，而是靠着编译器来约束。

然而作为团队开发者的一员，我们不可能让每一位开发者都去探索一遍编译器究竟希望我们怎么来实现 `await`，于是我们自己来定义接口。方便我们自己后续再实现自己的可等待类型。

以下接口在 [Dixin's Blog - Understanding C# async / await (2) The Awaitable-Awaiter Pattern](https://weblogs.asp.net/dixin/understanding-c-sharp-async-await-2-awaitable-awaiter-pattern) 一文中已有原型；但我增加了更通用却更严格的泛型约束，使得这些接口更加通用，且使用者实现的过程中更加不容易出错。

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

### 实现目标 DispatcherAsyncOperation<T>

现在，我们来实现我们的目标。

回顾一下，我们希望实现一个方法，要求能够在后台线程创建一个 UI 控件。

不使用自定义的 `Awaiter`，使用现有的 `Task` 可以写出如下代码：

```csharp
public static class UIDispatcher
{
    public static async Task<T> CreateElementAsync<T>(
        [CanBeNull] Dispatcher dispatcher = null)
        where T : Visual, new()
    {
        return await CreateElementAsync(() => new T(), dispatcher);
    }

    public static async Task<T> CreateElementAsync<T>(
        [NotNull] Func<T> @new, [CanBeNull] Dispatcher dispatcher = null)
        where T : Visual
    {
        if (@new == null)
            throw new ArgumentNullException(nameof(@new));

        var element = default(T);
        if (dispatcher == null)
        {
            Exception exception = null;
            var resetEvent = new AutoResetEvent(false);
            var thread = new Thread(() =>
            {
                try
                {
                    SynchronizationContext.SetSynchronizationContext(
                        new DispatcherSynchronizationContext(Dispatcher.CurrentDispatcher));
                    element = @new();
                    resetEvent.Set();
                    Dispatcher.Run();
                }
                catch (Exception ex)
                {
                    exception = ex;
                }
            })
            {
                Name = $"{typeof(T).Name}",
                IsBackground = true,
            };
            thread.SetApartmentState(ApartmentState.STA);
            thread.Start();
            await Task.Run(() =>
            {
                resetEvent.WaitOne();
                resetEvent.Dispose();
            });
            if (exception != null)
            {
                ExceptionDispatchInfo.Capture(exception).Throw();
            }
        }
        else
        {
            await dispatcher.InvokeAsync(() =>
            {
                element = @new();
            });
        }
        return element;
    }
}
```

说明一下：`SynchronizationContext.SetSynchronizationContext(new DispatcherSynchronizationContext(Dispatcher.CurrentDispatcher));` 这句话是为了确保创建的新 UI 线程里执行的 `async`/`await` 代码在 `await` 异步等待之后能够继续回到此 UI 线程，而不是随便从线程池找一个线程执行。

试一下：

```csharp
var element = await UIDispatcher.CreateElementAsync<Button>();
```

确实拿到了后台线程创建的 UI 对象。

然而，注意这一句：

```csharp
await Task.Run(() =>
{
    resetEvent.WaitOne();
    resetEvent.Dispose();
});
```

这里开启了一个新的线程，专门等待后台线程执行到某个关键位置，实在是太浪费。如果我们实现的是本文开头的第一个需求，需要等待用户输入完信息点击确认后才继续，那么这个 `WaitOne` 则可能会等非常久的时间（取决于用户的心情，啥时候想点确定啥时候才结束）。

线程池里一个线程就这样白白浪费了，可惜！可惜！

于是，我们换自己实现的 `Awaiter`，节省这个线程的资源。取个名字，既然用于 UI 线程使用，那么就命名为 `DispatcherAsyncOperation` 好了。我打算让这个类同时实现 `IAwaitable` 和 `IAwaiter` 接口，因为我又不会去反复等待，只用一次。


### 回顾需求

---

#### 参考资料

- [Dixin's Blog - Understanding C# async / await (1) Compilation](https://weblogs.asp.net/dixin/understanding-c-sharp-async-await-1-compilation)
- [Dixin's Blog - Understanding C# async / await (2) The Awaitable-Awaiter Pattern](https://weblogs.asp.net/dixin/understanding-c-sharp-async-await-2-awaitable-awaiter-pattern)
- [await anything; - Parallel Programming with .NET](https://blogs.msdn.microsoft.com/pfxteam/2011/01/13/await-anything/)
- [【C#】【多线程】【05-使用C#6.0】08-自定义awaitable类型 - L.M](http://liujiajia.me/blog/details/csharp-multi-threading-05-csharp6-08-customize-awaitable)
- [AsyncMethodBuilder](https://referencesource.microsoft.com/#mscorlib/system/runtime/compilerservices/AsyncMethodBuilder.cs)
