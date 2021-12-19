---
title: "微软官方的 NuGet 包是如何做到同时兼容新旧框架的？例如 System.ValueTuple 是如何做到在新旧版本的框架都能使用的？"
publishDate: 2020-05-24 16:21:10 +0800
date: 2020-05-24 16:27:16 +0800
tags: dotnet nuget
position: knowledge
---

不知你是否好奇，System.ValueTuple 是新框架（.NET Core 3.0）开始引入的类型，但可以通过 NuGet 包向旧框架提供这些类型的使用。并且，这些包即便安装到本来就有此类型的新框架上也能正常运行而不会出现多处类型定义的问题。

这些类型是如何做到框架内定义了，包里也定义了，却能像同一个类型一样作为参数和返回值传递？本文带你了解其中的奥秘。

---

<div id="toc"></div>

## 示例项目

首先，我们需要有一个示例项目，用来观察 System.ValueTuple 在框架内和 NuGet 包内的一些行为。

创建一个 .NET Core 控制台项目。然后我们需要修改两个地方：

1. Program.cs 文件
2. 项目文件（*.csproj）文件

```csharp
class Program
{
    static void Main()
    {
        var (a, b) = Foo();
        System.Console.WriteLine($"欢迎阅读{a}的博客 {b}");
    }

    static (string a, string b) Foo() => ("吕毅", "blog.walterlv.com");
}
```

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <OutputType>Exe</OutputType>
    <TargetFrameworks>net462;net48;netstandard2.0;netcoreapp2.0;netcoreapp3.1</TargetFrameworks>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="System.ValueTuple" Version="4.5.0" />
  </ItemGroup>

</Project>
```

接下来，我们的研究都将基于此项目。

![输出目录](/static/posts/2020-05-24-15-44-37.png)

## 研究开始

System.ValueTuple 对旧框架的支持体现在三个方面：

1. 旧框架中也能写出新框架中的这种语法；
2. 旧框架中也能正常使用此类型；
3. 新框架中此类型不会与包中的类型冲突。

我们分别来看看这三个都是如何实现的。

### 语法支持

C# 从 7.0 开始支持元组类型的语法，即可以写出这样的代码：

```csharp
var (a, b) = Foo();
```

关于此新增功能，可以前往这里查看：

- [C# 7.0 中的新增功能 - C# 指南 - Microsoft Docs](https://docs.microsoft.com/zh-cn/dotnet/csharp/whats-new/csharp-7#tuples)

C# 从 8.0 开始，各种原本需要实现特定接口才能写出的语法，现在也可以不用实现接口了，只要有对应的方法存在即可，比如：

- IDisposable
- IEnumerable
- Deconstruct

另外，从 C# 5.0 开始引入的 async/await 也是如此，无需实现任何接口，有 GetAwaiter 方法就够了。也是一样的情况，详见：

- [.NET 中什么样的类是可使用 await 异步等待的？ - walterlv](https://blog.walterlv.com/post/what-is-an-awaiter.html)

也就是说，只要你的项目使用的 C# 版本在 7.0 以上，就可以使用元组解构这样的语法。即便在 C# 7.0 以下，也能使用 System.ValueTuple，只是不能使用此语法而已。

### 旧框架兼容

System.ValueTuple 对旧框架的兼容，单纯的就是通过 NuGet 包引入了这些类型，以及这些类型的实现而已。

我们在示例项目的 net462 的输出目录下找到 System.ValueTuple.dll 进行反编译可以看出来这一点：

![net462 版本的 System.ValueTuple.dll](/static/posts/2020-05-24-15-43-00.png)

### 新框架不冲突

我们再去新框架里面看看 System.ValueTuple 的情况。

例如先看看 net48 目录下的 System.ValueTuple.dll：

![net48 版本的 System.ValueTuple.dll](/static/posts/2020-05-24-15-45-29.png)

可以发现，net48 下的 System.ValueTuple 已经全部使用 `TypeForwardedTo` 特性转移到了 mscorelib 程序集。

.NET Core 3.1 版本和 .NET Standard 2.0 版本的输出目录里是没有 System.ValueTuple.dll 的，那么它们的依赖是如何决定的呢？

<!-- 对于 .NET Standard 2.0 来说，在 *.deps.json 里面记录（其他项已省略）：

```json
"targets": {
    ".NETStandard,Version=v2.0/": {
        "Walterlv.Demo.SystemValueTuple/1.0.0": {
            "dependencies": {
                "NETStandard.Library": "2.0.3",
                "System.ValueTuple": "4.5.0"
            },
        },
    }
},
```

对于 .NET Core 3.1 也是在 *.deps.json 里面记录（其他项已省略）：

```json
"targets": {
    ".NETCoreApp,Version=v3.1": {
        "Walterlv.Demo.SystemValueTuple/1.0.0": {
            "dependencies": {
                "System.ValueTuple": "4.5.0"
            },
            "runtime": {
                "Walterlv.Demo.SystemValueTuple.dll": {}
            }
        },
        "System.ValueTuple/4.5.0": {}
    }
},
```

这些指定的依赖，在发布此程序之后会换成真实的依赖：

```powershell
dotnet publish -c Release -f netcoreapp3.1 -r win10-x64 --self-contained true
```

这是发布后的 dll：

![发布后的 dll](/static/posts/2020-05-24-16-12-29.png)

反编译之后查看，可以发现已经是使用了 `TypeForwardedTo` 特性的 dll 了。

因此，对于新框架来说，是因为使用了 `TypeForwardedTo` 特性使得无论你使用包中的 System.ValueTuple 还是使用框架内的 System.ValueTuple，最终都会对应到框架内的同一个类型。无需担心类型不同的问题。 -->

答案是——不需要依赖！

我们来拆开 System.ValueTuple 的 NuGet 包看看。可在这里下载：[NuGet Gallery - System.ValueTuple 4.5.0](https://www.nuget.org/packages/System.ValueTuple/)。

可发现它提供了这些不同框架的支持：

![System.ValueTuple 包支持的框架](/static/posts/2020-05-24-15-57-55.png)

其中：

- net47 框架使用的是 `TypeForwardedTo` 的垫片
- net461 / netstandard1.0 / portable-net40+sl4+win8+wp8 框架使用的是完整版本的 System.ValueTuple
- netcoreapp2.0 / netstandard2.0 / mono 全系列 / xamarin 全系列 / uap 里面是 `_._` 占位文件，表示支持此框架且无需任何引用（因为框架已经自带支持）

原生支持 System.ValueTuple 的框架，其 NuGet 包中的框架内的文件是 `_._`，这个文件的出现仅仅是为了能让 zip 里面有一个对应框架的文件夹。而 zip 对空文件夹的支持并不好，所以加一个这样的文件可以避免文件夹消失，造成 NuGet 认为不支持这样的框架。

## 结论

1. 框架（.NET）和语言（C#）现在已是独立升级了，因此在使用旧框架的情况下，也可以使用新语言的特性；
2. 旧框架使用的是完整功能的 dll（由 NuGet 包来决定使用正确的 dll）；
3. 新框架使用的是 `TypeForwardedTo` 特性作为垫片，重定向类型到新框架中（由 NuGet 包来决定使用正确的 dll）。

额外的，我写过另一个通过此方式获得新旧框架兼容的包：

- [杂谈 System.Drawing.Common 的跨平台性 - walterlv](/post/system-drawing-common)

---

**参考资料**

- [What do mean _._ files in nuget packages? · Issue #744 · dotnet/aspnetcore](https://github.com/dotnet/aspnetcore/issues/744)
