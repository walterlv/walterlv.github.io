---
title: ".NET/C# 获取一个正在运行的进程的命令行参数"
publishDate: 2019-02-19 21:51:19 +0800
date: 2019-03-09 09:12:11 +0800
categories: dotnet csharp windows
position: knowledge
---

在自己的进程内部，我们可以通过 `Main` 函数传入的参数，也可以通过 `Environment.GetCommandLineArgs` 来获取命令行参数。

但是，可以通过什么方式来获取另一个运行着的程序的命令行参数呢？

---

进程内部获取传入参数的方法，可以参见我的另一篇博客：[.NET 命令行参数包含应用程序路径吗？](/post/when-will-the-command-line-args-contain-the-executable-path)。

.NET Framework / .NET Core 框架内部是不包含获取其他进程命令行参数的方法的，但是我们可以在任务管理器中看到，说明肯定存在这样的方法。

![任务管理器中的命令行参数](/static/posts/2019-02-19-21-04-41.png)

实际上方法是有的，不过这个方法是 Windows 上的专属方法。

对于 .NET Framework，需要引用程序集 `System.Management`；对于 .NET Core 需要引用 `Microsoft.Windows.Compatibility` 这个针对 Windows 系统准备的兼容包（不过这个兼容包目前还是预览版本）。

```xml
<ItemGroup Condition="$(TargetFramework) == 'netcoreapp2.1'">
    <PackageReference Include="Microsoft.Windows.Compatibility" Version="2.1.0-preview.19073.11" />
</ItemGroup>
<ItemGroup Condition="$(TargetFramework) == 'net472'">
    <Reference Include="System.Management" />
</ItemGroup>
```

然后，我们使用 `ManagementObjectSearcher` 和 `ManagementBaseObject` 来获取命令行参数。

为了简便，我将其封装成一个扩展方法，其中包括对于一些异常的简单处理。

```csharp
using System;
using System.Diagnostics;
using System.Linq;
using System.Management;

namespace Walterlv
{
    /// <summary>
    /// 为 <see cref="Process"/> 类型提供扩展方法。
    /// </summary>
    public static class ProcessExtensions
    {
        /// <summary>
        /// 获取一个正在运行的进程的命令行参数。
        /// 与 <see cref="Environment.GetCommandLineArgs"/> 一样，使用此方法获取的参数是包含应用程序路径的。
        /// 关于 <see cref="Environment.GetCommandLineArgs"/> 可参见：
        /// .NET 命令行参数包含应用程序路径吗？https://blog.walterlv.com/post/when-will-the-command-line-args-contain-the-executable-path.html
        /// </summary>
        /// <param name="process">一个正在运行的进程。</param>
        /// <returns>表示应用程序运行命令行参数的字符串。</returns>
        public static string GetCommandLineArgs(this Process process)
        {
            if (process is null) throw new ArgumentNullException(nameof(process));

            try
            {
                return GetCommandLineArgsCore();
            }
            catch (Win32Exception ex) when ((uint) ex.ErrorCode == 0x80004005)
            {
                // 没有对该进程的安全访问权限。
                return string.Empty;
            }
            catch (InvalidOperationException)
            {
                // 进程已退出。
                return string.Empty;
            }

            string GetCommandLineArgsCore()
            {
                using (var searcher = new ManagementObjectSearcher(
                    "SELECT CommandLine FROM Win32_Process WHERE ProcessId = " + process.Id))
                using (var objects = searcher.Get())
                {
                    var @object = objects.Cast<ManagementBaseObject>().SingleOrDefault();
                    return @object?["CommandLine"]?.ToString() ?? "";
                }
            }
        }
    }
}
```

使用此方法得到的命令行参数是一个字符串，而不是我们通常使用字符串时的字符串数组。如果你需要将其转换为字符串数组，可以使用我在另一篇博客中使用的方法：

- [.NET/C# 将一个命令行参数字符串转换为命令行参数数组 args](/post/convert-command-line-string-to-args-array)

---

**参考资料**

- [Can I get command line arguments of other processes from .NET/C#? - Stack Overflow](https://stackoverflow.com/a/2633674/6233938)
- [How to get Command Line info for a process in PowerShell or C# - Stack Overflow](https://stackoverflow.com/a/17582576/6233938)
