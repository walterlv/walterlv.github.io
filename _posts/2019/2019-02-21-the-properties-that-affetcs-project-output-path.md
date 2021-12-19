---
title: "如何更精准地设置 C# / .NET Core 项目的输出路径？（包括添加和删除各种前后缀）"
publishDate: 2019-02-21 18:49:14 +0800
date: 2019-04-12 09:40:15 +0800
tags: dotnet csharp visualstudio msbuild
position: knowledge
---

我们都知道可以通过在 Visual Studio 中设置输出路径（OutputPath）来更改项目输出文件所在的位置。对于 .NET Core 所使用的 Sdk 风格的 csproj 格式来说，你可能会发现实际生成路径中带了 `netcoreapp3.0` 或者 `net472` 这样的子文件夹。

然而有时我们并不允许生成这样的子文件夹。本文将介绍可能影响实际输出路径的各种设置。

---

<div id="toc"></div>

## 项目和输出路径

对于这样的一个简单的项目文件，这个项目的实际输出路径可能是像下图那样的。

```xml
<Project>
  <ItemGroup>
    <TargetFramework>netcoreapp3.0</TargetFramework>
    <OutputPath>bin\$(Configuration)</OutputPath>
  </ItemGroup>
</Project>
```

![输出路径带有框架子文件夹](/static/posts/2019-02-21-17-54-13.png)

有没有办法可以不要生成这样的子文件夹呢？答案是可以的。

我在 [解读 Microsoft.NET.Sdk 的源码，你能定制各种奇怪而富有创意的编译过程](/post/read-microsoft-net-sdk) 一文中有说到如何解读 Microsoft.NET.Sdk，而我们的答案就是从解读这个 Sdk 而来。

## 影响输出路径的属性

OutputPath 属性由这些部分组成：

```xml
$(BaseOutputPath)\$(PlatformName)\$(Configuration)\$(RuntimeIdentifier)\$(TargetFramework.ToLowerInvariant())\
```

如果以上所有属性都有值，那么生成的路径可能就像下面这样：

```xml
bin\x64\Debug\win7-x64\netcoreapp3.0
```

具体的，这些属性以及其相关的设置有：

- `$(BaseOutputPath)` 默认值 `bin\`，你也可以修改。

- `$(PlatformName)` 默认值是 `$(Platform)`，而 `$(Platform)` 的默认值是 `AnyCPU`；当这个值等于 `AnyCPU` 的时候，这个值就不会出现在路径中。

- `$(Configuration)` 默认值是 `Debug`。

- `$(RuntimeIdentifier)` 这个值和 `$(PlatformTarget)` 互为默认值，任何一个先设置都会影响另一个；此值即 `x86`、`x64` 等标识符。可以通过 `$(AppendRuntimeIdentifierToOutputPath)` 属性指定是否将此加入到输出路径中。

- `$(TargetFramework)` 这是在 csproj 文件中强制要求指定的，如果不设置的话项目是无法编译的；可以通过 `$(AppendTargetFrameworkToOutputPath)` 属性指定是否将此加入到输出路径中。

现在，你应该可以更轻松地设置你的输出路径，而不用担心总会出现各种意料之外的子文件夹了吧！
