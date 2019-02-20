---
title: "使用 Visual Studio 调试多进程的程序"
date: 2019-02-20 22:51:40 +0800
categories: dotnet visualstudio
position: knowledge
---

当你的编写的是一个多进程的程序的时候，调试起来可能会比较困难，因为 Visual Studio 默认只会把你当前设置的启动项目的启动调试。

本文将介绍几种用 Visual Studio 调试多进程程序的方法，然后给出每种方法的适用条件和优劣。

---

<div id="toc"></div>

### Visual Studio 多启动项目（推荐）

### Microsoft Child Process Debugging Power Tool 插件（推荐）

#### 安装和配置插件

请先安装 [Microsoft Child Process Debugging Power Tool](https://marketplace.visualstudio.com/items?itemName=vsdbgplat.MicrosoftChildProcessDebuggingPowerTool) 插件。

安装插件后启动 Visual Studio，可以在 Debug -> Other Debugging Targets 中找到 Child Process Debugging Settings。

![打开 Child Process Debugging Settings](/static/posts/2019-02-20-21-48-22.png)

然后你可以按照下图的设置开启此项目的子进程调试：

![设置子进程调试](/static/posts/2019-02-20-21-52-07.png)

#### 配置项目启动选项

但是，子进程要能够调试，你还必须开启混合模式调试，开启方法请参见我的另一篇博客：[在 Visual Studio 新旧不同的 csproj 项目格式中启用混合模式调试程序（开启本机代码调试） - walterlv](/post/visual-studio-enable-native-code-debugging.html)。

现在，你只需要开始调试你的程序，那么你程序中启动的新的子进程都将可以自动加入调试。

#### 例子源码和效果

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

### 在代码中编写“附加调试器”

### 在代码中调用 Visual Studio 的 COM 组件 API

### 总结

---

#### 参考资料

- [attach a process to current visual studio debugger silently using command line ..](https://social.msdn.microsoft.com/Forums/vstudio/en-US/337c252e-98b3-4e88-b380-e9a58d88a706/attach-a-process-to-current-visual-studio-debugger-silently-using-command-line-?forum=vsdebug)
- [How to get DTE from Visual Studio process ID? – Kirill Osenkov](https://blogs.msdn.microsoft.com/kirillosenkov/2011/08/10/how-to-get-dte-from-visual-studio-process-id/)
- [How to start Visual Studio programmatically – Kirill Osenkov](https://blogs.msdn.microsoft.com/kirillosenkov/2009/03/03/how-to-start-visual-studio-programmatically/)
- [EnvDTE Namespace - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/envdte?view=visualstudiosdk-2017)
- [c# - Using the EnvDTE assembly - Stack Overflow](https://stackoverflow.com/a/19374401/6233938)
