---
title: "如何为你的 Windows 应用程序关联一种或多种文件类型"
date: 2019-03-02 15:42:59 +0800
categories: dotnet windows csharp
position: knowledge
---

为 Windows 应用程序添加文件关联是通过修改注册表的方式来实现的。

本文介绍如何通过注册表检查应用程序是否关联了某个文件扩展名，如何通过写注册表来添加对某个文件的扩展名的关联，以及如何使用 C# / .NET 来有程序自己完成这些关联文件操作。

---

<div id="toc"></div>

### 注册表

Windows 上包含文件关联信息的注册表有三处不同的位置：

- `HKEY_LOCAL_MACHINE\Software\Classes`
- `HKEY_CURRENT_USER\Software\Classes`
- `HKEY_CLASSES_ROOT`

`HKEY_LOCAL_MACHINE` 中的所有内容都是此计算机上所有用户共享的注册表信息，`HKEY_CURRENT_USER` 中的所有内容是当前用户的注册表信息。这两个注册表根中的大多数结构都是一样的，如果两者存在相同的键值，那么用户目录下的键值就会覆盖计算机所有用户共享的注册表键值。其中关于文件关联的键值都在它们的 `\Software\Classes` 子目录下。

在用户的注册表配置覆盖了计算机所有用户共享的配置后，对于文件关联的信息将重新映射到 `HKEY_CLASSES_ROOT` 中。所以获取此注册表根中的键值将可以省去重复读取 `HKEY_LOCAL_MACHINE` 和 `HKEY_CURRENT_USER` 两处 `\Software\Classes` 子目录中的键值。不过，如果是写入的话，依然还是需要写入到 `HKEY_LOCAL_MACHINE` 和 `HKEY_CURRENT_USER` 中。

现在，我们在注册表中添加一个文件扩展名的关联。



### 使用 C# 编写 .NET 程序来实现



---

#### 参考资料

- [File Types and File Associations - Windows applications - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/shell/fa-intro)
- [chrome打开外部协议程序 - 东东东 陈煜东的博客](https://www.chenyudong.com/archives/chrome-open-external-protocal.html)
