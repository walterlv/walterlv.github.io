---
title: ".NET/C# 的字符串暂存池"
date: 2019-05-28 21:26:27 +0800
tags: dotnet csharp
position: knowledge
---

本文介绍 .NET 中的字符串暂存池。

---

<div id="toc"></div>

## 字符串暂存池

.NET 的 CLR 运行时会在运行期间管理一个字符串暂存池（string intern pool），在字符串暂存池中的字符串只有一个实例。

例如，在下面的代码中，变量 `a`、`b`、`c` 都是同一个实例：

```csharp
var a = "walterlv";
var b = "walterlv";
var c = "walterlv";
```

我有另一篇博客说到了此问题，可以参见：

- [.NET/C# 编译期间能确定的相同字符串，在运行期间是相同的实例](/post/same-strings-at-compile-time-are-the-same-instances-at-runtime)

字符串暂存池的出现是为了避免分配大量的字符串对象造成的过多的内存空间浪费。

## 编译期间确定

默认进入字符串暂存池中的字符串是那些写程序的时候直接声明或者直接写入代码中的字符串。上一节中列举的三个变量中的字符串就是直接写到代码中的字符串。

默认情况下编译期间能确定出来的字符串会写入到程序集中，运行时能直接将其放入字符串暂存池。

## 从暂存池中获取字符串

现在，我们要制造出编译期间不能确定出来的字符串，以便进行一些试验。

我们当然不能使用简单的 `"walter" + "lv"` 这样简单的字符串拼接的方式来生成字符串，因为实际上这样的字符串依然可以在编译期间完全确定。

所以这里使用 `StringBuilder` 来在运行期间生成字符串。

```csharp
var a = "walterlv";
var b = new StringBuilder("walter").Append("lv").ToString();
var c = string.Intern(b);

Console.WriteLine(ReferenceEquals(a, b));
Console.WriteLine(ReferenceEquals(a, c));
```

在这段代码中，虽然 `a`、`b`、`c` 三个字符串的值都是相等的，但 `a`、`b` 两个字符串是不同的实例，而 `a`、`c` 两个字符串是相同的实例。

我们使用了 `string.Intern` 方法从字符串池中取出了一个字符串的实例。

另外，`string` 类型还提供了 `string.IsInterned` 来判断一个字符串是否在字符串暂存池中。

## 不要池化

你可以在程序集中标记 `CompilationRelaxations.NoStringInterning`，这样，此程序集中的字符串就不会被池化。即便是在编译期间写下的字符串也会在运行时生成新的实例。

方法是在一个 C# 代码文件中添加特性标记。

```csharp
[assembly: CompilationRelaxations(CompilationRelaxations.NoStringInterning)]
```

## 垃圾回收

在字符串暂存池中的字符串不会被垃圾回收，你可以阅读另一篇博客：

- [.NET/C# 编译期能确定的字符串会在字符串暂存池中不会被 GC 垃圾回收掉](/post/-compile-time-strings-are-in-the-string-intern-pool)

---

**参考资料**

- [String.Intern(String) Method (System) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/system.string.intern?redirectedfrom=MSDN&view=netframework-4.8#System_String_Intern_System_String_)
