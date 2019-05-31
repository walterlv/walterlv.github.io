---
title: "如何为 Win32 的打开和保存对话框编写文件过滤器（Filter）"
date: 2019-05-31 20:36:02 +0800
categories: windows dotnet csharp wpf uwp
position: starter
---

在使用 Win32 / WPF / Windows Forms 的打开或保存文件对话框的时候，多数情况下我们都会考虑编写文件过滤器。UWP 中有 `FileTypeFilter` 集合可以添加不同的文件种类，但 Win32 中却是一个按一定规则组合而成的字符串。

因为其包含一定的格式，所以可能写错。本文介绍如何编写 Filter。

---

<div id="toc"></div>

## 编写 Filter

Filter 使用竖线分隔不同种类的过滤器，比如 `图片|*.png;*.jpg|文本|*.txt|walterlv 的自定义格式|*.lvyi`。

```csharp
var dialog = new OpenFileDialog();
dialog.Filter = "图片|*.png;*.jpg|文本|*.txt|walterlv 的自定义格式|*.lvyi";
dialog.ShowDialog(this);
```

![过滤器的显示效果](/static/posts/2019-05-31-20-31-40.png)

有时我们会看到一些程序的过滤器里面显示了过滤器本身，而不止是名称，实际上是因为名称中包含了过滤器：

```
图片 (png, jpg)|*.png;*.jpg|文本 (txt)|*.txt|walterlv 的自定义格式 (lvyi)|*.lvyi
```

![名称中包含过滤器](/static/posts/2019-05-31-20-34-49.png)

你不可以在过滤器中省略名称或者过滤器任何一个部分，否则会抛出异常。

## 附：如何显示对话框

对于 .NET Core 版本的 WPF 或者 Windows Forms 程序来说，需要安装 Windows 兼容 NuGet 包：

- [Microsoft.Windows.Compatibility](https://www.nuget.org/packages/Microsoft.Windows.Compatibility)

安装后可以使用 Windows Forms 版本的 `OpenFileDialog` 或者 WPF 版本的 `Microsoft.Win32.OpenFileDialog`。

---

**参考资料**

- [FileDialog.Filter Property (Microsoft.Win32) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/microsoft.win32.filedialog.filter)
