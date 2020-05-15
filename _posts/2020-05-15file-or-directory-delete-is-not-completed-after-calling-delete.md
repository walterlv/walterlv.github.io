---
title: ".NET/Windows：删除文件夹后立即判断，有可能依然存在"
date: 2020-05-15 15:26:19 +0800
categories: windows dotnet csharp
position: problem
---

如果你不了解本文的内容，可能会在未来某个时候踩坑--你可能在判断文件夹是否存在的时候得到错误的返回值。

---

<div id="toc"></div>

## 删除文件（夹）

使用 .NET 带的删除文件夹的方法：

```csharp
Directory.Delete("D:\walterlv");
```

或者使用其他删除文件（夹）的方法，大多数是以下 Windows API 的封装：

```cpp
BOOL DeleteFile(
  LPCTSTR lpFileName
);
BOOL RemoveDirectoryA(
  LPCSTR lpPathName
);
BOOL RemoveDirectoryW(
  LPCWSTR lpPathName
);
```

于是，大多数删除文件（夹）的代码都会遇到问题：**文件或文件夹可能没有立即删除**！

## 测试程序

```csharp
using System;
using System.IO;

class Program
{
    static void Main(string[] args)
    {
        var dirPath = @"C:\Users\lvyi\Desktop\Test";
        while (true)
        {
            Console.WriteLine(Directory.Exists(dirPath));
            Directory.CreateDirectory(dirPath);
            Directory.Delete(dirPath);
        }
    }
}
```

你猜会输出什么？每一行都输出 `False` 吗？

然而实际上是：

![输出](/static/posts/2020-05-15-15-12-13.png)

嗯……会混入少量的 `True` 在里面。这是不是有点“不符合预期”？

## 原因

删除文件夹的本质方法 `RemoveDirectory` 在微软的官网中就已经解释了：

> The RemoveDirectory function marks a directory for deletion on close. Therefore, the directory is not removed until the last handle to the directory is closed.

> `RemoveDirectory` 函数将标记一个文件夹在关闭后删除。这意味着在最后一个此文件夹的句柄关闭之前，此文件夹将一直不会删除。

所以调用完删除文件夹的方法后，仅仅只是标记这个文件夹要删除而已。那么随后立即获取此文件夹是否存在，将取决于前面调用删除后是否真的删除了文件夹。

删除文件的本质方法 `DeleteFile` 也有类似的解释：

> The DeleteFile function marks a file for deletion on close. Therefore, the file deletion does not occur until the last handle to the file is closed. Subsequent calls to CreateFile to open the file fail with ERROR_ACCESS_DENIED.

> `DeleteFile` 函数将标记一个文件在关闭后删除。这意味着在最后一个文件句柄关闭之前，此文件将一直不会删除。如果随后立即调用 `CreateFile` 来打开一个文件的话可能会遭遇错误 `ERROR_ACCESS_DENIED`。

## 解决方法

因此，不要再依赖于判断文件夹是否存在来决定某个业务。例如，可以考虑创建文件夹之前不判断文件夹是否存在：

```diff
--  if (Directory.Exists(path))
--  {
        Directory.CreateDirectory(path);
--  }
```

注意，以上红色色块标记的代码应该删除！否则你可能会发现这段代码执行完成后，文件夹是不存在的。

如果试图删除文件随后新建空白的文件或者其他文件的话，可以考虑我在另一篇博客中提到的创建或打开文件的方法，用来应对文件不存在的情况：

- [.NET 中选择合适的文件打开模式（CreateNew, Create, Open, OpenOrCreate, Truncate, Append） - walterlv](/post/dotnet-file-open-modes.html)
- [Win32 方法 CreateFile 中选择合适的文件打开模式（CREATE_NEW, CREATE_ALWAYS, OPEN_EXISTING, OPEN_ALWAYS, TRUNCATE_EXISTING） - walterlv](/post/win32-file-open-modes.html)

---

**参考资料**

- [RemoveDirectoryA function (fileapi.h) - Win32 apps - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-removedirectorya)
- [DeleteFile function (winbase.h) - Win32 apps - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/api/winbase/nf-winbase-deletefile)
