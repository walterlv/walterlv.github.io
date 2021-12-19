---
title: "Visual Studio 2019 中使用 .NET Core 预览版 SDK 的全局配置文件在哪里？"
publishDate: 2019-07-27 09:39:00 +0800
date: 2019-07-29 17:47:40 +0800
tags: msbuild visualstudio dotnet
position: problem
---

本文介绍在使用 Visual Studio 2019 或者命令行执行 `MSBuild` `dotnet build` 命令时，决定是否使用 .NET Core SDK 预览版的全局配置文件。

---

指定是否使用 .NET Core 预览版 SDK 的全局配置文件在：

- `%LocalAppData%\Microsoft\VisualStudio\16.0_xxxxxxxx\sdk.txt`

其中 `%LocalAppData%` 是 Windows 系统中自带的环境变量，`16.0_xxxxxxxx` 在不同的 Visual Studio 版本下不同。

比如，我的路径就是 `C:\Users\lvyi\AppData\Local\Microsoft\VisualStudio\16.0_0b1a4ea6\sdk.txt`。

这个文件的内容非常简单，只有一行：

```
UsePreviews=True
```

![sdk.txt 的所在路径](/static/posts/2019-07-27-09-37-10.png)

你一定觉得奇怪，我们在 Visual Studio 2019 中设置了使用 .NET Core SDK 预览版之后，这个配置是全局生效的，即便在命令行中运行 `MSBuild` 或者 `dotnet build` 也是会因此而使用预览版或者正式版的。但是这个路径明显看起来是 Visual Studio 的私有路径。

虽然这很诡异，但确实如此，不信，可以看我是如何确认这个文件就是 .NET Core SDK 预览版的全局配置的：

- [找出 .NET Core SDK 是否使用预览版的全局配置文件在那里（探索篇）](/post/find-out-the-dotnet-sdk-preview-config-file)

另外，如果你想知道如何在 Visual Studio 2019 中指定使用 .NET Core SDK 的预览版，可以参考我的另外一篇博客：

- [如何在 Visual Studio 2019 中设置使用 .NET Core SDK 的预览版（全局生效）](/post/how-to-set-dotnet-core-sdk-preview-in-visual-studio)

![Visual Studio 2019 的](/static/posts/2019-07-27-09-00-09.png)
