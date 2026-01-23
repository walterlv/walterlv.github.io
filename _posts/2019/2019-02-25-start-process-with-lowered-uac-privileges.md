---
title: "在 Windows 系统上降低 UAC 权限运行程序（从管理员权限降权到普通用户权限）"
publishDate: 2019-02-25 07:28:19 +0800
date: 2026-01-05 12:50:19 +0800
tags: windows dotnet csharp
position: problem
permalink: /post/start-process-with-lowered-uac-privileges.html
---

在 Windows 系统中，管理员权限和非管理员权限运行的程序之间不能使用 Windows 提供的通信机制进行通信。对于部分文件夹（ProgramData），管理员权限创建的文件是不能以非管理员权限修改和删除的。

然而，一个进程运行之后启动的子进程，会**继承当前进程的 UAC 权限**；于是有时我们会有降权运行的需要。本文将介绍 Windows 系统上降权运行的几种方法。

---

本文的降权运行指的是：

1. 有一个 A 程序是以管理员权限运行的（典型的，如安装包）；
1. 有一个 B 程序会被 A 启动（我们期望降权运行的 B 程序）。

<div id="toc"></div>

## 如何判断当前进程的 UAC 权限

通过下面的代码，可以获得当前进程的 UAC 权限。

```csharp
var identity = WindowsIdentity.GetCurrent();
var principal = new WindowsPrincipal(identity);
```

而如果要判断是否是管理员权限，则使用：

```csharp
if (principal.IsInRole(WindowsBuiltInRole.Administrator))
{
    // 当前正在以管理员权限运行。
}
```

此代码如果在 .NET Core 中编写，需要额外安装 Windows 兼容包：[Microsoft.Windows.Compatibility](https://www.nuget.org/packages/Microsoft.Windows.Compatibility)。

## 方法一：使用 runas 命令来运行程序（推荐）

使用 `runas` 命令来运行，可以指定一个权限级别：

```powershell
> runas /trustlevel:0x20000 "C:\Users\walterlv\Desktop\walterlv.exe"
```

```csharp
var subProcessFileName = @"C:\Users\walterlv\Desktop\walterlv.exe";
Process.Start("runas.exe", $"/trustlevel:0x20000 {subProcessFileName}");
```

关于 runas 的更多细节，可以参考我的另一篇博客：

- [Windows 下使用 runas 命令以指定的权限启动一个进程（非管理员、管理员） - 吕毅](/post/start-process-in-a-specific-trust-level)

## 方法二：使用 explorer.exe 代理运行程序

**请特别注意**，使用 explorer.exe 代理运行程序的时候，是不能带参数的，否则 explorer.exe 将不会启动你的程序。

因为绝大多数用户启动系统的时候，explorer.exe 进程都是处于运行状态，而如果启动一个新的 explorer.exe，都会自动激活当前正在运行的进程而不会启动新的。

于是我们可以委托默认以普通权限运行的 explorer.exe 来代理启动我们需要启动的子进程，这时启动的子进程便是与 explorer.exe 相同权限的。

```csharp
var subProcessFileName = "C:\Users\walterlv\Desktop\walterlv.exe";
Process.Start("explorer.exe", subProcessFileName);
```

如果用户计算机上的 UAC 是打开的，那么 explorer.exe 默认就会以标准用户权限运行。通过以上代码，`walterlv.exe` 就会以与 explorer.exe 相同权限运行，也就是降权运行了。

不过值得注意的是，Windows 7 上控制面板的 UAC 设置拉倒最低就是关掉 UAC 了；Windows 8 开始拉倒最底 UAC 还是打开的，只是不会提示 UAC 弹窗而已。也就是说，拉倒最底的话，Windows 7 的 UAC 就会关闭，explorer.exe 就会以管理员权限启动。

下面的代码，如果发现自己是以管理员权限运行的，那么就降权重新运行自己，然后自己退出。（当然在关闭 UAC 的电脑上是无效的。）

```csharp
var identity = WindowsIdentity.GetCurrent();
var principal = new WindowsPrincipal(identity);
if (principal.IsInRole(WindowsBuiltInRole.Administrator))
{
    // 检测到当前进程是以管理员权限运行的，于是降权启动自己之后，把自己关掉。
    Process.Start("explorer.exe", Assembly.GetEntryAssembly().Location);
    Shutdown();
    return;
}
```

**请再次特别注意**，使用 explorer.exe 代理运行程序的时候，是不能带参数的，否则 explorer.exe 将不会启动你的程序。

## 方法三：在启动进程时传入用户名和密码

`ProcessStartInfo` 中有 `UserName` 和 `Password` 属性，设置此属性可以以此计算机上的另一个用户身份启动此进程。如果这个用户是普通用户，那么就会以普通权限运行此进程。

```csharp
var processInfo = new ProcessStartInfo
{
    Verb = "runas",
    FileName = "walterlv.exe",
    UserName = "walterlv",
    Password = ReadPassword(),
    UseShellExecute = false,
    LoadUserProfile = true
};
Process.Start(processInfo);
```

上面的 `ReadPassword` 函数来自我的另一篇博客：[如何让 .NET Core 命令行程序接受密码的输入而不显示密码明文 - walterlv](/post/input-password-with-mask-in-cli)。

然而，此方法最大的问题在于——产品级的程序，不可能也不应该知道用户的密码！所以实际上这样的方法并不实用。

## 方法四：使用 Shell 进程的 Access Token 来启动进程

此方法需要较多的 Windows API 调用，步骤如下：

1. 通过 GetShellWindow 方法获取 Shell 窗口的窗口句柄，然后通过 GetWindowThreadProcessId 从 Shell 窗口的窗口句柄获取 Shell 进程。一般而言，这里的 Shell 进程就是 explorer.exe 进程
2. 通过 OpenProcess_SafeHandle 和 OpenProcessToken 方法获取到 Shell 进程的 Access Token 用于后续启动进程。将拿到的 Access Token 传入 DuplicateTokenEx 方法进行复制，用于创建进程时传入
3. 将 DuplicateTokenEx 方法获取的 Access Token 传入到 CreateProcessWithToken 方法创建进程

核心的代码如下：

```csharp
public static class ProcessRunner
{
    /// <summary>
    /// 降权启动
    /// </summary>
    /// <param name="fileName"></param>
    /// <param name="arguments"></param>
    /// <param name="logger"></param>
    /// <returns></returns>
    [SupportedOSPlatform("windows6.0.6000")] // 绝大部分方法都是 5.x 就可以用的，只有 CreateProcessWithToken 是 6.0.6000 才有的。好在 Windows Vista 就是 6.0 了。而 Win7 都到 6.1 了
    public static unsafe StartProcessWithShellProcessTokenResult StartProcessWithShellProcessToken(string fileName, string? arguments)
    {
        if (!new WindowsPrincipal(WindowsIdentity.GetCurrent()).IsInRole(WindowsBuiltInRole.Administrator))
        {
            var process = Process.Start(new ProcessStartInfo(fileName, arguments ?? string.Empty)
            {
                WorkingDirectory = Path.GetDirectoryName(fileName)
            });

            if (process != null)
            {
                return new StartProcessWithShellProcessTokenResult(true, process.Id, "OK");
            }
            else
            {
                return new(false, -1, "Process.Start return null");
            }
        }

        var shellWindow = GetShellWindow();
        if (shellWindow == IntPtr.Zero)
        {
            return new(false, -1, "GetShellWindow Failed");
        }

        GetWindowThreadProcessId(shellWindow, out var processId);

        if (processId == 0)
        {
            return new(false, -1, "GetWindowThreadProcessId Failed");
        }

        SafeHandle? processHandle = null;
        SafeFileHandle? shellToken = null;
        SafeFileHandle? duplicateToken = null;
        try
        {
            processHandle = OpenProcess_SafeHandle(PROCESS_ACCESS_RIGHTS.PROCESS_QUERY_INFORMATION, false, processId);
            if (processHandle.IsInvalid)
            {
                var errorCode = Marshal.GetLastPInvokeError();

                return new(false, -1, $"OpenProcess Failed {errorCode}: {Marshal.GetPInvokeErrorMessage(errorCode)}");
            }

            if (!OpenProcessToken(processHandle, (TOKEN_ACCESS_MASK) 0x02000000, out shellToken))
            {
                var errorCode = Marshal.GetLastPInvokeError();

                return new(false, -1, $"OpenProcessToken Failed {errorCode}: {Marshal.GetPInvokeErrorMessage(errorCode)}");
            }

            if (!DuplicateTokenEx(shellToken, (TOKEN_ACCESS_MASK) 0x02000000, null,
                    SECURITY_IMPERSONATION_LEVEL.SecurityImpersonation, TOKEN_TYPE.TokenPrimary, out duplicateToken))
            {
                var errorCode = Marshal.GetLastPInvokeError();

                return new(false, -1, $"DuplicateTokenEx Failed {errorCode}: {Marshal.GetPInvokeErrorMessage(errorCode)}");

            }

            var startupInfo = new STARTUPINFOW
            {
                cb = (uint) Unsafe.SizeOf<STARTUPINFOW>(),
            };
            var commandLine = $@"""{fileName}"" {arguments}";
            Span<char> lpCommandLine = stackalloc char[commandLine.Length + 1];
            commandLine.AsSpan().CopyTo(lpCommandLine);

            var result = CreateProcessWithToken(duplicateToken, 0, null, ref lpCommandLine,
                0, null, Path.GetDirectoryName(fileName)!, in startupInfo, out var information);
            if (!result)
            {
                var errorCode = Marshal.GetLastPInvokeError();

                return new(false, -1, $"CreateProcessWithTokenW Failed {errorCode}: {Marshal.GetPInvokeErrorMessage(errorCode)}");
            }
            else
            {
                CloseHandle(information.hProcess);
                CloseHandle(information.hThread);
            }

            return new(true, (int) information.dwProcessId, "OK");
        }
        finally
        {
            if (processHandle?.IsInvalid is false)
            {
                CloseHandle((HANDLE) processHandle.DangerousGetHandle());
            }

            if (shellToken?.IsInvalid is false)
            {
                CloseHandle((HANDLE) shellToken.DangerousGetHandle());
            }

            if (duplicateToken?.IsInvalid is false)
            {
                CloseHandle((HANDLE) duplicateToken.DangerousGetHandle());
            }
        }
    }
}

public readonly record struct StartProcessWithShellProcessTokenResult(bool Success, int ProcessId, string? ErrorMessage);
```

所需的 Win32 API 均通过 [CsWin32](https://www.nuget.org/packages/Microsoft.Windows.CsWin32) 库实现，其 NativeMethods.txt 内容如下：

```
CoCreateInstance
OpenProcess
OpenProcessToken
GetExitCodeProcess
CloseHandle
DuplicateTokenEx
CreateProcessWithToken
GetShellWindow
GetWindowThreadProcessId
```

完全的项目代码放在 [github](https://github.com/lindexi/lindexi_gd/tree/37b1367680592d8f80c0a950d96474ac1ec2a806/Workbench/FefaleregairHelhigacemwai) 上，可使用如下命令拉取

```
# 新建一个文件夹，随后使用 cd 命令进入此文件夹，或直接在此文件夹内输入以下命令
git init
git remote add origin https://github.com/lindexi/lindexi_gd.git
git pull origin 37b1367680592d8f80c0a950d96474ac1ec2a806
```

获取代码之后，进入 Workbench/FefaleregairHelhigacemwai 文件夹，即可获取到源代码

---

**参考资料**

- [c# starting process with lowered privileges from UAC admin level process - Stack Overflow](https://stackoverflow.com/q/7870319/6233938)
- [c# - How do you de-elevate privileges for a child process - Stack Overflow](https://stackoverflow.com/questions/1173630/how-do-you-de-elevate-privileges-for-a-child-process)
- [windows - Force a program to run *without* administrator privileges or UAC? - Super User](https://superuser.com/q/171917/940098)
- [High elevation can be bad for your application: How to start a non-elevated process at the end of the installation - CodeProject](https://www.codeproject.com/Articles/18946/High-elevation-can-be-bad-for-your-application-How)
- [How to Enable Drag and Drop for an Elevated MFC Application on Vista/Windows 7 • Helge Klein](https://helgeklein.com/blog/2010/03/how-to-enable-drag-and-drop-for-an-elevated-mfc-application-on-vistawindows-7/)