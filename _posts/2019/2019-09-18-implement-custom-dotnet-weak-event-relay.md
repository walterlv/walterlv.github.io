---
title: ".NET/C# 利用 Walterlv.WeakEvents 高性能地中转一个自定义的弱事件（可让任意 CLR 事件成为弱事件）"
date: 2019-09-18 21:59:52 +0800
tags: dotnet csharp
position: knowledge
coverImage: /static/posts/2019-09-18-20-41-40.png
permalink: /post/implement-custom-dotnet-weak-event-relay.html
---

弱引用是 .NET 引入的概念，可以用来协助解决内存泄漏问题。然而事件也可能带来内存泄漏问题，是否有弱事件机制可以使用呢？.NET 没有自带的弱事件机制，但其中的一个子集 WPF 带了。然而我们不是什么项目都能引用 WPF 框架类库的。网上有很多弱事件的 NuGet 包，不过仅仅支持定义事件的时候写成弱事件而不支持让任意事件变成弱事件，并且存在性能问题。

本文介绍 Walterlv.WeakEvents 库来做弱事件。你可以借此将任何一个 CLR 事件当作弱事件来使用。

---

<div id="toc"></div>

系列博客：

- [.NET/C# 利用 Walterlv.WeakEvents 高性能地定义和使用弱事件](/post/implement-custom-dotnet-weak-event)
- [.NET/C# 利用 Walterlv.WeakEvents 高性能地中转一个自定义的弱事件（可让任意 CLR 事件成为弱事件）](/post/implement-custom-dotnet-weak-event-relay)
- [.NET 设计一套高性能的弱事件机制](/post/design-a-dotnet-weak-event-relay)

## 场景与问题

了解一下场景，你就能知道这是否是适合你的方案。

比如我正在使用 `FileSystemWatcher` 来监听一个文件的改变，我可能会使用到这些事件：

- `Created` 在文件被创建时引发
- `Changed` 在文件内容或属性发生改变时引发
- `Renamed` 在文件被重命名时引发
- `Deleted` 在文件被删除时引发

更具体一点的代码是这样的：

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

```csharp
private void Foo()
{
    var demo = new WalterlvDemo();
    // 使用 demo
    // 此方法结束后，demo 将脱离作用域，本应该可以被回收的。
}
```

但是，一旦我们这么写，那么我们这个类型 `WalterlvDemo` 的实例 `demo` 将无法被回收，因为 `FileSystemWatcher` 将始终通过事件引用着这个实例。即使你已经不再引用这个类型的任何一个实例，此实例也会被 `_watcher` 的事件引用着，而 `FileSystemWatcher` 的实例也因为 `EnableRaisingEvents` 而一直存在。

一个可行的解决办法是调用 `FileSystemWatcher` 的 `Dispose` 方法。不过有些时候很难决定到底在什么时机调用 `Dispose` 合适。

现在，我们希望有一种方法，能够在 `WalterlvDemo` 的实例失去作用域后被回收，最好 `FileSystemWatcher` 也能够自动被 `Dispose` 释放掉。

如果你试图解决的是类似这样的问题，那么本文就可以帮到你。

总结一下：

1. 用到了一个现有的类型（你无法修改它的源代码，本例中是 `FileSystemWatcher`）；
2. 你无法决定什么时候释放此类型的实例（本例中是不知道什么时候调用 `Dispose`）；
3. 一旦你监听此类型的事件，将产生内存泄漏，导致你自己类型的实例无法释放（本例中是 `demo` 变量脱离作用域。）。

目前有 WPF 自带的 `WeakEventManager` 机制，网上也有[很多可用的 NuGet 包](https://www.nuget.org/packages?q=weak+event+manager&prerel=false)，但是都有限制：

1. 只能给自己定义的类型引入弱事件机制，不能给现有类型引入弱事件；
2. 要么用反射，要么用 IL 生成代码，性能都不高。

而 Walterlv.WeakEvents 除了解决了给任一类型引入弱事件的问题，还具有非常高的性能，几乎跟定义原生事件无异。

## 下载安装 Walterlv.WeakEvents

在你需要做弱事件的项目中安装 NuGet 包：

- [Walterlv.WeakEvents](https://www.nuget.org/packages/Walterlv.WeakEvents/)

## 编写自定义的弱事件中继

现在，我们需要编写一个自定义的弱事件中继类 `FileSystemWatcherWeakEventRelay`，即专门为 `FileSystemWatcher` 做的弱事件中继。

下面是一个简单点的例子，为其中的 `Changed` 事件做了一个中继：

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

你可能会看到代码有点儿多，但是我向你保证，这是除了采用 Roslyn 编译器技术以外最高性能的方案了。如果你对弱事件的性能有要求，那么还是接受这些代码会比较好。

不要紧张，我来一一解释这些代码。另外，如果你不想懂这些代码，就按照模板一个个敲就好了，都是模板化的代码（特别适合使用 Roslyn 编译器生成，我可能接下来就会做这件事情避免你写出这些代码）。

1. 首先，我们定义了一个自定义的弱事件中继 `FileSystemWatcherWeakEventRelay`，继承自库 Walterlv.WeakEvents 中的 `WeakEventRelay<FileSystemWatcher>` 类型。带上的泛型参数表明是针对 `FileSystemWatcher` 类型做弱事件中继。
2. 一个构造函数，将参数传递给基类：`public FileSystemWatcherWeakEventRelay(FileSystemWatcher eventSource) : base(eventSource) { }`。这个构造函数是可以用 Visual Studio 生成的，快捷键是 `Ctrl + .` 或者 `Alt + Enter`（快捷键功效详见：[提高使用 Visual Studio 开发效率的键盘快捷键](/post/keyboard-shortcuts-to-improve-the-efficiency-of-visual-studio)）
3. 定义了一个私有的 `WeakEvent<FileSystemEventArgs>`，名为 `_changed`，这个就是弱事件的核心。泛型参数是事件参数的类型（注意，为了极致的性能，这里的泛型参数是事件参数的名称，而不是大多数弱事件框架中提供的事件处理委托类型）。
4. 定义了一个对外公开的事件 `public event FileSystemEventHandler Changed`。
    - `add` 方法固定调用 `Subscribe(o => o.Changed += OnChanged, () => _changed.Add(value, value.Invoke));`。其中 `Changed` 是 `FileSystemWatcher` 中的事件，`OnChanged` 是我们即将定义的事件处理函数，`_changed` 是前面定义好的弱事件字段，而后面的 `value` 和 `value.Invoke` 是固定写法。
    - `remove` 方法固定调用弱事件的 `Remove` 方法，即 `_changed.Remove(value);`。
5. 编写针对公开事件的事件处理函数 `OnChanged`，并在里面固定调用 `TryInvoke(_changed, sender, e)`。
6. 重写 `OnReferenceLost` 方法，用于在对象已被回收后反注册 `FileSystemWatcher` 中的事件。

希望看了上面这 6 点之后你还能理解这些代码都是在做啥。如果依然不能理解，可以考虑：

1. 参考下面 `FileSystemWatcherWeakEventRelay` 的完整代码来理解哪些是可变部分哪些是不可变部分，自己替换就好；
2. 等待 Walterlv.WeakEvents 库的作者更新自动生成这段代码的功能。

```csharp
using System.IO;
using Walterlv.WeakEvents;

namespace Walterlv.Demo
{
    internal sealed class FileSystemWatcherWeakEventRelay : WeakEventRelay<FileSystemWatcher>
    {
        public FileSystemWatcherWeakEventRelay(FileSystemWatcher eventSource) : base(eventSource) { }

        private readonly WeakEvent<FileSystemEventArgs> _created = new WeakEvent<FileSystemEventArgs>();
        private readonly WeakEvent<FileSystemEventArgs> _changed = new WeakEvent<FileSystemEventArgs>();
        private readonly WeakEvent<RenamedEventArgs> _renamed = new WeakEvent<RenamedEventArgs>();
        private readonly WeakEvent<FileSystemEventArgs> _deleted = new WeakEvent<FileSystemEventArgs>();

        public event FileSystemEventHandler Created
        {
            add => Subscribe(o => o.Created += OnCreated, () => _created.Add(value, value.Invoke));
            remove => _created.Remove(value);
        }

        public event FileSystemEventHandler Changed
        {
            add => Subscribe(o => o.Changed += OnChanged, () => _changed.Add(value, value.Invoke));
            remove => _changed.Remove(value);
        }

        public event RenamedEventHandler Renamed
        {
            add => Subscribe(o => o.Renamed += OnRenamed, () => _renamed.Add(value, value.Invoke));
            remove => _renamed.Remove(value);
        }

        public event FileSystemEventHandler Deleted
        {
            add => Subscribe(o => o.Deleted += OnDeleted, () => _deleted.Add(value, value.Invoke));
            remove => _deleted.Remove(value);
        }

        private void OnCreated(object sender, FileSystemEventArgs e) => TryInvoke(_created, sender, e);
        private void OnChanged(object sender, FileSystemEventArgs e) => TryInvoke(_changed, sender, e);
        private void OnRenamed(object sender, RenamedEventArgs e) => TryInvoke(_renamed, sender, e);
        private void OnDeleted(object sender, FileSystemEventArgs e) => TryInvoke(_deleted, sender, e);

        protected override void OnReferenceLost(FileSystemWatcher source)
        {
            source.Created -= OnCreated;
            source.Changed -= OnChanged;
            source.Renamed -= OnRenamed;
            source.Deleted -= OnDeleted;
            source.Dispose();
        }
    }
}
```

## 使用自定义的弱事件中继

当你把上面这个自定义的弱事件中继类型写好了之后，使用它就非常简单了，对我们原有的代码改动非常小。

```diff
    public class WalterlvDemo
    {
        public WalterlvDemo()
        {
            _watcher = new FileSystemWatcher(@"D:\Desktop\walterlv.demo.md")
            {
                EnableRaisingEvents = true,
            };
++          var weakEvent = new FileSystemWatcherWeakEventRelay(_watcher);
--          _watcher.Created += OnCreated;
--          _watcher.Changed += OnChanged;
--          _watcher.Renamed += OnRenamed;
--          _watcher.Deleted += OnDeleted;
++          weakEvent.Created += OnCreated;
++          weakEvent.Changed += OnChanged;
++          weakEvent.Renamed += OnRenamed;
++          weakEvent.Deleted += OnDeleted;
        }

        private readonly FileSystemWatcher _watcher;
        private void OnCreated(object sender, FileSystemEventArgs e) { }
        private void OnChanged(object sender, FileSystemEventArgs e) { }
        private void OnRenamed(object sender, RenamedEventArgs e) { }
        private void OnDeleted(object sender, FileSystemEventArgs e) { }
    }
```

## 最终效果预览

我写了一个程序，每 1 秒修改一次文件；每 5 秒回收一次内存。然后使用 `FileSystemWatcher` 来监视这个文件的改变。

可以看到，在回收内存之后，将不会再监视文件的改变。当然，如果你期望一直可以监视改变，当然也不希望用到本文的弱事件。

![可以回收事件](/static/posts/2019-09-18-20-41-40.png)

## 为什么弱事件中继的 API 如此设计？

一句话解答：**为了高性能**！

请参见我的另一篇博客：

- [.NET 设计一套高性能的弱事件机制](/post/design-a-dotnet-weak-event-relay)

---

**参考资料**

- [Weak Event Patterns - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/wpf/advanced/weak-event-patterns)


