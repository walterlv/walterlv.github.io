---
title: "异步任务中的重新进入（Reentrancy）"
publishDate: 2017-12-05 22:10:04 +0800
date: 2018-12-14 09:54:00 +0800
categories: csharp dotnet
---

一个按钮，点击执行一个任务。我们可能直接在它的 `Click` 事件中写下了执行任务的代码。

一般我们无需担心这样的代码会出现什么问题——**但是，这样的好事情只对同步任务有效；一旦进入了异步世界，这便是无尽的 BUG！**

---

<p id="toc"></p>

### 重新进入（Reentrancy）

```csharp
private void Button_Click(object sender, RoutedEventArgs e)
{
    DoSomething();
}

private void DoSomething()
{
    // 同步任务。
}
```

▲ 以上，在按钮点击事件中执行同步任务

上面的代码，无论我们在界面上多么疯狂地点击按钮，因为 UI 会在任务执行的过程中停止响应，所以 `DoSomething` 只会依次执行（还会偶尔忽略一些）。这通常不会造成什么问题，但如果 `DoSomething` 变成异步的 `DoSomethingAsync`（就像下面那样），那么情况就变得不同了。

```csharp
private async void Button_Click(object sender, RoutedEventArgs e)
{
    await DoSomethingAsync();
}

private async Task DoSomethingAsync()
{
    // 异步任务。
}
```

▲ 以上，在按钮点击事件中执行异步任务

由于任务执行的过程中 UI 依然是响应的，`DoSomethingAsync` 会因此在每一次点击的时候都进入。**在异步任务结束之前重新进入此异步任务的过程，叫做重新进入（Reentrancy）。**

### 重新进入的五种方式

微软在 [Handling Reentrancy in Async Apps (C#)](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/async/handling-reentrancy-in-async-apps?wt.mc_id=MVP) 一文中给出了重新进入的三种方式：

> 1. 禁用“开始”按钮
> 1. 取消和重启操作
> 1. 运行多个操作并将输出排入队列

从语言描述中就能知道除了第 2 点看起来具有通用性外，其他两点只为了解决文章中面临的“输出网页列表”问题。第 1 点其思想可以重用，但第 3 点就很难抽取公共的重新进入思想。于是，我总结其前两点，再额外补充两种重新进入的方式，和不处理一起作为五种不同的处理方法。

- 禁用重新进入
- 并发
- 取消然后重启操作
- 将异步任务放入队列中依次执行
- 仅执行第一次和最后一次

#### 禁用重新进入

禁用是最直接最简单也最彻底的重新进入问题解决办法。

```csharp
Button.IsEnabled = false;
await DoSomethingAsync();
Button.IsEnabled = true;
```

既然重新进入可能出问题，那我们就禁止重新进入好了……

#### 并发

当然，不处理也是一种方法。这意味着我们需要真的考虑 `DoSomethingAsync` 并发造成的影响。

#### 取消然后重启操作

取消，然后重新执行一次，这也是常见的重新进入类型。浏览器或者资讯类 APP 中的刷新功能就是这种重新进入方式最常见的应用场景，用户重新执行一次刷新，可能因为前面那一次（因为网络问题或其他原因）太慢，所以重新开始。

#### 将异步任务放入队列中依次执行

放入队列中是因为此异步任务的顺序是很重要的，要求每一次执行且保持顺序一致。典型的应用场景是每一次执行都需要获取或生成一组数据输出（到屏幕、文件或者其他地方）。

#### 仅执行第一次和最后一次

如果用户每一次执行此异步任务都会获取当前应用程序的最新状态，然后根据最新状态执行；那么如果状态更新了，对旧状态执行多少次都是浪费的。

比如保存文件的操作。第一次进入异步任务的时候会进行保存，如果保存过程没有结束又触发新的保存，则等上一次保存结束之后再执行保存操作即可。而如果第一次保存没有结束的时候又触发非常多次的保存，也只需要在第一次结束之后再保存一次即可，毕竟既然最后一次保存时的状态已经是最新状态，不需要再把之前旧的状态保存一次。

---

#### 参考资料

- [Handling Reentrancy in Async Apps (C#) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/async/handling-reentrancy-in-async-apps?wt.mc_id=MVP)
- [处理异步应用中的重新进入 (C#) - Microsoft Docs](https://docs.microsoft.com/zh-cn/dotnet/csharp/programming-guide/concepts/async/handling-reentrancy-in-async-apps?wt.mc_id=MVP)
