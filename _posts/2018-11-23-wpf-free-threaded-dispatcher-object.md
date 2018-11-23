---
title: "WPF 中那些可跨线程访问的 DispatcherObject（WPF Free Threaded Dispatcher Object）"
date: 2018-11-23 08:59:34 +0800
categories: wpf
---

众所周知的，WPF 中多数对象都继承自 `DispatcherObject`，而 `DispatcherObject` 带给这些对象一个特点：不能跨线程访问。

不过，WPF 中依然存在一些例外。本文将介绍 WPF 那些可跨线程访问的 `DispatcherObject`，如何充分利用这个特点提高应用程序的性能，以及如何自己编写这样的 `DispatcherObject`。

---

<div id="toc"></div>

### 什么样的 DispatcherObject 可以跨线程访问？

要了解什么样的 `DispatcherObject` 可以跨线程访问，需要知道 WPF 是如何限制对象的跨线程访问的。

#### Dispatcher 属性

`DispatcherObject` 类有一个 `Dispatcher` 属性，它长下面这样：

```csharp
public Dispatcher Dispatcher
{
    get
    {
        // This property is free-threaded.
        return _dispatcher;
    }
}
```

属性在 `Dispatcher` 的构造函数中被赋值：

```csharp
protected DispatcherObject()
{
    _dispatcher = Dispatcher.CurrentDispatcher;
}
```

#### CheckAccess 和 VerifyAccess

`DispatcherObject` 提供了两种验证 `Dispatcher` 的方法，`CheckAccess` 和 `VerifyAccess`；他们内部的实现是调用 `Dispatcher` 类型的 `CheckAccess` 和 `VerifyAccess` 方法。

`CheckAccess` 用于检查调用线程对此对象是否有访问权，如果有访问权，则返回 `true`，否则返回 `false`。而 `VerifyAccess` 也是用于检查调用线程对此对象是否有访问权，如果没有访问权会抛出异常。

你可以阅读这两个方法的代码来了解其实现原理。每个方法只有短短的一两行而已，非常容易理解。

```csharp
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
    return Thread == Thread.CurrentThread;
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
    if(!CheckAccess())
    {
        throw new InvalidOperationException(SR.Get(SRID.VerifyAccess));
    }
}
```

需要说明的是，只有调用这两个方法才会对线程的访问权限进行检查。如果你写一个类继承自 `DispatcherObject` 而在你的属性和方法中不直接或间接调用 `VerifyAccess`，那么这是不受线程访问限制的。

只不过，WPF 封装的大多对象和属性都调用了 `VerifyAccess`（例如依赖项属性），所以很大程度上限制了 WPF UI 的线程访问权限。

#### _dispatcher 的重新赋值

`Dispatcher` 属性的获取实际上就是在拿 `_dispatcher` 字段的值。于是我们现在仔细寻找 `_dispatcher` 的所有赋值代码，只有三处，就是下面这三个方法：

1. 构造函数，会赋值为当前线程的 `Dispatcher`；
1. `DetachFromDispatcher`，会赋值为 `null`；
1. `MakeSentinel`，会赋值为另一个线程的 `Dispatcher` 的值（即一个线程创建，但由另一个线程来使用）。

```csharp
/// <summary>
///     Instantiate this object associated with the current Dispatcher.
/// </summary>
protected DispatcherObject()
{
    _dispatcher = Dispatcher.CurrentDispatcher;
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
```

于是我们发现，实际上 `Dispatcher` 属性虽然在 `DispatcherObject` 对象创建的时候会赋值，但实际上提供了多种方法来修改值。有的是修改成另一个线程的 `Dispatcher`，而有的就是粗暴地赋值为 `null`。

#### _dispatcher 赋值为 null

无论是 `CheckAccess` 还是 `VerifyAccess` 方法，实际上都对 `null` 进行了判断。

```csharp
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
```

注释中说明：

> Note: a DispatcherObject that is not associated with a dispatcher is considered to be free-threaded.

也就是说，如果一个 `DispatcherObject` 对象没有任何被关联的 `Dispatcher`，那么就被认为这个 `DispatcherObject` 没有线程访问限制，此对象将允许被任何线程访问。

### 哪些 DispatcherObject 是可以跨线程访问的？

通过阅读 `DispatcherObject` 的源码，我们可以知道 `DispatcherObject` 其实是允许跨线程访问的，它只是在刚刚创建的时候如果没有其他额外的方法调用使得 `Dispatcher` 属性改变，那么就只能被创建它的线程访问。

但也需要注意，能够改变 `Dispatcher` 属性值的两个方法 `DetachFromDispatcher` 和 `MakeSentinel` 都是 `internal` 的。这意味着只有微软自己在 WindowsBase、PresentationCore 和 PresentationFramework 程序集中编写的类型才能修改其值。可是，有哪些类呢？

通过查找 `DetachFromDispatcher` 的引用，我找到了以下类型：

- `Freezable`
- `ResourceDictionary`
- `Style`
- `StyleHelper`
- `TriggerBase`
- `BeginStoryboard`

也就是说，这些类型的实例会在某种特定的条件下从单线程访问权限变为可被任意跨线程访问。

而查找 `MakeSentinel` 的引用，又可以找到：

- `ItemsControl`

也就是说，`ItemsControl` 类在某种情况下提供了一种在一个线程中创建对象，在另外一个线程中使用的特性。

#### Freezable

`Freezable` 是继承自 `DispatcherObject` 的一个抽象类，其出现的主要目的就是解决 WPF 单线程模型带来的负面性能影响。

`Freezable` 主要由那些与图形渲染强相关的 WPF 类型继承，比如 `Brush`、`Transform`、`Geometry`、`D3DImage` 还有各种动画等。典型的，这些类型都对高性能渲染有要求。这些类型的刚开始创建的时候只能由创建的对象对它进行修改，而且在修改的时候还会引发 `Changed` 事件以便相关类型对其进行处理。不过，一旦 `Freeze`，这些类型将变成不可修改，这时不会也不需要再引发 `Changed` 事件，可以提升性能，同时对所有线程开放访问权限，这样能继续提升性能。

你可以对 `Freezable` 对象调用 `Freeze()` 方法，调用之后，其 `Dispatcher` 属性会被设为 `null`，于是对象可以跨线程访问。

在 XAML 中，你可以通过指定 `PresentationOptions:Freeze` 特性达到同样的目的。如下面的例子，`SolidColorBrush` 对象在创建完设置完所有的值之后，会调用 `Freeze` 冻结这个对象以便跨线程访问。

```xml
<Page 
  xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
  xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
  xmlns:PresentationOptions="http://schemas.microsoft.com/winfx/2006/xaml/presentation/options" 
  xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
  mc:Ignorable="PresentationOptions">
  <Page.Resources>
    <!-- 此 SolidColorBrush 会被 Freeze -->
    <SolidColorBrush x:Key="Walterlv.Brush.Demo" PresentationOptions:Freeze="True" Color="Red" />
  </Page.Resources>
</Page>
```

---

#### 参考资料

- [Freezable Objects Overview - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/wpf/advanced/freezable-objects-overview)
