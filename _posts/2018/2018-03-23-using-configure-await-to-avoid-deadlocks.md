---
title: "在编写异步方法时，使用 ConfigureAwait(false) 避免使用者死锁"
publishDate: 2018-03-23 21:54:20 +0800
date: 2019-03-15 15:54:00 +0800
tags: dotnet
---

我在 [使用 Task.Wait()？立刻死锁（deadlock）](/post/deadlock-in-task-wait) 一文中站在类库使用者的角度看 `async`/`await` 代码的死锁问题；而本文将站在类库设计者的角度来看死锁问题。

阅读本文，我们将知道如何编写类库代码，来尽可能避免类库使用者出现那篇博客中描述的死锁问题。

---

<div id="toc"></div>

## 可能死锁的代码

现在，我们是类库设计者的身份，我们试图编写一个 `RunAsync` 方法用以异步执行某些操作。

```csharp
private async Task RunAsync()
{
    // 某些异步操作。
}
```

类库的使用者可能多种多样，一个比较有素养的使用者会考虑这样使用类库：

> ```csharp
> await foo.RunAsync();
> ```

放心，这样的类库使用者是不会出什么岔子的。

然而，这世间既然有让人省心的类库使用者，当然也存在非常让人不省心的类库使用者。当你的类库遍布全球，你真的会遇到这样的使用者：

> ```csharp
> foo.RunAsync().Wait();
> ```

或者高级一些，使用 `AutoResetEvent` 和 `try`/`finally` 块的使用者：

> ```csharp
> // 这段代码如果在 foo.RunAsync() 第一次调用返回之前再调用一次，则可能死锁。
> _autoResetEvent.WaitOne();
> try
> {
>     await foo.RunAsync();
> }
> finally
> {
>     _autoResetEvent.Set();
> }
> ```

如果这段代码在 UI 线程执行，那么极有可能出现死锁，就是我在 [使用 Task.Wait()？立刻死锁（deadlock）](/post/deadlock-in-task-wait) 一文中说的那种死锁，详情可进去看原因。

那么现在做一个调查，你认为下面三种 `RunAsync` 的实现中，哪些会在碰到这种不省心的类库使用者时发生死锁呢？

![三种实现](/static/posts/2018-03-23-21-19-51.png)

答案是——

<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>
<br>

**第 2 种**！

只有第 2 种会发生死锁，第 1 和第 3 种都不会。

## 原因

对于第 2 种情况，下方“`await` 之后的代码”试图回到 UI 线程执行，但 UI 此时处于调用者 `foo.RunAsync().Wait();` 这段神奇代码的等待状态——所以死锁了。回到 UI 线程靠的是 `DispatcherSynchronizationContext`，我在 [使用 Task.Wait()？立刻死锁（deadlock）](/post/deadlock-in-task-wait) 一文中已有解释，建议前往了解更深层次的原因。

> ```csharp
> private async Task RunAsync1()
> {
>     await Task.Run(() =>
>     {
>         // 某些异步操作。
>     });
>     // await 之后的代码（即使没写任何代码，也是需要执行的）。
> }
> ```

那为什么第 1 种和第 3 种不会死锁呢？

对第 1 种情况，由于并没有写 `async`/`await`，所以异步状态机 `AsyncMethodStateMachine` 此时并不执行。直接返回了 `Task`，这相当于此时创建的 `Task` 对象直接被调用者的 `foo.RunAsync().Wait();` 神奇代码等待了。也就是说，等待的 `Task` 是真正执行异步任务的 `Task`。

`Task` 的 `Wait()` 方法内部通过自旋锁来实现等待，可以阅读 [.NET 中的轻量级线程安全 - walterlv](/post/lightweight-thread-safe-since-dotnet-4) 了解自旋锁，也可以前往 .NET Framework 源码 [Task.SpinWait](https://referencesource.microsoft.com/#mscorlib/system/threading/Tasks/Task.cs,b1c8bf867b403050,references) 了解 `Task.SpinWait()` 方法的具体实现。

> ```csharp
> //spin only once if we are running on a single CPU
> int spinCount = PlatformHelper.IsSingleProcessor
>     ? 1
>     : System.Threading.SpinWait.YIELD_THRESHOLD;
> for (int i = 0; i < spinCount; i++)
> {
>     if (IsCompleted)
>     {
>         return true;
>     }
> 
>     if (i == spinCount / 2)
>     {
>         Thread.Yield();
>     }
>     else
>     {
>         Thread.SpinWait(PlatformHelper.ProcessorCount * (4 << i));
>     }
> }
> ```

当 `Run` 中的异步任务结束后，自旋锁即发现任务结束 `Task.IsCompleted` 为 `True`，于是等待结束，不会发生死锁。

对第 3 种情况，由于指定了 `ConfigureAwait(false)`，这意味着通知异步状态机 `AsyncMethodStateMachine` 并不需要使用设置好的 `SynchronizationContext`（对于 UI 线程，是 `DispatcherSynchronizationContext`）执行线程同步，而是使用默认的 `SynchronizationContext`，而默认行为是随便找个线程执行后面的代码。于是，`await Task.Run` 后面的代码便不需要返回原线程，也就不会发生第 2 种情况里的死锁问题。

## 预防

建议安装 NuGet 包 [Microsoft.CodeAnalysis.FxCopAnalyzers](https://www.nuget.org/packages/Microsoft.CodeAnalysis.FxCopAnalyzers/)。这样，当你在代码中写出 `await` 时，分析器会提示你 [CA2007](/post/meaning-of-all-kind-of-stylecop) 警告，你必须显式设置 `ConfigureAwait(false)` 或 `ConfigureAwait(true)` 来提醒你是否需要使用默认的 `SynchronizationContext`。

如果你是类库的编写者，注意此问题能够一定程度上防止逗比使用者出现死锁问题后喷你的类库写得不好。

## 更多死锁问题

死锁问题：

- [使用 Task.Wait()？立刻死锁（deadlock） - walterlv](/post/deadlock-in-task-wait)
- [不要使用 Dispatcher.Invoke，因为它可能在你的延迟初始化 `Lazy<T>` 中导致死锁 - walterlv](/post/deadlock-of-invoke-in-lazy)
- [在有 UI 线程参与的同步锁（如 AutoResetEvent）内部使用 await 可能导致死锁](/post/deadlock-if-await-in-ui-lock-context)
- [.NET 中小心嵌套等待的 Task，它可能会耗尽你线程池的现有资源，出现类似死锁的情况 - walterlv](/post/task-wait-may-cause-long-time-waiting)

解决方法：

- [在编写异步方法时，使用 ConfigureAwait(false) 避免使用者死锁 - walterlv](/post/using-configure-await-to-avoid-deadlocks)
- [将 async/await 异步代码转换为安全的不会死锁的同步代码（使用 PushFrame） - walterlv](/post/convert-async-to-sync-by-push-frame)
