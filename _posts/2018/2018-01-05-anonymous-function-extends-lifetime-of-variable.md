---
title: "C#/.NET 匿名函数会捕获变量，并延长对象的生命周期"
publishDate: 2018-01-05 09:26:40 +0800
date: 2018-12-14 09:54:00 +0800
categories: csharp dotnet
---

小伙伴在一次垃圾回收中，发现对象并没有被回收掉，而注释掉一句代码后它便能够回收。

这究竟是为什么？

---

不关心探索过程的就直接拉到最后看结论吧！

<p id="toc"></p>

## 探索

测试代码是这样的：

```csharp
private void OnLoaded(object sender, RoutedEventArgs e)
{
    var variable = new MainPage();
    var reference = new WeakReference<MainPage>(variable);
    variable = null;
    GC.Collect();
    Console.WriteLine($"{reference.TryGetTarget(out var target)}: {target}");
    DoSomething(x => DoAnotherThing(x));
}
```

需要验证的是 `MainPage` 对象是否被回收。然而在这段代码中，`MainPage` 并没有被回收；然而去掉最后一行，`MainPage` 便可以正常回收。**关键是，即便是在 Console.WriteLine 上打下断点，让代码永远不会执行到最后一句，也不会改变回收的结果。**

由于 `DoSomething` 中的委托参数恰好就是 `MainPage` 类型的，不禁让人觉得可能是此函数做了一些奇怪的事情。然而毕竟参数中传入的委托参数只是形参，理论上不应该影响到外部对象的回收。那么影响的只可能是变量的捕获了。

于是，我们将最后一行换成别的函数别的参数：

```csharp
DoSomething(null);
```

或者将整个这一句提取成新的函数：

```csharp
private void OnLoaded(object sender, RoutedEventArgs e)
{
    // 省略前面的代码。
    ExtractedMethod();
}

private void ExtractedMethod()
{
    DoSomething(x => DoAnotherThing(x));
}
```

那么，回收就会正常进行。

现在，不执行这个*受争议的*函数了，我们使用空的匿名函数。

```csharp
private void OnLoaded(object sender, RoutedEventArgs e)
{
    var variable = new MainPage();
    var reference = new WeakReference<MainPage>(variable);
    variable = null;
    GC.Collect();
    Console.WriteLine($"{reference.TryGetTarget(out var target)}: {target}");
    Dispatcher.InvokeAsync(() => { });
}
```

一样会导致不回收。

## 结论

在微软官方的《C# 规范 5.0》（[点此下载](http://www.microsoft.com/en-us/download/details.aspx?id=7029)）的第 7.15.5.1 章节中有说到：

> When an outer variable is referenced by an anonymous function, the outer variable is said to have been captured by the anonymous function. Ordinarily, the lifetime of a local variable is limited to execution of the block or statement with which it is associated (§5.1.7). However, the lifetime of a captured outer variable is extended at least until the delegate or expression tree created from the anonymous function becomes eligible for garbage collection.

![章节](/static/posts/2018-01-05-09-48-13.png)

匿名函数会**捕获当前上下文的局部变量，延长对象的生命周期；直到此委托或表达式树被回收掉。**

也就是说，只要某个方法中存在没有被回收的匿名函数/lambda 表达式/表达式树，那么当前上下文的对象直到这些匿名函数被回收之前都不会被回收，即便已经设为了 null。

---

**参考资料**

- [c# - .NET Do lambdas prevent garbage collection of external references used in them? - Stack Overflow](https://stackoverflow.com/a/31729713/6233938)
- [C# Language Specification 5.0](http://www.c-sharpcorner.com/ebooks/csharp-language-specification_5)
- [C# 6.0 draft Language Specification - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/language-specification/?wt.mc_id=MVP)
