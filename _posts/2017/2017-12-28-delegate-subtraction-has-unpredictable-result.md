---
title: "为什么委托的减法（- 或 -=）可能出现非预期的结果？（Delegate Subtraction Has Unpredictable Result）"
date: 2017-12-28 10:03:44 +0800
tags: csharp dotnet
coverImage: /static/posts/2017-12-28-08-51-19.png
permalink: /posts/delegate-subtraction-has-unpredictable-result.html
---

当我们为一个委托写 `-=` 的时候，ReSharper 会提示“Delegate Subtraction Has Unpredictable Result”，即“委托的减法可能出现非预期的结果”。然而在写为事件写 `-=` 的时候却并没有这样的提示。然而这个提示是什么意思呢？为什么会“非预期”？为什么委托会提示而事件不会提示？

阅读本文将了解委托的减法。

---

![委托的减法提示](/static/posts/2017-12-28-08-51-19.png)  
▲ 委托的减法可能出现非预期的结果

<p id="toc"></p>

## ReSharper 的官方帮助文档

### 例子和现象

从 ReSharper 的提示中，我们可以跳转到官方帮助文档 [Code Inspection: Delegate subtractions - Help - ReSharper](https://www.jetbrains.com/help/resharper/2017.3/DelegateSubtraction.html)。

![进入 ReSharper 官方帮助文档](/static/posts/2017-12-28-08-54-41.png)

官方文档中给出了一个非常典型的 Demo 程序：

> ```csharp
> static void Main()
> {
>     Action a = () => Console.Write("A");
>     Action b = () => Console.Write("B");
>     Action c = () => Console.Write("C");
>     Action s = a + b + c + Console.WriteLine;
>     s();                  //ABC
>     (s - a)();            //BC
>     (s - b)();            //AC
>     (s - c)();            //AB
>     (s - (a + b))();      //C
>     (s - (b + c))();      //A
>     (s - (a + c))();      //ABC
> }
> ```

关键就在最后一行的输出结果。由于 `s` 等于 `a + b + c`，`s - (a + c)` 却依然输出 `ABC`，而不是前面例子中就像数学加减法一样的输出。

ReSharper 同时还给出另一个例子，说明委托的减法顺序也可能非预期：

> ```csharp
> s = a + b + a;
> (s - a)();            // AB
> ```

它会从尾部减起，而这一点也容易被大家忽视。

### 原理

究其原因，ReSharper 官方文档也已说明。因为委托保存了一个调用列表，委托的 `a + b`，是将 `b` 的调用列表追加到 `a` 的调用列表之后；而委托的 `a - b` 是从 `a` 的调用列表中移除 `b` 的调用列表子序列。

也就是说，**委托的加减其实就是委托调用列表中序列的拼接和子序列的移除**。

用图来表示这个调用列表的加减过程，可以画成这样。其中 `a`, `b` 是委托，`x`, `y`, `z`, `w` 是调用列表中的每一项。

![调用列表的加减](/static/posts/2017-12-28-09-41-51.png)  
▲ 调用列表的加减其实就是序列的拼接和子序列的移除

## 将委托和事件比较

既然 ReSharper 对委托做出了这样的提示，而事件几乎就是委托的封装，那为何事件不给出提示呢？！

带着疑问，我将 ReSharper 官方例子中的 `s` 改成了事件，其他代码完全一样。

```csharp
private static event Action s;

static void Main()
{
    Action a = () => Console.Write("A");
    Action b = () => Console.Write("B");
    Action c = () => Console.Write("C");
    // 这一句注释掉，因为 s 换成了事件，而事件必须定义在类中。
    // Action s = a + b + c + Console.WriteLine;
    s();                  //ABC
    (s - a)();            //BC
    (s - b)();            //AC
    (s - c)();            //AB
    (s - (a + b))();      //C
    (s - (b + c))();      //A
    (s - (a + c))();      //ABC
}
```

后面用于代表输出结果的注释我依然没改，因为**输出结果真的没变**！！！也就是说，理论上使用事件并不能帮助减少委托减法带来的结果不确定性。

但是——事件是观察者模式的一种实现，从设计上说，事件只作通知之用，不确保顺序，也不保证结果。在这个角度上说，如果依然用事件写出上面 demo 那样的“*不可预期*”代码，那简直不把事件当事件用。

## 不再用委托减法了吗？

至少从设计模式上说，事件里委托减法的的那些非预期就忽略吧，那么没有定义成事件的那些委托呢？我们需要如何处理减法？

其实，大可不必太担心，因为大多数场合下我们进行委托加法和减法时，都是用一个包含调用列表的委托与其它只有一个调用节点的委托进行加减，通常结果都是符合预期的，也通常不会对顺序敏感。但是，如果委托的减法是库 API 的一部分，那就需要小心，因为库的使用者可能写出任何一种诡异的代码！这种情况下，换成事件是一个不错的选择。

---

**参考资料**

- [Code Inspection: Delegate subtractions - Help - ReSharper](https://www.jetbrains.com/help/resharper/2017.3/DelegateSubtraction.html)
- [events - "Delegate subtraction has unpredictable result" in ReSharper/C#? - Stack Overflow](https://stackoverflow.com/questions/11180068/delegate-subtraction-has-unpredictable-result-in-resharper-c)


