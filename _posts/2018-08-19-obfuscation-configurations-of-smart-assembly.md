---
title: "SmartAssembly 中各种混淆（Obfuscation）都是干了些什么"
date: 2018-08-19 16:10:41 +0800
categories: dotnet csharp
---

UWP 程序有 .NET Native 可以将程序集编译为本机代码，逆向的难度会大很多；而基于 .NET Framework 和 .NET Core 的程序却没有 .NET Native 的支持。虽然有 Ngen.exe 可以编译为本机代码，但那只是在用户计算机上编译完后放入了缓存中，而不是在开发者端编译。

于是有很多款混淆工具来帮助混淆基于 .NET 的程序集，使其稍微难以逆向。本文介绍 Smart Assembly 各项混淆参数的作用以及其实际对程序集的影响。

---

本文不会讲 SmartAssembly 的用法，因为你只需打开它就能明白其基本的使用。

感兴趣可以先下载：[.NET Obfuscator, Error Reporting, DLL Merging - SmartAssembly](https://www.red-gate.com/products/dotnet-development/smartassembly/index)

<div id="toc"></div>

### 准备

我们先需要准备程序集来进行混淆试验。这里，我使用 [Whitman](ms-windows-store://pdp/?productid=9P8LNZRNJX85) 来试验。它在 [GitHub 上开源](https://github.com/walterlv/Whitman)，并且有两个程序集可以试验它们之间的相互影响。

![准备程序集](/static/posts/2018-08-19-15-14-44.png)

### SmartAssembly

SmartAssembly 本质上是保护应用程序不被逆向或恶意篡改。目前我使用的版本是 6，它提供了对 .NET Framework 程序的多种保护方式：

- *强签名 Strong Name Signing*
    - 强签名可以确保程序之间的依赖关系是严格确定的，如果对其中的一个依赖进行篡改，将导致无法加载正确的程序集。
    - 微软提供了强签名工具，所以可以无需使用 SmartAssembly 的：
        - [Sn.exe (Strong Name Tool) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/tools/sn-exe-strong-name-tool)
        - [How to: Sign an Assembly with a Strong Name - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/app-domains/how-to-sign-an-assembly-with-a-strong-name)
- *自动错误上报 Automated Error Reporting*
    - SmartAssembly 会自动向 exe 程序注入异常捕获与上报的逻辑。
- *功能使用率上报 Feature Usage Reporting*
    - SmartAssembly 会修改每个方法，记录这些方法的调用次数并上报。
- *依赖合并 Dependencies Merging*
    - SmartAssembly 会将程序集中你勾选的的依赖与此程序集合并成一个整的程序集。
- *依赖嵌入 Dependencies Embedding*
    - SmartAssembly 会将依赖以加密并压缩的方式嵌入到程序集中，运行时进行解压缩与解密。
    - 其实这只是方便了部署（一个 exe 就能发给别人），并不能真正保护程序集，因为实际运行时还是解压并解密出来了。
- *裁剪 Pruning*
    - SmartAssembly 会将没有用到的字段、属性、方法、事件等删除。它声称删除了这些就能让程序逆向后代码更难读懂。
- **名称混淆 Obfuscation**
    - 修改类型、字段、属性、方法等的名称。
- **流程混淆 Control Flow Obfuscation**
    - 修改方法内的执行逻辑，使其执行错综复杂。
- **动态代理 References Dynamic Proxy**
    - SmartAssembly 会将方法的调用转到外部程序集动态代理。
- **资源压缩与加密 Resources Compression and Encryption**
    - SmartAssembly 会将资源以加密并压缩的方式嵌入到程序集中，运行时进行解压缩与解密。
- **字符串编码 Strings Encoding**
    - SmartAssembly 会将字符串都进行加密，运行时自动对其进行解密。
- **防止 MSIL Disassembler 对其进行反编译 MSIL Disassembler Protection**
    - 在程序集中加一个 Attribute，这样 MSIL Disassembler 就不会反编译这个程序集。
- *密封类*
    - 如果 SmartAssembly 发现一个类可以被密封，就会把它密封，这样能获得一点点性能提升。
- *生成调试信息 Generate Debugging Information*
    - 可以生成混淆后的 pdb 文件

以上所有 SmartAssembly 对程序集的修改中，我标为 **粗体** 的是真的在做混淆，而标为 *斜体* 的是一些辅助功能。

后面我只会说明其混淆功能。

### 名称混淆


