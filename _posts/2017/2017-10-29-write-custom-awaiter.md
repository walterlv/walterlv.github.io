---
title: "在 WPF/UWP 中实现一个可以用 await 异步等待 UI 交互操作的 Awaiter"
publishDate: 2017-10-29 16:38:57 +0800
date: 2018-12-22 14:23:59 +0800
categories: dotnet csharp wpf uwp
---

.NET 和 C# 共同给我们带来的 `async`/`await` 异步编程模型（TAP）用起来真的很爽。为了实现异步等待，我们只需要在一切能够能够异步等待的方法前面加上 `await` 即可。能够异步等待的最常见的类型莫过于 `Task`，但也有一些其他类型。即便有些耗时操作没有返回可等待的类型，我们也可以用一句 `Task.Run(action)` 来包装（[同步转异步 - 林德熙](https://lindexi.gitee.io/lindexi/post/win10-uwp-%E5%BC%82%E6%AD%A5%E8%BD%AC%E5%90%8C%E6%AD%A5.html) 中也有说明）；不过副作用就是 `Run` 里面的方法在后台线程执行了（谁知道这是好处呢还是坏处呢 ^_^）。

问题就在于，有些“耗时”操作根本就无法放入后台线程，典型的莫过于“耗时”的 UI 操作。本文将通过实现一个适用于 UI 的可等待类型来解决这种 UI 的“耗时”等待问题。

---

<div id="toc"></div>

### 本文阅读建议

本文**代码较多**，阅读建议：

1. 标注为“**本文推荐的完整代码**”的代码块可直接放入自己的项目中使用，也贴出了 GitHub 上我以 MIT 开源的源代码（可能 GitHub 上会经常更新）。
1. 标注“**此处为试验代码**”的代码块表明此处代码并不完善，仅用于本文分析使用，不建议放到自己的项目中使用。
1. 没有注释标注的代码块是用于研究的代码片段，不需要使用。
1. 可点击下面的导航跳转到你希望的地方。

### 我们的需求

这里说的 UI “耗时”，“耗时”打了引号，是因为严格来说并不是真的卡死了 UI，而是某个函数的执行需要更多的 UI 操作才能继续。这句话可能比较难懂，但举两个例子就好懂了。

1. 某个函数的执行需要显示一个用户控件，用户填写控件中的信息并确定后，函数才继续执行。这种感觉很像模态窗口，但我们却是在同一个窗口内实现，不能通过模态窗口来实现我们的功能。（UWP 中的 `ContentDialog` 就是这么干的。）
1. 我们需要在后台线程创建一个控件，创建完毕之后在原线程返回。这样我们就能得到一个在后台线程创建的控件了。

本文将以实现第 2 条为目标，一步步完善我们的代码，并做出一个非常通用的 UI 可等待类出来。最终你会发现，我们的代码也能轻松应对第 1 条的需求。

### 实现目标 DispatcherAsyncOperation<T>

现在，我们来实现我们的目标。

回顾一下，我们希望实现一个方法，要求能够在后台线程创建一个 UI 控件。

不使用自定义的 `Awaiter`，使用现有的 `Task` 可以写出如下代码：

```csharp
// 注：此处为试验代码。
public static class UIDispatcher
{
    public static async Task<T> CreateElementAsync<T>()
        where T : Visual, new()
    {
        return await CreateElementAsync(() => new T());
    }

    public static async Task<T> CreateElementAsync<T>([NotNull] Func<T> @new)
        where T : Visual
    {
        if (@new == null)
            throw new ArgumentNullException(nameof(@new));

        var element = default(T);
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

那么开始，既然要去掉 `Task.Run`，那么我们需要在后台线程真正完成任务的时候自动去执行接下来的任务，而不是在调用线程中去等待。

经过反复修改，我的 `DispatcherAsyncOperation` 类如下：

```csharp
// 此段代码为本文推荐的完整版本。
// 可复制或前往我的 GitHub 页面下载：
// https://github.com/walterlv/sharing-demo/blob/master/src/Walterlv.Demo.Sharing/Utils/Threading/DispatcherAsyncOperation.cs
namespace Walterlv.Demo.Utils.Threading
{
    public class DispatcherAsyncOperation<T> : DispatcherObject,
        IAwaitable<DispatcherAsyncOperation<T>, T>, IAwaiter<T>
    {
        private DispatcherAsyncOperation()
        {
        }

        public DispatcherAsyncOperation<T> GetAwaiter()
        {
            return this;
        }

        public bool IsCompleted { get; private set; }

        public T Result { get; private set; }

        public T GetResult()
        {
            if (_exception != null)
            {
                ExceptionDispatchInfo.Capture(_exception).Throw();
            }
            return Result;
        }

        public DispatcherAsyncOperation<T> ConfigurePriority(DispatcherPriority priority)
        {
            _priority = priority;
            return this;
        }

        public void OnCompleted(Action continuation)
        {
            if (IsCompleted)
            {
                continuation?.Invoke();
            }
            else
            {
                _continuation += continuation;
            }
        }

        private void ReportResult(T result, Exception ex)
        {
            Result = result;
            _exception = ex;
            IsCompleted = true;
            if (_continuation != null)
            {
                Dispatcher.InvokeAsync(_continuation, _priority);
            }
        }

        private Action _continuation;
        private DispatcherPriority _priority = DispatcherPriority.Normal;
        private Exception _exception;

        public static DispatcherAsyncOperation<T> Create([NotNull] out Action<T, Exception> reportResult)
        {
            var asyncOperation = new DispatcherAsyncOperation<T>();
            reportResult = asyncOperation.ReportResult;
            return asyncOperation;
        }
    }
}
```

解释一下：

1. `Create()` 静态方法会返回一个可以等待的 `DispatcherAsyncOperation<T>` 实例，在写实现代码的地方当然不是用来等的，这个值是用来给外部使用 `await` 的开发者返回的。但是，它会 `out` 一个 `Action`，调用这个 `Action`，则可以报告操作已经结束。
1. `OnCompleted` 方法会在主线程调用的代码结束后立即执行。参数中的 `continuation` 是对 `await` 后面代码的一层包装，调用它即可让 `await` 后面的代码开始执行。但是，我们却并不是立即就能得到后台线程的返回值。于是我们需要等到后台线程执行完毕，调用 `ReportResult` 方法的时候才执行。
1. `_continuation += continuation;` 需要使用 “+=” 是因为这里的 `GetAwaiter()` 返回的是 `this`，也就是说，极有可能发生同一个实例被 `await` 多次的情况，需要将每次后面的任务都执行才行。
1. `_continuation` 可能为空，是因为任务执行完毕的时候也没有任何地方 `await` 了此实例。

在有了新的 `DispatcherAsyncOperation` 的帮助下，我们的 `UIDispatcher` 改进成了如下模样：

```csharp
// 注：此处为试验代码。
public static class UIDispatcher
{
    public static DispatcherAsyncOperation<T> CreateElementAsync<T>()
        where T : Visual, new()
    {
        return CreateElementAsync(() => new T());
    }

    public static DispatcherAsyncOperation<T> CreateElementAsync<T>(
        Func<T> @new)
        where T : Visual
    {
        var awaitable = DispatcherAsyncOperation<T>.Create(out var reportResult);
        var thread = new Thread(() =>
        {
            try
            {
                var dispatcher = Dispatcher.CurrentDispatcher;
                SynchronizationContext.SetSynchronizationContext(
                    new DispatcherSynchronizationContext(dispatcher));
                var value = @new();
                reportResult(value, null);
                Dispatcher.Run();
            }
            catch (Exception ex)
            {
                reportResult(null, ex);
            }
        })
        {
            Name = $"{typeof(T).Name}",
            IsBackground = true,
        };
        thread.SetApartmentState(ApartmentState.STA);
        thread.Start();
        return awaitable;
    }
}
```

为了让 `UIDispatcher` 更加通用，我们把后台线程创建 UI 控件的代码移除，现在 `UIDispatcher` 里面只剩下用于创建一个后台线程运行的 `Dispatcher` 的方法了。

```csharp
// 此段代码为本文推荐的完整版本。
// 可复制或前往我的 GitHub 页面下载：
// https://github.com/walterlv/sharing-demo/blob/master/src/Walterlv.Demo.WPF/Utils/Threading/UIDispatcher.cs
namespace Walterlv.Demo
{
    public static class UIDispatcher
    {
        public static DispatcherAsyncOperation<Dispatcher> RunNewAsync([CanBeNull] string name = null)
        {
            var awaitable = DispatcherAsyncOperation<Dispatcher>.Create(out var reportResult);
            var thread = new Thread(() =>
            {
                try
                {
                    var dispatcher = Dispatcher.CurrentDispatcher;
                    SynchronizationContext.SetSynchronizationContext(
                        new DispatcherSynchronizationContext(dispatcher));
                    reportResult(dispatcher, null);
                    Dispatcher.Run();
                }
                catch (Exception ex)
                {
                    reportResult(null, ex);
                }
            })
            {
                Name = name ?? "BackgroundUI",
                IsBackground = true,
            };
            thread.SetApartmentState(ApartmentState.STA);
            thread.Start();
            return awaitable;
        }
    }
}
```

### 回顾完整的代码

至此，我们得到了三个完整的代码文件（在 **GitHub** 上，以下所有代码文件均有**详尽的中文注释**）：

- [AwaiterInterfaces.cs](https://github.com/walterlv/sharing-demo/blob/master/src/Walterlv.Core/Threading/AwaiterInterfaces.cs) 用于定义一组完整的 `Awaitable`/`Awaiter` 接口，方便开发者实现自定义可等待对象。
- [DispatcherAsyncOperation.cs](https://github.com/walterlv/sharing-demo/blob/master/src/Walterlv.Demo.Sharing/Utils/Threading/DispatcherAsyncOperation.cs) 一个自定义的，适用于 UI 的自定义可等待（`awaitable`）类；使用此类可以避免浪费一个线程用于等待 UI 操作的结束。
- [UIDispatcher.cs](https://github.com/walterlv/sharing-demo/blob/master/src/Walterlv.Demo.WPF/Utils/Threading/UIDispatcher.cs) 用于在后台线程启动一个 `Dispatcher`，以便在这个 `Dispatcher` 中方便地创建控件。

### 回顾需求

现在，在以上三个完整代码文件的帮助下，我们实现我们的那两个需求。（手动斜眼一下，我只说拿第 2 个需求当例子进行分析，并不是说只实现第 2 个。我们的目标是写出一份通用的组件来，方便实现大部分主流需求。）

#### 实现第 2 个需求

后台创建一个 UI 控件：

```csharp
public async Task<T> CreateElementAsync<T>([CanBeNull] Dispatcher dispatcher = null)
    where T : UIElement, new()
{
    return await CreateElementAsync(() => new T(), dispatcher);
}

public async Task<T> CreateElementAsync<T>(Func<T> @new, [CanBeNull] Dispatcher dispatcher = null)
    where T : UIElement
{
    dispatcher = dispatcher ?? await UIDispatcher.RunNewAsync($"{typeof(T).Name}");
    return await dispatcher.InvokeAsync(@new);
}
```

可以这样用：

```csharp
var result = CreateElementAsync(() =>
{
    var box = new TextBox()
    {
        Text = "123",
        Opacity = 0.5,
        Margin = new Thickness(16),
    };
    return box;
});
```

也可以这样用：

```csharp
var result = CreateElementAsync<Button>();
```

还可以不用新建线程和 `Dispatcher`，直接利用现成的：

```csharp
var result = CreateElementAsync<Button>(dispatcher);
```

#### 实现第 1 个需求

显示一个用户控件，等用户点击了确定后异步返回：

```csharp
private Action<bool, Exception> _reportResult;

public DispatcherAsyncOperation<bool> ShowAsync()
{
    var awaiter = DispatcherAsyncOperation<bool>.Create(out _reportResult);
    Host.Visibility = Visibility.Visible;
    return awaiter;
}

private void OkButton_Click(object sender, RoutedEventArgs e)
{
    Host.Visibility = Visibility.Collapsed;
    _reportResult(true, null);
}

private void CancelButton_Click(object sender, RoutedEventArgs e)
{
    Host.Visibility = Visibility.Collapsed;
    _reportResult(false, null);
}
```

可以这样用：

```csharp
var result = await someControl.ShowAsync();
if (result)
{
    // 用户点了确定。
}
else
{
    // 用户点了取消。。
}
```

### 全文总结

读者读到此处，应该已经学会了如何自己实现一个自定义的异步等待类，也能明白某些场景下自己写一个这样的类代替原生 `Task` 的好处。不过不管是否明白，通过阅读本文还收获了三份代码文件呢！我已经把这些文件以 MIT 开源到了 [walterlv/sharing-demo](https://github.com/walterlv/sharing-demo) 中，大家可以随意使用。

本文较长，如果阅读的过程中发现了任何不正确的地方，希望能回复帮我指出；如果有难以理解的地方，也请回复我，以便我能够调整我的语句，使之更易于理解。

以上。

---

#### 参考资料

- [Dixin's Blog - Understanding C# async / await (1) Compilation](https://weblogs.asp.net/dixin/understanding-c-sharp-async-await-1-compilation)
- [Dixin's Blog - Understanding C# async / await (2) The Awaitable-Awaiter Pattern](https://weblogs.asp.net/dixin/understanding-c-sharp-async-await-2-awaitable-awaiter-pattern)
- [await anything; - Parallel Programming with .NET](https://blogs.msdn.microsoft.com/pfxteam/2011/01/13/await-anything/)
- [【C#】【多线程】【05-使用C#6.0】08-自定义awaitable类型 - L.M](http://liujiajia.me/blog/details/csharp-multi-threading-05-csharp6-08-customize-awaitable)
- [AsyncMethodBuilder](https://referencesource.microsoft.com/#mscorlib/system/runtime/compilerservices/AsyncMethodBuilder.cs)
