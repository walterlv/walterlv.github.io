---
title: "了解 .NET/C# 程序集的加载时机，以便优化程序启动性能"
date: 2018-11-11 19:06:51 +0800
tags: dotnet csharp
permalink: /post/when-assemblies-are-loaded.html
---

林德熙在 [C# 程序集数量对软件启动性能的影响](https://blog.lindexi.com/post/C-%E7%A8%8B%E5%BA%8F%E9%9B%86%E6%95%B0%E9%87%8F%E5%AF%B9%E8%BD%AF%E4%BB%B6%E5%90%AF%E5%8A%A8%E6%80%A7%E8%83%BD%E7%9A%84%E5%BD%B1%E5%93%8D.html) 一文中说到程序集数量对程序启动性能的影响。在那篇文章中，我们得出结论，想同类数量的情况下，程序集的数量越多，程序启动越慢。

额外的，不同的代码编写方式对程序集的加载性能也有影响。本文将介绍 .NET 中程序集的加载时机，了解这个时机能够对启动期间程序集的加载性能带来帮助。

---

<div id="toc"></div>

## 程序集加载方式对性能的影响

为了直观地说明程序集加载方式对性能的影响，我们先来看一段代码：

```csharp
using System;
using System.Threading.Tasks;

namespace Walterlv.Demo
{
    public static class Program
    {
        [STAThread]
        private static int Main(string[] args)
        {
            var logger = new StartupLogger();
            var startupManagerTask = Task.Run(() =>
            {
                var startup = new StartupManager(logger).ConfigAssemblies(
                    new Foo(),
                    new Bar(),
                    new Xxx(),
                    new Yyy(),
                    new Zzz(),
                    new Www());
                startup.Run();
                return startup;
            });

            var app = new App(startupManagerTask);
            app.InitializeComponent();
            app.Run();

            return 0;
        }
    }
}
```

在这段代码中，`Foo`、`Bar`、`Xxx`、`Yyy`、`Zzz`、`Www` 分别在不同的程序集中，我们姑且认为程序集名称是 FooAssembly、BarAssembly、XxxAssembly、YyyAssembly、ZzzAssembly、WwwAssembly。

现在，我们统计 Main 函数开始第一句话到 Run 函数开始执行时的时间：

| 统计   | Milestone                        |     Time |
| 第一次 | -------------------------------- | -------: |
| 第一次 | Main Method Start                |      107 |
| 第一次 | Run                              |      344 |
| 第二次 | Main Method Start                |      106 |
| 第二次 | Run                              |      276 |
| 第三次 | Main Method Start                |       89 |
| 第三次 | Run                              |      224 |

在三次统计中，我们可以看到三次平均时长 180 ms。如果观察没一句执行时的 Module，可以看到 Main 函数开始时，这些程序集都未加载，而 Run 函数执行时，这些程序集都已加载。

事实上，如果你把断点放在 `Task.Run` 中 lambda 表达式的第一个括号处，你会发现那一句时这些程序集就已经加载了，不用等到后面代码的执行。

作为对比，我需要放上没有程序集加载时候的数据（具体来说，就是去掉所有 `new` 那些类的代码）：

| 统计   | Milestone                        |     Time |
| 第一次 | -------------------------------- | -------: |
| 第一次 | Main Method Start                |       43 |
| 第一次 | Run                              |       75 |
| 第二次 | Main Method Start                |       27 |
| 第二次 | Run                              |       35 |
| 第三次 | Main Method Start                |       28 |
| 第三次 | Run                              |       40 |

这可以证明，以上时间大部分来源于程序集的加载，而不是其他什么代码。

现在，我们稍稍修改一下程序集，让 `new Foo()` 改为使用 lambda 表达式来创建：

```diff
    using System;
    using System.Threading.Tasks;
    
    namespace Walterlv.Demo
    {
        public static class Program
        {
            [STAThread]
            private static int Main(string[] args)
            {
                var logger = new StartupLogger();
                var startupManagerTask = Task.Run(() =>
                {
                    var startup = new StartupManager(logger).ConfigAssemblies(
--                      new Foo(),
--                      new Bar(),
--                      new Xxx(),
--                      new Yyy(),
--                      new Zzz(),
--                      new Www());
++                      () => new Foo(),
++                      () => new Bar(),
++                      () => new Xxx(),
++                      () => new Yyy(),
++                      () => new Zzz(),
++                      () => new Www());
                    startup.Run();
                    return startup;
                });
    
                var app = new App(startupManagerTask);
                app.InitializeComponent();
                app.Run();
    
                return 0;
            }
        }
    }
```

这时，直到 `Run` 函数执行时，那些程序集都还没有加载。由于我在 `Run` 函数中真正使用到了那些对象，所以其实 `Run` 中是需要写代码来加载那些程序集的（也是自动）。

如果我们依次加载这些程序集，那么时间如下：

| Milestone                        |     Time |
| -------------------------------- | -------: |
| Main Method Start                |       38 |
| Run                              |      739 |

如果我们使用 Parallel 并行加载这些程序集，那么时间如下：

| Milestone                        |     Time |
| -------------------------------- | -------: |
| Main Method Start                |       31 |
| Run                              |      493 |

可以看到，程序集加载时间有明显增加。

实际上我们完成的任务是一样的，但是程序集加载时间显著增加，这显然不是我们期望的结果。

在上例中，第一个不到 200 ms 的加载时间，来源于我们直接写下了 `new` 不同程序集中的类型。后面长一些的时间，则因为我们的 `Main` 函数中没有直接构造类型，而是写成了 lambda 表达式。来源于在 `Run` 中调用那些 lambda 表达式从而间接加载了类型。

为了更直观，我把 `Run` 方法中的关键代码贴出来：

```csharp
// assemblies 是直接 new 出来的参数传进来的。
_assembliesToBeManaged.AddRange(assemblies);
```

```csharp
// assemblies 是写的 lambda 表达式参数传进来的。
_assembliesToBeManaged.AddRange(assemblies.Select(x => x()));
```

上面的版本，这些程序集的加载时间是 180 ms，而下面的版本，则达到惊人的 701 ms！

## 程序集的加载时机

于是我们可以了解到程序集的加载时机。

- 在一个方法被 JIT 加载的时候，里面用到的类型所在的程序集就会被加载到应用程序域中。当加载完后，此方法才被执行。
- 加载程序集时，只会加载方法中会直接使用到的类型，如果是 lambda 内的类型，则会在此 lambda 被调用的时候才会执行（其实这本质上和方法被调用之前的加载是一个时机）。

并且，我们能够得出性能优化建议：

- 如果可行，最好让 CLR 自动管理程序集的加载，而且一次性能加载所有程序集的话就一次性加载，而不要尝试自己去分开加载这些程序集，那会使得能够并行的加载程序集的时间变得串行，浪费启动性能。

