---
title: "如何检测当前操作系统是否支持运行 .NET Core 3 / .NET 5 / .NET 6 应用？"
date: 2022-01-28 19:31:41 +0800
categories: dotnet windows
position: knowledge
coverImage: /static/posts/2022-01-28-19-23-34.png
---

虽然微软官方声称 .NET Core 3 / .NET 5 / .NET 6 应用支持在 Windows 7 及以上运行，但你不应该轻信。因为微软还在某个隐秘的角落里说明还应安装一枚 KB2533623 补丁。

直接判断补丁肯定是不靠谱的，因为还有其他几枚补丁（KB3063858、KB4457144）包含了这枚补丁。所以有没有什么靠谱写的判断方法呢？本文就来说说。


---

<div id="toc"></div>

## Windows 7 支持情况

### KB2533623 补丁

.NET Core 程序在 Windows 7 上需要 KB2533623 补丁才能运行本质上是需要它提供的这三个 Win32 函数：

- `SetDefaultDllDirectories`
- `AddDllDirectory`
- `RemoveDllDirectory`

而我们可以通过 `GetProcAddress` 来判断这这些函数是否存在。由于这三个函数是一起添加到 kernel32.dll 里的，所以只需判断一个即可。

更多内容可参考[林德熙](https://blog.lindexi.com/)的博客：[探索 dotnet core 为何在 Windows7 系统需要补丁的原因](https://blog.lindexi.com/post/%E6%8E%A2%E7%B4%A2-dotnet-core-%E4%B8%BA%E4%BD%95%E5%9C%A8-Windows7-%E7%B3%BB%E7%BB%9F%E9%9C%80%E8%A6%81%E8%A1%A5%E4%B8%81%E7%9A%84%E5%8E%9F%E5%9B%A0.html)。

### 国内设备支持情况

根据本文即所述的判断方法，目前（2022年春节）国内环境对于 .NET Core 的支持情况如下：

![国内 .NET Core 支持情况](/static/posts/2022-01-28-19-23-34.png)  
▲ 国内 Windows 7 以上系统对 .NET Core 支持情况统计（数据已脱敏，因此只提供百分比）

其中，各系统支持情况为：

| 系统                | 支持率 |
| ------------------- | ------ |
| Windows 7           | 32.9%  |
| Windows 7 SP1       | 97.1%  |
| Windows 8/8.1/10/11 | 100%   |

微软这些年一直在故意模糊 Windows 7 和 Windows 7 SP1 的界限，试图让不带 SP1 的 Windows 7 完全消失在任何微软的文档当中。然而，现实中的 Windows 7 可不会随着微软文档中相关文字的消失而消失。通过上表数据可以发现，不带 SP1 的 Windows 7 支持率低得可怜。好在 Windows 7（无 SP1）的设备数占所有 Windows 7 设备总数的 1.8%，不多也不少……还处于需要支持的数量级……

## C# 版判断方法

判断所需的 Win32 函数：

```csharp
[DllImport("kernel32.dll", CharSet = CharSet.Unicode, EntryPoint = "GetModuleHandleW", ExactSpelling = true, SetLastError = true)]
public static extern HMODULE GetModuleHandle([In][MarshalAs(UnmanagedType.LPWStr)] string lpModuleName);

[DllImport("kernel32.dll", CharSet = CharSet.Ansi, ExactSpelling = true, SetLastError = true, ThrowOnUnmappableChar = true)]
public static extern FARPROC GetProcAddress([In] HMODULE hModule, [In][MarshalAs(UnmanagedType.LPStr)] string lpProcName);
```

封装一个 C# 的调用，方便大家参考：

```csharp
/// <summary>
/// 检查当前操作系统是否支持 .NET Core 运行时。
/// </summary>
/// <returns>支持则返回 true；否则返回 false。</returns>
public static bool CheckOSIsNetCoreSupported()
{
    var kernel32ModuleHandle = Win32.Kernel32.GetModuleHandle("kernel32");
    if (kernel32ModuleHandle != IntPtr.Zero)
    {
        // .NET Core 程序运行必要，但缺补丁的系统没有的三个函数：
        //  - SetDefaultDllDirectories
        //  - AddDllDirectory
        //  - RemoveDllDirectory
        var setDefaultDllDirectoriesProcAddress = Win32.Kernel32.GetProcAddress(kernel32ModuleHandle, "SetDefaultDllDirectories");
        return setDefaultDllDirectoriesProcAddress != IntPtr.Zero;
    }
    else
    {
        throw new InvalidOperationException("因为调用错误，无法获取 kernel32 的 ModuleName。");
    }
}
```

## C++ 版判断方法

挖个坑，明天更新……

---

**参考资料**

- [探索 dotnet core 为何在 Windows7 系统需要补丁的原因](https://blog.lindexi.com/post/%E6%8E%A2%E7%B4%A2-dotnet-core-%E4%B8%BA%E4%BD%95%E5%9C%A8-Windows7-%E7%B3%BB%E7%BB%9F%E9%9C%80%E8%A6%81%E8%A1%A5%E4%B8%81%E7%9A%84%E5%8E%9F%E5%9B%A0.html)
- [Microsoft Security Advisory: Insecure library loading could allow remote code execution](https://support.microsoft.com/en-us/topic/microsoft-security-advisory-insecure-library-loading-could-allow-remote-code-execution-486ea436-2d47-27e5-6cb9-26ab7230c704)
- [Microsoft 安全公告：不安全的库加载可能允许远程执行代码](https://support.microsoft.com/zh-cn/topic/microsoft-%E5%AE%89%E5%85%A8%E5%85%AC%E5%91%8A-%E4%B8%8D%E5%AE%89%E5%85%A8%E7%9A%84%E5%BA%93%E5%8A%A0%E8%BD%BD%E5%8F%AF%E8%83%BD%E5%85%81%E8%AE%B8%E8%BF%9C%E7%A8%8B%E6%89%A7%E8%A1%8C%E4%BB%A3%E7%A0%81-486ea436-2d47-27e5-6cb9-26ab7230c704)

