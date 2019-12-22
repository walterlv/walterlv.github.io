---
title: "使用 Visual Studio 调试多进程的程序"
date: 2019-02-21 15:24:56 +0800
categories: dotnet visualstudio
position: knowledge
---

当你的编写的是一个多进程的程序的时候，调试起来可能会比较困难，因为 Visual Studio 默认只会把你当前设置的启动项目的启动调试。

本文将介绍几种用 Visual Studio 调试多进程程序的方法，然后给出每种方法的适用条件和优劣。

---

<div id="toc"></div>

## Visual Studio 多启动项目（推荐）

在 Visual Studio 的解决方案上点击右键，属性。在公共属性节点中选择启动项目。

在这里，你可以给多个项目都设置成启动项目，就像下图这样：

![设置多启动项目](/static/posts/2019-02-20-22-53-42.png)

当然，这些项目都必须要是能够启动的才行（不一定是可执行程序）。

此方案的好处是 Visual Studio 原生支持。但此方案的使用必须满足两个前提：

1. 要调试的多个进程必须是不同的项目编译出来的；
1. 这些项目之间的启动顺序不能有明显的依赖关系（所以你可能需要修改你的代码使得这两个进程之间可以互相唤起）。

## Microsoft Child Process Debugging Power Tool 插件（推荐）

### 安装和配置插件

请先安装 [Microsoft Child Process Debugging Power Tool](https://marketplace.visualstudio.com/items?itemName=vsdbgplat.MicrosoftChildProcessDebuggingPowerTool) 插件。

安装插件后启动 Visual Studio，可以在 Debug -> Other Debugging Targets 中找到 Child Process Debugging Settings。

![打开 Child Process Debugging Settings](/static/posts/2019-02-20-21-48-22.png)

然后你可以按照下图的设置开启此项目的子进程调试：

![设置子进程调试](/static/posts/2019-02-20-21-52-07.png)

### 配置项目启动选项

但是，子进程要能够调试，你还必须开启混合模式调试，开启方法请参见我的另一篇博客：[在 Visual Studio 新旧不同的 csproj 项目格式中启用混合模式调试程序（开启本机代码调试） - walterlv](/post/visual-studio-enable-native-code-debugging)。

现在，你只需要开始调试你的程序，那么你程序中启动的新的子进程都将可以自动加入调试。

### 例子源码和效果

现在，我们拿下面这段代码作为例子来尝试子进程的调试。下面的代码中，`if` 中的代码会运行在子进程中，而 `else` 中的代码会运行在主进程中。

```csharp
using System;
using System.Diagnostics;
using System.Linq;

namespace Walterlv.Debugging
{
    class Program
    {
        static void Main(string[] args)
        {
            if (args.Any())
            {
                Console.WriteLine("Walterlv child application");
                Console.WriteLine(string.Join(Environment.NewLine, args));
                Console.ReadLine();
            }
            else
            {
                Console.WriteLine("Walterlv main application");
                var process = new Process
                {
                    StartInfo = new ProcessStartInfo(Process.GetCurrentProcess().MainModule.FileName, "--child"),
                };
                process.Start();
                process.WaitForExit();
            }
        }
    }
}
```

我们在 `if` 和 `else` 中都打上断点。正常情况下运行，只有 `else` 中的代码可以进断点；而如果以上子进程调试配置正确，那么两边你都可以进入断点（如下图）。

![子进程进入了调试断点](/static/posts/2019-02-20-22-51-12.png)

值得注意的是，只要启动了本机代码调试，就不能在程序暂停之后修改代码了（像平时调试纯托管代码那样）。

## 在代码中编写“附加调试器”

调用 `Debugger.Launch()` 可以启动一个调试器来调试此进程。于是我们可以在我们被调试的程序中写下如下代码：

```csharp
#if DEBUG
    if (!Debugger.IsAttached)
    {
        Debugger.Launch();
    }
#endif
```

仅在 `DEBUG` 条件下，如果当前没有附加任何调试器，那么就启动一个新的调试器来调试它。

当存在以上代码时，运行会弹出一个对话框，用于选择调试器。

![选择调试器](/static/posts/2019-02-21-08-19-53.png)

这里选择的调试器有个不太方便的地方，如果调试器已经在使用，那么就不能选择。对于我们目前的场景，我们的主进程已经在调试了，所以子进程选择调试器的时候不能再选择主进程调试所用的 Visual Studio 了，而只能选择一个新的 Visual Studio；这一点很不方便。

对于此方法，我的建议是平常不要在团队项目中使用（这会让团队中的其他人不方便）。但是由于代码简单不需要配置，所以临时使用的话还是非常建议的。

## 在代码中调用 Visual Studio 的 COM 组件 API

编写中……

## 总结

综上，虽然我给出了 4 种不同的方法，但实际上没有任何一种方法能够像我们调试单个原生托管程序那样方便。每一种方法都各有优劣，一般情况下建议你使用我标注了“推荐”的方法；不过也建议针对不同的情况采用不同的方案。

1. 简单的个人项目，希望快速开始多进程/子进程调试
    - **使用附加调试器**
1. 你有多个项目组成的多进程，并且这些进程恰好可以互相唤起，它们之间的启动顺序不影响父子进程的组成
    - **使用 Visual Studio 的多启动项目**
1. 你只有单个项目组成的多进程，或者多个进程之间依赖于启动顺序来组成父子进程
    - **安装插件 [Microsoft Child Process Debugging Power Tool](https://marketplace.visualstudio.com/items?itemName=vsdbgplat.MicrosoftChildProcessDebuggingPowerTool)**

---

**参考资料**

- [Azure DevOps Blog - Introducing the Child Process Debugging Power Tool](https://devblogs.microsoft.com/devops/introducing-the-child-process-debugging-power-tool/)
- [Microsoft Child Process Debugging Power Tool - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=vsdbgplat.MicrosoftChildProcessDebuggingPowerTool)
- [attach a process to current visual studio debugger silently using command line ..](https://social.msdn.microsoft.com/Forums/vstudio/en-US/337c252e-98b3-4e88-b380-e9a58d88a706/attach-a-process-to-current-visual-studio-debugger-silently-using-command-line-?forum=vsdebug)
- [How to get DTE from Visual Studio process ID? – Kirill Osenkov](https://blogs.msdn.microsoft.com/kirillosenkov/2011/08/10/how-to-get-dte-from-visual-studio-process-id/)
- [How to start Visual Studio programmatically – Kirill Osenkov](https://blogs.msdn.microsoft.com/kirillosenkov/2009/03/03/how-to-start-visual-studio-programmatically/)
- [EnvDTE Namespace - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/envdte?view=visualstudiosdk-2017)
- [c# - Using the EnvDTE assembly - Stack Overflow](https://stackoverflow.com/a/19374401/6233938)
