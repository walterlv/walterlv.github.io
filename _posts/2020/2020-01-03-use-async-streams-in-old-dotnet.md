---
title: "如何在旧版本的 .NET Core / Framework 中使用 C# 8 的异步流（IAsyncDisposable / IAsyncEnumerable / IAsyncEnumerator）"
date: 2020-01-03 17:17:34 +0800
tags: dotnet csharp
position: knowledge
---

C# 8.0 为我们带来了异步流，可以使用 `async foreach`，不过使用此语法需要 `IAsyncEnumerable` / `IAsyncEnumerator` 类型。本文介绍如何在旧版本的 .NET Framework 和旧版本的 .NET Core 中获得此类型。

---

<div id="toc"></div>

## 异步流所需版本

异步流需要 .NET Core 3.0 及以上版本才能直接支持。而如果是 .NET Framework，则是任何版本都不直接支持。

如果需要在早期版本使用异步流，需要安装 Microsoft.Bcl.AsyncInterfaces 这个 NuGet 包。这就像在早期版本中使用 `ValueTuple` 需要安装 [System.ValueTuple](https://www.nuget.org/packages/System.ValueTuple/) 一样。

## 安装 Microsoft.Bcl.AsyncInterfaces

需要先在你的项目中安装 NuGet 包：

[Microsoft.Bcl.AsyncInterfaces](https://www.nuget.org/packages/Microsoft.Bcl.AsyncInterfaces/)

```xml
<PackageReference Include="Microsoft.Bcl.AsyncInterfaces" Version="1.1.0" />
```

安装此包之后，即可在你的项目当中开启异步流的支持。

一点说明：异步流中使用到了 `ValueTask`，此类型需要 [System.Threading.Tasks.Extensions](https://www.nuget.org/packages/System.Threading.Tasks.Extensions) 包的支持。在 .NET Framework 4.8 以下会自动额外引入此包。

## 使用异步流

### 定义支持异步流的方法

```csharp
private async IAsyncEnumerable<string> EnumerateTestsAsync()
{
    for (var i = 0; i < 3; i++)
    {
        await Task.Delay(100).ConfigureAwait(false);
        yield return $"欢迎访问吕毅的博客，第 {i} 页";
    }
}
```

### 使用 await foreach

直接使用 `await foreach` 即可使用 C# 8.0 带来的异步流。

```csharp
var verify = 0;
await foreach (var i in EnumerateTestsAsync())
{
    Assert.AreEqual(verify, i);
    verify++;
}
Assert.AreEqual(3, verify);
```

## 额外说明

记得如果你在 .NET Framework 4.8 或以下版本，.NET Core 3.0 以下版本编写代码时，自动启用的 C# 语言版本是 7.3，所以你需要额外为你的项目启用 C# 8.0 才行。

```xml
<LangVersion>latest</LangVersion>
```

另外，由于 `ValueTask` 要求的最低 .NET Framework 版本为 4.5.2，所以如果使用更低版本的 .NET Framework，将无法使用异步流。

---

**参考资料**

- [Async streams - C# 8.0 specification proposals - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/csharp/language-reference/proposals/csharp-8.0/async-streams)
- [Using async disposable and async enumerable in frameworks older than .NET Core 3.0 - StrathWeb. A free flowing web tech monologue.](https://www.strathweb.com/2019/11/using-async-disposable-and-async-enumerable-in-frameworks-older-than-net-core-3-0/)
