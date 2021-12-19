---
title: ".NET 设计一套高性能的弱事件机制"
date: 2019-09-18 21:59:58 +0800
tags: dotnet csharp
position: knowledge
---

弱引用是 .NET 引入的概念，可以用来协助解决内存泄漏问题。然而事件也可能带来内存泄漏问题，是否有弱事件机制可以使用呢？.NET 没有自带的弱事件机制，但其中的一个子集 WPF 带了。然而我们不是什么项目都能引用 WPF 框架类库的。网上有很多弱事件的 NuGet 包，不过仅仅支持定义事件的时候写成弱事件而不支持让任意事件变成弱事件，并且存在性能问题。

本文将设计一套弱事件机制，不止可以让任意一个 CLR 事件成为弱事件，还具有近乎原生事件的性能。

---

<div id="toc"></div>

系列博客：

- [.NET/C# 利用 Walterlv.WeakEvents 高性能地定义和使用弱事件](/post/implement-custom-dotnet-weak-event)
- [.NET/C# 利用 Walterlv.WeakEvents 高性能地中转一个自定义的弱事件（可让任意 CLR 事件成为弱事件）](/post/implement-custom-dotnet-weak-event-relay)
- [.NET 设计一套高性能的弱事件机制](/post/design-a-dotnet-weak-event-relay)

## 场景与问题

本文主要为了设计一套弱事件机制而编写，因此如果你感兴趣，应该已经理解了我试图做什么事情。

当然，如果并不理解，可以阅读这个机制的应用篇，里面有具体的应用场景：

- [.NET/C# 利用 Walterlv.WeakEvents 高性能地中转一个自定义的弱事件（可让任意 CLR 事件成为弱事件）](/post/implement-custom-dotnet-weak-event-relay)

## 现有设计

在我进行此设计之前，已有如下种类的弱事件机制：

1. WPF 框架自带的 `WeakEventManager`
    - 功能非常有限，自己继承实现一个的难度非常高，但具有很高的性能；WPF 绑定等机制的底层实现用到了这个类型。
1. WPF 框架自带的泛型类 `WeakEventManager<TEventSource, TEventArgs>`
    - 可以让你更容易地实现一个自己的弱事件，但是性能非常差
1. 使用[网上很多的 NuGet 包](https://www.nuget.org/packages?q=weak+event+manager&prerel=false)
    - 下载量较高的几个 NuGet 包我都有研究过其中的源代码，要么有限制必须是定义事件的时候就必须使用弱事件，要么使用反射或其他动态调用方法性能较差
1. StackOverflow 上关于 `Weak Event` 的高赞回答
    - 目前还没有找到可以支持将任意事件添加弱事件支持的回答

由于我希望编写的弱事件机制尽可能减少对非预期框架的依赖，而且具有很高的性能，所以我打算自己实现一套。

## 设计原则

1. 支持为任意类型的事件添加弱事件支持，而不只是自己定义新事件的时候可以使用（对标主流 NuGet 包和 StackOverflow 上的回答）
1. 具有很高的性能（对标主流的 NuGet 包和 WPF 泛型版本的 WeakEventManager）
1. 类的使用者只需要编写极少量的代码就能完成（对标 WPF 非泛型版本的 WeakEventManager）

这三个原则，从上到下优先级依次降低。

要支持所有类型的 CLR 事件，意味着我的设计中必须要能够直接监听到任意事件，而不能所有代码都从我自己编写的代码开始。

要有很高的性能，就意味着我几乎不能使用“反射”，也不能使用委托的 `DynamicInvoke` 方法，还不能生成 IL 代码（首次生成很慢），也不能使用表达式树（首次编译很慢）。那么可以使用的也就只剩下两个了，一个是纯 C#/.NET 带的编译期就能确定执行的代码，另一个是使用 Roslyn 编译期在编译期间进行特殊处理。

类的使用者要编写极少量的代码，意味着能够抽取到框架中的代码就尽量抽取到框架中。

## 取名

俗话说，一个好的名字是成功的一半。

因为我希望为任意 CLR 事件添加弱事件支持，所以其职责有点像“代理、中间人、中继、中转”，对应英文的 `Proxy` `Agent` `Relay` `Transfer`。最终我选择名称 `Relay`（中继），因为好听。

## API 设计

对于 API 的设计，我有一个小原则：

- **如果技术实现很难，那么 API 迁就技术实现；如果技术实现很容易，那么技术迁就 API**

我总结了好的 API 设计的一些原则：

- [好的框架需要好的 API 设计 —— API 设计的六个原则 - walterlv](/post/framework-api-design)

不得不说，此类型设计的技术难度还是挺大的。虽然我们知道有 `WeakReference<T>` 可用，但依然存在很多的技术难点。于是 API 的设计可能要退而求其次优先满足前两个优先级更高的目标。

我们期望 API 足够简单，因此在几个备选方案中选择：

1. `WeakEventRelay.Subscribe("Changed", OnChanged)`
    - 使用字符串来表示事件，肯定会用到反射，不可取
1. `WeakEventRelay.Subscribe(o => o.Changed, OnChanged)`
    - 如果使用 `Action` 来做，会遇到 `o.Changed` 必须出现在 `+=` 左边的编译错误
    - 如果使用表达式树，也一样会遇到 `o.Changed` 必须出现在 `+=` 左边的编译错误，同时还会出现少量性能问题

因此，直接一个方法就能完成事件注册是不可能的了，我们改用其他方法——继承自某个基类：

```csharp
internal sealed class FileSystemWatcherWeakEventRelay : WeakEventRelay<FileSystemWatcher>
{
    public event FileSystemEventHandler Changed
    {
        add => /*实现弱事件订阅*/;
        remove => /*实现弱事件注销*/;
    }
}
```

那么实现的难点就都在 `add` 和 `remove` 方法里面了。

## 技术实现

我们究竟需要哪些信息才可以完成弱事件机制呢？

- 事件源（也就是在使用弱事件机制之前最原始的事件引发者，经常以 `object sender` 的形式出现在你的代码中）
- 要订阅的事件（比如 `FileSystemWatcher.Changed` 事件）
- 新注册的事件处理函数（也就是 `add` 和 `remove` 方法中的 `value`）

然而事情并没有那么简单：

**一**

在框架通用代码中，我不可能获取到要订阅的事件。因为事件要求只能出现在 `+=` 的左边，不能以任何其他形式使用（包括但不限于通过参数传递，伪装成 Lambda 表达式，伪装成表达式树）。这意味着 `o.Changed += OnChanged` 这样的事件订阅完全写不出来通用代码（除非牺牲性能）。

那么还能怎么做呢？只能将这段写不出来的代码留给业务编写者来编写了。

也就是说，类似于 `o.Changed += OnChanged` 这样的代码只能交给业务开发者来实现。与此同时也注定了 `OnChanged` 必须由业务开发者编写（因为无法写出通用的高性能的事件处理函数，并且还能在 `+=` 和 `-=` 的时候保持同一个实例。

**二**

我没有办法通过抽象的办法引发一个事件。具体来说，无法在抽象的通用代码中写出 `Changed.Invoke(sender, e)` 这样代码。因为委托的基类 `Delegate` `MultiCastDelegate` 没有 `Invoke` 方法可以使用，只有耗性能的 `DynamicInvoke` 方法。各种不同的委托定义虽然可以有相同的参数和返回值类型，但是却不能相互转换，因此我也不能将传入的委托转换成 `Action<TSender, TArgs>` 这样的通用委托。

庆幸的是，C# 提供了将方法组隐式转换委托的方法，可以让两个参数和返回值类型相同的委托隐式转换。但注意，这是隐式转换，没有运行时代码可以高性能地完成这件事情。

在 `add` 和 `remove` 方法中，`value` 参数就是使用方传入的事件处理函数，`value.Invoke` 就是方法组，可以隐式转换为通用的 `Action<TSender, TArgs>`。

这意味着，我们可以将 `value.Invoke` 传入来以通用的方式调用事件处理函数。但是请特别注意，这会导致新创建委托实例，导致 `-=` 的时候实例与 `+=` 的时候不一致，无法注销事件。因此，我们除了传入 `value.Invoke` 之外，还必须传入 `value` 本身。

**API 半残品预览**

```csharp
internal sealed class FileSystemWatcherWeakEventRelay : WeakEventRelay<FileSystemWatcher>
{
    public event FileSystemEventHandler Changed
    {
        add => Subscribe(o => o.Changed += OnChanged, value, value.Invoke);
        remove => Unsubscribe(o => o.Changed -= OnChanged, value);
    }

    private void OnChanged(object sender, FileSystemEventArgs e) => /* 引发弱事件 */;
}
```

这已经开始让业务方的代码变得复杂起来了。

## 方案完善

我们还需要能够注册、注销和引发弱事件，而这部分就没那么坑了。因为：

1. 我们已经把最坑的 `o.Changed += OnChanged`，`value`，`value.Invoke` 都传进来了；
2. 在类型中定义一个弱事件，目前网上各种主流弱事件 NuGet 包都有实现。

我写了一个 `WeakEvent<TSender, TArgs>` 泛型类专门用来定义弱事件。

不过，这让业务方的代码压力更大了：

```csharp
internal sealed class FileSystemWatcherWeakEventRelay : WeakEventRelay<FileSystemWatcher>
{
    private readonly WeakEvent<FileSystemEventArgs> _changed = new WeakEvent<FileSystemEventArgs>();

    public event FileSystemEventHandler Changed
    {
        add => Subscribe(o => o.Changed += OnChanged, () => _changed.Add(value, value.Invoke));
        remove => _changed.Remove(value);
    }

    private void OnChanged(object sender, FileSystemEventArgs e) => TryInvoke(_changed, sender, e);
}
```

最后，订阅事件所需的实例，我认为最好不要能够让业务方直接能访问。因为弱事件的实现并不简单（看上面如此复杂的公开 API 就知道了），如果能够直接访问，势必带来更复杂的使用问题。所以我仅在部分方法和 Lambda 表达式参数中开放实例。

所以，构造函数需要传入事件源。

## 最后的问题

最后还留下了一个问题

- 订阅者现在确实“弱事件”了，但这个“中继”怎么办？可是被强引用了啊？

虽然中继的类实例小得多，但这确实依然也是泄漏，因此需要回收。

于是我在任何可能执行代码的时机加上了回收检查：如果发现所有订阅者都已经被回收，那么“中继”也就可以被回收了，将注销所有事件源的订阅。（当然要允许重新开始订阅。）

所以最后业务方编写的中继代码又多了一些：

```csharp
using System.IO;
using Walterlv.WeakEvents;

namespace Walterlv.Demo
{
    internal sealed class FileSystemWatcherWeakEventRelay : WeakEventRelay<FileSystemWatcher>
    {
        public FileSystemWatcherWeakEventRelay(FileSystemWatcher eventSource) : base(eventSource) { }

        private readonly WeakEvent<FileSystemEventArgs> _changed = new WeakEvent<FileSystemEventArgs>();

        public event FileSystemEventHandler Changed
        {
            add => Subscribe(o => o.Changed += OnChanged, () => _changed.Add(value, value.Invoke));
            remove => _changed.Remove(value);
        }

        private void OnChanged(object sender, FileSystemEventArgs e) => TryInvoke(_changed, sender, e);

        protected override void OnReferenceLost(FileSystemWatcher source)
        {
            source.Changed -= OnChanged;
        }
    }
}
```

## 实际使用

虽然弱事件中继的代码复杂了点，但是：

**1** 最终用户的使用可是非常简单的：

```csharp
public class WalterlvDemo
{
    public WalterlvDemo()
    {
        _watcher = new FileSystemWatcher(@"D:\Desktop\walterlv.demo.md")
        {
            EnableRaisingEvents = true,
        };
        _watcher.Created += OnCreated;
        _watcher.Changed += OnChanged;
        _watcher.Renamed += OnRenamed;
        _watcher.Deleted += OnDeleted;
    }

    private readonly FileSystemWatcher _watcher;
    private void OnCreated(object sender, FileSystemEventArgs e) { }
    private void OnChanged(object sender, FileSystemEventArgs e) { }
    private void OnRenamed(object sender, RenamedEventArgs e) { }
    private void OnDeleted(object sender, FileSystemEventArgs e) { }
}
```

**2** 是在懒得写，我可以加上 Roslyn 编译器生成中继代码的方式，这个我将在不久的将来加入到 Walterlv.WeakEvents 库中。

## 相关源码

更具体的使用场景和示例代码，请阅读：

- [.NET/C# 利用 Walterlv.WeakEvents 高性能地中转一个自定义的弱事件（可让任意 CLR 事件成为弱事件）](/post/implement-custom-dotnet-weak-event-relay)

本文所涉及的全部源代码，已在 GitHub 上开源：

- [Walterlv.Packages/src/Utils/Walterlv.WeakEvents at master · walterlv/Walterlv.Packages](https://github.com/walterlv/Walterlv.Packages/tree/master/src/Utils/Walterlv.WeakEvents)

注意开源协议：

[![996.icu](https://img.shields.io/badge/link-996.icu-red.svg)](https://996.icu)

[![LICENSE](https://img.shields.io/badge/license-NPL%20(The%20996%20Prohibited%20License)-blue.svg)](https://github.com/996icu/996.ICU/blob/master/LICENSE)

---

**参考资料**

- [Weak Event Patterns - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/wpf/advanced/weak-event-patterns)
