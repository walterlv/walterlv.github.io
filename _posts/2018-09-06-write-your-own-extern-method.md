---
title: "都是用 DllImport？有没有考虑过自己写一个 extern 方法？"
publishDate: 2018-09-06 21:58:49 +0800
date: 2018-09-06 23:04:53 +0800
categories: dotnet csharp roslyn msbuild
---

你做 .NET 开发的时候，一定用过 `DllImport` 这个特性吧，这货是用于 P/Invoke (Platform Invoke, 平台调用) 的。这种 `DllImport` 标记的方法都带有一个 `extern` 关键字。

那么有没有可能我们自己写一个自己的 `extern` 方法呢？答案是可以的。本文就写一个这样的例子。

---

<div id="toc"></div>

### DllImport

日常我们的平台调用代码是这样的：

```csharp
class Walterlv
{
    [STAThread]
    static void Main(string[] args)
    {
        var hwnd = FindWindow(null, "那个窗口的标题栏文字");
        // 此部分代码省略。
    }

    [DllImport("user32.dll", CharSet = CharSet.Unicode)]
    public static extern IntPtr FindWindow(string lpClassName, string lpWindowName);
}
```

你看不到 `FindWindow` 的实现。

### 自定义的 extern

那我们能否自己实现一个这样的 `extern` 的方法呢？写一写，还真是能写得出来的。

![外部方法需要 Attribute 的提示](/static/posts/2018-09-06-21-13-11.png)  
▲ 外部方法需要 Attribute 的提示

只不过如果你装了 ReSharper，会给出一个提示，告诉你外部方法应该写一个 `Attribute` 在上面（虽然实际上编译没什么问题）。

那么我们就真的写一个 `Attribute` 在上面吧。

```csharp
class Walterlv
{
    internal void Run()
    {
        Foo();
    }

    [WalterlvHiddenMethod]
    private static extern void Foo();
}

[AttributeUsage(AttributeTargets.Method, AllowMultiple = false, Inherited = false)]
internal sealed class WalterlvHiddenMethodAttribute : Attribute
{
}
```

如果你好奇如果没写 `Attribute` 会怎样，那我可以告诉你 —— 你写不写都一样，都是不能运行起来的。

![方法没有实现](/static/posts/2018-09-06-21-20-12.png)  
▲ 方法没有实现

### 让自定义的 extern 工作起来

如果无法运行，那么我们写 `extern` 是完全没有意义的。于是我们怎么能让这个“外部的”函数工作起来呢？—— 事实上就是工作不起来。

不过，我们能够控制编译过程，能够在编译期间为其添加一个实现。

这里，我们需要用到 MSBuild/Roslyn 相关的知识：

- [Roslyn 通过 Target 修改编译的文件 - 林德熙](https://lindexi.gitee.io/post/Roslyn-%E9%80%9A%E8%BF%87-Target-%E4%BF%AE%E6%94%B9%E7%BC%96%E8%AF%91%E7%9A%84%E6%96%87%E4%BB%B6.html)

当你读完上面那篇文章，你就明白我想干啥了。没错，在编译期间将其替换成一个拥有实现的函数。

现在，我们将我们的几个类放到不同的文件中。

![我们的项目文件](/static/posts/2018-09-06-21-42-46.png)  
▲ 我们的项目文件

```csharp
// Program.cs
class Walterlv
{
    [STAThread]
    static void Main(string[] args)
    {
        Demo.Foo();
    }
}
```

```csharp
// Demo.cs
class Demo
{
    [WalterlvHiddenMethod]
    internal static extern void Foo();
}
```

```csharp
// WalterlvHiddenMethodAttribute.cs
using System;

[AttributeUsage(AttributeTargets.Method, AllowMultiple = false, Inherited = false)]
internal sealed class WalterlvHiddenMethodAttribute : Attribute
{
}
```

No！我们还有一个隐藏文件 `Demo.implemented.cs`。

![隐藏的文件](/static/posts/2018-09-06-21-47-05.png)  
▲ 隐藏的文件

```csharp
// Demo.implemented.cs
using System;

class Demo
{
    internal static void Foo()
    {
        Console.WriteLine("我就是一个外部方法。");
    }
}
```

这个文件我是通过在 csproj 中将其 remove 掉使得在解决方案中看不见。

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net472</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
    <Compile Remove="Demo.implemented.cs" />
  </ItemGroup>

</Project>
```

然后，我们按照上文博客中所说的方式，添加一个 `Target`，在编译时替换这个文件：

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>net472</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
    <Compile Remove="Demo.implemented.cs" />
  </ItemGroup>

  <Target Name="WalterlvReplaceMethod" BeforeTargets="BeforeBuild">
    <ItemGroup>
      <Compile Remove="Demo.cs" Visible="false" />
      <Compile Include="Demo.implemented.cs" Visible="false" />
    </ItemGroup>
  </Target>

</Project>
```

现在，运行即会发现可以运行。

![可以运行](/static/posts/2018-09-06-21-53-26.png)  
▲ 可以运行

### 总结

- `extern` 是 C# 的一个语法而已，谁都可以用，但最终编译时的 C# 文件必须都有实现。
- 我们可以在编译时修改编译的文件来为这些未实现的方法添加实现。

### 原理

看完上面的方法，是不是觉得写一个把实现藏起来的 `extern` 方法很简单？

但如果你认为 `DllImport` 也是这么做的那就不对了。

还记得我们一开始写的 `FindWindow` 方法吗？我们查看其编译后的 IL 代码，可以发现其外部调用已经写到了 IL 里面了，并且其实现使用了 `pinvokeimpl` 关键字。也就是说，具体的调用是 JIT 编译器去做的事儿。

```csharp
.method public hidebysig static pinvokeimpl ( "user32.dll" unicode winapi )native int 
    FindWindow(
      string lpClassName, 
      string lpWindowName
    ) cil managed preservesig 
{
    // Can't find a body
} // end of method Walterlv::FindWindow
```

至于实际执行时的执行细节，可以阅读 [c# - How does DllImport really work? - Stack Overflow](https://stackoverflow.com/a/14471704/6233938) 了解更多。

如果去看看我们写的 `Foo` 的 IL，就完全不一样了：

```csharp
.method assembly hidebysig static void 
    Foo() cil managed 
{
    .custom instance void WalterlvHiddenMethodAttribute::.ctor() 
      = (01 00 00 00 )
    .maxstack 8

    IL_0000: nop          
    IL_0001: ldstr        "我就是一个外部方法。"
    IL_0006: call         void [mscorlib]System.Console::WriteLine(string)
    IL_000b: nop          
    IL_000c: ret          

} // end of method Demo::Foo
```

这其实就是我们在 Demo.implement.cs 中写的那个函数的实现。这是当然，毕竟我们编译时偷偷把这个函数换成了那个隐藏的文件实现了。

关于如何迅速查看 C# 代码对应的 IL，可以阅读我的另一篇博客：[如何快速编写和调试 Emit 生成 IL 的代码](https://walterlv.com/post/how-to-quickly-write-emit-code.html#%E5%BF%AB%E9%80%9F%E7%BC%96%E5%86%99-emit)。

---

#### 参考资料

- [c# - How does DllImport really work? - Stack Overflow](https://stackoverflow.com/a/14471704/6233938)
