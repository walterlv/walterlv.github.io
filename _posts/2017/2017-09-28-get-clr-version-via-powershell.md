---
layout: post
title: "使用 PowerShell 获取 CLR 版本号"
date: 2017-09-28 00:24:08 +0800
categories: powershell
permalink: /post/powershell/2017/09/28/get-clr-version-via-powershell.html
keywords: PowerShell CLR Version Environment
description: 
---

在我之前写的一篇文章[.NET Framework 4.x 程序到底运行在哪个 CLR 版本之上](/dotnet/2017/09/22/dotnet-version.html)中，我们说到 CLR 版本和 .NET Framework 基础库之间是有差别的，其版本号更是有差别的。不过其中并没有给出方法获取 CLR 的版本号。本文将给出几种方便的获取 CLR 版本号的方法。

---

## 写代码获取

.NET Framework 的 `System.Environment` 类型的 `Version` 属性直接可以获取到版本号。于是只需要简单写一个控制台程序即可获取。

```csharp
Console.WriteLine($"{Environment.Version}");
```

以上只写关键的一行，其他类啊、`Main` 函数啊、`Console.ReadKey` 的都自行脑补即可。因为这不是本文重点。

在我的 Windows 10 创造者更新 1703 上得到的结果是：`4.0.30319.42000`。

## 用 PowerShell 获取

考虑到 PowerShell 可以直接使用到 .NET Framework 中的类型，于是上面的代码很容易直接翻译成 PowerShell 脚本：

```powershell
PS C:\Users\lvyi> [Environment]::Version

Major  Minor  Build  Revision
-----  -----  -----  --------
4      0      30319  42000
```

上面的第一行是脚本，后面全是输出，本文之后的 PowerShell 代码部分都是这样。

可以看到，虽然格式不同，但依然拿到了跟我们写代码一模一样的结果。

**本文只是一个引子，你可以拿着 PowerShell 去调用其他 .NET Framework 的类和方法，根本不需要打开 Visual Studio 编译，非常方便！**

不过既然是 PowerShell，那就有更多可以尝试的方法，比如说直接拿 PowerShell 的全局变量：

```powershell
PS C:\Users\lvyi> $PSVersionTable

Name                           Value
----                           -----
PSVersion                      5.1.15063.608
PSEdition                      Desktop
PSCompatibleVersions           {1.0, 2.0, 3.0, 4.0...}
BuildVersion                   10.0.15063.608
CLRVersion                     4.0.30319.42000
WSManStackVersion              3.0
PSRemotingProtocolVersion      2.3
SerializationVersion           1.1.0.1
```

如果觉得杂乱项太多，直接取里面的 `CLRVersion` 即可：

```powershell
PS C:\Users\lvyi> $PSVersionTable.CLRVersion

Major  Minor  Build  Revision
-----  -----  -----  --------
4      0      30319  42000
```
