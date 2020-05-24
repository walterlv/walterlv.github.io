---
title: "杂谈 System.Drawing.Common 的跨平台性（关键词：libgdiplus / .NET Core / Mono / Win32 / Linux / ……）"
publishDate: 2020-05-24 14:37:19 +0800
date: 2020-05-24 18:20:13 +0800
categories: dotnet csharp
position: knowledge
---

经过 Mono 团队的不懈努力，原本专属于 Win32 平台的 GDI+ 终于可以跨平台了，不过这中间还有好多的故事和好多的坑。

本文带你了解 System.Drawing 命名空间的跨平台。

---

<div id="toc"></div>

## System.Drawing、System.Drawing.Common 以及 GDI+

在了解本文的后续内容之前，你可能需要先了解一些基本的名词，不然后面极可能看得云里雾里。

System.Drawing 有两个意思，第一个是 System.Drawing.dll 程序集，第二个是 System.Drawing 命名空间。

如果进行 .NET Framework 项目的开发，那么对 System.Drawing 一定不陌生，框架自身对位图的处理基本都是用的这套库，很多第三方图像处理库也都基于 System.Drawing 程序集进行二次封装。比如 [JimBobSquarePants/ImageProcessor](https://github.com/jimbobsquarepants/imageprocessor) 库实际上就是对 System.Drawing 的封装，[AForge.NET](https://github.com/andrewkirillov/AForge.NET) 库作为计算机视觉库也对 System.Drawing 有较大的依赖。

Mono 是一个诞生以来就为了让 .NET Framework 跨平台的开源项目。开发基于 Mono 运行时的项目时，使用的框架 API 也是兼容 .NET Framework 的，因此也可以在 Mono 中直接依赖 System.Drawing 程序集进行开发。

System.Drawing 固然强大，但它却只是 Win32 GDI+ 的一层很薄很薄的封装。然而其他平台上没有原生对 GDI+ 的实现，所以跨平台是一个比较棘手的问题（本文后面会说到如何做到跨平台）。

.NET Core 也是为跨平台而生，不过它走的路线与 Mono 有些不同。它从 API 级别就分离出 .NET Framework 中不跨平台的部分，然后把它们从 .NET 的核心仓库中移除，换成 .NET 的扩展框架（如 WPF / Windows Forms）。那么面对 System.Drawing 部分的 API 时 .NET Core 是怎么做的呢？一开始做了一个兼容库 [CoreCompat.System.Drawing](https://www.nuget.org/packages/CoreCompat.System.Drawing/)（仓库在[这里](https://github.com/CoreCompat/CoreCompat)和[这里](https://github.com/CoreCompat/System.Drawing)）做了一部分的兼容，而后由于 Mono 的努力做出了 GDI+ 在其他平台上的实现（[mono/libgdiplus](https://github.com/mono/libgdiplus)），.NET Core 就有幸将 System.Drawing 纳入 .NET Core 中作为一个扩展库存在。而这个库就是 [System.Drawing.Common](https://www.nuget.org/packages/System.Drawing.Common/)（仓库在 [这里](https://github.com/dotnet/runtime/tree/master/src/libraries/System.Drawing.Common)）。

我们小结一下：

1. GDI+ 是 Windows 上的图形设备接口（Graphics Device Interface），用来完成一些和绘制有关的工作，用以解决不同应用程序开发者需要面向具体的硬件绘图造成的兼容负担（类似的有 GTK 的 GDK/Xlib 还有 Mac 设备的 Quartz）。
2. System.Drawing 命名空间里包含了封装 GDI+ 的一层薄薄的封装，System.Drawing.dll 是 .NET Framework 下这层封装的实现，[System.Drawing.Common](https://www.nuget.org/packages/System.Drawing.Common/) 库是 .NET Core 下这层封装的实现。

## 跨平台的关键 libgdiplus

libgdiplus 是在非 Windows 操作系统上提供 GDI+ 兼容 API 的 Mono 库，而其跨平台图形绘制的大部分关键实现靠的是 [Cairo](https://www.cairographics.org/) 库。

libgdiplus 的开源仓库：

- [mono/libgdiplus: C-based implementation of the GDI+ API](https://github.com/mono/libgdiplus)

目前，其几乎就是为 System.Drawing 命名空间下的位图处理作为实现的。System.Drawing 的跨平台的能力几乎完全靠的是 libgdiplus 库。

安装方法见仓库 README。

目前 libgdiplus 还有一些没能完全实现的部分：

1. 文本
    - libgdiplus 目前是自己实现的一套文本引擎，但 GDI+ 提供了 libgdiplus 不支持或不正确支持的许多（很少使用的）选项
    - 目前也正考虑使用 pango 引擎来替代自己的实现，可通过 `–with-pango` 选项开启 pango 引擎，但没实现的功能更多
2. 其他
    - 还有其他一些没实现的功能
    - 可在这里看到尚未实现的功能列表 [libgdiplus/TODO at master · mono/libgdiplus](https://github.com/mono/libgdiplus/blob/master/TODO)
    - Mono 官方欢迎社区广大小伙伴帮忙完成这些任务

## System.Drawing 各平台目前的支持情况

Mono 和 .NET Core 目前均已完成基于 libgdiplus 的 System.Drawing 命名空间的跨平台。当然，这个跨平台迁移的唯一目的是“兼容”，是为了让现有的基于 System.Drawing 的代码能够跨平台跑起来。仅此而已，不会有任何的性能优化或者设计优化。（想要优化的版本可以参考本文最后推荐的其他图形库）。

但依然值得注意的是，这个跨平台依然不是完全的跨所有平台：

1. 一是因为前面我们说到的 libgdiplus 尚未完全实现 GDI+ 的所有功能
1. 二是因为 Windows 自己的 UWP 平台无法完成 System.Drawing 的实现

这里将其他的基于 .NET / Windows 平台的图形实现放到一起来做对比：

|                               | Win32 | UWP  | macOS | Linux / 其他 |
| ----------------------------- | ----- | ---- | ----- | ------------ |
| .NET Framework (GDI+)         | ✔️     | ❌    | ❌     | ❌            |
| Direct2D / Win2D              | ✔️     | ✔️    | ❌     | ❌            |
| Mono / .NET Core (libgdiplus) | ✔️     | ❌    | ✔️     | ✔️            |
| Xamarin (CoreGraphics)        | ❌     | ❌    | ✔️     | ❌            |
| 其他第三方 .NET 库            | ✔️     | ✔️    | ✔️     | ✔️            |

- .NET Framework 中的实现也就是本文一直在说的重点，即 System.Drawing，即对 GDI+ 那非常薄的封装。
- Direct2D / Win2D 只能在 Windows 平台使用；如果不使用 UWP 桥，那么 Win2D 也只能局限在 UWP 平台，而且要求系统版本 Windows 8 及以上。
- Mono / .NET Core 基于 libgdiplus 实现跨平台，但需要注意在 Win32 平台上，它用的也是现成的 GDI+ 实现，而不是 libgdiplus。
- Xamarin / CoreGraphics 这是使用原生系统组件做的图形实现，仅支持 macOS 平台。
- 其他第三方库因为不强依赖系统组件，所以能做到更好的跨平台特性。（可见本文末尾推荐的图像库。）

## 选择 System.Drawing.dll 还是选择 System.Drawing.Common

### 问题

回到 System.Drawing 上，现在我们知道应该使用 System.Drawing.dll 还是使用 System.Drawing.Common 库了吗？

盲猜应该使用 System.Drawing.Common 库吧？因为这个库里面既带了 Windows 平台下的实现（对 GDI+ 做一层很薄的封装），又带了 Linux 和 macOS 下的实现（使用 libgdiplus）。

然而事情并没有那么简单！我来问几个问题：

1. .NET Framework 里面已经自带了 System.Drawing.dll 了，那么 System.Drawing.Common 包里带的 System.Drawing.Common.dll 是否会与之冲突？
    - 例如是否会导致同一个类型分属两个不同的程序集导致分别依赖两个不同程序集的不同代码之前无法传递 `System.Drawing` 命名空间中的参数呢？
3. 所有种类的项目都能正常使用 System.Drawing.Common 库吗？
    - 例如 Unity3D 项目

首先来看看问题一。我们新建一个 .NET Framework 的项目，一个 .NET Core 的项目，两者都安装 System.Drawing.Common 包，然后调用一下这个包里面的方法：

```csharp
class Program
{
    private static void Main()
    {
        var bitmap = new Bitmap(@"D:\walterlv\test.png");
    }
}
```

### 反编译

会发现，两者都是可以正常运行的。

将 net48 框架项目下引用的 System.Drawing.Common.dll 反编译来看，可以发现，这是一个空的程序集，里面几乎没有任何实质上的类型。里面所有的类型都通过 `TypeForwardedTo` 特性转移到 System.Drawing.dll 程序集了，现在剩下的只是一个垫片。关于 TypeForwarding 可以阅读这篇博客了解：[C# dotnet TypeForwarding 的用法](https://blog.lindexi.com/post/C-dotnet-TypeForwarding-%E7%9A%84%E7%94%A8%E6%B3%95.html)，微软也有其他通过此方式做的 NuGet 包，可参见 [微软官方的 NuGet 包是如何做到同时兼容新旧框架的？ - walterlv](/post/microsoft-dotnet-packages-use-typeforwarded-to-keep-compatibility)。

![.NET Framework 4.8 下输出的文件](/static/posts/2020-05-24-13-44-32.png)

![.NET Framework 4.8 中引用的 System.Drawing.Common.dll](/static/posts/2020-05-24-13-34-32.png)

将 netcoreapp3.1 框架项目下引用的 System.Drawing.Common.dll 反编译来看，可以发现，这个程序集里面所有的类型所有的方法实现都是抛出 `PlatformNotSupportedException`。

![.NET Core 3.1 下输出的文件](/static/posts/2020-05-24-13-42-51.png)

![.NET Core 中引用的 System.Drawing.Common.dll](/static/posts/2020-05-24-13-39-06.png)

这就有些奇怪了，如果所有的方法都抛出 `PlatformNotSupportedException` 那如何才能正常运行呢？

打开 netcoreapp3.1 输出目录下的 *.deps.json 文件，可以注意到，里面记录了在不同的运行目标下应该使用的真实的 System.Drawing.Common.dll 的文件路径：

```json
"runtimeTargets": {
        "runtimes/unix/lib/netcoreapp3.0/System.Drawing.Common.dll": {
        "rid": "unix",
        "assetType": "runtime",
        "assemblyVersion": "4.0.2.0",
        "fileVersion": "4.700.19.56404"
    },
        "runtimes/win/lib/netcoreapp3.0/System.Drawing.Common.dll": {
        "rid": "win",
        "assetType": "runtime",
        "assemblyVersion": "4.0.2.0",
        "fileVersion": "4.700.19.56404"
    }
}
```

去相应的路径下找，可以找到 win 版本的 System.Drawing.Common.dll 和 unix 版本的 System.Drawing.Common.dll。

![win 版本和 unix 版本的 System.Drawing.Common.dll](/static/posts/2020-05-24-13-49-12.png)

其实，这个是 Visual Studio 编译的需要 .NET Core 运行时的 .NET Core 3.1 程序，如果发布出来了，那么这个依赖就直接被替换成了目标平台的依赖 dll 了，就不用对

### 拆包

我们去 <nuget.org> 上下载下来 [System.Drawing.Common](https://www.nuget.org/packages/System.Drawing.Common/) 包拆开来看，会发现这个包有两个很关键的文件夹：

- lib
- runtimes

其中，lib 里面包含这些不同的目标框架：

- MonoAndroid10
- MonoTouch10
- net461
- netstandard2.0
- xamarinios10
- xamarinmac20
- xamarintvos10
- xamarinwatchos10

net461 里包含的 dll 就是前面我们说到的“垫片”，所有的类型都通过 `TypeForwardedTo` 转移到 .NET Framework 版本的 System.Drawing.dll。

netstandard2.0 适用于 .NET Core 框架，里面包含的 dll 就是前面我们说到的所有方法都抛出 `PlatformNotSupportedException` 的版本。

其他所有框架里都是 _._ 文件，是个空的文件，仅用来告诉 NuGet 这个包支持这些框架安装，但不引用任何 dll。

另外，NuGet 包的 runtimes 文件夹里面包含了前面我们说到的 win 和 unix 不同实现版本的 System.Drawing.Common.dll。前面已经给出了反编译的截图，应该足够了解了。你也可以自己去解包，了解里面的目录结构，去反编译看。

### 决定

现在，是时候来决定应该使用 System.Drawing.dll 还是使用 System.Drawing.Common 包了。那么，这里我整理一张表：

|                                 | System.Drawing.dll | System.Drawing.Common                           |
| ------------------------------- | ------------------ | ----------------------------------------------- |
| .NET Framework 4.6 及以下版本   | ✔️                  | ❌                                               |
| .NET Framework 4.6.1 及以上版本 | ✔️                  | ✔️                                               |
| .NET Core 1.x                   | ❌                  | ❌无法安装包                                     |
| .NET Core 2.0 - .NET Core 2.1   | ❌                  | ❌运行时抛出<br/>`PlatformNotSupportedException` |
| .NET Core 3.0 及以上版本        | ❌                  | ✔️                                               |
| Mono / Xamarin                  | ✔️                  | ❌                                               |

✔️表示可以使用，没有问题；❌表示不支持此引用方式。

另外，这里还要额外说一下 Unity 的支持情况。

Unity 有两种不同的 C# 脚本后端可选：Mono 和 IL2CPP。然而 Unity 不能原生支持 NuGet 包，而 System.Drawing.Common 包要能够在编译时自动选择正确的 dll 去引用，是需要 3.4 版本以上的 NuGet 程序来支持的。如果不能完全实现此版本 NuGet 的功能，那么编译时是无法将正确的 dll 拷贝到输出目录的。不幸的是，目前流行于 Unity 的第三方 NuGet 管理器不能正确拷贝此包的 dll 到输出目录。

更具体的，是受以下设置的影响（在编译设置里面）：

![Unity 编译设置](/static/posts/2020-05-24-14-13-20.png)

|       | 脚本后端 | Api 兼容级别      | System.Drawing.dll                  | System.Drawing.Common                  |
| ----- | -------- | ----------------- | ----------------------------------- | -------------------------------------- |
| 组合1 | Mono     | .NET 4.x          | ✔️                                   | ❌相当于没引用                          |
| 组合2 | Mono     | .NET Standard 2.0 | ❌相当于没引用                       | ❌第三方 NuGet 包管理器会拷贝错误的 dll |
| 组合3 | IL2CPP   | .NET 4.x          | ❌可在编辑器运行，但打包后会出现异常 | ❌未引用任何库                          |
| 组合4 | IL2CPP   | .NET Standard 2.0 | ❌相当于没引用                       | ❌第三方 NuGet 包管理器会拷贝错误的 dll |

是不是很悲惨？只有 Mono / .NET 4.x 这个组合可以正常使用 System.Drawing。当然，如果你愿意用部分手工或自己的脚本/工具来代替第三方 NuGet 包的部分功能，选择出正确的 dll 的话，那么对应的方案也是能行的。

表中的“❌相当于没引用”指的是引用此 dll 相当于没引用 dll，安装此包相当于没有引用此包：

```csharp
// .NET 4.x 的 Api 兼容级别报此错误
The type name '{0}' could not be found in the namespace 'System.Drawing'. This type has been forwarded to assembly 'System.Drawing, Version=4.0.0.0, Culture=neutral, PublicKeyToken=b03f5f7f11d50a3a' Consider adding a reference to that assembly.

// .NET Standard 2.0 的 Api 兼容级别报此错误
The type or namespace name 'Imaging' does not exist in the namespace 'System.Drawing' (are you missing an assembly reference?)
```

关于 Unity 的部分，本文不打算细说。如果你有其他疑问，我就挖个坑，再写一篇来填。

## 不依赖 System.Drawing 的其他免费开源库

如果你当前的开发平台依然无法使用到 System.Drawing 命名空间，那么可以考虑使用另外的一些替代品。这里给出一些推荐：

- [SixLabors/ImageSharp: A modern, cross-platform, 2D Graphics library for .NET](https://github.com/SixLabors/ImageSharp)
- [mono/SkiaSharp: SkiaSharp is a cross-platform 2D graphics API for .NET platforms based on Google's Skia Graphics Library. It provides a comprehensive 2D API that can be used across mobile, server and desktop models to render images.](https://github.com/mono/SkiaSharp)

如果你需要的是图像处理，而不需要与 Windows API 有太多关联的话，那么使用这些库会比使用 System.Drawing 带来更优秀的用法、更好的性能以及更现代化的维护方式。

---

**参考资料**

- [Support Full System.Drawing Functionality on .NET Core · Issue #21980 · dotnet/runtime](https://github.com/dotnet/runtime/issues/21980)
- [mono/libgdiplus: C-based implementation of the GDI+ API](https://github.com/mono/libgdiplus)
- [libgdiplus/TODO at master · mono/libgdiplus](https://github.com/mono/libgdiplus/blob/master/TODO)
- [libgdiplus - Mono](https://www.mono-project.com/docs/gui/libgdiplus/)
