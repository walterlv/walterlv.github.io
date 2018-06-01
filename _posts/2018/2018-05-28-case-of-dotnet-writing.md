---
title: ".NET Standard / dotnet-core / net472 —— .NET 究竟应该如何大小写，前面的 “.” 应该何去何从？"
date_published: 2018-05-28 16:23:49 +0800
date: 2018-05-31 20:17:47 +0800
categories: dotnet
---

本文将解释在 .NET 技术栈中各种不同使用方式下 N E T 三个字母何时大写何时小写；前面的 “.” 什么时候加上，什么时候去掉，什么时候又使用 “dot”。

---

<div id="toc"></div>

### .NET 在技术文档中

如果你阅读过 <https://docs.microsoft.com/zh-cn/dotnet/> 中的多数 .NET 技术文档，你应该几乎已经注意到了，在所有对大小写敏感的地方，NET 三个字母都是大写的。

“.NET” 是 .NET 技术栈名称的最官方写法了，如果能写出 “.NET” 且不会产生其他问题的地方，都应该使用 “.NET”。

![.NET 文档标题](/static/posts/2018-05-28-15-45-53.png)  
▲ 首先映入眼帘的，便是 .NET 技术栈中的所有文档标题

### .NET 在代码中

.NET 在代码中并不符合 PascalCase 对命名规范的大小写建议。一般来说三个字母无论是单个单词还是多个单词的缩写，在 PascalCase 中都应该是首字母大写，其后全部小写。但在微软的代码中，NET 依然都是全大写的。

例如 `Microsoft.NET.Sdk`，去 [dotnet/sdk - GitHub](https://github.com/dotnet/sdk/tree/master/src/Tasks/Microsoft.NET.Build.Tasks/targets) 上看，写法都是 NET 全大写的。

### .NET 在标识符中

其实，我这里想说的标识符并不是指类名或方法名，那是上一节 [.NET 在代码中](/post/case-of-dotnet-writing.html#net-%E5%9C%A8%E4%BB%A3%E7%A0%81%E4%B8%AD) 所说的内容。这里想说的是，当 .NET 作为用于识别 .NET 某种特征所用的标识符。一般这种标识符有一些命名限制（例如 “.” 开头经常就不符合限制）。

通常作为这种类型的标识符是大小写不敏感的，于是，微软在文档中对此的惯用写法是**全部小写**。

例如，在 Url 中：

- <https://docs.microsoft.com/zh-cn/dotnet/>

前面的 “.” 被改写成了 “dot”。

例如，在项目的目标框架中作为标识符使用时：

- `netstandard2.0`
- `netcoreapp2.1`
- `net472`

这时，连前面的 “.” 都直接去掉了。

### .NET 在文件系统中

在文件系统中，“.” 作为前缀的文件或文件夹在 OSX 和 Linux 上都是有特殊用途的，代表隐藏文件夹。这意味着如果没有特别的安排，尽量不要为常规文件夹使用 “.” 作为前缀。

这就意味着，如果你想建一个 .NET 文件夹，你应该去掉前面的 “.”。可是去掉之后的辨识度就太低了，看不出来是 .NET 技术栈。那么怎么命名呢？

这里给一些建议：

- `dotNET` 适用于有大小写规范的命名中（例如为了跟 Windows/Android/iOS/OSX 这样的名称保持统一）
- `dotnet` 适用于作为普通标识符的命名中（例如为了跟 windows/android/ios/osx 这样的名称保持统一）
- `net` 适用于使用缩写的命名中（例如为了跟 win/android/ios/osx 这样的名称保持统一）

### .NET 作为产品或机构名称的一部分

JetBrains 家的 .NET 团队很喜欢用 `dot` 作为软件名称的前缀，例如 dotCover、dotMemory、dotPeek、dotTrace。去 [JetBrains: Developer Tools for Professionals and Teams](https://www.jetbrains.com/) 看看很快就能找到这几款软件的名称。

.NET Core 开源峰会使用 dnc 这样奇怪的缩写，代表 dotnet-core。

### 总结

合理的 .NET 写法有这些：

- `.NET` *推荐*
- `NET`
- `dotNET`
- `dotnet`
- `net`

如果与其他相关技术名词进行组合：

- `.NET Core`
- `ML.NET`
- `Microsoft.NET.Sdk`
- `dotnet-standard`
- `net472`
