---
title: "Windows 中的 HRESULT"
date: 2021-06-16 10:51:05 +0800
categories: windows
position: knowledge
---

Windows 协议文档中所描述的协议规范中，错误码使用 HRESULT、Win32 错误码和 NTSTATUS 来描述。本文科普一下 HRESULT。

---

<div id="toc"></div>

## 一个简单的例子

我们先举一个大家可能常用的 HRESULT 例子，这样后面的介绍能更简单一点。

```powershell
0x80070070
```

将它改写成二进制：

```powershell
1000 0000 0000 0111 0000 0000 0111 0000
```

<!-- | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 0 | 1 |
| - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - | - |
| 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 0 | 1 | 1 | 1 | 0 | 0 | 0 | 0 | -->

它的意思是“There is not enough space on the disk.”即“磁盘空间不足。”

## 规范中的 HRESULT

按照规范，HRESULT 的格式如下，其中首行的数字代表第几位（bit）：

| 0 | 1 | 2 | 3 | 4 | 5~15     | 16~31 |
| - | - | - | - | - | -------- | ----- |
| S | R | C | N | X | Facility | Code  |

- **S**: 1 位，表示严重性。为 1 表示此结果为失败，为 0 表示此结果为成功。
- **R**: 1 位，保留位。如果 N 位是 0，那么此位必须也是 0。如果 N 位是 1，那么此位由 NTSTATUS 定义的数字范围决定。
- **C**: 1 位，自定义位。为 1 表示由微软定义，为 0 表示由其他厂商定义。
- **N**: 1 位。为 1 表示此结果为 NTSTATUS 错误码。
- **X**: 1 位。保留位，应设为 0。
- **Facility**: 11 位。设施代码。指定错误来源。后面的列表中有已定义的错误源，微软偶尔会添加新的种类。
- **Code**: 16 位（2 字节）。错误码的其他部分，指定错误的具体细节。

其中，Facility 设施代码的详细列表可以参见这里：[[MS-ERREF]: HRESULT - Microsoft Docs](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-erref/0642cb2f-2075-4469-918c-4441e69c548a)。对 Win32 开发来说，0x7 是很常见的，表示 `FACILITY_WIN32`。

## Win32 错误码

现在再来看我们前面的例子：

```powershell
1000 0000 0000 0111 0000 0000 0111 0000
```

- 严重性：1，表示失败
- 设施代码：0x7，表示 `FACILITY_WIN32`
- 错误码：0x70，表示 `ERROR_DISK_FULL`

所有的 Win32 错误码应该仅使用 16 位来表示，即范围从 0x0000 到 0xFFFF。关于 Win32 错误码的详细列表可以参见这里：[[MS-ERREF]: Win32 Error Codes - Microsoft Docs](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-erref/18d8fbe8-a967-4f1c-ae50-99ca8e491d2d)

## 微软错误查询工具

如果你遇到了某个 Win32 错误码，或者 HRESULT 值，那么可以使用微软错误查询工具（The Microsoft Error Lookup Tool）查询其含义。

下载地址：[Download Microsoft Error Lookup Tool from Official Microsoft Download Center](https://www.microsoft.com/en-us/download/details.aspx?id=100432)

![错误查询工具](/static/posts/2021-06-16-10-36-42.png)

## 在 .NET/C# 代码中的使用

例如，我们可能需要在一些 IO 操作中处理好磁盘空间已满的情况：

```csharp
try
{
    SaveFile(fileContent, filePath);
}
catch (IOException ex)
{
    if (ex.IsDiskFullException())
    {
        // 磁盘空间已满。
        break;
    }
}
```

由于磁盘空间已满没有对应的 .NET Exception，所以我们只能通过提取 `IOException` 中的 `HResult` 属性来判断操作的 HRESULT 值。

我们定义了一个扩展方法 `IsDiskFullException`，实现如下：

```csharp
/// <summary>
/// There is not enough space on the disk.
/// 磁盘空间不足。
/// </summary>
private static readonly int ERROR_DISK_FULL = 0x0070;

/// <summary>
/// 判断某个 <see cref="IOException"/> 是否是“磁盘空间不足”的异常。
/// </summary>
/// <param name="ex">IO 异常。</param>
/// <returns></returns>
public static bool IsDiskFullException(this IOException ex)
{
    var errorCode = ex.HResult & 0xFFFF;
    return errorCode == ERROR_DISK_FULL;
}
```

---

**参考资料**

- [MS-ERREF: HRESULT - Microsoft Docs](https://docs.microsoft.com/en-us/openspecs/windows_protocols/ms-erref/0642cb2f-2075-4469-918c-4441e69c548a)
- [HRESULT - 维基百科，自由的百科全书](https://zh.wikipedia.org/wiki/HRESULT)
- [The Microsoft Error Lookup Tool - Win32 apps - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/debug/system-error-code-lookup-tool)
