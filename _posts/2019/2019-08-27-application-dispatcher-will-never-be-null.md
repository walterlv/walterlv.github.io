---
title: "WPF 的 Application.Current.Dispatcher 中，Dispatcher 属性一定不会为 null"
publishDate: 2019-08-27 10:10:50 +0800
date: 2019-08-27 12:51:43 +0800
categories: wpf dotnet csharp
position: problem
---

在 WPF 程序中，可能会存在 `Application.Current.Dispatcher.Xxx` 这样的代码让一部分逻辑回到主 UI 线程。因为发现在调用这句代码的时候出现了 `NullReferenceException`，于是就有三位小伙伴告诉我说 `Current` 和 `Dispatcher` 属性都可能为 `null`。

然而实际上这里只可能 `Current` 为 `null` 而此上下文的 `Dispatcher` 是绝对不会为 `null` 的。（当然我们这里讨论的是常规编程手段，如果非常规手段，你甚至可以让实例的 `this` 为 `null` 呢……）

---

由于本文所述的两个部分都略长，所以拆分成两篇博客，这样更容易理解。

- [WPF 的 Application.Current.Dispatcher 中，Dispatcher 属性一定不会为 null](/post/application-dispatcher-will-never-be-null)
- [WPF 的 Application.Current.Dispatcher 中，为什么 Current 可能为 null](/post/application-current-may-be-null)

<div id="toc"></div>

## `Application.Dispatcher` 实例属性

`Application.Dispatcher` 实例属性来自于 `DispatcherObject`。

### 源代码

为了分析此属性是否可能为 `null`，我现在将 `DispatcherObject` 的全部代码贴在下面：

```csharp
using System;
using System.Windows;
using System.Threading;
using MS.Internal.WindowsBase;               // FriendAccessAllowed
 
namespace System.Windows.Threading
{
    /// <summary>
    ///     A DispatcherObject is an object associated with a
    ///     <see cref="Dispatcher"/>.  A DispatcherObject instance should
    ///     only be access by the dispatcher's thread.
    /// </summary>
    /// <remarks>
    ///     Subclasses of <see cref="DispatcherObject"/> should enforce thread
    ///     safety by calling <see cref="VerifyAccess"/> on all their public
    ///     methods to ensure the calling thread is the appropriate thread.
    ///     <para/>
    ///     DispatcherObject cannot be independently instantiated; that is,
    ///     all constructors are protected.
    /// </remarks>
    public abstract class DispatcherObject
    {
        /// <summary>
        ///     Returns the <see cref="Dispatcher"/> that this
        ///     <see cref="DispatcherObject"/> is associated with.
        /// </summary>
        [System.ComponentModel.EditorBrowsable(System.ComponentModel.EditorBrowsableState.Advanced)]
        public Dispatcher Dispatcher
        {
            get
            {
                // This property is free-threaded.
 
                return _dispatcher;
            }
        }
 
        // This method allows certain derived classes to break the dispatcher affinity
        // of our objects.
        [FriendAccessAllowed] // Built into Base, also used by Framework.
        internal void DetachFromDispatcher()
        {
            _dispatcher = null;
        }
 
        // Make this object a "sentinel" - it can be used in equality tests, but should
        // not be used in any other way.  To enforce this and catch bugs, use a special
        // sentinel dispatcher, so that calls to CheckAccess and VerifyAccess will
        // fail;  this will catch most accidental uses of the sentinel.
        [FriendAccessAllowed] // Built into Base, also used by Framework.
        internal void MakeSentinel()
        {
            _dispatcher = EnsureSentinelDispatcher();
        }
 
        private static Dispatcher EnsureSentinelDispatcher()
        {
            if (_sentinelDispatcher == null)
            {
                // lazy creation - the first thread reaching here creates the sentinel
                // dispatcher, all other threads use it.
                Dispatcher sentinelDispatcher = new Dispatcher(isSentinel:true);
                Interlocked.CompareExchange<Dispatcher>(ref _sentinelDispatcher, sentinelDispatcher, null);
            }
 
            return _sentinelDispatcher;
        }
 
        /// <summary>
        ///     Checks that the calling thread has access to this object.
        /// </summary>
        /// <remarks>
        ///     Only the dispatcher thread may access DispatcherObjects.
        ///     <p/>
        ///     This method is public so that any thread can probe to
        ///     see if it has access to the DispatcherObject.
        /// </remarks>
        /// <returns>
        ///     True if the calling thread has access to this object.
        /// </returns>
        [System.ComponentModel.EditorBrowsable(System.ComponentModel.EditorBrowsableState.Never)]
        public bool CheckAccess()
        {
            // This method is free-threaded.
 
            bool accessAllowed = true;
            Dispatcher dispatcher = _dispatcher;
 
            // Note: a DispatcherObject that is not associated with a
            // dispatcher is considered to be free-threaded.
            if(dispatcher != null)
            {
                accessAllowed = dispatcher.CheckAccess();
            }
 
            return accessAllowed;
        }
 
        /// <summary>
        ///     Verifies that the calling thread has access to this object.
        /// </summary>
        /// <remarks>
        ///     Only the dispatcher thread may access DispatcherObjects.
        ///     <p/>
        ///     This method is public so that derived classes can probe to
        ///     see if the calling thread has access to itself.
        /// </remarks>
        [System.ComponentModel.EditorBrowsable(System.ComponentModel.EditorBrowsableState.Never)]
        public void VerifyAccess()
        {
            // This method is free-threaded.
 
            Dispatcher dispatcher = _dispatcher;
 
            // Note: a DispatcherObject that is not associated with a
            // dispatcher is considered to be free-threaded.
            if(dispatcher != null)
            {
                dispatcher.VerifyAccess();
            }
        }
 
        /// <summary>
        ///     Instantiate this object associated with the current Dispatcher.
        /// </summary>
        protected DispatcherObject()
        {
            _dispatcher = Dispatcher.CurrentDispatcher;
        }
 
        private Dispatcher _dispatcher;
        private static Dispatcher _sentinelDispatcher;
    }
}
```

代码来自：[DispatcherObject.cs](https://referencesource.microsoft.com/#WindowsBase/Base/System/Windows/Threading/DispatcherObject.cs)。

`Dispatcher` 属性仅仅是在获取 `_dispatcher` 字段的值，因此我们只需要看 `_dispatcher` 字段的赋值时机，以及所有给 `_dispatcher` 赋值的代码。

由于 `_dispatcher` 字段是私有字段，所以仅需调查这个类本身即可找到所有的赋值时机。（反射等非常规手段需要排除在外，因为这意味着开发者是逗比——自己闯的祸不能怪 WPF 框架。）

### 赋值时机

先来看看 `dispatcher` 字段的赋值时机。

`DispatcherObject` 仅有一个构造函数，而这个构造函数中就已经给 `_dispatcher` 赋值了，因此其所有的子类的初始化之前，`_dispatcher` 就会被赋值。

```csharp
protected DispatcherObject()
{
    _dispatcher = Dispatcher.CurrentDispatcher;
}
```

那么所赋的值是否可能为 `null` 呢，这就要看 `Dispatcher.CurrentDispatcher` 是否可能返回一个 `null` 了。

以下是 `Dispatcher.CurrentDispatcher` 的属性获取代码：

```csharp
public static Dispatcher CurrentDispatcher
{
    get
    {
        // Find the dispatcher for this thread.
        Dispatcher currentDispatcher = FromThread(Thread.CurrentThread);;

        // Auto-create the dispatcher if there is no dispatcher for
        // this thread (if we are allowed to).
        if(currentDispatcher == null)
        {
            currentDispatcher = new Dispatcher();
        }

        return currentDispatcher;
    }
}
```

可以看到，无论前面的方法得到的值是否是 `null`，后面都会再给 `currentDispatcher` 局部变量赋值一个新创建的实例的。因此，此属性是绝对不会返回 `null` 的。

由此可知，`DispatcherObject` 自构造起便拥有一个不为 `null` 的 `Dispatcher` 属性，其所有子类在初始化之前便会得到不为 `null` 的 `Dispatcher` 属性。

### 后续赋值

现在我们来看看在初始化完成之后，后面是否有可能将 `_dispatcher` 赋值为 null。

给 `_dispatcher` 字段的赋值代码仅有两个：

```csharp
// This method allows certain derived classes to break the dispatcher affinity
// of our objects.
[FriendAccessAllowed] // Built into Base, also used by Framework.
internal void DetachFromDispatcher()
{
    _dispatcher = null;
}

// Make this object a "sentinel" - it can be used in equality tests, but should
// not be used in any other way.  To enforce this and catch bugs, use a special
// sentinel dispatcher, so that calls to CheckAccess and VerifyAccess will
// fail;  this will catch most accidental uses of the sentinel.
[FriendAccessAllowed] // Built into Base, also used by Framework.
internal void MakeSentinel()
{
    _dispatcher = EnsureSentinelDispatcher();
}
```

第一个 `DetachFromDispatcher` 很好理解，让 `DispatcherObject` 跟 `Dispatcher` 无关。在整个 WPF 的代码中，使用此方法的仅有以下 6 处：

- `Freezable.Freeze` 实例方法
- `BeginStoryboard.Seal` 实例方法
- `Style.Seal` 实例方法
- `TriggerBase.Seal` 实例方法
- `StyleHelper` 在 `SealTemplate` 静态方法中对 `FrameworkTemplate` 类型的实例调用此方法
- `ResourceDictionary` 在构造函数中为 `DispatcherObject` 类型的 `DummyInheritanceContext` 属性调用此方法

而 `Application` 类型不是以上任何一个类型的子类（`Application` 类的直接基类是 `DispatcherObject`），因此 `Application` 类中的 `Dispatcher` 属性不可能因为 `DetachFromDispatcher` 方法的调用而被赋值为 `null`。

接下来看看 `MakeSentinel` 方法，此方法的作用不如上面方法那样直观，实际上它的作用仅仅为了验证某个方法调用时所在的线程是否是符合预期的（给 `VerifyAccess` 和 `CheckAccess` 使用）。

使用此方法的仅有 1 处：

- `ItemsControl` 所用的 `ItemInfo` 类的静态构造函数

```csharp
internal static readonly DependencyObject SentinelContainer = new DependencyObject();
internal static readonly DependencyObject UnresolvedContainer = new DependencyObject();
internal static readonly DependencyObject KeyContainer = new DependencyObject();
internal static readonly DependencyObject RemovedContainer = new DependencyObject();

static ItemInfo()
{
    // mark the special DOs as sentinels.  This helps catch bugs involving
    // using them accidentally for anything besides equality comparison.
    SentinelContainer.MakeSentinel();
    UnresolvedContainer.MakeSentinel();
    KeyContainer.MakeSentinel();
    RemovedContainer.MakeSentinel();
}
```

所有这些使用都与 `Application` 无关。

### 结论

总结以上所有的分析：

1. `Application` 类型的实例在初始化之前，`Dispatcher` 属性就已经被赋值且不为 `null`；
1. 所有可能改变 `_dispatcher` 属性的常规方法均与 `Application` 类型无关；

因此，所有常规手段均不会让 `Application` 类的 `Dispatcher` 属性拿到 `null` 值。如果你还说拿到了 `null`，那就检查是否有逗比程序员通过反射或其他手段将 `_dispatcher` 字段改为了 `null` 吧……

## `Application.Current` 静态属性

关于 `Application.Current` 是否可能为 `null` 的分析，由于比较长，请参见我的另一篇博客：

- [WPF 的 Application.Current.Dispatcher 中，Current 可能为 null](/post/application-current-may-be-null)

---

**参考资料**

- [DispatcherObject.cs](https://referencesource.microsoft.com/#WindowsBase/Base/System/Windows/Threading/DispatcherObject.cs)
