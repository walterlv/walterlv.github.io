---
title: "Roslyn/MSBuild 在编译期间处理路径中的斜杠与反斜杠（\\）"
date: 2019-05-11 12:56:58 +0800
categories: msbuild roslyn visualstudio
position: knowledge
---

本文介绍如何在项目文件 csproj，或者 MSBuild 的其他文件（props、targets）中处理路径中的斜杠与反斜杠。

---

<div id="toc"></div>

## 路径中的斜杠与反斜杠

我们都知道文件路径的层级之间使用斜杠（`/`）或者反斜杠（`\`）来分隔，具体使用哪一个取决于操作系统。本文不打算对具体使用哪一种特别说明，不过示例都是使用 Windows 操作系统中的反斜杠（`\`）。

对于一个文件夹的路径，末尾无论是否有反斜杠都不会影响找到这个路径对应的文件夹，但是有时我们又因为一些特殊的用途需要知道末尾的反斜杠的情况。

在 MSBuild 中，通常有一个在文件夹路径末尾添加反斜杠 `\` 的惯例，这样可以直接使用属性拼接来形成新的路径而不用担心路径中的不同层级的文件夹会连接在一起。

例如属性 `WalterlvPath1` 的值为 `bin`，属性 `WalterlvPath2` 的值为 `Debug`。为了确保两个可以直接使用 `$(WalterlvPath1)$(WalterlvPath2)` 来拼接，我们需要在这两个属性的末尾都加上反斜杠 `\`。不过由于需要照顾到各式各样的开发者，包括大多数的那些从来不看文档的开发者，我们需要进行本文所述的处理。

## 判断路径末尾是否有斜杠或反斜杠

如果路径末尾没有反斜杠，那么我们现在就添加一个反斜杠。

```xml
<WalterlvPath Condition="!HasTrailingSlash('$(WalterlvPath)')">$(WalterlvPath)\</WalterlvPath>
```

这样，如果 `WalterlvPath` 的值为 `bin`，则会在这一个属性重新计算值的时候变成 `bin\`；如果已经是 `bin\`，则不会重新计算值，于是保持不变。

## 确保路径末尾有斜杠或反斜杠

另外，也有方法可以不用做判断，直接给末尾根据情况加上反斜杠。

通过调用 `MSBuild.EnsureTrailingSlash` 可以确保路径的末尾已经有一个斜杠或者反斜杠。

例如，我们有一个 `WalterlvPath` 属性，值可能是 `bin\Debug` 也有可能是 `bin\Debug\`，那么可以统一将其处理成 `bin\Debug\`。

```xml
<WalterlvPath>$([MSBuild]::EnsureTrailingSlash('$(WalterlvPath)'))</WalterlvPath>
```

## 确保路径末尾没有斜杠或反斜杠

正常情况下，我们都是需要 MSBuild 中文件夹路径的末尾有斜杠或者反斜杠。不过，当我们需要将这个路径作为命令行参数的一部分传给一个可执行程序的时候，就没那么容易了。

因为为了确保路径中间的空格不会被命令行参数解析给分离，我们需要在路径的周围加上引号。具体来说，是使用 `&quot;` 转义字符来添加引号：

```xml
<Target Name="WalterlvDemoTarget" BeforeTargets="BeforeBuild">
    <Exec Command="&quot;$(WalterlvDemoTool)&quot; --option &quot;$(WalterlvPath)&quot;" />
</Target>
```

以上的 Target 是我在另一篇博客中的简化版本：[如何创建一个基于命令行工具的跨平台的 NuGet 工具包 - walterlv](https://blog.walterlv.com/post/create-a-cross-platform-command-based-nuget-tool.html)。

但是这样，如果 `WalterlvPath` 中存在反斜杠，那么这个命令行将变成这样：

```cmd
> "walterlv.tool.exe" --option "bin\"
```

后面的 `\"` 将使得引号成为路径中的一部分，而这样的路径是不合法的路径！

我们可以确保路径的末尾添加一个空格来避免将引号也解析成命令行的一部分：

```xml
<Target Name="WalterlvDemoTarget" BeforeTargets="BeforeBuild">
    <Exec Command="&quot;$(WalterlvDemoTool)&quot; --option &quot;$([MSBuild]::EnsureTrailingSlash('$(BasePathInInstaller)')) &quot;" />
</Target>
```

不过也可以通过 `SubString` 来对末尾的斜杠或反斜杠进行裁剪。

```xml
<WalterlvPath Condition="HasTrailingSlash('$(WalterlvPath)')">$(WalterlvPath.Substring(0, $([MSBuild]::Add($(WalterlvPath.Length), -1))))</WalterlvPath>
```

解释一下这里 `$(WalterlvPath.Substring(0, $([MSBuild]::Add($(WalterlvPath.Length), -1))))` 所做的事情：

1. `$(WalterlvPath.Length)` 计算出 `WalterlvPath` 属性的长度；
1. `$([MSBuild]::Add(length, -1))` 调用加法，将前面计算所得的长度 -1，用于提取无斜杠或反斜杠的路径长度。
1. `$(WalterlvPath.Substring(0, length-1)` 将路径字符串取出子串。

这里的解释里面，`length` 只是表意，并不是为了编译通过。要编译的代码还是上面代码块中的完整代码。
