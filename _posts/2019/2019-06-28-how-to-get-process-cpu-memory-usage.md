---
title: ".NET/C# 如何获取当前进程的 CPU 和内存占用？如何获取全局 CPU 和内存占用？"
date: 2019-06-28 07:48:08 +0800
tags: dotnet
position: knowledge
---

都知道可以在任务管理器中查看进程的 CPU 和内存占用，那么如何通过 .NET 编写代码的方式来获取到 CPU 和内存占用呢？

.NET 中提供了 `PerformanceCounter` 类型，可以用来监视系统中大量的性能问题。

---

<div id="toc"></div>

## 获取全局 CPU 和内存占用

要获取到全系统中的 CPU 占用率，获取全系统中内存占用，需要首先分别创建这两者的性能计数器：

```csharp
// 创建对 CPU 占用百分比的性能计数器。
var cpuCounter = new PerformanceCounter("Processor", "% Processor Time", "_Total");
// 创建内存占用字节数的性能计数器
var ramCounter = new PerformanceCounter("Memory", "Available MBytes");
```

接下来，使用 `NextValue()` 可分别获取到两者的值：

```csharp
float cpu = CpuCounter.NextValue();
float ram = RamCounter.NextValue();
```

你需要注意的是，我们在创建 `PerformanceCounter` 时，构造函数中传入的参数是固定的，或者说必须跟当前系统中安装的计数器的计数器类别的名称（`categoryName`，第一个参数）和计数器的名称（`counterName`，第二个参数）对应。另外，如果某个类别包含单个实例，那么需要传入实例名称（`instanceName`，第三个参数）。

## 获取当前进程的 CPU 和内存占用

在了解的 `PerformanceCounter` 各个参数代表的含义之后，我们还可以获取到单个进程的性能计数。

```csharp
var name = Process.GetCurrentProcess().ProcessName;
var cpuCounter = new PerformanceCounter("Process", "% Processor Time", name);
var ramCounter = new PerformanceCounter("Process", "Working Set", name);
```

也是使用 `NextValue()` 来获取到此性能计数器实例的值。

这里，我们在计算单个进程的内存占用时，使用的是工作集大小，这个值会比较接近我们平时使用任务管理器看到的物理内存占用的大小，但是我们还有其他可以查询的类别：

- `Private Bytes`
    包含进程向系统中申请的私有内存大小，不包含跨进程中共享的部分内存。
- `Working Set`
    进程占用的物理内存的大小。由于包含共享内存部分和其他资源，所以其实并不准；但这个值就是在任务管理器中看到的值。
- `Virtual Bytes`
    进程在地址空间中已经使用到的所有的地址空间总大小。

---

**参考资料**

- [PerformanceCounter Class (System.Diagnostics) - Microsoft Docs](https://docs.microsoft.com/zh-cn/dotnet/api/system.diagnostics.performancecounter)
- [How to get the CPU Usage in C#? - Stack Overflow](https://stackoverflow.com/a/278088/6233938)
- [.net - Get CPU Usage for Process by Process ID - Stack Overflow](https://stackoverflow.com/q/14802787/6233938)
- [c# - What is the correct Performance Counter to get CPU and Memory Usage of a Process? - Stack Overflow](https://stackoverflow.com/a/4680030/6233938)
- [debugging - What is private bytes, virtual bytes, working set? - Stack Overflow](https://stackoverflow.com/q/1984186/6233938)
