---
title: "WPF 中那些可跨线程访问的 DispatcherObject（WPF Free Threaded Dispatcher Object）"
publishDate: 2018-11-23 13:15:12 +0800
date: 2019-01-03 09:03:45 +0800
tags: wpf dotnet
---

众所周知的，WPF 中多数对象都继承自 `DispatcherObject`，而 `DispatcherObject` 带给这些对象一个特点：不能跨线程访问。

不过，WPF 中依然存在一些例外。本文将介绍 WPF 那些可跨线程访问的 `DispatcherObject`，如何充分利用这个特点提高应用程序的性能，以及如何自己编写这样的 `DispatcherObject`。

---

<div id="toc"></div>

## 什么样的 DispatcherObject 可以跨线程访问？

要了解什么样的 `DispatcherObject` 可以跨线程访问，需要知道 WPF 是如何限制对象的跨线程访问的。

### Dispatcher 属性

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

### CheckAccess 和 VerifyAccess

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

### _dispatcher 的重新赋值

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

### _dispatcher 赋值为 null

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

## 哪些 DispatcherObject 是可以跨线程访问的？

通过阅读 `DispatcherObject` 的源码，我们可以知道 `DispatcherObject` 其实是允许跨线程访问的，它只是在刚刚创建的时候如果没有其他额外的方法调用使得 `Dispatcher` 属性改变，那么就只能被创建它的线程访问。

但也需要注意，能够改变 `Dispatcher` 属性值的两个方法 `DetachFromDispatcher` 和 `MakeSentinel` 都是 `internal` 的。这意味着只有微软自己在 WindowsBase、PresentationCore 和 PresentationFramework 程序集中编写的类型才能修改其值。可是，有哪些类呢？

通过查找 `DetachFromDispatcher` 的引用，我找到了以下类型：

- `Freezable`
- `Style`
- `StyleHelper`
- `TriggerBase`
- `BeginStoryboard`
- `ResourceDictionary`

也就是说，这些类型的实例会在某种特定的条件下从单线程访问权限变为可被任意跨线程访问。（实际上 `ResourceDictionary` 并不是一个 `DispatcherObject`，不过它会访问 `Owner`，这是一个 `DependencyObject`；所以也会涉及到一点跨线程问题。）

而查找 `MakeSentinel` 的引用，又可以找到：

- `ItemsControl`

也就是说，`ItemsControl` 类在某种情况下提供了一种在一个线程中创建对象，在另外一个线程中使用的特性。

### Freezable

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
    <!-- 如果你的 mc:Ignorable 有多个，请用空格隔开。 -->
    <Page.Resources>
        <!-- 注意，在 Resource 中的 SolidColorBrush 默认情况下是不会自动 Freeze 的， -->
        <!--     但是，你可以通过指定 PresentationOptions:Freeze 特性使得它在创建完后 Freeze。 -->
        <!-- 对象在 Resources 中不会自动创建，它会在第一次被使用的时候创建， -->
        <!--     也就是说，你如果要验证它的跨线程访问，需要使用两个不同的线程访问它。 -->
        <SolidColorBrush x:Key="Walterlv.Brush.Demo" PresentationOptions:Freeze="True" Color="Red" />
    </Page.Resources>
</Page>
```

对于以上代码，有一些是需要说明的：

1. 如果你的 mc:Ignorable 有多个，请用空格隔开。
1. 在 Resource 中的 SolidColorBrush 默认情况下是不会自动 Freeze 的；但是，你可以通过指定 PresentationOptions:Freeze 特性使得它在创建完后 Freeze。
1. 对象在 Resources 中不会自动创建，它会在第一次被使用的时候创建；也就是说，你如果要验证它的跨线程访问，需要使用两个不同的线程访问它（仅仅用一个后台线程去验证它，你会发现后台线程依然能够正常访问它的依赖项属性的值）。

### Style

`Style` 是直接继承自 `DispatcherObject` 的类型，并没有 `Freeze` 相关的方法。不过这不重要，因为重要的是能够访问到内部的 `DetachFromDispatcher` 方法。

`Style` 访问 `DetachFromDispatcher` 的代码在 `public` 的 `Seal` 方法中，这是继承自 `internal` 的 `ISealable` 接口的方法。

```
internal interface ISealable
{
    bool CanSeal { get; }
    void Seal();
    bool IsSealed { get; }
}
```

为了方便理解，我把 `Seal` 方法进行简化后贴在下面：

```csharp
/// <summary>
/// This Style and all factories/triggers are now immutable
/// </summary>
public void Seal()
{
    // Verify Context Access
    VerifyAccess();

    // 99% case - Style is already sealed.
    if (_sealed) return;

    // 省略一些验证代码。

    // Seal setters
    if (_setters != null) _setters.Seal();

    // Seal triggers
    if (_visualTriggers != null) _visualTriggers.Seal();

    // Will throw InvalidOperationException if we find a loop of
    //  BasedOn references.  (A.BasedOn = B, B.BasedOn = C, C.BasedOn = A)
    CheckForCircularBasedOnReferences();

    // Seal BasedOn Style chain
    if (_basedOn != null) _basedOn.Seal();

    // Seal the ResourceDictionary
    if (_resources != null) _resources.IsReadOnly = true;

    //
    // Build shared tables
    //

    // Process all Setters set on the selfStyle. This stores all the property
    // setters on the current styles into PropertyValues list, so it can be used
    // by ProcessSelfStyle in the next step. The EventSetters for the current
    // and all the basedOn styles are merged into the EventHandlersStore on the
    // current style.
    ProcessSetters(this);

    // Add an entry in the EventDependents list for
    // the TargetType's EventHandlersStore. Notice
    // that the childIndex is 0.
    StyleHelper.AddEventDependent(0, this.EventHandlersStore, ref EventDependents);

    // Process all PropertyValues (all are "Self") in the Style
    // chain (base added first)
    ProcessSelfStyles(this);

    // Process all TriggerBase PropertyValues ("Self" triggers
    // and child triggers) in the Style chain last (highest priority)
    ProcessVisualTriggers(this);

    // Sort the ResourceDependents, to help avoid duplicate invalidations
    StyleHelper.SortResourceDependents(ref ResourceDependents);

    // All done, seal self and call it a day.
    _sealed = true;

    // Remove thread affinity so it can be accessed across threads
    DetachFromDispatcher();
}
```

具体来说，就是将 `Style` 中的所有属性进行 `Seal`，将资源设为只读；然后，将自己的 `Dispatcher` 属性设为 `null`。

### Template

不过，我们通常使用 `Style` 的方式都是在 `Style` 中写控件模板。如果控件模板不支持 `Seal`，那么 `Style` 即便 `Seal`，多数情况下也是没有用的。

在 `StyleHelper` 类型中，处理了控件模板的 `Seal`。

它处理的是 `FrameworkTemplate`，这是控件模板的基类，具体来说，有这些类型：

- `ControlTemplate`
- `DataTemplate`
- `ItemsPanelTemplate`
- `ItemContainerTemplate`
- HierarchicalDataTemplate
- ContentPresenter.DefaultTemplate
- ContentPresenter.UseContentTemplate

以下是 `StyleHelper.SealTemplate` 方法。这里原本是 `FrameworkTemplate` 内部的 `Seal` 方法的实现，不过 `Seal` 内部调到了 `StyleHelper.SealTemplate` 静态方法了。

为了便于理解，我也对其进行了精简。

```csharp
internal static void SealTemplate(
    FrameworkTemplate                                           frameworkTemplate,
    ref bool                                                    isSealed,
    FrameworkElementFactory                                     templateRoot,
    TriggerCollection                                           triggers,
    ResourceDictionary                                          resources,
    HybridDictionary                                            childIndexFromChildID,
    ref FrugalStructList<ChildRecord>                           childRecordFromChildIndex,
    ref FrugalStructList<ItemStructMap<TriggerSourceRecord>>    triggerSourceRecordFromChildIndex,
    ref FrugalStructList<ContainerDependent>                    containerDependents,
    ref FrugalStructList<ChildPropertyDependent>                resourceDependents,
    ref ItemStructList<ChildEventDependent>                     eventDependents,
    ref HybridDictionary                                        triggerActions,
    ref HybridDictionary                                        dataTriggerRecordFromBinding,
    ref bool                                                    hasInstanceValues,
    ref EventHandlersStore                                      eventHandlersStore)
{
    // This template has already been sealed. There is no more to do.
    if (isSealed) return;

    // Seal template nodes (if exists)

    if (frameworkTemplate != null) frameworkTemplate.ProcessTemplateBeforeSeal();

    if (templateRoot != null) templateRoot.Seal(frameworkTemplate);

    // Seal triggers
    if (triggers != null) triggers.Seal();

    // Seal Resource Dictionary
    if (resources != null) resources.IsReadOnly = true;

    //  Build shared tables

    StyleHelper.ProcessTemplateTriggers(
        triggers,
        frameworkTemplate,
        ref childRecordFromChildIndex,
        ref triggerSourceRecordFromChildIndex, ref containerDependents, ref resourceDependents, ref eventDependents,
        ref dataTriggerRecordFromBinding, childIndexFromChildID, ref hasInstanceValues,
        ref triggerActions, templateRoot, ref eventHandlersStore,
        ref frameworkTemplate.PropertyTriggersWithActions,
        ref frameworkTemplate.DataTriggersWithActions,
        ref hasHandler );

    frameworkTemplate.HasLoadedChangeHandler = hasHandler;

    frameworkTemplate.SetResourceReferenceState();

    // All done, seal self and call it a day.
    isSealed = true;

    // Remove thread affinity so it can be accessed across threads
    frameworkTemplate.DetachFromDispatcher();
}
```

其中，`frameworkTemplate.DetachFromDispatcher()` 方法即调用基类 `DispatcherObject` 中的 `DetachFromDispatcher` 方法。

方法内部也是对各种属性进行了 `Seal` 和只读化处理。最后，将自己的 `Dispatcher` 属性设为 `null`。

### Style 和 Template

由于每次应用模板的时候，都是创建新的 UI 控件，所以实际上通过模板创建的 UI 对象并不会产生跨线程访问的问题。也就是说，当 `Style` 和 `Template` 设置为可跨线程访问之后，是可以被多个线程同时访问创建控件而不会产生跨线程访问的问题。

写在 XAML 中的 `ISealable` 在创建的时候就会执行 `Seal()`。也就是说，你只要在 XAML 中写下了这个对象，那么就会在创建完后 `Seal`。这点跟 `Freezable` 是不一样的，`Freezable` 是需要自己主动编写 XAML 或 C# 代码进行 `Freeze` 的。

从这里可以推论出，你在 XAML 中写的样式，可以被跨线程访问而不会出现线程安全问题。

## 强制让一个 DispatcherObject 跨线程访问

从前面的各种源码分析来看，使用常规方法让任意一个对象进行跨线程访问几乎是不可能的了。剩下的就只是做一些邪恶的事情了，比如 —— 反射。

可以反射调用 `DetachFromDispatcher` 方法，将 `Dispatcher` 属性值清空，这样的对象将可以跨所有线程访问。不过要小心，你随意写的对象可能实际上是不具备跨线程访问能力的，这样的修改可能导致线程安全问题，你需要自行承担后果。

可以反射直接修改 `_dispatcher` 字段的值，改为目标线程中的 `Dispatcher`。这样的做法只是切换了一个线程，效果和调用 `MakeSentinel` 是一样的。使用这样的方式可以让创建对象的线程和使用对象的线程分开，适用于创建对象需要花费大量时间的对象 —— 如 `BitmapImage`。

特别的，如果你的对象中有子 `DispatcherObject` 对象，你需要像上面的源码那样将所有子对象的 `Dispatcher` 属性都进行替换才行。

为了方便，我写了一个辅助方法来完成这样的 `Dispatcher` 属性值切换。

```csharp
using System;
using System.Reflection;
using System.Threading;
using System.Windows.Threading;

namespace Walterlv.Windows.Threading
{
    /// <summary>
    /// 包含 <see cref="DispatcherObject"/> 及其派生类对象切换所属线程的相关方法。
    /// </summary>
    public static class DispatcherSwitcher
    {
        /// <summary>
        /// 延迟初始化 <see cref="Dispatcher"/> 类型中的 _dispatcher 字段。
        /// </summary>
        private static readonly Lazy<FieldInfo> DispatcherFieldInfo =
            new Lazy<FieldInfo>(() => typeof(DispatcherObject).GetField("_dispatcher", BindingFlags.NonPublic | BindingFlags.Instance),
                LazyThreadSafetyMode.None);

        /// <summary>
        /// 将指定的 <see cref="DispatcherObject"/> 对象的所属线程切换至指定调度器所属的线程。
        /// 注意：如果此对象包含嵌套的其他对象，则极有可能会发生跨线程访问的异常，请谨慎使用！
        /// </summary>
        /// <param name="d"></param>
        /// <param name="dispatcher"></param>
        internal static void SwitchTo(DispatcherObject d, Dispatcher dispatcher)
        {
            if (d.Dispatcher == dispatcher) return;

            var field = DispatcherFieldInfo.Value;
            if (field == null)
            {
                throw new FieldAccessException();
            }

            field.SetValue(d, dispatcher);
        }
    }
}
```

## 总结

1. 为什么 `DispatcherObject` 可以限制跨线程访问？
    - 因为内部有 `CheckAccess` 和 `VerifyAccess` 方法检查线程的访问权限
    - 众多子类的属性和方法在使用前调用了 `VerifyAccess` 来验证调用方的线程

1. 在 XAML 中编写的代码时，定义在 FrameworkElement 的 Resources 中的对象，哪些可以跨线程访问，哪些不可以跨线程访问？
    - 非继承自 `DispatcherObject` 的对象可以跨线程访问（这里就不要钻牛角尖说自己写的烂类了）
        - 比如 `<system:String>Walterlv</system:String>`
    - 继承自 `DispatcherObject` 的对象，但是同时实现了内部 `ISealable` 接口的对象
        - 比如 `Style`、`Template`、`DataTemplate`、`ItemTemplate` 等
    - 继承自 `Freezable` 的对象
        - 指定了 `PresentationOptions:Freeze="True"` 特性的对象可以跨线程访问
        - 没有指定此特性的对象不可以跨线程访问
        - 这些对象比如 `Brush`、`Transform`、`Geometry`、`D3DImage` 还有各种动画等
    - 其他 `DispatcherObject` 对象
        - 不可以跨线程访问（当然你自己写的类型，没有访问基类的 `VerifyAccess` 的话就没事）
        
1. 可以随意切换 `DispatcherObject` 关联的 `Dispatcher` 吗？
    - 不可以随意切换，因为切换关联 `Dispatcher` 的方法都是 `internal` 的
    - 不过我们可以使用反射来间接实现这个效果（当然，你需要自行承担线程安全后果，以及切换不完全造成的跨线程访问问题）

---

**参考资料**

- [Freezable Objects Overview - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/wpf/advanced/freezable-objects-overview?wt.mc_id=MVP)
- [mc:Ignorable Attribute - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/wpf/advanced/mc-ignorable-attribute?wt.mc_id=MVP)
- [DispatcherObject.cs](https://referencesource.microsoft.com/#WindowsBase/Base/System/Windows/Threading/DispatcherObject.cs,85082c8bba6e8038)
