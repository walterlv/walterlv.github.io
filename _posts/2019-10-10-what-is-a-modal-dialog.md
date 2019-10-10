---
title: "什么是模态窗口？本文带你了解模态窗口的本质"
date: 2019-10-10 19:28:26 +0800
categories: windows dotnet csharp wpf
position: knowledge
---

做 Windows 桌面应用开发的小伙伴们对“模态窗口”（Modal Dialog）一定不陌生。如果你希望在模态窗口之上做更多的事情，或者自己实现一套模态窗口类似的机制，那么你可能需要了解模态窗口的本质。

本文不会太深，只是从模态窗口一词出发，抵达大家都熟知的一些知识为止。

---

<div id="toc"></div>

## 开发中的模态窗口

在各种系统、语言和框架中，只要有用户可以看见的界面，都存在模态窗口的概念。从交互层面来说，它的形式是在保留主界面作为环境来显示的情况下，打开一个新的界面，用户只能在新的界面上操作，完成或取消后才能返回主界面。从作用上来说，通常是要求用户必须提供某些信息后才能继续操作，或者单纯只是为了广告。

## 模态窗口的三个特点

如果你希望自己搞一套模态窗口出来，那么只需要满足这三点即可。你可以随便加戏但那都无关紧要。

1. 保留主界面显示的同时，禁用主界面的用户交互；
2. 显示子界面，主界面在子界面操作完成后返回；
3. 当用户试图跳过子界面的交互的时候进行强提醒。

拿 Windows 系统中的模态对话框为例子，大概就像下面这两张图片这样：

有一个小的子界面盖住了主界面，要求用户必须进行选择。Windows 系统设置因为让背景变暗了，所以用户肯定会看得到需要进行的交互；而任务管理器没有让主界面变暗，所以用户在操作子界面的时候，模态窗口的边框和标题栏闪烁以提醒用户注意。

![Windows 系统设置](/static/posts/2019-10-08-09-01-47.png)

![任务管理器](/static/posts/2019-10-08-modal-dialog-twinkle.gif)

## 实现模态窗口

对于 Windows 操作系统来说，模态窗口并不是一个单一的概念，你并不能仅通过一个 API 调用就完成显示模态窗口，你需要在不同的时机调用不同的 API 来完成一个模态窗口。如果要完整实现一个自己的模态窗口，则需要编写实现以上三个特点的代码。

当然，你可能会发现实际上你显示一个模态窗口仅仅一句话调用就够了，那是因为你所用的应用程序框架帮你完成了模态窗口的一系列机制。

关于 WPF 框架是如何实现模态窗口的，可以阅读：[直击本质：WPF 框架是如何实现模态窗口的](/post/how-does-wpf-implement-modal-dialog.html)

关于如何自己实现一个跨越线程/进程边界的模态窗口，可以阅读：[实现 Windows 系统上跨进程/跨线程的模态窗口](/post/implement-own-modal-dialogs-across-processes-or-threads.html)

如果你希望定制以上第三个特点中强提醒的动画效果，可以阅读：[WPF window 子窗口反馈效果（抖动/阴影渐变) - 唐宋元明清2188 - 博客园](https://www.cnblogs.com/kybs0/p/7357759.html)。

## API 调用

为了在 Windows 上实现模态窗口，需要一些 Win32 API 调用（当然，框架够用的话直接用框架就好）。

### 禁用主窗口

我们需要使用到 `BOOL EnableWindow(HWND hWnd, BOOL bEnable);` 来启用与禁用某个窗口。

```csharp
EnableWindow(hWnd, false);
try
{
    // 模态显示一个窗口。
}
finally
{
    EnableWindow(hWnd, true);
}
```

```csharp
[DllImport("user32")]
private static extern bool EnableWindow(IntPtr hwnd, bool bEnable);
```

### 阻塞代码等待操作完成

因为 `async`/`await` 的出现，阻塞其实可以使用 `await` 来实现。虽然这不是真正的阻塞，但可以真实反应出“异步”这个过程，也就是虽然这里在等待，但实际上依然能够继续在同一个线程响应用户的操作。

UWP 中的新 API 当然已经都是使用 `async`/`await` 来实现模态等待了，不过 WPF/Windows Forms 比较早，只能使用 Dispatcher 线程模型来实现模态等待。

于是我们可以考虑直接使用现成的 Dispatcher 线程模型来完成等待，方法是调用下面两个当中的任何一个：

- `Window.ShowDialog` 也就是直接使用窗口原生的模态
- `Dispatcher.PushFrame` 新开一个消息循环以阻塞当前代码的同时继续响应 UI 交互

上面 `Window.ShowDialog` 的本质也是在调用 `Dispatcher.PushFrame`，详见：

- [直击本质：WPF 框架是如何实现模态窗口的](/post/how-does-wpf-implement-modal-dialog.html)

关于 `PushFrame` 新开消息循环阻塞的原理可以参考：

- [深入了解 WPF Dispatcher 的工作原理（PushFrame 部分） - walterlv](https://blog.walterlv.com/post/dotnet/2017/09/26/dispatcher-push-frame.html)

当然，还有其他可以新开消息循环的方法。

### 进行 UI 强提醒

由于我们一开始禁用了主窗口，所以如果用户试图操作主窗口是不会有效果的。然而如果用户不知道当前显示了一个模态窗口需要操作，那么给出提醒也是必要的。

简单的在 UI 上的提醒是最简单的了，比如：

- 将主界面变暗（UWP 应用，Web 应用喜欢这么做）
- 将主界面变模糊（iOS 应用喜欢这么做）
- 在模态窗口上增加一个很厚重的阴影（Android 应用喜欢这么做）

然而 Windows 和 Mac OS 这些古老的系统由于兼容性负担不能随便那么改，于是需要有其他的提醒方式。

Windows 采用的方式是让标题栏闪烁，让阴影闪烁。

而这些特效的处理，来自于子窗口需要处理一些特定的消息 `WM_SETCURSOR`。

详见：[WPF window 子窗口反馈效果（抖动/阴影渐变) - 唐宋元明清2188 - 博客园](https://www.cnblogs.com/kybs0/p/7357759.html)

通常你不需要手工处理这些消息，但是如果你完全定制了窗口样式，则可能需要自行做一个这样的模态窗口提醒效果。
