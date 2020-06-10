---
title: "比较 Windows 上四种不同的文件（夹）链接方式（NTFS 的硬链接、目录联接、符号链接，和大家熟知的快捷方式）"
publishDate: 2020-05-03 14:30:43 +0800
date: 2020-06-10 09:58:48 +0800
categories: windows
position: knowledge
version:
  current: 中文
versions:
  - 中文: #
  - English: /post/ntfs-link-comparisons-en.html
---

可能有很多小伙伴已经知道通过 `mklink` 命令来创建 NTFS 磁盘上的各种链接；当然，就算不知道 `mklink` 的链接，快捷方式应该每个人都知道吧。`mklink` 的选项有很多种，但你可能在其他文章中难以找到对这些不同选项的不同效果和使用限制的准确和统一描述。本文将介绍 Windows 系统中所有的链接方式，它们的优缺点、使用条件和坑。

---

This post is written in **multiple languages**. Please select yours:

{% include post-version-selector.html %}

<div id="toc"></div>

## 不同的链接方式

Windows Vista 开始带来了 NTFS 符号链接（Symbolic Link），Windows 2000 开始就有了 NTFS 重解析点（Reparse Point），更早的 Windows 95 就有了快捷方式（Shortcut），再往前到 Windows 3.5 还有硬链接（Hard Link），他们都能实现给你不同的路径访问同一个文件或文件夹的功能。

### `mklink`

使用 `mklink` 命令，你可以创建“硬链接（Hard Link）”、“目录联接（Junction Point）”和“符号链接（Symbolic Link）”。

```powershell
> mklink
创建符号链接。

MKLINK [[/D] | [/H] | [/J]] Link Target

        /D      创建目录符号链接。默认为文件
                符号链接。
        /H      创建硬链接而非符号链接。
        /J      创建目录联接。
        Link    指定新的符号链接名称。
        Target  指定新链接引用的路径
                (相对或绝对)。
```

例如：

```powershell
mklink /J current %APPDATA%\walterlv\packages\1.0.0
```

即在当前目录创建了一个指向 `%APPDATA%\walterlv\packages\1.0.0` 的目录联接。

因为创建目录联接不需要管理员权限，所以特别适合给桌面应用程序用来按版本管理某些包/工具集。有关使用 .NET/C# 来创建目录联接的方法，可以阅读我的另一篇博客：

- [.NET 实现 NTFS 文件系统的硬链接 mklink /J（Junction） - walterlv](/post/mklink-junction-in-dotnet.html)

### 快捷方式

快捷方式是一个单纯 Windows 操作系统用户层面的功能，与 NTFS 文件系统没有什么关系。不过其也能实现链接到另一个文件的功能。使用快捷方式的程序太多了，几乎每个安装包都会考虑往桌面或开始菜单扔几个快捷方式。

快捷方式的本质是一个 `lnk` 后缀的文件，这个文件里面指向了如何打开目标文件或文件夹的一些参数，于是当在文件资源管理器中打开快捷方式时，就直接打开了目标文件或文件夹（当然，启动一个程序可能是大多数用法）。

### 其他

重解析点（Reparse Point）自 NTFS v3.0（随 Windows 2000 推出）开始便一直存在于 Windows 操作系统中。除了我们前面提到的可通过 `mklink` 创建的那三种外，还有其他种类：

- Volume Mount Ppoints
- Distributed Link Tracking（DLT）
- Data Deduplication
- Hierarchical Storage Management（HSM）
- Native Structured Storage（NSS）
- Unix Doman Socket（socket）
- System Compression
- OneDrive

## 比较

可能单单说名字，你不一定能明白什么时候要用哪一种。于是我将这些链接的不同整理了出来贴在下面。

|                        | 硬链接（Hard Link）                                          | 目录联接（Junction Point）                                   | 符号链接（Symbolic Link）        |
| ---------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | -------------------------------- |
| 命令                   | `mklink /H Link Target`                                      | `mklink /J Link Target`                                      | `mklink /D Link Target`          |
| 作用                   | 为某文件创建别名，可让不同的路径对应同一个文件的数据。       |                                                              |                                  |
| 链接到文件             | ✔️                                                            | ❌                                                            | ❌                                |
| 链接到文件夹           | ❌                                                            | ✔️                                                            | ✔️                                |
| 需要提升为管理员权限   | 需要                                                         | 不需要                                                       | 通常需要 [坑1]                  |
| 跨驱动器卷（盘符）     | ❌                                                            | ✔️（仅本地计算机）                                            | ✔️（包括 SMB 文件或路径）         |
| 操作系统支持           | Windows NT 3.1 开始支持<br/>Windows 2000 开始有 API `CreateHardLink()`<br/>Windows NT 6.0 开始能使用 `mklink /H` | Windows 2000+                                                | Windows Vista+                   |
| 可链接到不存在的目标   | ❌                                                            | ✔️                                                            | ✔️                                |
| 可链接到相对目录       | ❌                                                            | ❌（可以使用相对路径创建，但创建完即变绝对路径）              | ✔️                                |
| 删除方法               | del                                                          | rd                                                           | rd / del                         |
| 当链接被单独删除后     | 只有所有指向原始文件的硬链接和原始文件全部删除后文件数据才会被删除。 | Windows Vista 之后原始文件夹不受影响；Windows 2000/XP/2003 会导致原始子文件夹被删除。 | 原始文件夹不受影响。             |
| 当原始文件被单独删除后 | 硬链接依然能正常访问到文件的数据。                           | 目录联接失效，指向不存在的目录。                             | 符号链接失效，指向不存在的目录。 |

[坑1]: 在微软的官方博客中已有说明：从 Windows 10 Insiders build 14972 开始，符号链接对开发者将不再需要管理员权限，这可以让开发者像在 Linux 或 macOS 上一样高效地工作。（通过如下图所示的开关来决定此操作是否需要管理员权限，打开则无需管理员权限。）

![开发者模式](/static/posts/2020-06-10-09-37-39.png)

## 额外的坑

如果你在开始菜单里面有快捷方式指向了一个目录联接（Junction Point）中的文件，那么在 Windows 10 操作系统更新后这个快捷方式便会消失。目前正在调查消失的原因，如果确认是目录联接的 bug 或者开始菜单的 bug，就将进展报告给微软。

关于这个 bug，详见：

- [After the windows 10 updates, all shortcuts of scoop will disappear. · Issue #3941 · lukesampson/scoop](https://github.com/lukesampson/scoop/issues/3941)

一般来说，阅读本文应该就理解了 `mklink` 的正确用法，也不应该会出现我另一篇博客中的情况：

- [解决 mklink 使用中的各种坑（硬链接，软链接/符号链接，目录链接） - walterlv](/post/problems-of-mklink.html)

另外，附我使用目录联接/符号链接的一些用途：

- [通过 mklink 收集本地文件系统的所有 NuGet 包输出目录来快速调试公共组件代码 - walterlv](/post/collect-nuget-output-folder-for-fast-package-debugging.html)

---

**参考资料**

- [NTFS reparse point - Wikipedia](https://en.wikipedia.org/wiki/NTFS_reparse_point)
- [windows - What is the difference between NTFS Junction Points and Symbolic Links? - Stack Overflow](https://stackoverflow.com/questions/9042542/what-is-the-difference-between-ntfs-junction-points-and-symbolic-links)
- [Hard link - Wikipedia](https://en.wikipedia.org/wiki/Hard_link)
- [Create symbolic links (Windows 10) - Windows security - Microsoft Docs](https://docs.microsoft.com/en-us/windows/security/threat-protection/security-policy-settings/create-symbolic-links)
- [Symlinks in Windows 10! - Windows Developer Blog](https://blogs.windows.com/windowsdeveloper/2016/12/02/symlinks-windows-10/)
