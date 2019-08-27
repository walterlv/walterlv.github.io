---
title: "WPF 的 Application.Current.Dispatcher 中，Current 可能为 null"
publishDate: 2019-08-27 12:45:27 +0800
date: 2019-08-27 12:50:21 +0800
categories: wpf dotnet csharp
position: problem
---

在 WPF 程序中，可能会存在 `Application.Current.Dispatcher.Xxx` 这样的代码让一部分逻辑回到主 UI 线程。因为发现在调用这句代码的时候出现了 `NullReferenceException`，于是就有三位小伙伴告诉我说 `Current` 和 `Dispatcher` 属性都可能为 `null`。

然而实际上这里只可能 `Current` 为 `null` 而此上下文的 `Dispatcher` 是绝对不会为 `null` 的。（当然我们这里讨论的是常规编程手段，如果非常规手段，你甚至可以让实例的 `this` 为 `null` 呢……）

---

由于本文所述的两个部分都略长，所以拆分成两篇博客，这样更容易理解。

- [WPF 的 Application.Current.Dispatcher 中，Dispatcher 属性一定不会为 null](https://blog.walterlv.com/post/application-dispatcher-will-never-be-null.html)
- [WPF 的 Application.Current.Dispatcher 中，Current 可能为 null](https://blog.walterlv.com/post/application-current-may-be-null.html)

<div id="toc"></div>

## `Application.Current` 静态属性

### 源代码

`Application` 类型的源代码会非常长，所以这里就不贴了，可以前往这里查看：

- [DispatcherObject.cs](https://referencesource.microsoft.com/#WindowsBase/Base/System/Windows/Threading/DispatcherObject.cs)

其中，`Current` 返回的是 `_appInstance` 的静态字段。因此 `_appInstance` 字段为 `null` 的时机就是 `Application.Current` 为 `null` 的时机。

```csharp
/// <summary>
///     The Current property enables the developer to always get to the application in
///     AppDomain in which they are running.
/// </summary>
static public Application Current
{
    get
    {
        // There is no need to take the _globalLock because reading a
        // reference is an atomic operation. Moreover taking a lock
        // also causes risk of re-entrancy because it pumps messages.

        return _appInstance;
    }
}
```

由于 `_appInstance` 字段是私有字段，所以仅需调查这个类本身即可找到所有的赋值时机。（反射等非常规手段需要排除在外，因为这意味着开发者是逗比——自己闯的祸不能怪 WPF 框架。）

### 赋值时机

`_appInstance` 的赋值时机有两处：

1. `Application` 的实例构造函数（注意哦，是实例构造函数而不是静态构造函数）；
2. `Application.DoShutdown` 方法。

在 `Application` 的实例构造函数中：

- `_appInstance` 的赋值是线程安全的，这意味着多个 `Application` 实例的构造不会因为线程安全问题导致 `_appInstance` 字段的状态不正确。
- 如果 `_appCreatedInThisAppDomain` 为 `true` 那么，将抛出异常，组织此应用程序域中创建第二个 `Application` 类型的实例。

```csharp
/// <summary>
///     Application constructor
/// </summary>
/// <SecurityNote>
///    Critical: This code posts a work item to start dispatcher if in the browser
///    PublicOk: It is ok because the call itself is not exposed and the application object does this internally.
/// </SecurityNote>
[SecurityCritical]
public Application()
{
    // 省略了一部分代码。
    lock(_globalLock)
    {
        // set the default statics
        // DO NOT move this from the begining of this constructor
        if (_appCreatedInThisAppDomain == false)
        {
            Debug.Assert(_appInstance == null, "_appInstance must be null here.");
            _appInstance = this;
            IsShuttingDown    = false;
            _appCreatedInThisAppDomain = true;
        }
        else
        {
            //lock will be released, so no worries about throwing an exception inside the lock
            throw new InvalidOperationException(SR.Get(SRID.MultiSingleton));
        }
    }
    // 省略了一部分代码。
}
```

也就是说，此类型实际上是设计为单例的。在第一个实例构造出来之后，单例的实例即可开始使用。

### 后续赋值

此单例实例的唯一结束时机就是 `Application.DoShutdown` 方法。这是唯一将 `_appInstance` 赋值为 `null` 的代码。

```csharp
/// <summary>
/// DO NOT USE - internal method
/// </summary>
///<SecurityNote>
///     Critical: Calls critical code: Window.InternalClose
///     Critical: Calls critical code: HwndSource.Dispose
///     Critical: Calls critical code: PreloadedPackages.Clear()
///</SecurityNote>
[SecurityCritical]
internal virtual void DoShutdown()
{
    // 省略了一部分代码。

    // Event handler exception continuality: if exception occurs in ShuttingDown event handler,
    // our cleanup action is to finish Shuttingdown.  Since Shuttingdown cannot be cancelled.
    // We don't want user to use throw exception and catch it to cancel Shuttingdown.
    try
    {
        // fire Applicaiton Exit event
        OnExit(e);
    }
    finally
    {
        SetExitCode(e._exitCode);

        // By default statics are shared across appdomains, so need to clear
        lock (_globalLock)
        {
            _appInstance = null;
        }

        _mainWindow = null;
        _htProps = null;
        NonAppWindowsInternal = null;

        // 省略了一部分代码。
    }
}
```

可以调用到此代码的公共 API 有：

- `Application.Shutdown` 实例方法
- 导致 `Window` 关闭的若干方法（`InternalDispose`）
- `IBrowserHostServices.PostShutdown` 接口方法

因此，所有直接或间接调用到以上方法的地方都会导致 `Application.Current` 属性被赋值为 `null`。

### 对所写代码的影响

从以上的分析可以得知，只要你还能在 `Application.DoShutdown` 执行之后继续执行代码，那么这部分的代码都将面临着 `Application.Current` 为 `null` 风险。

那么，到底有哪些时机可能遇到 `Application.Current` 为 `null` 呢？这部分就与读者项目中所用的业务代码强相关了。

但是这部分业务代码会有一些公共特征帮助你判定你是否可能写出遭遇 `Application.Current` 为 `null` 的代码。

此特征是：

- 此代码与 `Application.Current` 不在同一线程

## 与 `Application.Current` 不在同一线程

对于 WPF 程序，你的多数代码可能是由用户交互产生，即便有后续代码的执行，也依然是从 UI 交互产生。这样的代码不会遇到 `Application.Current` 为 `null` 的情况。

但是，如果你的代码由非 UI 线程触发，例如在 `Usb` 设备改变、与其他端的通信、某些异步代码的回调等等，这些代码不受 `Dispatcher` 是否调度影响，几乎一定会执行。因此 `Application.Current` 就算赋值为 `null` 了，它们也不知道，依然会继续执行，于是就会遭遇 `Application.Current` 为 `null`。

这本质上是一个线程安全问题。

#### 使用 `Invoke/BeginInvoke/InvokeAsync` 的代码不会出问题

`Application.DoShutdown` 方法被 `ShutdownImpl` 包装，且所有调用均从此包装进入，因此，所有可能导致 `Application.Current` 为 `null` 的代码，均会调用此方法，也就是说，会调用 `Dispatcher.CriticalInvokeShutdown` 实例方法。

```csharp
/// <summary>
/// This method gets called on dispatch of the Shutdown DispatcherOperationCallback
/// </summary>
///<SecurityNote>
///  Critical: Calls critical code: DoShutdown, Dispatcher.CritcalInvokeShutdown()
///</SecurityNote>
[SecurityCritical]
private void ShutdownImpl()
{
    // Event handler exception continuality: if exception occurs in Exit event handler,
    // our cleanup action is to finish Shutdown since Exit cannot be cancelled. We don't
    // want user to use throw exception and catch it to cancel Shutdown.
    try
    {
        DoShutdown();
    }
    finally
    {
        // Quit the dispatcher if we ran our own.
        if (_ownDispatcherStarted == true)
        {
            Dispatcher.CriticalInvokeShutdown();
        }

        ServiceProvider = null;
    }
}
```

所有的关闭 `Dispatcher` 的调用有两类，`Application` 关闭时调用的是内部方法 `CriticalInvokeShutdown`。

1. 立即关闭 `CriticalInvokeShutdown`，即以 `Send` 优先级 `Invoke` 关闭方法，而 `Send` 优先级调用 `Invoke` 几乎等同于直接调用（为什么是等同而不是直接调用？因为还需要考虑回到 `Dispatcher` 初始化时所在的线程）。
1. 开始关闭 `BeginInvokeShutdown`，即以指定的优先级 `InvokeAsync` 关闭方法。

而关闭 `Dispatcher` 意味着所有使用 `Invoke/BeginInvoke/InvokeAsync` 的任务将终止。

```csharp
//<SecurityNote>
//  Critical - as it accesses security critical data ( window handle)
//</SecurityNote>
[SecurityCritical]
private void ShutdownImplInSecurityContext(Object state)
{
    // 省略了一部分代码。

    // Now that the queue is off-line, abort all pending operations,
    // including inactive ones.
    DispatcherOperation operation = null;
    do
    {
        lock(_instanceLock)
        {
            if(_queue.MaxPriority != DispatcherPriority.Invalid)
            {
                operation = _queue.Peek();
            }
            else
            {
                operation = null;
            }
        }

        if(operation != null)
        {
            operation.Abort();
        }
    } while(operation != null);

    // 省略了一部分代码。
}
```

由于此终止代码在 `Dispatcher` 所在的线程执行，而所有 `Invoke/BeginInvoke/InvokeAsync` 代码也都在此线程执行，因此这些代码均不会并发。已经执行的代码会在此终止代码之前，而在此终止代码之后也不会再执行任何 `Invoke/BeginInvoke/InvokeAsync` 的任务了。

- 所有通过 `Invoke/BeginInvoke/InvokeAsync` 或间接通过此方法（如 WPF 控件相关事件）调用的代码，均不会遭遇 `Application.Current` 为 `null`。
- 所有在 UI 线程使用 `async` / `await` 并使用默认上下文执行的代码，均不会遭遇 `Application.Current` 为 `null`。（这意味着你没有使用 `.ConfigureAwait(false)`，详见[在编写异步方法时，使用 ConfigureAwait(false) 避免使用者死锁 - walterlv](https://blog.walterlv.com/post/using-configure-await-to-avoid-deadlocks.html)。）

### 结论

总结以上所有的分析：

1. 任何与 `Application` 不在同一个线程的代码，都可能遭遇 `Application.Current` 为 `null`。
1. 任何与 `Application` 在同一个线程的代码，都不可能遇到 `Application.Current` 为 `null`。

这其实是一个线程安全问题。用所有业务开发者都可以理解的说法描述就是：

**当你的应用程序退出时，所有 UI 线程的代码都不再会执行，因此这是安全的；但所有非 UI 线程的代码依然在继续执行，此时随时可能遇到 `Application.Current` 属性为 null。**

因此，记得所有非 UI 线程的代码，如果需要转移到 UI 线程执行，记得判空：

```csharp
private void OnUsbDeviceChanged(object sender, EventArgs e)
{
    // 记得这里需要判空，因为此上下文可能在非 UI 线程。
    Application.Current?.InvokeAsync(() => { });
}
```

## `Application.Dispatcher` 实例属性

关于 `Application.Dispatcher` 是否可能为 `null` 的分析，由于比较长，请参见我的另一篇博客：

- [WPF 的 Application.Current.Dispatcher 中，Dispatcher 属性一定不会为 null - walterlv](https://blog.walterlv.com/post/application-dispatcher-will-never-be-null.html)

---

**参考资料**

- [Application.cs](https://referencesource.microsoft.com/#PresentationFramework/src/Framework/System/Windows/Application.cs)
