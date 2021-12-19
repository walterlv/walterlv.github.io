---
title: "直击本质：WPF 框架是如何实现模态窗口的"
date: 2019-10-10 18:57:27 +0800
tags: wpf dotnet csharp windows
position: knowledge
permalink: /post/how-does-wpf-implement-modal-dialog.html
---

想知道你在 WPF 编写 `Window.ShowDialog()` 之后，WPF 框架是如何帮你实现模态窗口的吗？

本文就带你来了解这一些。

---

<div id="toc"></div>

## `Window.ShowDialog`

WPF 显示模态窗口的方法就是 `Window.ShowDialog`，因此我们直接进入这个方法查看。由于 .NET Core 版本的 WPF 已经开源，我们会使用 .NET Core 版本的 WPF 源代码。

`Window.ShowDialog` 的源代码可以在这里查看：

- [Window.cs](https://source.dot.net/#PresentationFramework/System/Windows/Window.cs,61d39b218b53dbbe)

这个方法非常长，所以我只把其中与模态窗口最关键的代码和相关注释留下，其他都删除（这当然是不可编译的）：

```csharp
public Nullable<bool> ShowDialog()
{
    // NOTE:
    // _threadWindowHandles is created here.  This reference is nulled out in EnableThreadWindows
    // when it is called with a true parameter.  Please do not null it out anywhere else.
    // EnableThreadWindow(true) is called when dialog is going away.  Once dialog is closed and
    // thread windows have been enabled, then there no need to keep the array list around.
    // Please see BUG 929740 before making any changes to how _threadWindowHandles works.
    _threadWindowHandles = new ArrayList();
    //Get visible and enabled windows in the thread
    // If the callback function returns true for all windows in the thread, the return value is true.
    // If the callback function returns false on any enumerated window, or if there are no windows
    // found in the thread, the return value is false.
    // No need for use to actually check the return value.
    UnsafeNativeMethods.EnumThreadWindows(SafeNativeMethods.GetCurrentThreadId(),
                                            new NativeMethods.EnumThreadWindowsCallback(ThreadWindowsCallback),
                                            NativeMethods.NullHandleRef);
    //disable those windows
    EnableThreadWindows(false);

    try
    {
        _showingAsDialog = true;
        Show();
    }
    catch
    {
        // NOTE:
        // See BUG 929740.
        // _threadWindowHandles is created before calling ShowDialog and is deleted in
        // EnableThreadWindows (when it's called with true).
        //
        // Window dlg = new Window();
        // Button b = new button();
        // b.OnClick += new ClickHandler(OnClick);
        // dlg.ShowDialog();
        //
        //
        // void OnClick(...)
        // {
        //      dlg.Close();
        //      throw new Exception();
        // }
        //
        //
        // If above code is written, then we get inside this exception handler only after the dialog
        // is closed.  In that case all the windows that we disabled before showing the dialog have already
        // been enabled and _threadWindowHandles set to null in EnableThreadWindows.  Thus, we don't
        // need to do it again.
        //
        // In any other exception cases, we get in this handler before Dialog is closed and thus we do
        // need to enable all the disable windows.
        if (_threadWindowHandles != null)
        {
            // Some exception case. Re-enable the windows that were disabled
            EnableThreadWindows(true);
        }
    }
}
```

觉得代码还是太长？不要紧，我再简化一下：

1. `EnumThreadWindows` 获取当前线程的所有窗口
2. 把当前线程中的所有窗口都禁用掉（用的是 Win32 API 的禁用哦，这不会导致窗口内控件的样式变为禁用状态）
3. 将窗口显示出来（如果出现异常，则还原之前禁用的窗口）

可以注意到禁用掉的窗口是“当前线程”的哦。

## `ShowHelper`

接下来的重点方法是 `Window.ShowDialog` 中的那句 `Show()`。在 `Show()` 之前设置了 `_showingAsDialog` 为 `true`，于是这里会调用 `ShowHelper` 方法并传入 `true`。

下面的代码也是精简后的 `ShowHelper` 方法：

```csharp
private object ShowHelper(object booleanBox)
{
    try
    {
        // tell users we're going modal
        ComponentDispatcher.PushModal();

        _dispatcherFrame = new DispatcherFrame();
        Dispatcher.PushFrame(_dispatcherFrame);
    }
    finally
    {
        // tell users we're going non-modal
        ComponentDispatcher.PopModal();
    }
}
```

可以看到，重点是 `PushModal`、`PopModal` 以及 `PushFrame`。

`PushFrame` 的效果就是让调用 `ShowDialog` 的代码看起来就像阻塞了一样（实际上就是阻塞了，只不过开了新的消息循环看起来 UI 不卡）。

关于 `PushFrame` 为什么能够“阻塞”你的代码的同时还能继续响应 UI 操作的原理，可以阅读：

- [深入了解 WPF Dispatcher 的工作原理（PushFrame 部分） - walterlv](/post/dotnet/2017/09/26/dispatcher-push-frame.html)

那么 `ComponentDispatcher.PushModal` 和 `ComponentDispatcher.PopModal` 呢？可以在这里（[ComponentDispatcherThread.cs](https://source.dot.net/#WindowsBase/System/Windows/Interop/ComponentDispatcherThread.cs,60a128f40eff98b3)）看它的代码，实际上是为了模态计数以及引发事件的，对模态的效果没有本质上的影响。

