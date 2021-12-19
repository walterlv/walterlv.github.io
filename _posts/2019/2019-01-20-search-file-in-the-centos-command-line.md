---
title: "CentOS 的终端中如何搜索文件"
date: 2019-01-20 15:05:40 +0800
tags: linux
position: starter
---

CentOS 中搜索文件可以使用 find 命令。

---

如果需要在当前文件夹中搜索文件，那么可以使用命令：

```bash
~$ find -name filename
```

其中 filename 是你需要找的文件或文件夹的名称。我们没有指定搜索文件的路径，默认是当前文件夹。

如果你希望在所有文件夹中查找，那么可以使用命令：

```bash
~$ find / -name filename
```

这里的 `/` 是根目录的意思，当然，你也可以指定为其他路径。

比如我要搜索 dotnet 的 SDK，可以使用：

```bash
~$ find / -name dotnet
/usr/share/dotnet
/usr/share/dotnet/dotnet
```

返回了两个 `dotnet` 文件夹。

也可以使用通配符：

```bash
~$ find / -name *.cs
```

---

**参考资料**

- [linux - How to search for a file in the CentOS command line - Stack Overflow](https://stackoverflow.com/a/21046448/6233938)
