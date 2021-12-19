---
title: ".NET/C# 使用反射调用含 ref 或 out 参数的方法"
date: 2018-09-02 14:59:00 +0800
tags: dotnet csharp
permalink: /post/handle-ref-or-out-arguments-using-reflection.html
---

使用反射，我们可以很容易地在运行时调用一些编译时无法确定的属性、方法等。然而，如果方法的参数中包含 `ref` 或 `out` 关键字的时候，又该怎么调用呢？

本文将介绍如何反射调用含 `ref` 或 `out` 关键字的方法。

---

比如我们有这样的类型：

```csharp
public class Walterlv
{
    public string Get(string key)
    {
    }
}
```

那么反射的时候可以使用：

```csharp
var walterlv = new Walterlv();
var value = (string) typeof(Walterlv).GetMethod("Get").Invoke(walterlv, new object[] { "key" });
```

然而现在我们的函数是这样的，带一个 `out` 关键字的参数：

```csharp
public class Walterlv
{
    public bool TryGet(string key, out string value)
    {
    }
}
```

事实上，无论是什么样的方法，在反射式调用的都是同一个方法，即 `Invoke`。

对于 `out` 和 `ref` 关键字的方法来说，会更新传入的数组，也就是 `Invoke` 最后传入的那个参数。所以其实我们只需要保存那个数组的实例，在调用完毕之后便能重新取出被修改的参数了。

```csharp
var walterlv = new Walterlv();
var args = new object[] { "key", null };
var value = (string) typeof(Walterlv).GetMethod("Get").Invoke(walterlv, args);
// 在这里可以从 args 里面取出被 ref 或者 out 修改的参数。
```

---

**参考资料**

- [out, ref and InvokeMember !!! - CodeProject](https://www.codeproject.com/Articles/97728/out-ref-and-InvokeMember)
- [c# - How to pass a parameter as a reference with MethodInfo.Invoke - Stack Overflow](https://stackoverflow.com/q/8779731/6233938)

