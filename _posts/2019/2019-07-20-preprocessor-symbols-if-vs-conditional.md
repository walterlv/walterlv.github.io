---
title: ".NET/C# 使用 #if 和 Conditional 特性来按条件编译代码的不同原理和适用场景"
publishDate: 2019-07-12 14:38:32 +0800
date: 2019-07-20 15:41:17 +0800
tags: dotnet csharp
position: starter
permalink: /post/preprocessor-symbols-if-vs-conditional.html
---

有小伙伴看到我有时写了 `#if` 有时写了 `[Conditional]` 问我两个不是一样的吗，何必多此一举。然而实际上两者的编译处理是不同的，因此也有不同的应用场景。

于是我写到这篇文章当中。

---

## 条件编译符号和预处理符号

我们有时会使用 `#if DEBUG` 或者 `[Conditional("DEBUG")]` 来让我们的代码仅在特定的条件下编译。

而这里的 `DEBUG` 是什么呢？

- 在我们编写的 C# 代码中，这个叫做 “条件编译符号”（Conditional compilation symbols）
- 在项目的构建过程中，这个叫做 “定义常量”（Define constants）
- 而在将 C# 代码编译到 dll 的编译环节，这个叫做 “预处理符号”（Preprocessor symbols）

本文要讨论的是 `#if` 和 `Conditional` 的使用，这是在 C# 代码中的使用场景，因此，本文后面都将其称之为 “条件编译符号”。

## 区别

### `#if`

```csharp
#if DEBUG

Console.WriteLine("欢迎来 blog.walterlv.com 来做客呀！");

#endif
```

在这段代码中，`#if DEBUG` 和 `#endif` 之间的代码仅在 DEBUG 下会编译，在其他配置下是不会编译的。

### `Conditional`

```csharp
[Conditional("DEBUG")]
public void Foo()
{
    Console.WriteLine("欢迎来 blog.walterlv.com 来做客呀！");
}
```

而这段代码，是会被编译到目标程序集中的。它影响的，是调用这个方法的代码。调用这个方法的代码，仅在 DEBUG 下会编译，在其他配置下是不会编译的。

## 场景

因为 `#if DEBUG` 和 `#endif` 仅仅影响包含在其内的代码块，因此其仅仅影响写的这点代码所在的项目（或者说程序集）。于是使用 `#if` 只会影响实现代码。

而 `[Conditional("DEBUG")]` 影响的是调用它的代码，因此可以设计作为 API 使用——让目标项目（或者程序集）仅在目标项目特定的配置下才会编译。

