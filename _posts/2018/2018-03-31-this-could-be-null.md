---
title: "（C#）if (this == null)？你在逗我，this 怎么可能为 null！用 IL 编译和反编译看穿一切"
date: 2018-03-31 08:26:39 +0800
categories: dotnet msil
tags: ilasm ildasm
---

`if (this == null) Console.WriteLine("this is null");` 这句话一写，大家一定觉得荒谬，然而 `if` 内代码的执行却是可能的！本文讲介绍到底发生了什么。

---

<div id="toc"></div>

### 制造一个 this 可以为 null 的程序

请看代码，这是我们的库函数：

```csharp
namespace Walterlv.Demo
{
    public class Foo
    {
        public void Test()
        {
            if (this == null) Console.WriteLine("this is null");
            else Console.WriteLine("this is not null");
        }
    }
}
```

外面是这样调用的：

```csharp
namespace Walterlv.Demo
{
    public class Program
    {
        private static void Main()
        {
            Foo p = null;
            p.Test();
        }
    }
}
```

这代码写出来，当然毫不犹豫地说——这会发生 `NullReferenceException`！

然而……

现在我们改一改 Program 的 IL：

![Foo.Test](/static/posts/2018-03-31-07-47-18.png)

将关注重点放在图中红框标注的部分，那是调用 `p.Test` 的地方。

现在，我们将它从 `callvirt` 修改成 `call`。

第一步：反编译 exe 成 IL：

> ```powershell
> # ildasm 在 C:\Program Files (x86)\Microsoft SDKs\Windows\v10.0A\bin\NETFX 4.7.1 Tools\x64 路径下
> ildasm /out=D:\Desktop\wdemo.il D:\Desktop\Walterlv.Demo\wdemo\bin\Debug\wdemo.exe
> ```

第二步：修改 IL，将 callvirt 修改成 call

> ```nasm
> IL_0004:  call   instance void Walterlv.Demo.Foo::Test()
> ```

第三步：重新编译 IL 成 exe

> ```powershell
> # ilasm 在 C:\Windows\Microsoft.NET\Framework64\v4.0.30319 路径下
> lvyi> ilasm /out:D:\Desktop\wdemo.exe D:\Desktop\wdemo.il
> 
> Microsoft (R) .NET Framework IL Assembler.  Version 4.7.2556.0
> Copyright (c) Microsoft Corporation.  All rights reserved.
> Assembling 'D:\Desktop\wdemo.il'  to EXE --> 'D:\Desktop\wdemo.exe'
> Source file is ANSI
> 
> Assembled method Walterlv.Demo.Program::Main
> Assembled method Walterlv.Demo.Program::.ctor
> Assembled method Walterlv.Demo.Foo::Test
> Assembled method Walterlv.Demo.Foo::.ctor
> Creating PE file
> 
> Emitting classes:
> Class 1:        Walterlv.Demo.Program
> Class 2:        Walterlv.Demo.Foo
> 
> Emitting fields and methods:
> Global
> Class 1 Methods: 2;
> Class 2 Methods: 2;
> Resolving local member refs: 1 -> 1 defs, 0 refs, 0 unresolved
> 
> Emitting events and properties:
> Global
> Class 1
> Class 2
> Resolving local member refs: 0 -> 0 defs, 0 refs, 0 unresolved
> Writing PE file
> Operation completed successfully
> ```

结果，现在再执行程序时，输出是 `this is null`：

![this is null](/static/posts/2018-03-31-08-10-52.png)

### 为什么此时 this 是 null

从名字上看，`call` 是为了调用非虚方法、静态方法或者基类方法的；而 `callvirt` 是为了调用虚方法的。前者在编译时就将确认调用了某个类的某个方法，而后者将在运行时动态决定应该调用哪个。

然而，当 IL 试图调用某个变量实例的一个方法时，由于不确定这个变量到底是不是实际的类型（还是基类型），所以都采用 `callvirt` 进行调用。`call` 在编译时就已确定调用，所以也没有加入 `null` 的判断；`callvirt` 却需要，因为通常都是实例使用。

于是，此次便出现了 `null.Test()` 这样诡异的调用。

### 一些建议和总结

虽然我们制造出了一个 `this` 可能为 `null` 的情况，即便库和调用方是分开开发的，但实际开发中其实并不需要考虑这样的问题。

---

#### 参考资料

- [Easy way to modify IL code – I know the answer (it's 42)](https://blogs.msdn.microsoft.com/abhinaba/2007/07/26/easy-way-to-modify-il-code/)
- [.net - Call and Callvirt - Stack Overflow](https://stackoverflow.com/questions/193939/call-and-callvirt)
- [Observing a null this value](http://blog.paranoidcoding.com/2015/03/11/observing-a-null-this.html)
<!-- - [用CIL写程序:从“call vs callvirt”看方法调用 - 陈嘉栋 - 博客园](http://www.cnblogs.com/murongxiaopifu/p/4298167.html) -->
