---
title: ".NET Framework 和 .NET Core 在默认情况下垃圾回收（GC）机制的不同（局部变量部分）"
date: 2020-05-15 21:50:57 +0800
categories: dotnet
position: knowledge
---

垃圾回收机制有一些未定义部分，一般来说不要依赖于这些未定义部分编程，否则容易出现一些诡异的 bug 或者不稳定的现象。

本文介绍局部变量这部分的细节，而这点在 .NET Framework 和 .NET Core 默认情况下的表现有差别。

---

<div id="toc"></div>

## 问题代码

看看下面这段代码，你觉得会输出 `Foo is collected` 吗？

```csharp
class Program
{
    static void Main(string[] args)
    {
        new WeakReference<Foo>(new Foo());
        GCTest();
    }

    private static void GCTest()
    {
        while (true)
        {
            Thread.Sleep(500);
            GC.Collect();
        }
    }
}

public class Foo
{
    ~Foo()
    {
        Console.WriteLine("Foo is collected");
    }
}
```

如果你没有修改默认的编译设置，那么答案应该是：

- 全部 .NET Framework 下都输出 `Foo is collected`
- .NET Core 2.x 及以下输出 `Foo is collected`
- .NET Core 3.x 及以上不会有任何输出

额外的，.NET Core 2.1 - .NET Core 3.x 通过设置可以改变此行为，本文文末会说。

然而所有这些平台编译后的 IL 都差不多。虽然引用的程序集不一样，但代码都是一样的。所以问题不在编译器，而在运行时。

```csharp
.method private hidebysig static 
    void Main (
        string[] args
    ) cil managed 
{
    // Header Size: 1 byte
    // Code Size: 17 (0x11) bytes
    .maxstack 8
    .entrypoint

    /* (12,13)-(12,45) Program.cs */
    /* 0x00000251 7305000006   */ IL_0000: newobj    instance void Walterlv.Demo.Weak.Foo::.ctor()
    /* 0x00000256 730C00000A   */ IL_0005: newobj    instance void class [System.Runtime]System.WeakReference`1<class Walterlv.Demo.Weak.Foo>::.ctor(!0)
    /* 0x0000025B 26           */ IL_000A: pop
    /* (14,13)-(14,22) Program.cs */
    /* 0x0000025C 2802000006   */ IL_000B: call      void Walterlv.Demo.Weak.Program::GCTest()
    /* (15,9)-(15,10) Program.cs */
    /* 0x00000261 2A           */ IL_0010: ret
} // end of method Program::Main
```

这个问题我提在了 GitHub 上，大家可以去看看：

- [GC.Collect: Object without reference will be collected in .NET Framework but will NOT been collected in .NET Core · Issue #36265 · dotnet/runtime](https://github.com/dotnet/runtime/issues/36265)

## 原因

当然，当变量脱离作用域后 GC 本应回收，但在同一个函数中定义的变量是否脱离作用域却是未定义的。你可以经常在 DEBUG 下发现依然可访问的变量，但在 RELEASE 下无法访问变量就体现了这种未定义带来的行为差异。

.NET Core 3.0 开始引入了分层编译（Tiered Compilation）。在开启了分层编译的情况下，JIT 执行方法时先会快速编译，随后如果此方法访问频繁会在后台优化这个编译然后替换掉之前编译的方法，以提升后续的运行性能。

在分层编译被启用的情况下，GC 的行为有改变，局部变量不再及时回收。当然以后有更优化的分层编译后，可能有新的行为改变。

如果要关闭分层编译，可以在项目文件中设置 `TieredCompilation` 为 `false`，也可以设置环境变量 `COMPlus_TieredCompilation=0`。这两个是等价的。

```diff
  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFrameworks>net48;netcoreapp3.1</TargetFrameworks>
+   <TieredCompilation>false</TieredCompilation>
  </PropertyGroup>
```

关于分层编译，可以阅读林德熙的博客：

- [dotnet core 2.1 使用分层编译](https://blog.lindexi.com/post/dotnet-core-2.1-%E4%BD%BF%E7%94%A8%E9%98%B6%E6%A2%AF%E7%BC%96%E8%AF%91.html)

本文一开始说的行为改变，指的就是开关分层编译。.NET Core 2.1 开始支持分层编译但默认关闭，而 .NET Core 3.0 开始默认开启。所以在支持的框架上你可以开启或关闭。

---

**参考资料**

- [Compilation config settings - .NET Core - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/core/run-time-config/compilation)
