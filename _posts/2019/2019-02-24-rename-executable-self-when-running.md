---
title: "Windows 上的应用程序在运行期间可以给自己改名（可以做 OTA 自我更新）"
publishDate: 2019-02-24 20:15:05 +0800
date: 2019-03-10 21:30:52 +0800
tags: windows dotnet csharp
position: knowledge
coverImage: /static/posts/2019-02-24-17-26-25.png
---

程序如何自己更新自己呢？你可能会想到启动一个新的程序或者脚本来更新自己。然而 Windows 操作系统允许一个应用程序在运行期间修改自己的名称甚至移动自己到另一个文件夹中。利用这一点，我们可以很简单直接地做程序的 OTA 自动更新。

本文将介绍示例程序运行期间改名并解释其原理。

---

<div id="toc"></div>

## 在程序运行期间手工改名

我们写一个简单的程序。

![简单的程序](/static/posts/2019-02-24-17-26-25.png)

将它运行起来，然后删除。我们会发现无法删除它。

![无法删除程序](/static/posts/2019-02-24-17-27-12.png)

但是，我们却可以很轻松地在资源管理器中对它进行改名，甚至将它从一个文件夹中移动到另一个文件夹中。

![已经成功改名](/static/posts/2019-02-24-17-28-14.png)

值得注意的是，你不能跨驱动器移动此文件。

## 不止是 exe 文件，dll 文件也是可以改名的

实际上，不止是 exe 文件，在 exe 程序运行期间，即使用到了某些 dll 文件，这些 dll 文件也是可以改名的。

当然，一个 exe 的运行不一定在启动期间就加载好了所有的 dll，所以如果你在 exe 启动之后，某个 dll 加载之前改了那个 dll 的名称，那么会出现找不到 dll 的情况，可能导致程序崩溃。

## 为什么 Windows 上的可执行程序可以在运行期间改名？

Windows 的文件系统由两个主要的表示结构：一个是目录信息，它保存有关文件的元数据（如文件名、大小、属性和时间戳）；第二个是文件的数据链。

当运行程序加载一个程序集的时候，会为此程序集创建一个内存映射文件。为了优化性能，往往只有实际用到的部分才会被加入到内存映射文件中；当需要用到程序集文件中的某块数据时，Windows 操作系统就会将需要的部分加载到内存中。但是，内存映射文件只会锁定文件的数据部分，以保证文件文件的数据不会被其他的进程修改。

这里就是关键，内存映射文件只会锁定文件的数据部分，而不会锁住文件元数据信息。这意味着你可以随意修改这些元数据信息而不会影响程序的正常运行。这就包括你可以修改文件名，或者把程序从一个文件夹下移动到另一个文件夹去。

但是跨驱动器移动文件，就意味着需要在原来的驱动器下删除文件，而这个操作会影响到文件的数据部分，所以此操作不被允许。

## 编写一个程序在运行期间自动改名

一般来说，需要 OTA 更新的程序是客户端程序，所以实际上真正需要此代码的是客户端应用。以下代码中我使用 .NET Core 3.0 来编写一个给自己改名的 WPF 程序。

```csharp
using System.Diagnostics;
using System.IO;
using System.Windows;

namespace Walterlv.Windows.Updater
{
    public partial class App : Application
    {
        protected override void OnStartup(StartupEventArgs e)
        {
            base.OnStartup(e);
            var fileName = Process.GetCurrentProcess().MainModule.FileName;
            var newFileName = Path.Combine(Path.GetDirectoryName(fileName), "OldUpdater.exe");
            File.Move(fileName, newFileName);
            // 省略的代码：将新下载下载的程序改名成 fileName。
        }
    }
}
```

于是，程序自己在运行后会改名。

![程序已经自己改名](/static/posts/2019-02-24-18-53-01.png)

顺便的，以上代码仅适用于 .NET Framework 的桌面应用程序或者 .NET Core 3.0 的桌面应用程序。如果是 .NET Core 2.x，那么以上代码在获取到进程名称的时候可能是 dotnet.exe（已发布的 .NET Core 程序除外）。

---

**参考资料**

- [c# - Why does rename a loaded .net assembly work? - Stack Overflow](https://stackoverflow.com/a/14775626/6233938)
- [windows 7 - Why can I rename a running executable, but not delete it? - Super User](https://superuser.com/questions/488127/why-can-i-rename-a-running-executable-but-not-delete-it)
- [deployment - How can we overwrite EXE files while users are running them? - Stack Overflow](https://stackoverflow.com/questions/3365347/how-can-we-overwrite-exe-files-while-users-are-running-them)

