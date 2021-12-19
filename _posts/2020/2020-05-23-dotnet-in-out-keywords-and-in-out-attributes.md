---
title: "理清 C# 语言的 in/out/ref 关键字和 .NET 的 In/Out 特性（Attribute）"
publishDate: 2020-05-20 23:56:33 +0800
date: 2020-05-23 12:00:00 +0800
tags: dotnet csharp
position: knowledge
published: false
permalink: /posts/dotnet-in-out-keywords-and-in-out-attributes.html
---

在此处编辑 blog.walterlv.com 的博客摘要

---

<div id="toc"></div>

## `in` `out` `ref` 关键字

`in` `out` `ref` 是 C# 语言带来的关键字，本文只研究它们用在参数传递中的特性，不打算涉及协变逆变这些。

`in` `out` `ref` 表示参数按引用传递（类似 C++ 的按引用传递）。例如下面的代码，在忽视额外带来的 `[In]` `[Out]` 特性的情况下，对 IL 来说是一样的，都取了引用：

```csharp
void Test1(in int a) { }
void Test2(out int a) { a = 0; }
void Test3(ref int a) { }
```

```csharp
.method private hidebysig void Test1 ([in] int32& a) cil managed { /* 省略 */ }
.method private hidebysig void Test2 ([out] int32& a) cil managed { /* 省略 */ }
.method private hidebysig void Test3 (int32& a) cil managed  { /* 省略 */ }
```

不过，在 C# 语言层面就不一样了。嗯，用这三个关键字来实现 IL 层面几乎同样的用途，它们之间的差别就只是在 C# 语言，即编译期间才会起作用。

关于这三个关键字额外带来的 `[in]` `[Out]` 特性，我们将在后面的讲特性的部分再详细说明。

### `in`

`in` 约束你无法在方法的实现中修改参数的值（注意是值本身，而值中的属性也会尽量检查避免直接赋值）。例如，下面的五个方法中，`Rectangle` 是 `struct`，`Foo` 是 `class`，`Test1`、`Test2` 和 `Test3` 都是无法编译通过的，因为试图修改只读变量或只读变量的成员。`Test4` 虽然也一样修改到了 `a` 的内部字段，但编译阶段已经没法检查了，所以 `Test4` 能编译通过。`Test5` 修改的是 `class` 的属性，是允许的。

```csharp
private static void Test1(in int a) { a = 2; }
private static void Test2(in object a) { a = new object(); }
private static void Test3(in Rectangle a) { a.Height = 2; }
private static void Test4(in Rectangle a) { a.Inflate(1, 2); }
private static void Test5(in Foo a) { a.Foo = 2; }
```

要避免 `Test4` 这样的疑惑，`in` 标记的参数类型最好是 `readonly struct`。

另：传入的参数必须是已赋值的，这点跟不加 `in` 关键字的要求是一样的。

### `out`

`out` 约束你必须在方法的实现中给参数赋值，否则会发生编译错误。

```csharp
void TestOutKeyword(out int a) { a = 0; }
```

但调用者不必提前赋值，例如我们常写的解析数字：

```csharp
int.TryParse("2", out var value);
```

### `ref`

作为引用传递，在方法内修改变量的值就是直接在修改调用者传入的变量的值。

`ref` 跟没标关键字的方法一样，也必须要求调用方法传入参数前必须赋值。比 `in` 更严格一点的是，`ref` 不可传入常量，而 `in` 是可以的。

## `[In]` `[Out]`

你可以在方法的参数上标 `[In]` `[Out]`，就像下面这样。只不过对于下面的场景，这样标记的特性在编译和执行层面完全没有作用，标不标在编译时和运行时没有任何差别。

```csharp
void Test1([In] int a) { }
void Test2([Out] int a) { }
void Test3([In, Out] int a) { }
```

它们编译后的 IL 代码为：

```csharp
.method private hidebysig void Test1 ([in] int32 a) cil managed { /* 省略 */ }
.method private hidebysig void Test2 ([out] int32 a) cil managed { /* 省略 */ }
.method private hidebysig void Test3 ([in] [out] int32 a) cil managed  { /* 省略 */ }
```

然而在托管内存和非托管内存的数据封送中，这两个特性的标记就体现出来了。

### 数据封送

`InAttribute` 和 `OutAttribute` 位于 `System.Runtime.InteropServices` 命名空间中，且等效于接口定义语言（IDL，Interface Definition Language）接口特性 `[in]`、`[out]`、`[in/out]` 和 `[out, retval]`。

数据封送的方法由前面的 `in` `out` `ref` 以及这里的 `[In]` 和 `[Out]` 共同决定。

#### 按值封送和按引用封送

`in` `out` `ref` 只有一个目的，就是决定在封送数据的时候按值封送还是按引用封送。

标记了这三个关键字的任意一个（对应到 IL 里面的 `&` 取引用），那么在封送的时候会按引用传递。也就是封送了堆栈上的指针到非托管代码中。

没有标记这三个关键字时，封送时会按值传递。

#### 决定修改是否可见

对于按值传递的引用类型（类、数组、字符串和接口），如果参数标记了 `[In]`，那么在封送结束后，无论非托管代码是否修改了参数里的值，托管代码这里都看不到任何修改。而要看到非托管代码对参数的修改，必须标记 `[Out]` 或者标 `[In] [Out]`。

而默认情况下，通过值传递的引用类型出于性能原因而作为 `[In]` 参数封送。`StringBuilder` 是一个例外，默认情况下作为 `[In] [Out]` 参数封送。

Interop 封送拆收器保证下列与方向特性有关的行为：

- Interop 封送拆收器从不生成对从非托管代码传递的 In 参数的写操作。 因此，非托管代码可以安全地传递指向只读页的指针，或传递指向被同时访问的数据的指针。
- 当复制的对象包含已分配的对象（如 BSTR）时，封送拆收器总是执行 `[In] [Out]` 设置所要求的正确的分配和销毁顺序。

---

**参考资料**

- [c# - Keywords `in, out, ref` vs Attributes `[In], [Out], [In, Out]` - Stack Overflow](https://stackoverflow.com/a/56098873/6233938)
- [Directional Attributes - Microsoft Docs](https://docs.microsoft.com/en-us/previous-versions/dotnet/netframework-4.0/77e6taeh%28v%3Dvs.100%29)
- [out parameter modifier - C# Reference - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/out-parameter-modifier)
- [out keyword - C# Reference - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/keywords/out)
- [Directional (Parameter) Attributes - Win32 apps - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/rpc/directional-parameter-attributes)

