---
title: "C# 永远不会返回的方法真的不会返回"
date: 2019-01-20 15:36:40 +0800
categories: csharp
position: knowledge
---

一般情况下，如果一个方法声明了返回值，但是实际上在编写代码的时候没有返回，那么这个时候会出现编译错误。

然而，如果方法内部出现了永远也不会退出的死循环，那么这个时候就不会出现编译错误。

---

请看下面这一段代码，`RunAndNeverReturns` 方法声明了返回值 `int` 但实际上方法内部没有返回。这段代码是可以编译通过而且可以正常运行的。

```csharp
namespace Walterlv.Demo
{
    class Program
    {
        static void Main(string[] args)
        {
            RunAndNeverReturns();
        }

        private static int RunAndNeverReturns()
        {
            while (true)
            {
                Thread.Sleep(1000);
                Console.WriteLine("Walterlv will always appear.");
            }

            // 注意看，这个方法其实没有返回。
        }
    }
}
```

如果观察其 IL 代码，会发现此方法的 IL 代码里面是没有 `ret` 语句的。而其他正常的方法，即便返回值是 `void`，也是有 `ret` 语句的。
