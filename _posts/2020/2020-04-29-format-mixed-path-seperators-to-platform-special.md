---
title: ".NET 将混合了多个不同平台（Windows / Mac / Linux）的文件/目录的路径格式化成同一个平台下的路径"
publishDate: 2020-04-29 21:45:43 +0800
date: 2020-04-30 09:24:04 +0800
tags: dotnet windows linux
position: problem
---

Windows 下的路径分隔符是 `\` 而 Linux 和 Mac 下的路径分隔符是 `\`。正常如果你的数据不跨 Windows 和 Linux 平台流通的话，不怎么会遇到多种换行符并存的问题的。但如果真发生了流通，那么如何将它们格式化为统一的当前平台认识的分隔符呢？

---

<div id="toc"></div>

## 现有方案

### 没有原生方案（.NET）

`System.IO.Path` 带了一堆方法用来处理路径。各大文档博客和书籍也都推荐大家使用 `Path` 来处理路径字符串的拼接、拆分和提取等，这可以很大程度避免不同遭遇不同平台下路径分隔字符串不一致导致的各种问题。

不过，本文想告诉大家的是，`Path` 处理路径字符串也不是万能的，这体现在处理跨操作系统的路径字符串时。

现在，我列举了 6 个不同的路径字符串：

```csharp
var part0 = @"/mnt/d/walterlv/";
var part1 = @"D:\walterlv\";

var part2 = @"Foo/Bar.cs";
var part3 = @"Foo\Bar.cs";

var part4 = @"/mnt/d/walterlv/Foo/Bar.cs";
var part5 = @"D:\walterlv\Foo\Bar.cs";
```

分成三组。前两个是路径的前半部分，中间两个是路径的后半部分，最后两个是完整路径。每组里面，前者是 Linux 风格的路径分隔符，后者是 Windows 风格的路径分隔符。

现在，我将试图将以下几种混合情况下的路径拼接使用 `Path` 可能格式化的方法输出出来：

```csharp
// 看看 Linux 风格和 Windows 风格直接拼接的换行符使用 Path.Combine 能否格式化成功。
var pathFromCombine0 = Path.Combine(part0, part3);
var pathFromCombine1 = Path.Combine(part1, part2);
Console.WriteLine($"Path.Combine(part0, part3) = {pathFromCombine0}");
Console.WriteLine($"Path.Combine(part1, part2) = {pathFromCombine0}");

// 通过 Path.GetFullPath 转相对路径到完整路径时，看看能否将路径格式化成当前平台。
var pathFromFull0 = Path.GetFullPath(part2);
var pathFromFull1 = Path.GetFullPath(part3);
Console.WriteLine($"Path.GetFullPath(part2) = {pathFromFull0}");
Console.WriteLine($"Path.GetFullPath(part3) = {pathFromFull1}");

// 通过 new FileInfo(file).FullName 的一层转换看看能否将混合路径格式化成当前平台。
var pathFromFileInfo0 = new FileInfo(pathFromCombine0).FullName;
var pathFromFileInfo1 = new FileInfo(pathFromCombine1).FullName;
Console.WriteLine($"FileInfo(part0 + part3).FullName = {pathFromFileInfo0}");
Console.WriteLine($"FileInfo(part1 + part2).FullName = {pathFromFileInfo1}");

// 通过 new FileInfo(file).FullName 的一层转换看看能否将非当前平台的路径格式化成当前平台。
var pathFromFileInfo2 = new FileInfo(part4).FullName;
var pathFromFileInfo3 = new FileInfo(part5).FullName;
Console.WriteLine($"Path.GetFullPath(part4) = {pathFromFileInfo2}");
Console.WriteLine($"Path.GetFullPath(part5) = {pathFromFileInfo3}");
```

猜猜以上代码在 Windows 和 Linux 平台会输出什么？

看图！

![Windows 和 Linux 平台下的输出](/static/posts/2020-04-29-20-54-33.png)

图是拼接的，上面一半是 Windows 平台下的运行结果，下面一半是 Linux Ubuntu 18.04 发行版的运行结果。运行时是 .NET Core 3.1。

可以发现这些点：

1. `Path.Combine` 的路径拼接仅决定如何合并两段字符串，不会将已有的路径格式化成当前平台的路径分隔符。
2. `Path.GetFullPath` 在生成完整路径的时候，虽然补全的部分是当前平台的，但已有的部分依然是原本字符串。
3. `new FileInfo().FullName` 在 Windows 平台下可以完美将路径字符串统一成 Windows 平台的风格；但在 Linux 平台上不会统一，已有的 `\` 不会变成 `/`；无论是拼接的字符串，还是原本别的平台的字符串，都是一样的结论。

### 为什么 .NET 原生不做统一化？

看前面结论可知，在 Windows 平台下是可以将 `/` 和 `\` 全部格式化成 Windows 平台的 `\` 的，但 Linux 下却不行。

这并不是因为 .NET 没去做，而是无法做！

在 Linux 下，**`\` 是合理的文件名**！

另外，路径经常使用在 Shell 中，而**在 Shell 中，`\` 是个转义字符**！

例如，你可以有一个文件，名字是 `foo\bar.txt`。

所以，.NET 绝对不能擅自给你将 `\` 当作路径分隔符进行格式化！

关于 `\` 在 Linux Shell 中的转义，你可以阅读我的另外两篇博客了解：

- [了解 Windows/Linux 下命令行/Shell 启动程序传参的区别，这下不用再担心 Windows 下启动程序传参到 Linux 下挂掉了 - walterlv](/post/typing-difference-among-shells-in-different-operating-systems.html)

## 自己实现

知道了 Linux 是合理的文件名后，当然不能再指望有某个通用的解决方法了。因为通用代码不可能知道在你的上下文下，`\` 是否是合理的文件名。在信息不足的情况下，前面 .NET 的 `new FileInfo().FullName` 已经是最好的解决方案了。

所以，如果你明确这些不同种类的路径字符串的来源你都清楚（没错，就是你自己挖出来的坑），拼接出来之后的后果你才能知道是否是符合业务的。这时你才应该决定是否真的要做路径的格式化。

### 简单省事型

```csharp
var path = path
    .Replace('/', Path.DirectorySeparatorChar)
    .Replace('\\', Path.DirectorySeparatorChar);
```

### 高性能型

自己实现去。

## 如何避免

从前面的分析可以知道，如果每个框架、库还有业务开发者都不去作死把平台特定的路径传递到其他平台，那么根本就不会存在不同平台的路径会拼接的情况。

另外，开发者也不应该随便在代码中写死 `/` 或者 `\\` 作为路径的分隔符。

就这样……

---

**参考资料**

- [How to enable linux support double backslashes "\\" as the path delimiter - Stack Overflow](https://stackoverflow.com/a/9734782/6233938)
