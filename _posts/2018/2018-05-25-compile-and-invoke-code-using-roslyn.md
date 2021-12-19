---
title: "Roslyn 入门：使用 .NET Core 版本的 Roslyn 编译并执行跨平台的静态的源码"
publishDate: 2018-05-25 21:24:08 +0800
date: 2021-08-30 10:40:55 +0800
tags: visualstudio dotnet csharp roslyn
coverImage: /static/posts/2018-05-25-20-17-01.png
permalink: /post/compile-and-invoke-code-using-roslyn.html
---

Roslyn 是微软为 C# 设计的一套分析器，它具有很强的扩展性。以至于我们只需要编写很少量的代码便能够编译并执行我们的代码。

作为 Roslyn 入门篇文章之一，你将可以通过本文学习如何开始编写一个 Roslyn 扩展项目 —— 编译一个类，然后执行其中的一段代码。

---

本文是 Roslyn 入门系列之一：

- [Roslyn 入门：使用 Visual Studio 的语法可视化（Syntax Visualizer）窗格查看和了解代码的语法树](/post/roslyn-syntax-visualizer)
- [Roslyn 入门：使用 .NET Core 版本的 Roslyn 编译并执行跨平台的静态的源码（本文）](/post/compile-and-invoke-code-using-roslyn)
- [Roslyn 入门：使用 Roslyn 静态分析现有项目中的代码](/post/analysis-code-of-existed-projects-using-roslyn)

<div id="toc"></div>

## 我们希望做什么？

是否有过在编译期间修改一段代码的想法呢？

我曾经在 [生成代码，从 T 到 T1, T2, Tn —— 自动生成多个类型的泛型](/post/generate-code-of-generic-types) 一文中提到过这样的想法，在这篇文章中，我希望只编写泛型的一个参数的版本 `Demo<T>`，然后自动生成 2~16 个参数的版本 `Demo<T1, T2>`, `Demo<T1, T2, T3>` ... `Demo<T1, T2, ... T16>`。不过，在那篇文章中，我写了一个应用程序来完成这样的事情。我在另一篇文章 [如何创建一个基于命令行工具的跨平台的 NuGet 工具包](/post/create-a-cross-platform-command-based-nuget-tool) 中说到我们可以将这样的应用程序打包成一个 NuGet 工具包。也就是说，利用这两种不同的技术，我们可以制作一个在编译期间生成多个泛型的 NuGet 工具包。

不过，这样的生成方式不够通用。今天我们想生成泛型，明天我们想生成多语言类，后天我们又想生成代理类。能否做一种通用的方式来完成这样的任务呢？

于是，我想到可以使用 Roslyn。在项目中编写一段转换代码，我们使用通用的方式去编译和执行这段代码，以便完成各种各样日益增加的类型转换需求。具体来说，就是 **使用 Roslyn 编译一段代码，然后执行它**。

## 准备工作

与之前在 [Roslyn 入门：使用 Roslyn 静态分析现有项目中的代码](/post/analysis-code-of-existed-projects-using-roslyn) 中的不同，我们这次无需打开解决方案或者项目，而是直接寻找并编译源代码文件。所以（利好消息），我们这回可以使用 .NET Core 跨平台版本的 Roslyn 了。所以为了充分有跨平台特性，我们创建`控制台应用 (.NET Core)`。

![新建项目](/static/posts/2018-05-25-20-17-01.png)  
▲ 千万不要吐槽相比于上一个入门教程来说，这次的界面变成了英文

## 安装必要的 NuGet 包

这次不需要完整的 .NET Framework 环境，也不需要打开解决方案和项目这种重型 API，所以一个简单的 NuGet 包足矣：

- [Microsoft.CodeAnalysis.CSharp](https://www.nuget.org/packages/Microsoft.CodeAnalysis.CSharp/)

![安装 Microsoft.CodeAnalysis.CSharp](/static/posts/2018-05-25-20-25-10.png)

## 准备一份用于编译和执行代码文件

我直接使用 [生成代码，从 T 到 T1, T2, Tn —— 自动生成多个类型的泛型](/post/generate-code-of-generic-types) 这篇文章中的例子。把其中最关键的文件拿来用于编译和生成试验。

```csharp
using System.Linq;
using static System.Environment;

namespace Walterlv.Demo.Roslyn
{
    public class GenericGenerator
    {
        private static readonly string GeneratedAttribute =
            @"[System.CodeDom.Compiler.GeneratedCode(""walterlv"", ""1.0"")]";

        public string Transform(string originalCode, int genericCount)
        {
            if (genericCount == 1)
            {
                return originalCode;
            }

            var content = originalCode
                // 替换泛型。
                .Replace("<out T>", FromTemplate("<{0}>", "out T{n}", ", ", genericCount))
                .Replace("Task<T>", FromTemplate("Task<({0})>", "T{n}", ", ", genericCount))
                .Replace("Func<T, Task>", FromTemplate("Func<{0}, Task>", "T{n}", ", ", genericCount))
                .Replace(" T, Task>", FromTemplate(" {0}, Task>", "T{n}", ", ", genericCount))
                .Replace("(T, bool", FromTemplate("({0}, bool", "T{n}", ", ", genericCount))
                .Replace("var (t, ", FromTemplate("var ({0}, ", "t{n}", ", ", genericCount))
                .Replace(", t)", FromTemplate(", {0})", "t{n}", ", ", genericCount))
                .Replace("return (t, ", FromTemplate("return ({0}, ", "t{n}", ", ", genericCount))
                .Replace("<T>", FromTemplate("<{0}>", "T{n}", ", ", genericCount))
                .Replace("(T value)", FromTemplate("(({0}) value)", "T{n}", ", ", genericCount))
                .Replace("(T t)", FromTemplate("({0})", "T{n} t{n}", ", ", genericCount))
                .Replace("(t)", FromTemplate("({0})", "t{n}", ", ", genericCount))
                .Replace("var t =", FromTemplate("var ({0}) =", "t{n}", ", ", genericCount))
                .Replace(" T ", FromTemplate(" ({0}) ", "T{n}", ", ", genericCount))
                .Replace(" t;", FromTemplate(" ({0});", "t{n}", ", ", genericCount))
                // 生成 [GeneratedCode]。
                .Replace("    public interface ", $"    {GeneratedAttribute}{NewLine}    public interface ")
                .Replace("    public class ", $"    {GeneratedAttribute}{NewLine}    public class ")
                .Replace("    public sealed class ", $"    {GeneratedAttribute}{NewLine}    public sealed class ");
            return content.Trim();
        }

        private static string FromTemplate(string template, string part, string separator, int count)
        {
            return string.Format(template,
                string.Join(separator, Enumerable.Range(1, count).Select(x => part.Replace("{n}", x.ToString()))));
        }
    }
}
```

这份代码你甚至可以直接复制到你的项目中，一定是可以编译通过的。

## 编译这份代码

使用 Roslyn 编译一份代码是非常轻松愉快的。写出以下这三行就够了：

```csharp
var syntaxTree = CSharpSyntaxTree.ParseText("那份代码的全文内容");
var compilation = CSharpCompilation.Create("assemblyname", new[] { syntaxTree },
        options: new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary));
var result = compilation.Emit(ms);
```

好吧，其实我是开玩笑的，这三行代码确实能够跑通过，不过得到的 `result` 是编译不通过的结局。为了能够在多数情况下编译通过，我写了更多的代码：

```csharp
using System;
using System.IO;
using System.Linq;
using System.Reflection;
using Microsoft.CodeAnalysis;
using Microsoft.CodeAnalysis.CSharp;

namespace Walterlv.Demo.Roslyn
{
    class Program
    {
        static void Main(string[] args)
        {
            // 大家都知道在代码中写死文件路径是不对的，不过，我们这里是试验。放心，我会改的！
            var file = @"D:\Development\Demo\Walterlv.Demo.Roslyn\Walterlv.Demo.Roslyn.Tests\GenericGenerator.cs";
            var originalText = File.ReadAllText(file);
            var syntaxTree = CSharpSyntaxTree.ParseText(originalText);
            var type = CompileType("GenericGenerator", syntaxTree);
            // 于是我们得到了编译后的类型，但是还不知道怎么办。
        }

        private static Type CompileType(string originalClassName, SyntaxTree syntaxTree)
        {
            // 指定编译选项。
            var assemblyName = $"{originalClassName}.g";
            var compilation = CSharpCompilation.Create(assemblyName, new[] { syntaxTree },
                    options: new CSharpCompilationOptions(OutputKind.DynamicallyLinkedLibrary))
                .AddReferences(
                    // 这算是偷懒了吗？我把 .NET Core 运行时用到的那些引用都加入到引用了。
                    // 加入引用是必要的，不然连 object 类型都是没有的，肯定编译不通过。
                    AppDomain.CurrentDomain.GetAssemblies().Select(x => MetadataReference.CreateFromFile(x.Location)));

            // 编译到内存流中。
            using (var ms = new MemoryStream())
            {
                var result = compilation.Emit(ms);

                if (result.Success)
                {
                    ms.Seek(0, SeekOrigin.Begin);
                    var assembly = Assembly.Load(ms.ToArray());
                    return assembly.GetTypes().First(x => x.Name == originalClassName);
                }
                throw new CompilingException(result.Diagnostics);
            }
        }
    }
}
```

## 执行编译后的代码

既然得到了类型，那么执行这份代码其实毫无压力，因为我们都懂得反射（好吧，我假装你懂反射）。

```csharp
var transformer = Activator.CreateInstance(type);
var newContent = (string) type.GetMethod("Transform").Invoke(transformer,
    new object[] { "某个泛型类的全文，假装我是泛型类 Walterlv<T> is a sb.", 2 });
```

执行完之后，里面的 `Walterlv<T>` 真的变成了 `Walterlv<T1, T2, T3, T4, T5, T6, T7, T8, T9, T10, T11, T12, T13, T14, T15, T16>` 啊。说明成功执行。

![](/static/posts/2018-05-25-21-14-40.png)

## 下面进入高阶模式

作为入门篇，我才不会进入高阶模式呢！如果你想实现如本文开头所说的更通用的效果，欢迎发动你的大脑让想象力迸发。当然，如果你确实想不出来，欢迎在下方评论，我将尽快回复。

**参考资料**

- [Compiling C# Code Into Memory and Executing It with Roslyn - Tugberk Ugurlu's Blog](http://www.tugberkugurlu.com/archive/compiling-c-sharp-code-into-memory-and-executing-it-with-roslyn)


