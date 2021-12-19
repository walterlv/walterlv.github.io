---
title: "如何为非常不确定的行为（如并发）设计安全的 API，使用这些 API 时如何确保安全"
date: 2019-08-03 13:56:32 +0800
tags: dotnet csharp
position: principle
permalink: /post/design-principles-of-uncertain-behavior.html
---

.NET 中提供了一些线程安全的类型，如 `ConcurrentDictionary<TKey, TValue>`，它们的 API 设计与常规设计差异很大。如果你对此觉得奇怪，那么正好阅读本文。本文介绍为这些非常不确定的行为设计 API 时应该考虑的原则，了解这些原则之后你会体会到为什么会有这些 API 设计上的差异，然后指导你设计新的类型。

---

<div id="toc"></div>

## 不确定性

像并发集合一样，如 `ConcurrentDictionary<TKey, TValue>`、`ConcurrentQueue<T>`，其设计为线程安全，于是它的每一个对外公开的方法调用都不会导致其内部状态错误。但是，你在调用其任何一个方法的时候，虽然调用的方法本身能够保证其线程安全，能够保证此方法涉及到的状态是确定的，但是一旦完成此方法的调用，其状态都将再次不确定。你只能依靠其方法的返回值来使用刚刚调用那一刻确定的状态。

我们来看几段代码：

```csharp
var isRunning = Interlocked.CompareExchange(ref _isRunning, 1, 0);
if (isRunning is 1)
{
    // 当前已经在执行队列，因此无需继续执行。
}
```

```csharp
private ConcurrentDictionary<string, object> KeyValues { get; }
    = new ConcurrentDictionary<string, object>();

object Get(string key)
{
    var value = KeyValues.TryGetValue(key, out var v) ? v : null;
    return value;
}
```

这两段代码都使用到了可能涉及线程安全的一些代码。前者使用 `Interlocked` 做原则操作，而后者使用并发字典。

无论写上面哪一段代码，都面临着问题：

- 此刻调用的那一句话得到的任何结果都仅仅只表示这一刻，而不代表其他任何代码时的结果。

比如前者的 `Interlocked.CompareExchange(ref _isRunning, 1, 0)` 我们得到一个返回值 `isRunning`，然后判断这个返回值。但是我们绝对不能够判断 `_isRunning` 这个字段，因为这个字段非常易变，在你的任何一个代码上下文中都可能变成你不希望看到的值。`Interlocked` 是原子操作，所以才确保安全。

而后者，此时访问得到的字典数据，和下一时刻访问得到的字典数据将可能完全不匹配，两次的数据不能通用。

## API 用法指导

如果你正在为一个易变的状态设计 API，或者说你需要编写的类型带有很强的不确定性（类型状态的变化可能发生在任何一行代码上），那么你需要遵循一些设计原则才能确保安全。

### 同一个上下文仅能查看或修改一次状态

比如要为缓存设计一个获取可用实例的方法，可以使用：

```csharp
private ConcurrentDictionary<string, object> KeyValues { get; }
    = new ConcurrentDictionary<string, object>();

void Get(string key)
{
    // CreateCachedInstance 是一个工厂方法，所有 GetOrAdd 的地方都是用此工厂方法创建。
    var value = KeyValues.GetOrAdd(key, CreateCachedInstance);
    return value;
}
```

但是绝对不能使用：

```csharp
if(!KeyValues.TryGetValue(key, out var v))
{
    KeyValues.TryAdd(key, CreateCachedInstance(key));
}
```

这一段代码就是对并发的状态 `KeyValues` 做了两次访问。

`ConcurrentDictionary` 也正是考虑到了这种设计场景，于是才提供了 API `GetOrAdd` 方法。让你在获取对象实例的时候可以通过工厂方法去创建实例。

如果你需要设计这种状态极易变的 API，那么需要针对一些典型的设计场景提供一次调用就能获取此时此刻所有状态的方法。就像上文的 `GetOrAdd` 一样。

另一个例子，`WeakReference<T>` 弱引用对象的管理也是在一个方法里面可以获取到一个绝对确定的状态，而避免使用方进行两次判断：

```csharp
if (weak.TryGetTarget(out var value))
{
    // 一旦这里拿到了对象，这个对象一定会存在且可用。
}
```

一定不能提供两个方法调用来完成这样的事情（比如先判断是否存在再获取对象的实例，就像 .NET Framework 4.0 和早期版本弱引用的 API 设计一样）。

### 对于并发，如果有多次查看或者修改状态，必须加锁

比如以下方法，是试图一个接一个地依次执行 `_queue` 中的所有任务。

虽然我们使用 `Interlocked.CompareExchange` 原子操作，但因为后面依然涉及到了多次状态的获取，导致不得不加锁才能确保安全。我们依然使用原则操作是为了避免单纯 `lock` 带来的性能损耗。

```csharp
private volatile int _isRunning;
private readonly object _locker = new object();
private readonly ConcurrentQueue<TaskWrapper> _queue = new ConcurrentQueue<TaskWrapper>();

private async void Run()
{
    var isRunning = Interlocked.CompareExchange(ref _isRunning, 1, 0);
    if (isRunning is 1)
    {
        lock (_locker)
        {
            if (_isRunning is 1)
            {
                // 当前已经在执行队列，因此无需继续执行。
                return;
            }
        }
    }

    var hasTask = true;
    while (hasTask)
    {
        // 当前还没有任何队列开始执行，因此需要开始执行队列。
        while (_queue.TryDequeue(out var wrapper))
        {
            // 内部已包含异常处理，因此外面可以无需捕获或者清理。
            await wrapper.RunAsync().ConfigureAwait(false);
        }

        lock (_locker)
        {
            hasTask = _queue.TryPeek(out _);
            if (!hasTask)
            {
                _isRunning = 0;
            }
        }
    }
}
```

这段代码的完全解读：

1. 当执行 `Run` 方法的时候，先判断当前是否已经在跑其他的任务：
    - `isRunning` 为 `0` 表示当前一定没有在跑其他任务，我们使用原则操作立刻将其修改为 `1`；
    - `isRunning` 为 `1` 表示当前不确定是否在跑其他任务；
1. 既然 `isRunning` 为 `1` 的时候状态不确定，于是我们加锁来判断其是否真的有任务在跑：
    - 在 `lock` 环境中确认 `_isRunning` 字段而非变量为 `1` 则说明真的有任务在跑，此时等待任务完成即可，这里就可以退出了；
    - 在 `lock` 环境中发现 `_isRunning` 字段而非变量为 `0` 则说明实际上是没有任务在跑的（刚刚判断为 `1` 只是因为这两次判断之间，并发的任务刚刚在结束的过程中），于是需要跟一开始判断为 `0` 一样，进入到后面的循环中；
1. 外层的 `while` 循环第一次是一定能进去的，于是我们暂且不谈；
1. 在 `while` 内循环中，我们依次检查并发队列 `_queue` 中是否还有任务要执行，如果有要执行的，就执行：
    - 这个过程我们完全没有做加锁，因为这可能是非常耗时的任务，如果我们加锁，将导致其他线程出现非常严重的资源浪费；
1. 如果 `queue` 中的所有任务执行完毕，我们将进入一个 `lock` 区间：
    - 在这个 `lock` 区间里面我们再次确认任务是否已经完成，如果没有完成，我们靠最外层的 `while` 循环重新回到内层 `while` 循环中继续任务；
    - 如果在这个 `lock` 区间里面我们发现任务已经完成了，就设置 `_isRunning` 为 `0`，表示任务真的已经完成，随后退出 `while` 循环；

你可以注意到我们的 `lock` 是用来确认一开始 `isRunning` 为 `1` 时的那个不确定的状态的。因为我们需要多次访问这个状态，所以必须加锁来确认状态是同步的。

## API 设计指导

在了解了上面的用法指导后，API 设计指导也呼之欲出了：

1. 针对典型的应用场景，必须设计一个专门的方法，一次调用即可完全获取当时需要的状态，或者一次调用即可完全修改需要修改的状态；
1. 不要提供大于 1 个方法组合在一起才能使用的 API，这会让调用方获取不一致的状态。

对于多线程并发导致的不确定性，使用方虽然可以通过 `lock` 来规避以上第二条问题，但设计方最好在设计之初就避免问题，以便让 API 更好使用。

关于通用 API 设计指导，你可以阅读我的另一篇双语博客：

- [好的框架需要好的 API 设计 —— API 设计的六个原则 - walterlv](/post/framework-api-design)

