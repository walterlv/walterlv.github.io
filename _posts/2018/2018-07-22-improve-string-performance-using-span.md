---
title: ".NET/C# 使用 Span<T> 为字符串处理提升性能"
date: 2018-07-22 00:51:23 +0800
categories: dotnet csharp
---

.NET Core 2.1 和 C# 7.2 带来了 Span<T> 的原生支持，原本需要使用不安全代码操作的内存块现在可以使用安全的方式来完成。此前在性能和稳定性上需要有所取舍，而现在可以兼得了。

---

<div id="toc"></div>

## 简单的例子

先来看一个字符串处理时使用 `Span<T>` 的最简单的例子：

```csharp
using System;
using System.Text;

namespace Walterlv.Demo.StringSpan
{
    internal class Program
    {
        static void Main(string[] args)
        {
            var text = "https://walterlv.github.io/";
            var nameSpan = text.AsSpan(8, 8);

            var builder = new StringBuilder("Hello ");
            builder.Append(nameSpan);
            builder.AppendLine("!");

            Console.WriteLine(builder.ToString());
        }
    }
}
```

这个例子是从 <https://walterlv.github.io/> 字符串中取出第 8 个字符开始长度为 8 的部分，随后与其它字符串进行拼接。最后，我们得到了拼接的字符串：

![Hello walterlv!](/static/posts/2018-07-22-00-29-12.png)

这种方式取出字符串替代了 `SubString` 这种会额外生成临时字符串的方式。如果上述代码发生在较大或较多文本的处理中，那么反复的拼接将生成大量的临时字符串，造成大量 GC 压力；而使用 `Span<T>` 将不会额外生成任何临时字符串。

## 语言/框架的支持

然而，只有 .NET Core 2.1 是原生支持字符串的 `AsSpan<T>` 方法的，.NET Core 2.0、.NET Framework 4.7.2 是不支持的。.NET Core 2.0 可以无视，因为有了 2.1。但 .NET Framework 的低版本却不能无视，因为用户的计算机上通常都是安装低版本的 .NET Framework。

![只有 .NET Core 2.1 支持](/static/posts/2018-07-22-00-32-40.png)

然而我们可以安装 [System.Memory](https://www.nuget.org/packages/System.Memory/)，以在低版本的 .NET 中获得字符串扩展方法 `AsSpan<T>` 的支持。

那么问题来了，低版本的 .NET `StringBuilder` 中并没有提供 `Append(ReadOnlySpan<char>)` 方法，于是我们即便使用高性能的方式得到了字符串的一个片段，依然无法将其反复进行拼接。

**这真是一个悲伤的故事**！

## 低版本 .NET 中有限的字符串性能提升

缺少了 `StringBuilder` 对 `ReadOnlySpan<char>` 的支持，广泛使用的字符串拼接功能便没有办法获得 Span<T> 的支持。

不过，System.Memory 中提供了其它有限的字符串处理支持，来源于以下两个类型：

- `System.Buffers.Text.Utf8Parser`
- `System.Buffers.Text.Utf8Formatter`

前者提供从 `ReadOnlySpan<char>` 到 `Int32`、`Double`、`DateTime`、`Guid` 等类型的解析，后者提供相反的转换。

期待 Microsoft 在未来版本的 System.Memory 库中提供对字符串拼接在低版本 .NET 生态中的支持。

---

**参考资料**

- [Welcome to C# 7.2 and Span - .NET Blog](https://blogs.msdn.microsoft.com/dotnet/2017/11/15/welcome-to-c-7-2-and-span/)
- [C# 7.2: Understanding Span - Connect(); 2017 - Channel 9](https://channel9.msdn.com/Events/Connect/2017/T125)
- [C# Span 入门](https://blog.lindexi.com/post/C-Span-%E5%85%A5%E9%97%A8.html)
