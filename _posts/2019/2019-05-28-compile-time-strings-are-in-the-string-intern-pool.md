---
title: ".NET/C# 编译期能确定的字符串会在字符串暂存池中不会被 GC 垃圾回收掉"
date: 2019-05-28 21:31:24 +0800
tags: dotnet csharp
position: knowledge
coverImage: /static/posts/2019-05-28-21-21-55.png
permalink: /posts/compile-time-strings-are-in-the-string-intern-pool.html
---

当我们不再使用某个对象的时候，此对象会被 GC 垃圾回收掉。当然前提是你没有写出内存泄漏的代码。我们也知道如果生成了大量的字符串，会对 GC 造成很大的压力。

但是，如果在编译期间能够确定的字符串，就不会被 GC 垃圾回收掉了。

---

<div id="toc"></div>

## 示例代码

下面，我创建了几个字符串，我关心的字符串是 `"walterlv"`，`"lindexi"` 以及一个当前时间。

于是使用下面的代码来验证：

```csharp
using System;
using System.Linq;
using System.Runtime.CompilerServices;

namespace Walterlv.Demo
{
    class Program
    {
        static void Main(string[] args)
        {
            var table = new ConditionalWeakTable<string, Foo>
            {
                {"walterlv", new Foo("吕毅")},
                {"lindexi", new Foo("林德熙")},
            };
            var time = DateTime.Now.ToString("T");
            table.Add(time, new Foo("时间"));
            time = null;

            Console.WriteLine($"开始个数：{table.Count()}");
            GC.Collect();
            Console.WriteLine($"剩余个数：{table.Count()}");
        }
    }

    public class Foo
    {
        public string Value { get; }
        public Foo(string value) => Value = value;
    }
}
```

`"walterlv"` 和 `"lindexi"` 是在编译期间能够完全确定的字符串，而当前时间字符串我们都知道是编译期间不能确定的字符串。

在 GC 收集之前和之后，`ConditionalWeakTable` 中的对象数量从三个降到了两个。

![运行结果](/static/posts/2019-05-28-21-21-55.png)

并没有清除成 0 个，说明字符串现在仍然是被引用着的。

那被什么引用着呢？是字符串暂存池。要理解字符串暂存池，可以阅读我的另一篇博客：

- [.NET/C# 的字符串暂存池](/post/string-intern-pool)

另外，即便设置了 `CompilationRelaxations.NoStringInterning`，编译期间能确定的字符串在上述代码中也是不会被垃圾回收的。

---

**参考资料**

- [c# - Strings and Garbage Collection - Stack Overflow](https://stackoverflow.com/a/2423134/6233938)


