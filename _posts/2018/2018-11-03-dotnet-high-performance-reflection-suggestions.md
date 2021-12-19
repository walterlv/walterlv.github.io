---
title: ".NET/C# 反射的的性能数据，以及高性能开发建议（反射获取 Attribute 和反射调用方法）"
publishDate: 2018-11-03 15:25:17 +0800
date: 2018-12-14 09:54:00 +0800
tags: dotnet csharp
---

大家都说反射耗性能，但是到底有多耗性能，哪些反射方法更耗性能；这些问题却没有统一的描述。

本文将用数据说明反射各个方法和替代方法的性能差异，并提供一些反射代码的编写建议。为了解决反射的性能问题，你可以遵循本文采用的各种方案。

---

<div id="toc"></div>

## 反射各方法的性能数据

我使用 [BenchmarkDotNet](https://benchmarkdotnet.org/) 基准性能测试来评估反射各个方法的性能。测试的程序基于 .NET Core 2.1 开发。

先直观地贴出我的运行结果：

![各反射不同方法的运行基准测试结果](/static/posts/2018-11-03-14-01-05.png)  
▲ 各反射不同方法的运行基准测试结果

我把上面的表格复制下来成为文字，这样你也可以拿走我的这部分数据：

|                           Method |           Mean |         Error |        StdDev |         Median |
|--------------------------------- |---------------:|--------------:|--------------:|---------------:|
|                         Assembly |     13.5315 ns |     0.3004 ns |     0.4764 ns |     13.4878 ns |
|                       Attributes |      7.0893 ns |     0.1248 ns |     0.1168 ns |      7.0982 ns |
|                 CustomAttributes |  1,489.1654 ns |    29.4428 ns |    27.5408 ns |  1,482.5038 ns |
|          GetCustomAttributesData |  1,514.5503 ns |    29.6863 ns |    39.6303 ns |  1,507.2949 ns |
|              GetCustomAttributes |  1,171.8969 ns |    22.5305 ns |    27.6695 ns |  1,167.2777 ns |
|               GetCustomAttribute |  1,139.8609 ns |    22.8043 ns |    24.4003 ns |  1,140.5437 ns |
|       GetCustomAttribute_Generic |  1,115.0049 ns |    13.1929 ns |    11.6952 ns |  1,111.4426 ns |
|      GetCustomAttributes_Generic |  1,164.5132 ns |    22.7775 ns |    24.3716 ns |  1,165.2747 ns |
|                              New |      0.0003 ns |     0.0013 ns |     0.0012 ns |      0.0000 ns |
|                           Lambda |      0.0063 ns |     0.0149 ns |     0.0139 ns |      0.0000 ns |
|         Activator_CreateInstance |     48.8633 ns |     0.6300 ns |     0.5893 ns |     48.8906 ns |
| Activator_CreateInstance_Generic |     47.7029 ns |     0.9649 ns |     1.0724 ns |     47.5851 ns |
|                   Expression_New | 75,634.4035 ns | 1,467.3285 ns | 1,372.5400 ns | 75,413.2837 ns |
|             CachedExpression_New |      7.8923 ns |     0.1988 ns |     0.4105 ns |      7.7004 ns |

如果你希望了解以上每一项的意思，可以通过阅读本文文末的代码来了解其实现。基本上名称就代表着反射调用相同的方法。

你一定会说这张表不容易看出性能差距。那么我一定会放图：

![性能差异图 1](/static/posts/2018-11-03-14-21-13.png)

那个 `Expression_New` 在图中独树一帜，远远把其他方法甩在了后面。那是个什么方法？

那是在使用 `Expression` 表达式创建一个类型的新实例：

```csharp
var @new = Expression.New(typeof(ReflectionTarget));
var lambda = Expression.Lambda<Func<ReflectionTarget>>(@new).Compile();
var instance = lambda.Invoke();
```

也就是说，如果你只是希望创建一个类型的新实例，就不要考虑使用 `Expression.New` 的方式了。除非此方法将执行非常多次，而你把那个 lambda 表达式缓存下来了。这对应着图表中的 `CachedExpression_New`。

其他的现在都看不出来性能差异，于是我们把耗时最长的 `Expression_New` 一项去掉：

![性能差异图 2](/static/posts/2018-11-03-14-25-39.png)

我们立刻可以从图中得到第二梯队的性能巨头 —— 就是 `CustomAttributes` 系列。我使用了多种不同的 `CustomAttribute` 获取方法，得到的结果差异不大，都“比较耗时”。不过在这些耗时的方法里面找到不那么耗时的，就是 `Type` 的扩展方法系列 `GetCustomAttribute` 了，比原生非扩展方法的性能稍好。

不过其他的性能差异又被淹没了。于是我们把 `CustomAttributes` 系列也删掉：

![性能差异图 3](/static/posts/2018-11-03-14-28-55.png)

于是我们又得到了第三梯队的性能大头 —— `Activator.CreateInstance` 系列。而是否调用泛型方法的耗时差异不大。

然后，我们把 `Activator.CreateInstance` 也干掉，可以得到剩下其他的性能消耗。

![性能差异图 4](/static/posts/2018-11-03-14-30-53.png)

也就是说，只是获取 `Type` 中的一些属性，例如 `Assembly` 和 `Attributes` 也是比较“耗时”的；当然，这是纳秒级别，你可以将它忽略。

要不要试试把第四梯队的也干掉呢？于是你可以得到 `new` 和 `Lambda` 的差异：

![性能差异图 5](/static/posts/2018-11-03-14-34-30.png)

原本在上面所有图中看起来都没有时间的 `new` 和 `Lambda` 竟然差异如此巨大；不过，这都是千分之一纳秒级别了；如果你创建的类数量不是百万级别以上，你还真的可以忽略。

而 `new` 指的是 `new Foo()`，`Lambda` 指的是 `var func = () => new Foo(); func();`。

对于 `GetCustomAttribute`，还有另一个方法值得注意：`IsDefined`；可以用来判断是否定义了某个特定的 `Attribute`。

```csharp
var isDefined = _targetType.IsDefined(typeof(ReflectionTargetAttribute), false);
if (isDefined)
{
    var attribute = _targetType.GetCustomAttribute<ReflectionTargetAttribute>();
}
```

而这个方法与 `GetCustomAttribute` 的性能差距也有些大：

|                    Method |       Mean |    Error |   StdDev | Ratio | RatioSD |
|-------------------------- |-----------:|---------:|---------:|------:|--------:|
|                 IsDefined |   653.8 ns | 13.07 ns | 16.53 ns |  1.00 |    0.00 |
|        GetCustomAttribute | 1,149.6 ns | 22.97 ns | 22.56 ns |  1.76 |    0.06 |
| GetGenericCustomAttribute | 1,216.5 ns | 24.15 ns | 54.51 ns |  1.81 |    0.07 |

咋看之下似乎与 `GetCustomAttribute` 方法重复，而且如果先判断再获取，可能总时间更长。不过这种方法就是适用于一次性对大量类型进行判断，如果只有少量类型定义了某种 `Attribute`，那么提前使用 `IsDefined` 判断可以获得总体更加的性能。

## 反射的高性能开发建议

### 创建类型的实例

如果你能访问到类型：

- 建议直接使用 `new`，性能最好。
- 如果不希望直接 `new` 出来，可以考虑使用 `Func` 或者 `Lazy` 创建。这时会多消耗一些性能，不过基数小，增量不大。

如果你不能访问到类型：

- 如果只能从 `Type` 创建，则使用 `Activator.CreateInstance` 系列。
- 如果你使用其他方式创建，请一定使用缓存。

除了使用 `Expression` 创建，你还可以使用 `Emit` 创建，不过这也要求能够访问到类型：

- [使用 Emit 生成 IL 代码 - 吕毅](/post/generate-il-using-emit)

对于缓存，可以参考：

- [.NET Core/Framework 创建委托以大幅度提高反射调用的性能 - 吕毅](/post/create-delegate-to-improve-reflection-performance)
- [.NET/C# 推荐一个我设计的缓存类型（适合缓存反射等耗性能的操作，附用法） - 吕毅](/post/design-a-cache-pool)

对于创建对象更多的性能数据，可以参考：

- [C# 直接创建多个类和使用反射创建类的性能 - 林德熙](https://blog.lindexi.com/post/C-%E7%9B%B4%E6%8E%A5%E5%88%9B%E5%BB%BA%E5%A4%9A%E4%B8%AA%E7%B1%BB%E5%92%8C%E4%BD%BF%E7%94%A8%E5%8F%8D%E5%B0%84%E5%88%9B%E5%BB%BA%E7%B1%BB%E7%9A%84%E6%80%A7%E8%83%BD.html)
- [C# 性能分析 反射 VS 配置文件 VS 预编译 - 林德熙](https://blog.lindexi.com/post/C-%E6%80%A7%E8%83%BD%E5%88%86%E6%9E%90-%E5%8F%8D%E5%B0%84-VS-%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6-VS-%E9%A2%84%E7%BC%96%E8%AF%91.html)

### 反射获取 Attribute

获取 `Attribute` 也是耗时的操作。

- 如果你只是获取极少数类型的 `Attribute`，建议直接调用 `GetCustomAttribute` 扩展方法。
- 如果你需要判断大量类型的 `Attribute`，建议先使用 `IsDefined` 判断是否存在，如果存在才使用 `GetCustomAttribute` 方法获取真实实例。

### 反射调用公共 / 私有方法

反射调用方法与构造方法几乎是一样的，不同之处就在于公共方法可以创建出委托缓存，而私有方法却不行。

有了委托缓存，你只有第一次才需要真的调用反射，后续可以使用缓存的委托或 Lambda 表达式；而私有方法是无法创建的，你每次都需要通过反射来调用相关方法。

关于私有方法的反射：

- [C# 使用反射获取私有属性的方法](https://blog.lindexi.com/post/C-%E4%BD%BF%E7%94%A8%E5%8F%8D%E5%B0%84%E8%8E%B7%E5%8F%96%E7%A7%81%E6%9C%89%E5%B1%9E%E6%80%A7%E7%9A%84%E6%96%B9%E6%B3%95.html)
- [C# 反射调用私有事件](https://blog.lindexi.com/post/C-%E5%8F%8D%E5%B0%84%E8%B0%83%E7%94%A8%E7%A7%81%E6%9C%89%E4%BA%8B%E4%BB%B6.html)

关于缓存：

- [.NET Core/Framework 创建委托以大幅度提高反射调用的性能 - 吕毅](/post/create-delegate-to-improve-reflection-performance)
- [.NET/C# 推荐一个我设计的缓存类型（适合缓存反射等耗性能的操作，附用法） - 吕毅](/post/design-a-cache-pool)

### 使用预编译框架

使用预编译框架，你可以在编译期间将那些耗时的反射操作编译成类似 `new` 和属性 `get` 这样的简单 CLR 调用，性能差距近乎于最开始图表中第二张图和第五张图那样，具有数千倍的差距。

- [课程 预编译框架，开发高性能应用 - 微软技术暨生态大会 2018 - walterlv](/post/dotnet-build-and-roslyn-course-in-tech-summit-2018)
- [dotnet-campus/SourceFusion: SourceFusion is a pre-compile framework based on Roslyn. It helps you to build high-performance .NET code.](https://github.com/dotnet-campus/SourceFusion)

## 附本文性能测试所用的代码

本文性能测试使用 [BenchmarkDotNet](https://benchmarkdotnet.org/)，在 `Main` 函数中调用以下代码跑起来：

```csharp
BenchmarkRunner.Run<Reflections>();
```

你可以阅读 [C# 标准性能测试 - 林德熙](https://blog.lindexi.com/post/C-%E6%A0%87%E5%87%86%E6%80%A7%E8%83%BD%E6%B5%8B%E8%AF%95.html) 了解基准性能测试的基本用法，在 [C# 标准性能测试高级用法 - 林德熙](https://blog.lindexi.com/post/C-%E6%A0%87%E5%87%86%E6%80%A7%E8%83%BD%E6%B5%8B%E8%AF%95%E9%AB%98%E7%BA%A7%E7%94%A8%E6%B3%95.html) 中了解到更多基准测试方法的使用。

### 所有反射相关方法

```csharp
using BenchmarkDotNet.Attributes;
using System;
using System.Linq;
using System.Linq.Expressions;
using System.Reflection;

namespace Walterlv.Demo.Reflection
{
    public class Reflections
    {
        private static readonly Type _targetType = typeof(ReflectionTarget);
        private static Func<ReflectionTarget> _cachedExpressionFunc;

        private static Func<ReflectionTarget> CachedExpressionFunc
        {
            get
            {
                if (_cachedExpressionFunc == null)
                {
                    var @new = Expression.New(typeof(ReflectionTarget));
                    var lambda = Expression.Lambda<Func<ReflectionTarget>>(@new).Compile();
                    _cachedExpressionFunc = lambda;
                }

                return _cachedExpressionFunc;
            }
        }

        [Benchmark]
        public void Assembly()
        {
            var assembly = _targetType.Assembly;
        }

        [Benchmark]
        public void Attributes()
        {
            var attributes = _targetType.Attributes;
        }

        [Benchmark]
        public void CustomAttributes()
        {
            var attribute = _targetType.CustomAttributes.FirstOrDefault(
                x => x.AttributeType == typeof(ReflectionTargetAttribute));
        }

        [Benchmark]
        public void GetCustomAttributesData()
        {
            var attribute = _targetType.GetCustomAttributesData().FirstOrDefault(
                x => x.AttributeType == typeof(ReflectionTargetAttribute));
        }

        [Benchmark]
        public void GetCustomAttributes()
        {
            var attribute = _targetType.GetCustomAttributes(typeof(ReflectionTargetAttribute), false).FirstOrDefault();
        }

        [Benchmark]
        public void GetCustomAttribute()
        {
            var attribute = _targetType.GetCustomAttribute(typeof(ReflectionTargetAttribute), false);
        }

        [Benchmark]
        public void GetCustomAttribute_Generic()
        {
            var attribute = _targetType.GetCustomAttribute<ReflectionTargetAttribute>(false);
        }

        [Benchmark]
        public void GetCustomAttributes_Generic()
        {
            var attribute = _targetType.GetCustomAttributes<ReflectionTargetAttribute>(false);
        }

        [Benchmark]
        public void New()
        {
            var instance = new ReflectionTarget();
        }

        [Benchmark]
        public void Lambda()
        {
            var instance = new ReflectionTarget();
        }

        [Benchmark]
        public void Activator_CreateInstance()
        {
            var instance = (ReflectionTarget) Activator.CreateInstance(_targetType);
        }

        [Benchmark]
        public void Activator_CreateInstance_Generic()
        {
            var instance = Activator.CreateInstance<ReflectionTarget>();
        }

        [Benchmark]
        public void Expression_New()
        {
            var @new = Expression.New(typeof(ReflectionTarget));
            var lambda = Expression.Lambda<Func<ReflectionTarget>>(@new).Compile();
            var instance = lambda.Invoke();
        }

        [Benchmark]
        public void CachedExpression_New()
        {
            var instance = CachedExpressionFunc.Invoke();
        }
    }
}
```

### IsDefined 和 GetCustomAttribute 的专项比较

```csharp
using System;
using System.Reflection;
using BenchmarkDotNet.Attributes;

namespace Walterlv.Demo.Reflection
{
    public class IsDefinedVsGetCustomAttribute
    {
        private static readonly Type _targetType = typeof(ReflectionTarget);

        [Benchmark(Baseline = true)]
        public void IsDefined()
        {
            var isDefined = _targetType.IsDefined(typeof(ReflectionTargetAttribute), false);
        }

        [Benchmark]
        public void GetCustomAttribute()
        {
            var attribute = _targetType.GetCustomAttribute(typeof(ReflectionTargetAttribute), false);
        }

        [Benchmark]
        public void GetGenericCustomAttribute()
        {
            var attribute = _targetType.GetCustomAttribute<ReflectionTargetAttribute>(false);
        }
    }
}
```

---

**参考资料**

- [c# - Is there a benefit of using IsDefined over GetCustomAttributes - Stack Overflow](https://stackoverflow.com/a/14719740/6233938)
- [Accessing Attributes by Using Reflection (C#) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/concepts/attributes/accessing-attributes-by-using-reflection?wt.mc_id=MVP)
- [win10 uwp 反射](https://blog.lindexi.com/post/win10-uwp-%E5%8F%8D%E5%B0%84.html)
- [Reference Source](https://referencesource.microsoft.com/#mscorlib/system/rttype.cs,a4aa0f217732eb81)
- [A Super-Fast C# Extension Method using Expression Trees to Create an instance from a Type](http://geekswithblogs.net/mrsteve/archive/2012/02/19/a-fast-c-sharp-extension-method-using-expression-trees-create-instance-from-type-again.aspx)
- [Retrieving Custom Attributes Using Reflection - Scott Dorman](https://scottdorman.github.io/2010/05/16/retrieving-custom-attributes-using-reflection/)
- [Showtime - BenchmarkDotNet](https://benchmarkdotnet.org/)
- [Choosing RunStrategy - BenchmarkDotNet](https://benchmarkdotnet.org/articles/guides/choosing-run-strategy.html)
