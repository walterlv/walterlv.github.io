---
title: "C# 的事件，一般你不需要担心它的线程安全问题！"
publishDate: 2021-06-18 13:45:29 +0800
date: 2021-06-18 15:42:18 +0800
tags: csharp dotnet
position: knowledge
---

时不时会有小伙伴跟我提到在 C# 写事件 `+=` `-=` 以及 `Invoke` 时可能遇到线程安全问题。然而实际上这些操作并不会有线程安全问题，所以我特别写一篇博客来说明一下，从原理层面说说为什么不会有线程安全问题。

顺便再提一下哪种情况下你却可能遇到线程安全问题。

---

<div id="toc"></div>

## 委托是不可变类型

> 委托是不可变类型。

这点很重要，这是 C# 事件一般使用场景不会发生线程安全问题的关键！

那既然委托是不可变类型，那我们在写 `+=` `-=` 以及引发事件的时候，是如何处理最新注册或注销的事件呢？

## `+=` 和 `-=` 的本质

我们随便写一个类型，里面包含一个事件：

```csharp
using System;

namespace Walterlv.TempDemo
{
    class DemoClass
    {
        public event EventHandler SomeEvent;
    }
}
```

从外表上，这个事件就像一个字段一样的不线程安全。但实际上，他像一个属性一样能处理好线程安全问题。

众所周知，这个事件会编译成以下两个方法：

- `add_SomeEvent`
- `remove_SomeEvent`

```csharp
// Methods
// Token: 0x06000001 RID: 1 RVA: 0x00002050 File Offset: 0x00000250
.method public hidebysig specialname 
    instance void add_SomeEvent (
        class [System.Runtime]System.EventHandler 'value'
    ) cil managed 
{
    .custom instance void [System.Runtime]System.Runtime.CompilerServices.CompilerGeneratedAttribute::.ctor() = (
        01 00 00 00
    )
    // Header Size: 12 bytes
    // Code Size: 41 (0x29) bytes
    // LocalVarSig Token: 0x11000001 RID: 1
    .maxstack 3
    .locals init (
        [0] class [System.Runtime]System.EventHandler,
        [1] class [System.Runtime]System.EventHandler,
        [2] class [System.Runtime]System.EventHandler
    )

    /* 0x0000025C 02           */ IL_0000: ldarg.0
    /* 0x0000025D 7B01000004   */ IL_0001: ldfld     class [System.Runtime]System.EventHandler Walterlv.TempDemo.DemoClass::SomeEvent
    /* 0x00000262 0A           */ IL_0006: stloc.0
    // loop start (head: IL_0007)
        /* 0x00000263 06           */ IL_0007: ldloc.0
        /* 0x00000264 0B           */ IL_0008: stloc.1
        /* 0x00000265 07           */ IL_0009: ldloc.1
        /* 0x00000266 03           */ IL_000A: ldarg.1
        /* 0x00000267 280D00000A   */ IL_000B: call      class [System.Runtime]System.Delegate [System.Runtime]System.Delegate::Combine(class [System.Runtime]System.Delegate, class [System.Runtime]System.Delegate)
        /* 0x0000026C 740D000001   */ IL_0010: castclass [System.Runtime]System.EventHandler
        /* 0x00000271 0C           */ IL_0015: stloc.2
        /* 0x00000272 02           */ IL_0016: ldarg.0
        /* 0x00000273 7C01000004   */ IL_0017: ldflda    class [System.Runtime]System.EventHandler Walterlv.TempDemo.DemoClass::SomeEvent
        /* 0x00000278 08           */ IL_001C: ldloc.2
        /* 0x00000279 07           */ IL_001D: ldloc.1
        /* 0x0000027A 280100002B   */ IL_001E: call      !!0 [System.Threading]System.Threading.Interlocked::CompareExchange<class [System.Runtime]System.EventHandler>(!!0&, !!0, !!0)
        /* 0x0000027F 0A           */ IL_0023: stloc.0
        /* 0x00000280 06           */ IL_0024: ldloc.0
        /* 0x00000281 07           */ IL_0025: ldloc.1
        /* 0x00000282 33DF         */ IL_0026: bne.un.s  IL_0007
    // end loop
    /* 0x00000284 2A           */ IL_0028: ret
} // end of method DemoClass::add_SomeEvent

// Token: 0x06000002 RID: 2 RVA: 0x00002088 File Offset: 0x00000288
.method public hidebysig specialname 
    instance void remove_SomeEvent (
        class [System.Runtime]System.EventHandler 'value'
    ) cil managed 
{
    .custom instance void [System.Runtime]System.Runtime.CompilerServices.CompilerGeneratedAttribute::.ctor() = (
        01 00 00 00
    )
    // Header Size: 12 bytes
    // Code Size: 41 (0x29) bytes
    // LocalVarSig Token: 0x11000001 RID: 1
    .maxstack 3
    .locals init (
        [0] class [System.Runtime]System.EventHandler,
        [1] class [System.Runtime]System.EventHandler,
        [2] class [System.Runtime]System.EventHandler
    )

    /* 0x00000294 02           */ IL_0000: ldarg.0
    /* 0x00000295 7B01000004   */ IL_0001: ldfld     class [System.Runtime]System.EventHandler Walterlv.TempDemo.DemoClass::SomeEvent
    /* 0x0000029A 0A           */ IL_0006: stloc.0
    // loop start (head: IL_0007)
        /* 0x0000029B 06           */ IL_0007: ldloc.0
        /* 0x0000029C 0B           */ IL_0008: stloc.1
        /* 0x0000029D 07           */ IL_0009: ldloc.1
        /* 0x0000029E 03           */ IL_000A: ldarg.1
        /* 0x0000029F 280F00000A   */ IL_000B: call      class [System.Runtime]System.Delegate [System.Runtime]System.Delegate::Remove(class [System.Runtime]System.Delegate, class [System.Runtime]System.Delegate)
        /* 0x000002A4 740D000001   */ IL_0010: castclass [System.Runtime]System.EventHandler
        /* 0x000002A9 0C           */ IL_0015: stloc.2
        /* 0x000002AA 02           */ IL_0016: ldarg.0
        /* 0x000002AB 7C01000004   */ IL_0017: ldflda    class [System.Runtime]System.EventHandler Walterlv.TempDemo.DemoClass::SomeEvent
        /* 0x000002B0 08           */ IL_001C: ldloc.2
        /* 0x000002B1 07           */ IL_001D: ldloc.1
        /* 0x000002B2 280100002B   */ IL_001E: call      !!0 [System.Threading]System.Threading.Interlocked::CompareExchange<class [System.Runtime]System.EventHandler>(!!0&, !!0, !!0)
        /* 0x000002B7 0A           */ IL_0023: stloc.0
        /* 0x000002B8 06           */ IL_0024: ldloc.0
        /* 0x000002B9 07           */ IL_0025: ldloc.1
        /* 0x000002BA 33DF         */ IL_0026: bne.un.s  IL_0007
    // end loop
    /* 0x000002BC 2A           */ IL_0028: ret
} // end of method DemoClass::remove_SomeEvent
```

于是 `+=` 和 `-=` 本质上是调用了 `Delegate.Combine` 方法和 `Delegate.Remove` 方法。而 `Delegate.Combine` 和 `Delegate.Remove` 不会修改原委托，只会生成新的委托。

于是，任何时候当你拿到这个事件的一个实例，并将它存在一个变量里之后，只要不给这个变量额外赋值，这个变量包含的已注册的委托数就已经完全确定了下来。之后无论什么时候再 `+=` 或 `-=` 这个事件，已经跟这个变量无关了。

## `Delegate.Combine` 和 `Delegate.Remove`

现在让我们再来看看 `Delegate.Combine` 的实现（`Remove` 就不举例了，相反操作）。

```csharp
[return: NotNullIfNotNull("a")]
[return: NotNullIfNotNull("b")]
public static Delegate? Combine(Delegate? a, Delegate? b)
{
    if (a is null)
        return b;

    return a.CombineImpl(b);
}
```

最终调用了实例的 `CombineImpl` 方法，不过 `Delegate` 基类的 `CombineImpl` 方法没有实现（只有个异常）。

为了实现事件的 `+=` 和 `-=`，事件实际上是 `MultiCastDelegate` 类型，其实现如下：

```csharp
// This method will combine this delegate with the passed delegate
//    to form a new delegate.
protected sealed override Delegate CombineImpl(Delegate? follow)
{
    if (follow is null)
        return this;

    // Verify that the types are the same...
    if (!InternalEqualTypes(this, follow))
        throw new ArgumentException(SR.Arg_DlgtTypeMis);

    MulticastDelegate dFollow = (MulticastDelegate)follow;
    object[]? resultList;
    int followCount = 1;
    object[]? followList = dFollow._invocationList as object[];
    if (followList != null)
        followCount = (int)dFollow._invocationCount;

    int resultCount;
    if (!(_invocationList is object[] invocationList))
    {
        resultCount = 1 + followCount;
        resultList = new object[resultCount];
        resultList[0] = this;
        if (followList == null)
        {
            resultList[1] = dFollow;
        }
        else
        {
            for (int i = 0; i < followCount; i++)
                resultList[1 + i] = followList[i];
        }
        return NewMulticastDelegate(resultList, resultCount);
    }
    else
    {
        int invocationCount = (int)_invocationCount;
        resultCount = invocationCount + followCount;
        resultList = null;
        if (resultCount <= invocationList.Length)
        {
            resultList = invocationList;
            if (followList == null)
            {
                if (!TrySetSlot(resultList, invocationCount, dFollow))
                    resultList = null;
            }
            else
            {
                for (int i = 0; i < followCount; i++)
                {
                    if (!TrySetSlot(resultList, invocationCount + i, followList[i]))
                    {
                        resultList = null;
                        break;
                    }
                }
            }
        }

        if (resultList == null)
        {
            int allocCount = invocationList.Length;
            while (allocCount < resultCount)
                allocCount *= 2;

            resultList = new object[allocCount];

            for (int i = 0; i < invocationCount; i++)
                resultList[i] = invocationList[i];

            if (followList == null)
            {
                resultList[invocationCount] = dFollow;
            }
            else
            {
                for (int i = 0; i < followCount; i++)
                    resultList[invocationCount + i] = followList[i];
            }
        }
        return NewMulticastDelegate(resultList, resultCount, true);
    }
}
```

计算好新委托所需的委托列表和个数后，创建一个新的委托实例，然后用计算所得的结果初始化它。这座实了委托不变，于是不存在线程安全问题。

## 线程安全的事件引发

从 C# 6.0 开始，大家引发事件都喜欢使用下面这样的方式：

```csharp
SomeEvent?.Invoke(this, EventArgs.Empty);
```

不用担心，这就是线程安全的写法！

以上这个写法是空传递写法，相当于：

```csharp
var handler = SomeEvent;
if (handler != null)
{
    handler.Invoke(this, EventArgs.Empty);
}
```

我们前面已经通过原理证实了“委托不变”，所以这里我们用变量存这个事件的时候，这个变量就完全确认了此时此刻已经注册的所有委托，后面的判空和引发都不会受与之发生在同一时刻的 `+=` 和 `-=` 的影响。

有人说以上写法有可能会被编译器优化掉（《CLR via C#》说的），造成意料之外的线程安全问题，于是推荐写成下面这样：

```csharp
var handler = Volatile.Read(ref SomeEvent);
if (handler != null)
{
    handler.Invoke(this, EventArgs.Empty);
}
```

这样写当然是没有问题的。可是这样就没有 C#6.0 带来的一句话写下来的畅快感了！实际上，你根本无需担心编译器会对你引发事件带来线程不安全的优化，因为现在的 C# 编译器和 .NET 运行时很聪明，非常清楚你是在引发事件，于是不会随便优化掉你这里的逻辑。

归根结底，只需要用 C# 6.0 的空传递操作符写引发事件就没有问题了。

## 是否可能出现线程不安全的情况呢？

从前面原理层面的剖析，我们可以明确知道，普通的事件 `+=`、`-=` 和引发是不会产生线程安全问题的；但这不代表任何情况你都不会遇到线程安全问题。

如果你引发事件的代码逻辑比较复杂，涉及到多次读取事件成员（例如前面例子中的 `SomeEvent`），那么依然会出现线程安全问题，因为你无法保证两次读取事件成员时，期间没有发生过事件的 `+=` 和 `-=`。

## 关于 `+=` `-=` 的额外说明

在上文写完之后，有小伙伴说，C# 里面 `+=` `-=` 不是线程安全的，并举了以下例子：

```csharp
private int _value;

public void AddValue(int i)
{
    _value += i;
}
```

当并发调用 `AddValue` 时，可能导致部分调用的结果被另一部分覆盖，从而出现线程安全问题。

因为 `_value += i` 这个语法糖相当于以下句子：

```csharp
var temp = _value + i;
_value = temp;
```

然而，事件没有这样的问题，因为事件的 `+=` 语法糖相当于以下句子：

```csharp
// demo.SomeEvent += DemoClass_SomeEvent;
// 相当于：
demo.add_SomeEvent(new EventHandler(DemoClass_SomeEvent));
```

注意这是一次函数调用，并没有像普通的数值运算一样执行两步计算；所以至少这一次方法调用不会有问题。

那么，`add_SomeEvent` 里面是线程安全的吗？如果只是单纯 `Delegate.Combine` 然后赋值当然不是线程安全，但它不是简单赋值，而是通过 `Interlocked.CompareExchange` 原子操作赋值，在保证线程安全的同时还确保了性能：

```csharp
/* 0x000002B2 280100002B   */ IL_001E: call      !!0 [System.Threading]System.Threading.Interlocked::CompareExchange<class [System.Runtime]System.EventHandler>(!!0&, !!0, !!0)
```

转换成容易理解的 C# 代码大约是这样：

```csharp
while (true)
{
    var originalValue = _value;
    var value = originalValue + add;
    var resultValue = Interlocked.CompareExchange(ref _value, value, originalValue);
    if (resultValue == value)
    {
        break;
    }
}
```

1. 当 `CompareExchange` 的返回值与第三个参数相同，说明本次原子操作成功完成，那么赋值有效，退出循环。
2. 当 `CompareExchange` 的返回值与第三个参数不同，说明本次原子操作冲突，在下一次循环中重试赋值。
3. 因为赋值是很迅速的，所以即使大量并发，也只会有少数冲突，整体是非常快的。

完整的 IL 代码可以在本文前面看到。这里的 !!0 是引用第 0 号泛型类型，即找到 `CompareExchange(!!T$, !!T, !!T):!!T` 重载。
