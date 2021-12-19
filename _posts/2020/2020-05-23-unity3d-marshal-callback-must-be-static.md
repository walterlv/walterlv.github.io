---
title: "Unity3D (Mono/IL2CPP) 中 P/Invoke 平台调用代码应该如何传委托"
publishDate: 2020-05-23 11:56:33 +0800
date: 2020-05-24 10:21:31 +0800
tags: unity csharp
position: problem
permalink: /post/unity3d-marshal-callback-must-be-static.html
---

`IL2CPP does not support marshaling delegates that point to instance methods to native code.` 你可能平时在 .NET Core / Framework 的代码中写得很正常的托管代码的委托调用，在 Unity3D 中变得不可行。

本文举个例子，并且将其改正。

---

<div id="toc"></div>

## 举例：查找所有可见窗口

本文的例子会使用到 NuGet 包 [`Lsj.Util.Win32`](https://www.nuget.org/packages/Lsj.Util.Win32/)，这是个非常棒的 Win32 调用的 API 包装，可以免去大量自己可能写不对的 `[DllImport]`。

引入命名空间：

```csharp
using Lsj.Util.Win32;
using Lsj.Util.Win32.BaseTypes;
```

然后查找所有的可见窗口。

```csharp
public static IReadOnlyList<HWND> FindVisibleWindows()
{
    var found = new List<HWND>();
    User32.EnumWindows(OnWindowEnum, IntPtr.Zero);
    return found;

    BOOL OnWindowEnum(HWND hWnd, LPARAM lparam)
    {
        if (User32.GetParent(hWnd) == IntPtr.Zero && User32.IsWindowVisible(hWnd))
        {
            found.Add(HWND);
        }
        return true;
    }
}
```

## Mono / IL2CPP

Unity 编译的时候可以选择脚本后端是 Mono 还是 IL2CPP。不幸的是，没有 .NET Core 或者未来的 .NET 5/6，因此很多 .NET Core 的特性不能用。

关于脚本后端的选择，可以参见我的另一篇博客：

- [Unity3D 入门：为 Unity 的 C# 项目添加 dll 引用或安装 NuGet 包 - walterlv](https://blog.walterlv.com/post/unity-starter-reference-dlls-and-add-nuget-package-for-unity-csharp-projects.html)

在编译时不会有什么问题，但是在运行时会发生异常（如果你去捕捉，或者用 VS 调试就可以看到）：

```csharp
NotSupportedException:
        IL2CPP does not support marshaling delegates that point to instance methods to native code.
        The method we're attempting to marshal is: Win32WindowExtensions+<>c__DisplayClass0_0::<FindVisibleWindows>g__OnWindowEnum|0
    at Lsj.Util.Win32.User32.EnumWindows (Lsj.Util.Win32.User32+WNDENUMPROC lpEnumFunc, Lsj.Util.Win32.BaseTypes.LPARAM lParam)
    at Win32WindowExtensions.FindVisibleWindows ()
```

> “IL2CPP 不支持封送实例方法到本机代码”。

## 修正代码

Mono/IL2CPP 要求封送到本机的代码必须是静态方法，且必须标 `MonoPInvokeCallback` 特性。

因此，我们不得不把上面的代码改成这样：

```csharp
using System;
using System.Collections.Generic;
using System.Text;
using AOT;
using Lsj.Util.Win32;
using Lsj.Util.Win32.BaseTypes;

public class WindowsEnumerator
{
    private static List<HWND> _currentList;

    public IReadOnlyList<HWND> FindVisibleWindows()
    {
        _currentList = new List<HWND>();
        User32.EnumWindows(OnWindowEnum, IntPtr.Zero);
        return _currentList;
    }

    [MonoPInvokeCallback(typeof(User32.WNDENUMPROC))]
    static BOOL OnWindowEnum(HWND hWnd, LPARAM lparam)
    {
        if (User32.GetParent(hWnd) == IntPtr.Zero && User32.IsWindowVisible(hWnd))
        {
            _currentList?.Add(HWND);
        }
        return true;
    }
}
```

当然上述代码不是线程安全的。所以如果你希望在多线程环境下使用，请自行修改为线程安全的版本。

---

**参考资料**

- [MonoPInvokeCallbackAttribute Class (ObjCRuntime) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/objcruntime.monopinvokecallbackattribute)

