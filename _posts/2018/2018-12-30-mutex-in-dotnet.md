---
title: ".NET 中使用 Mutex 进行跨越进程边界的同步"
date: 2018-12-30 16:41:54 +0800
categories: dotnet windows csharp
position: knowledge
---

Mutex 是 Mutual Exclusion 的缩写，是互斥锁，用于防止两个线程同时对计算机上的同一个资源进行访问。不过相比于其他互斥的方式，Mutex 能够跨越线程边界。

---

<div id="toc"></div>

## Mutex 是什么？

与其他线程同步的方式一样，Mutex 也提供对资源的互斥访问；不过 Mutex 使用的系统资源会比 Monitor 更多，而 Monitor 就是实现 C# 中 lock 关键字所用的锁。

用更多的系统资源，带来更强大的功能 —— Mutex 能进行跨越应用程序域边界的封送，能进行跨越进程边界的线程同步。

## 简单的 Mutex（不能跨进程互斥）

最简单的 Mutex 的使用方法就是直接 `new` 出来，然后使用 `Wait` 进行等待，使用 `ReleaseMutex` 进行释放。

```csharp
private readonly Mutex _mutex = new Mutex();

private void UseResource()
{
    _mutex.WaitOne();
    
    // 等待一小段时间，假装正在使用公共资源。这里的一段代码在单个进程之内将无法重入。
    Thread.Sleep(500);

    _mutex.ReleaseMutex();
}
```

参数中有一个 `initiallyOwned` 参数，如果指定为 `true` 表示创建这个 Mutex 的线程拥有这个资源（不需要等待），当这个线程调用 `ReleaseMutex` 之后其他线程的 `WaitOne` 才会生效。

不过这种方式不能达到跨进程同步的效果，所以实际上本文并不会过多描述这种互斥方式。

## 创建跨进程互斥的 Mutex

要创建跨进程互斥的 Mutex，必须要给 Mutex 指定名称。

使用 `new Mutex(false, "Walterlv.Mutex")` 创建一个命名的互斥锁，以便进行跨进程的资源互斥访问。

在使用这个构造函数重载的时候，第一个参数 `initiallyOwned` 建议的取值为 `false`。因为当你指定为 `true` 时，说明你希望此线程是初始创建此 `Mutex` 的线程，然而由于你是直接 `new` 出来的，所以你实质上是无法得知你到底是不是第一个 `new` 出来的。

```csharp
class Program
{
    static async Task Main(string[] args)
    {
        var program = new Program();
        while (true)
        {
            // 不断地尝试访问一段资源。这样，当多个进程运行的时候，可以很大概率模拟出现资源访问冲突。
            program.UseResource();
            await Task.Delay(50);
        }
    }


    private void UseResource()
    {
        var mutex = new Mutex(false, "Walterlv.Mutex");
        mutex.WaitOne();

        // 正在使用公共资源。
        // 这里的一段代码将无法重入，即使是两个不同的进程。
        var path = @"C:\Users\lvyi\Desktop\walterlv.log";
        Console.WriteLine($"[{DateTime.Now:O}] 开始写入文件……");
        File.AppendAllText(path, $"[{DateTime.Now:O}] 开始写入文件……", Encoding.UTF8);
        Thread.Sleep(1000);
        File.AppendAllText(path, $"[{DateTime.Now:O}] 写入文件完成。", Encoding.UTF8);
        Console.WriteLine($"[{DateTime.Now:O}] 写入文件完成。");

        mutex.ReleaseMutex();
    }
}
```

注意此程序在两个进程下的运行效果，明明我们等待使用资源的时间间隔只有 50 ms，但实际上等待时间是 1000 ms 左右。在关掉其中一个进程之后，间隔恢复到了 50 ms 左右。

这说明 Mutex 的等待在这里起到了跨进程互斥的作用。

![以上代码在两个进程下的运行结果](/static/posts/2018-12-30-named-mutex-demo.gif)

当你需要在是否是第一次创建出来的时候进行一些特殊处理，就使用带 `createdNew` 参数的构造函数。

```diff
    private void UseResource()
    {
--      var mutex = new Mutex(false, "Walterlv.Mutex");
++      var mutex = new Mutex(true, "Walterlv.Mutex", out var createdNew);

--      mutex.WaitOne();
++      // 如果这个 Mutex 是由此处创建出来的，即 createdNew 为 true，说明第一个参数 initiallyOwned 是真的发生了，于是我们就不需要等待。
++      // 反之，当 createdNew 为 false 的时候，说明已经有一个现成的 Mutex 已经存在，我们在这里需要等待。
++      if (!createdNew)
++      {
++          mutex.WaitOne();
++      }
        ……
        mutex.ReleaseMutex();
    }
```

## 处理异常情况

### ApplicationException

`mutex.ReleaseMutex();` 方法只能被当前拥有它的线程调用，如果某个线程试图调用这个函数，却没有拥有这个 Mutex，就会抛出 `ApplicationException`。

怎样为拥有呢？还记得前面构造函数中的 `initiallyOwned` 参数吗？就是在指定自己是否是此 Mutex 的拥有者的（实际上我们还需要使用 `createdNew` 来辅助验证这一点）。

当一个线程没有拥有这个 Mutex 的时候，需要使用 `WaitOne` 来等待获得这个锁。

### AbandonedMutexException

```csharp
class Program
{
    static async Task Main(string[] args)
    {
        // 开启一个线程，在那个线程中丢掉获得的 Mutex。
        var thread = new Thread(AbandonMutex);
        thread.Start();

        // 不要让进程退出，否则 Mutex 就会被系统回收。
        Console.Read();
    }

    private static void AbandonMutex()
    {
        // 获得一个 Mutex，然后就不再释放了。
        // 由于此线程会在 WaitOne 执行结束后退出，所以这个 Mutex 就被丢掉了。
        var mutex = new Mutex(false, "Walterlv.Mutex");
        mutex.WaitOne();
    }
}
```

上面的这段代码，当你第一次运行此进程并且保持此进程不退出的时候并没有什么异样。但是你再启动第二个进程实例的话，就会在 `WaitOne` 那里收到一个异常 —— `AbandonedMutexException`。

所以如果你不能在一处代码中使用 `try-finally` 来确保在获得锁之后一定会释放的话，那么强烈建议在 `WaitOne` 的时候捕获异常。顺便提醒，`try-finally` 中不能有异步代码，你可以参见：[在有 UI 线程参与的同步锁（如 AutoResetEvent）内部使用 await 可能导致死锁](/post/deadlock-if-await-in-ui-lock-context.html)。

也就是说，当你需要等待的时候，`catch` 一下异常。在 `catch` 完之后，你并不需要再次使用 `WaitOne` 来等待，因为即便发生了异常，你也依然获得了锁。这一点你可以通过调用 `ReleaseMutex` 来验证，因为前面我们说了只有拥有锁的线程才可以释放锁。

```csharp
private static void WaitOne()
{
    var mutex = new Mutex(false, "Walterlv.Mutex");
    try
    {
        mutex.WaitOne();
    }
    catch (AbandonedMutexException ex)
    {
        Console.WriteLine("发现被遗弃的锁");
    }
    Console.WriteLine("获得了锁");
}
```

---

**参考资料**

- [Mutexes - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/threading/mutexes)
- [Mutex Constructor (System.Threading) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/system.threading.mutex.-ctor)
- [Mutex Class (System.Threading) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/system.threading.mutex)
