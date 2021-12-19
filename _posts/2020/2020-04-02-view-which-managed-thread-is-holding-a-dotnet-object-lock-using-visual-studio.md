---
title: "在 Visual Studio 2019 (16.5) 中查看托管线程正在等待的锁被哪个线程占用"
date: 2020-04-02 17:44:31 +0800
tags: dotnet visualstudio
position: knowledge
coverImage: /static/posts/2020-04-02-17-36-40.png
---

Visual Studio 2019 (16.5) 版本更新中带来了一项很小很难注意到却非常实用的功能，查看哪一个托管线程正在持有 .NET 对象锁。

如果你不了解这个功能如何使用，那么可以阅读本文。

---

<div id="toc"></div>

## 更新日志

Visual Studio 的官方更新日志中对此功能的描述：

> View which managed thread is holding a .NET object lock

即“查看托管线程正在持有 .NET 对象锁”。

## 功能入口

这个功能没有新的入口，你可以在“调用堆栈” (Call Stack) 窗口，“并行堆栈” (Parallel Stacks) 窗口，以及“线程”窗口的位置列中查看哪个托管线程正在持有 .NET 对象锁。

[Call Stack](https://devblogs.microsoft.com/visualstudio/wp-content/uploads/sites/4/2020/03/165GADebugger2.png)

## 示例

现在我们就实际看一下这个功能的用法和效果。于是我写了一点下面的代码。

```csharp
static void Main(string[] args)
{
    var locker = new object();

    Thread thread = new Thread(() =>
    {
        Console.WriteLine("后台线程尝试获得锁");
        lock (locker)
        {
            Console.WriteLine("后台线程成功获得锁");
        }
    })
    {
        Name = "walterlv thread",
    };

    Console.WriteLine("主线程尝试获得锁");
    Monitor.Enter(locker);
    Console.WriteLine("主线程成功获得锁");

    thread.Start();
}
```

在这段代码中，主线程获得锁之后直接退出，而新线程“walterlv thread”则尝试获得锁。

现在在 Visual Studio 2019 中运行这段代码，可以看到另一个线程是不可能获得锁的，于是不会输出最后那一句，其他都会输出。

![锁](/static/posts/2020-04-02-17-36-40.png)

随后我们在 Visual Studio 中点击“全部中断”，也就是那个“暂停”图标的按钮。

![全部中断](/static/posts/2020-04-02-17-37-25.png)

打开调用堆栈窗口（在“调试 -> 窗口 -> 调用堆栈”），可以看到堆栈最顶端显示了正在等待锁，并且指出了线程对象。

![正在等待某个线程的锁](/static/posts/2020-04-02-17-39-24.png)

然后在线程窗口（在“调试 -> 窗口 -> 线程“）的位置列，鼠标移上去可以看到与堆栈中相同的信息。

![在线程窗口中查看](/static/posts/2020-04-02-17-40-44.png)

当然，我们的主线程实际上早已直接退出了，所以正在等待的锁将永远不会释放（除非进程退出）。

同样的信息，在并行堆栈（在“调试 -> 窗口 -> 并行堆栈”）中也能看到。

![在并行堆栈中查看](/static/posts/2020-04-02-17-43-47.png)

---

**参考资料**
- [Visual Studio 2019 version 16.5 Release Notes - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/releases/2019/release-notes)
- [Visual Studio 2019 version 16.5 is now available - Visual Studio Blog](https://devblogs.microsoft.com/visualstudio/visual-studio-2019-version-16-5/)

