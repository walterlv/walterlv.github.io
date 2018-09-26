---
title: "UWP 轻量级样式定义（Lightweight Styling）"
date: 2018-09-26 09:17:07 +0800
categories: dotnet csharp uwp
---

在 UWP 中，可以通过给空间直接设置属性或在 `Style` 中设置属性来定制空间的样式；不过这样的样式定义十分有限，比如按钮按下时的样式就没法儿设置。当然可以通过修改 `Template` 来设置控件的样式，然而 UWP 中控件的样式代码实在是太多太复杂了，还不容易从 Blend 中复制了大量代码出来改，下个版本样式又不一样，于是我们就丢了不少功能。

本文将介绍 UWP 轻量级样式定义（Lightweight styling），你既不用写太多代码，又能获得更多的样式控制。

---

<div id="toc"></div>

### 轻量级样式定义

看一段简单的代码，你一定能立刻明白本文想说的是什么。

```xml
<Page.Resources>
    <ResourceDictionary>
        <ResourceDictionary.ThemeDictionaries>
            <ResourceDictionary x:Key="Light">
                <SolidColorBrush x:Key="ButtonBackground" Color="Transparent"/>
                <SolidColorBrush x:Key="ButtonForeground" Color="#dd5145"/>
                <SolidColorBrush x:Key="ButtonBorderBrush" Color="#dd5145"/>
            </ResourceDictionary>
        </ResourceDictionary.ThemeDictionaries>
    </ResourceDictionary>
</Page.Resources>
```

本段代码摘抄自 [XAML Lightweight styling - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/design/controls-and-patterns/xaml-styles#lightweight-styling)

![按钮的颜色定制](/static/posts/2018-09-25-20-00-48.png)  
▲ 按钮的颜色定制

以上代码可以写在 Page 中，即可在 Page 范围内获得这些主题资源的重写。当然，如果需要更大范围，可以考虑去 `App` 类中重写。

官网上举例的这种类型的样式定义其实普通的 Style 也能很容易实现的，真正厉害的是 Style 里设置不了的那些鼠标滑过颜色和鼠标按下颜色。于是，我们额外添加一些代码：

```xml
<SolidColorBrush x:Key="ButtonBackground" Color="Transparent"/>
<SolidColorBrush x:Key="ButtonForeground" Color="#dd5145"/>
<SolidColorBrush x:Key="ButtonBorderBrush" Color="#dd5145"/>
<SolidColorBrush x:Key="ButtonBackgroundPointerOver" Color="#10dd5145"/>
<SolidColorBrush x:Key="ButtonForegroundPointerOver" Color="#ffcd44"/>
<SolidColorBrush x:Key="ButtonBorderBrushPointerOver" Color="#ffcd44"/>
<SolidColorBrush x:Key="ButtonBackgroundPressed" Color="#10ca5100"/>
<SolidColorBrush x:Key="ButtonForegroundPressed" Color="#ca5100"/>
<SolidColorBrush x:Key="ButtonBorderBrushPressed" Color="#ca5100"/>
```

现在我们只是设置一些颜色值即修改了按钮在多种状态下的外观。而且在按下的过程中，还保留了按钮按下时的倾斜效果。

![按钮更多的颜色定制](/static/posts/2018-09-26-lightweight-styling.gif)  
▲ 按钮更多的颜色定制

相比于 Template -> Edit Copy 这种重量级的样式与模板定义，在保证足够的样式定义的情况下，代码量是不是少了非常多了呢？

### 如何找到控件支持的主题资源

前面我们知道了如何定制轻量级样式，但实际做 UI 的时候，我怎么知道有哪些样式主题资源的值可以使用呢？

一种方法是直接看微软官方文档，比如这里 [XAML theme resources](https://docs.microsoft.com/en-us/windows/uwp/design/controls-and-patterns/xaml-theme-resources)；你可以在这篇文章中找到很多通用的主题资源的 Key 用来重写。不过实际上由于 [Windows Community Toolkit](https://docs.microsoft.com/en-us/windows/communitytoolkit/) 以及各种第三方控件库的存在，所以没有什么文档是可以把这些 Key 写全的；所以更重要的方法是我们能自己找到有哪些 Key 可以使用。

找到 Key 的方法和定义一个全新的 Style / Template 一样，都可以通过 Visual Studio 的设计器视图（或者 Blend）实现。

#### 第一步：前往 Visual Studio 设计器视图

![Visual Studio 设计器视图](/static/posts/2018-09-26-09-03-50.png)  
▲ Visual Studio 设计器视图

#### 第二步：在其中一个你想定制样式的控件上 右键 -> 编辑模板 -> 编辑副本

![编辑模板](/static/posts/2018-09-26-09-04-53.png)  
▲ 编辑模板

特别注意，如果你发现你的 “编辑副本” 是灰色的，说明你已经定制过样式了。将你已经定制的样式删除后，就可以再编辑副本了。

![灰色的 “编辑副本”](/static/posts/2018-09-26-09-05-18.png)  
▲ 灰色的 “编辑副本”

#### 第三步：寻找你感兴趣的主题资源的 Key，记下来准备定义

在编辑副本后，你可以在副本的代码中找到按钮的原生样式定义。比如一个按钮的样式是这样的：

```xml
<Style x:Key="ButtonStyle1" TargetType="Button">
    <Setter Property="Background" Value="{ThemeResource ButtonBackground}"/>
    <Setter Property="Foreground" Value="{ThemeResource ButtonForeground}"/>
    <Setter Property="BorderBrush" Value="{ThemeResource ButtonBorderBrush}"/>
    <Setter Property="BorderThickness" Value="{ThemeResource ButtonBorderThemeThickness}"/>
    <Setter Property="Padding" Value="8,4,8,4"/>
    <Setter Property="HorizontalAlignment" Value="Left"/>
    <Setter Property="VerticalAlignment" Value="Center"/>
    <Setter Property="FontFamily" Value="{ThemeResource ContentControlThemeFontFamily}"/>
    <Setter Property="FontWeight" Value="Normal"/>
    <Setter Property="FontSize" Value="{ThemeResource ControlContentThemeFontSize}"/>
    <Setter Property="UseSystemFocusVisuals" Value="{StaticResource UseSystemFocusVisuals}"/>
    <Setter Property="FocusVisualMargin" Value="-3"/>
    <Setter Property="Template">
        <Setter.Value>
            <ControlTemplate TargetType="Button">
                <Grid x:Name="RootGrid" Background="{TemplateBinding Background}">
                    <VisualStateManager.VisualStateGroups>
                        <VisualStateGroup x:Name="CommonStates">
                            <VisualState x:Name="Normal">
                                <Storyboard>
                                    <PointerUpThemeAnimation Storyboard.TargetName="RootGrid"/>
                                </Storyboard>
                            </VisualState>
                            <VisualState x:Name="PointerOver">
                                <Storyboard>
                                    <ObjectAnimationUsingKeyFrames Storyboard.TargetName="RootGrid" Storyboard.TargetProperty="Background">
                                        <DiscreteObjectKeyFrame KeyTime="0" Value="{ThemeResource ButtonBackgroundPointerOver}"/>
                                    </ObjectAnimationUsingKeyFrames>
                                    <ObjectAnimationUsingKeyFrames Storyboard.TargetName="ContentPresenter" Storyboard.TargetProperty="BorderBrush">
                                        <DiscreteObjectKeyFrame KeyTime="0" Value="{ThemeResource ButtonBorderBrushPointerOver}"/>
                                    </ObjectAnimationUsingKeyFrames>
                                    <ObjectAnimationUsingKeyFrames Storyboard.TargetName="ContentPresenter" Storyboard.TargetProperty="Foreground">
                                        <DiscreteObjectKeyFrame KeyTime="0" Value="{ThemeResource ButtonForegroundPointerOver}"/>
                                    </ObjectAnimationUsingKeyFrames>
                                    <PointerUpThemeAnimation Storyboard.TargetName="RootGrid"/>
                                </Storyboard>
                            </VisualState>
                            <VisualState x:Name="Pressed">
                                <Storyboard>
                                    <ObjectAnimationUsingKeyFrames Storyboard.TargetName="RootGrid" Storyboard.TargetProperty="Background">
                                        <DiscreteObjectKeyFrame KeyTime="0" Value="{ThemeResource ButtonBackgroundPressed}"/>
                                    </ObjectAnimationUsingKeyFrames>
                                    <ObjectAnimationUsingKeyFrames Storyboard.TargetName="ContentPresenter" Storyboard.TargetProperty="BorderBrush">
                                        <DiscreteObjectKeyFrame KeyTime="0" Value="{ThemeResource ButtonBorderBrushPressed}"/>
                                    </ObjectAnimationUsingKeyFrames>
                                    <ObjectAnimationUsingKeyFrames Storyboard.TargetName="ContentPresenter" Storyboard.TargetProperty="Foreground">
                                        <DiscreteObjectKeyFrame KeyTime="0" Value="{ThemeResource ButtonForegroundPressed}"/>
                                    </ObjectAnimationUsingKeyFrames>
                                    <PointerDownThemeAnimation Storyboard.TargetName="RootGrid"/>
                                </Storyboard>
                            </VisualState>
                            <VisualState x:Name="Disabled">
                                <Storyboard>
                                    <ObjectAnimationUsingKeyFrames Storyboard.TargetName="RootGrid" Storyboard.TargetProperty="Background">
                                        <DiscreteObjectKeyFrame KeyTime="0" Value="{ThemeResource ButtonBackgroundDisabled}"/>
                                    </ObjectAnimationUsingKeyFrames>
                                    <ObjectAnimationUsingKeyFrames Storyboard.TargetName="ContentPresenter" Storyboard.TargetProperty="BorderBrush">
                                        <DiscreteObjectKeyFrame KeyTime="0" Value="{ThemeResource ButtonBorderBrushDisabled}"/>
                                    </ObjectAnimationUsingKeyFrames>
                                    <ObjectAnimationUsingKeyFrames Storyboard.TargetName="ContentPresenter" Storyboard.TargetProperty="Foreground">
                                        <DiscreteObjectKeyFrame KeyTime="0" Value="{ThemeResource ButtonForegroundDisabled}"/>
                                    </ObjectAnimationUsingKeyFrames>
                                </Storyboard>
                            </VisualState>
                        </VisualStateGroup>
                    </VisualStateManager.VisualStateGroups>
                    <ContentPresenter x:Name="ContentPresenter" AutomationProperties.AccessibilityView="Raw" BorderThickness="{TemplateBinding BorderThickness}" BorderBrush="{TemplateBinding BorderBrush}" ContentTemplate="{TemplateBinding ContentTemplate}" Content="{TemplateBinding Content}" ContentTransitions="{TemplateBinding ContentTransitions}" HorizontalContentAlignment="{TemplateBinding HorizontalContentAlignment}" Padding="{TemplateBinding Padding}" VerticalContentAlignment="{TemplateBinding VerticalContentAlignment}"/>
                </Grid>
            </ControlTemplate>
        </Setter.Value>
    </Setter>
</Style>
```

从中我们可以找到这些可以定义的主题资源 Key：

- ButtonBackground
- ButtonForeground
- ButtonBorderBrush
- ButtonBorderThemeThickness
- ContentControlThemeFontFamily
- ControlContentThemeFontSize
- ButtonBackgroundPointerOver
- ButtonBorderBrushPointerOver
- ButtonForegroundPointerOver
- ButtonBackgroundPressed
- ButtonBorderBrushPressed
- ButtonForegroundPressed
- ButtonBackgroundDisabled
- ButtonBorderBrushDisabled
- ButtonForegroundDisabled

#### 第四步：轻量级样式定义

请先删除这份副本样式，这样你就可以进行 “轻量级样式定义” 了。代码量相比于上面这份完整样式可以少非常多。
