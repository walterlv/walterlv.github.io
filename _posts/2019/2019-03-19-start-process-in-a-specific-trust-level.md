---
title: "Windows 下使用 runas 命令以指定的权限启动一个进程（非管理员、管理员）"
date: 2019-03-19 09:37:16 +0800
tags: windows csharp dotnet
position: knowledge
coverImage: /static/posts/2019-03-19-09-21-30.png
permalink: /post/start-process-in-a-specific-trust-level.html
---

在默认情况下，Windows 系统中启动一个进程会继承父进程的令牌。如果父进程是管理员权限，那么子进程就是管理员权限；如果父进程是标准用户权限，那么子进程也是标准用户权限。

我们也知道，可以使用一些方法为自己的应用程序提权。但是有没有方法可以任意指定一个权限然后运行呢？本文将介绍 Windows 下指定权限运行的做法。

---

<div id="toc"></div>

## runas 命令

runas 是 Windows 系统上自带的一个命令，通过此命令可以以指定权限级别间接启动我们的程序，而不止是继承父进程的权限。

打开 cmd 或者 PowerShell，输入 `runas` 命令可以看到其用法。

```powershell
> runas
RUNAS 用法:

RUNAS [ [/noprofile | /profile] [/env] [/savecred | /netonly] ]
        /user:<UserName> program

RUNAS [ [/noprofile | /profile] [/env] [/savecred] ]
        /smartcard [/user:<UserName>] program

RUNAS /trustlevel:<TrustLevel> program

   /noprofile        指定不应该加载用户的配置文件。
                     这会加速应用程序加载，但
                     可能会造成一些应用程序运行不正常。
   /profile          指定应该加载用户的配置文件。
                     这是默认值。
   /env              要使用当前环境，而不是用户的环境。
   /netonly          只在指定的凭据限于远程访问的情况下才使用。
   /savecred         用用户以前保存的凭据。
   /smartcard        如果凭据是智能卡提供的，则使用这个选项。
   /user             <UserName> 应使用 USER@DOMAIN 或 DOMAIN\USER 形式
   /showtrustlevels  显示可以用作 /trustlevel 的参数的
                     信任级别。
   /trustlevel       <Level> 应该是在 /showtrustlevels 中枚举
                     的一个级别。
   program           EXE 的命令行。请参阅下面的例子

示例:
> runas /noprofile /user:mymachine\administrator cmd
> runas /profile /env /user:mydomain\admin "mmc %windir%\system32\dsa.msc"
> runas /env /user:user@domain.microsoft.com "notepad \"my file.txt\""

注意:  只在得到提示时才输入用户的密码。
注意:  /profile 跟 /netonly 不兼容。
注意:  /savecred 跟 /smartcard 不兼容。
```

## 提权运行或者降权运行

为了演示提权或者降权，我们需要有一个能够验证当前是否是管理员权限运行的程序。关于如何在程序中判断当前是否以管理员权限运行，可以阅读我和林德熙的博客：

- [dotnet 判断程序当前使用管理员运行降低权使用普通权限运行 - 林德熙](https://lindexi.gitee.io/post/dotnet-%E5%88%A4%E6%96%AD%E7%A8%8B%E5%BA%8F%E5%BD%93%E5%89%8D%E4%BD%BF%E7%94%A8%E7%AE%A1%E7%90%86%E5%91%98%E8%BF%90%E8%A1%8C%E9%99%8D%E4%BD%8E%E6%9D%83%E4%BD%BF%E7%94%A8%E6%99%AE%E9%80%9A%E6%9D%83%E9%99%90%E8%BF%90%E8%A1%8C.html)
- [在 Windows 系统上降低 UAC 权限运行程序（从管理员权限降权到普通用户权限） - 吕毅](/post/start-process-with-lowered-uac-privileges)

本质上是这段代码：

```csharp
var identity = WindowsIdentity.GetCurrent();
var principal = new WindowsPrincipal(identity);
if (principal.IsInRole(WindowsBuiltInRole.Administrator))
{
    // 检测到当前进程是以管理员权限运行的。
}
```

此代码如果在 .NET Core 中编写，以上代码需要额外安装 Windows 兼容包：[Microsoft.Windows.Compatibility](https://www.nuget.org/packages/Microsoft.Windows.Compatibility)。

## 提权运行或者降权运行

我以标准用户权限和管理员权限分别启动了一个 PowerShell Core，然后准备在这两个窗口里面分别启动我的检测管理员权限的程序。

![在两个 PowerShell 中运行命令](/static/posts/2019-03-19-09-21-30.png)

0x20000 是标准用户权限，现在运行命令：

```powershell
> runas /trustlevel:0x20000 .\Walterlv.Demo.exe
```

![运行结束后，两个进程都是非管理员权限](/static/posts/2019-03-19-09-24-00.png)

运行发现，两个进程现在都是标准用户权限。即使是管理员的 PowerShell 中运行的也都是非管理员权限。

0x40000 是管理员权限，现在运行命令：

```powershell
> runas /trustlevel:0x40000 .\Walterlv.Demo.exe
```

![运行结束后，两个进程都取得不高于当前 PowerShell 的最高权限](/static/posts/2019-03-19-09-26-28.png)

运行发现，非管理员的 PowerShell 启动的是非管理员权限的进程；而管理员的 PowerShell 启动的是管理员权限的进程。

## 使用 C# 代码来降权运行

使用 C# 代码，就是要将下面这一句翻译成 C#。

```powershell
> runas /trustlevel:0x20000 .\Walterlv.Demo.exe
```

所以其实非常简单，就是 `Process.Start` 传入参数即可。

```csharp
Process.Start("runas.exe", $"/trustlevel:0x20000 Walterlv.Demo.exe");
```

关于更多降权运行的方法，可以参考我的另一篇博客：

- [在 Windows 系统上降低 UAC 权限运行程序（从管理员权限降权到普通用户权限） - 吕毅](/post/start-process-with-lowered-uac-privileges)

---

**参考资料**

- [windows - How to run a process as non-admin from an elevated PowerShell console? - Stack Overflow](https://stackoverflow.com/a/29570173/6233938)


