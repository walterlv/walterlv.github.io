---
title: ".NET 中选择合适的文件打开模式（CreateNew, Create, Open, OpenOrCreate, Truncate, Append）"
date: 2020-01-08 13:28:31 +0800
categories: dotnet csharp windows
position: knowledge
---

.NET 中文件打开的 API `File.Open` 提供了多种不同的文件打开方式，这些方式大多数与 Windows 文件 API 中的模式是对应的，但也有一些 .NET 层面的判断以及名称的变化。在 .NET 层你可以选择适合你业务场景需要的文件打开方式。

---

<div id="toc"></div>

## 文件打开方式

文件打开的多个重载方法中，除了封装好的 `OpenRead` / `OpenWrite` 之外，其他都是需要指定 `FileMode` 参数的。

```csharp
public static FileStream Open(string path, FileMode mode);
```

## `FileMode`

FileMode 枚举有 6 种不同的值：

```csharp
public enum FileMode
{
    CreateNew = 1,
    Create = 2,
    Open = 3,
    OpenOrCreate = 4,
    Truncate = 5,
    Append = 6,
}
```

注意，在 `File.Open` 方法中传入以下这些参数的含义描述中可能有一些包含过程和判断的语句，但实际上这些真正的判断和过程发生在 Windows 内核（虽然 .NET 也有一些判断，但是一些参数预判断和参数转换），所以实际拿到文件流（对应 Win32 中拿到句柄）是一个原子操作，不会因为中间加了判断导致与其他线程发生竞争。

### `CreateNew`

如果文件不存在，则创建一个新的文件并返回新文件的文件流。如果文件已经存在，则抛出 `IOException`。

### `Create`

如果文件不存在，则创建一个新的文件并返回新文件的文件流。如果文件已经存在，则打开文件并返回此文件的文件流。

基于此文件流的修改会完全复写文件。也就是说，如果原文件内容是 `welcome to read walterlv's blog: blog.walterlv.com`，通过此文件流写入 `welcome to read lindexi's blog`，那么最终文件内容是 `welcome to read lindexi's blog`。

### `Open`

如果文件存在，则打开文件并返回此文件的文件流。如果文件不存在，则抛出 `FileNotFoundException`。

基于此文件流的修改不会截断文件。也就是说，如果原文件内容是 `welcome to read walterlv's blog: blog.walterlv.com`，通过此文件流写入 `welcome to read lindexi's blog`，那么最终文件内容是 `welcome to read lindexi's blogg: blog.walterlv.com`。

### `OpenOrCreate`

如果文件存在，则打开文件并返回此文件的文件流。如果文件不存在，则创建一个文件并返回新文件的文件流。

基于此文件流的修改不会截断文件，也就是说，如果原文件内容是 `welcome to read walterlv's blog: blog.walterlv.com`，通过此文件流写入 `welcome to read lindexi's blog`，那么最终文件内容是 `welcome to read lindexi's blogg: blog.walterlv.com`。

### `Truncate`

如果文件存在，则打开后文件的淌直接变为 0，随后返回此文件的文件流。如果文件不存在，则会抛出 `FileNotFoundException`。

由于在打开文件时就已经将文件设置为 0 字节，所以对应到上面截断的描述是一定会截断的。写入任何新内容到文件候，文件中都不会存在旧文件中的内容。

### `Append`

如果文件不存在，则创建一个新的文件并返回新文件的文件流。如果文件已经存在，则创建一个可以往文件的结尾处开始写的文件流。

如果试图从文件流中往前倒推找到此前的文件内容，会抛出 `IOException`。

## 配合文件打开权限

在以上这些 `FileMode` 中，`CreateNew`、`Create`、`Truncate`、`Append` 都是需要写文件的权限的，`OpenOrCreate` 是否需要写权限则取决于文件是否存在。

## 附源码

```csharp
// Contains constants for specifying how the OS should open a file.
// These will control whether you overwrite a file, open an existing
// file, or some combination thereof.
//
// To append to a file, use Append (which maps to OpenOrCreate then we seek
// to the end of the file).  To truncate a file or create it if it doesn't
// exist, use Create.
//
public enum FileMode
{
    // Creates a new file. An exception is raised if the file already exists.
    CreateNew = 1,

    // Creates a new file. If the file already exists, it is overwritten.
    Create = 2,

    // Opens an existing file. An exception is raised if the file does not exist.
    Open = 3,

    // Opens the file if it exists. Otherwise, creates a new file.
    OpenOrCreate = 4,

    // Opens an existing file. Once opened, the file is truncated so that its
    // size is zero bytes. The calling process must open the file with at least
    // WRITE access. An exception is raised if the file does not exist.
    Truncate = 5,

    // Opens the file if it exists and seeks to the end.  Otherwise,
    // creates a new file.
    Append = 6,
}
```

---

**参考资料**

- [FileMode Enum (System.IO) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/system.io.filemode?view=netframework-4.8)
