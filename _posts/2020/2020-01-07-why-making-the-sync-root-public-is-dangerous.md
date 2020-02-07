---
title: "为什么不应该公开用来同步的加锁对象？为什么不应该 lock(this)/lock(string) 或者 lock 任何非私有对象？"
date: 2020-01-07 09:29:31 +0800
categories: dotnet csharp
position: knowledge
---

如果你编写线程安全代码时为了省事儿直接 `lock(this)`，或者早已听说不应该 `lock(this)`，只是不知道原因，那么阅读本文可以帮助你了解原因。

---

<div id="toc"></div>

## 原因

不应该 `lock(this)` 是因为你永远不知道别人会如何使用你的对象，永远不知道别人会在哪里加锁。于是稍不注意就可能死锁！

## 实例

看看下面的两段代码。

第一段是定义好的一个类，其中某个方法为了线程安全加了锁，但加锁的是 `this` 对象。

```csharp
public class Foo
{
    public void DoSafety()
    {
        lock (this)
        {
            // 执行一些线程安全的事情。
        }
    }
}
```

第二段代码使用了这个类的一个实例。为了响应放到了后台线程中，但为了线程安全，加了锁。

```csharp
public class Bar
{
    private readonly Foo _foo = new Foo();

    public async void DouB_Walterlv()
    {
        lock (_foo)
        {
            await Task.Run(() => _foo.DoSafety());
        }
    }
}
```

仔细看看这段代码，如果 `DouB_Walterlv` 方法执行，会发生什么？

—— **死锁**

在 `DouB_Walterlv` 方法中完全看不出来为什么死锁，只能进入到 `DoSafety` 中才发现试图 `lock` 的 `this` 对象刚刚在另一个线程被 `lock (_foo)` 了。

## 扩展

从以上的例子可以看出，不止是 `lock (this)` 会出现“难以捉摸”的死锁问题，`lock` 任何公开对象都会这样。

### lock 公开的属性

```csharp
public class Foo
{
    public object SyncRoot { get; } = new object();
}
```

只要在 A 处 `lock` 这个对象的同时，在另一个线程调用了同样 `lock` 这个对象的 B 处的代码，必然死锁。

如果你试图实现某些接口中的 `SyncRoot` 属性，却遇到了上述矛盾（这样的写法不安全），那么可以阅读我的另一篇博客了解如何实现这样的“有问题”的接口：

- [为什么实现 .NET 的 ICollection 集合时需要实现 SyncRoot 属性？如何正确实现这个属性？](/post/sync-root-on-collections)

### lock 字符串

你可以定义一个私有的字符串，但你永远不知道这个字符串是否与其他字符串是同一个实例。因此这也是不安全的。

- [.NET/C# 的字符串暂存池 - walterlv](/post/string-intern-pool)
- [.NET/C# 编译期间能确定的相同字符串，在运行期间是相同的实例 - walterlv](/post/same-strings-at-compile-time-are-the-same-instances-at-runtime)
- [.NET/C# 编译期能确定的字符串会在字符串暂存池中不会被 GC 垃圾回收掉 - walterlv](/post/compile-time-strings-are-in-the-string-intern-pool)

### lock 其他任何可能被其他对象获取的公开对象

比如 `Type` 对象，比如其他公共静态对象。

## 结论

所以，一旦你决定 `lock`，那么这个对象请做成 `private`。
