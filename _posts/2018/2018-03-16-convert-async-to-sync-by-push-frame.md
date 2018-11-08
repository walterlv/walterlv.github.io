---
title: "将 async/await 异步代码转换为安全的不会死锁的同步代码（使用 PushFrame）"
publishDate: 2018-03-16 11:58:10 +0800
date: 2018-11-08 10:38:08 +0800
categories: dotnet csharp
---

在 `async`/`await` 异步模型（即 TAP [Task-based Asynchronous Pattern](https://docs.microsoft.com/en-us/dotnet/standard/asynchronous-programming-patterns/task-based-asynchronous-pattern-tap)）出现以前，有大量的同步代码存在于代码库中，以至于这些代码全部迁移到 `async`/`await` 可能有些困难。这里就免不了将一部分异步代码修改为同步代码。然而传统的迁移方式存在或多或少的问题。本文将总结这些传统方法的坑，并推出一款异步转同步的新方法，解决传统方法的这些坑。

---

<div id="toc"></div>

### 背景问题和传统方法

1. 为什么有些方法不容易迁移到 `async`/`await`？
    - 参见微软的博客 `async`/`await` 最佳实践 [Async/Await - Best Practices in Asynchronous Programming](https://msdn.microsoft.com/en-us/magazine/jj991977.aspx)。如果某个方法从同步方法修改为异步方法（例如从 `var content = file.Read()` 修改为 `var content = await file.ReadAsync()`），那么调用此方法的整个调用链全部都要改成 `async`/`await` 才能让返回值在调用链中成功传递。
1. 传统的异步转同步的方法有哪些？有什么坑？
    - 参见我的好朋友[林德熙](https://lindexi.gitee.io/lindexi/)的博客 [win10 uwp 异步转同步](https://lindexi.gitee.io/post/win10-uwp-%E5%BC%82%E6%AD%A5%E8%BD%AC%E5%90%8C%E6%AD%A5.html)。文章里使用 `Task.Wait()` 或者 `Task.Result` 来获取异步方法的返回值。
    - 这种方法会阻塞调用线程。如果调用线程是 UI 线程，那么 UI 将会无响应；更严重地，如果 UI 线程使用 `DispatcherSynchronizationContext`（参见我的另一篇文章 [DispatcherSynchronizationContext - walterlv](/post/yield-in-task-dispatcher.html)）进行线程上下文的同步，那么极有可能会造成死锁（参见我的另一篇文章 [使用 Task.Wait()？立刻死锁（deadlock） - walterlv](/post/deadlock-in-task-wait.html)）。

### 安全的方法

传统方法的坑在于 UI 线程无响应和死锁问题。既要解决无响应问题，又要阻塞调用方，可选的方法就是 Windows 消息循环了。在使用消息循环时还要避免使用 `async`/`await` 的同步上下文（`SynchronizationContext`），这样才能避免 UI 线程的死锁问题。

所以，我考虑使用 `PushFrame` 来阻塞当前线程并创建一个新的消息循环。使用 `Task.ContinueWith` 来恢复阻塞，而不使用 `Task` 中默认同步所采用的同步上下文。

关于 `PushFrame`，可以阅读 [深入了解 WPF Dispatcher 的工作原理（PushFrame 部分）](https://walterlv.com/post/dotnet/2017/09/26/dispatcher-push-frame.html) 了解更多。

代码如下：

```csharp
/// <summary>
/// 通过 PushFrame（进入一个新的消息循环）的方式来同步等待一个必须使用 await 才能等待的异步操作。
/// 由于使用了消息循环，所以并不会阻塞 UI 线程。<para/>
/// 此方法适用于将一个 async/await 模式的异步代码转换为同步代码。<para/>
/// </summary>
/// <remarks>
/// 此方法适用于任何线程，包括 UI 线程、非 UI 线程、STA 线程、MTA 线程。
/// </remarks>
/// <typeparam name="TResult">
/// 异步方法返回值的类型。
/// 我们认为只有包含返回值的方法才会出现无法从异步转为同步的问题，所以必须要求异步方法返回一个值。
/// </typeparam>
/// <param name="task">异步的带有返回值的任务。</param>
/// <returns>异步方法在同步返回过程中的返回值。</returns>
public static TResult AwaitByPushFrame<TResult>(Task<TResult> task)
{
    if (task == null) throw new ArgumentNullException(nameof(task));
    Contract.EndContractBlock();

    var frame = new DispatcherFrame();
    task.ContinueWith(t =>
    {
        frame.Continue = false;
    });
    Dispatcher.PushFrame(frame);
    return task.Result;
}
```

▲ 这就是全部代码了，仅适用于 Windows 平台（*如果使用 .NET Core，需要其他能够创建消息循环这种线程模型的方案。不过这通常是平台相关的，需要多种实现。例如 [Avalonia](https://github.com/AvaloniaUI/Avalonia) 在 Win32 平台上使用 GetMessage 实现等待；在 iOS 和 Android 平台上使用外部的全局循环；Mac 使用 MonoMac.AppKit 创建；Linux 下使用 GtkMainIteration 实现等待。*）

### 新方法的适用范围和优劣

事实上，虽然我们使用了消息循环，但其实也适用于控制台程序，适用于各种各样奇奇怪怪的线程 —— **无论是 UI 线程还是非 UI 线程，无论是 STA 还是 MTA**。

例如，我们现在在一个 MTA 线程模型的控制台程序中试用一下：

```csharp
namespace Walterlv.Demo
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.Title = "walterlv's demo";
            var foo = Foo();
            var result = AwaitByPushFrame(foo);
            Console.WriteLine($"输入的字符串为：{result}");
            Console.ReadKey();
        }

        private static async Task<string> Foo()
        {
            Console.WriteLine("请稍后……");
            await Task.Delay(1000);
            Console.Write("请输入：");
            var line = Console.ReadLine();
            Console.WriteLine("正在处理……");
            await Task.Run(() =>
            {
                // 模拟耗时的操作。
                Thread.Sleep(1000);
            });
            return line;
        }
    }
}
```

启动控制台程序，我们发现程序真的停下来等待我们输入了。这说明一开始的 `await Task.Delay(1000)` 已经生效，`Main` 函数也没有退出。

![开始运行](/static/posts/2018-03-16-11-46-02.png)  
▲ 开始运行

现在我们输入一段文字：

![输入文字](/static/posts/2018-03-16-11-47-37.png)  
▲ 输入文字

依然正常。现在我们按下回车看看后台线程的执行是否也正常：

![后台线程正在处理](/static/posts/2018-03-16-11-50-23.png)  
▲ 后台线程正在处理

后台线程也在处理，而且现在才停到 `Main` 函数的 `ReadKey` 中。说明转同步过程成功。

不过我们也要认识到，由于使用了消息循环，这意味着此方法不像 `Task.Wait()` 或 `Task.Result` 方法那样在全平台通用。不过，消息循环方法的出现便主要是用来解决 UI 的无响应和死锁问题。

### 总结

我们使用消息循环的方式完成了异步方法转同步方法，这样的方式不止能解决传统 `Task.Wait()`/`Task.Result` 导致 UI 线程无响应或死锁问题之外，也适用于非 UI 线程，不止能在 STA 线程使用，也能在 MTA 线程使用。
