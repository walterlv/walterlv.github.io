---
title: ".NET 异常处理"
date: 2019-07-01 19:28:26 +0800
categories: dotnet csharp
position: knowledge
published: false
---

在此处编辑 blog.walterlv.com 的博客摘要

---

<div id="toc"></div>

## 快速了解 .NET 的异常机制

### 异常与传统的错误处理方法



### Exception 类

充分利用 `Exception` 类型中的已有属性来详细地报告异常信息。

### 捕捉异常

`catch(XxxException)`

`catch when`

### 引发异常

内部异常

### 创建异常

### finally

### 异常堆栈跟踪

堆栈跟踪从引发异常的语句开始，到捕获异常的 `catch` 语句结束。

## 异常处理原则

### try.catch.finally

catch 恢复错误（因发生异常而未完成方法时还原状态）

异常不能用于在正常执行过程中更改程序的流程。 异常只能用于报告和处理错误条件。

finally 清理资源

如果不知道如何恢复错误，请不要处理异常

### 该不该引发异常？

当出现时，真的是遇到了意外的情况——异常。

这件事本来就经常发生——这其实是业务本身就应该处理的。

避免异常的一方法是，先判断再使用。

避免异常的另一方法是，对极为常见的错误案例返回 NULL（或默认值），而不是引发异常。 极其常见的错误案例可被视为常规控制流。 通过在这些情况下返回 NULL（或默认值），可最大程度地减小对应用的性能产生的影响。（后面会专门说 null。）

当存在下列一种或多种情况时，程序员应引发异常：

方法无法完成其定义的功能。

根据对象的状态，对某个对象进行不适当的调用。

请勿有意从自己的源代码中引发 [System.Exception](https://docs.microsoft.com/zh-cn/dotnet/api/system.exception)、[System.SystemException](https://docs.microsoft.com/zh-cn/dotnet/api/system.systemexception)、[System.NullReferenceException](https://docs.microsoft.com/zh-cn/dotnet/api/system.nullreferenceexception) 或 [System.IndexOutOfRangeException](https://docs.microsoft.com/zh-cn/dotnet/api/system.indexoutofrangeexception)。

### 抛出哪些异常？

### 自定义异常

Exception 结尾

Message 是一个句子。

提供帮助诊断错误的属性。

四个构造函数用于序列化异常。 新的异常类应可序列化。 

### 异常的分类

CLR 异常

## 其他

### 一些常见异常的原因和解决方法

BadImageException

FileNotFoundExcception

### 捕捉非 CLS 异常



---

**参考资料**

- [Handling and throwing exceptions in .NET - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/standard/exceptions/)
- [Exceptions and Exception Handling - C# Programming Guide - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/programming-guide/exceptions/)
