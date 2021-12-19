---
title: ".NET Standard 的管理策略"
date: 2018-07-08 22:28:41 +0800
tags: dotnet
permalink: /posts/net-standard-governance.html
---

.NET Standard 作为各大 .NET 的标准，我们有必要了解一下它是如何在各种 .NET 的实现之间履行自己的职责的。所以，本文会说说它的管理策略。

---

<div id="toc"></div>

## 都有哪些 .NET Standard 的实现？

目前 .NET Standard 的实现有这些：

- .NET Core
- .NET Framework
- Mono
- Unity
- Xamarin

## 标准在前还是实现在前？

标准在前指的是先制定出 .NET Standard 的某个版本的标准，然后再由各个 .NET Standard 的实现去完成实现。而实现在前指的是待各个 .NET Standard 的实现完成某个版本的发布之后，.NET Standard 再进行新版本的发布，确保发布时所有实现都已有版本完成。

.NET Standard 采取的是后者——实现在前。

主要在于，如果 .NET Standard 的 API 先发布，那么很多开发者基于新 .NET Standard API 开发的应用可能根本就没有办法编译到 .NET 的各个实现，例如 Mono/Xamarin。

## 标准之内还是使用标准？

.NET Standard 的发布有两种不同的方式。

第一种，也是大家经常提及的一种，即要求各大 .NET 实现都内置的 API 集。当我们在项目文件中指定 `TargetFramework` 为 `netstandard` 时，我们可以直接地原生地使用到的那些 API。

第二种，是通过 NuGet 包发布的基于 .NET Standard 标准实现的 `TargetFramework` 指定为 `netstandard` 的类库。不止微软通过这种方式发布了大量基于 .NET Standard 的类库，<nuget.org> 上大量流行的库也基本上都有生成基于 `netstandard` 的版本。而这种并不需要各大 .NET 实现对此做额外的发布都能够正常使用，因为这种发布到 NuGet 上的包本身已自带一份实现。

这两种不同的方式分别独立更新而互不影响。

## 并不一定都能实现的标准

.NET Standard 中的 API 并不一定都是能被各大 .NET 的实现来实现的，因为现实的运行环境总是有或多或少的限制。

典型的例子是——苹果 App Store 的应用商店不允许应用在运行时生成可执行代码，所以 Xamarin 的 iOS 版本就无法实现运行时代码生成的部分标准。

---

**参考资料**

- [standard/README.md at master · dotnet/standard](https://github.com/dotnet/standard/blob/master/docs/governance/README.md)

