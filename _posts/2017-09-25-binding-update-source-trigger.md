---
layout: post
title: "WPF/UWP 绑定中的 UpdateSourceTrigger"
date: 2017-09-25 01:20:35 +0800
categories: uwp
keywords: uwp wpf binding UpdateSourceTrigger TextBox Text
description: 为 `TextBox` 的 `Text` 属性制定了双向绑定，然而运行却发现绑定源的对应属性却不及时变化。阅读本文将了解其原因和解决办法。
---

在开发 [markdown-mail](https://github.com/walterlv/markdown-mail) 时遇到了一些诡异的情况。代码是这么写的：

```xml
<TextBox Text="{Binding Text, Mode=TwoWay}"/>
```

然而在 `TextChanged` 事件之后延时执行了一些操作时，从 `ViewModel` 里拿到的值却始终是旧的。

阅读本文将了解其原因和解决办法。

---

无论是 WPF 还是 UWP，`Binding` 中都有 `UpdateSourceTrigger` 属性。

在 WPF 中，其可取的值为：

```csharp
public enum UpdateSourceTrigger
{
    Default,
    PropertyChanged,
    LostFocus,
    Explicit
}
```

在 UWP 中，其可取的值为：

```csharp
public enum UpdateSourceTrigger
{
    Default,
    PropertyChanged,
    Explicit
}
```

这些值代表的含义是：

- `Default`
  - 默认值，多数情况下与 `PropertyChanged` 一样，然而**对 `TextBox.Text` 属性来说，却是 LostFocus（WPF）或 Explicit（UWP）**。
- `Explicit`
  - 必须在显式地调用 BindingExpression.UpdateSource 的情况下才会更新源值。
- `LostFocus`（WPF 专属，不过 UWP 的预览版里也有）
  - 目标控件失去焦点的时候更新源值。
- `PropertyChanged`
  - 绑定的目标值改变的时候就会更新源值，至于检测方法，则完全由 WPF/UWP 的绑定系统完成

于是，为了解决一开始的问题，我们需要在 TextBox 的 Text 属性的双向绑定里重新设置新的 `UpdateSourceTrigger` 的值。

```xml
<TextBox Text="{Binding Text, Mode=TwoWay, UpdateSourceTrigger=PropertyChanged}"/>
```

没错，就是加这半句就好了。

#### 参考资料
- [How to: Control When the TextBox Text Updates the Source - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/wpf/data/how-to-control-when-the-textbox-text-updates-the-source)
- [c# - WPF two-way binding not working - Stack Overflow](https://stackoverflow.com/questions/22253211/wpf-two-way-binding-not-working)
- [The UpdateSourceTrigger property - The complete WPF tutorial](http://www.wpf-tutorial.com/data-binding/the-update-source-trigger-property/)
- [UpdateSourceTrigger Enum (Windows.UI.Xaml.Data) - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/uwp/api/windows.ui.xaml.data.updatesourcetrigger)
- [UpdateSourceTrigger Enum (System.Windows.Data) - Microsoft Docs](https://docs.microsoft.com/zh-cn/dotnet/api/system.windows.data.updatesourcetrigger?view=netframework-4.7)
- [TextBox.Text Property (System.Windows.Controls) - Microsoft Docs](https://docs.microsoft.com/zh-cn/dotnet/api/system.windows.controls.textbox.text?view=netframework-4.7#System_Windows_Controls_TextBox_Text)
