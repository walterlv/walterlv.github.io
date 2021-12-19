---
title: "最简单的代码，让 WPF 支持响应式布局"
publishDate: 2020-04-04 12:17:24 +0800
date: 2020-04-04 22:55:07 +0800
tags: wpf dotnet
position: knowledge
---

响应式布局在各种现代的 UI 框架中不是什么新鲜的概念，基本都是内置支持。然而在古老的 WPF 框架中却并没有原生支持，后来虽然通过 Blend 自带的 Interactions 库实现了响应式布局，但生成的代码量太大了，而且需要引入额外的库。

如果只是希望临时局部地方使用响应式布局，那么其实可以直接使用 WPF 内置的绑定机制来完成响应式布局。本文介绍如何使用。

---

思路是在控件尺寸发生变更的时候更新控件的样式。而能容易实现这个的只有 `Trigger` 和 `Setter` 那一套。直接在控件上使用的 `Trigger` 只能使用 `EventTrigger`，因此我们需要编写能写更多种类 `Trigger` 的 `Style`。

```xml
<Style x:Key="Style.Foo.WalterlvDemo">
    <Setter Property="Grid.Row" Value="0" />
    <Setter Property="Grid.Column" Value="0" />
    <Style.Triggers>
        <DataTrigger Value="True"
                     Binding="{Binding ActualHeight, ElementName=DemoWindow,
                              Converter={StaticResource GreaterOrEqualsConverter},
                              ConverterParameter=640}">
            <Setter Property="Grid.Row" Value="1" />
            <Setter Property="Grid.Column" Value="1" />
        </DataTrigger>
    </Style.Triggers>
</Style>
```

定义了一个样式，默认情况下，行列是 (0, 0)，当窗口宽度大于或等于 640 之后，行列换到 (1, 1)。

这里我们需要一个大于或等于，以及小于的转换器。

```csharp
using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Data;

namespace Cvte.EasiNote.UI.Styles.Converters
{
    public class GreaterOrEqualsConverter : IValueConverter
    {
        public double Than { get; set; }

        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            if (value is double d)
            {
                return d >= Than;
            }
            else if (value is float f)
            {
                return f >= Than;
            }
            else if (value is ulong ul)
            {
                return ul >= Than;
            }
            else if (value is long l)
            {
                return l >= Than;
            }
            else if (value is uint ui)
            {
                return ui >= Than;
            }
            else if (value is int i)
            {
                return i >= Than;
            }
            else if (value is ushort us)
            {
                return us >= Than;
            }
            else if (value is short s)
            {
                return s >= Than;
            }
            else
            {
                return false;
            }
        }

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        {
            throw new NotSupportedException();
        }
    }
```

```csharp
    public class LessConverter : IValueConverter
    {
        public double Than { get; set; }

        public object Convert(object value, Type targetType, object parameter, CultureInfo culture)
        {
            if (value is double d)
            {
                return d < Than;
            }
            else if (value is float f)
            {
                return f < Than;
            }
            else if (value is ulong ul)
            {
                return ul < Than;
            }
            else if (value is long l)
            {
                return l < Than;
            }
            else if (value is uint ui)
            {
                return ui < Than;
            }
            else if (value is int i)
            {
                return i < Than;
            }
            else if (value is ushort us)
            {
                return us < Than;
            }
            else if (value is short s)
            {
                return s < Than;
            }
            else
            {
                return false;
            }
        }

        public object ConvertBack(object value, Type targetType, object parameter, CultureInfo culture)
        {
            throw new NotSupportedException();
        }
    }
}
```

如果你本身是写的基础控件的样式，那么绑定当然就跟本文一开始说的写法非常类似了。

如果你需要写的是一般控件，可以考虑直接在控件里写 `<Framework.Style />` 把样式内联进去。

如果你写的是 `DataTemplate`，也一样是使用 `DataTrigger` 绑定。

你也可以不绑定到窗口上，而绑定到控件本身上，使用 `TemplatedParent` 作为绑定的源即可。

```xml
<DataTemplate>
    <DataTemplate.Resources>
        <local:LessConverter x:Key="LessThan60" Than="60" />
    </DataTemplate.Resources>
    <Grid>
        <Image x:Name="Icon" />
        <Rectangle x:Name="Mask" Fill="Red" />
    </Grid>
    <DataTemplate.Triggers>
        <DataTrigger Binding="{Binding ActualWidth, RelativeSource={RelativeSource TemplatedParent}, Converter={StaticResource LessThan60}}" Value="True">
            <Setter TargetName="Icon" Property="Grid.ColumnSpan" Value="3" />
            <Setter TargetName="Mask" Property="Visibility" Value="Collapsed" />
        </DataTrigger>
</DataTemplate>
```
