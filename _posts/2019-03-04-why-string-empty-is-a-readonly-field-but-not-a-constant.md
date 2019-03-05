---
title: "为什么 C# 的 string.Empty 是一个静态只读字段，而不是一个常量呢？"
publishDate: 2019-03-04 23:29:47 +0800
date: 2019-03-05 23:54:05 +0800
categories: dotnet csharp
position: principle
---

使用 C# 语言编写字符串常量的时候，你可能会发现可以使用 `""` 而不能使用 `string.Empty`。进一步可以发现 `string.Empty` 实际上是一个静态只读字段，而不是一个常量。

为什么这个看起来最适合是常量的 `string.Empty`，竟然使用静态只读字段呢？

---

<div id="toc"></div>

### string.Empty

这个问题，我们需要去看 .NET Core 的源码（当然 .NET Framework 也是一样的）。

```csharp
[Intrinsic]
public static readonly string Empty;
```

值得注意的是上面的 `Intrinsic` 特性。

### Intrinsic 特性

`Intrinsic` 特性的注释是这样的：

> Calls to methods or references to fields marked with this attribute may be replaced at some call sites with jit intrinsic expansions.  
> Types marked with this attribute may be specially treated by the runtime/compiler.

翻译过来是：对具有此 `Intrinsic` 特性标记的字段的方法或引用的调用可以在某些具有 JIT 内部扩展的调用点处替换，标记有此属性的类型可能被运行时或编译器特殊处理。

也就是说，`string.Empty` 字段并不是一个普通的字段，对它的调用会被特殊处理。但是是如何特殊处理呢？

### JIT 编译器

对 `string.Empty` 的注释是这样描述的：

> The Empty constant holds the empty string value. It is initialized by the EE during startup. It is treated as intrinsic by the JIT as so the static constructor would never run. Leaving it uninitialized would confuse debuggers.  
> We need to call the String constructor so that the compiler doesn't mark this as a literal. Marking this as a literal would mean that it doesn't show up as a field which we can access from native.

翻译过来是：

> Empty 常量保存的是空字符串的值，它在启动期间由执行引擎初始化。它被 JIT 视为内在的，因此静态构造函数永远不会运行。将它保持为未初始化的状态将会使得调试器难以解释此行为。  
> 于是我们需要调用 String 的构造函数，以便编译器不会将其标记为文字。将其标记为文字将意味着它不会显示为我们可以从本机代码访问的字段。

说明一下：

1. 注释里的 EE 是 Execution Engine 的缩写，其实也就是 CLR 运行时。
1. 那个 literal 我翻译成了文字。实际上这里说的是 IL 调用字符串时的一些区别：
    - 在调用 `""` 时使用的 IL 是 `ldstr ""`（Load String Literal）
    - 而在调用 `string.Empty` 时使用的 IL 是 `ldsfld string [mscorlib]System.String::Empty`（Load Static Field）
1. 虽然 IL 在调用 `""` 和 `string.Empty` 时生成的 IL 不同，但是在 JIT 编译成本机代码的时候，生成的代码完全一样。
    - 详情请参见：[.net - What's the different between ldsfld and ldstr in IL? - Stack Overflow](https://stackoverflow.com/a/3674336/6233938)
    - 我写过一篇文章 [.NET/C# 编译期间能确定的相同字符串，在运行期间是相同的实例 - 吕毅](/post/same-strings-at-compile-time-are-the-same-instances-at-runtime.html)。虽然一般情况下取字符串常量实例的时候会去字符串池，但是不用担心取 `""` 会造成性能问题，因为实际上 JIT 编译器已经特殊处理了，不会去找池子。

`string.Empty` 字段在整个 `String` 类型中你都看不到初始化的代码，`String` 类的静态构造函数也不会执行。也就是说，`String` 类中的所有静态成员都不会被托管代码初始化。`String` 的静态初始化过程都是由 CLR 运行时进行的，而这部分的初始化是本机代码实现的。

那本机代码又是如何初始化 `String` 类型的呢？在 CLR 运行时的 `AppDomain::SetupSharedStatics()` 方法中实现，可前往 GitHub 阅读这部分的源码：

- [coreclr/appdomain.cpp at ef1e2ab328087c61a6878c1e84f4fc5d710aebce · dotnet/coreclr](https://github.com/dotnet/coreclr/blob/ef1e2ab328087c61a6878c1e84f4fc5d710aebce/src/vm/appdomain.cpp#L7735)

```cpp
// This is a convenient place to initialize String.Empty.
// It is treated as intrinsic by the JIT as so the static constructor would never run.
// Leaving it uninitialized would confuse debuggers.

// String should not have any static constructors.
_ASSERTE(g_pStringClass->IsClassPreInited());

FieldDesc * pEmptyStringFD = MscorlibBinder::GetField(FIELD__STRING__EMPTY);
OBJECTREF* pEmptyStringHandle = (OBJECTREF*)
    ((TADDR)pLocalModule->GetPrecomputedGCStaticsBasePointer()+pEmptyStringFD->GetOffset());
SetObjectReference( pEmptyStringHandle, StringObject::GetEmptyString(), this );
```

### 总结：为什么 string.Empty 需要是一个静态只读字段而不是常量？

从上文中 `string.Empty` 的注释描述中可以知道：

1. 编译器会将 C# 语言编译成中间语言 MSIL；
1. 如果这是一个常量，那么编译器在不做特殊处理的情况下，就会生成 `ldstr ""`，而这种方式不会调用到 `String` 类的构造函数（注意不是静态构造函数，`String` 类的静态构造函数是特殊处理不会调用的）；
1. 而如果这是一个静态字段，那么编译器可以在不做特殊处理的情况下，生成 `ldsfld string [mscorlib]System.String::Empty`，这在首次执行时会触发 `String` 类的构造函数，并在本机代码（非托管代码）中完成初始化。

当然，事实上编译器也可以针对此场景做特殊处理，但为什么不是在编译这一层进行特殊处理，我已经找不到出处了。

### 本文引申的其他问题

#### 能否反射修改 string.Empty 的值？

不行！

实际上，在 .NET Framework 4.0 及以前是可以反射修改其值的，这会造成相当多的基础组件不能正常工作，在 .NET Framework 4.5 和以后的版本，以及 .NET Core 中，CLR 运行时已经不允许你做出这么出格儿的事了。

不过，如果你使用不安全代码（`unsafe`）来修改这个字段的值就当我没说。关于使用不安全代码转换字符串的方法可以参见：

- [C＃ 字符串首字符大写 - 林德熙](https://lindexi.gitee.io/post/C-%E5%AD%97%E7%AC%A6%E4%B8%B2%E9%A6%96%E5%AD%97%E7%AC%A6%E5%A4%A7%E5%86%99.html)
- [.NET/C# 编译期间能确定的相同字符串，在运行期间是相同的实例 - 吕毅](/post/same-strings-at-compile-time-are-the-same-instances-at-runtime.html)

#### `""` 和 `string.Empty` 到底有什么区别？

从前文你可以得知，在运行时级别，这两者 **没有任何区别**。

于是，当你需要一个代表 “空字符串” 含义的时候，使用 `string.Empty`；而当你必须要一个常量时，就使用 `""`。

---

#### 参考资料

- [String.CoreCLR.cs](https://source.dot.net/#System.Private.CoreLib/src/System/String.CoreCLR.cs,c9f70a27facb27cf)
- [Intrinsic](https://source.dot.net/#System.Private.CoreLib/shared/System/Runtime/CompilerServices/IntrinsicAttribute.cs,0b1553fdd9183e62,references)
- [在C#中 String.Empty和 "" 有什么区别？ - 知乎](https://www.zhihu.com/question/24811218)
- [.net - What's the different between ldsfld and ldstr in IL? - Stack Overflow](https://stackoverflow.com/a/3674336/6233938)
