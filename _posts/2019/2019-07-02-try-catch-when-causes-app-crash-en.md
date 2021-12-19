---
title: "App will crash when using the when keyword in a catch expression"
date: 2019-07-02 19:32:59 +0800
tags: dotnet csharp
position: problem
version:
  current: English
versions:
  - 中文: /post/try-catch-when-causes-app-crash.html
  - English: #
---

We know that we can add a `when` keyword after a `catch` filter. But if there is another exception happened in the `when` expression, the app will totally crash.

This happens in .NET Framework 4.8 but in .NET Core 3.0, it works correctly as the document says.

Maybe this is a bug in the .NET Framework 4.8 CLR.

---

本文使用 **多种语言** 编写，请选择你想阅读的语言：

{% include post-version-selector.html %}

<div id="toc"></div>

## The `when` in the official document

You can view the official document here:

- [Using User-Filtered Exception Handlers - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/exceptions/using-user-filtered-exception-handlers)

There is such a sentence here:

> The expression of the user-filtered clause is not restricted in any way. If an exception occurs during execution of the user-filtered expression, that exception is discarded and the filter expression is considered to have evaluated to false. In this case, the common language runtime continues the search for a handler for the current exception.

When there is an exception occurred in the when expression the exception will be ignored and the expression will return false.

## A demo

We can write a demo to verify this behavior of the official document.

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

Obviously, the `FileName` property will keep `null` in the first when expression and will cause a `NullReferenceException`. It is not recommended to write such the code but it can help us verify the behavior of the `catch`-`when` blocks.

If the official document is correct then we can get the output as `Try`-`Catch 2`-`End` because the exception in the `when` will be ignored and the outer `catch` will not catch it and then the `when` expression returns false so that the exception handling goes into the second one.

## In .NET Core 3.0 and in .NET Framework 4.8

The pictures below show the actual output of the demo code above in .NET Core 3.0 and in .NET Framework 4.8.

![.NET Core 3.0](/static/posts/2019-07-02-15-06-35.png)

![.NET Framework 4.8](/static/posts/2019-07-02-15-08-21.png)

Only in the .NET Core 3.0, the output behaves the same as the official document says. But in .NET Framework 4.8, the `End` even not appear in the output. We can definitely sure that the app crashes in .NET Framework 4.8.

If we run the app step by step in Visual Studio, we can see that a CLR exception happens.

![CLR error](/static/posts/2019-07-02-15-10-46.png)

This animated picture below shows how the code goes step by step.

![Step debugging](/static/posts/2019-07-02-catch-when-crash.gif)
