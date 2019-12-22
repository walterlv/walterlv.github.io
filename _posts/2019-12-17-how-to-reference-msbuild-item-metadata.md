---
title: "如何在 MSBuild 中正确使用 % 来引用每一个项（Item）中的元数据"
date: 2019-12-17 19:28:39 +0800
categories: msbuild dotnet
position: knowledge
---

MSBuild 中写在 `<ItemGroup />` 中的每一项是一个 `Item`，`Item` 除了可以使用 `Include`/`Update`/`Remove` 来增删之外，还可以定义其他的元数据（Metadata）。

使用 `%` 可以引用 `Item` 的元数据，本文将介绍如何正确使用 `%` 来引用每一个项中的元数据。

---

<div id="toc"></div>

## 定义 Item 的元数据

就像下面这样，当引用一个 NuGet 包时，可以额外使用 `Version` 来指定应该使用哪个特定版本的 NuGet 包。这里的 `Version` 和 `PrivateAssets` 就是 `PackageReference` 的元数据。

```xml
<ItemGroup>
  <PackageReference Include="dotnetCampus.Configurations.Source" Version="1.0.0" PrivateAssets="All" />
  <PackageReference Include="dotnetCampus.CommandLine.Source" Version="1.2.1" PrivateAssets="All" />
  <PackageReference Include="Walterlv.Win32.Source" Version="0.12.2-alpha" PrivateAssets="All" />
  <PackageReference Include="Walterlv.IO.PackageManagement.Source" Version="0.13.2-alpha" PrivateAssets="All" />
</ItemGroup>
```

我们随便创建一个新的 Item，也可以定义自己的元数据。

```xml
<ItemGroup>
  <_WalterlvItem Include="欢迎访问" Url="https://" />
  <_WalterlvItem Include="吕毅的博客" Url="blog.walterlv.com" />
</ItemGroup>
```

## 引用元数据

引用元数据使用的是 `%` 符号。

```xml
<Target Name="_WalterlvDemo" AfterTargets="AfterBuild">
  <ItemGroup>
    <_WalterlvItem Include="欢迎访问" Url="https://" />
    <_WalterlvItem Include="吕毅的博客" Url="blog.walterlv.com" />
  </ItemGroup>
  <Message Text="@(_WalterlvItem)：%(Url)" />
</Target>
```

虽然这里我们只写了一个 `Message` Task，但是最终我们会输出两次，每一个 `_WalterlvItem` 项都会输出一次。下面是这段代码的输出：

```
_WalterlvDemo:
  欢迎访问：https://
  吕毅的博客：blog.walterlv.com
```

当你使用 `%` 的时候，会为每一个项执行一次这行代码。当然，如果某个 Task 支持传入集合，那么则可以直接收到集合。

如果你不是用的 `Message`，而是定义一个其他的属性，使用 `@(_WalterlvItem)：%(Url)` 作为属性的值，那么这个属性也会为每一个项都计算一次值。当然最终这个属性的值就是最后一项计算所得的值。

也许可以帮你回忆一下，如果我们不写 `%(Url)` 会输出什么。当只输出 `@(WalterlvItem)` 的时候，会以普通的分号分隔的文字。

```xml
<Target Name="_WalterlvDemo" AfterTargets="AfterBuild">
  <ItemGroup>
    <_WalterlvItem Include="欢迎访问" Url="https://" />
    <_WalterlvItem Include="吕毅的博客" Url="blog.walterlv.com" />
  </ItemGroup>
  <Message Text="@(_WalterlvItem)" />
</Target>
```

会输出：

```
_WalterlvDemo:
  欢迎访问;吕毅的博客
```

## 关于项元数据的其他信息

一些已知的元数据：

- [MSBuild Well-known Item Metadata - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/msbuild-well-known-item-metadata?view=vs-2019)

---

**参考资料**

- [MSBuild Items - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/msbuild-items)
