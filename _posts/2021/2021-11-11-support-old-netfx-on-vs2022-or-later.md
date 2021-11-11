---
title: "无需安装 VS2019，在 Visual Studio 2022 中编译 .NET Framework 4.5/4/3.5 这样的古老框架"
date: 2021-11-11 17:51:13 +0800
categories: visualstudio dotnet
position: problem
---

Visual Studio 2022 已正式发布！着急升级的小伙伴兴致勃勃地升级并卸载了原来的 Visual Studio 2019 后，发现自己的几个库项目竟然无法编译通过了。究其原因，是因为我的一些库依旧在支持古老的 .NET Framework 4.5 框架，而 Visual Studio 2022 不再附带如此古老的目标包了。

我之前在 [另一篇文章](/post/how-to-support-net45-on-vs2022-or-later) 中告诉大家通过将 Visual Studio 2019 装回来的方式解决这个问题，但是有小伙伴不想安装 Visual Studio 2019；所以本文用另外一种方法，无需安装 Visual Studio 2019，也无需单独安装 .NET Framework 目标包。

---

<div id="toc"></div>

## 无法编译 .NET Framework 4.5 项目

为了更广泛的适用于各种项目，我的一些库兼容的框架版本是非常古老的（比如下图截取的这张）。可是卸载掉 Visual Studio 2019 只留下 Visual Studio 2022 之后这些项目就不再能编译通过了。如果点开 Visual Studio 2022 的安装程序，会发现已经删除掉了 .NET Framework 4.5 的目标包了，无法通过它安装回来。

![支持古老的框架](/static/posts/2021-11-09-09-46-36.png)

![无法编译 .NET Framework 4.5 项目](/static/posts/2021-11-09-09-45-32.png)

![没有 .NET Frameweork 4.5 的目标包](/static/posts/2021-11-09-09-49-26.png)

## 推荐一个 NuGet 包

[Microsoft.NETFramework.ReferenceAssemblies](https://www.nuget.org/packages/Microsoft.NETFramework.ReferenceAssemblies/) 这款 NuGet 包旨在解决没有目标包的时候编译 .NET Framework 框架的问题。因此，我们将通过安装此 NuGet 包来解决 Visual Studio 2022 中目标包的缺失问题。

## 安装 Microsoft.NETFramework.ReferenceAssemblies

你只需要在项目中安装这个 NuGet 包即可。如果你整个解决方案里所有项目都需要兼容 .NET Framwework 4.5 或者更加古老的 .NET 框架，也可以用 Directory.Build.props 文件，详见：[使用 Directory.Build.props 管理多个项目配置 - 林德熙](https://blog.lindexi.com/post/Roslyn-%E4%BD%BF%E7%94%A8-Directory.Build.props-%E7%AE%A1%E7%90%86%E5%A4%9A%E4%B8%AA%E9%A1%B9%E7%9B%AE%E9%85%8D%E7%BD%AE.html)

```xml
<Project>
  <ItemGroup>
    <PackageReference Include="Microsoft.NETFramework.ReferenceAssemblies" Version="1.0.2" />
  </ItemGroup>
</Project>
```

## 一些注意事项

### 1. 记得清理仓库并重启 VS

在项目安装完 [Microsoft.NETFramework.ReferenceAssemblies](https://www.nuget.org/packages/Microsoft.NETFramework.ReferenceAssemblies/) NuGet 包后，使用 `msbuild` 命令和 `dotnet build` 命令都将能够正常编译包含 .NET Framework 4.5 框架的项目了，但是 Visual Studio 2022 的编译仍然会报告相同的错误。

你需要做的：

1. 关闭 Visual Studio 2022
2. 清理仓库，执行 `git clean -xdf` 命令（这会删除所有未被版本管理的文件，包括 Visual Studio 的各种缓存文件）
3. 重新启动 Visual Studio 2022

### 2. 需要覆盖整个解决方案中所有涉及到 .NET Framework 框架的项目

这个 NuGet 包的本质是在编译的时候设置 `TargetFrameworkRootPath` 属性到 NuGet 包里安装过来的目录，并且通过 `<Reference Include="mscorlib" Pack="false" />` 指定额外引用 mscorelib，所以不会产生额外的引用。于是这种方式安装的 NuGet 包不像其他的 NuGet 包那样可以传递到其他引用它的项目。

你需要做的：

1. 给所有含 .NET Framework 框架的项目安装 [Microsoft.NETFramework.ReferenceAssemblies](https://www.nuget.org/packages/Microsoft.NETFramework.ReferenceAssemblies/) NuGet 包
2. 如果不想直接给所有项目安装，可以使用 [Directory.Build.props](https://blog.lindexi.com/post/Roslyn-%E4%BD%BF%E7%94%A8-Directory.Build.props-%E7%AE%A1%E7%90%86%E5%A4%9A%E4%B8%AA%E9%A1%B9%E7%9B%AE%E9%85%8D%E7%BD%AE.html) 来一并安装

### 3. 不想折腾？

不想折腾的话，那就把 .NET Framework 4.5 目标包装回来吧，可参见：[Visual Studio 2022 升级不再附带 .NET Framework 4.5 这种古老的目标包了，本文帮你装回来](/post/how-to-support-net45-on-vs2022-or-later)。
