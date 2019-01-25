---
title: ".NET/C# 编译期间能确定的相同字符串，在运行期间是相同的实例"
publishDate: 2019-01-21 15:03:23 +0800
date: 2019-01-25 15:47:13 +0800
categories: dotnet csharp
position: knowledge
---

我们知道，在编译期间相同的字符串，在运行期间就会是相同的字符串实例。然而，如果编译期间存在字符串的运算，那么在运行期间是否是同一个实例呢？

只要编译期间能够完全确定的字符串，就会是同一个实例。

---

字符串在编译期间能确定的运算包括：

1. `A + B` 即字符串的拼接
1. `$"{A}"` 即字符串的内插

<div id="toc"></div>

### 字符串拼接

对于拼接，我们不需要运行便能知道是否是同一个实例：

```csharp
private const string X = "walterlv is a";
private const string Y = "逗比";
private const string Z = X + Y;
```

以上这段代码是可以编译通过的，因为能够写为 `const` 的字符串，一定是编译期间能够确定的。

### 字符串内插

对于字符串内插，以上代码我们不能写成 `const`：

![错误提示](/static/posts/2019-01-21-14-42-00.png)

错误提示为：常量的初始化必须使用编译期间能够确定的常量。

然而，这段代码不能在编译期间确定吗？实际上我们有理由认为编译器其实是能够确定的，只是编译器这个阶段没有这么去做而已。

实际上在 2017 年就有人在 GitHub 上提出了这个问题，你可以在这里看讨论：

- [[Discussion] Constant string interpolation · Issue #2077 · dotnet/csharplang](https://github.com/dotnet/csharplang/issues/2077)
- [String interpolation constants · Issue #384 · dotnet/csharplang](https://github.com/dotnet/csharplang/issues/384)
- [[Discussion] Constant string interpolation · Issue #11259 · dotnet/roslyn](https://github.com/dotnet/roslyn/issues/11259)

但是，我们写一个程序来验证这是否是同一个实例：

```csharp
using System;

namespace Walterlv.Demo
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine(ReferenceEquals(A, A));
            Console.WriteLine(ReferenceEquals(C, C));
            Console.WriteLine(ReferenceEquals(E, E));
            Console.WriteLine(ReferenceEquals(G, G));
            Console.ReadKey(true);
        }

        private static string A => $"walterlv is a {B}";
        private static string B => "逗比";
        private static string C => $"walterlv is a {D}";
        private static string D = "逗比";
        private static string E => $"walterlv is a {F}";
        private static readonly string F = "逗比";
        private static string G => $"walterlv is a {H}";
        private const string H = "逗比";
    }
}
```

以上代码的输出为：

```log
False
False
False
True
```

也就是说，对于最后一种情况，也就是内插的字符串是常量的时候，得到的字符串是同一个实例；这能间接证明编译期间完全确定了字符串 G。

注意，其他情况都不能完全确定：

1. 属性内插时一定不确定；
1. 静态字段内插时，无论是否是只读的，都不能确定。（谁知道有没有人去反射改掉呢？）

我们可以通过 IL 来确定前面的间接证明（代码太长，我只贴出来最重要的 G 字符串，以及一个用来比较的 E 字符串）：

```nasm
.method private hidebysig static specialname string
    get_G() cil managed
{
    .maxstack 8

    // [22 36 - 22 56]
    IL_0000: ldstr        "walterlv is a 逗比"
    IL_0005: ret

}
.method private hidebysig static specialname string
    get_E() cil managed
{
    .maxstack 8

    // [20 36 - 20 56]
    IL_0000: ldstr        "walterlv is a "
    IL_0005: ldsfld       string Walterlv.Demo.Roslyn.Program::F
    IL_000a: call         string [System.Runtime]System.String::Concat(string, string)
    IL_000f: ret

}
```

可以发现，实际上 G 已经在编译期间完全确定了。

### 扩展：修改编译期间的字符串

前面我们说到可以在编译期间完全确定的字符串。呃，为什么一定要抬杠额外写一节呢？

下面我们修改编译期间确定的字符串，看看会发生什么：

```csharp
static unsafe void Main(string[] args)
{
    // 这里的 G 就是前面定义的那个 G。
    Console.WriteLine("walterlv is a 逗比");
    Console.WriteLine(G);
    fixed (char* ptr = "walterlv is a 逗比")
    {
        *ptr = 'W';
    }
    Console.WriteLine("walterlv is a 逗比");
    Console.WriteLine(G);

    Console.ReadKey(true);
}
```

运行结果是：

```log
walterlv is a 逗比
walterlv is a 逗比
Walterlv is a 逗比
Walterlv is a 逗比
```

虽然我们看起来只是在修改我们自己局部定义的一个字符串，但是实际上已经修改了另一个常量以及属性 G。

少年，使用指针修改字符串是很危险的！鬼知道你会把程序改成什么样！

---

#### 参考资料

- [$ - string interpolation - C# Reference - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/tokens/interpolated)
- [[Discussion] Constant string interpolation · Issue #2077 · dotnet/csharplang](https://github.com/dotnet/csharplang/issues/2077)
- [String interpolation constants · Issue #384 · dotnet/csharplang](https://github.com/dotnet/csharplang/issues/384)
- [[Discussion] Constant string interpolation · Issue #11259 · dotnet/roslyn](https://github.com/dotnet/roslyn/issues/11259)
