---
title: "从 “x is null 和 x == null” 的区别看 C# 7 模式匹配中常量和 null 的匹配"
publishDate: 2017-11-06 23:24:52 +0800
date: 2019-02-11 16:48:45 +0800
categories: csharp msil dotnet decompile
---

尝试过写 `if (x is null)`？它与 `if (x == null)` 相比，孰优孰劣呢？

`x is null` 还有 `x is constant` 是 C# 7.0 中引入的模式匹配（Pattern Matching）中的一个小细节。阅读本文将了解 `x is constant` 和 `x == constant` 之间的差别，并给出一些代码编写建议。

---

<p id="toc"></p>

---

## 🤓 C# 7 的模式匹配

说到 C# 中新增的模式匹配，想必大家一定不会忘了变量的匹配。以下例子来自于微软官方 C# 7.0 的介绍文档 [What's New in C# 7 - C# Guide - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-7?wt.mc_id=MVP)：

```csharp
public static int DiceSum2(IEnumerable<object> values)
{
    var sum = 0;
    foreach(var item in values)
    {
        if (item is int val)
            sum += val;
        else if (item is IEnumerable<object> subList)
            sum += DiceSum2(subList);
    }
    return sum;
}
```

```csharp
public static int DiceSum3(IEnumerable<object> values)
{
    var sum = 0;
    foreach (var item in values)
    {
        switch (item)
        {
            case int val:
                sum += val;
                break;
            case IEnumerable<object> subList:
                sum += DiceSum3(subList);
                break;
        }
    }
    return sum;
}
```

其实，官方文档中也顺带提及了常量的匹配：

```csharp
public static int DiceSum5(IEnumerable<object> values)
{
    var sum = 0;
    foreach (var item in values)
    {
        switch (item)
        {
            case 0:
                break;
            case int val:
                sum += val;
                break;
            case PercentileDie die:
                sum += die.Multiplier * die.Value;
                break;
            case IEnumerable<object> subList when subList.Any():
                sum += DiceSum5(subList);
                break;
            case IEnumerable<object> subList:
                break;
            case null:
                break;
            default:
                throw new InvalidOperationException("unknown item type");
        }
    }
    return sum;
}
```

然而，微软居然只在 `switch-case` 里面说了常量的匹配，而且 `case 0`、`case null` 这不本来就是我们以前熟悉的写法吗！（只不过以前只能判断一个类型的常量）

---

## 🤔 `x is null` Vs. `x == null`

好了，回到正题。我们想说的是 `x is null` 和 `x == null`。为了得知它们的区别，我们写一段代码：

```csharp
private void TestInWalterlvDemo(object value)
{
    if (value is null)
    {
    }
    if (value == null)
    {
    }
}
```

反编译看看：

```nasm
.method private hidebysig instance void 
    TestInWalterlvDemo(
      object 'value'
    ) cil managed 
{
    .maxstack 2
    .locals init (
      [0] bool V_0,
      [1] bool V_1
    )

    // [37 9 - 37 10]
    IL_0000: nop          

    // [38 13 - 38 31]
    IL_0001: ldarg.1      // 'value'
    IL_0002: ldnull       
    IL_0003: ceq          
    IL_0005: stloc.0      // V_0

    IL_0006: ldloc.0      // V_0
    IL_0007: brfalse.s    IL_000b

    // [39 13 - 39 14]
    IL_0009: nop          

    // [40 13 - 40 14]
    IL_000a: nop          

    // [41 13 - 41 31]
    IL_000b: ldarg.1      // 'value'
    IL_000c: ldnull       
    IL_000d: ceq          
    IL_000f: stloc.1      // V_1

    IL_0010: ldloc.1      // V_1
    IL_0011: brfalse.s    IL_0015

    // [42 13 - 42 14]
    IL_0013: nop          

    // [43 13 - 43 14]
    IL_0014: nop          

    // [44 9 - 44 10]
    IL_0015: ret          

} // end of method MainPage::Test
```

`x is null` 对应的是：

```nasm
IL_0001: ldarg.1      // 'value'
IL_0002: ldnull       
IL_0003: ceq          
IL_0005: stloc.0      // V_0
```

先 `ldarg.1` 将第 1 号参数压到评估栈（为什么不是第 0 号？因为第 0 号是 `this`）。然后将 `ldnull` 将 `null` 压到评估栈上。随后，`ceq` 比较压入的两个值是否相等。*（注意是比较栈中的值哦，不会看引用的对象的！所以如果是引用类型，则比较的是引用本身哦，类似于指针！）* **此处划重点，因为考试要考！**咳咳……哦不，是后面要用到……

`x == null` 对应的是：

```nasm
IL_000b: ldarg.1      // 'value'
IL_000c: ldnull       
IL_000d: ceq          
IL_000f: stloc.1      // V_1
```

于是发现两个完全一样！！！-_- 本文完，全剧终。

---

## 😏 `x is 常量` Vs. `x == 常量`

如果只是像上面那样，那这篇文章也太没营养了！现在我们把 `null` 换成其它常量：

```csharp
private void TestInWalterlvDemo(object value)
{
    if (value is 1)
    {
    }
    if (value == 1)
    {
    }
}
```

😲呀……编译不通过！改改……

```csharp
private void TestInWalterlvDemo(object value)
{
    if (value is 1)
    {
    }
    if (value == (object) 1)
    {
    }
}
```

于是再看看反编译出来的结果。

`value is 1`：

```nasm
IL_0001: ldc.i4.1     
IL_0002: box          [mscorlib]System.Int32
IL_0007: ldarg.1      // 'value'
IL_0008: call         bool [mscorlib]System.Object::Equals(object, object)
IL_000d: stloc.0      // V_0
```

`value == (object) 1`：

```nasm
IL_0013: ldarg.1      // 'value'
IL_0014: ldc.i4.1     
IL_0015: box          [mscorlib]System.Int32
IL_001a: ceq          
IL_001c: stloc.1      // V_1
```

现在已经不一样了，前者再比较时用的是 `call`，调用了 `bool [mscorlib]System.Object::Equals(object, object)` 方法；而后者依然用的是 `ceq`。

区别已经很明显了，前者会根据具体类型具体判断相等，也就是说引用类型会调用引用类型自己的方法判断相等，值类型也会调用值类型的方法判断相等。而后者依然是比较评估栈中的两个值是否相等。关键是这两者均出现了装箱！也就是说——因为装箱的存在，对后者而言，`ceq` 会压入 `0`，即永远返回 `false`，这就是 BUG 所在。这就是不一样的地方！

## 🧐如果重写了 `==` 或者 `Equals` 呢？

```csharp
using System;

namespace Walterlv.EqualsTest
{
    class Program
    {
        static void Main(string[] args)
        {
            var foo = new Foo();
            Console.WriteLine(foo == null);
            Console.WriteLine(foo.Equals(null));
            Console.WriteLine(foo is null);
            Console.WriteLine(Equals(foo, null));
            Console.ReadLine();
        }
    }

    public class Foo
    {
        public override bool Equals(object obj)
        {
            return true;
        }

        public static bool operator ==(Foo left, Foo right)
        {
            return true;
        }

        public static bool operator !=(Foo left, Foo right)
        {
            return !(left == right);
        }
    }
}
```

这段代码的执行结果是：

```text
True
True
False
False
```

他们的 IL 代码如下。可以看到 `==` 和 `Equals` 会调用重载的运算符和方法；而使用 `is` 判断和前面是一样的，不受重载影响，可以和 `Object` 的 `Equals` 静态方法一样正常完成判空。

```nasm
// foo == null
IL_0005: dup
IL_0006: ldnull
IL_0007: call         bool Walterlv.EqualsTest.Foo::op_Equality(class Walterlv.EqualsTest.Foo, class Walterlv.EqualsTest.Foo)
IL_000c: call         void [System.Console]System.Console::WriteLine(bool)

// foo.Equals(null)
IL_0011: dup
IL_0012: ldnull
IL_0013: callvirt     instance bool [System.Runtime]System.Object::Equals(object)
IL_0018: call         void [System.Console]System.Console::WriteLine(bool)

// foo is null
IL_001d: dup
IL_001e: ldnull
IL_001f: ceq
IL_0021: call         void [System.Console]System.Console::WriteLine(bool)

// Equals(foo, null)
IL_0026: ldnull
IL_0027: call         bool [System.Runtime]System.Object::Equals(object, object)
IL_002c: call         void [System.Console]System.Console::WriteLine(bool)
```

你可以阅读 [Object.Equals Method (System) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/system.object.equals) 了解到静态 `Equals` 方法的实现。

---

## 回顾模式匹配中的常量匹配

在 C# 7 的模式匹配中，`null` 和常量其实都一样是常量，本来都是会调用 `Object.Equals(object, object)` 静态方法进行比较的；但 `null` 因为其特殊性，被编译器优化掉了，于是 `x is null` 和 `x == null` 完全一样；`x is constant` 和 `x == constant` 依然有区别。

从反编译的 MSIL 代码中我们也可以得出一些代码编写上的建议。在比较常量的时候，如果可能，尽量使用 `is` 进行比较，而不是 `==`。好处多多：

- 如果是 `null`，写 `x is null` 很符合英语的阅读习惯，代码阅读起来比较舒适。
- 如果是值常量，可以避免装箱带来的相等判断错误问题

---

**参考资料**
- [What's New in C# 7 - C# Guide - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/whats-new/csharp-7?wt.mc_id=MVP)
- [Dissecting the pattern matching in C# 7 – Dissecting the code](https://blogs.msdn.microsoft.com/seteplia/2017/10/16/dissecting-the-pattern-matching-in-c-7/)
- [c# - What is the difference between "x is null" and "x == null"? - Stack Overflow](https://stackoverflow.com/questions/40676426/what-is-the-difference-between-x-is-null-and-x-null)
- [C# 7.0 语言新特性 - 技术翻译 - 开源中国社区](https://www.oschina.net/translate/whats-new-in-csharp-7-0)
- [OpCodes.Ceq Field (System.Reflection.Emit)](https://msdn.microsoft.com/en-us/library/system.reflection.emit.opcodes.ceq%28v=vs.110%29.aspx?f=255&MSPPError=-2147217396)
- [OpCodes.Ldarg_0 Field (System.Reflection.Emit)](https://msdn.microsoft.com/en-us/library/system.reflection.emit.opcodes.ldarg_0%28v=vs.110%29.aspx?f=255&MSPPError=-2147217396)
- [OpCodes.Stloc Field (System.Reflection.Emit)](https://msdn.microsoft.com/en-us/library/system.reflection.emit.opcodes.stloc%28v=vs.110%29.aspx?f=255&MSPPError=-2147217396)
- [OpCodes.Ldc_I4_1 Field (System.Reflection.Emit)](https://msdn.microsoft.com/en-us/library/system.reflection.emit.opcodes.ldc_i4_1%28v=vs.110%29.aspx?f=255&MSPPError=-2147217396)
