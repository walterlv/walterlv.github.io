---
title: ".NET/C# 推荐一个我设计的缓存类型"
date: 2018-09-02 15:44:44 +0800
categories: dotnet csharp
---

这里我想说的是类型“实例”的缓存，适用于那些实例或者值计算很耗时的操作。典型的场景如反射获取 `Attribute`。

---

<div id="toc"></div>

### 适用

本文推荐的方法适用于相同的输入可以获得相同的输出，但是这个输入到输出的过程非常耗时。

大家都知道反射是很耗时的，尤其是获取 `Attribute` 和反射调用实例的方法。而从一个反射的成员中得到其 `Attribute` 是唯一的输入对应唯一的输出。

### 思路

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

### 代码

代码我放到了 [gist.github.com](https://gist.github.com/walterlv)，[walterlv/CachePool.cs](https://gist.github.com/walterlv/85c43ce2c064e7a2bd2b70756b968cd5)。

```csharp
using System;
using System.Collections.Generic;
using Walterlv.Annotations;

namespace Walterlv
{
    /// <summary>
    /// 如果获取 <typeparamref name="TSource"/> 对应信息的过程比较耗时（例如反射），
    /// 则可使用 <see cref="CachePool{TSource,TCache}"/> 对此过程进行缓存。
    /// </summary>
    /// <typeparam name="TSource">为了获取信息所需的源对象。</typeparam>
    /// <typeparam name="TCache">获取的信息将会储存在此类型的缓存对象中。</typeparam>
    public sealed class CachePool<TSource, TCache>
    {
        /// <summary>
        /// 使用特定的转换器创建 <see cref="CachePool{TSource,TCache}"/> 的新实例。
        /// </summary>
        /// <param name="conversion">从源对象到目标对象的转换方法，此方法仅执行一次。</param>
        /// <param name="threadSafe">如果获取缓存的过程可能在不同线程，则设置此值为 true，以便让缓存过程是线程安全的。</param>
        public CachePool([NotNull] Func<TSource, TCache> conversion, bool threadSafe = false)
        {
            _convert = conversion ?? throw new ArgumentNullException(nameof(conversion));
            _locker = threadSafe ? new object() : null;
        }

        /// <summary>
        /// 从缓存池中获取缓存的信息，如果从未获取过信息，则将会执行一次
        /// 从 <typeparamref name="TSource"/> 到 <typeparamref name="TCache"/> 的转换。
        /// </summary>
        /// <param name="source">为了获取信息所需的源对象。</param>
        /// <returns>缓存的对象。</returns>
        public TCache this[TSource source] => GetOrCacheValue(source);

        /// <summary>
        /// 获取锁，如果此值为 null，说明无需加锁。
        /// </summary>
        [CanBeNull]
        private readonly object _locker;

        /// <summary>
        /// 获取转换对象的方法。
        /// </summary>
        private readonly Func<TSource, TCache> _convert;

        /// <summary>
        /// 获取缓存了 <typeparamref name="TCache"/> 的字典。
        /// </summary>
        private readonly Dictionary<TSource, TCache> _cacheDictionary =
            new Dictionary<TSource, TCache>();

        /// <summary>
        /// 从缓存池中获取缓存的信息，如果从未获取过信息，则将会执行一次
        /// 从 <typeparamref name="TSource"/> 到 <typeparamref name="TCache"/> 的转换。
        /// </summary>
        private TCache GetOrCacheValue(TSource source)
        {
            // 如果不需要加锁，则直接返回值。
            if (_locker == null)
            {
                return GetOrCacheValue();
            }

            // 如果需要加锁，则加锁后返回值。
            lock (_locker)
            {
                return GetOrCacheValue();
            }

            // 如果存在缓存，则获取缓存；否则从源值转换成缓存。
            TCache GetOrCacheValue()
            {
                if (!_cacheDictionary.TryGetValue(source, out var cache))
                {
                    cache = _convert(source);
                    _cacheDictionary[source] = cache;
                }

                return cache;
            }
        }
    }
}
```
