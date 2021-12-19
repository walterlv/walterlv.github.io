---
title: ".NET/C# 推荐一个我设计的缓存类型（适合缓存反射等耗性能的操作，附用法）"
publishDate: 2018-09-02 22:27:47 +0800
date: 2018-09-02 15:59:05 +0800
tags: dotnet csharp
---

这里我想说的是类型“实例”的缓存，适用于那些实例或者值计算很耗时的操作。典型的场景如反射获取 `Attribute`。

---

<div id="toc"></div>

## 适用

本文推荐的方法适用于相同的输入可以获得相同的输出，但是这个输入到输出的过程非常耗时。

大家都知道反射是很耗时的，尤其是获取 `Attribute` 和反射调用实例的方法。而从一个反射的成员中得到其 `Attribute` 是唯一的输入对应唯一的输出。

## 思路

既然唯一的输入对应唯一的输出，那么我们可以通过一个字典来储存我们已经转换过的输出。

```csharp
// 其中 TSource 表示输入的类型，TCache 表示输出的类型。
Dictionary<TSource, TCache> _cacheDictionary = new Dictionary<TSource, TCache>();
```

然后我们把已经计算过输出的输入存入到这个字典中。这样，当我们试图重新计算相同输入的输出的时候，便可以直接从字典中取得所需的输出的值。

为了通用一点，我设计一个类型 `CachePool<TSource, TCache>`：

```csharp
namespace Walterlv
{
    public sealed class CachePool<TSource, TCache>
    {
        Dictionary<TSource, TCache> _cacheDictionary = new Dictionary<TSource, TCache>();

        private TCache GetOrCacheValue(TSource source)
        {
            // 从这里计算新值或者从字典中获取已经计算的值。
        }
    }
}
```

这个计算过程是唯一确定的，所以我们可以从构造函数中传入并储存下来。

```csharp
public CachePool([NotNull] Func<TSource, TCache> conversion)
{
    _convert = conversion ?? throw new ArgumentNullException(nameof(conversion));
}

private readonly Func<TSource, TCache> _convert;
```

于是我们的缓存类已经近乎完成。为了线程安全，我加了锁；但考虑到部分情况下性能更重要，所以我把锁设为了可选项。

## 代码

代码我放到了 [gist.github.com](https://gist.github.com/walterlv)，[walterlv/CachePool.cs](https://gist.github.com/walterlv/85c43ce2c064e7a2bd2b70756b968cd5)。

你可以直接点击以上链接查看。为了不影响本文的阅读，我把实际的代码放到了最后。

## 用法

### 高性能创建对象

比如你认为反射创建对象是一个耗时的操作，那么可以将构造函数的调用创建成一个委托，然后把这个委托缓存下来。这样，下次创建相同对象的时候就不需要反射调用构造函数了，而是直接调用委托拿到对象的新实例。

```csharp
private static readonly CachePool<Type, Func<object>> ConstructorCache =
    new CachePool<Type, Func<object>>(x =>
        Expression.Lambda<Func<object>>(Expression.New(x)).Compile());
```

### 高性能为属性赋值

我在 [如何快速编写和调试 Emit 生成 IL 的代码](/post/how-to-quickly-write-emit-code) 一文中创建了可以为属性赋值的委托，你也可以使用此方法将委托缓存下来，以便每次给相同类型的相同属性赋值时能有不那么差的性能。

### 高性能“反射”调用函数

调用函数所得的结果可是不一样的，所以直接缓存函数结果是不靠谱的，不过我们依然可以将反射调用缓存为委托的调用。我在 [.NET Core/Framework 创建委托以大幅度提高反射调用的性能](/post/create-delegate-to-improve-reflection-performance) 一文中有介绍。

## 附代码

<script src="https://gist.github.com/walterlv/85c43ce2c064e7a2bd2b70756b968cd5.js"></script>
