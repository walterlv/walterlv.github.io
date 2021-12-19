---
title: ".NET/C# 在 64 位进程中读取 32 位进程重定向后的注册表"
date: 2019-10-22 16:59:03 +0800
tags: dotnet windows csharp
position: knowledge
coverImage: /static/posts/2019-10-22-15-37-14.png
permalink: /post/read-32bit-registry-from-x64-process.html
---

我们知道，32 位程序在读取注册表的时候，会自动将注册表的路径映射到 32 位路径下，即在 `Wow6432Node` 子节点下。但是 64 位程序不会映射到 32 位路径下。那么 64 位程序如何读取到 32 位程序写入的注册表路径呢？

---

<div id="toc"></div>

## Wow6432Node

![Wow6432Node](/static/posts/2019-10-22-15-37-14.png)

对于 32 位程序，读取注册表路径的时候，会读到 `Wow6432Node` 节点下的项：

![32 位](/static/posts/2019-10-22-15-36-50.png)

这张图读取的就是前面截图中的节点。

那么怎样编译的程序是 32-bit 的程序呢？

![x86](/static/posts/2019-10-22-16-30-02.png)

![AnyCPU 32-bit preferred](/static/posts/2019-10-22-16-30-07.png)

对于 64 位程序，读取的时候就不会有 `Wow6432Node` 路径部分。由于我没有在那个路径放注册表项，所以会得到 `null`。

![null](/static/posts/2019-10-22-16-48-23.png)

那么怎样编译的程序是 64-bit 的程序呢？

![x64](/static/posts/2019-10-22-16-33-59.png)

![AnyCPU](/static/posts/2019-10-22-16-33-43.png)

## 如何在 64 位程序中读取 32 位注册表路径

前面我们的例子代码是这样的：

```csharp
var value = RegistryHive.LocalMachine.Read(@"SOFTWARE\Walterlv");
```

可以看到，相同的代码，在 32 位和 64 位进程下得到的结果是不同的：

- 32 位进程在 32 位系统上，64 位进程在 64 位系统上，读取的路径会是传入的路径；
- 32 位进程在 64 位系统上，读取的路径会包含 `Wow6432Node`。

那么如何在 64 位进程中读取 32 位注册表路径呢？

方法是在打开注册表项的时候，传入 `RegistryView.Registry32`。

```csharp
RegistryKey.OpenBaseKey(root, RegistryView.Registry32);
```

## Walterlv.Win32

可以在我的 GitHub 仓库中查看完整的实现。当然，除了上面那句话，其他都不是关键代码，在哪里都可以找得到的。

---

**参考资料**

- [c# - Reading the registry and Wow6432Node key - Stack Overflow](https://stackoverflow.com/a/2040103/6233938)


