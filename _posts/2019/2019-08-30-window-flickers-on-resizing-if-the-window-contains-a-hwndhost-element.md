---
title: "解决 WPF 嵌套的子窗口在改变窗口大小的时候闪烁的问题"
publishDate: 2019-08-30 14:26:00 +0800
date: 2019-10-22 14:14:08 +0800
tags: wpf windows dotnet csharp
position: problem
---

因为 Win32 的窗口句柄是可以跨进程传递的，所以可以用来实现跨进程 UI。不过，本文不会谈论跨进程 UI 的具体实现，只会提及其实现中的一个重要缓解，使用子窗口的方式。

你有可能在使用子窗口之后，发现拖拽改变窗口大小的时候，子窗口中的内容不断闪烁。如果你也遇到了这样的问题，那么正好可以阅读本文来解决。

---

<div id="toc"></div>

## 问题

你可以看一下下面的这张动图，感受一下窗口的闪烁：

![窗口闪烁](/static/posts/2019-08-01-window-flicker.gif)

实际上在拖动窗口的时候，是一直都在闪的，只是每次闪烁都非常快，截取 gif 的时候截不到。

如果你希望实际跑一跑项目看看，可以使用下面的代码：

- [walterlv.demo/Walterlv.Demo.HwndWrapping/Walterlv.Demo.HwndWrapping at a88f81477756af2913349970ba2f0bbab01aaf88 · walterlv/walterlv.demo](https://github.com/walterlv/walterlv.demo/tree/a88f81477756af2913349970ba2f0bbab01aaf88/Walterlv.Demo.HwndWrapping/Walterlv.Demo.HwndWrapping)

我特地提取了一个提交下的代码，如果你要尝试，不能使用 `master` 分支，因为 `master` 分支修复了闪烁的问题。

后来使用 `CreateWindowEx` 创建了一个纯 Win32 窗口，这种闪烁现象更容易被截图：

![Win32 窗口闪烁](/static/posts/2019-08-02-08-16-22.png)

![Win32 窗口闪烁 - 动图](/static/posts/2019-08-02-window-flicker.gif)

## 解决

```diff
    public class HwndWrapper : HwndHost
    {
        protected override HandleRef BuildWindowCore(HandleRef hwndParent)
        {
            const int WS_CHILD = 0x40000000;
++          const int WS_CLIPCHILDREN = 0x02000000;
            var owner = ((HwndSource)PresentationSource.FromVisual(this)).Handle;

            var parameters = new HwndSourceParameters("demo")
            {
                ParentWindow = owner,
--              WindowStyle = (int)(WS_CHILD),
++              WindowStyle = (int)(WS_CHILD | WS_CLIPCHILDREN),
            };
            var source = new HwndSource(parameters);
            source.RootVisual = new ChildPage();
            return new HandleRef(this, source.Handle);
        }

        protected override void DestroyWindowCore(HandleRef hwnd)
        {
        }
    }
```

## 原因

正在探索……

---

**参考资料**

- [wpf - Custom dwm drawn window frame flickers on resizing if the window contains a HwndHost element - Stack Overflow](https://stackoverflow.com/q/6500336/6233938)
- [WPF多进程UI探索（Like Chrome） - 简书](https://www.jianshu.com/p/f2c6a2d9bbb2)
- [关于WS_CLIPCHILDREN和WS_CLIPSIBLINGS的理解（个人认为还是相当全面的） - helloj2ee - 博客园](https://www.cnblogs.com/helloj2ee/archive/2009/05/29/1491822.html)
