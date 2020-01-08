---
title: "Win32 方法 CreateFile 中选择合适的文件打开模式（CREATE_NEW, CREATE_ALWAYS, OPEN_EXISTING, OPEN_ALWAYS, TRUNCATE_EXISTING）"
publishDate: 2020-01-08 14:13:08 +0800
date: 2020-01-08 15:05:12 +0800
categories: windows dotnet csharp
position: knowledge
---

Windows 打开文件的 API 中提供了多种不同的文件打开方式。你可以根据你的业务场景选择适合你的文件打开方式。

---

<div id="toc"></div>
## Windows API

`OpenFile` 方法只能打开已经存在的文件，而使用 `CreateFile` 则可以在打开文件的同时应对不存在文件时的创建。

```cpp
HANDLE CreateFileW(
  LPCWSTR               lpFileName,
  DWORD                 dwDesiredAccess,
  DWORD                 dwShareMode,
  LPSECURITY_ATTRIBUTES lpSecurityAttributes,
  DWORD                 dwCreationDisposition,
  DWORD                 dwFlagsAndAttributes,
  HANDLE                hTemplateFile
);
```

其中 `dwCreationDisposition` 参数用来指定文件打开的时候如何处理文件的创建和追加行为。

## `dwCreationDisposition`

`dwCreationDisposition` 可以传入 5 种不同的值。

- `CREATE_NEW`
- `CREATE_ALWAYS`
- `OPEN_EXISTING`
- `OPEN_ALWAYS`
- `TRUNCATE_EXISTING`

为了方便查阅，我先将大家可能关心的内容做一个表格：

| `dwCreationDisposition` | 如果文件存在        | 如果文件不存在         |
| ----------------------- | ------------------- | ---------------------- |
| `CREATE_NEW`            | `ERROR_FILE_EXISTS` | 新建                   |
| `CREATE_ALWAYS`         | 截断                | 新建                   |
| `OPEN_EXISTING`         | 打开                | `ERROR_FILE_NOT_FOUND` |
| `OPEN_ALWAYS`           | 打开                | 新建                   |
| `TRUNCATE_EXISTING`     | 截断                | `ERROR_FILE_NOT_FOUND` |

所有这些打开模式都不会修改到文件的属性（Attribute），包括创建时间、针对用户的权限设置。所以如果你希望连这些属性都不需要，而是完完全全创建新的文件，那么请先将原来的文件删除。

### `CREATE_NEW`

如果文件不存在，则创建一个文件。如果文件不存在，则执行失败，通过 `GetLastError` 可以得到错误码 `ERROR_FILE_EXISTS` (80)。

### `CREATE_ALWAYS`

如果文件不存在，则创建一个新的文件。如果文件已经存在，则此文件将完全被复写。

基于此文件流的修改会完全复写文件。也就是说，如果原文件内容是 `walterlv`，通过此文件流写入 `111`，那么最终文件内容是 `111`。

### `OPEN_EXISTING`

如果文件存在，则打开文件。如果文件不存在，通过 `GetLastError` 可以得到错误码 `ERROR_FILE_NOT_FOUND` (2)。

基于此文件流的修改不会截断文件。也就是说，如果原文件内容是 `walterlv`，通过此文件流写入 `111`，那么最终文件内容是 `111terlv`。

### `OPEN_ALWAYS`

如果文件存在，那么会成功打开文件；并且也可以通过 `GetLastError` 可以得到状态 `ERROR_ALREADY_EXISTS` (183)。如果文件不存在，新建一个文件。

基于此文件流的修改不会截断文件。也就是说，如果原文件内容是 `walterlv`，通过此文件流写入 `111`，那么最终文件内容是 `111terlv`。

### `TRUNCATE_EXISTING`

如果文件存在，则打开后文件的长度直接变为 0。如果文件不存在，通过 `GetLastError` 可以得到错误码 `ERROR_FILE_NOT_FOUND` (2)。

---

**参考资料**

- [CreateFileW function (fileapi.h) - Win32 apps - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/api/fileapi/nf-fileapi-createfilew)
