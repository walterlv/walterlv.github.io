---
title: "使用 Emit 生成 IL 代码"
date_published: 2018-04-22 21:14:58 +0800
date: 2018-04-27 07:10:34 +0800
categories: dotnet csharp
---

.NET Core/.NET Framework 的 `System.Reflection.Emit` 命名空间为我们提供了动态生成 IL 代码的能力。利用这项能力，我们能够在运行时生成一段代码/一个方法/一个类/一个程序集。

本文将介绍使用 Emit 生成 IL 代码的方法，以及在此过程中可能遇到的各种问题。

---

在编写以下代码时如果遇到一些意料之外的错误，希望调试生成的 IL 代码，可以尝试阅读 [如何快速编写和调试 Emit 生成 IL 的代码](/post/how-to-quickly-write-emit-code.html) 了解如何调试和解决。

<div id="toc"></div>

用 Emit 生成 IL 代码时，很多我们写 C# 时不会注意到的问题现在都需要开始留意。

在阅读本文之前，希望统一一个平时可能不太留意的英文：

- 形参：parameter
- 实参：argument

如果不了解它们之间的区别，请自行搜索。

### 定义方法签名

在 IL 中，方法名称可以使用比 C# 更多的字符，例如“<”和“>”，这也是 C# 编译闭包时喜欢使用的字符。目前我还没有找到 IL 中哪些字符可以作为标识符名称，但从混淆工具来看，是比 C# 多得多的。

如果你试图生成实例方法，那么实例本身 `this` 将成为第一个参数，不过并不需要额外将它定义到参数列表中。

当然，如果是静态方法，我们能够自己指定一个 `this` 参数，不过没有实际的意义。

```csharp
var method = new DynamicMethod("<MethodName>",
    typeof(void), new[] { typeof(object), typeof(object) });
method.DefineParameter(1, ParameterAttributes.None, "this");
method.DefineParameter(2, ParameterAttributes.None, "value");
```

如果不声明形参，那么生成的 IL 代码的函数将无法被正常调用（提示可能造成运行时的不稳定）。

### 声明和初始化局部变量

平时写 C# 的时候，可能一个方法里面没有定义任何一个局部变量，但 IL 可不一定这么认为。

例如：

```csharp
int a = 0;
if (value.GetType() == typeof(string))
{
}
else
{
}
```

实际上，在 IL 中，除了 `Int32` 类型的 `a` 之外，还会额外定义一个 `bool` 类型的局部变量 `V_1`。在 `value.GetType() == typeof(string)` 执行完后，其值将存入 `V_1`。

所以，如果需要编写 Emit 生成代码的代码，需要注意这些隐式产生的局部变量，它们需要和普通变量一样被初始化。

Emit 代码为：

```csharp
// 这就声明了两个局部变量。
il.DeclareLocal(typeof(int));
il.DeclareLocal(typeof(bool));
```

### 定义标签

如果代码中存在非线性结构，例如 `if`-`else`，那么 IL 就需要知道跳转的地址。那么如何能够知道跳转到哪个地址呢？

——**使用标签**。

对 `if`-`else` 来说，`if` 操作需要知道 `else` 的起始地址；对于 `if` 内部的结尾来说，需要知道整个 `if`-`else` 结束之后的第一个操作的地址。

```csharp
var startOfElse = il.DefineLabel();
var endOfWholeIfElse = il.DefineLabel();

il.Emit(OpCodes.Nop);
// 其他生成代码。
// 如果 if 条件不满足，跳转到 startOfElse。
il.Emit(OpCodes.Brfalse_S, startOfElse);
// 其他生成代码。
// 在 if 结束之后，跳转到 endOfWholeIfElse 地址。
il.Emit(OpCodes.Br_S, endOfWholeIfElse);
// 其他生成代码。
// 假设这里到了 else 的开头了，于是将 startOfElse 进行标记。标记完紧跟着写 else 部分的代码。
il.MarkLabel(startOfElse);
il.Emit(OpCodes.Nop);
// 其他生成代码。
// 假设这里整个 if-else 结束了，于是将 endOfWholeIfElse 进行标记。
il.MarkLabel(endOfWholeIfElse);
```

---

#### 参考资料

+ 生成方法签名与元数据
    - [ParameterBuilder Class (System.Reflection.Emit)](https://msdn.microsoft.com/en-us/library/system.reflection.emit.parameterbuilder(v=vs.110).aspx)
    - [MethodBuilder.DefineParameter Method (Int32, ParameterAttributes, String) (System.Reflection.Emit)](https://msdn.microsoft.com/en-us/library/system.reflection.emit.methodbuilder.defineparameter(v=vs.110).aspx)
    - [Defining a Parameter with Reflection Emit](https://msdn.microsoft.com/en-us/library/9zksbcwc(v=vs.100).aspx)
    - [c# - How to set ".maxstack" with ILGenerator - Stack Overflow](https://stackoverflow.com/questions/33656409/how-to-set-maxstack-with-ilgenerator?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa)
+ 生成方法体
    - [ILGenerator.DefineLabel Method (System.Reflection.Emit)](https://msdn.microsoft.com/en-us/library/system.reflection.emit.ilgenerator.definelabel(v=vs.110).aspx)
    - [ILGenerator.MarkLabel Method (Label) (System.Reflection.Emit)](https://msdn.microsoft.com/en-us/library/system.reflection.emit.ilgenerator.marklabel(v=vs.110).aspx)
    - [c# - Emit local variable and assign a value to it - Stack Overflow](https://stackoverflow.com/questions/15278566/emit-local-variable-and-assign-a-value-to-it?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa)
    - [C# reflection: If ... else? - Stack Overflow](https://stackoverflow.com/questions/11139241/c-sharp-reflection-if-else?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa)
