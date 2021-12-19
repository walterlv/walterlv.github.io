---
title: ".NET/C# 将一个命令行参数字符串转换为命令行参数数组 args"
date: 2019-02-19 21:49:15 +0800
tags: dotnet csharp windows
position: knowledge
permalink: /post/convert-command-line-string-to-args-array.html
---

我们通常得到的命令行参数是一个字符串数组 `string[] args`，以至于很多的命令行解析库也是使用数组作为解析的参数来源。

然而如我我们得到了一整个命令行字符串呢？这个时候可能我们原有代码中用于解析命令行的库或者其他辅助函数不能用了。那么如何转换成数组呢？

---

在 Windows 系统中有函数 [CommandLineToArgvW](https://docs.microsoft.com/en-us/windows/desktop/api/shellapi/nf-shellapi-commandlinetoargvw) 可以直接将一个字符串转换为命令行参数数组，我们可以直接使用这个函数。

```cpp
LPWSTR * CommandLineToArgvW(
  LPCWSTR lpCmdLine,
  int     *pNumArgs
);
```

此函数在 shell32.dll 中，于是我们可以在 C# 中调用此函数。

为了方便使用，我将其封装成了一个静态方法。

```csharp
using System;
using System.ComponentModel;
using System.Runtime.InteropServices;

namespace Walterlv
{
    public static class CommandLineExtensions
    {
        public static string[] ConvertCommandLineToArgs(string commandLine)
        {
            var argv = CommandLineToArgvW(commandLine, out var argc);
            if (argv == IntPtr.Zero)
            {
                throw new Win32Exception("在转换命令行参数的时候出现了错误。");
            }

            try
            {
                var args = new string[argc];
                for (var i = 0; i < args.Length; i++)
                {
                    var p = Marshal.ReadIntPtr(argv, i * IntPtr.Size);
                    args[i] = Marshal.PtrToStringUni(p);
                }

                return args;
            }
            finally
            {
                Marshal.FreeHGlobal(argv);
            }
        }

        [DllImport("shell32.dll", SetLastError = true)]
        static extern IntPtr CommandLineToArgvW([MarshalAs(UnmanagedType.LPWStr)] string lpCmdLine, out int pNumArgs);
    }
}
```

---

**参考资料**

- [CommandLineToArgvW function - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/api/shellapi/nf-shellapi-commandlinetoargvw)
- [Converting Command Line String to Args[] using CommandLineToArgvW() API - IntelliTect](https://intellitect.com/converting-command-line-string-to-args-using-commandlinetoargvw-api/)
- [Split string containing command-line parameters into string[] in C# - Stack Overflow](https://stackoverflow.com/a/749653/6233938)

