---
title: ".NET 中选择合适的文件打开模式（CreateNew, Create, Open, OpenOrCreate, Truncate, Append）"
date: 2020-01-08 13:59:50 +0800
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

基于此文件流的修改会完全复写文件。也就是说，如果原文件内容是 `walterlv`，通过此文件流写入 `111`，那么最终文件内容是 `111`。

### `Open`

如果文件存在，则打开文件并返回此文件的文件流。如果文件不存在，则抛出 `FileNotFoundException`。

基于此文件流的修改不会截断文件。也就是说，如果原文件内容是 `walterlv`，通过此文件流写入 `111`，那么最终文件内容是 `111terlv`。

### `OpenOrCreate`

如果文件存在，则打开文件并返回此文件的文件流。如果文件不存在，则创建一个文件并返回新文件的文件流。

基于此文件流的修改不会截断文件。也就是说，如果原文件内容是 `walterlv`，通过此文件流写入 `111`，那么最终文件内容是 `111terlv`。

### `Truncate`

如果文件存在，则打开后文件的长度直接变为 0，随后返回此文件的文件流。如果文件不存在，则会抛出 `FileNotFoundException`。

由于在打开文件时就已经将文件设置为 0 字节，所以对应到上面截断的描述是一定会截断的。写入任何新内容到文件候，文件中都不会存在旧文件中的内容。

### `Append`

如果文件不存在，则创建一个新的文件并返回新文件的文件流。如果文件已经存在，则创建一个可以往文件的结尾处开始写的文件流。

如果试图从文件流中往前倒推找到此前的文件内容，会抛出 `IOException`。

## 总结表

| FileMode     | 如果文件存在 | 如果文件不存在        |
| ------------ | ------------ | --------------------- |
| CreateNew    | IOException  | 新建                  |
| Create       | 截断         | 新建                  |
| Open         | 打开         | FileNotFoundException |
| OpenOrCreate | 打开         | 新建                  |
| Truncate     | 截断         | FileNotFoundException |
| Append       | 追加         | 新建                  |

## 配合文件打开权限

在以上这些 `FileMode` 中，`CreateNew`、`Create`、`Truncate`、`Append` 都是需要写文件的权限的，`OpenOrCreate` 是否需要写权限则取决于文件是否存在。

## 附源码

以下是 `FileStream` 中的 `Open` 方法最终调用处。可以发现，此方法将传入的 `FileMode` 转换成了 Win32 中的值，并且最终调用了 Windows API `CreateFile`。

你可以阅读我的另一篇博客了解 Win32 API 中的 `CreateFile`：

- [Win32 方法 CreateFile 中选择合适的文件打开模式（CREATE_NEW, CREATE_ALWAYS, OPEN_EXISTING, OPEN_ALWAYS, TRUNCATE_EXISTING） - walterlv](/post/win32-file-open-modes)

```csharp
private unsafe SafeFileHandle CreateFileOpenHandle(FileMode mode, FileShare share, FileOptions options)
{
    Interop.Kernel32.SECURITY_ATTRIBUTES secAttrs = GetSecAttrs(share);

    int fAccess =
        ((_access & FileAccess.Read) == FileAccess.Read ? Interop.Kernel32.GenericOperations.GENERIC_READ : 0) |
        ((_access & FileAccess.Write) == FileAccess.Write ? Interop.Kernel32.GenericOperations.GENERIC_WRITE : 0);

    // Our Inheritable bit was stolen from Windows, but should be set in
    // the security attributes class.  Don't leave this bit set.
    share &= ~FileShare.Inheritable;

    // Must use a valid Win32 constant here...
    if (mode == FileMode.Append)
        mode = FileMode.OpenOrCreate;

    int flagsAndAttributes = (int)options;

    // For mitigating local elevation of privilege attack through named pipes
    // make sure we always call CreateFile with SECURITY_ANONYMOUS so that the
    // named pipe server can't impersonate a high privileged client security context
    // (note that this is the effective default on CreateFile2)
    flagsAndAttributes |= (Interop.Kernel32.SecurityOptions.SECURITY_SQOS_PRESENT | Interop.Kernel32.SecurityOptions.SECURITY_ANONYMOUS);

    using (DisableMediaInsertionPrompt.Create())
    {
        Debug.Assert(_path != null);
        return ValidateFileHandle(
            Interop.Kernel32.CreateFile(_path, fAccess, share, ref secAttrs, mode, flagsAndAttributes, IntPtr.Zero));
    }
}
```

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
