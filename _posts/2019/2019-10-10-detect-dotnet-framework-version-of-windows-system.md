---
title: ".NET/C# 检测电脑上安装的 .NET Framework 的版本"
date: 2019-10-10 16:51:58 +0800
tags: dotnet csharp
position: knowledge
coverImage: /static/posts/2019-10-10-14-57-02.png
permalink: /post/detect-dotnet-framework-version-of-windows-system.html
---

如果你希望知道某台计算机上安装了哪些版本的 .NET Framework，那么正好本文可以帮助你解决问题。

---

<div id="toc"></div>

## 如何找到已安装的 .NET Framework

有的电脑的 .NET Framework 是自带的，有的是操作系统自带的。这样，你就不能通过控制面板的“卸载程序”去找到到底安装了哪个版本的 .NET Framework 了。

关于各个版本 Windows 10 上自带的 .NET Framework 版本，可以阅读 [各个版本 Windows 10 系统中自带的 .NET Framework 版本 - walterlv](/post/embeded-dotnet-version-in-all-windows)。

而如果通过代码 `Environment.Version` 来获取 .NET 版本，实际上获取的是 CLR 的版本，详见 [使用 PowerShell 获取 CLR 版本号 - walterlv](/post/powershell/2017/09/28/get-clr-version-via-powershell.html)。

这些版本号是不同的，详见 [.NET Framework 4.x 程序到底运行在哪个 CLR 版本之上 - walterlv](/dotnet/2017/09/22/dotnet-version.html)。

那么如何获取已安装的 .NET Framework 的版本呢？最靠谱的方法竟然是通过读取注册表。

## 注册表位置和含义

读取位置在这里：

```powershell
计算机\HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\NET Framework Setup\NDP\v4\Full\2052
```

![注册表位置](/static/posts/2019-10-10-14-57-02.png)

而唯一准确能够判定 .NET Framework 版本的，只有里面的 `Release` 值。但可惜的是，这个值并不能直接看出来到底是 4.5 还是 4.8。我们需要有一张对应表。

我把它整理成了字典和注释，这样会比较容易理解每个编号对应的 .NET Framework 版本代号。

```csharp
/// <summary>
/// 获取 .NET Framework 4.5 及以上版本的发行号与版本名称的对应关系。
/// 4.5 及以下版本没有这样的对应关系。
/// </summary>
private static readonly Dictionary<int, string> ReleaseToNameDictionary = new Dictionary<int, string>
{
    // .NET Framework 4.5
    { 378389, "4.5" },
    // .NET Framework 4.5.1（Windows 8.1 或 Windows Server 2012 R2 自带）
    { 378675, "4.5.1" },
    // .NET Framework 4.5.1（其他系统安装）
    { 378758, "4.5.1" },
    // .NET Framework 4.5.2
    { 379893, "4.5.2" },
    // .NET Framework 4.6（Windows 10 第一个版本 1507 自带）
    { 393295, "4.6" },
    // .NET Framework 4.6（其他系统安装）
    { 393297, "4.6" },
    // .NET Framework 4.6.1（Windows 10 十一月更新 1511 自带）
    { 394254, "4.6.1" },
    // .NET Framework 4.6.1（其他系统安装）
    { 394271, "4.6.1" },
    // .NET Framework 4.6.2（Windows 10 一周年更新 1607 和 Windows Server 2016 自带）
    { 394802, "4.6.2" },
    // .NET Framework 4.6.2（其他系统安装）
    { 394806, "4.6.2" },
    // .NET Framework 4.7（Windows 10 创造者更新 1703 自带）
    { 460798, "4.7" },
    // .NET Framework 4.7（其他系统安装）
    { 460805, "4.7" },
    // .NET Framework 4.7.1（Windows 10 秋季创造者更新 1709 和 Windows Server 1709 自带）
    { 461308, "4.7.1" },
    // .NET Framework 4.7.1（其他系统安装）
    { 461310, "4.7.1" },
    // .NET Framework 4.7.2（Windows 10 2018年四月更新 1803 和 Windows Server 1803 自带）
    { 461808, "4.7.2" },
    // .NET Framework 4.7.2（其他系统安装）
    { 461814, "4.7.2" },
    // .NET Framework 4.8（Windows 10 2019年五月更新 1903 自带）
    { 528040, "4.8" },
    // .NET Framework 4.8（其他系统安装）
    { 528049, "4.8" },
};
```

另外，还有一些值也是有意义的（只是不那么精确）：

- 主版本
    - 也就是可以共存的版本，比如 v3.5 系列和 v4 系列就是可以共存的，它们分别是就地更新的保持兼容的版本
- 发行版本名称
    - 完整版 Full 和精简版 Client
- 版本号
    - 比如 3.5.30729.4926 或者 4.7.02556
- 服务包版本
    - 古时候的微软喜欢用 SP1 SP2 来命名同一个版本的多次更新，这也就是那个年代的产物

它们分别在注册表的这些位置：

- 主版本
    - `计算机\HKEY_LOCAL_MACHINE\SOFTWARE\Microsoft\NET Framework Setup\NDP` 里项的名称
- 发行版本名称
    - 以上项里子项的名称
- 版本号
    - 以上项里的 `Version` 值
- 服务包版本
    - 以上项里的 `SP` 值

## 读取注册表

在上面已经梳理了读取注册表的位置之后，相信你可以很容易写出读取已安装 .NET Framework 版本的代码出来。

我已经将其做成了 NuGet 源代码包（[使用 SourceYard 打包](https://blog.lindexi.com/post/sourceyard-%E5%88%B6%E4%BD%9C%E6%BA%90%E4%BB%A3%E7%A0%81%E5%8C%85)），你可以安装 NuGet 包来获得读取已安装 .NET Framework 版本的功能：

- [NuGet Gallery - Walterlv.Environment.Source](https://www.nuget.org/packages/Walterlv.Environment.Source/)

或者在 GitHub 查看源代码：

- [Walterlv.Packages/NdpInfo.cs at master · walterlv/Walterlv.Packages](https://github.com/walterlv/Walterlv.Packages/blob/master/src/Utils/Walterlv.Environment/NdpInfo.cs)

只有一个类型——`NdpInfo`。

使用方法有两种。

第一种，获取当前计算机上所有已经安装的 .NET Framework 版本：

```csharp
var allVersions = await NdpInfo.ReadFromRegistryAsync();
```

执行完成之后看看得到的字典 `allVersions` 如下：

![已安装的全部 .NET Framework](/static/posts/2019-10-10-16-39-25.png)

字典里 Key 是不能共存的主版本，Value 是这个主版本里当前已经安装的具体版本信息。

如果直接使用 `ToString()`，是可以生成我们平时经常在各大文档或者社区使用的 .NET Framework 的名称。

第二种，获取当前已安装的最新的 .NET Framework 版本名称：

```csharp
var currentVersion = NdpInfo.GetCurrentVersionName();
```

这可以直接获取到一个字符串，比如 `.NET Framework 4.8`。对于只是简单获取一下已安装名称而不用做更多处理的程序来说会比较方便。


