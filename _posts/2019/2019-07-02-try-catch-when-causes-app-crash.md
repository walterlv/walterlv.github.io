---
title: ".NET Framework 的 bug？try-catch-when 中如果 when 语句抛出异常，程序将彻底崩溃"
date: 2019-07-02 19:32:25 +0800
categories: dotnet csharp
position: problem
version:
  current: 中文
versions:
  - 中文: #
  - English: /post/try-catch-when-causes-app-crash-en.html
---

在 .NET Framework 4.8 中，try-catch-when 中如果 when 语句抛出异常，程序将彻底崩溃。而 .NET Core 3.0 中不会出现这样的问题。

本文可能是正在像微软报告的一个 Bug。

---

This post is written in **multiple languages**. Please select yours:

{% include post-version-selector.html %}

<div id="toc"></div>

## 官方文档中 when 的行为

你可以前往官方文档：

- [使用用户筛选的异常处理程序 - Microsoft Docs](https://docs.microsoft.com/zh-cn/dotnet/standard/exceptions/using-user-filtered-exception-handlers)

在其中，你可以找到这样一段话：

> 用户筛选的子句的表达式不受任何限制。 如果在执行用户筛选的表达式期间发生异常，则将放弃该异常，并视筛选表达式的值为 false。 在这种情况下，公共语言运行时继续搜索当前异常的处理程序。

即当 `when` 块中出现异常时，`when` 表达式将视为值为 `false`，并且此异常将被忽略。

## 示例程序

鉴于官方文档中的描述，我们可以编写一些示例程序来验证这样的行为。

```csharp
using System;
using System.IO;

namespace Walterlv.Demo.CatchWhenCrash
{
    internal class Program
    {
        private static void Main(string[] args)
        {
            try
            {
                try
                {
                    Console.WriteLine("Try");
                    throw new FileNotFoundException();
                }
                catch (FileNotFoundException ex) when (ex.FileName.EndsWith(".png"))
                {
                    Console.WriteLine("Catch 1");
                }
                catch (FileNotFoundException)
                {
                    Console.WriteLine("Catch 2");
                }
            }
            catch (Exception)
            {
                Console.WriteLine("Catch 3");
            }
            Console.WriteLine("End");
        }
    }
}
```

很显然，我们直接 `new` 出来的 `FileNotFoundException` 的 `FileName` 属性会保持为 `null`。对其解引用会产生 `NullReferenceException`。很显然代码不应该这么写，但可以用来验证 `catch`-`when` 语句的行为。

按照官网描述，输出应该为 `Try`-`Catch 2`-`End`。因为 `when` 中的异常被忽略，因此不会进入到外层的 `catch` 块中；因为 `when` 中出现异常导致表达式值视为 `false`，因此进入了更合适的异常处理块 `Catch 2` 中。

## 在 .NET Core 3.0 中的行为和 .NET Framework 4.8 中的行为

下面两张图分别是这段代码在 .NET Core 3.0 和 .NET Framework 4.8 中的输出：

![.NET Core 3.0 中的行为](/static/posts/2019-07-02-15-06-35.png)

![.NET Framework 4.8 中的行为](/static/posts/2019-07-02-15-08-21.png)

可以注意到，只有 .NET Core 3.0 中的行为符合官方文档的描述，而 .NET Framework 4.8 中甚至连 `End` 都没有输出！几乎可以确定，程序在 .NET Framework 4.8 中出现了致命的崩溃！

如果我们以 Visual Studio 调试启动此程序，可以看到抛出了 CLR 异常：

![抛出了 CLR 异常](/static/posts/2019-07-02-15-10-46.png)

以下是在 Visual Studio 中单步跟踪的步骤：

![单步调试](/static/posts/2019-07-02-catch-when-crash.gif)
