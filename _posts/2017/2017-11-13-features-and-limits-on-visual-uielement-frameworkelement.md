---
title: "Visual->UIElement->FrameworkElement，带来更多功能的同时也带来了更多的限制"
publishDate: 2017-11-13 23:55:58 +0800
date: 2018-12-14 09:54:00 +0800
categories: wpf uwp xaml
---

在 WPF 或 UWP 中，我们平时开发所遇到的那些 UI 控件或组件，都直接或间接继承自 `Framework`。例如：`Grid`、`StackPanel`、`Canvas`、`Border`、`Image`、`Button`、`Slider`。我们总会自然而然地认为这些控件都是有大小的，它们会在合适的位置显示自己，通常不会超出去。但是，`FrameworkElement` 甚至是 `Control` 用得久了，都开始忘记 `Visual`、`UIElement` 带给我们的那些自由。

阅读本文将了解我们熟知的那些功能以及限制的由来，让我们站在限制之外再来审视 WPF 的可视化树，再来看清 WPF 各种控件属性的本质。

---

<p id="toc"></p>

### 宽度和高度

如果问 `Width`/`Height` 属性来自谁，只要在 WPF 和 UWP 里混了一点儿时间都会知道——`FrameworkElement`。随着 `FrameworkElement` 的宽高属性一起带来的还有 `ActualWidth`、`ActualHeight`、`MinWidth`、`MinHeight`、`MaxWidth`、`MaxHeight`。正是这些属性的存在，让我们可以直观地给元素指定尺寸——想设置多少就设置多少。

然而……当你把宽或高设置得比父容器允许的最大宽高还要大的时候呢？我们会发现，控件被“切掉”了。

![](/static/posts/2017-11-13-23-13-39.png)  
▲ 被切掉的椭圆

然而，**因布局被“切掉”这一特性也是来自于 `FrameworkElement`**！

`UIElement` 布局时即便空间不够也不会故意去将超出边界的部分切掉，这一点从其源码就能得到证明：

```csharp
/// <summary>
/// This method supplies an additional (to the <see cref="Clip"/> property) clip geometry
/// that is used to intersect Clip in case if <see cref="ClipToBounds"/> property is set to "true".
/// Typically, this is a size of layout space given to the UIElement.
/// </summary>
/// <returns>Geometry to use as additional clip if ClipToBounds=true</returns>
protected virtual Geometry GetLayoutClip(Size layoutSlotSize)
{
    if(ClipToBounds)
    {
        RectangleGeometry rect = new RectangleGeometry(new Rect(RenderSize));
        rect.Freeze();
        return rect;
    }
    else
        return null;
}
```

只会在 `ClipToBounds` 设置为 `true` 的时候进行矩形切割。

然而 `FrameworkElement` 的切掉逻辑就复杂多了，鉴于有上百行，就只贴出链接 [FrameworkElement.GetLayoutClip](http://referencesource.microsoft.com/#PresentationFramework/src/Framework/System/Windows/FrameworkElement.cs,4400104dde3195fa)。其处理了各种布局、变换过程中的情况。

由于 `FrameworkElement` 的出现是为了让我们编程中像对待一个有固定尺寸的物体一样，所以也在切除上模拟了这样的空间有限的效果。

如果希望不被切掉，有两种方法修正：

1. 确保布局的时候所需尺寸不大于可用尺寸（一点也不能大于，就算是 `double` 精度问题导致的细微偏大都不行）
   - `MeasureOverride` 返回的尺寸不大于参数传入的尺寸
   - `ArrangeOverride` 返回的尺寸不大于参数传入的尺寸
1. 重写 `GetLayoutClip` 方法，并返回 null（或者写成 `UIElement` 那样）

### 布局系统

提及 `MeasureOverride`、`ArrangeOverride`，大家都会认为这是 WPF 布局系统给我们提供的两个可供重写的方法。然而，这两个方法其实也是 `FrameworkElement` 才提供的。

真正布局的方法是 `Measure` 和 `Arrange`，而可供重写的方法是 `MeasureCore`、`ArrangeCore`。这两组方法均来自于 `UIElement`，而布局系统其实是 `UIElement` 引入的。

那么 `FrameworkElement` 做了什么呢？它密封了 `MeasureCore`、`ArrangeCore` 这两个布局的重写方法，以便能够处理 `Width`、`Height`、`MinWidth`、`MinHeight`、`MaxWidth`、`MaxHeight`、`Margin` 这些属性对布局的影响。

你觉得 `Width`、`Height` 属性是元素的最终宽高吗？我们在 [宽度和高度](#%E5%AE%BD%E5%BA%A6%E5%92%8C%E9%AB%98%E5%BA%A6) 一节中已经说了不是，前面一段也说了不是——**它们真的只是布局属性**！然而，这真的很容易形成误解！`Width``Height` 属性其实和 `MinWidth``MinHeight`、`MaxWidth``MaxHeight` 是完全一样的用途，只是在布局过程中为计算最终尺寸提供的布局限制而已。只不过 `MinWidth``MinHeight`、`MaxWidth``MaxHeight` 用大于和小于进行尺寸的限制，而 `Width``Height` 用等于进行尺寸的限制。最终的尺寸依然是 `ActualWidth``ActualHeight`，而这个值跟 `RenderSize` 其实是一个意思，因为内部获取的就是 `RenderSize`。

值得注意的是，`ActualWidth``ActualHeight` 与 `RenderSize` 一样，是布局结束后才会更新的，开发中需要如果修改了属性立即获取这些值其实必然是旧的，拿这些值进行计算会造成错误的尺寸数据。

顺便吐槽一下：*其实微软是喜欢用 `Core` 来作为子类重写方法的后缀的，比如 `Freezable`、`EasingFunction` 都是用 `Core` 后缀来处理重写。`Override` 后缀纯属是因为 `UIElement` 把这个名字用了而已。*

### 屏幕交互

`UIElement` 中存在着布局计算，`FrameworkElement` 中存在着带限制的布局计算，这很容易让人以为屏幕相关的坐标计算会存在于 `UIElement` 或者 `FrameworkElement` 中。

然而其实 `UIElement` 或者 `FrameworkElement` 只涉及到控件之间的坐标计算（`TranslatePoint`），真正涉及到屏幕坐标的转换是位于 `Visual` 中的，典型的是这几个：

- `TransformToAncestor`
- `TransformToDescendant`
- `TransformToVisual`
- `PointFromScreen`
- `PointToScreen`

所以其实如果希望做出非常轻量级的高性能 UI，继承自 `Visual` 也是一个大胆的选择。*当然，真正遇到瓶颈的时候，继承自 `Visual` 也解决不了多少问题。*

### 样式和模板

`FrameworkElement` 开始有了样式（`Style`），`Control` 开始有了模板（`Template`）。而模板极大地方便了样式定制的同时，也造成了强大的性能开销，因为本来的一个 `Visual` 瞬间变成了几个、几十个。一般情况下这根本不会是性能瓶颈，然而当这种控件会一次性产生几十个甚至数百个（例如表格）的时候，这种瓶颈就会非常明显。

### 总结容易出现理解偏差的几个点

1. `Width` 和 `Height` 属性其实只是为布局过程中的计算进行限制而已，跟 `MinWidth`、`MinHeight`、`MaxWidth`、`MaxHeight` 没有区别，并不直接决定实际尺寸。
1. 如果发现元素布局中被切掉了，这并不是不可避免的问题；因为切掉是 `FrameworkElement` 为我们引入的特性，不喜欢可以随时关掉。
1. 微软对于子类重写核心逻辑的方法喜欢使用 `Core` 后缀，布局中用了 `Override` 只是因为名字被占用了。
1. `Visual` 就可以计算与屏幕坐标之间的转换。
1. 模板（`Template`）会额外产生很多个 `Visual`，有可能会成为性能瓶颈。

---

#### 参考资料
- [WPF Architecture - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/wpf/advanced/wpf-architecture?wt.mc_id=MVP)
