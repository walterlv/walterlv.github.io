---
title: "WPF 应用的默认字体是什么，如何修改默认字体（FontFamily）"
publishDate: 2019-11-24 17:30:54 +0800
date: 2019-11-27 07:01:59 +0800
categories: wpf dotnet windows
position: knowledge
published: false
---

如果不是在开发 WPF 程序的时候遇到了字体相关的问题，估计你是不会阅读到这篇博客的。是的，WPF 界面上文字的默认字体会随着你的系统语言的不同而不同。

本文将带你了解 WPF 应用的默认字体是什么，以及如何修改它。

---

<div id="toc"></div>

## 默认字体

### Windows 操作系统

Windows 操作系统的默认字体是 Segoe UI（发音为 see go 这两个单词），默认的字体大小为 9 点。

![Segoe UI](/static/posts/2019-11-18-21-29-13.png)

其他语言的默认字体分别是：

| 语言                              | 字体               |
| --------------------------------- | ------------------ |
| 日语（Japanese）                  | Meiryo             |
| 韩语（Korean）                    | Malgun Gothic      |
| 繁体中文（Chinese (Traditional)） | Microsoft JhengHei |
| 简体中文（Chinese (Simplified)）  | Microsoft YaHei    |
| 希伯来语（Hebrew）                | Gisha              |
| 泰语（Thai）                      | Leelawadee         |

关于 Windows 操作系统默认字体的更多内容可以阅读我的另一篇博客：

- [Windows 系统的默认字体是什么？ - walterlv](/post/windows-default-font-family)

Windows 操作系统在启动应用程序的时候，会根据当前系统用户的地区决定默认字体应该采用哪一个。

### WPF

WPF 又是如何决定应用启动时候应该采用的默认字体的呢？

```csharp
/// <summary>
///     Maps to SPI_NONCLIENTMETRICS
/// </summary>
public static FontFamily MessageFontFamily
{
    get
    {
        if (_messageFontFamily == null)
        {
            _messageFontFamily = new FontFamily(SystemParameters.NonClientMetrics.lfMessageFont.lfFaceName);
        }

        return _messageFontFamily;
    }
}
```

---

**参考资料**

- [Setting the correct default font in .NET Windows Forms apps - BenHollis.net](https://benhollis.net/blog/2007/04/11/setting-the-correct-default-font-in-net-windows-forms-apps/)
- [Fonts - Win32 apps - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/uxguide/vis-fonts)
- [UX checklist for desktop applications - Win32 apps - Microsoft Docs](https://docs.microsoft.com/en-us/windows/win32/uxguide/top-violations)
- [.net - What is the default font family of a WPF application? - Stack Overflow](https://stackoverflow.com/q/4141877/6233938)
- [c# - Is there a way of setting culture for a whole application? All current threads and new threads? - Stack Overflow](https://stackoverflow.com/q/468791/6233938)
