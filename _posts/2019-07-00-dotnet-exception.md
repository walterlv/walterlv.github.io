---
title: "一文看懂 .NET 的异常处理机制、原则以及最佳实践"
date: 2019-07-03 14:14:18 +0800
categories: dotnet csharp
position: knowledge
published: false
---

在此处编辑 blog.walterlv.com 的博客摘要

---

<div id="toc"></div>

## 快速了解 .NET 的异常机制

### 异常与传统的错误处理方法



### Exception 类

我们大多数小伙伴可能更多的使用 `Exception` 的类型、`Message` 属性、`StackTrace` 以及内部异常来定位问题，但其实 `Exception` 类型还有更多的信息可以用于辅助定位问题。

- `Message` 用来描述异常原因的详细信息
    - 如果你捕捉到了异常，一般使用这段描述能知道发生的大致原因。
    - 如果你准备抛出异常，在这个信息里面记录能帮助调试问题的详细文字信息。
- `StackTrace` 包含用来确定错误位置的堆栈跟踪（当有调试信息如 PDB 时，这里就会包含源代码文件名和源代码行号）
- `InnerException` 包含内部异常信息
- `Source` 这个属性包含导致错误的应用程序或对象的名称
- `Data` 这是一个字典，可以存放基于键值的任意数据，帮助在异常信息中获得更多可以用于调试的数据
- `HelpLink` 这是一个 url，这个 url 里可以提供大量用于说明此异常原因的信息

如果你自己写一个自定义异常类，那么你可以在自定义的异常类中记录更多的信息。然而大多数情况下我们都考虑使用 .NET 中自带的异常类，因此可以充分利用 `Exception` 类中的已有属性在特殊情况下报告更详细的利于调试的异常信息。

### 捕捉异常

捕捉异常的基本语法是：

```csharp
try
{
    // 可能引发异常的代码。
}
catch (FileNotFoundException ex)
{
    // 处理一种类型的异常。
}
catch (IOException ex)
{
    // 处理另一种类的异常。
}
```

除此之外，还有 `when` 关键字用于筛选异常：

```csharp
try
{
    // 可能引发异常的代码。
}
catch (FileNotFoundException ex) when (Path.GetExtension(ex.FileName) is ".png")
{
    // 处理一种类型的异常，并且此文件扩展名为 .png。
}
catch (FileNotFoundException ex)
{
    // 处理一种类型的异常。
}
```

无论是否有带 `when` 关键字，都是前面的 `catch` 块匹配的时候执行匹配的 `catch` 块而无视后面可能也匹配的 `catch` 块。

如果 `when` 块中抛出异常，那么此异常将被忽略，`when` 中的表达式值视为 `false`。有个但是，请看：[.NET Framework 的 bug？try-catch-when 中如果 when 语句抛出异常，程序将彻底崩溃 - walterlv](https://blog.walterlv.com/post/try-catch-when-causes-app-crash.html)。

### 引发异常

引发异常使用 `throw` 关键字。只是注意如果要重新抛出异常，请使用 `throw;` 语句或者将原有异常作为内部异常。

### 创建自定义异常

如果你只是随便在业务上创建一个异常，那么写一个类继承自 `Exception` 即可：

```csharp
public class MyCustomException : Exception
{
    public string MyCustomProperty { get; }

    public MyCustomException(string customProperty) => MyCustomProperty = customProperty;
}
```

不过，如果你需要写一些比较通用抽象的异常（用于被继承），或者在底层组件代码中写自定义异常，那么就建议考虑写全异常的所有构造函数，并且加上可序列化：

```csharp
[Serializable]
public class InvalidDepartmentException : Exception
{
    public InvalidDepartmentException() : base() { }
    public InvalidDepartmentException(string message) : base(message) { }
    public InvalidDepartmentException(string message, Exception innerException) : base(message, innerException) { }

    // 如果异常需要跨应用程序域、跨进程或者跨计算机抛出，就需要能被序列化。
    protected InvalidDepartmentException(SerializationInfo info, StreamingContext context) : base(info, context) { }
}
```

在创建自定义异常的时候，建议：

- 名称以 `Exception` 结尾
- `Message` 属性的值是一个句子，用于描述异常发生的原因。
- 提供帮助诊断错误的属性。
- 尽量写全四个构造函数，前三个方便使用，最后一个用于序列化异常（新的异常类应可序列化）。

### finally

### 异常堆栈跟踪

堆栈跟踪从引发异常的语句开始，到捕获异常的 `catch` 语句结束。

利用这一点，你可以迅速找到引发异常的那个方法，也能找到是哪个方法中的 `catch` 捕捉到的这个异常。

## 异常处理原则

### try-catch-finally

我们第一个要了解的异常处理原则是——明确 `try` `catch` `finally` 的用途！

`try` 块中，编写可能会发生异常的代码。

最好的情况是，你只将可能会发生异常的代码放到 `try` 块中，当然实际应用的时候可能会需要额外放入一些相关代码。但是如果你将多个可能发生异常的代码放到一个 `try` 块中，那么将来定位问题的时候你就会很抓狂（尤其是多个异常还是一个类别的时候）。

`catch` 块的作用是用来 “恢复错误” 的，是用来 “恢复错误” 的，是用来 “恢复错误” 的。

如果你在 `try` 块中先更改了类的状态，随后出了异常，那么最好能将状态改回来——这可以避免这个类型或者应用程序的其他状态出现不一致——这很容易造成应用程序“雪崩”。举一个例子：我们写一个程序有简洁模式和专业模式，在从简洁模式切换到专业模式的时候，我们设置 `IsProfessionalMode` 为 `true`，但随后出现了异常导致没有成功切换为专业模式；然而接下来所有的代码在执行时都判断 `IsProfessionalMode` 为 `true` 状态不正确，于是执行了一些非预期的操作，甚至可能用到了很多专业模式中才会初始化的类型实例（然而没有完成初始化），产生大量的额外异常；我们说程序雪崩了，多数功能再也无法正常使用了。

当然如果任务已全部完成，仅仅在对外通知的时候出现了异常，那么这个时候不需要恢复状态，因为实际上已经完成了任务。

你可能会有些担心如果我没有任何手段可以恢复错误怎么办？那这个时候就不要处理异常！——如果不知道如何恢复错误，请不要处理异常！让异常交给更上一层的模块处理，或者交给整个应用程序全局异常处理模块进行统一处理（这个后面会讲到）。

另外，异常不能用于在正常执行过程中更改程序的流程。异常只能用于报告和处理错误条件。

`finally` 块的作用是清理资源。

虽然 .NET 的垃圾回收机制可以在回收类型实例的时候帮助我们回收托管资源（例如 `FileStream` 类打开的文件），但那个时机不可控。因此我们需要在 `finally` 块中确保资源可被回收，这样当重新使用这个文件的时候能够立刻使用而不会被占用。

一段异常处理代码中可能没有 `catch` 块而有 `finally` 块，这个时候的重点是清理资源，通常也不知道如何正确处理这个错误。

一段异常处理代码中也可能 `try` 块留空，而只在 `finally` 里面写代码，这是为了“线程终止”安全考虑。在 .NET Core 中由于不支持线程终止因此可以不用这么写。详情可以参考：[.NET/C# 异常处理：写一个空的 try 块代码，而把重要代码写到 finally 中（Constrained Execution Regions） - walterlv](https://blog.walterlv.com/post/empty-try-block.html)。

### 该不该引发异常？

什么情况下该引发异常？答案是——这真的是一个异常情况！

于是，我们可能需要知道什么是“异常情况”。

一个可以参考的判断方法是——判断这件事发生的频率：

- 如果这件事并不常见，当它发生时确实代表发生了一个错误，那么这件事情就可以认为是异常。
- 如果这件事经常发生，代码中正常情况就应该处理这件事情，那么这件事情就不应该被认为是异常（而是正常流程的一部分）。

例如这些情况都应该认为是异常：

- 方法中某个参数不应该传入 `null` 时但传入了 `null`
    - 这是开发者使用这个方法时没有遵循此方法的契约导致的，让开发者改变调用此方法的代码就可以完全避免这件事情发生

而下面这些情况则不应该认为是异常：

- 用户输入了一串字符，你需要将这串字符转换为数字
    - 用户输入的内容本身就千奇百怪，出现非数字的输入再正常不过了，对非数字的处理本就应该成为正常流程的一部分

对于这些不应该认为是异常的情况，编写的代码就应该尽可能避免异常。

有两种方法来避免异常：

1. 先判断再使用。
    - 例如读取文件之前，先判断文件是否存在；例如读取文件流时先判断是否已到达文件末尾。
    - 如果提前判断的成本过高，可采用 `TryDo` 模式来完成，例如字符串转数字中的 `TryParse` 方法，字典中的 `TryGetValue` 方法。
1. 对极为常见的错误案例返回 `null`（或默认值），而不是引发异常。极其常见的错误案例可被视为常规控制流。通过在这些情况下返回 NULL（或默认值），可最大程度地减小对应用的性能产生的影响。（后面会专门说 null）

而当存在下列一种或多种情况时，应引发异常：

1. 方法无法完成其定义的功能。
1. 根据对象的状态，对某个对象进行不适当的调用。

请勿有意从自己的源代码中引发 [System.Exception](https://docs.microsoft.com/zh-cn/dotnet/api/system.exception)、[System.SystemException](https://docs.microsoft.com/zh-cn/dotnet/api/system.systemexception)、[System.NullReferenceException](https://docs.microsoft.com/zh-cn/dotnet/api/system.nullreferenceexception) 或 [System.IndexOutOfRangeException](https://docs.microsoft.com/zh-cn/dotnet/api/system.indexoutofrangeexception)。

### 该不该捕获异常？

在前面 [try-catch-finally](#try-catch-finally) 小节中，我们提到了 `catch` 块中应该写哪些代码，那里其实已经说明了哪些情况下应该处理异常，哪些情况下不应该处理异常。一句总结性的话是——如果知道如何从错误中恢复，那么就捕获并处理异常，否则交给更上层的业务去捕获异常；如果所有层都不知道如何处理异常，就交给全局异常处理模块进行处理。

### 应用程序全局处理异常

对于 .NET 程序，无论是 .NET Framework 还是 .NET Core，都有下面这三个可以全局处理的异常。这三个都是事件，可以自行监听。

- `AppDomain.UnhandledException`
    - 应用程序域未处理的异常，任何线程中未处理掉的异常都会进入此事件中
    - 当这里能够收到事件，意味着应用程序现在频临崩溃的边缘（从设计上讲，都到这里了，也再没有任何代码能够使得程序从错误中恢复了）
    - 不过也可以[配置 legacyUnhandledExceptionPolicy 防止后台线程抛出的异常让程序崩溃退出](/post/prevent-app-crash-by-background-thread.html)
    - 建议在这个事件中记录崩溃日志，然后对应用程序进行最后的拯救恢复操作（例如保存用户的文档数据）
- `AppDomain.FirstChanceException`
    - 应用程序域中的第一次机会异常
    - 我们前面说过，一个异常被捕获时，其堆栈信息将包含从 `throw` 块到 `catch` 块之间的所有帧，而在第一次机会异常事件中，只是刚刚 `throw` 出来，还没有被任何 `catch` 块捕捉，因此在这个事件中堆栈信息永远只会包含一帧（不过可以稍微变通一下[在第一次机会异常 FirstChanceException 中获取比较完整的异常堆栈](/post/how-to-get-the-full-stacktrace-of-an-first-chance-exception.html)）
    - 注意第一次机会异常事件即便异常会被 `catch` 也会引发，因为它引发在 `catch` 之前
    - 不要认为异常已经被 `catch` 就万事大吉可以无视这个事件了。前面我们说过异常仅在真的是异常的情况才应该引发，因此如果这个事件中引发了异常，通常也真的意味着发生了错误（差别只是我们能否从错误中恢复而已）。如果你经常在正常的操作中发现可以通过此事件监听到第一次机会异常，那么一定是应用程序或框架中的异常设计出了问题（可能把正常应该处理的流程当作了异常，可能内部实现代码错误，可能出现了使用错误），这种情况一定是要改代码修 Bug 的。而一些被认为是异常的情况下收到此事件则是正常的。
- `TaskScheduler.UnobservedTaskException`
    - 在使用 `async` / `await` 关键字编写异步代码的时候，如果一直有 `await` 传递，那么异常始终可以被处理到；但中间有异步任务没有 `await` 导致异常没有被传递的时候，就会引发此事件。
    - 如果在此事件中监听到异常，通常意味着代码中出现了不正确的 `async` / `await` 的使用（要么应该修改实现避免异常，要么应该正确处理异常并从中恢复错误）

对于 GUI 应用程序，还可以监听 UI 线程上专属的全局异常：

- WPF：`Application.DispatcherUnhandledException` 或者 `Dispatcher.UnhandledException`
- Windows Forms：`Application.ThreadException`

关于这些全局异常的处理方式和示例代码，可以参阅博客：

- [WPF UnhandledException - Iron 的博客 - CSDN博客](https://blog.csdn.net/iron_ye/article/details/82913025)

### 抛出哪些异常？

任何情况下都不应该抛出这些异常：

- 过于抽象，以至于无法表明其含义
    - `Exception` 这可是顶级基类，这都抛出来了，使用者再也无法正确地处理此异常了
    - `SystemException` 这是各种异常的基类，本身并没有明确的意义
    - `ApplicationException` 这是各种异常的基类，本身并没有明确的意义
- 由 CLR 引发的异常
    - `NullReferenceException` 试图在空引用上执行某些方法，除了告诉实现者出现了意料之外的 null 之外，没有什么其它价值了
    - `IndexOutOfRangeException` 使用索引的时候超出了边界
    - `InvalidCastException` 表示试图对某个类型进行强转但类型不匹配
    - `StackOverflow` 表示栈溢出，这通常说明实现代码的时候写了不正确的显式或隐式的递归
    - `OutOfMemoryException` 表示托管堆中已无法分出期望的内存空间，或程序已经没有更多内存可用了
    - `AccessViolationException` 这说明使用非托管内存时发生了错误
    - `BadImageFormatException` 这说明了加载的 dll 并不是期望中的托管 dll
    - `TypeLoadException` 表示类型初始化的时候发生了错误
- .NET 设计失误
    - `FormatException` 因为当它抛出来时无法准确描述到底什么错了

首先是你自己不应该抛出这样的异常。其次，你如果在运行中捕获到了上面这些异常，那么代码一定是写得有问题。

如果是捕获到了上面 CLR 的异常，那么有两种可能：

1. 你的代码编写错误（例如本该判空的代码没有判空，又如索引数组超出界限）
1. 你使用到的别人写的代码编写错误（那你就需要找到它改正，或者如果开源就去开源社区中修复吧）

而一旦捕获到了上面其他种类的异常，那就找到抛这个异常的人，然后对它一帧狂扁即可。

其他的异常则是可以抛出的，只要你可以准确地表明错误原因。

### 异常的分类

在 [该不该引发异常](#该不该引发异常？) 小节中我们说到一个异常会被引发，是因为某个方法声称的任务没有成功完成（失败），而失败的原因有四种：

1. 方法的使用者用错了（没有按照方法的契约使用）
1. 方法的执行代码写错了
1. 方法执行时所在的环境不符合预期

简单说来，就是：使用错误，实现错误、环境错误。

## 其他

### 一些常见异常的原因和解决方法

BadImageException

FileNotFoundExcception

### 捕捉非 CLS 异常



---

**参考资料**

- [Handling and throwing exceptions in .NET - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/exceptions/)
- [Exceptions and Exception Handling - C# Programming Guide - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/exceptions/)
