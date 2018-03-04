---
title: "应该抛出什么异常？不应该抛出什么异常？（.NET/C#）"
date: 2018-02-04 21:25:51 +0800
categories: dotnet csharp
---

我在 [.NET/C# 建议的异常处理原则](/post/suggestions-for-handling-exceptions.html) 中描述了如何 `catch` 异常以及重新 `throw`。然而何时应该 `throw` 异常，以及应该 `throw` 什么异常呢？

---

<p id="toc"></p>

### 究竟是谁错了？

代码中从上到下从里到外都是在执行一个个的包含某种目的的代码，我们将其称之为“任务”。当需要完成某项任务时，任务的完成情况只有两种结果：

1. 成功完成
1. 失败

异常处理机制就是处理上面的第 2 种情况。这里我们不谈论错误码系统，那么，异常便应该在任务执行失败时抛出异常。

抛出异常后，报告错误只是手段，真正要做的是**帮助开发者修复错误**。于是，第一个要做的就是区分到底——谁错了！

- 任务的使用者用错了
- 任务的执行代码写错了
- 任务执行时所在的环境不符合预期

简单说来，就是：使用错误，实现错误、环境错误。

### 让我们把异常归类到这些错误中

本文的重点在于指导我们何时应该抛出什么异常，也就是说——我们的角色是——任务的编写者。那么，编写者有责任编写出一段没有错误的代码。这就说明——**永远不应该抛出表示自己写错了的异常**。

那么，我们对常见的异常进行分类。

#### 使用错误

- `ArgumentException` 表示参数使用错了
    - `ArgumentNullException` 表示参数不应该传入 `null`
    - `ArgumentOutOfRangeException` 表示参数中的序号超出了范围
    - `InvalidEnumArgumentException` 表示参数中的枚举值不正确
- `InvalidOperationException` 表示当前状态下不允许进行此操作（也就是说存在着允许进行此操作的另一种状态）
    - `ObjectDisposedException` 表示对象已经 `Dispose` 过了，不能再使用了
- `NotSupportedException` 表示不支持进行此操作（这是在说不要再试图对这种类型的对象调用此方法了，不支持）
    - `PlatformNotSupportedException` 表示在此平台下不支持（如果程序跨平台的话）

#### 实现错误

- `NullReferenceException` 试图在空引用上执行某些方法，除了告诉实现者出现了意料之外的 `null` 之外，没有什么其它价值了
- `IndexOutOfRangeException` 使用索引的时候超出了边界
- `InvalidCastException` 表示试图对某个类型进行强转但类型不匹配
- `StackOverflow` 表示栈溢出，这通常说明实现代码的时候写了不正确的显式或隐式的递归
- `OutOfMemoryException` 表示托管堆中已无法分出期望的内存空间，或程序已经没有更多内存可用了
- `AccessViolationException` 这说明使用非托管内存时发生了错误
- `BadImageFormatException` 这说明了加载的 dll 并不是期望中的托管 dll
- `TypeLoadException` 表示类型初始化的时候发生了错误

#### 环境错误

- `IOException` 下的各种子类
- `Win32Exception` 下的各种子类
- ……

#### 无法归类

不应该抛出，却又不得不抛出的异常：

- `NotImplementedException` 这只能说明此功能还在开发中，一旦进入正式环境，不要抛出此异常（如果那时真的没有完成，这个方法就应该删除）
- `AggregateException` 如果可能，真的不要抛出此异常，因为它本身不包含异常信息，让使用者很难正确 `catch` 这样的异常。如果内部只有一个异常，应该使用 `ExceptionDispatchInfo` 将内部异常合并（请参阅 [使用 ExceptionDispatchInfo 捕捉并重新抛出异常 - 吕毅](/post/exceptiondispatchinfo-capture-throw.html)）（`Task` 在执行多个任务后，如果多个任务都发生了异常，就抛出了 `AggregateException`，但这已经是没有办法的事情了，因为没有办法将两个可能不是同类的异常合并成一个）

永远都不应该抛出异常：

- `FormatException` 这算是 .NET 设计上的失误吧……因为当它抛出来时无法准确描述到底什么错了
- `ApplicationException` 这是各种异常的基类，本身并没有明确的意义
- `SystemException` 这是各种异常的基类，本身并没有明确的意义
- `Exception` 这可是顶级基类，这都抛出来了，使用者再也无法正确地处理此异常了

### 是时候该决定抛什么异常了

#### 对于使用错误，应该在第一时间抛出

既然对方已经用错了，那么代码继续执行也只会错上加错。

```csharp
public string Foo(Bar demo)
{
    demo.Output("Walterlv");
    return _anotherDemo.ToString();
}
```

例如上面的方法中使用者传入了一个 `null` 参数后，方法必然执行失败 —— 抛出了一个 `NullReferenceException`。但是，当拿着这样的异常去调查哪里错了的时候，我们会发现 `demo` 和 `anotherDemo` 都可能为 null。

然而很明显，这时使用者的错，使用者确保传入的参数不为 `null`，方法就可以继续执行。

如果在方法的一开始就抛出使用异常 `ArgumentNullException`，那么就可以向使用者报告这样的参数使用错误。

另外的情况，`_anotherDemo` 是此类型中的另一个字段，此时也要求必须非 `null`。而要确保非 `null`，使用者必须使用其它方式隐式初始化这个字段，那么应该抛出 `InvalidOperationException`，告诉使用者应该先调用其他的某个方法。

那么，应该改成：

```csharp
public string Foo([NotNull] Bar demo)
{
    if (demo == null)
        throw new ArgumentNullException(nameof(demo));
    if (_anotherDemo == null)
        throw new InvalidOperationException("必须使用 XXX 设置某个值之后才能使用 Foo 方法。");

    demo.Output("Walterlv");
    return _anotherDemo.ToString();
}
```

当然，不像 `ArgumentNullException`，`InvalidOperationException` 通常并不一定能在开始就确定是否满足状态要求，但最好能尽可能在第一时间抛出，避免错误蔓延。

做到了第一时间抛出使用错误，就能让使用者明确知道自己用错了，需要修改使用代码。*（这正是被另外一项事实所逼——典型的程序员是不看文档的，“使用异常”代替了一部分文档。）*

#### 永远不应该让实现错误抛出

这一节的标题其实说了三件事情：

1. 永远不应该主动用 `throw` 句式抛出“实现错误”章节中提到的任何异常
1. 如果你在调用某个别人实现的代码时遇到了“实现错误”章节中提到的异常，那说明“那个人”的代码写出 BUG 了，确信无疑。
1. 如果自己写的代码发现抛出了这些异常，那就说明自己写出了 BUG，需要第一时解决 BUG（是解决，不是逃避）

我们假设实现了这段代码：

```csharp
var button = (Button) sender;
button.Content = "Clicked";
```

如果在执行到第一句时发生了 `InvalidCastException`，说明实现代码编写是不正确的。

为了防止发生异常，可能有些人会改成这样：

```csharp
// 请注意：这段示例是错误的！
if (sender is Button button)
    button.Content = "Clicked";
```

这是在逃避问题，而不是解决问题！

这是一段典型的事件处理函数代码，`sender` 通常是事件的引发者。写这段代码的人并没有调查 `sender` 不是 `Button` 类型的原因，到底是因为在 `Grid` 上监听了路由事件的 `Click`，还是因为多个控件都把事件处理函数设为了这个方法。如果是前者，这样的改法会让这段代码的全部逻辑失效；如果是后者，这样的改法会让部分逻辑失效。

更应该去做的，是去检查 `+=` 的左边是否乱入了非 `Button` 的事件引发者。

```csharp
grid.Click += OnButtonClick
button.Click += OnButtonClick;
```

**修改这些源头上就已经不正确的代码**，**才是真正解决问题**。

另一个角度，如果事件的引发者确实可能有多种，那么事件处理函数就应该加上 `else` 逻辑，或者不要再使用 `sender`，或者强制转换时使用基类型。这也是在真正的解决问题。

额外的，对于 `OutOfMemoryException`，这通常意味着“实现”部分的代码存在着性能问题，应该着手解决。

#### 对于环境错误，关注于规避和恢复

环境错误是难以提前预估的；或者说预估的成本太高，不值得去预估。于是，当发生了环境错误，我们更加关注于**这样的环境中是什么导致了异常**，以及**程序是否正确处理了这样的异常并恢复错误**。

.NET 中已经为我们准备了很多场景下的多套环境异常，例如 IO 相关的异常，网络连接相关的异常。这些异常都不是我们应该抛出的。

### 程序中的异常

在异常处理中，每一位开发者应该从根源上在自己的代码中消灭“实现异常”（而不是“逃避”），同时在“使用异常”的帮助下正确调用其他方法，那么代码中将只剩下“环境异常”（和小部分性能导致的“实现异常”）。

此时，开发者们将有更多的精力关注在“解决的具体业务”上面，而不是不停地解决编码上的 BUG。

*特别的，“实现异常”可以被单元测试进行有效的检测。*
