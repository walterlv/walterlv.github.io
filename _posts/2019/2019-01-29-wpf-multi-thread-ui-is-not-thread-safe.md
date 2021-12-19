---
title: "WPF 支持的多线程 UI 并不是线程安全的"
date: 2019-01-29 12:02:50 +0800
tags: wpf dotnet
position: problem
version:
  current: 中文
versions:
  - 中文: #
  - English: /post/wpf-multi-thread-ui-is-not-thread-safe-en.html
coverImage: /static/posts/2019-01-29-11-04-38.png
---

WPF 支持创建多个 UI 线程，跨窗口的或者窗口内的都是可以的；但是这个过程并不是线程安全的。

你有极低的概率会遇到 WPF 多线程 UI 的线程安全问题，说直接点就是崩溃。本文将讲述其线程安全问题。

---

<div id="toc"></div>

## 简述这个线程安全问题

必要条件：

1. 创建多个 WPF UI 线程
    - 其实两个就够了，一个我们平时写的 App 类所在的主 UI 线程；一个后台 UI 线程，例如用来显示启动闪屏的 UI 线程
    - 两个线程的话你需要大量重复试验才能复现；而创建更多线程可以大大提高单次复现概率
2. 这些 UI 线程都显示 WPF 窗口
3. 无论是 .NET Framework 4.7.2 版本的 WPF，还是 .NET Core 3 版本的 WPF 都会出现此问题

现象：

- 抛出异常，程序崩溃

比如下面是其中一种异常：

```
Exception thrown: 'System.NullReferenceException' in WindowsBase.dll
Object reference not set to an instance of an object.

System.NullReferenceException: Object reference not set to an instance of an object.
   at System.IO.Packaging.PackagePart.CleanUpRequestedStreamsList()
   at System.IO.Packaging.PackagePart.GetStream(FileMode mode, FileAccess access)
   at System.Windows.Application.LoadComponent(Object component, Uri resourceLocator)
   at Walterlv.Bugs.MultiThreadedUI.SplashWindow.InitializeComponent() in C:\Users\lvyi\Desktop\Walterlv.Bugs.MultiThreadedUI\Walterlv.Bugs.MultiThreadedUI\SplashWindow.xaml:line 1
   at Walterlv.Bugs.MultiThreadedUI.SplashWindow..ctor() in C:\Users\lvyi\Desktop\Walterlv.Bugs.MultiThreadedUI\Walterlv.Bugs.MultiThreadedUI\SplashWindow.xaml.cs:line 24
   at Walterlv.Bugs.MultiThreadedUI.Program.<>c__DisplayClass1_0.<RunSplashWindow>b__0() in C:\Users\lvyi\Desktop\Walterlv.Bugs.MultiThreadedUI\Walterlv.Bugs.MultiThreadedUI\Program.cs:line 33
```

下图是 .NET Core 3 版本的 WPF 中在 Visual Studio 2019 抓到的异常：

![异常](/static/posts/2019-01-29-11-04-38.png)

## 复现步骤

1. 创建一个新的 WPF 项目（无论是 .NET Framework 4.7.2 还是 .NET Core 3）
2. 保持自动生成的 `App` 和 `MainWindow` 不变，我们额外创建一个窗口 `SplashWindow`。
3. 创建一个新的包含 Main 函数的 `Program` 类，并在项目属性中设置 `Program` 为启动对象（替代 `App`）。

![项目结构](/static/posts/2019-01-29-11-06-01.png)

其他文件全部保持 Visual Studio 生成的默认代码不变，而 Program.cs 的代码如下：

```csharp
using System;
using System.Threading;
using System.Windows.Threading;

namespace Walterlv.Bugs.MultiThreadedUI
{
    public class Program
    {
        [STAThread]
        private static void Main(string[] args)
        {
            for (var i = 0; i < 50; i++)
            {
                RunSplashWindow(i);
            }

            var app = new App();
            app.InitializeComponent();
            app.Run();
        }

        private static void RunSplashWindow(int index)
        {
            var thread = new Thread(() =>
            {
                var window = new SplashWindow
                {
                    Title = $"SplashWindow {index.ToString().PadLeft(2, ' ')}",
                };
                window.Show();
                Dispatcher.Run();
            })
            {
                IsBackground = true,
            };
            thread.SetApartmentState(ApartmentState.STA);
            thread.Start();
        }
    }
}
```

说明：即便在 `new SplashWindow` 代码之前调用以下方法修改 `SynchronizationContext` 也依然会发生异常。

```csharp
SynchronizationContext.SetSynchronizationContext(
    new DispatcherSynchronizationContext(
        Dispatcher.CurrentDispatcher));
```

