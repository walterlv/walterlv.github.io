---
title: ".NET 中使用 TaskCompletionSource 作为线程同步互斥或异步操作的事件"
date: 2018-12-22 15:50:23 +0800
categories: dotnet csharp
position: knowledge
---

你可以使用临界区（Critical Section）、互斥量（Mutex）、信号量（Semaphores）和事件（Event）来处理线程同步。然而，在编写一些异步处理函数，尤其是还有 async 和 await 使用的时候，还有一些更方便的类型可以用来处理线程同步。

使用 `TaskCompletionSource`，你可以轻松地编写既可以异步等待，又可以同步等待的代码来。

---

<div id="toc"></div>

## 等待事件

我们创建一个 `TaskCompletionSource<object>` 对象，这样，我们便可以写出一个既可以同步等待又可以异步等待的方法：

```csharp
public class WalterlvDemo
{
    private readonly TaskCompletionSource<object> _source = new TaskCompletionSource<object>();

    public Task WaitAsync() => _source.Task;

    public void Wait() => _source.Task.GetAwaiter().GetResult();
}
```

等待时可以同步：

```csharp
demo.Wait();
```

也可以异步：

```csharp
await demo.WaitAsync();
```

而同步的那个方法，便可以用来做线程同步使用。

## 引发事件

要像一个事件一样让同步等待阻塞着的线程继续跑起来，则需要设置这个事件。

而 `TaskCompletionSource<object>` 提供了很多让任务完成的方法：

![TaskCompletionSource 中的方法](/static/posts/2018-12-22-15-47-52.png)

可以通过让这个 `TaskCompletionSource<object>` 完成、取消或设置异常的方式让这个 Task 进入完成、取消或错误状态，然后等待它的线程就会继续执行；当然如果有异常，就会让等待的线程收到一个需要处理的异常。

```csharp
_source.SetResult(null);
```
