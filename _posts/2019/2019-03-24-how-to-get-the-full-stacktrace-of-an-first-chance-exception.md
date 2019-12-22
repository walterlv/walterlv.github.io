---
title: "C#/.NET 如何在第一次机会异常 FirstChanceException 中获取比较完整的异常堆栈"
date: 2019-03-24 12:09:37 +0800
categories: dotnet csharp
position: knowledge
---

在 `FirstChangeException` 事件中，我们通常只能拿到异常堆栈的第一帧，这对于我们捕捉到异常是好的，但对分析第一次机会异常可能并不利。

本文介绍如何在 `FirstChangeException` 事件中拿到比较完整的异常堆栈，而不只是第一帧。

---

<div id="toc"></div>

## 第一次机会异常

.NET 程序代码中的任何一段代码，在刚刚抛出异常，还没有被任何处理的那一时刻，`AppDomain` 的实例会引发一个 `FirstChanceException` 事件，用于通知此时刚刚开始发生了一个异常。

这时，这个异常还没有寻找任何一个可以处理它的 `catch` 块，在此事件中，你几乎是第一时间拿到了这个异常的信息。

监听第一次机会异常的代码是这个样子的：

```csharp
private void WalterlvDemo()
{
    AppDomain.CurrentDomain.FirstChanceException += OnFirstChanceException;
}

private void OnFirstChanceException(object sender, FirstChanceExceptionEventArgs e)
{
    // 在这里，可以通过 e.Exception 来获取到这个异常。
    Console.WriteLine(e.Exception.ToString());
}
```

只不过，在这里我们拿到的异常堆栈只有第一帧，因为这个时候，还没有任何 `catch` 块捕捉到这个异常。比如，我们只能拿到这个：

```csharp
System.NotSupportedException: BitmapMetadata 在 BitmapImage 上可用。
   在 System.Windows.Media.Imaging.BitmapImage.get_Metadata()
```

**一点知识**：`Exception` 实例的异常堆栈，是从第一次抛出异常的地方开始，到第一个 `catch` 它的地方结束，除非这个 `catch` 块中继续只用 `throw;` 抛出才继续向外延伸到下一个 `catch`。

另外，你也可以用 `ExceptionDispatchInfo` 让内部异常的堆栈也连接起来，详见我的另一篇博客：

- [使用 ExceptionDispatchInfo 捕捉并重新抛出异常 - 吕毅](/post/exceptiondispatchinfo-capture-throw)

## 获取较完整的第一次机会异常堆栈

我们需要等到 `FirstChanceException` 事件中的异常被 `catch` 到，就能获取到第一次抛出的地方到 `catch` 处之间的所有帧。

所以，我们只需要稍作延迟，即可拿到较完整的异常堆栈：

```csharp
private void WalterlvDemo()
{
    AppDomain.CurrentDomain.FirstChanceException += OnFirstChanceException;
}

private async void OnFirstChanceException(object sender, FirstChanceExceptionEventArgs e)
{
    // 刚刚进入第一次机会异常事件的时候，异常堆栈只有一行，因为此时还没有任何地方 catch。
    // 现在等待一点点时间，使得异常的堆栈能够延伸到 catch。等待多长不重要，关键是为了让异常得以找到第一个 catch。
    await Task.Delay(10);

    // 在这里，可以通过 e.Exception 来获取到这个异常。
    Console.WriteLine(e.Exception.ToString());
}
```

这样，我们可以得到：

```csharp
System.NotSupportedException: BitmapMetadata 在 BitmapImage 上可用。
   在 System.Windows.Media.Imaging.BitmapImage.get_Metadata()
   在 System.Windows.Media.Imaging.BitmapFrame.Create(BitmapSource source)
   在 Walterlv.Demo.Exceptions.Foo.Take(string fileName)
```

这里，等待多长时间是不重要的，只要不是 `0` 就好。因为我们只需要当前调用堆栈中的异常处理执行完成即可。

关于等待时间，可以阅读我的另一篇博客：

- [C#/.NET 中 Thread.Sleep(0), Task.Delay(0), Thread.Yield(), Task.Yield() 不同的执行效果和用法建议 - 吕毅](/post/sleep-delay-zero-vs-yield)

如果需要对此异常进行后续的分析，可以参考我的另一篇博客：

- [C#/.NET 如何获取一个异常（Exception）的关键特征，用来判断两个异常是否表示同一个异常 - 吕毅](/post/get-the-key-descriptor-of-an-exception)
