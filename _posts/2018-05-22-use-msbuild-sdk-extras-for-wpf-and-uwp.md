---
title: "新 csproj 对 WPF/UWP 支持不太好？有第三方 SDK 可以用！MSBuild.Sdk.Extras"
date: 2018-05-22 15:07:22 +0800
categories: visualstudio dotnet csharp
---

自从微软推出 .NET Core 以来，新的项目文件格式以其优秀的可扩展性正吸引着更多项目采用。然而——微软官方的 WPF/UWP 项目模板依然还在采用旧的 csproj 格式！

这只是因为——官方 SDK 依然对 WPF/UWP 支持不够友好。

---

<div id="toc"></div>

### 为什么要使用第三方的 SDK？

关于项目文件格式的迁移，我和 [林德熙](https://lindexi.gitee.io/) 都写过文章：

- [从以前的项目格式迁移到 VS2017 新项目格式 - 林德熙](https://lindexi.gitee.io/lindexi/post/%E4%BB%8E%E4%BB%A5%E5%89%8D%E7%9A%84%E9%A1%B9%E7%9B%AE%E6%A0%BC%E5%BC%8F%E8%BF%81%E7%A7%BB%E5%88%B0-VS2017-%E6%96%B0%E9%A1%B9%E7%9B%AE%E6%A0%BC%E5%BC%8F.html)
- [将 WPF、UWP 以及其他各种类型的旧样式的 csproj 文件迁移成新样式的 csproj 文件 - 吕毅](/post/introduce-new-style-csproj-into-net-framework.html)

不过，这两篇文章中的迁移方法都是手动或半自动迁移的。而且迁移完毕之后，对新增的 WPF/UWP XAML 文件的支持非常不友好——**新增的 XAML 文件是看不见的，除非手工去 csproj 文件中去掉自动生成的 Remove XAML 的代码。**

这确实阻碍着我们在 WPF/UWP 项目中体会到新风格 csproj 的好处。

微软在 Build 2018 大会上宣布，WPF/UWP 将能够在 .NET Core 3 中运行。想必，微软会为未来版本的 Microsoft.NET.Sdk 这样的官方 SDK 添加更多的 WPF/UWP 这类格式的支持吧！即便没有这样的原生支持，想必也会提供官方的扩展方案。

但在此之前呢？感谢小伙伴 [KodamaSakuno (神樹桜乃)](https://github.com/KodamaSakuno) 提醒我第三方 SDK 的存在 —— MSBuild.Sdk.Extras。我想，在 .NET Core 3 推出之前，这是一种不错的中转方案。既能体会到新风格 csproj 格式的好处，也能在将来 .NET Core 3 官方支持后较快地迁移成官方版本。

### 如何使用 MSBuild.Sdk.Extras

虽说是第三方 SDK，但实际使用的方便程度却如官方般简洁！只需要将 SDK 替换成 `MSBuild.Sdk.Extras/1.5.4` 即可。1.5.4 是目前 MSBuild.Sdk.Extras 在 NuGet 上的最新版本，建议访问 [NuGet Gallery - MSBuild.Sdk.Extras](https://www.nuget.org/packages/MSBuild.Sdk.Extras/) 使用最新稳定版本。

以下是最简同时支持 WPF 和 UWP 双框架的代码：

```xml
<Project Sdk="MSBuild.Sdk.Extras/1.5.4">
  <PropertyGroup>
    <TargetFrameworks>net47;uap10.0</TargetFrameworks>
  </PropertyGroup>
</Project>
```

没错，真的如此简单！在我们猜测的 .NET Core 3 支持 WPF/UWP 项目格式之前，这应该算是最简单的迁移方案了！

至于项目结构的效果，可以看下图所示：

![net47 和 uap10.0](/static/posts/2018-05-22-15-00-04.png)

相比于此前的手工迁移，使用此新格式创建出来的 XAML 文件是可见的，而且 .xaml.cs 也是折叠在 .xaml 之下，且能正常编译！（当然，咱们还得考虑 UWP 和 WPF 在 XAML 书写上的细微差异）

官方提供了更多的使用方法，例如更简单的是安装 NuGet 包，而不修改 SDK。详见：[onovotny/MSBuildSdkExtras: Extra properties for MSBuild SDK projects](https://github.com/onovotny/MSBuildSdkExtras)。

#### 参考资料

- [onovotny/MSBuildSdkExtras: Extra properties for MSBuild SDK projects](https://github.com/onovotny/MSBuildSdkExtras)
