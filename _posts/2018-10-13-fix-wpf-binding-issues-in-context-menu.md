---
title: "WPF 的 ElementName 在 ContextMenu 中无法绑定成功？试试使用 x:Reference！"
date: 2018-10-13 21:38:01 +0800
categories: wpf dotnet
---

在 Binding 中使用 ElementName 司空见惯，没见它出过什么事儿。不过当你预见 ContextMenu，或者类似 Grid.Row / Grid.Column 这样的属性中设置的时候，ElementName 就不那么管用了。

本文将解决这个问题。

---

<div id="toc"></div>

### 以下代码是可以正常工作的

```xml
<Window x:Class="Walterlv.Demo.BindingContext.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        x:Name="WalterlvWindow" Title="Walterlv Binding Demo" Height="450" Width="800">
    <Grid Background="LightGray" Margin="1 1 1 0" MinHeight="40">
        <TextBlock>
            <Run Text="{Binding Mode=OneWay}" FontSize="20" />
            <LineBreak />
            <Run Text="{Binding ElementName=WalterlvWindow, Path=DemoText, Mode=OneWay}" />
        </TextBlock>
    </Grid>
</Window>
```

在代码中，我们为一段文字中的一个部分绑定了主窗口的的一个属性，于是我们使用 `ElementName` 来指定绑定源为 `WalterlvWindow`。

![使用普通的 ElementName 绑定](/static/posts/2018-10-13-20-48-58.png)  
▲ 使用普通的 ElementName 绑定

### 以下代码就无法正常工作了

保持以上代码不变，我们现在新增一个 `ContextMenu`，然后在 `ContextMenu` 中使用一模一样的绑定表达式：

```xml
<Window x:Class="Walterlv.Demo.BindingContext.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        x:Name="WalterlvWindow" Title="Walterlv Binding Demo" Height="450" Width="800">
    <Grid Background="LightGray" Margin="1 1 1 0" MinHeight="40">
        <Grid.ContextMenu>
            <ContextMenu>
                <MenuItem Header="{Binding ElementName=WalterlvWindow, Path=DemoText, Mode=OneWay}" />
            </ContextMenu>
        </Grid.ContextMenu>
        <TextBlock>
            <Run Text="{Binding Mode=OneWay}" FontSize="20" />
            <LineBreak />
            <Run Text="{Binding ElementName=WalterlvWindow, Path=DemoText, Mode=OneWay}" />
        </TextBlock>
    </Grid>
</Window>
```

注意，`MenuItem` 的 `Header` 属性设置为和 `Run` 的 `Text` 属性一模一样的绑定字符串。不过运行之后的截图显示，右键菜单中并没有如预期般出现绑定的字符串。

![在 ContextMenu 中使用了 ElementName 绑定](/static/posts/2018-10-13-20-51-38.png)

### 使用 x:Reference 代替 ElementName 能够解决

以上绑定失败的原因，是 `Grid.ContextMenu` 属性中赋值的 `ContextMenu` 不在可视化树中，而 `ContextMenu` 又不是一个默认建立 ScopeName 的控件，此时既没有自己指定 NameScope，有没有通过可视化树寻找上层设置的 NameScope，所以在绑定上下文中是找不到 `WalterlvWindow` 的。详见：[预留链接](#)。

类似的情况也发生在设置非可视化树或逻辑树的属性时，典型的比如在 `Grid.Row` 或 `Grid.Column` 属性上绑定时，`ElementName` 也是失效的。

此时最适合的情况是直接使用 `x:Reference`。

```diff
  <Window x:Class="Walterlv.Demo.BindingContext.MainWindow"
          xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
          xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
          x:Name="WalterlvWindow" Title="Walterlv Binding Demo" Height="450" Width="800">
      <Grid Background="LightGray" Margin="1 1 1 0" MinHeight="40">
          <Grid.ContextMenu>
              <ContextMenu>
-                 <MenuItem Header="{Binding ElementName=WalterlvWindow, Path=DemoText, Mode=OneWay}" />
+                 <MenuItem Header="{Binding Source={x:Reference WalterlvWindow}, Path=DemoText, Mode=OneWay}" />
              </ContextMenu>
          </Grid.ContextMenu>
          <TextBlock>
              <Run Text="{Binding Mode=OneWay}" FontSize="20" />
              <LineBreak />
              <Run Text="{Binding ElementName=WalterlvWindow, Path=DemoText, Mode=OneWay}" />
          </TextBlock>
      </Grid>
  </Window>
```

不过，这是个假象，因为此代码运行时会抛出异常：

> XamlObjectWriterException: Cannot call MarkupExtension.ProvideValue because of a cyclical dependency. Properties inside a MarkupExtension cannot reference objects that reference the result of the MarkupExtension. The affected MarkupExtensions are:  
> 'System.Windows.Data.Binding' Line number '8' and line position '27'.

因为给 `MenuItem` 的 `Header` 属性绑定赋值的时候，创建绑定表达式用到了 `WalterlvWindow`，但此时 `WalterlvWindow` 尚在构建（因为里面的 `ContextMenu` 是窗口的一部分），于是出现了循环依赖。而这是不允许的。

为了解决循环依赖问题，我们可以考虑将 `x:Reference` 放到资源中。因为资源是按需创建的，所以这不会造成循环依赖。

那么总得有一个对象来承载我们的绑定源。拿控件的 `Tag` 属性也许是一个方案，不过专门为此建立一个绑定代理类也许是一个更符合语义的方法：

```diff
  <Window x:Class="Walterlv.Demo.BindingContext.MainWindow"
          xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
          xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
+         xmlns:local="clr-namespace:Walterlv.Demo.BindingContext"
          x:Name="WalterlvWindow" Title="Walterlv Binding Demo" Height="450" Width="800">
+     <Window.Resources>
+         <local:BindingProxy x:Key="WalterlvBindingProxy" Data="{x:Reference WalterlvWindow}" />
+     </Window.Resources>
      <Grid Background="LightGray" Margin="1 1 1 0" MinHeight="40">
          <Grid.ContextMenu>
              <ContextMenu>
-                 <MenuItem Header="{Binding Source={x:Reference WalterlvWindow}, Path=DemoText, Mode=OneWay}" />
+                 <MenuItem Header="{Binding Source={StaticResource WalterlvBindingProxy}, Path=Data.DemoText, Mode=OneWay}" />
              </ContextMenu>
          </Grid.ContextMenu>
          <TextBlock>
              <Run Text="{Binding Mode=OneWay}" FontSize="20" />
              <LineBreak />
              <Run Text="{Binding ElementName=WalterlvWindow, Path=DemoText, Mode=OneWay}" />
          </TextBlock>
      </Grid>
  </Window>
```

至于 `BindingProxy`，非常简单：

```csharp
public sealed class BindingProxy : Freezable
{
    public static readonly DependencyProperty DataProperty = DependencyProperty.Register(
        "Data", typeof(object), typeof(BindingProxy), new PropertyMetadata(default(object)));

    public object Data
    {
        get => (object) GetValue(DataProperty);
        set => SetValue(DataProperty, value);
    }

    protected override Freezable CreateInstanceCore() => new BindingProxy();

    public override string ToString() => Data is FrameworkElement fe
        ? $"BindingProxy: {fe.Name}"
        : $"Binding Proxy: {Data?.GetType().FullName}";
}
```

现在运行，右键菜单已经正常完成了绑定。

![右键菜单完成了绑定](/static/posts/2018-10-13-21-19-56.png)  
▲ 右键菜单已经正常完成了绑定

---

#### 参考资料

- [c# - WPF databinding error in Tag property - Stack Overflow](https://stackoverflow.com/a/32879146/6233938)
