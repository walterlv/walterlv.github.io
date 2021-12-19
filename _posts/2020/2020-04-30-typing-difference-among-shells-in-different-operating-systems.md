---
title: "了解 Windows/Linux 下命令行/Shell 启动程序传参的区别，这下不用再担心 Windows 下启动程序传参到 Linux 下挂掉了"
publishDate: 2020-04-30 09:19:06 +0800
date: 2021-08-30 10:41:03 +0800
tags: windows linux
position: knowledge
---

启动某个程序，再带上一堆参数，这几乎是程序员们每天必做到事情。另外再算上各种辅助程序员们的自动化脚本，辅助构建的 CI（持续集成）等等，程序员们在创造大量的应用程序然后调用它们。

但是，不经常跨系统玩这些的小伙伴们注意了，Windows 下的 Shell 和 Linux 下的 Shell 是有区别的！如果你不了解这些区别，很容易造成在 Windows 下编写的代码/脚本在 Linux 下无法使用的问题。

本文列举 Windows/Linux 下 Shell 的区别。

---

<div id="toc"></div>

## 分号（;）

分号（;）在 Linux 的 Shell 中是不同命令的分割，而在 Windows 中只是一个普通的字符。

例如：

```bash
dotnet build;dotnet pack
```

这在 Linux 中是执行两句不同的命令，`dotnet build` 和 `dotnet pack`。而换到 Windows 中，这变成了执行 dotnet 程序，然后传入 `build;dotnet pack` 这个参数。

相反的：

```powershell
foo --tags NET48;NETCOREAPP3_1;RELEASE
```

这在 Windows 下是启动 foo 程序，然后传入 `NET48;NETCOREAPP3_1;RELEASE`，而在 Linux 下则变成了执行三个不同的命令。后面两个显然不是命令，于是执行时会报 127 错误：Command not found。（程序执行完成退出，返回值为 127。）

如果你希望你的执行脚本跨平台，那么：

1. 不要使用分号 `;` 来尝试将两个或多个不同的命令合并成 1 行，直接执行多个命令即可。
2. 如果命令名称或参数中存在分号，则必须使用引号 `"` 将它包裹起来。

## 路径空格

Windows 下针对路径中包含空格的情况，用引号包裹路径：

```powershell
"C:\Program Files\Walterlv\Foo.exe"
```

Linux 下，如果路径中包含空格，则有三种不同的解决策略：

```bash
# 加 \ 转义
/mnt/c/Program\ Files/Walterlv/Foo

# 加双引号
"/mnt/c/Program Files/Walterlv/Foo"

# 加单引号
'/mnt/c/Program Files/Walterlv/Foo'
```

可以发现，两者都有的方案是加双引号。所以，如果希望你的命令脚本跨平台使用，则应该使用双引号包裹路径。

## 路径分隔符

Windows 下，`\` 和 `/` 都是路径分隔符。Linux 下，只有 `/` 是路径分隔符，`\` 是合理的文件名，在 Shell 中，`\` 是转义字符。

虽然理论上所有路径都使用 `/` 可以让你的跨平台脚本在以上所有系统中正常工作，但考虑到 Windows 可能有一些逗比程序对 `/` 支持不好，更建议：

- 在所有场景下生成路径字符串时使用当前平台的路径分隔符
- 不要将某平台生成的路径分隔符直接拿到另一平台使用

关于跨平台路径分隔符的问题，我专门写了一篇博客，在那里可以了解更多：

- [.NET 将混合了多个不同平台（Windows / Mac / Linux）的文件/目录的路径格式化成同一个平台下的路径 - walterlv](/post/format-mixed-path-separators-to-platform-special.html)

## 其他特殊字符（ `(` `$` `{` `*` `#` ）

在 Linux 的 Shell 中，有很多字符有特殊用途，而在 Windows Shell 中，这些字符的作用完全由被调用的应用程序来决定。

所以对于跨平台的脚本，最好尽量避免使用这些字符。

关于 Linux 下这些转义字符的用途，可以阅读我的另一篇博客：

- [Linux Shell 中的所有需要转义的字符 - walterlv](/post/linux-shell-escape.html)
