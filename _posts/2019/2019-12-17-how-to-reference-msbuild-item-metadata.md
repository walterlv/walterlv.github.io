---
title: "如何在 MSBuild 中正确使用 % 来引用每一个项（Item）中的元数据"
publishDate: 2019-12-17 19:28:39 +0800
date: 2019-12-27 17:45:37 +0800
tags: msbuild dotnet
position: knowledge
permalink: /post/how-to-reference-msbuild-item-metadata.html
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

## 使用元数据

如果你希望自己处理编译过程，那么可能会对元数据做更多的处理。

为了简单说明 `%` 的用法，我将已收集到的所有的元数据和它的本体一起输出到一个文件中。这样，后续的编译过程可以直接使用这个文件来获得所有的项和你希望关心它的所有元数据。

```xml
<PropertyGroup>
    <_WalterlvContentArgsFilePath>$(IntermediateOutputPath)Args\Content.txt</_WalterlvContentArgsFilePath>
    <_WalterlvToolFile>$(MSBuildThisFileDirectory)..\bin\compile.exe</_WalterlvContentArgsFilePath>
</PropertyGroup>

<Target Name="_WalterlvDemo" AfterTargets="AfterBuild">
    <ItemGroup>
        <_WalterlvContentFileLine Include="@(Content)" Line="@(Content)|%(Content.PublishState)|%(Content.CopyToOutputDirectory)" />
    </ItemGroup>
    <WriteLinesToFile File="$(_WalterlvContentArgsFilePath)" Lines="%(_WalterlvContentFileLine.Line)" Overwrite="True" />
    <Exec ConsoleToMSBuild="True"
          Command="&quot;$(_WalterlvToolFile)&quot; PackContent --content-file &quot; $(_WalterlvContentArgsFilePath) &quot;" />
</Target>
```

这段代码的含义是：

1. 定义一个文件路径，这个路径即将用来存放所有 `Content` 项和它的元数据；
1. 定义一个工具路径，我们即将运行这个路径下的命令行程序来执行自定义的编译；
1. 收集所有的 `Content` 项，然后把所有项中的 `PublishState` 和 `CopyToOutputDirectory` 一起拼接成这个样子：
    - `Content|PublishState|CopyToOutputDirectory`
1. 写文件，将以上拼接出来的每一项写入到文件中的每一行；
1. 执行工具程序，这个程序将使用这个文件来执行自定义的编译。

关于使用 exe 进行自定义编译的部分可以参考我的另一篇博客：

- [如何创建一个基于命令行工具的跨平台的 NuGet 工具包 - walterlv](https://blog.walterlv.com/post/create-a-cross-platform-command-based-nuget-tool.html)

关于写文件的部分可以参考我的另一篇博客：

- [在 MSBuild 编译过程中操作文件和文件夹（检查存在/创建文件夹/读写文件/移动文件/复制文件/删除文件夹） - walterlv](https://blog.walterlv.com/post/msbuild-file-and-directory-operations.html)

## 关于项元数据的其他信息

一些已知的元数据：

- [MSBuild Well-known Item Metadata - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/msbuild-well-known-item-metadata?view=vs-2019)

---

**参考资料**

- [MSBuild Items - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/msbuild-items)

