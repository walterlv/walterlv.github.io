---
title: "C# 8.0 中开启默认接口实现"
date: 2019-05-15 14:57:35 +0800
tags: csharp dotnet
position: starter
coverImage: /static/posts/2019-05-15-14-28-13.png
---

当你升级到 C# 8.0 和 .NET Core 3.0 之后，你就可以开始使用默认接口实现的功能了。

从现在开始，你可以在接口里面添加一些默认实现的成员，避免在接口中添加成员导致大量对此接口的实现崩溃。

---

<div id="toc"></div>

## 最低要求

要写出并且正常使用接口的默认实现，你需要：

- C# 8.0
- .NET Core 3.0
- Visual Studio 2019 Preview (16.1 以上版本)

### 下载安装 Visual Studio 2019 Preview 版本

- 前往下载安装 [Visual Studio Preview](https://visualstudio.microsoft.com/vs/preview/)

### 开启 .NET Core 3.0 的支持

对于预览版的 Visual Studio 2019 来说，.NET Core 的预览版是默认打开且无法关闭的，所以不需要关心。

### 开启 C# 8.0 支持

请设置你项目的属性，修改 C# 语言版本为 8.0（对于预览版的语言来说，这是必要的）：

![修改语言版本](/static/posts/2019-05-15-14-28-13.png)

或者直接修改你的项目文件，加上 `LangVersion` 属性的设置，设置为 `8.0`。

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFramework>netcoreapp3.0</TargetFramework>
    <LangVersion>8.0</LangVersion>
  </PropertyGroup>

</Project>
```

## 默认接口实现

### 以前的做法

比如，我们现在有下面这样一个简单的接口：

```csharp
public interface IWalterlv
{
    void Print(string text);
}
```

这个接口被大量实现了。

现在，我们需要在接口中新增一个方法 `DouBPrint`，其作用是对 `Print` 方法进行标准化，避免各种不同实现带来的标准差异。于是我们新增一个方法：

```diff
    public interface IWalterlv
    {
        void Print(string text);

++      void DouBPrint(string text);
    }
```

然而我们都知道，这样的修改是破坏性的：

1. 会使得所有实现这个接口的代码全部失败（无法编译通过，或者运行时抛出异常）
1. 我们依然很难将接口的实现标准化，靠文档来规约

### 默认接口实现

那么现在，我们可以这样来新增此方法：

```diff
    public interface IWalterlv
    {
        void Print(string text);
        
--      void DouBPrint(string text);
++      public void DouBPrint(string text) => Print($"Walterlv 逗比 {text}");
    }
```

在使用此方法来定义此接口中的方法后，那些没来得及实现此方法的类型也可以编译通过并获得标准化的实现。

```csharp
class Program
{
    static void Main(string[] args)
    {
        IWalterlv walterlv = new Foo();
        walterlv.DouBPrint("walterlv");
    }
}

public class Foo : IWalterlv
{
    public void Print(string text)
    {
    }
}
```

当然，对于 `Foo` 类型来说，实现也是可以的：

```csharp

public class Foo : IWalterlv
{
    public void Print(string text)
    {
    }

    public void DouBPrint(string text) => Print($"Walterlv 逗比 {text}");
}
```

### 静态字段和方法

除此之外，在接口中还可以编写静态字段和静态方法，这可以用来统一接口中的一些默认实现。

意味着，如果类没有实现接口中带有默认实现的方法，那么具有默认的实现；而如果类中打算实现接口中的带有默认实现的方法，那么也可以调用接口中的静态方法来进行实现。

```diff
    public interface IWalterlv
    {
        void Print(string text);

--      public void DouBPrint(string text) => Print($"Walterlv 逗比 {text}");
++      public void DouBPrint(string text) => DefaultDouBPrint(this, text);
++
++      private static readonly string _name = "walterlv";
++
++      protected static void DefaultDouBPrint(IWalterlv walterlv, string text)
++          => walterlv.Print($"{_name} 逗比 {text}");
    }
```

然后，对于实现方，则需要使用接口名来调用接口中的静态成员：

```diff
    public class Foo : IWalterlv
    {
        public void Print(string text)
        {
        }

--      public void DouBPrint(string text) => Print($"Walterlv 逗比 {text}");
++      public void DouBPrint(string text)
++      {
++          // Do Other things.
++          IWalterlv.DefaultDouBPrint(this, text);
++      }
++  }
```

---

**参考资料**

- [Default implementations in interfaces - .NET Blog](https://devblogs.microsoft.com/dotnet/default-implementations-in-interfaces/)
- [Visual Studio 2019 version 16.1 Preview 3 - The Visual Studio Blog](https://devblogs.microsoft.com/visualstudio/visual-studio-2019-version-16-1-preview-3/)
- [Safely update interfaces using default interface members in C# - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/tutorials/default-interface-members-versions)

