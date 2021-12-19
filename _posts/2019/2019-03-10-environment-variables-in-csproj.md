---
title: "在 csproj 文件中使用系统环境变量的值（示例将 dll 生成到 AppData 目录下）"
publishDate: 2019-03-10 22:05:55 +0800
date: 2019-03-12 11:53:06 +0800
tags: dotnet csharp visualstudio msbuild
position: starter
coverImage: /static/posts/2019-03-10-18-51-38.png
permalink: /posts/environment-variables-in-csproj.html
---

Windows 系统以及很多应用程序会考虑使用系统的环境变量来传递一些公共的参数或者配置。Windows 资源管理器使用 `%var%` 来使用环境变量，那么我们能否在 Visual Studio 的项目文件中使用环境变量呢？

本文介绍如何在 csproj 文件中使用环境变量。

---

<div id="toc"></div>

## 遇到的问题

在 Windows 资源管理器中，我们可以使用 `%AppData%` 进入到用户的漫游路径。我正在为 [希沃白板5 为互动教学而生 - 课件制作神器](http://easinote.seewo.com/) 编写插件，于是需要将插件放到指定目录：

```powershell
%AppData%\Seewo\EasiNote5\Walterlv.Presentation
```

在 Windows 资源管理器中可以直接输入以上文字进入对应的目录（当然需要确保存在）。

![插件目录](/static/posts/2019-03-10-18-51-38.png)

更多关于路径的信息可以参考：[UWP 中的各种文件路径（用户、缓存、漫游、安装……） - walterlv](/post/all-kinds-of-paths-in-uwp)

然而，为了调试方便，我最好在 Visual Studio 中编写的时候就能直接输出到插件目录。

于是，我需要将 Visual Studio 的调试目录设置为以上目录，但是以上目录中包含环境变量 `%AppData%`

## 在 Visual Studio 中修改输出路径

如果直接在 csproj 中使用 `%AppData%`，那么 Visual Studio 会原封不动地创建一个这样的文件夹。

![一个诡异的文件夹](/static/posts/2019-03-10-18-57-40.png)

实际上，Visual Studio 是天然支持环境变量的。直接使用 MSBuild 获取属性的语法即可获取环境变量的值。

也就是说，使用 `$(AppData)` 即可获取到其值。在我的电脑上是 `C:\Users\lvyi\AppData\Roaming`。

于是，在 csproj 中设置 `OutputPath` 即可正确输出我的插件到目标路径。

```xml
<Project Sdk="Microsoft.NET.Sdk">
    <PropertyGroup>
        <TargetFrameworks>net472</TargetFrameworks>
        <OutputPath>$(AppData)\Seewo\EasiNote5\Extensions\Walterlv.Presentation</OutputPath>
        <AppendTargetFrameworkToOutputPath>False</AppendTargetFrameworkToOutputPath>
    </PropertyGroup>
</Project>
```

这里，我额外设置了 `AppendTargetFrameworkToOutputPath` 属性，这是避免 `net472` 出现在了目标输出路径中。你可以阅读我的另一篇博客了解更多关于输出路径的问题：

- [如何更精准地设置 C# / .NET Core 项目的输出路径？（包括添加和删除各种前后缀） - walterlv](/post/the-properties-that-affetcs-project-output-path)


