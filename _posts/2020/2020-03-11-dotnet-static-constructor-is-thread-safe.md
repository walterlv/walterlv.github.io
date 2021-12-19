---
title: ".NET 的静态构造函数是否线程安全？答案是肯定的！"
publishDate: 2020-03-11 18:17:50 +0800
date: 2020-03-23 11:37:11 +0800
tags: dotnet
position: knowledge
published: false
permalink: /posts/dotnet-static-constructor-is-thread-safe.html
---

今天有小伙伴在评估某类线程安全问题的时候，怀疑到静态构造函数里面去了。于是就有了本文。

---

<div id="toc"></div>

## 静态构造函数的执行时机

根据官方文档 [Static Constructors - C# Programming Guide](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/static-constructors) 所述：

> A static constructor is called automatically to initialize the class before the first instance is created or any static members are referenced. A static constructor will run before an instance constructor. A type's static constructor is called when a static method assigned to an event or a delegate is invoked and not when it is assigned. If static field variable initializers are present in the class of the static constructor, they will be executed in the textual order in which they appear in the class declaration immediately prior to the execution of the static constructor.

## 静态构造函数的线程安全



---

**参考资料**

- [Are static constructors thread-safe? · Issue #10243 · dotnet/docs](https://github.com/dotnet/docs/issues/10243)
- [Classes - C# language specification - Microsoft Docs](https://docs.microsoft.com/zh-cn/dotnet/csharp/language-reference/language-specification/classes#static-constructors)
- [static constructor and thred safety](https://social.msdn.microsoft.com/Forums/vstudio/en-US/ea3d2a1c-2c70-47c9-b4ee-d6443319ee50/static-constructor-and-thred-safety?forum=csharpgeneral)
- [Thread Safety In C#](https://www.c-sharpcorner.com/UploadFile/1c8574/thread-safety369/)
- [multithreading - Is the C# static constructor thread safe? - Stack Overflow](https://stackoverflow.com/q/7095/6233938)
- [Static Constructors - C# Programming Guide - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/classes-and-structs/static-constructors)

