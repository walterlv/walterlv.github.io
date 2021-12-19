---
title: "WPF 程序如何跨窗口/跨进程设置控件焦点"
publishDate: 2019-09-19 12:24:28 +0800
date: 2019-11-27 08:53:01 +0800
tags: windows wpf dotnet csharp
position: starter
permalink: /posts/move-focus-to-win32-window.html
---

WPF 程序提供了 `Focus` 方法和 `TraversalRequest` 来在 WPF 焦点范围内转移焦点。但如果 WPF 窗口中嵌入了其他框架的 UI（比如另一个子窗口），那么就需要使用其他的方法来设置焦点了。

---

一个粗略的设置方法是，使用 Win32 API：

```csharp
SetFocus(hwnd);
```

传入的是要设置焦点的窗口的句柄。

---

**参考资料**

- [winapi - Win32: C++: How do I re-focus on Parent Window after clicking in a child window? - Stack Overflow](https://stackoverflow.com/a/31570683/6233938)

