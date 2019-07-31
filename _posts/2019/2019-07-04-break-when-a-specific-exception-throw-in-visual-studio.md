---
title: "在 Visual Studio 中设置当发生某个特定异常或所有异常时中断"
date: 2019-07-04 13:07:52 +0800
categories: dotnet csharp visualstudio
position: starter
---

当使用 Visual Studio 调试的时候，如果我们的代码中出现了异常，那么 Visual Studio 会让我们的程序中断，然后我们就能知道程序中出现了异常。但是，如果这个异常已经被 `catch` 了，那么默认情况下 Visual Studio 是不会帮我们中断的。

能否在这个异常发生的第一时间让 Visual Studio 中断程序以便于我们调试呢？本文将介绍方法。

---

## 会中断的异常

看下面这一段代码，读取一个根本不存在的文件。我们都知道这会抛出 `FileNotFoundException`，随后 Visual Studio 会中断，然后告诉我们这句话发生了异常。

```csharp
using System;
using System.IO;

namespace Walterlv.Demo.DoubiBlogs
{
    internal class Program
    {
        private static void Main(string[] args)
        {
            File.ReadAllText(@"C:\walterlv\逗比博客\不存在的文件.txt");
        }
    }
}
```

![Visual Studio 异常中断](/static/posts/2019-07-04-09-28-21.png)

## 不会中断的异常

现在，我们为这段会出异常的代码加上 `try`-`catch`：

```csharp
using System;
using System.IO;

namespace Walterlv.Demo.DoubiBlogs
{
    internal class Program
    {
        private static void Main(string[] args)
        {
            try
            {
                File.ReadAllText(@"C:\walterlv\逗比博客\不存在的文件.txt");
            }
            catch (IOException)
            {
                Console.WriteLine("出现了异常");
            }
        }
    }
}
```

现在再运行，会发现 Visual Studio 并没有在出现此异常的时候中断，而是完成了程序最终的输出，随后结束程序。

![程序正常结束，没有中断](/static/posts/2019-07-04-09-30-22.png)

## 设置发生所有异常时中断

有时我们会发现已经 `catch` 过的代码在后来也可能被证明有问题，于是希望即便被 `catch` 也要发生中断，以便在异常发生的第一时刻定位问题。

Visual Studio 提供了一个异常窗格，可以用来设置在发生哪些异常的时候一定会中断并及时给出提示。

异常窗格可以在“调试”->“窗口”->“异常设置”中打开：

![异常设置窗口的打开方法](/static/posts/2019-07-04-09-35-20.png)

在异常设置窗格中，我们可以将 `Common Language Runtime Exceptions` 选项打勾，这样任何 CLR 异常引发的时候 Visual Studio 都会中断而无论是否有 `catch` 块处理掉了此异常。

![将 CLR 异常打勾](/static/posts/2019-07-04-09-39-13.png)

如果需要恢复设置，点击上面的恢复成默认的按钮即可。

## 设置发生特定异常时中断或不中断

当然，你也可以不需要全部打勾，而是只勾选你期望诊断问题的那几个异常。你可以试试，这其实是一个非常繁琐的工作，你会在大量的异常名称中失去眼神而再也无法直视任何异常了。

![只勾选期望诊断问题的几个异常](/static/posts/2019-07-04-09-41-44.png)

所以更推荐的做法不是仅设置特定异常时中断，而是反过来设置——设置发生所有异常时中断，除了特定的一些异常之外。

方法是：

1. 将整个 `Common Language Runtime Exceptions` 打勾
1. 在实际运行程序之后，如果发生了一些不感兴趣的异常，那么就在下面的框中将此异常取消勾选即可

![设置发生此异常时中断](/static/posts/2019-07-04-09-45-06.png)

## 脱离 Visual Studio 设置

如果程序并不是在 Visual Studio 中运行，那么有没有方法进行中断呢？

一个做法是调用 `Debugger.Launch()`，但这样的话中断的地方就是在 `Debugger.Launch()` 所在的代码处，可能异常还没发生或者已经发生过了。

有没有方法可以在异常发生的那一刻中断呢？请阅读我的另一篇博客：

- [.NET/C# 中设置当发生某个特定异常时进入断点（不借助 Visual Studio 的纯代码实现）](/post/set-a-breakpoint-when-exception-occurred.html)
