---
title: "设计一个 .NET 可用的弱引用集合（可用来做缓存池使用）"
date: 2019-08-04 14:49:21 +0800
categories: dotnet csharp
position: open
---

我们有弱引用 `WeakReference<T>` 可以用来保存可被垃圾回收的对象，也有可以保存键值对的 `ConditionalWeakTable`。

我们经常会考虑制作缓存池。虽然一般不推荐这么设计，但是你可以使用本文所述的方法和代码作为按垃圾回收缓存的缓存池的设计。

---

<div id="toc"></div>

## 设计思路

既然现有 `WeakReference<T>` 和 `ConditionalWeakTable` 可以帮助我们实现弱引用，那么我们可以考虑封装这两个类中的任何一个或者两个来帮助我们完成弱引用集合。

`ConditionalWeakTable` 类型仅仅在 `internal` 级别可以访问到集合中的所有的元素，对外开放的接口当中是无法拿到集合中的所有元素的，仅仅能根据 Key 来找到 Value 而已。所以如果要根据 `ConditionalWeakTable` 来实现弱引用集合那么需要自己记录集合中的所有的 Key，而这样的话我们依然需要自己实现一个用来记录所有 Key 的弱引用集合，相当于鸡生蛋蛋生鸡的问题。

所以我们考虑直接使用 `WeakReference<T>` 来实现弱引用集合。

自己维护一个列表 `List<WeakReference<T>>`，对外开放的 API 只能访问到其中未被垃圾回收到的对象。

## 设计原则

在设计此类型的时候，有一个非常大的需要考虑的因素，就是此类型中的元素个数是不确定的，如果设计不当，那么此类型的使用者可能写出的每一行代码都是 Bug。

你可以参考我的另一篇博客了解设计这种不确定类型的 API 的时候的一些指导：

- [如何为非常不确定的行为（如并发）设计安全的 API，使用这些 API 时如何确保安全](/post/design-principles-of-uncertain-behavior)

总结起来就是：

- 必须提供一个单一的方法，能够完成一些典型场景下某一时刻确定性状态的获取
- 绝不能提供一些可能多次调用获取状态的方法

那么这个原则怎么体现在此弱引用集合的类型设计上呢？

## 设计实践

### 分析踩坑

#### `IList<T>`

我们来看看 `IList<T>` 接口是否可行：

```csharp
public class WeakCollection<T> : IList<T> where T : class
{
    public T this[int index] { get => throw new NotImplementedException(); set => throw new NotImplementedException(); }
    public int Count => throw new NotImplementedException();
    public bool IsReadOnly => throw new NotImplementedException();
    public void Add(T item) => throw new NotImplementedException();
    public void Clear() => throw new NotImplementedException();
    public bool Contains(T item) => throw new NotImplementedException();
    public void CopyTo(T[] array, int arrayIndex) => throw new NotImplementedException();
    public IEnumerator<T> GetEnumerator() => throw new NotImplementedException();
    public int IndexOf(T item) => throw new NotImplementedException();
    public void Insert(int index, T item) => throw new NotImplementedException();
    public bool Remove(T item) => throw new NotImplementedException();
    public void RemoveAt(int index) => throw new NotImplementedException();
    IEnumerator IEnumerable.GetEnumerator() => throw new NotImplementedException();
}
```

`this[]`、`Count`、`IsReadOnly`、`Contains`、`CopyTo`、`IndexOf`、`GetEnumerator` 这些都是在获取状态，`Add`、`Clear`、`Remove` 是在修改状态，而 `Insert`、`RemoveAt` 会在修改状态的同时读取状态。

这么多的获取和修改状态的方法，如果提供出去，还指望使用者能够正常使用，简直是做梦！违背以上两个原则。

#### `ICollection<T>`

那我们看看 `IList<T>` 的底层集合 `ICollection<T>`，实际上并没有解决问题，所以依然排除不能用！

```diff
    public class WeakCollection<T> : ICollection<T> where T : class
    {
--      public T this[int index] { get => throw new NotImplementedException(); set => throw new NotImplementedException(); }
        public int Count => throw new NotImplementedException();
        public bool IsReadOnly => throw new NotImplementedException();
        public void Add(T item) => throw new NotImplementedException();
        public void Clear() => throw new NotImplementedException();
        public bool Contains(T item) => throw new NotImplementedException();
        public void CopyTo(T[] array, int arrayIndex) => throw new NotImplementedException();
        public IEnumerator<T> GetEnumerator() => throw new NotImplementedException();
--      public int IndexOf(T item) => throw new NotImplementedException();
--      public void Insert(int index, T item) => throw new NotImplementedException();
        public bool Remove(T item) => throw new NotImplementedException();
--      public void RemoveAt(int index) => throw new NotImplementedException();
        IEnumerator IEnumerable.GetEnumerator() => throw new NotImplementedException();
    }
```

不过，`Add` 和 `Remove` 方法可能我们会考虑留下来，但这就不能是继承自 `ICollection<T>` 了。

#### `IEnumerable<T>`

`IEnumerable<T>` 里面只有两个方法，看起来少多了，那么我们能用吗？

```csharp
public IEnumerator<T> GetEnumerator() => throw new NotImplementedException();
IEnumerator IEnumerable.GetEnumerator() => throw new NotImplementedException();
```

这个方法仅供 `foreach` 使用，本来如果只是如此的话，问题还不是很大，但针对 `IEnumerator<T>` 有一大堆的 Linq 扩展方法，于是这相当于给此弱引用集合提供了大量可以用来读取状态的方法。

**这依然非常危险！**

使用者随时可能使用其中一个扩展方法得到了其中一个状态，随后使用另一个扩展方法得知其第二个状态，例如：

```csharp
// 判断集合中是否存在 IFoo 类型以及是否存在 IBar 类型。
var hasFoo = weakList.OfType<IFoo>().Any();
var hasBar = weakList.OfType<IBar>().Any();
```

对具有并发开发经验的你来说，以上方法第一眼就能识别出这是不正确的写法。然而类型既然已经开放出去给大家使用了，那么这就非常危险。关键是这不是一个并发场景，于是开发者可能更难感受到在同一个上下文中调用两个方法将得到不确定的结果。对于并发可以使用锁，但对于弱引用，没有可以使用的相关方法来快速解决问题。

因此，`IEnumerable<T>` 也是不能继承的。

#### `object`

看来，我们只能继承自单纯的 `object` 基类了。此类型没有对托管来说可见的状态，于是谁也不会多次读取状态造成状态不确定了。

因此，我们需要自行实现所有场景下的 API。

### 动手

弱引用集合我们需要这些使用场景：

- 向弱引用集合中添加一个元素 `此场景下仅仅修改集合而不需要读取任何状态。`
- 向弱引用集合中移除一个元素 `既然可以在参数中传入元素，说明此元素一定没有会垃圾回收；因此只要集合中还存在此元素，一定可以确定地移除，不会出现不确定的状态。`
- 在弱引用集合中找到符合要求的一个或多个元素 `一旦满足要求，必须得到完全确定的结果，且在此结果保存的过程中一直生效。`

可选考虑下面这些场景：

- 清除所有元素 `通常是为了复用某个缓存池的实例。`

一定不能实现下面这些方法：

- 判断是否存在某个元素 `因为判断是否存在通常不是单独的操作，通常会使用此集合继续下一个操作，因此一定不能直接提供。`
- 其他在本文前面已经喷过不能添加进来的方法

<!-- 另外，名字也不能叫做 `XxxCollection` 了，因为这会让人觉得这是一个确定的集合。可以参考并发集合中的 `ConcurrentBag` 的命名方式，这是一个容器，里面有不确定的元素。或者干脆按照其使用场景（业务）进行命名，叫做 `XxxMemoryCache`。 -->

于是，我们的 API 设计将是这样的：

```csharp
public class WeakCollection<T> where T : class
{
    public void Add(T item) => throw new NotImplementedException();
    public bool Remove(T item) => throw new NotImplementedException();
    public void Clear() => throw new NotImplementedException();
    public T[] TryGetItems(Func<T, bool> filter) => throw new NotImplementedException();
}
```

## 完整代码

此类型已经以源代码包的形式发布到了 NuGet 上，你可以安装以下 NuGet 包阅读和使用其源代码：

- [Walterlv.Collections.Source](https://www.nuget.org/packages/Walterlv.Collections.Source)

安装后，你可以在你的项目中使用其源代码，并且可以直接使用 Ctrl + 鼠标点击的方式打开类型的源代码，而不需要进行反编译。
