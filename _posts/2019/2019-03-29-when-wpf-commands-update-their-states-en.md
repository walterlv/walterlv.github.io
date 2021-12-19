---
title: "When WPF Commands update their CanExecute states?"
date: 2019-03-29 16:43:19 +0800
tags: wpf dotnet csharp
position: problem
version:
  current: English
versions:
  - 中文: /post/when-wpf-commands-update-their-states.html
  - English: #
---

When writing `Command="{Binding WalterlvCommand}"` into your XAML code and your button or other controls can automatically execute command and updating the command states, such as enabling or disabling the button.

We'll talk about when the UI commands will refresh their can-execute states and how to force updating the states.

---

This post is written in **multiple languages**. Please select yours:

{% include post-version-selector.html %}

This post is written for my Stack Overflow answer:

- [Why C# WPF button binding command won't change view after using simple injector? - Stack Overflow](https://stackoverflow.com/a/55348322/6233938)

<div id="toc"></div>

## A simple sample

```xml
<Button x:Name="TestCommand" Command="{Binding WalterlvCommand}" />
```

```csharp
public class Walterlv
{
    // Assume that I've initialized this command.
    public WalterlvCommand WalterlvCommand { get; }
}

public class WalterlvCommand : ICommand
{
    public bool SomeFlag { get; set; }

    bool ICommand.CanExecute(object parameter)
    {
        // Return the real can execution state.
        return SomeFlag;
    }

    void ICommand.Execute(object parameter)
    {
        // The actual executing procedure.
    }
}
```

See this code below. After 5 seconds, the button will still be disabled even that we set the `SomeFlat` to `true`.

```csharp
var walterlv = new Walterlv();
TestCommand.DataContext = walterlv;

await Task.Delay(5000);
walterlv.WalterlvCommand.SomeFlag = true;
```

## How to update manually?

Call this method after you want to update your command states if it won't update:

```csharp
CommandManager.InvalidateRequerySuggested();
```

## When do the commands update their states?

Commands only update when these general events happen:

- `KeyUp`
- `MouseUp`
- `GotKeyboardFocus`
- `LostKeyboardFocus`

You can see the code here:

- [CommandDevice.PostProcessInput](https://referencesource.microsoft.com/#PresentationCore/Core/CSharp/System/Windows/Input/Command/CommandDevice.cs,e56c8b8276e9745a,references)

And the key code is here:

```csharp
if (e.StagingItem.Input.RoutedEvent == Keyboard.KeyUpEvent ||
    e.StagingItem.Input.RoutedEvent == Mouse.MouseUpEvent ||
    e.StagingItem.Input.RoutedEvent == Keyboard.GotKeyboardFocusEvent ||
    e.StagingItem.Input.RoutedEvent == Keyboard.LostKeyboardFocusEvent)
{
    CommandManager.InvalidateRequerySuggested();
}
```

Actually, not only those events above but also these methods below refresh the command states:

- When opening a submenu of a MenuItem. *See [MenuItem.OnIsSubmenuOpenChanged](https://referencesource.microsoft.com/#PresentationFramework/src/Framework/System/Windows/Controls/MenuItem.cs,f6b031dd8baedf62,references)*
- When pressing and holding a RepeatButton in a Tracker. *[Tracker.DecreaseRepeatButton](https://referencesource.microsoft.com/#PresentationFramework/src/Framework/System/Windows/Controls/Primitives/Track.cs,e17c022746f4de8b,references)*
- When change the readonly property of `DataGridCell`. *[DataGridCell.OnNotifyIsReadOnlyChanged](https://referencesource.microsoft.com/#PresentationFramework/src/Framework/System/Windows/Controls/DataGridCell.cs,561c6f5a5beaebd0,references)*
- When doing many operations in a `DataGrid`. *[DataGrid](https://referencesource.microsoft.com/#PresentationFramework/src/Framework/System/Windows/Controls/DataGrid.cs,0a7919e43781659b,references)*
- When navigating back in a `JournalNavigationScope`. *[JournalNavigationScope.OnBackForwardStateChange](https://referencesource.microsoft.com/#PresentationFramework/src/Framework/MS/Internal/AppModel/JournalNavigationScope.cs,279da0f5dea085dc,references)*
- And others, you can find references of `InvalidateRequerySuggested`: [InvalidateRequerySuggested](https://referencesource.microsoft.com/#PresentationCore/Core/CSharp/System/Windows/Input/Command/CommandManager.cs,fb01095b2fe73140,references)
