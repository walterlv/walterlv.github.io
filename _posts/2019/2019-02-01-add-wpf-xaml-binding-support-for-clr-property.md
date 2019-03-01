---
title: "WPF 让普通 CLR 属性支持 XAML 绑定（非依赖属性），这样 MarkupExtension 中定义的属性也能使用绑定了"
date: 2019-02-01 01:01:18 +0800
categories: wpf dotnet csharp xaml
position: problem
---

如果你写了一个 `MarkupExtension` 在 XAML 当中使用，你会发现你在 `MarkupExtension` 中定时的属性是无法使用 XAML 绑定的，因为 `MarkupExtension` 不是一个 `DependencyObject`。

本文将给出解决方案，让你能够在任意的类型中写出支持 XAML 绑定的属性；而不一定要依赖对象（`DependencyObject`）和依赖属性（`DependencyProperty`）。

---

<div id="toc"></div>

### 问题

下面是一个很简单的 `MarkupExtension`，用户设置了什么值，就返回什么值。拿这么简单的类型只是为了避免额外引入复杂的理解难度。

```csharp
public class WalterlvExtension : MarkupExtension
{
    private object _value;

    public object Value
    {
        get => _value;
        set => _value = value;
    }

    public override object ProvideValue(IServiceProvider serviceProvider)
    {
        return Value;
    }
}
```

可以在 XAML 中直接赋值：

```xml
<Button Content="{local:Walterlv Value=walterlv.com" />
```

但不能绑定：

```xml
<TextBox x:Name="SourceTextBox" Text="walterlv.com" />
<Button Content="{local:Walterlv Value={Binding Text, Source={x:Reference SourceTextBox}}}" />
```

因为运行时会报错，提示绑定必须被设置到依赖对象的依赖属性中。在设计器中也可以看到提示不能绑定。

![运行时报错](/static/posts/2019-02-01-00-02-34.png)

![设计器的警告](/static/posts/2019-02-01-00-09-00.png)

### 解决

实际上这个问题是能够解决的（不过也花了我一些时间思考解决方案）。

既然绑定需要一个依赖属性，那么我们就定义一个依赖属性。非依赖对象中不能定义依赖属性，于是我们定义附加属性。

```csharp
// 注意：这一段代码实际上是无效的。

public static readonly DependencyProperty ValueProperty = DependencyProperty.RegisterAttached(
    "Value", typeof(object), typeof(WalterlvExtension), new PropertyMetadata(default(object)));

public object Value
{
    get => ???.GetValue(ValueProperty);
    set => ???.SetValue(ValueProperty, value);
}
```

这里问题来了，获取和设置附加属性是需要一个依赖对象的，那么我们哪里去找依赖对象呢？直接定义一个新的就好了。

于是我们定义一个新的依赖对象：

```csharp
// 注意：这一段代码实际上是无效的。

public static readonly DependencyProperty ValueProperty = DependencyProperty.RegisterAttached(
    "Value", typeof(object), typeof(WalterlvExtension), new PropertyMetadata(default(object)));

public object Value
{
    get => _dependencyObject.GetValue(ValueProperty);
    set => _dependencyObject.SetValue(ValueProperty, value);
}

private readonly DependencyObject _dependencyObject = new DependencyObject();
```

现在虽然可以编译通过，但是我们会遇到两个问题：

1. `ValueProperty` 的变更通知的回调函数中，我们只能找到 `_dependencyObject` 的实例，而无法找到外面的类型 `WalterlvExtension` 的实例；这几乎使得 `Value` 的变更通知完全失效。
1. 在 `Value` 的 `set` 方法中得到的 `value` 值是一个 `Binding` 对象，而不是正常依赖属性中得到的绑定的结果；这意味着我们无法直接使用 `Value` 的值。

为了解决这两个问题，我必须自己写一个代理的依赖对象，用于帮助做属性的变更通知，以及处理绑定产生的 `Binding` 对象。在正常的依赖对象和依赖属性中，这些本来都不需要我们自己来处理。

### 方案

于是我写了一个代理的依赖对象，我把它命名为 `ClrBindingExchanger`，意思是将 CLR 属性和依赖属性的绑定进行交换。

代码如下：

```csharp
public class ClrBindingExchanger : DependencyObject
{
    private readonly object _owner;
    private readonly DependencyProperty _attachedProperty;
    private readonly Action<object, object> _valueChangeCallback;

    public ClrBindingExchanger(object owner, DependencyProperty attachedProperty,
        Action<object, object> valueChangeCallback = null)
    {
        _owner = owner;
        _attachedProperty = attachedProperty;
        _valueChangeCallback = valueChangeCallback;
    }

    public object GetValue()
    {
        return GetValue(_attachedProperty);
    }

    public void SetValue(object value)
    {
        if (value is Binding binding)
        {
            BindingOperations.SetBinding(this, _attachedProperty, binding);
        }
        else
        {
            SetValue(_attachedProperty, value);
        }
    }

    public static void ValueChangeCallback(DependencyObject d, DependencyPropertyChangedEventArgs e)
    {
        ((ClrBindingExchanger) d)._valueChangeCallback?.Invoke(e.OldValue, e.NewValue);
    }
}
```

这段代码的意思是这样的：

1. 构造函数中的 `owner` 参数完全没有用，我只是拿来备用，你可以删掉。
1. 构造函数中的 `attachedProperty` 参数是需要定义的附加属性。
    - 因为前面我们说过，有一个附加属性才可以编译通过，所以附加属性是一定要定义的
    - 既然一定要定义附加属性，那么就可以用起来，接下来会用
1. 构造函数中的 `valueChangeCallback` 参数是为了指定变更通知的，因为前面我们说变更通知不好做，于是就这样代理做变更通知。
1. `GetValue` 和 `SetValue` 这两个方法是用来代替 `DependencyObject` 自带的 `GetValue` 和 `SetValue` 的，目的是执行我们希望特别执行的方法。
1. `SetValue` 中我们需要自己考虑绑定对象，如果发现是绑定，那么就真的进行一次绑定。
1. `ValueChangeCallback` 是给附加属性用的，因为用我的这种方法定义附加属性时，只能写出相同的代码，所以干脆就提取出来。

而用法是这样的：

```csharp
public class WalterlvExtension : MarkupExtension
{
    public WalterlvExtension()
    {
        _valueExchanger = new ClrBindingExchanger(this, ValueProperty, OnValueChanged);
    }

    private readonly ClrBindingExchanger _valueExchanger;

    public static readonly DependencyProperty ValueProperty = DependencyProperty.RegisterAttached(
        "Value", typeof(object), typeof(WalterlvExtension),
        new PropertyMetadata(null, ClrBindingExchanger.ValueChangeCallback));

    public object Value
    {
        get => _valueExchanger.GetValue();
        set => _valueExchanger.SetValue(value);
    }

    private void OnValueChanged(object oldValue, object newValue)
    {
        // 在这里可以处理 Value 属性值改变的变更通知。
    }

    public override object ProvideValue(IServiceProvider serviceProvider)
    {
        return Value;
    }
}
```

对于一个属性来说，代码确实多了些，这实在是让人难受。可是，这可以达成目的呀！

解释一下：

1. 定义一个 `_valueExchanger`，就是在使用我们刚刚写的那个新类。
1. 在构造函数中对 `_valueExchanger` 进行初始化，因为要传入 `this` 和一个实例方法 `OnValueChanged`，所以只能在构造函数中初始化。
1. 定义一个附加属性（前面我们说了，一定要有依赖属性才可以编译通过哦）。
    - 注意属性的变更通知方法，需要固定写成 `ClrBindingExchanger.ValueChangeCallback`
1. 定义普通的 CLR 属性 `Value`
    - `GetValue` 方法要换成我们自定义的 `GetValue` 哦
    - `SetValue` 方法也要换成我们自定义的 `SetValue` 哦，这样绑定才可以生效
1. `OnValueChanged` 就是我们实际的变更通知，这里得到的 `oldValue` 和 `newValue` 就是你期望的值，而不是我面前面奇怪的绑定实例。

于是，绑定就这么在一个普通的类型和一个普通的 CLR 属性中生效了，而且还获得了变更通知。

#### 参考资料

本文没有任何参考资料，所有方法都是我（walterlv）的原创方法，因为真的找不到资料呀！不过在找资料的过程中发现了一些没解决的文档或帖子：

- [How to use CLR property as binding target?](https://social.msdn.microsoft.com/Forums/en-US/97e9f8e4-9eae-45ff-aac3-9f0c25865b14/how-to-use-clr-property-as-binding-target?forum=wpf)
- [CLR Object Binding In WPF](https://www.c-sharpcorner.com/uploadfile/anku123/clr-object-binding-in-wpf/)
- [wpf - MarkupExtension with binding parameters - Stack Overflow](https://stackoverflow.com/a/10328974/6233938)
- [c# - Binding to dependency and regular properties in WPF - Stack Overflow](https://stackoverflow.com/q/16287829/6233938)
- [c# - XAML bind to DependencyProperty instance held in a CLR property - Stack Overflow](https://stackoverflow.com/q/18246316/6233938)
- [Tore Senneseth's blog » Custom Markup Extension with bindable properties](http://blogs.profitbase.com/tsenn/?p=73)
- [Markup Extensions for XAML Overview - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/xaml-services/markup-extensions-for-xaml-overview)
- [Service Contexts Available to Type Converters and Markup Extensions - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/xaml-services/service-contexts-available-to-type-converters-and-markup-extensions)
