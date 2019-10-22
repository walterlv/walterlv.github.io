---
title: ".NET 实现 NTFS 文件系统的硬链接 mklink /J（Junction）"
publishDate: 2019-10-20 22:04:46 +0800
date: 2019-10-22 14:04:24 +0800
categories: dotnet windows csharp
position: knowledge
---

我们知道 Windows 系统 NTFS 文件系统提供了硬连接功能，可以通过 `mklink` 命令开启。如果能够通过代码实现，那么我们能够做更多有趣的事情。

本文提供使用 .NET/C# 代码创建 NTFS 文件系统的硬连接功能（目录联接）。

---

<div id="toc"></div>

## 目录联接

以管理员权限启动 CMD（命令提示符），输入 `mklink` 命令可以得知 mklink 的用法。

```powershell
C:\WINDOWS\system32>mklink
创建符号链接。

MKLINK [[/D] | [/H] | [/J]] Link Target

        /D      创建目录符号链接。默认为文件
                符号链接。
        /H      创建硬链接而非符号链接。
        /J      创建目录联接。
        Link    指定新的符号链接名称。
        Target  指定新链接引用的路径
                (相对或绝对)。
```

我们本次要用 .NET/C# 代码实现的是 `/J` 目录联接。实现的效果像这样：

![目录联接](/static/posts/2019-10-19-17-45-41.png)

这些文件夹带有一个“快捷方式”的角标，似乎是另一些文件夹的快捷方式一样。但这些与快捷方式的区别在于，应用程序读取路径的时候，目录联接会成为路径的一部分。

比如在 `D:\Walterlv\NuGet\` 中创建 `debug` 目录联接，目标设为 `D:\Walterlv\DemoRepo\bin\Debug`，那么，你在各种应用程序中使用以下两个路径将被视为同一个：

- `D:\Walterlv\NuGet\debug\DemoRepo-1.0.0.nupkg`
- `D:\Walterlv\DemoRepo\bin\Debug\DemoRepo-1.0.0.nupkg`

或者这种：

- `D:\Walterlv\NuGet\debug\publish\`
- `D:\Walterlv\DemoRepo\bin\Debug\publish\`

## 使用 .NET/C# 实现

本文的代码主要参考自 [jeff.brown](https://www.codeproject.com/script/Membership/View.aspx?mid=1994253) 在 [Manipulating NTFS Junction Points in .NET - CodeProject](https://www.codeproject.com/Articles/15633/Manipulating-NTFS-Junction-Points-in-NET) 一文中所附带的源代码。

由于随时可能更新，所以你可以前往 GitHub 仓库打开此代码：

- [walterlv.demo/JunctionPoint.cs at master · walterlv/walterlv.demo](https://github.com/walterlv/walterlv.demo/blob/master/Walterlv.Demo.MkLink/Walterlv.Demo.MkLink/JunctionPoint.cs)

## 使用 JunctionPoint

如果希望在代码中创建目录联接，则直接使用：

```csharp
JunctionPoint.Create("walterlv.demo", @"D:\Developments", true);
```

后面的 `true` 指定如果目录联接存在，则会覆盖掉原来的目录联接。

---

**参考资料**

- [windows - What the C# equivalent of "mklink /J"? - Stack Overflow](https://stackoverflow.com/q/11156754/6233938)
- [Manipulating NTFS Junction Points in .NET - CodeProject](https://www.codeproject.com/Articles/15633/Manipulating-NTFS-Junction-Points-in-NET)
- [Reparse Points - Windows applications - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/fileio/reparse-points)
