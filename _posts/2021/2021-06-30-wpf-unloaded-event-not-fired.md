---
title: "WPF 窗口和控件的 Unloaded 事件什么情况下不会触发"
date: 2021-06-30 16:11:02 +0800
tags: wpf
position: problem
---

WPF 中如果监听窗口或者控件的的 `Unloaded` 事件，那么这个事件会触发吗？答案是不确定的。

---

<div id="toc"></div>

## 示例代码

```xml
<Window x:Class="Walterlv.TempDemo.Wpf.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        Unloaded="Window_Unloaded" Closed="Window_Closed">
    <Grid Unloaded="Grid_Unloaded">
    </Grid>
</Window>
```

```csharp
private void Window_Unloaded(object sender, RoutedEventArgs e)
{
    // 断点 1
}

private void Grid_Unloaded(object sender, RoutedEventArgs e)
{
    // 断点 2
}

private void Window_Closed(object sender, EventArgs e)
{
    // 断点 3
}
```

你觉得以上事件中，断点都会进入吗？

## 不确定的答案

在微软的[官方文档](https://docs.microsoft.com/en-us/dotnet/api/system.windows.frameworkelement.unloaded)中说：

> Note that the Unloaded event is not raised after an application begins shutting down. Application shutdown occurs when the condition defined by the ShutdownMode property occurs. If you place cleanup code within a handler for the Unloaded event, such as for a Window or a UserControl, it may not be called as expected.

如果应用程序正在关闭，那么 `Unloaded` 时间将不会触发。WPF 通过设置在 `Application` 上的 `ShutdownMode` 来决定是否在关闭窗口后关闭应用程序。因此，如果你试图通过在 `Unloaded` 事件中执行清理操作，那么可能不会如预期般完成。

因此，一般情况下，`Unloaded` 事件是会触发的，但满足如下任一情况时，此事件将不不会触发：

1. `Application.ShutdownMode="OnLastWindowClose"` 且最后一个窗口关闭时；
2. `Application.ShutdownMode="OnMainWindowClose"` 且主窗口关闭时。

## 顺序

当触发 `Unloaded` 事件时，以上事件的触发顺序为：

- 断点 3
- 断点 1
- 断点 2

---

**参考资料**

- [Unloaded event not called on Window when app closed · Issue #1442 · dotnet/wpf](https://github.com/dotnet/wpf/issues/1442)
- [FrameworkElement.Unloaded Event (System.Windows) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/system.windows.frameworkelement.unloaded)
