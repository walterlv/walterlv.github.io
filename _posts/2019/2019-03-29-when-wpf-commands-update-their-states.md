---
title: "WPF 的命令的自动刷新时机——当你 CanExecute 会返回 true 但命令依旧不可用时可能是这些原因"
publishDate: 2019-03-29 08:41:28 +0800
date: 2019-03-29 16:43:27 +0800
tags: wpf dotnet csharp
position: problem
version:
  current: 中文
versions:
  - 中文: #
  - English: /post/when-wpf-commands-update-their-states-en.html
permalink: /post/when-wpf-commands-update-their-states.html
---

在 WPF 中，你可以使用 `Command="{Binding WalterlvCommand}"` 的方式来让 XAML 中的一个按钮或其他控件绑定一个命令。这样，按钮的可用性会自动根据 `WalterlvCommand` 当前 `CanExecute` 的状态来改变。这本是一个非常智能的特性，直到你可能发现你按钮的可用性状态不正确……

本文介绍默认情况下，WPF 在 UI 上的这些命令会在什么时机进行刷新；以及没有及时刷新时，可以如何强制让这些命令的可用性状态进行刷新。了解了这些，你可能能够解决你在 WPF 程序中命令绑定的一些坑。

---

This post is written in **multiple languages**. Please select yours:

{% include post-version-selector.html %}

<div id="toc"></div>

## 一个最简单的例子

```xml
<Button x:Name="TestCommand" Command="{Binding WalterlvCommand}" />
```

```csharp
public class Walterlv
{
    // 省略了此命令的初始化。
    public WalterlvCommand WalterlvCommand { get; }
}

public class WalterlvCommand : ICommand
{
    public bool SomeFlag { get; set; }

    bool ICommand.CanExecute(object parameter)
    {
        // 判断命令的可用性。
        return SomeFlag;
    }

    void ICommand.Execute(object parameter)
    {
        // 省略了执行命令的代码。
    }
}
```

假如 `SomeFlag` 一开始是 `false`，5 秒种后变为 `true`，那么你会注意到这时的按钮状态并不会刷新。

```csharp
var walterlv = new Walterlv();
TestCommand.DataContext = walterlv;

await Task.Delay(5000);
walterlv.WalterlvCommand.SomeFlag = true;
```

当然，以上所有代码会更像伪代码，如果你不熟悉 WPF，是一定编译不过的。我只是在表达这个意思。

## 如何手动刷新命令

调用以下代码，即可让 WPF 中的命令刷新其可用性：

```csharp
CommandManager.InvalidateRequerySuggested();
```

## WPF 的命令在何时刷新？

默认情况下，WPF 的命令只会在以下时机刷新可用性：

- `KeyUp`
- `MouseUp`
- `GotKeyboardFocus`
- `LostKeyboardFocus`

使用通俗的话来说，就是：

- 键盘按下的按键抬起的时候
- 在鼠标的左键或者右键松开的时候
- 在任何一个控件获得键盘焦点或者失去键盘焦点的时候

这部分的代码可以在这里查看：

- [CommandDevice.PostProcessInput](https://referencesource.microsoft.com/#PresentationCore/Core/CSharp/System/Windows/Input/Command/CommandDevice.cs,e56c8b8276e9745a,references)

最关键的代码贴在这里：

```csharp
// 省略前面。
if (e.StagingItem.Input.RoutedEvent == Keyboard.KeyUpEvent ||
    e.StagingItem.Input.RoutedEvent == Mouse.MouseUpEvent ||
    e.StagingItem.Input.RoutedEvent == Keyboard.GotKeyboardFocusEvent ||
    e.StagingItem.Input.RoutedEvent == Keyboard.LostKeyboardFocusEvent)
{
    CommandManager.InvalidateRequerySuggested();
}
```

然而，并不是只在这些时机进行刷新，还有其他的时机，比如这些：

- 在 `Menu` 菜单的子菜单项打开的时候（参见 [MenuItem.OnIsSubmenuOpenChanged](https://referencesource.microsoft.com/#PresentationFramework/src/Framework/System/Windows/Controls/MenuItem.cs,f6b031dd8baedf62,references)）
- 在长按滚动条中的按钮以连续滚动的过程中（参见 [Tracker.DecreaseRepeatButton](https://referencesource.microsoft.com/#PresentationFramework/src/Framework/System/Windows/Controls/Primitives/Track.cs,e17c022746f4de8b,references)）
- 在 `DataGridCell` 的只读属性改变的时候（参见 [DataGridCell.OnNotifyIsReadOnlyChanged](https://referencesource.microsoft.com/#PresentationFramework/src/Framework/System/Windows/Controls/DataGridCell.cs,561c6f5a5beaebd0,references)）
- 在 `DataGrid` 中的各种各样的操作中（参见 [DataGrid](https://referencesource.microsoft.com/#PresentationFramework/src/Framework/System/Windows/Controls/DataGrid.cs,0a7919e43781659b,references)）
- 在 `JournalNavigationScope` 向后导航的时候（参见 [JournalNavigationScope.OnBackForwardStateChange](https://referencesource.microsoft.com/#PresentationFramework/src/Framework/MS/Internal/AppModel/JournalNavigationScope.cs,279da0f5dea085dc,references)）
- 还有其他，你可以在此链接双击 `InvalidateRequerySuggested` 查看：[InvalidateRequerySuggested](https://referencesource.microsoft.com/#PresentationCore/Core/CSharp/System/Windows/Input/Command/CommandManager.cs,fb01095b2fe73140,references)

