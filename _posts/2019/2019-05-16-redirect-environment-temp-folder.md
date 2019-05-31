---
title: "通过修改环境变量修改当前进程使用的系统 Temp 文件夹的路径"
publishDate: 2019-05-16 10:48:53 +0800
date: 2019-05-16 20:03:57 +0800
categories: windows dotnet csharp wpf
position: problem
---

Windows 系统提供了一个在 Windows 单个用户下全局的 Temp 文件夹，用于给各种不同的应用程序提供一个临时目录。但是，直到 Windows 10 推出存储感知功能之前，这个文件夹都一直只归各个应用程序自己管理，应用自己需要删除里面的文件。另外，进程多了，临时文件也会互相影响（例如个数过多、进程读写竞争等等）。

本文介绍将自己当前进程的 Temp 文件夹临时修改到应用程序自己的一个临时目录下，避免与其他程序之间的各种影响，同时也比较容易自行清理。

---

<div id="toc"></div>

## 如何修改 Temp 文件夹的路径

在程序启动的时候，调用如下方法：

```csharp
var newTempFolder = @"C:\Walterlv\ApplicationTemp";
Environment.SetEnvironmentVariable("TEMP", newTempFolder);
Environment.SetEnvironmentVariable("TMP", newTempFolder);
```

这样，可以将当前进程的临时文件夹设置到 `C:\Walterlv\ApplicationTemp` 文件夹下。

上面设置了两个环境变量，实际上 .NET Framework 中主要使用的临时文件夹环境变量是 `TMP` 那个。

## 使用临时文件夹中的临时文件

使用 `Path.GetTempPath()` 可以获取临时文件夹的路径：

```csharp
var tempPath = Path.GetTempPath();
```

使用 `Path.GetTempFileName()` 可以生成一个唯一的临时文件文件名：

```csharp
var tempPath = Path.GetTempFileName();
```

不过，使用此方法需要注意，这要求临时文件夹必须存在。如果你使用了前面的方法修改了临时文件夹的地址，请务必确保文件夹存在。

## 扩展阅读

如果使用 `Path.GetTempFileName()` 方法创建的临时文件数量达到了 65535 个，而又不及时删除掉创建的文件的话，那么再调用此方法将抛出异常 `IOException`。

需要注意的是，此 API 调用创建的文件数量是当前用户账户下所有程序共同累计的，其他程序用“满”了你的进程也一样会挂。当然，如果你使用的不是 .NET 的 API，而是使用原生 Win32 API，那么你可以指定临时文件名前缀，相同临时文件名前缀的程序会累计数量。而 .NET 中此 API 使用的是 `tmp` 前缀，所以所有的 .NET 程序会共享这 65535 个文件累计；其他程序使用其他前缀使则分别累计。

另外，如果此方法无法再生成一个唯一的文件名的时候也会抛出异常。

为了解决这些异常，在用户端的解决方案是删除临时文件夹。而在程序端的解决方案是 —— 本文。

本文是为了和 [林德熙](https://blog.lindexi.com/) 一起解决一个光标问题时提出的解决方案的一种。更多关于光标问题的内容可以阅读以下链接：

- [Full temporary folder will crash cursor initialization · Issue #696 · dotnet/wpf](https://github.com/dotnet/wpf/issues/696)
- [WPF 光标初始化的时候 temp 文件夹满了无法创建](https://blog.lindexi.com/post/wpf-%E5%85%89%E6%A0%87%E5%88%9D%E5%A7%8B%E5%8C%96%E7%9A%84%E6%97%B6%E5%80%99-temp-%E6%96%87%E4%BB%B6%E5%A4%B9%E6%BB%A1%E4%BA%86%E6%97%A0%E6%B3%95%E5%88%9B%E5%BB%BA)

---

**参考资料**

- [c# - System.IO.IOException: "The file exists" when using System.IO.Path.GetTempFileName() - resolutions? - Stack Overflow](https://stackoverflow.com/q/18350699/6233938)
- [azure - .NET Change Temp Path - Stack Overflow](https://stackoverflow.com/a/4485432/6233938)
- [GetTempFileNameA function (fileapi.h) - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/api/fileapi/nf-fileapi-gettempfilenamea)
- [Path.GetTempFileName Method (System.IO) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/system.io.path.gettempfilename)
