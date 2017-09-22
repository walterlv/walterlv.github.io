---
layout: post
title: ".Net Framework 4.x 程序到底运行在哪个 CLR 版本之上"
date_created: 2017-09-22 18:05:00 +0800
date: 2017-09-22 21:42:14 +0800
categories: dotnet
keywords: dotnet version sku runtime
description: 了解 .Net Framework 的公共语言运行时版本，这与 .Net Framework 基础库的版本是不一样的。
---

当我们编译程序目标框架选为 .Net Framework 4.5/4.6/4.7 时，CLR 运行时是如何判断我们究竟应该用哪一个 .Net Framework 呢？.Net Framework 的版本到底由哪些部分组成？我们编译 .Net Framework 时选择的版本决定了什么？

---

让我对这个问题产生兴趣的原因是：
- 我将程序编译的目标框架选为 .Net Framework 4.7；在一台安装了 .Net Framework 4.6 的电脑上提示缺少 .Net Framework 4.7；删除了随编译一起生成的 `app.config` 文件后程序能够正常运行。
- 另一个程序，我明明将程序编译的目标框架选为 .Net Framework 4.5，但在一台没有安装任何额外 .Net Framework 的 Windows 7 的电脑上提示缺少的是 .Net Framework 4.0。

这里的疑点在于为什么以上两种看似类似的情况，提示的框架版本却不同。其中的 `app.config` 文件成为了调查此问题的突破口。

### 配置支持的运行时

观察程序附带的 `app.config` 文件，我们发现支持的运行时版本是 v4.0，sku 版本是 4.7。

```xml
<configuration>  
   <startup>  
      <supportedRuntime version="v4.0" sku=".NETFramework,Version=v4.7" />  
   </startup>  
</configuration>  
```

疑点：
1. 为什么我们基于 .Net Framework 4.7 开发的程序运行时版本是 4.0？
1. sku 是什么？

微软的官方文档给了我们解答：[supportedRuntime Element](https://docs.microsoft.com/en-us/dotnet/framework/configure-apps/file-schema/startup/supportedruntime-element)。

- `version`：用于指定此应用程序支持的公共语言运行时（CLR）的版本。
- `sku`：stock-keeping unit（官方中文为“库存单位”，然而依然不懂这个词的意思），用于指定此应用程序支持的 .Net Framework 发行版本。

`version` 的值可取：

|.NET Framework 版本|`version` 值|
-|-
忽略早期版本|忽略早期版本
2.0|"v2.0.50727"
3.0|"v2.0.50727"
3.5|"v2.0.50727"
3.5|"v2.0.50727"
4.0-4.7|"v4.0"

`sku` 的值可取：

|.NET Framework version|`sku` 值|
-|-
4.0|".NETFramework,Version=v4.0"
忽略中间版本|忽略中间版本
4.5|".NETFramework,Version=v4.5"
4.5.1|".NETFramework,Version=v4.5.1"
4.5.2|".NETFramework,Version=v4.5.2"
4.6|".NETFramework,Version=v4.6"
4.6.1|".NETFramework,Version=v4.6.1"
4.6.2|".NETFramework,Version=v4.6.2"
4.7|".NETFramework,Version=v4.7"

于是我们发现，其实无论我们将程序的目标框架选为 .Net Framework 的哪一个 4.x 版本，CLR 运行时都是用 v4.0 表示的。微软的描述是：

> 对于支持 .NET Framework 4.0 或更高版本的应用程序，version 属性指示 CLR 版本，这是 .NET Framework 4 及更高版本的通用版本，而 sku 属性指示应用程序所针对的单个 .NET Framework 版本。

其实看到这里我们就能有一个看似不错的解释：
1. 无论我们选择的目标框架是 .Net Framework 4.x 的哪一个版本，用于指定 CLR 运行时版本的 `version` 值都是 v4.0；
1. CLR 运行时会根据配置文件的 `sku` 值决定应该采用那一组运行库来为程序运行提供支持。

### .Net Framework 的组成以及各部分的版本

我们需要寻找到 .Net Framework 的本质，不然如此错综复杂的版本号系统真把我搞懵了。

微软在 [.NET Framework Versions and Dependencies](https://docs.microsoft.com/en-us/dotnet/framework/migration-guide/versions-and-dependencies) 中说到：

> 每个版本的 .NET framework 都包含公共语言运行时 (CLR)、基础库和其他托管库。 

于是我们谈论 .Net Framework 的版本其实应该分三个不同的部分来谈：

> 每个新版本的 .NET Framework 都会保留早期版本中的功能并会添加新功能。 CLR 由其自己的版本号标识。 虽然 CLR 版本并不总是递增的，但 .NET Framework 版本号在每次发布时都会递增。 例如，.NET Framework 4、4.5 和更高版本包含 CLR 4，而 .NET Framework 2.0、3.0 和 3.5 包含 CLR 2.0。 （没有版本 3 的 CLR。）

从官方文档给出的表格当中我们可以确信：**.Net Framework 4.0/4.5/4.6/4.7 包含的 CLR 版本都是 4.0。**

### CLR 的更新

然而，不相信微软的 CLR 可以完全没有 BUG，既然 CLR 版本都是 4.0，那么微软对 CLR 运行时的更新怎么处理？安装了 .Net Framework 4.5/4.6/4.7 会如何提升 CLR 的稳定性和安全性？

在 [Targeting and Running .NET Framework apps for version 4.5 and later](https://docs.microsoft.com/en-us/dotnet/framework/migration-guide/versions-and-dependencies#targeting-and-running-net-framework-apps-for-version-45-and-later) 中，解释了 CLR 的更新机制——就地更新（in-place update）。这篇文章 [.NET 4.5 is an in-place replacement for .NET 4.0](https://weblog.west-wind.com/posts/2012/Mar/13/NET-45-is-an-inplace-replacement-for-NET-40) 对这种就地更新方式有比官方文档更详细的解释，并且还附带自己的一些试验（含代码）。不过文章是 2012 年写的，部分结论现在看来已经过时（因为在我的 Windows 10 配 .Net Framework 4.7 上结论已经不一样），不过对我理解就地更新本身非常有帮助，也为后续调查提供了更清晰的思路。

微软对 .Net Framework 4.x 框架就地更新的说明是：

> .NET Framework 4.5 是替代计算机上的 .NET Framework 4 的就地更新，同样，.NET Framework 4.5.1 4.5.2、4.6、4.6.1、4.6.2 和 4.7 是对 .NET Framework 4.5 的就地更新，这意味着它们将使用相同的运行时版本，但是程序集版本会更新并包括新类型和成员。 在安装其中某个更新后，你的 .NET Framework 4.NET Framework 4.5 或 .NET Framework 4.6 应用应继续运行，而无需重新编译。 但是，反过来则不行。

也就是说，**无论我们在开发时指定目标框架的版本是 4.x 的哪一个，在运行时，CLR 环境都是 4.0**。但是新的 .Net Framework 会带来更新版本的 CLR，这个 CLR 会直接替换掉旧的 CLR。[.NET 4.5 is an in-place replacement for .NET 4.0](https://weblog.west-wind.com/posts/2012/Mar/13/NET-45-is-an-inplace-replacement-for-NET-40) 文章中 .Net Framework 基础库也是就地更新的；但我实际实验的情况是每一个不同的 .Net Framework 基础库有自己单独的文件夹，目前尚不清楚这个改变是从 .Net Framework 的哪一个版本开始的，但一定是 4.5.1、4.5.2、4.6 这三个版本中的一个。

![每一个不同的 .Net Framework 基础库有自己单独的文件夹](/assets/2017-09-22-21-39-42.png)

### 解决一开始的疑问

于是，本文一开始的疑问就全部明晰了：
1. 不管是 .Net Framework 4.5 的还是 4.7 的那两个程序，都是靠 4.0 版本的公共语言运行时（CLR）运行起来的；
1. 如果没有安装 4.0 版本的 CLR，则会弹出提示需要安装 .Net Framework 4.0 版本才能运行，而不管我们的程序目标框架是 .Net Framework 4.x 的哪一个版本；
   - 虽然说文案说的是 .Net Framework，但其实需要的是 CLR
1. 如果已经安装有 4.0 版本的 CLR（可能随 .Net Framework 4.5/4.6 安装），我们程序的目标框架是 .Net Framework 4.7，但 .Net Framework 基础库并没有安装 4.7 版本，则运行时会提示需要安装 .Net Framework 4.7；
   - 这个提示是 4.0 版的 CLR 弹出的，是根据 `supportedRuntime` 中指定的 `sku` 值来决定的

#### 参考资料

- [supportedRuntime Element - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/configure-apps/file-schema/startup/supportedruntime-element)
- [.NET Framework Versions and Dependencies - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/migration-guide/versions-and-dependencies#targeting-and-running-net-framework-apps-for-version-45-and-later)
- [.NET 4.5 is an in-place replacement for .NET 4.0 - Rick Strahl's Web Log](https://weblog.west-wind.com/posts/2012/Mar/13/NET-45-is-an-inplace-replacement-for-NET-40)
- [app config - What does "SKU" (attribute) mean in C#? - Stack Overflow](https://stackoverflow.com/questions/17148496/what-does-sku-attribute-mean-in-c)
- [.net - What happens if I remove the auto added supportedRuntime element? - Stack Overflow](https://stackoverflow.com/questions/21566528/what-happens-if-i-remove-the-auto-added-supportedruntime-element)
