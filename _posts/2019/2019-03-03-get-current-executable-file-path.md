---
title: "四种方法获取可执行程序的文件路径（.NET Core / .NET Framework）"
publishDate: 2019-03-03 19:51:29 +0800
date: 2019-03-09 09:10:45 +0800
tags: dotnet csharp
position: knowledge
permalink: /posts/get-current-executable-file-path.html
---

本文介绍四种不同的获取可执行程序文件路径的方法。适用于 .NET Core 以及 .NET Framework。

---

<div id="toc"></div>

## 使用程序集信息获取

```csharp
var executablePath = Assembly.GetEntryAssembly().Location;
```

这种方式的思路是获取入口程序集所在的路径。不过 `Assembly.GetEntryAssembly()` 能获取到的程序集是入口托管程序集；使用此方法会返回第一个托管程序集。

只有 .NET Framework 程序的入口才是托管程序（exe）。而对于 .NET Core 程序，如果直接发布成带环境依赖声明的 dll，那么实际运行的进程是 dotnet.exe；而如果发布成自包含的 exe 程序，其主 exe 也是一个非托管的 CLR 启动器而已，并不是托管程序集。

所以此方法适用条件：

1. 必须是 .NET Framework 程序（.NET Core 程序不适用）

## 使用应用程序域信息获取

```csharp
var executablePath = AppDomain.CurrentDomain.SetupInformation.ApplicationBase;
```

这种方式的思路是获取当前 AppDomain 所在的文件夹。不过此方法也只是获取到文件夹而已，不包含文件名。

所以此方法适用条件：

1. 你不需要知道文件名，只是要一个程序所在的文件夹而已。

当然，此方法因为不涉及到托管和非托管程序集，所以与编译结果无关，适用于 .NET Core 和 .NET Framework 程序。

## 使用进程信息获取

```csharp
var executablePath = Process.GetCurrentProcess().MainModule.FileName;
```

这种方式的思路是获取当前进程可执行程序的完全路径。

对于 .NET Framework 程序，其 exe 就是这个路径。

对于 .NET Core 程序来说：

1. 如果发布成带环境依赖声明的 dll，那么此方法获取到的可执行程序名将是 dotnet.exe，这显然不会是我们预期的行为；
1. 如果发布成自包含的 exe，那么此方法获取到的可执行程序名就是程序自己的名称，这是期望的结果。

所以此方法适用条件：

1. 适用于 .NET Framework 程序；
1. 适用于发布成自包含的 .NET Core 程序。

## 使用命令行参数获取

我在另一篇博客中提到命令行参数中包含应用程序路径：

- [.NET 命令行参数包含应用程序路径吗？ - 吕毅](/post/when-will-the-command-line-args-contain-the-executable-path)

于是我们也可以通过命令行参数来获取到可执行程序的路径。

```csharp
var executablePath = Environment.GetCommandLineArgs()[0];
```

这种方法的效果和前面使用进程信息获取的效果是相同的，会获取到相同的可执行程序路径。

## 总结靠谱的方法

通过以上方法的说明，我们可以知道目前没有 100% 可靠的获取当前可执行程序文件路径的方法，不过可以组合多种方法达到 100% 可靠的目的。

1. 如果我们只需要获取程序所在的文件夹
    - 那么请直接使用 `AppDomain.CurrentDomain.SetupInformation.ApplicationBase`
1. 如果我们需要获取到可执行程序的完整路径
    - 先通过进程或者命令行参数的方式获取
        - `Process.GetCurrentProcess().MainModule.FileName`
        - `Environment.GetCommandLineArgs()[0]`
    - 如果得到的进程是 `dotnet.exe`，那么再通过程序集信息获取
        - `Assembly.GetEntryAssembly().Location`

另外，关于以上方法的性能对比，你可以参阅林德熙的博客：[dotnet 获取路径各种方法的性能对比](https://blog.lindexi.com/post/dotnet-%E8%8E%B7%E5%8F%96%E7%A8%8B%E5%BA%8F%E6%89%80%E5%9C%A8%E8%B7%AF%E5%BE%84%E7%9A%84%E6%96%B9%E6%B3%95.html)。
