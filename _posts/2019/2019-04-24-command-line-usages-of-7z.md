---
title: "使用 7-Zip 的命令行版本来压缩和解压文件"
date: 2019-04-24 09:55:21 +0800
tags: windows dotnet
position: starter
coverImage: /static/posts/2019-04-24-08-23-43.png
permalink: /posts/command-line-usages-of-7z.html
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

- [编写 .NET/C# 代码来操作命令行程序 - 吕毅](/post/run-commands-using-csharp)

本文直接介绍 7z.exe 的命令行使用，你可以将其无缝地迁移至上面这篇博客中编写的 .NET/C# 代码中。

### 解压一个文件

```cmd
> 7z x {fileName} -o{outputDirectory}
```

以上：

- `x` 表示解压一个文件
- `{fileName}` 是文件名称或者文件路径的占位符
- `{outputDirectory}` 是解压后文件夹的占位符，必须是一个不存在的文件夹。
- `-o` 表示指定输出路径

特别注意：`-o` 和 `{outputDirectory}` 之间是 **没有空格** 的。

一个例子：

```cmd
> 7z x C:\Users\walterlv\demo.7z -oC:\Users\walterlv\demo
```

7z 的强大之处还有一点就是可以解压各种文件——包括解压安装包：

```cmd
> 7z x C:\Users\walterlv\nsis_installer_1.0.0.0.exe -oC:\Users\walterlv\nsis
```

这也是为什么我们考虑使用 7z 来解压缩，而不是使用相关的 NuGet 包来调用。

## 其他命令行操作

运行 `7z.exe` 后可以看到命令行中列出了可用的命令行命令：

```
a：将文件添加到压缩档案中
b：测试压缩或解压算法执行时的 CPU 占用
d：从压缩档案中删除文件
e：将压缩档案中的所有文件解压到指定路径，所有文件将输出到同一个目录中
h：计算文件的哈希值
i：显示有关支持格式的信息
l：列出压缩档案的内容
rn：重命名压缩档案中的文件
t：测试压缩档案的完整性
u：更新要进入压缩档案中的文件
x：将压缩档案中的所有文件解压到指定路径，并包含所有文件的完整路径
```

下面列出几个常用的命令。

### a 添加文件

如果你需要压缩文件，或者将文件添加到现有的压缩档案中，则使用此命令。

将 subdir\ 文件夹中的所有文件加入到 walterlv.zip 文件中，所有的子文件和文件夹将会在压缩档案的 subdir 文件夹中：

```cmd
7z a walterlv.zip subdir\
```

将 subdir\ 文件夹中的所有文件加入到 walterlv.zip 文件中，所有的子文件和文件夹路径不会包含 subdir 前缀：

```cmd
7z a walterlv.zip .\subdir\*
```

### d 删除文件

删除压缩档案 walterlv.zip 中的所有扩展名为 bak 的文件：

```cmd
7z d walterlv.zip *.bak -r
```

### e 解压文件

相比于 x，此命令会将压缩档案中的所有文件输出到同一个目录中。


