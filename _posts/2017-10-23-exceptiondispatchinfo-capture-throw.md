---
title: "使用 ExceptionDispatchInfo 捕捉并重新抛出异常"
date: 2017-10-23 22:22:43 +0800
categories: dotnet dotnet-core dotnet-standard csharp
---

当你跑起了一个异步线程，并用 `await` 异步等待时，有没有好奇为什么能够在主线程 `catch` 到异步线程的异常？

当你希望在代码中提前收集好异常，最后一并把收集到的异常抛出的时候，能不能做到就像在原始异常发生的地方抛出一样？

本文介绍 `ExceptionDispatchInfo`，专门用于重新抛出异常。它在 .NET Framework 4.5 中首次引入，并原生在 .NET Core 和 .NET Standard 中得到支持。

---

先探索为什么需要重新抛出异常，再了解如何最佳地重新抛出异常。如果你只希望了解 `ExceptionDispatchInfo`，请直接从以下导航中点击跳转到最后一节。

<div id="toc"></div>

### 重新抛出异常

说起重新抛出异常，你是否会认为就是写出如下代码？

```csharp
try
{
    DoButExceptionsMayOccur();
}
catch(Exception ex)
{
    // 在这里进行抢救。
    // 永远不要写出下面这句代码！（Don't write the code below forever!）
    throw ex;
}
```

为了防止这段代码被意外复制出去危及项目，我特地在注释中标明了永远不应该直接写出 `throw ex` 这样的句子！

这是因为 `throw` 语句会为异常的实例填充调用栈信息，范围为 `throw` 的地方开始，到 `catch` 的地方结束。也就是说，在异常刚刚发生的时候，也就是 `DoButExceptionsMayOccur` 里面的某一个调用会成为调用栈的起点，上面写了 `catch` 所在的函数会成为调用栈的终点。然而，一旦在 `catch` 中写出了 `throw ex` 这样的语句，那么 `ex` 中的调用栈将会被重写，范围从这一句 `throw` 开始，到外面能 `catch` 的地方为止。

具体说来，假设上面那段代码出现在 `Test` 方法中，里面的 `DoButExceptionsMayOccur` 调用了方法 `Inner`，`Inner` 中发生了异常；而 `Outer` 调用了 `Test` 方法，`Outer` 中也 `catch` 了异常；即整个调用链为 `Outer`->`Test`->`DoButExceptionsMayOccur`->`Inner`。那么，当刚刚 `catch` 到异常时，`ex` 的调用栈为 `Test`->`DoButExceptionsMayOccur`->`Inner`，而如果写了 `throw ex`，那么 `Outer` 中将只能发现调用栈为 `Outer`->`Test`，丢失了内部真正出错的原因，这对诊断和修复异常非常不利！

![两次抛出异常时收获的调用栈](/static/posts/2017-10-23-21-31-48.png)

如果只是为了解决上述文字中所说的问题，其实只需要去掉那个 `ex` 即可，即：

```csharp
try
{
    DoButExceptionsMayOccur();
}
catch(Exception)
{
    // 在这里进行抢救。
    throw;
}
```

然而，有时候这个异常并不直接从这里抛出（例如后台线程），或者说我们期望这是一个分步骤收集的异常（例如遍历）。这两种情况都有一个共同特点，就是重新抛出的地方根本就不在 `catch` 的地方。

后台线程的例子：

```csharp
Exception exception = null;
DoSomething(() =>
{
    try
    {
        DoButExceptionsMayOccur();
    }
    catch(Exception ex)
    {
        exception = ex;
    }
});
if (exception == null)
{
    // 重新抛出异常。
}
```

收集异常的例子：

```csharp
List<Exception> exceptions = new List<Exception>();
foreach(var item in collection)
{
    try
    {
        DoButExceptionsMayOccur(item);
    }
    catch(Exception ex)
    {
        exceptions.Add(ex);
    }
}
if (exceptions.Any())
{
    // 重新抛出异常。
}
```

### 使用内部异常

.NET Framework 早期就提供了内部异常功能，专为解决保留调用栈而重新抛出异常而生。上面两段代码标记为`// 重新抛出异常。`的注释部分改为：

```csharp
// 对应第一种情况。
throw new XxxException(ex);
// 对应第二种情况。
throw new AggregateException(exceptions);
```

于是两边的调用栈就被分别保留在了多个不同的 `Exception` 实例中。然而看异常总要一层层点开查看，始终不便。尤其是从产品中收集异常时，如何在异常分析系统中显示和分析也是个问题。

### `ExceptionDispatchInfo`

如果将第一种情况写为：

```csharp
ExceptionDispatchInfo.Capture(ex).Throw();
```

那么，这时外面的方法再 `catch` 异常，则会从外层直接看到里层，只在中间插入了一段文字，却看起来就像直接从原始出处抛出一样。

第二种情况写为：

```csharp
if(exceptions.Count == 1)
{
    ExceptionDispatchInfo.Capture(exceptions.First()).Throw();
}
else if(exceptions.Count > 1)
{
    throw new AggregateException(exceptions);
}
```

使用这种方式，你看到的调用栈将是这样的：

![使用 `ExceptionDispatchInfo` 的调用栈](/static/posts/2017-10-23-22-22-30.png)

至于多个异常的情况，那就只能使用内部异常来处理了。

而这些，正是 `Task` 管理异步线程异常时采用的策略——单个异常直接在调用线程直接抛出，多个异常抛出 `AggregateException`。
