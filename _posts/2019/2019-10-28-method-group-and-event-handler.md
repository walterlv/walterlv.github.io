---
title: "C#/.NET 当我们在写事件 += 和 -= 的时候，方法是如何转换成事件处理器的"
publishDate: 2019-10-28 18:48:46 +0800
date: 2019-10-29 11:53:34 +0800
tags: dotnet csharp
position: knowledge
coverImage: /static/posts/2019-10-28-17-03-49.png
permalink: /post/method-group-and-event-handler.html
---

当我们在写 `+=` 和 `-=` 事件的时候，我们会在 `+=` 或 `-=` 的右边写上事件处理函数。我们可以写很多种不同的事件处理函数的形式，那么这些形式都是一样的吗？如果你不注意，可能出现内存泄漏问题。

本文将讲解事件处理函数的不同形式，理解了这些可以避免编写代码的时候出现内存相关的问题。

---

<div id="toc"></div>

## 典型的事件处理函数

事件处理函数本质上是一个委托，比如 `FileSystemWatcher` 的 `Changed` 事件是这样定义的：

```csharp
// 这是简化的代码。
public event FileSystemEventHandler Changed;
```

这里的 `FileSystemEventHandler` 是一个委托类型：

```csharp
public delegate void FileSystemEventHandler(object sender, FileSystemEventArgs e);
```

一个典型的事件的 `+=` 会像下面这样：

```csharp
void Subscribe(FileSystemWatcher watcher)
{
    watcher.Changed += new FileSystemEventHandler(OnChanged);
}

void OnChanged(object sender, FileSystemEventArgs e)
{
}
```

`+=` 的右边传入的是一个 `new` 出来的委托实例。

## 变种事件处理函数

除了上面直接创建的目标类型的委托之外，还有其他类型可以放到 `+=` 的右边：

```csharp
// 方法组。
watcher.Changed += OnChanged;
```

```csharp
// Lambda 表达式。
watcher.Changed += (sender, e) => Console.WriteLine(e.ChangeType);
```

```csharp
// Lambda 表达式。
watcher.Changed += (sender, e) =>
{
    // 事件引发时，代码会在这里执行。
};
```

```csharp
// 匿名方法。
watcher.Changed += delegate (object sender, FileSystemEventArgs e)
{
    // 事件引发时，代码会在这里执行。
};
```

```csharp
// 委托类型的局部变量（或者字段）。
FileSystemEventHandler onChanged = (sender, e) => Console.WriteLine(e.ChangeType);
watcher.Changed += onChanged;
```

```csharp
// 局部方法（或者局部静态方法）。
watcher.Changed += OnChanged;
void OnChanged(object sender, FileSystemEventArgs e)
{
}
```

因为我们可以通过编写事件的 `add` 和 `remove` 方法来观察事件 `+=` `-=` 传入的 `value` 是什么类型的什么实例，所以可以很容易验证以上每一种实例最终被加入到事件中的真实实例。

实际上我们发现，无论哪一个，最终传入的都是 `FileSystemEventHandler` 类型的实例。

![都是同一类型的实例](/static/posts/2019-10-28-17-03-49.png)

然而我们知道，只有直接 `new` 出来的那个和局部变量那个真正是 `FileSystemEventHandler` 类型的实例，其他都不是。

那么中间发生了什么样的转换使得我们所有种类的写法最终都可以 `+=` 呢？

## 编译器类型转换

具有相同签名的不同委托类型，彼此之前并没有继承关系，因此在运行时是不可以进行类型转换的。

比如：

```csharp
FileSystemEventHandler onChanged1 = (sender, e) => Console.WriteLine(e.ChangeType);
Action<object, FileSystemEventArgs> onChanged2 = (sender, e) => Console.WriteLine(e.ChangeType);
```

这里，`onChanged1` 的实例不可以赋值给 `onChanged2`，反过来 `onChanged2` 的实例也不可以赋值给 `onChanged1`。于是这里只有 `onChanged1` 才可以作为 `Changed` 事件 `+=` 的右边，而 `onChanged2` 放到 `+=` 右边是会出现编译错误的。

![不能转换](/static/posts/2019-10-28-17-16-38.png)

然而，我们可以放 Lambda 表达式，可以放匿名函数，可以放方法组，也可以放局部函数。因为这些类型可以在编译期间，由编译器帮助进行类型转换。而转换的效果就类似于我们自己编写 `new FileSystemEventHandler(xxx)` 一样。

## 不是同一个委托实例

看下面这一段代码，你认为可以 `-=` 成功吗？

```csharp
void Subscribe(FileSystemWatcher watcher)
{
    watcher.Changed += new FileSystemEventHandler(OnChanged);
    watcher.Changed -= new FileSystemEventHandler(OnChanged);
}

void OnChanged(object sender, FileSystemEventArgs e)
{
}
```

实际上这是可以 `-=` 成功的。

我们平时编写代码的时候，下面的情况可能会多一些，于是自然而然以为 `+=` 和 `-=` 可以成功，因为他们“看起来”是同一个实例：

```csharp
watcher.Changed += OnChanged;
watcher.Changed -= OnChanged;
```

在读完刚刚那一段之后，我们就可以知道，实际上这一段和上面 `new` 出来委托的写法在运行时是一模一样的。

如果你想测试，那么在 `+=` 的时候为对象加上一个 Id，在 `-=` 的时候你就会发现这是一个新对象（因为没有 Id）。

![不是同一个对象](/static/posts/2019-10-28-17-32-48.png)

然而，你平时众多的编码经验会告诉你，这里的 `-=` 是一定可以成功的。也就是说，`+=` 和 `-=` 时传入的委托实例即便不是同一个，也是可以成功 `+=` 和 `-=` 的。

## `+=` `-=` 是怎么做的

`+=` 和 `-=` 到底是怎么做的，可以在不同实例时也能 `+=` 和 `-=` 成功呢？

`+=` 和 `-=` 实际上是调用了 `Delegate` 的 `Combine` 和 `Remove` 方法，并生成一个新的委托实例赋值给 `+=` `-=` 的左边。

```csharp
public event FileSystemEventHandler Changed
{
    add
    {
        onChangedHandler = (FileSystemEventHandler)Delegate.Combine(onChangedHandler, value);
    }
    remove
    {
        onChangedHandler = (FileSystemEventHandler)Delegate.Remove(onChangedHandler, value);
    }
}
```

而最终的判断也是通过 `Delegate` 的 `Equals` 方法来比较委托的实例是否相等的（`==` 和 `!=` 也是调用的 `Equals`）：

```csharp
public override bool Equals(object? obj)
{
    if (obj == null || !InternalEqualTypes(this, obj))
        return false;

    Delegate d = (Delegate)obj;

    // do an optimistic check first. This is hopefully cheap enough to be worth
    if (_target == d._target && _methodPtr == d._methodPtr && _methodPtrAux == d._methodPtrAux)
        return true;

    // even though the fields were not all equals the delegates may still match
    // When target carries the delegate itself the 2 targets (delegates) may be different instances
    // but the delegates are logically the same
    // It may also happen that the method pointer was not jitted when creating one delegate and jitted in the other
    // if that's the case the delegates may still be equals but we need to make a more complicated check

    if (_methodPtrAux == IntPtr.Zero)
    {
        if (d._methodPtrAux != IntPtr.Zero)
            return false; // different delegate kind
        // they are both closed over the first arg
        if (_target != d._target)
            return false;
        // fall through method handle check
    }
    else
    {
        if (d._methodPtrAux == IntPtr.Zero)
            return false; // different delegate kind

        // Ignore the target as it will be the delegate instance, though it may be a different one
        /*
        if (_methodPtr != d._methodPtr)
            return false;
            */

        if (_methodPtrAux == d._methodPtrAux)
            return true;
        // fall through method handle check
    }

    // method ptrs don't match, go down long path
    //
    if (_methodBase == null || d._methodBase == null || !(_methodBase is MethodInfo) || !(d._methodBase is MethodInfo))
        return Delegate.InternalEqualMethodHandles(this, d);
    else
        return _methodBase.Equals(d._methodBase);
}
```

于是可以看出来，判断相等就是两个关键对象的判断相等：

1. 方法所在的对象
1. 方法信息（对应到反射里的 `MethodInfo`)

继续回到这段代码：

```csharp
void Subscribe(FileSystemWatcher watcher)
{
    watcher.Changed += new FileSystemEventHandler(OnChanged);
    watcher.Changed -= new FileSystemEventHandler(OnChanged);
}

void OnChanged(object sender, FileSystemEventArgs e)
{
}
```

这里的对象就是 `this`，方法信息就是 `OnChanged` 的信息，也就是：

```csharp
// this 就是对象，OnChanged 就是方法信息。
this.OnChanged
```

## `-=`

于是什么样的 `-=` 才可以把 `+=` 加进去的事件处理函数减掉呢？

- **必须是同一个对象的同一个方法**

所以：

1. 使用方法组、静态局部函数、委托字段的方式创建的委托实例，在 `+=` 和 `-=` 的时候无视哪个委托实例，都是可以减掉的；
1. 使用局部函数、委托变量，在同一个上下文中，是可以减掉的，如果调用是再次进入此函数，则不能减掉（因为委托方法所在的对象实例不同）
1. 使用 Lambda 表达式、匿名函数是不能减掉的，因为每次编写的 Lambda 表达式和匿名函数都会创建新的包含此对象的实例。


