---
title: "一点点从坑里爬出来：如何正确打开 WPF 里的 Popup？"
publishDate: 2020-04-03 16:40:01 +0800
date: 2020-04-07 21:34:17 +0800
categories: wpf dotnet
position: principle
---

在 WPF 中打开一个 Popup 并没有想象当中容易。虽说提供了一个 `IsOpen` 属性用于显示 Popup，但实际上造成的 Bug 会让你解得死去活来。Win32 的 WS_POPUP 也坑，不过 WPF 会额外再带来一些，所以本文只说 WPF。

---

<div id="toc"></div>

## 先说结论

本文一开始就贴出打开一个 Popup 的代码

```csharp
// 在以下代码中，我们假定 popup 是我们要显示出来的 Popup，而 textBox 是 Popup 中的文本框。
private async void WalterlvDemoControl_MouseUp(object sender, MouseButtonEventArgs e)
{
    // 必须延迟打开 Popup，如果在 MouseUp 中打开，会使得 Popup 无法获得焦点。
    await Task.Yield();
    popup.IsOpen = true;

    // 必须显式让 Popup 获得焦点，否则内部的 TextBox 输入时，IME 输入框无法跟随。
    await Task.Yield();
    var source = (HwndSource) PresentationSource.FromVisual(popup.Child);
    SetFocus(source.Handle);

    // 必须显式让文本框获得焦点（如果有的话）。
    await Task.Yield();
    Keyboard.Focus(textBox);
}

[DllImport("user32")]
public static extern IntPtr SetFocus(IntPtr hWnd);
```

如果你的 Popup 中没有文本框，那么最后的两段可以删除。

接下来一一说明。

## 不要在 MouseUp/Click 事件中打开 Popup

Popup 有一个属性 `StaysOpen`，当设置为 `false` 时，我们期待的效果是失焦后 Popup 关闭。然而如果你是在任何控件的 MouseUp 事件中打开的，那么 Popup 就不会获得焦点。既然不会获得焦点，那么也就不存在失焦的问题。

具体表现为，你打开了 Popup 后，Popup 不会自己再自动关闭了，除非你手动在 Popup 内部点一下让 Popup 获得焦点，随后才会自动关闭。

无论你在后面如何写让 Popup 以及内部控件获得焦点的代码，实际上这种情况下弹出的 Popup 不会真正获得焦点，除非手动点击。

所以我在以上代码中加上了 `await Task.Yield()` 这样可以让后续的代码不再在 `MouseUp` 事件中。

如果你的 Popup 中没有文本框，那么这样做就够了；如果有，那么还需要做后续处理。

## 需要显式为 Popup 设置焦点

注意注意，如果你的 Popup 中包含文本框，那么一定需要加上 `SetFocus` 的调用。WPF 版本的设置焦点，无论是逻辑焦点（`xx.Focus()`）还是键盘焦点（`Keyboard.Focus(xx)`）都无法真正让 Popup 获得焦点。这时打字，IME 框是不会跟随文本框的。

## 需要单独为 TextBox 再设置焦点

只是为 Popup 设置焦点的话，Popup 中的文本框没有获得焦点，是不能直接打字的。当然你可能需求如此。这里就没有特别说明的点了。
