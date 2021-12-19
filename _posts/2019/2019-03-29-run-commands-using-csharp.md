---
title: "C#/.NET 使用 git 命令行来操作 git 仓库"
publishDate: 2019-03-29 14:39:08 +0800
date: 2019-04-21 20:36:42 +0800
tags: dotnet csharp git
position: starter
coverImage: /static/posts/2019-03-29-14-19-19.png
permalink: /posts/run-commands-using-csharp.html
---

我们可以在命令行中操作 git，但是作为一名程序员，如果在大量重复的时候还手动敲命令行，那就太笨了。

本文介绍使用 C# 编写一个 .NET 程序来自动化地使用 git 命令行来操作 git 仓库。

这是一篇很基础的入门文章。

---

<div id="toc"></div>

## 最简单的运行 git 命令的代码

在 .NET 中，运行一个命令只需要使用 `Process.Start` 开启一个子进程就好了。于是要运行一个 `git` 命令，我们其实只需要这句足以：

```csharp
Process.Start("git", "status");
```

当然，直接能简写成 `git` 是因为 `git.exe` 在我的环境变量里面，一般开发者在安装 Git 客户端的时候，都会自动将此命令加入到环境变量。如果没有，你需要使用完整路径 `C:\Program Files\Git\mingw64\bin\git.exe` 只是每个人的路径可能不同，所以这是不靠谱的。

## 允许获得命令的输出

对于上节中写的 `Process.Start`，你一眼就能看出来这是完全没有用的代码。因为 `git status` 命令只是获得仓库当前的状态，这个命令完全不影响仓库，只是为了看状态的。

所以，命令最好要能够获得输出。

而要获得输出，你需要使用 `ProcessStartInfo` 来指定如何启动一个进程。

```csharp
var info = new ProcessStartInfo(ExecutablePath, arguments)
{
    CreateNoWindow = true,
    RedirectStandardOutput = true,
    UseShellExecute = false,
    WorkingDirectory = WorkingDirectory,
};
```

需要设置至少这四个属性：

- `CreateNoWindow` 表示不要为这个命令单独创建一个控制台窗口
    - 实际上如果使用此代码的程序也是一个控制台程序，这句是没有必要的，因为子进程会共用父进程的控制台窗口；但是对于 GUI 程序来说，这句还是很重要的，这可以避免在执行命令的过程中意外弹出一个黑色的控制台窗口出来。
- `RedirectStandardOutput` 进行输出的重定向
    - 这是一定要设置为 `true` 的属性，因为我们希望拿到命令的输出结果。
- `WorkingDirectory` 设置工作路径
    - 本来这是一个可选设置，不过对于 `git` 命令来说，一般都是对一个已有的 git 仓库进行操作，所以当然要指定一个合理的 git 仓库了。
- `UseShellExecute` 设置为 `false` 表示不要使用 `ShellExecute` 函数创建进程
    - 此属性的详细说明，请阅读我的另一篇博客：[ProcessStartInfo 中的 UseShellExecute - 吕毅](/post/use-shell-execute-in-process-start-info)。
    - 这里我们必须指定为 `false`，因为要重定向输出的话，这是唯一有效值。顺便一提，此属性如果不设置，默认值是 `true`。

## CommandRunner

为了方便起见，我将全部运行一个命令的代码封装到了一个 `CommandRunner` 的类当中。

```csharp
using System;
using System.Diagnostics;
using System.IO;

namespace Walterlv.GitDemo
{
    public class CommandRunner
    {
        public string ExecutablePath { get; }
        public string WorkingDirectory { get; }

        public CommandRunner(string executablePath, string? workingDirectory = null)
        {
            ExecutablePath = executablePath ?? throw new ArgumentNullException(nameof(executablePath));
            WorkingDirectory = workingDirectory ?? Path.GetDirectoryName(executablePath);
        }

        public string Run(string arguments)
        {
            var info = new ProcessStartInfo(ExecutablePath, arguments)
            {
                CreateNoWindow = true,
                RedirectStandardOutput = true,
                UseShellExecute = false,
                WorkingDirectory = WorkingDirectory,
            };
            var process = new Process
            {
                StartInfo = info,
            };
            process.Start();
            return process.StandardOutput.ReadToEnd();
        }
    }
}
```

## 测试与结果

以上 `CommandRunner` 命令的使用非常简单，`new` 出来之后，得到一个可以用来执行命令的实例，然后每次执行调用 `Run` 方法传入参数即可。

```csharp
var git = new CommandRunner("git", @"D:\Developments\Blogs\walterlv.github.io");
git.Run("add .");
git.Run(@"commit -m ""这是自动提交的""");
```

如果需要获得命令的执行结果，直接使用 `Run` 方法的返回值即可。

比如下面我贴了 `Main` 函数的完整代码，可以输出我仓库的当前状态：

```csharp
using System;

namespace Walterlv.GitDemo
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("walterlv 的自动 git 命令");

            var git = new CommandRunner("git", @"D:\Developments\Blogs\walterlv.github.io");
            var status = git.Run("status");

            Console.WriteLine(status);
            Console.WriteLine("按 Enter 退出程序……");
            Console.ReadLine();
        }
    }
}
```

![运行结果](/static/posts/2019-03-29-14-19-19.png)


