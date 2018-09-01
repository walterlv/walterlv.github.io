---
title: "让控制台支持 ANSI 转义序列，输出下划线、修改颜色或其他控制"
publishDate: 2018-08-05 14:24:11 +0800
date: 2018-09-01 08:15:48 +0800
categories: windows dotnet csharp
---

各种操作系统的控制台都支持 ANSI 转义序列（ANSI Escape Code）。使用转义序列，可以对控制台进行很多额外的定制，例如修改颜色、修改标题栏，将文字添加下划线等。

当然，.NET 已经帮助我们封装了很大的一部分功能了，我们重点可以放在 .NET 没有封装的那部分上。

---

<div id="toc"></div>

### 基本的准备代码

在开始之前，我们先添加一些基础性代码，这是对系统核心功能的调用。

```csharp
const int STD_OUTPUT_HANDLE = -11;
const uint ENABLE_VIRTUAL_TERMINAL_PROCESSING = 0x0004;

[DllImport("kernel32.dll", SetLastError = true)]
static extern IntPtr GetStdHandle(int nStdHandle);

[DllImport("kernel32.dll")]
static extern bool GetConsoleMode(IntPtr hConsoleHandle, out uint lpMode);

[DllImport("kernel32.dll")]
static extern bool SetConsoleMode(IntPtr hConsoleHandle, uint dwMode);
```

在 Main 函数中，添加一些调用：

```csharp
static void Main(string[] args)
{
    Console.Title = "Walterlv.Demo";

    var handle = GetStdHandle(STD_OUTPUT_HANDLE);
    GetConsoleMode(handle, out var mode);
    mode |= ENABLE_VIRTUAL_TERMINAL_PROCESSING;
    SetConsoleMode(handle, mode);

    // 我们准备在这里添加新的代码。
    
    Console.Read();
}
```

### 开始使用 ANSI 转义序列

#### 添加下划线

```csharp
const string UNDERLINE = "\x1B[4m";
const string RESET = "\x1B[0m";
Console.WriteLine($"Some {UNDERLINE}underlined{RESET} text");
```

![下划线转义](/static/posts/2018-08-05-14-02-54.png)  
▲ 下划线转义

#### 修改颜色

```csharp
const string RED = "\x1B[31m";
Console.WriteLine($"Some {UNDERLINE}underlined{RESET} and {RED}red{RESET} text");
```

![颜色转义](/static/posts/2018-08-05-14-09-53.png)  
▲ 颜色转义（当然，.NET 封装有 API）

#### 其他转义序列

其他转义序列，可阅读 [ANSI escape code - Wikipedia](https://en.wikipedia.org/wiki/ANSI_escape_code)。不过 Windows 能支持的并不多。

关于颜色，不同控制台上对于相同转义序列的颜色值和颜色支持程度也不同。

### 关于 ENABLE_VIRTUAL_TERMINAL_PROCESSING

这是用来开启虚拟终端处理的一个标识，Windows 从一开始就默认关闭这个标识，必须通过 `SetConsoleMode` 手工开启。虽然在 10.0.10586 版本时短暂开启了一个版本，随后在 10.0.14393 中又再次默认关闭了。

---

#### 参考资料

- [SetConsoleMode function - Windows Console - Microsoft Docs](https://docs.microsoft.com/en-us/windows/console/setconsolemode)
- [Win10 New Console: Enable ENABLE_VIRTUAL_TERMINAL_PROCESSING by default (or with a flag) · Issue #92 · rprichard/winpty](https://github.com/rprichard/winpty/issues/92)
- [(Re?)enable ENABLE_VIRTUAL_TERMINAL_PROCESSING by default – Welcome to the Windows developer feedback site!](https://wpdev.uservoice.com/forums/266908-command-prompt-console-windows-subsystem-for-l/suggestions/15617610--re-enable-enable-virtual-terminal-processing-by)
- [ANSI escape code - Wikipedia](https://en.wikipedia.org/wiki/ANSI_escape_code)
- [c# - adding text decorations to console output - Stack Overflow](https://stackoverflow.com/q/5237666/6233938)
- [Windows 10 Command Prompt: New Console vs. Legacy Console - Password Recovery](https://www.top-password.com/blog/windows-10-command-prompt-new-console-vs-legacy-console/)
