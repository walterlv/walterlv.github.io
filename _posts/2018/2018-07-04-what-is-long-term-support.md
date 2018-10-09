---
title: "长期支持 LTS（Long-term Support）是怎样的一种支持方式"
publishDate: 2018-07-04 21:29:29 +0800
date: 2018-10-09 14:44:06 +0800
categories: dotnet
---

在 .NET Core 2.1 发布之时，微软称之为一个 LTS 版本，那么 LTS 的版本是一种怎样的版本呢？

---

这是 .NET Core 2.1 的发布博客：[Announcing .NET Core 2.1 - .NET Blog](https://blogs.msdn.microsoft.com/dotnet/2018/05/30/announcing-net-core-2-1/)；文中说：

> .NET Core 2.1 will be a [long-term support (LTS)](https://github.com/dotnet/core/blob/master/microsoft-support.md) release. This means that it is supported for three years. We recommend that you make .NET Core 2.1 your new standard for .NET Core development.

LTS 是 long-term support 的缩写，意为长期支持。

这是基础库的开发者对库的使用者的一个承诺，保证某个版本的库发布之后的很长一段事件之内都得到支持。如果此版本发现一些紧急问题需要修复，那么就会在这个版本上进行更新。通常这些问题的修复都不会导致 API 变化（API 保证长期兼容），所以版本号的前两位是不变的，通常只变化第三位。

微软对 .NET Core 的长期支持策略有两种支持的时长：

- 某个 release 版本发布之后三年；
- 后续替代此 release 的另一个新的 release 发布之后一年

如果某个库承诺进行长期支持，那么至少数年之内使用这个库都是安全的。这段时间也足够多数开发者进行新库的准备和升级了。

---

当然也有机构采用 ESR 作为长期支持版本的称呼，ESR 全称为 Extended Support Release。

例如 Firefox 的长期支持版本：

![Firefox ESR Release Overview](https://www.mozilla.org/media/img/firefox/organizations/release-overview.d8ca18efe06f.png)  
▲ Firefox ESR Release Overview

详见：[Firefox Extended Support Release for Your Organization, Business, Enterprise — Mozilla](https://www.mozilla.org/en-US/firefox/organizations/)。
