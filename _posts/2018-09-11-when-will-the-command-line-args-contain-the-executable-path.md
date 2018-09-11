---
title: ".NET 命令行参数包含应用程序路径吗？"
date: 2018-09-11 21:28:09 +0800
categories: dotnet csharp
---

如果你关注过命令行参数，也许发现有时你会在命令行参数的第一个参数中中看到应用程序的路径，有时又不会。那么什么情况下有路径呢？

---

其实是否有路径只是取决于获取命令行参数的时候用的是什么方法。而这是 Windows 操作系统的机制，与具体的运行环境无关。

<div id="toc"></div>

### 测试程序

考虑下面这样的测试程序：

```csharp
using System;
using System.Globalization;

namespace Walterlv.Demo.CommandLines
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine($"参数总数：{args.Length}");
            OutputArgsInfo(args);

            Console.WriteLine($"按任意键继续……");
            Console.ReadKey();
        }

        private static void OutputArgsInfo(string[] args)
        {
            var digitCount = (args.Length - 1).ToString(CultureInfo.InvariantCulture).Length;

            for (var i = 0; i < args.Length; i++)
            {
                Console.WriteLine($"[{i.ToString().PadLeft(digitCount, ' ')}] {args[i]}");
            }
        }
    }
}
```

当我们向命令行中传入参数的时候，我们可以得到所有的命令行。

![Main 函数中的命令行参数](/static/posts/2018-09-11-21-13-55.png)  
▲ Main 函数中的命令行参数

这种行为与具体的 .NET SDK 无关。看我们的项目文件，可以发现，无论是老旧的 .NET Framework 4.5 还是新的 .NET Framework 4.7.2 还是更加主流的 .NET Core 2.1，命令行参数中都是没有应用程序路径的。

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFrameworks>net45;net472;netcoreapp2.1</TargetFrameworks>
  </PropertyGroup>

</Project>
```

那为什么有时候会看到应用程序路径呢？

### 解释

在《Windows 核心编程》一书中有说到：

> 可以获得一个指向进程的完整命令行的指针，方法是调用 GetCommandLine 函数：
> ```cpp
> PTSTR GetCommandLine();
> ```
> 该函数返回一个指向包含完整命令行的缓存的指针，该命令行包括执行文件的完整路径名。

也就是说，调用 `GetCommandLine` 函数时，我们将得到包含执行文件的完整路径名的命令行参数。这个方法对应到 .NET 中，是 `System.Environment.GetCommandLineArgs()`。

于是修改我们刚刚的函数，加上 `Environment.GetCommandLineArgs()` 的调用：

```csharp
using System;
using System.Globalization;

namespace Walterlv.Demo.CommandLines
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine($"Main 函数参数列表中参数总数：{args.Length}");
            OutputArgsInfo(args);

            args = Environment.GetCommandLineArgs();
            Console.WriteLine($"GetCommandLineArgs 参数总数：{args.Length}");
            OutputArgsInfo(args);

            Console.WriteLine($"按任意键继续……");
            Console.ReadKey();
        }

        private static void OutputArgsInfo(string[] args)
        {
            var digitCount = (args.Length - 1).ToString(CultureInfo.InvariantCulture).Length;

            for (var i = 0; i < args.Length; i++)
            {
                Console.WriteLine($"[{i.ToString().PadLeft(digitCount, ' ')}] {args[i]}");
            }
        }
    }
}
```

现在，我们能看到参数列表中多了应用程序的完整路径：

![GetCommandLineArgs 中的命令行参数](/static/posts/2018-09-11-21-22-43.png)  
▲ GetCommandLineArgs 中的命令行参数

事实上这样的差异不止在 .NET 中有体现，整个 Windows 上的程序都是这样的特性。这在《Windows 核心编程》一书中是有说明的。

### 总结

1. Main 函数的参数中不包含应用程序执行路径；
1. `System.Environment.GetCommandLineArgs()` 得到的命令行参数中包含应用程序的执行路径；
1. Windows 上的所有程序其命令行参数的行为表现都是如此，这不是 .NET 的专属特性。
