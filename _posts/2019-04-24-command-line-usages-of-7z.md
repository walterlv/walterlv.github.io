---
title: "使用 7-Zip 的命令行版本来压缩和解压文件"
date: 2019-04-24 09:32:03 +0800
categories: windows dotnet
position: starter
---

7-Zip 也有一个简短的名称 7z。它的原生 UI 确实不怎么好看，非常有年代感；不过 7-Zip 的强大之处不在于 UI，而在于其算法和各种文件的支持情况。不过，7-Zip 提供了命令行的版本，让你摒除一切杂念，专心处理压缩文件的工作。

本文介绍如何通过命令行来使用 7-Zip。因为使用命令行，所以你甚至可以自动化地完成压缩文件的各种处理。

---

<div id="toc"></div>

## 如何找到 7-Zip 的命令行版本

请前往官方网站下载 7-Zip：

- [7-Zip - Download](https://www.7-zip.org/download.html)

下载安装完去其安装目录下可以找到 7-Zip 的命令行版本：

![7-Zip 的安装目录](/static/posts/2019-04-24-08-23-43.png)

这些文件作用分别是：

- `7zFM.exe` 7-Zip 文件管理器的主 UI，直接从开始菜单打开 7-Zip 时的 UI 界面。*依赖 7z.dll*
- `7zG.exe` 7-Zip 的 GUI 模块，需要通过命令行指定参数调用。*依赖 7z.dll*
- `7-zip.dll` 与 Windows Shell 以及 7zFM.exe 集成。
- `7z.exe` 7-Zip 的命令行版本，需要通过命令行指定参数调用。
- `7z.dll` 7-Zip 的核心执行引擎。
- `7z.sfx` SFX 模块（Windows 版本）。
- `7zCon.sfx` SFX 模块（控制台版本）。
- `7-zip.chm` 7-Zip 的帮助说明文件。

命令行版本的 `7z.exe` 不依赖与其他 dll，所以我们将 `7z.exe` 文件拷出来即可使用完整的命令行版本的 7z。

## 使用命令行操作 7z.exe

如果你希望使用 .NET/C# 代码来自动化地调用 7z.exe，可以参考我的另一篇博客：

- [编写 .NET/C# 代码来操作命令行程序 - 吕毅](/post/run-commands-using-csharp.html)

本文直接介绍 7z.exe 的命令行使用，你可以将其无缝地迁移至上面这篇博客中编写的 .NET/C# 代码中。

### 解压一个文件

```cmd
> 7z.exe x {fileName} -o{outputDirectory}
```

以上：

- `x` 表示解压一个文件
- `{fileName}` 是文件名称或者文件路径的占位符
- `{outputDirectory}` 是解压后文件夹的占位符，必须是一个不存在的文件夹。
- `-o` 表示指定输出路径

特别注意：`-o` 和 `{outputDirectory}` 之间是 **没有空格** 的。

一个例子：

```cmd
> 7z.exe x C:\Users\walterlv\demo.7z -oC:\Users\walterlv\demo
```

7z 的强大之处还有一点就是可以解压各种文件——包括解压安装包：

```cmd
> 7z.exe x C:\Users\walterlv\nsis_installer_1.0.0.0.exe -oC:\Users\walterlv\nsis
```

这也是为什么我们考虑使用 7z 来解压缩，而不是使用相关的 NuGet 包来调用。
