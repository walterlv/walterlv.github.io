---
title: "C#/.NET 使用 CommandLineParser 来标准化地解析命令行"
publishDate: 2018-12-22 23:22:41 +0800
date: 2018-12-30 16:10:22 +0800
tags: dotnet csharp
position: knowledge
coverImage: /static/posts/2018-12-22-22-56-11.png
permalink: /post/introduce-command-line-parser.html
---

`CommandLineParser` 是一款用于解析命令行参数的 NuGet 包。你只需要关注你的业务，而命令行解析只需要极少量的配置代码。

本文将介绍如何使用 `CommandLineParser` 高效写出自己程序的命令行解析部分。

---

<div id="toc"></div>

## NuGet 包和 GitHub 开源仓库

- NuGet 包：[CommandLineParser](https://www.nuget.org/packages/CommandLineParser/)
- GitHub 开源仓库：[commandlineparser/commandline](https://github.com/commandlineparser/commandline)

## 最简单的命令行解析

```csharp
using System;
using System.Collections.Generic;
using CommandLine;

namespace Walterlv.Demo
{
    class Program
    {
        public class Options
        {
            [Option('f', "file", Required = true, HelpText = "需要处理的文件。")]
            public IEnumerable<string> Files { get; set; }

            [Option('o', "override", Required = false, HelpText = "是否覆盖原有文件。")]
            public bool Override { get; set; }
        }

        static void Main(string[] args)
        {
            Parser.Default.ParseArguments<Options>(args).WithParsed(Run);
        }

        private static void Run(Options option)
        {
            // 使用解析后的命令行参数进行操作。
            foreach (var file in option.Files)
            {
                var verb = option.Override ? "覆盖" : "使用";
                Console.WriteLine($"walterlv 正在{verb}文件 {file}");
            }
        }
    }
}
```

这个简单的 Demo 程序使用 `Options` 类来封装命令行参数，`Parser.Default.ParseArguments` 解析到的参数将存入 `Options` 类型的实例中。而只需要加上 `WithParsed` 即可在一个新的方法中使用我们解析后的 `Options` 实例。

这时，在命令行中就可以使用命令了：

```powershell
dotnet demo.dll -f C:\Users\lvyi\Desktop\Test.txt
```

![在命令行中使用命令](/static/posts/2018-12-22-22-56-11.png)

由于我们标记 `Files` 是必要属性，所以如果此参数没有指定，将返回命令行的使用说明。此使用说明中就包含了我们在 `Option` 参数中编写的 `HelpText`。

如果你的 `Options` 类中单次是多单词的短语，那么建议在指定名称的时候为每一个单词之间添加一个空格。这样参数就不会让多个单词连成一片难以辨认。

例如：

```csharp
public class Options
{
    [Option("long-name", Required = true, HelpText = "需要处理的文件。")]
    public string LongName { get; set; }
}
```

那么命令是：

```powershell
dotnet demo.dll --long-name xxx
```

如果不指定，那么就是 `--longname`，这显然不好看。

## 包含多个方法的命令行解析

如果一个命令行程序只做一件事情，那么以上代码足以应付大多数的情况。可是有时候一个命令行程序是为了做一类事情的 —— 典型的例子就是 git 程序。当你运行 git 的时候，你可以在 git 后面加一个谓词（动词），表示执行的是哪一个命令。后面的参数是每个命令都不同的，并且第一个参数是不用指定名称的。

```csharp
using System;
using System.Collections.Generic;
using System.Diagnostics;
using CommandLine;

namespace Walterlv.Demo
{
    [Verb("check", HelpText = "检查")]
    class CheckOptions
    {
        [Value(0, HelpText = "一个 .sln 文件，一个或者多个 .csproj 文件。")]
        public IEnumerable<string> InputFiles { get; set; }
    }

    [Verb("fix", HelpText = "修复")]
    class FixOptions
    {
        [Value(0, HelpText = "一个 .sln 文件，一个或者多个 .csproj 文件。")]
        public IEnumerable<string> InputFiles { get; set; }

        [Option('o', "outputFiles", Required = true, HelpText = "修复之后的文件集合。")]
        public IEnumerable<string> OutputFiles { get; set; }

        [Option(Required = false, HelpText = "是否自动决定版本号，这将使用冲突版本号中的最新版本。")]
        public bool AutoVersion { get; set; }
    }

    class Program
    {
        static int Main(string[] args)
        {
            var exitCode = Parser.Default.ParseArguments<CheckOptions, FixOptions>(args)
                .MapResult(
                    (CheckOptions o) => CheckSolutionOrProjectFiles(o),
                    (FixOptions o) => FixSolutionOrProjectFiles(o),
                    error => 1);
            return exitCode;
        }

        private static int CheckSolutionOrProjectFiles(CheckOptions options)
        {
            return 0;
        }

        private static int FixSolutionOrProjectFiles(FixOptions options)
        {
            return 0;
        }
    }
}
```

对于这一段程序，我们可以使用两种不同的谓词来执行命令：

```powershell
dotnet demo.dll check C:\Users\lvyi\Desktop\Test\Test.csproj
```

```powershell
dotnet demo.dll fix C:\Users\lvyi\Desktop\Test\Test.csproj -o C:\Users\lvyi\Desktop\TestFix\Test.csproj
```

## Verb，Option 和 Value

Verb 是在一个命令行选项的 Option 类上标记的，用于指定命令的类别。每一个 Verb 标记的类别都可以有自己独立的一套命令行参数。

Option 是命名的命令行参数。在命令行中，你必须指定命令行缩写或者全称来指定命令行参数的不同类型。

Value 是命令行的无名参数，它是靠在命令行谓词后面的参数位置来确定解析到哪一个属性上的。

---

**参考资料**

- [commandlineparser/commandline: The best C# command line parser that brings standardized *nix getopt style, for .NET. Includes F# support](https://github.com/commandlineparser/commandline)
- [Home · commandlineparser/commandline Wiki](https://github.com/commandlineparser/commandline/wiki)
- [C＃命令行解析工具 - 林德熙](https://blog.lindexi.com/post/C-%E5%91%BD%E4%BB%A4%E8%A1%8C%E8%A7%A3%E6%9E%90%E5%B7%A5%E5%85%B7.html)
- [The week in .NET – Command Line Parser Library, .NET South East - .NET Blog](https://blogs.msdn.microsoft.com/dotnet/2017/07/18/the-week-in-net-command-line-parser-library-net-south-east/)


