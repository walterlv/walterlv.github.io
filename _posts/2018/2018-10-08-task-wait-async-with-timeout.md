---
title: ".NET 中让 Task 支持带超时的异步等待"
date: 2018-10-08 21:41:31 +0800
categories: dotnet csharp
---

Task 自带有很多等待任务完成的方法，有的是实例方法，有的是静态方法。有的阻塞，有的不阻塞。不过带超时的方法只有一个，但它是阻塞的。

本文将介绍一个非阻塞的带超时的等待方法。

---

<div id="toc"></div>

## Task 已有的等待方法

Task 实例已经有的等待方法有这些：

![Task 实例的等待方法](/static/posts/2018-10-08-21-19-48.png)  
▲ Task 实例的等待方法

一个支持取消，一个支持超时，再剩下的就是这两个的排列组合了。

但是 Task 实例的等待方法都有一个弊端，就是 **阻塞**。如果你真的试图去等待这个 Task，势必会占用一个宝贵的线程资源。所以通常不建议这么做。

另外，Task 还提供了静态的等待方法：

![Task 静态的等待方法](/static/posts/2018-10-08-21-30-15.png)  
▲ Task 静态的等待方法

Task.Wait 提供的功能几乎与 Task 实例的 Wait 方法是一样的，只是可以等待多个 Task 的实例。而 Task.When 则是真正的异步等待，不阻塞线程的，可以节省一个线程资源。

可是，依然只有 Task.Wait 这种阻塞的方法才有超时，Task.When 系列是没有的。

## 我们补充一个带超时的一步等待方法

Task 有一个 `Delay` 静态方法，我们是否可以利用这个方法来间接实现异步非阻塞的等待呢？

答案是可以的，我们有 `Task.WhenAny` 可以在多个任务的任何一个完成时结束。我们的思路是要么任务先完成，要么超时先完成。

于是我们可以先建一个新的 Task，即 `Task.Delay(timeout)`，再比较这两个 Task 的执行先后：

```csharp
public static async Task<TResult> WaitAsync<TResult>(Task<TResult> task, TimeSpan timeout)
{
    if (await Task.WhenAny(task, Task.Delay(timeout)) == task)
    {
        return await task;
    }
    throw new TimeoutException("The operation has timed out.");
}
```

考虑延时任务可以取消，于是我们可以使用 `CancellationTokenSource`。

将这个方法封装成 `Task` 的扩展方法：

```csharp
namespace Walterlv
{
    public static class TaskWaitingExtensions
    {
        public static async Task<TResult> WaitAsync<TResult>(this Task<TResult> task, TimeSpan timeout)
        {
            using (var timeoutCancellationTokenSource = new CancellationTokenSource())
            {
                var delayTask = Task.Delay(timeout, timeoutCancellationTokenSource.Token);
                if (await Task.WhenAny(task, delayTask) == task)
                {
                    timeoutCancellationTokenSource.Cancel();
                    return await task;
                }
                throw new TimeoutException("The operation has timed out.");
            }
        }
    }
}
```

于是我们就可以在任意的 `Task` 实例上调用 `Task.WaitAsync` 来获取带超时的等待了。

---

**参考资料**

- [c# - Asynchronously wait for Task<T> to complete with timeout - Stack Overflow](https://stackoverflow.com/q/4238345/6233938)
