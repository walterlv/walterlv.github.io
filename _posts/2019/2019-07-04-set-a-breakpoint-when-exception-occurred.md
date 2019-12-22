---
title: ".NET/C# 中设置当发生某个特定异常时进入断点（不借助 Visual Studio 的纯代码实现）"
date: 2019-07-04 13:26:55 +0800
categories: dotnet csharp
position: problem
---

使用 Visual Studio 可以帮助我们在发生异常的时候中断，便于我们调试程序出现异常那一时刻的状态。如果没有 Visual Studio 的帮助（例如运行已发布的程序），当出现某个或某些特定异常的时候如何能够迅速进入中断的环境来调试呢？

本文介绍如何实现在发生特定异常时中断，以便调查此时程序的状态的纯代码实现。

---

## 第一次机会异常

.NET 程序代码中的任何一段代码，在刚刚抛出异常，还没有被任何处理的那一时刻，AppDomain 的实例会引发一个 FirstChanceException 事件，用于通知此时刚刚开始发生了一个异常。

于是我们可以通过监听第一次机会异常来获取到异常刚刚发生那一刻而还没有被 `catch` 的状态：

```csharp
using System;
using System.IO;
using System.Runtime.ExceptionServices;

namespace Walterlv.Demo.DoubiBlogs
{
    internal class Program
    {
        private static void Main(string[] args)
        {
            AppDomain.CurrentDomain.FirstChanceException += OnFirstChanceException;

            // 这里是程序的其他代码。
        }

        private static void OnFirstChanceException(object sender, FirstChanceExceptionEventArgs e)
        {
            // 在这里，可以通过 e.Exception 来获取到这个异常。
        }
    }
}
```

## 在第一次机会异常处中断

我在这篇博客中举了一个例子来说明如何在发生异常的时候中断，不过是使用 Visual Studio：

- [在 Visual Studio 中设置当发生某个特定异常或所有异常时中断](/post/break-when-a-specific-exception-throw-in-visual-studio)

那么现在我们使用第一次机会异常来完善一下其中的代码：

```csharp
using System;
using System.IO;
using System.Runtime.ExceptionServices;

namespace Walterlv.Demo.DoubiBlogs
{
    internal class Program
    {
        private static void Main(string[] args)
        {
            AppDomain.CurrentDomain.FirstChanceException += OnFirstChanceException;

            try
            {
                File.ReadAllText(@"C:\walterlv\逗比博客\不存在的文件.txt");
            }
            catch (IOException)
            {
                Console.WriteLine("出现了异常");
            }
        }

        private static void OnFirstChanceException(object sender, FirstChanceExceptionEventArgs e)
        {
            // 现在，我们使用 Debugger.Break() 来中断程序。
            Debugger.Break();
        }
    }
}
```

保持 Visual Studio 异常设置窗格中的异常设置处于默认状态（意味着被 `catch` 的异常不会在 Visual Studio 中中断）。

现在运行这个程序，你会发现程序发生了中断，在我们写下了 `Debugger.Break()` 的那段代码上。

![程序发生中断](/static/posts/2019-07-04-13-08-47.png)

而在这个时候查看 Visual Studio 中程序的堆栈，可以发现其实调用堆栈是接在一开始发生异常的那一个方法的后面的，而且是除了非托管代码之外帧都是相邻的。

![应用程序堆栈](/static/posts/2019-07-04-10-28-05.png)

双击 Visual Studio 堆栈中亮色的帧，即可定位到我们自己写的代码。因此，双击第一个亮色的帧可以转到我们自己写的代码中第一个引发异常的代码块。这个时候可以查看应用程序中各处的状态，这正好是发生此熠时的状态（而不是 `catch` 之后的状态）。

## 优化代码和提示

为了让这段代码包装得更加“魔性”，我们可以对第一次机会异常的事件加以处理。现在，我们这么写：

```csharp
[DebuggerStepThrough, DebuggerNonUserCode]
private static void OnFirstChanceException(object sender, FirstChanceExceptionEventArgs e)
    => ExceptionDebugger.Break();
```

用到的 `ExceptionDebugger` 类型如下：

```csharp
using System.Diagnostics;

namespace Walterlv.Demo.DoubiBlogs
{
    internal class ExceptionDebugger
    {
        // 现在请查看 Visual Studio 中的堆栈以迅速定位刚刚发生异常时的程序状态。
        // 如果你按下 F10，可以立刻但不跳转到你第一个出现异常的代码块中。
        private static void BreakCore() => Debugger.Break();




        // 现在请查看 Visual Studio 中的堆栈以迅速定位刚刚发生异常时的程序状态。
        // 如果你按下 F10，可以立刻但不跳转到你第一个出现异常的代码块中。
        private static void LaunchCore() => Debugger.Launch();




        [DebuggerStepThrough, DebuggerNonUserCode]
        internal static void Break()
        {
            if (Debugger.IsAttached)
            {
                BreakCore();
            }
            else
            {
                LaunchCore();
            }
        }
    }
}
```

现在，发生了第一次机会异常的时候，会断点在我们写的 `BreakCore` 方法上。这里的代码很少，因此开发者看到这里的时候可以很容易地注意到上面的注释以了解到如何操作。

![自己设的断点](/static/posts/2019-07-04-13-18-59.png)

现在再看堆栈，依然像前面一样，找到第一个亮色的帧可以找到第一个抛出异常的我们的代码。

![调用堆栈](/static/posts/2019-07-04-13-18-19.png)

注意，我们在从第一次机会异常到后面中断的代码中，都设置了这两个特性：

- `DebuggerStepThrough` 设置此属性可以让断点不会出现在写的这几个方法中
    - 于是，当你按下 F10 的时候，会跳过所有标记了此特性的方法，这可以直接跳转到最终发生异常的那段代码中去。
- `DebuggerNonUserCode` 设置此代码非用户编写的代码
    - 于是，在 Visual Studio 的堆栈中，我们会发现这几个方法会变成暗色的，Visual Studio 不会优先显式这部分的源代码，这可以让错误在最关键的代码中显示而不会被我们刚刚写的这些代码中污染。

## 附加调试器

前面的代码中，我们做了一个判断 `Debugger.IsAttached`。这是在判断，如果当前没有附加调试器，那么就附加一个。

于是这段代码可以运行在非 Visual Studio 的环境中，当出现了异常的时候，还可以补救选择一个调试器。

![附加调试器](/static/posts/2019-07-04-13-25-12.png)

当然，实际上附加到 Visual Studio 进行调试也是最佳的方法。只不过，我们不需要一定通过 Visual Studio，我们可以在一般测试代码的时候也能获得出现特定异常时立刻开始断点调查异常的特性。
