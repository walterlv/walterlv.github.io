---
title: "WPF 自定义键盘焦点样式（FocusVisualStyle）"
publishDate: 2017-12-17 15:34:26 +0800
date: 2018-12-14 09:54:00 +0800
tags: wpf uwp
coverImage: /static/posts/2017-12-17-15-27-27.png
permalink: /post/customize-focus-visual-style.html
---

WPF 自带的键盘焦点样式是与传统控件样式搭配的，但 WPF 凭着其强大的自定义样式的能力，做出与传统控件样式完全不同风格的 UI 简直易如反掌。这时，其自带的键盘焦点样式（`FocusVisualStyle`）就非常不搭了，改改会舒服得多。比如，改成 UWP 的样式。

本文将展示 WPF 自定义键盘焦点样式自定义的**坑**！

---

![WPF 自带的键盘焦点样式](/static/posts/2017-12-17-wpf-default-focus-visual-style.gif)  
▲ WPF 自带的键盘焦点样式

![UWP 暗主题键盘焦点样式](/static/posts/2017-12-17-uwp-dark-focus-visual-style.gif)  
▲ UWP 暗主题键盘焦点样式

其实微软官方文档 [Styling for Focus in Controls, and FocusVisualStyle - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/wpf/advanced/styling-for-focus-in-controls-and-focusvisualstyle?wt.mc_id=MVP) 有说明 `FocusVisualStyle`，但是——**完全没有讲自定义**好吗！

所以，我试着写一个样式以覆盖默认的样式：

```csharp
<Style x:Key="{x:Static SystemParameters.FocusVisualStyleKey}">
    <Setter Property="Control.Template">
        <Setter.Value>
            <ControlTemplate>
                <Rectangle Margin="-3" StrokeThickness="3" Stroke="Gray" SnapsToDevicePixels="true"/>
            </ControlTemplate>
        </Setter.Value>
    </Setter>
</Style>
```

运行一看，结果完全没有效果……

![完全没有效果](/static/posts/2017-12-17-wpf-default-focus-visual-style.gif)

StackOverflow 上也有人说了这件事：[xaml - How to redefine FocusVisualStyle for a WPF user control - Stack Overflow](https://stackoverflow.com/questions/29101942/how-to-redefine-focusvisualstyle-for-a-wpf-user-control)。[Rohit Vats](https://stackoverflow.com/users/632337/rohit-vats) 说需要通过单独为 `Button` 设置才能生效并在回答中贴出了代码。

然而同样的代码应用到项目中，我们会发现，我们此前定义的无 Key 样式也失效了：

![样式失效](/static/posts/2017-12-17-15-27-27.png)

我的代码是这样的，试图用上此前定义的无 Key 样式，只是无效。

```csharp
<Style x:Key="{x:Static SystemParameters.FocusVisualStyleKey}">
    <Setter Property="Control.Template">
        <Setter.Value>
            <ControlTemplate>
                <Rectangle Margin="-3" StrokeThickness="3" Stroke="Gray" SnapsToDevicePixels="true"/>
            </ControlTemplate>
        </Setter.Value>
    </Setter>
</Style>
<Style TargetType="Button" BasedOn="{StaticResource {x:Type Button}}">
    <Setter Property="FocusVisualStyle" Value="{StaticResource {x:Static SystemParameters.FocusVisualStyleKey}}"/>
</Style>
```

那么，有没有办法能够一次定义整个应用程序生效呢？

答案是——

![没有](/static/posts/2017-12-17-15-32-09.png)

[wpf - Change the FocusVisualStyle in the entire application - Stack Overflow](https://stackoverflow.com/questions/1879526/change-the-focusvisualstyle-in-the-entire-application) 也承认了这一点。

---

所以，当希望为 WPF 程序自定义 `FocusVisualStyle` 样式的话，建议从零开始，定义每一个最底层样式的时候设置好 `FocusVisualStyle`，其他样式定义的时候继承自最底层样式。

---

**参考资料**

- [Styling for Focus in Controls, and FocusVisualStyle - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/wpf/advanced/styling-for-focus-in-controls-and-focusvisualstyle?wt.mc_id=MVP)
- [xaml - How to redefine FocusVisualStyle for a WPF user control - Stack Overflow](https://stackoverflow.com/questions/29101942/how-to-redefine-focusvisualstyle-for-a-wpf-user-control)
- [wpf - Change the FocusVisualStyle in the entire application - Stack Overflow](https://stackoverflow.com/questions/1879526/change-the-focusvisualstyle-in-the-entire-application)


