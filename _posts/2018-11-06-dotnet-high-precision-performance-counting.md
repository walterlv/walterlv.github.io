---
title: ".NET/C# 在代码中测量代码执行耗时的建议（比较系统性能计数器和系统时间）"
date: 2018-11-06 15:33:54 +0800
categories: dotnet csharp
---

我们有很多种方法评估一个方法的执行耗时，比如使用性能分析工具，使用基准性能测试。不过传统的在代码中编写计时的方式依然有效，因为它可以生产环境或用户端得到真实环境下的执行耗时。

如果你希望在 .NET/C# 代码中编写计时，那么阅读本文可以获得一些建议。阅读本文也可以了解到 `QueryPerformanceCounter`、`Get­System­Time­As­File­Time` 等方法的差异。

---

<div id="toc"></div>

### 基本的计时

计时一般采用下面这种方式，在方法执行之前获取一次时间，在方法结束之后再取得一次时间。

```csharp
// 在方法开始之前。
Foo();
// 在方法执行之后。
```

这样，前后两次获取的时间差即为方法 `Foo` 的执行耗时。

这里我不会提到性能测试工具或者基准性能测试这些方法，因为这些测试代码不会运行于用户端。你可以阅读以下博客获得这两者的使用：

- [C# 标准性能测试 - 林德熙](https://lindexi.gitee.io/post/C-%E6%A0%87%E5%87%86%E6%80%A7%E8%83%BD%E6%B5%8B%E8%AF%95.html)
- [C# 标准性能测试高级用法 - 林德熙](https://lindexi.gitee.io/post/C-%E6%A0%87%E5%87%86%E6%80%A7%E8%83%BD%E6%B5%8B%E8%AF%95%E9%AB%98%E7%BA%A7%E7%94%A8%E6%B3%95.html)
- [.NET/C# 反射的的性能数据，以及高性能开发建议（反射获取 Attribute 和反射调用方法） - 吕毅](https://walterlv.com/post/dotnet-high-performance-reflection-suggestions.html)

### 结论：使用什么方法计时

先说结论：`System.Diagnostics` 命名空间下有一个 `Stopwatch` 类。如果你要为你方法的执行时间进行统计，那么就使用这个类。

`Stopwatch` 类有一些静态属性、也有一些实例方法和实例属性。此类型的时间统计是按照高性能和高精度的要求来做的，于是你可以用它获得高精度的计时效果。不过，如果你对性能要求近乎苛刻，例如你的方法会被数百万次或更高频地执行，那么就需要开始斟酌如何调用里面的属性了。

简单的使用如下面这样：

```csharp
var watch = Stopwatch.StartNew();
Foo();
watch.Stop();
var elapsed = watch.Elapsed;
```

当然，你也可以直接使用 `Stopwatch` 的构造函数，`new` 出来之后再 `Start`，不过 `StartNew` 静态方法可以将两句合并为一句。

### 各种计时 API 及其比较

计时还有很多的方法，你可以针对不同需求场景使用不同的方法。不过，如果你根本没有了解过其他方法的话，那么建议直接使用上面的 `Stopwatch`，不要想太多。

现在，我们看看 Windows 下的计时还有哪些 API：

- 基于 QPC 的高精度 API
    - `Query­Performance­Counter`
    - `Query­Performance­Frequency`
- 基于系统时间的非高精度 API
    - `Get­Tick­Count`, `Get­Tick­Count64`
    - `Get­Message­Time`
    - `Get­System­Time`, `Get­Local­Time`, `Get­System­Time­As­File­Time`
    - `Query­Interrupt­Time`, `Query­Unbiased­Interrupt­Time`
- 基于 QPC 和系统时间的 API
    - `Get­System­Time­Precise­As­File­Time`
    - `Query­Interrupt­Time­Precise`, `Query­Unbiased­Interrupt­Time­Precise`

#### 基于系统性能计数器（QPC）的 API

`QueryPerformanceCounter`，微软文档中把它称之为 QPC。

一般情况下使用的 `QueryPerformanceCounter`，内核驱动开发者使用的 `KeQueryPerformanceCounter` 和 .NET 开发者使用的 `System.Diagnostics.Stopwatch` 都是基于 QPC 的 API。

QPC 是通过计算机上独立运行的高精度硬件计时模块来获得时间戳的。这意味着，使用此 API 获得的时间戳是本机时间戳，不包含任何时区等信息。

由于 QPC 的高精度特性，所以非常适合在单个设备上测量一个小段时间的时间间隔。而这也符合我们本文一开始说到的方法执行耗时测量需求。

`QueryPerformanceCounter` 得到的值是 Ticks，单位是 100 ns。

```
1 tick  = 100 ns
1 us    = 1000 ns
1 ms    = 1000 us
1 s     = 1000 ms
```

#### 基于系统时间的 API

如果你的需求不止是测量获取一个时间间隔，而是需要一个长期保存的时间，或者需要将时间与其他设备进行通信，那么基于单台设备的 QPC 就不符合要求了。

`GetSystemTimeAsFileTime` 可以用来获取系统时钟时间。这个时间就是基于系统时钟的，所以如果你的时间戳是用来通信的，那么就很有用。当然，如果要在设备之间进行与时间信息相关的同步，还可能需要使用 NTP（Network Time Protocol）先同步时间。

`DateTime.Now` 获取时间的方法就是这个：

```csharp
[MethodImplAttribute(MethodImplOptions.InternalCall)]
internal static extern long GetSystemTimeAsFileTime();
```

这里有一些比较有趣的说法，基于系统时间的 API 也会说成是获取高精度时间，那么跟 QPC 有什么不同呢？

这里我只能拿英文来说话了。来自微软的 Raymond Chen 在它的 [The Old New Thing](https://www.amazon.com/gp/product/0321440307?ie=UTF8&tag=tholneth-20&linkCode=as2&camp=1789&creative=9325&creativeASIN=0321440307) 一书中说，基于系统时间的 API 获取的时间戳精度用的是 “所谓的 Precise”，但实际上应该称之为 “Accurate”，而 QPC 才能称之为实质上的 “Precise”。纠结起来就是 QPC 比基于系统时间的 API 得到的时间戳精度更高。

#### 基于 QPC 和系统时间的 API

`Get­System­Time­Precise­As­File­Time` 这些 API 既可以获得 QPC 的高精度，又与系统时钟相关，于是你可以使用这些 API 同时获得以上测量的好处。当然，这以性能成本为代价的。


---

#### 参考资料

- [Acquiring high-resolution time stamps - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/sysinfo/acquiring-high-resolution-time-stamps)
- [How accurate are the various Windows time-querying functions? – The Old New Thing](https://blogs.msdn.microsoft.com/oldnewthing/20170921-00/?p=97057)
- [windows平台时间函数性能比较QueryPerformanceCounter，GetTickCount，ftime，time,GetLocalTime，GetSystemTimeAsFileTime - 小 楼 一 夜 听 春 雨 - 博客园](http://www.cnblogs.com/kex1n/p/3297607.html)
- [c# - Is DateTime.Now the best way to measure a function's performance? - Stack Overflow](https://stackoverflow.com/a/28648/6233938)
- [c# - How do I measure how long a function is running? - Stack Overflow](https://stackoverflow.com/q/10107140/6233938)
- [c# - Calculate the execution time of a method - Stack Overflow](https://stackoverflow.com/q/14019510/6233938)
- [Stopwatch.IsHighResolution Field (System.Diagnostics) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/system.diagnostics.stopwatch.ishighresolution?redirectedfrom=MSDN&view=netframework-4.7.2)
- [Stopwatch.cs](https://referencesource.microsoft.com/#System/services/monitoring/system/diagnosticts/Stopwatch.cs,ceb0ba9cc88de82e)
- [timespan.cs](https://referencesource.microsoft.com/#mscorlib/system/timespan.cs,865ef7b89f41b632)
