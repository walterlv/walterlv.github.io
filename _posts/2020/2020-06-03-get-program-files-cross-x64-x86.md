---
title: "拿别人的 Program Files 文件夹？别忘了考虑 x86/x64 路径"
date: 2020-06-03 08:13:44 +0800
categories: dotnet win32
position: starter
---

要拿适用于自己进程的 `Program Files` 文件夹很简单，无脑拿就好了。不过，如果涉及到拿其他程序的，那么就会涉及到与其他程序不同架构时路径不同的问题。

---

`Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles)` 即可用来获取 `Program Files` 文件夹的路径。从 .NET Framework 4.0 开始，还增加了一个 `ProgramFilesX86` 枚举可用。

在官方文档中，`ProgramFiles` 枚举拿的是当前进程架构下的 `Program Files` 文件夹，`ProgramFilesX86` 拿的是 `x86` 进程架构下的 `Program Files` 文件夹。

为了具体说明，可以用下面的示例程序：

```csharp
using System;

namespace Walterlv.Demo
{
    class Program
    {
        static void Main(string[] args)
        {
            var is64Bit = Environment.Is64BitProcess;
            var pfx86 = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFilesX86);
            var pf = Environment.GetFolderPath(Environment.SpecialFolder.ProgramFiles);

            Console.WriteLine($"process = {(is64Bit ? "x64" : "x86")}");
            Console.WriteLine($"x86     = {pfx86}");
            Console.WriteLine($"current = {pf}");
        }
    }
}
```

在 x64 系统下，输出是：

```ini
process = x64
x86     = C:\Program Files (x86)
current = C:\Program Files
```

在 x86 系统下，输出是：

```ini
process = x86
x86     = C:\Program Files (x86)
current = C:\Program Files (x86)
```

所以，只是通过此属性的话，x86 进程不能获取到 x64 进程的目录。

---

**参考资料**

- [Environment.SpecialFolder Enum (System) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/system.environment.specialfolder)
- [C# - How to get Program Files (x86) on Windows 64 bit - Stack Overflow](https://stackoverflow.com/questions/194157/c-sharp-how-to-get-program-files-x86-on-windows-64-bit)
