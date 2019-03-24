---
title: "C#/.NET 如何获取一个异常（Exception）的关键特征，用来判断两个异常是否表示同一个异常"
date: 2019-03-24 11:40:31 +0800
categories: dotnet csharp
position: principle
---

在 .NET / C# 程序中出现异常是很常见的事情，程序出现异常后记录日志或者收集到统一的地方可以便于分析程序中各种各样此前未知的问题。但是，有些异常表示的是同一个异常，只是因为参数不同、状态不同、用户的语言环境不同就分开成多个异常的话，分析起来会有些麻烦。

本文将提供一个方法，将异常的关键信息提取出来，这样可以比较多次抛出的不同的异常实例是否表示的是同一个异常。

---

<div id="toc"></div>

## `Exception.ToString()`

以下是捕获到的一个异常实例，调用 `ToString()` 方法后拿到的结果：

```csharp
System.NotSupportedException: BitmapMetadata 在 BitmapImage 上可用。
   在 System.Windows.Media.Imaging.BitmapImage.get_Metadata()
   在 System.Windows.Media.Imaging.BitmapFrame.Create(BitmapSource source)
   在 Walterlv.Demo.Exceptions.Foo.Take(string fileName)
```

在英文的系统上，拿到的结果可能是这样的：

```csharp
System.NotSupportedException: BitmapMetadata is not available on BitmapImage.
   at System.Windows.Media.Imaging.BitmapImage.get_Metadata()
   at System.Windows.Media.Imaging.BitmapFrame.Create(BitmapSource source)
   at Walterlv.Demo.Exceptions.Foo.Take(string fileName)
```

这样，我们就不能使用 `ToString()` 来判断两个异常是否表示同一个异常了。

另外，在 `ToString()` 方法中，如果包含 PDB，那么异常堆栈中还会包含源代码文件的路径以及行号信息。

关于 `ToString()` 中输出的信息，可以阅读 `StackTrace.ToString()` 方法的源码来了解：

- [StackTrace.cs](https://source.dot.net/#System.Private.CoreLib/shared/System/Diagnostics/StackTrace.cs,693f60dbd83e7853)

## 哪些信息是异常的关键信息

从默认的 `ToString()` 中我们可以得知，它包含三个部分：

1. 异常类型的全名 `Type.FullName`
1. 异常信息 `Exception.Message`
1. 异常堆栈 `Exception.StackTrace`

考虑到 `Message` 部分受多语言影响非常严重，很难作为关键异常特征，所以我们在提取关键异常特征的时候，需要将这一部分去掉，只能作为此次异常的附加信息，而不能作为关键特征。

所以我们的关键特征就是：

1. 异常类型的全名 `Type.FullName`
1. 异常堆栈中所有帧的方法签名（这能保证语言无关）

比如本文一开始列举出来的异常堆栈，我们应该提取成：

```csharp
System.NotSupportedException
  System.Windows.Media.Imaging.BitmapImage.get_Metadata()
  System.Windows.Media.Imaging.BitmapFrame.Create(BitmapSource source)
  Walterlv.Demo.Exceptions.Foo.Take(string fileName)
```

## 提取特征的 C# 代码

为了提取出以上的关键特征，我需要写一段 C# 代码来做这样的事情：

```csharp
public (string typeName, string frameSignature) GetDescriptor(Exception exception)
{
    var type = exception.GetType().FullName;
    var stackFrames = new StackTrace(exception).GetFrames() ?? new StackFrame[0];
    var frames = stackFrames.Select(x => x.GetMethod()).Select(m =>
        $"{m.DeclaringType?.FullName ?? "null"}.{m.Name}({string.Join(", ", m.GetParameters().Select(p => $"{p.ParameterType.Name} {p.Name}"))})");
    return (type, frames.ToList());
}
```

一个是拿到 `Exception` 实例的类型名称，通过 `exception.GetType().FullName`。

另一个拿到方法签名。

由于 `Exception.StackTrace` 属性得到的是一个字符串，而且此字符串还真的有可能根本不是异常信息呢，所以我们这里通过创建一个 `StackTrace` 的实例来从异常中获取真实的堆栈，当然如果拿不到我们这里使用空数组来表示。

随后，遍历异常堆栈中的所有帧，将方法名和方法的所有参数进行拼接，形成 `ClassFullName.MethodName(ParameterType parameterName)` 这样的形式，于是就拼接成类似 `Exception.ToString()` 中的格式了。

由于确定一个类型中是否是同一个方法时与返回值无关，所以我们甚至不需要将返回值加上就能唯一确定一个方法了。

## 一个完整的 ExceptionDescriptor

为了方便，我写了一个完整的 `ExceptionDescriptor` 类型来完成异常特征提取的事情。这个类同时重写了相等方法，这样可以直接使用相等方法来判断两个异常的关键信息是否表示的是同一个异常。

源码可以在这里找到：<https://gist.github.com/walterlv/0ce95369aa78c5f0f38a527bef5779c2>

```csharp
using System;
using System.Collections.Generic;
using System.Diagnostics;
using System.Linq;

namespace Walterlv
{
    /// <summary>
    /// 包含一个 <see cref="Exception"/> 对象的关键特征，可使用此对象的实例判断两个不同的异常实例是否极有可能表示同一个异常。
    /// </summary>
    [DebuggerDisplay("{TypeName,nq}: {FrameSignature[0],nq}")]
    public class ExceptionDescriptor : IEquatable<ExceptionDescriptor>
    {
        /// <summary>
        /// 获取此异常的类型名称。
        /// </summary>
        public string TypeName { get; }

        /// <summary>
        /// 获取此异常堆栈中的所有帧的方法签名，指的是在一个类型中不会冲突的最小部分，所以不含返回值和可访问性。
        /// 比如 private void Foo(Bar b); 方法，在这里会写成 Foo(Bar b)。
        /// </summary>
        public IReadOnlyList<string> FrameSignature { get; }

        /// <summary>
        /// 从一个异常中提取出关键的异常特征，并创建 <see cref="ExceptionDescriptor"/> 的新实例。
        /// </summary>
        /// <param name="exception">要提取特征的异常。</param>
        public ExceptionDescriptor(Exception exception)
        {
            var type = exception.GetType().FullName;
            var stackFrames = new StackTrace(exception).GetFrames() ?? new StackFrame[0];
            var frames = stackFrames.Select(x => x.GetMethod()).Select(m =>
                $"{m.DeclaringType?.FullName ?? "null"}.{m.Name}({string.Join(", ", m.GetParameters().Select(p => $"{p.ParameterType.Name} {p.Name}"))})");
            TypeName = type;
            FrameSignature = frames.ToList();
        }

        /// <summary>
        /// 根据异常的信息本身创建异常的关键特征。
        /// </summary>
        /// <param name="typeName">异常类型的完整名称。</param>
        /// <param name="frameSignature">
        /// 异常堆栈中的所有帧的方法签名，指的是在一个类型中不会冲突的最小部分，所以不含返回值和可访问性。
        /// 比如 private void Foo(Bar b); 方法，在这里会写成 Foo(Bar b)。
        /// </param>
        public ExceptionDescriptor(string typeName, IReadOnlyList<string> frameSignature)
        {
            TypeName = typeName;
            FrameSignature = frameSignature;
        }

        /// <summary>
        /// 判断此异常特征对象是否与另一个对象实例相等。
        /// 如果参数指定的对象是 <see cref="ExceptionDescriptor"/>，则判断特征是否相等。
        /// </summary>
        public override bool Equals(object obj)
        {
            if (ReferenceEquals(null, obj))
            {
                return false;
            }

            if (ReferenceEquals(this, obj))
            {
                return true;
            }

            if (obj.GetType() != this.GetType())
            {
                return false;
            }

            return Equals((ExceptionDescriptor) obj);
        }

        /// <summary>
        /// 判断此异常特征与另一个异常特征是否是表示同一个异常。
        /// </summary>
        public bool Equals(ExceptionDescriptor other)
        {
            if (ReferenceEquals(null, other))
            {
                return false;
            }

            if (ReferenceEquals(this, other))
            {
                return true;
            }

            return string.Equals(TypeName, other.TypeName) && FrameSignature.SequenceEqual(other.FrameSignature);
        }

        /// <inheritdoc />
        public override int GetHashCode()
        {
            unchecked
            {
                return ((TypeName != null ? StringComparer.InvariantCulture.GetHashCode(TypeName) : 0) * 397) ^
                       (FrameSignature != null ? FrameSignature.GetHashCode() : 0);
            }
        }

        /// <summary>
        /// 判断两个异常特征是否是表示同一个异常。
        /// </summary>
        public static bool operator ==(ExceptionDescriptor left, ExceptionDescriptor right)
        {
            return Equals(left, right);
        }

        /// <summary>
        /// 判断两个异常特征是否表示的不是同一个异常。
        /// </summary>
        public static bool operator !=(ExceptionDescriptor left, ExceptionDescriptor right)
        {
            return !Equals(left, right);
        }
    }
}
```

---

**参考资料**

- [StackTrace.cs](https://source.dot.net/#System.Private.CoreLib/shared/System/Diagnostics/StackTrace.cs,693f60dbd83e7853)
