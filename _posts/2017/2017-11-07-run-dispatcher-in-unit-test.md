---
title: "如何在单元测试中使用 Dispatcher.Invoke/InvokeAsync？"
publishDate: 2017-11-07 21:02:54 +0800
date: 2018-11-27 13:10:18 +0800
tags: wpf unittest
coverImage: /static/posts/2017-11-07-20-49-51.png
permalink: /posts/run-dispatcher-in-unit-test.html
---

对于部分涉及到 WPF UI 的部分，单元测试一般都难以进行。但是，如果只是使用到其中的 UI 线程调度，那就稍微容易一些。不过为了找到这个方法我做了很多天的尝试。

本文将提供一种在单元测试中运行 `Dispatcher` 的方法，以便能够在单元测试中测试到 `Invoke/InvokeAsync` 是否按要求执行。

---

我第一个想到的是在当前函数中执行 `Dispatcher.Run`，但是 `Run` 之后就阻塞了，我还怎么测试呢？

于是我又想到我上个月写的辅助方法 `UIDispatcher.RunNewAsync()`，在后台创建一个运行起来的 `Dispatcher`。参见我博客 [如何实现一个可以用 await 异步等待的 Awaiter - walterlv](/post/write-custom-awaiter) 中 `UIDispatcher` 的实现。

![UIDispatcher](/static/posts/2017-11-07-20-49-51.png)

这方法确实可行，可以 `await`。然而单元测试中只有一个单元测试可以通过，无论什么测试，只有第一个 `Run` 起来的可以通过，其它的全部无法完成（已知运行中，无法退出单元测试）。

---

最后，在 [c# - Using the WPF Dispatcher in unit tests - Stack Overflow](https://stackoverflow.com/questions/1106881/using-the-wpf-dispatcher-in-unit-tests) 发现其实可以先 `Invoke` 再 `Run`，这样，即便是当前的单元测试线程也是可以正常完成的。

```csharp
private void RunInDispatcher(Action action)
{
    var dispatcher = Dispatcher.CurrentDispatcher;
    var frame = new DispatcherFrame();
    dispatcher.InvokeAsync(() => action(dispatcher));
    dispatcher.InvokeAsync(() => frame.Continue = false, DispatcherPriority.Background);
    Dispatcher.PushFrame(frame);
}
```

这个方法借鉴了此前我和我朋友研究过的 WPF DoEvents（虽然已被弃用）：

- [深入了解 WPF Dispatcher 的工作原理（PushFrame 部分） - walterlv](/post/dotnet/2017/09/26/dispatcher-push-frame.html)
- [wpf DoEvents - 林德熙](https://blog.lindexi.com/post/wpf-DoEvents.html)

---

于是，单元测试可以这样做：

```csharp
[TestMethod]
public void TestSomething_SomethingHappened()
{
    RunInDispatcher(async dispatcher =>
    {
        // 做一些事情。
        // 然后……
        dispatcher.InvokeAsync(action);
        // 然后干些啥……
        // 然后等待 Measure/Arrange。
        await Dispatcher.Yield();
        // 然后再验证值。
        Assert.AreEqual(a, b);
    });
}
```

*`Yield` 的意思可以参见我的另一篇博客 [出让执行权：Task.Yield, Dispathcer.Yield - walterlv](/post/yield-in-task-dispatcher)。*

以上。

---

**参考资料**

- [c# - Using the WPF Dispatcher in unit tests - Stack Overflow](https://stackoverflow.com/questions/1106881/using-the-wpf-dispatcher-in-unit-tests)


