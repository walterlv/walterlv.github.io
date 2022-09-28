---
title: "CS8350：不允许使用“Foo(ref x, ref y)”的这种参数组合，因为它可能会在其声明范围之外公开由参数 x 引用的变量"
date: 2022-09-28 12:40:45 +0800
categories: csharp dotnet
position: problem
coverImage: /static/posts/2022-09-28-12-40-30.png
---

标题所述的是一个 .NET/C# 程序的编译错误。这个编译错误是 C#7.2 时就引入的，但更新到 Visual Studio 2022（17.4） 后，有更多的情况会被判定为发生了此错误。

本文会解释这个错误的原因和解决办法。

---

<div id="toc"></div>

## 新引入的 CS8350 编译错误

以下这段代码，在 Visual Studio 2022（17.4）版本中会出现编译错误 CS8350，但在低版本的 Visual Studio 中则可以正常编译通过。

```csharp
var i = 0;
var b = new Bar();
Foo(ref i, ref b);

static void Foo(ref int i, ref Bar bar)
{
}

public ref struct Bar
{
}
```

错误为：

> CS8350：不允许使用“Foo(ref a, ref b)”的这种参数组合，因为它可能会在其声明范围之外公开由参数 a 引用的变量
> CS8350: This combination of arguments to is disallowed because it may expose variables referenced by parameter outside of their declaration scope.

![新引入的 CS8350 错误](/static/posts/2022-09-28-12-40-30.png)

如果单看以上示例看不出这个报错的原因的话，我们可以去看看 CS8350 官方报错的典型情况。

### CS8350 错误的典型情况

实际上，在 C# 7.2 刚引入时，这个编译错误就已经存在了。比如以下代码就会报 CS8350 错误：

```csharp
// 此代码示例来自于微软官方 C#7.2 对 CS8350 的解释文档：
// https://github.com/dotnet/csharplang/blob/main/proposals/csharp-7.2/span-safety.md#method-arguments-must-match
void M1(ref Span<int> s1)
{
    Span<int> s2 = stackalloc int[1];
    Swap(ref s1, ref s2);
}

void Swap(ref Span<int> x, ref Span<int> y)
{
    // 经过以下赋值后，M1 方法内定义的 s2 变量将在 M1 方法出栈后仍被引用。
    // 用官方的说法，仅在 M1 方法内定义的局部变量 s2 将逃逸到 M1 方法外部。
    ref x = ref y;
}
```

在以上代码中，`M1` 方法接受传入的局部引用变量 `s1`，并在方法内部创建一个新的局部引用变量 `s2`。在 `M1` 方法中随后调用了 `Swap` 方法，而 `Swap` 方法将 `s1` 的引用换成了 `s2` 的引用。于是 `s1` 现在将引用 `M1` 方法内的一个局部变量。然而，当 `M1` 方法返回后，`s1` 却不会出栈（因为它不是 `M1` 中定义的局部变量）。所以调用 `M1` 方法的另一个方法将获取一个已被出栈的方法内的局部变量，换句话说，局部引用变量 `s2` 逃逸到了 `M1` 方法的外部。这在 C# 的安全代码块中显然是不被允许的。

```csharp
ref struct S
{
    public Span<int> Span;

    public void Set(Span<int> span)
    {
        Span = span;
    }
}

void Broken(ref S s)
{
    Span<int> span = stackalloc int[1];

    // 这会将此方法内定义的局部变量 span 被 S 的实例引用。
    // 于是，当此方法执行完成并出栈后，方法内的局部变量仍然被引用。
    s.Set(span); 
}
```

在以上方法中，`Broken` 方法接受传入的局部引用变量 `s`，并在方法内部创建一个新的局部变量 `span`。在 `Broken` 方法调用了 `s.Set(span)` 后，局部变量 `span` 的引用将被储存到 `s` 的内部。当 `Broken` 方法退出后，局部变量 `span` 已被出栈却仍能被 `s` 调用。这会出现明显的安全漏洞。

要解决这个问题，应该把 `S` 设计成 `readonly` 的（如 `readonly ref struct S`），把 `Broken` 的 `ref` 改为 `in`；这样，`s` 将无法储存可能被出栈的变量。

总结一下 CS8350 的产生原因：

1. 两个栈中的引用变量有不同的生命周期；
2. 这两个不同生命周期的变量以引用的方式传给同一个方法。

## 回到 Visual Studio 2022（17.4）

现在，我们重新审视本文开头引入的那段代码：

```csharp
var i = 0;
var b = new Bar();
Foo(ref i, ref b);

static void Foo(ref int i, ref Bar bar)
{
}

public ref struct Bar
{
}
```

按照我们总结的原因，这段代码其实并不会产生安全问题，因此本不应该会报 CS8350 错误。

但是，我们忽略了另一个问题——目前所有变量的生命周期都是从声明中推断出来的。仅凭目前的语法功能集，C# 无法完全推断所有变量的生命周期。按照 C# 官方开发人员的说法，要做到完全推断，需要扩展 C# 的功能，例如声明一个参数不允许逃逸出这个方法。

关于这个问题的具体描述，可以在此问题的官方 GitHub Issue 页面看到相关人员的讨论：

- <https://github.com/dotnet/roslyn/issues/43591>

因此，目前来说，我们只能接受这种情况下报告的 CS8350 编译错误，并调整我们的代码。例如，将上述的 `Bar` 的 `ref` 去掉，或者修改代码实现，避免同时传入两个局部变量的引用。

---

**参考资料**

- [csharplang/span-safety.md at main · dotnet/csharplang](https://github.com/dotnet/csharplang/blob/main/proposals/csharp-7.2/span-safety.md#method-arguments-must-match)
- [Relax CS8350 when passed ref-parameter are created in the same stack frame · Issue #43591 · dotnet/roslyn](https://github.com/dotnet/roslyn/issues/43591)
- [Need a general way to declare `ref` and `ref-like` locals bound to current scope. · Discussion #1130 · dotnet/csharplang](https://github.com/dotnet/csharplang/discussions/1130)

