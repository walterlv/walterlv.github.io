---
title: ".NET/C# 避免调试器不小心提前计算本应延迟计算的值"
date: 2019-05-28 18:51:13 +0800
tags: dotnet csharp
position: problem
permalink: /post/avoid-value-been-evaluated-by-debugger.html
---

延迟计算属性的值，应该很多小伙伴都经常使用。比如在属性的 `get` 方法中判断是否已初始化，如果没有初始化则立即开始初始化。

但这样的写法存在一个很大的问题——如果你使用 Visual Studio 调试，当你把鼠标划到对象的实例上的时候，属性就会立刻开始进行初始化。而此时对你的代码来说可能就过早初始化了。我们不应该让调试器非预期地影响到我们程序的执行结果。

本文介绍如何避免调试器不小心提前计算本应延迟计算的值。

---

方法是在属性上添加一个特性 `DebuggerBrowsableAttribute`。

```csharp
private Walterlv _foo;

[DebuggerBrowsable(DebuggerBrowsableState.Never)]
public Walterlv Walterlv => _foo ?? (_foo = new Walterlv());

public bool IsInitialized => !(_foo is null);
```

当指定为不再显示的话，在调试器中查看此实例的属性的时候就看不到这个属性了，也就不会因为鼠标划过导致提前计算了值。

当然，如果你希望为你的类型定制更多的调试器显示方式，可以参考我的另一篇博客：

- [C#/.NET 调试的时候显示自定义的调试信息（DebuggerDisplay 和 DebuggerTypeProxy） - walterlv](/post/display-instance-info-in-custom-debugger-view)

---

**参考资料**

- [Lazy.cs](https://referencesource.microsoft.com/#mscorlib/system/Lazy.cs,5379c104fa6e2022)

