---
title: "为什么实现 .NET 的 ICollection 集合时需要实现 SyncRoot 属性？如何正确实现这个属性？"
publishDate: 2020-01-07 09:29:41 +0800
date: 2020-01-28 16:53:15 +0800
tags: dotnet csharp
position: knowledge
---

非泛型版本的 `ICollection` 中有 `IsSynchronized` 属性和 `SyncRoot` 属性，这两个属性被用来设计成以线程安全的方式访问和修改集合。不过这个设计让线程安全的访问由集合的实现方转嫁到了调用方，导致要么很难实现，要么很难调用。

虽然泛型版本的 `ICollection<T>` 已经改进了设计，不再引入 `SyncRoot` 这样的属性到接口中，但如果我们在某些场景下需要实现 `ICollection` 非泛型集合时，如何正确实现 SyncRoot 模式（SyncRoot Pattern）呢？

---

先上结论：

—— **不可能正确实现 SyncRoot 模式**

在多线程程序设计中，为了在保证线程安全的同时避免死锁，**不应该公开同步锁**。而 `ICollection` 接口中的 `SyncRoot` 属性在接口中必然是公开的，于是没有任何途径可以保证调用方不会发生死锁。

于是实现 `SyncRoot` 的正确方法应该是：

—— **避免公开 SyncRoot 属性**

所以 SyncRoot 模式应该这样实现：

1. 使用显式接口实现，避免公开暴露此属性
2. 抛出异常，避免调用者使用此属性

结合 .NET Core 源代码中的一些常用写法，我给出一个推荐的 SyncRoot 模式的写法：

```csharp
// Is this List synchronized (thread-safe)?
bool ICollection.IsSynchronized => false;

// Synchronization root for this object.
object ICollection.SyncRoot => this;
```

嗯，没错，返回了 `this`，这是各种同步时绝对不应该使用的对象。然而这个属性都是 `public` 了，不管返回什么，与 `this` 还有什么区别……

关于为什么同步时不应该返回 `this` 或者返回公开的对象，原因可以看我的另一篇博客：

- [为什么不应该公开用来同步的加锁对象？为什么不应该 lock(this)/lock(string) 或者 lock 任何非私有对象？ - walterlv](/post/why-making-the-sync-root-public-is-dangerous)
