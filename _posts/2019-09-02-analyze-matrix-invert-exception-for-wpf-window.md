---
title: "WPF 不要给 Window 类设置变换矩阵（分析篇）：System.InvalidOperationException: 转换不可逆。"
date: 2019-09-02 11:54:06 +0800
categories: wpf dotnet csharp
position: problem
---

最近总是收到一个异常 “`System.InvalidOperationException: 转换不可逆。`”，然而看其堆栈，一点点自己写的代码都没有。到底哪里除了问题呢？

虽然异常堆栈信息里面没有自己编写的代码，但是我们还是找到了问题的原因和解决方法。

---

<div id="toc"></div>

## 异常堆栈

这就是抓到的此问题的异常堆栈：

```csharp
System.InvalidOperationException: 转换不可逆。
   在 System.Windows.Media.Matrix.Invert()
   在 MS.Internal.PointUtil.TryApplyVisualTransform(Point point, Visual v, Boolean inverse, Boolean throwOnError, Boolean& success)
   在 MS.Internal.PointUtil.TryClientToRoot(Point point, PresentationSource presentationSource, Boolean throwOnError, Boolean& success)
   在 System.Windows.Input.MouseDevice.LocalHitTest(Boolean clientUnits, Point pt, PresentationSource inputSource, IInputElement& enabledHit, IInputElement& originalHit)
   在 System.Windows.Input.MouseDevice.GlobalHitTest(Boolean clientUnits, Point pt, PresentationSource inputSource, IInputElement& enabledHit, IInputElement& originalHit)
   在 System.Windows.Input.StylusWisp.WispStylusDevice.FindTarget(PresentationSource inputSource, Point position)
   在 System.Windows.Input.StylusWisp.WispLogic.PreNotifyInput(Object sender, NotifyInputEventArgs e)
   在 System.Windows.Input.InputManager.ProcessStagingArea()
   在 System.Windows.Input.InputManager.ProcessInput(InputEventArgs input)
   在 System.Windows.Input.StylusWisp.WispLogic.InputManagerProcessInput(Object oInput)
   在 System.Windows.Threading.ExceptionWrapper.InternalRealCall(Delegate callback, Object args, Int32 numArgs)
   在 System.Windows.Threading.ExceptionWrapper.TryCatchWhen(Object source, Delegate callback, Object args, Int32 numArgs, Delegate catchHandler)
```

可以看到，我们的堆栈结束点是 `ExceptionWrapper.TryCatchWhen` 可以得知此异常是通过 `Dispatcher.UnhandledException` 来捕获的。也就是说，此异常直接通过 Windows 消息被我们间接触发，而不是直接通过我们编写的代码触发。而最顶端是对矩阵求逆，而此异常是试图对一个不可逆的矩阵求逆。

## 分析过程

如果你不想看分析过程，可以直接移步至本文的最后一节看原因和解决方案。

### 源代码

因为 .NET Framework 版本的 WPF 是开源的，.NET Core 版本的 WPF 目前还处于按揭开源的状态，所以我们看 .NET Framework 版本的代码来分析原因。

我按照调用堆栈从顶到底的顺序，将前面三帧的代码贴到下面。

#### `PointUtil.TryApplyVisualTransform`

```csharp
public static Point TryApplyVisualTransform(Point point, Visual v, bool inverse, bool throwOnError, out bool success)
{
    success = true;

    if(v != null)
    {
        Matrix m = GetVisualTransform(v);

        if (inverse)
        {
            if(throwOnError || m.HasInverse)
            {
                m.Invert();
            }
            else
            {
                success = false;
                return new Point(0,0);
            }
        }

        point = m.Transform(point);
    }

    return point;
}
```

#### `PointUtil.TryClientToRoot`

```csharp
[SecurityCritical,SecurityTreatAsSafe]
public static Point TryClientToRoot(Point point, PresentationSource presentationSource, bool throwOnError, out bool success)
{
    if (throwOnError || (presentationSource != null && presentationSource.CompositionTarget != null && !presentationSource.CompositionTarget.IsDisposed))
    {
        point = presentationSource.CompositionTarget.TransformFromDevice.Transform(point);
        point = TryApplyVisualTransform(point, presentationSource.RootVisual, true, throwOnError, out success);
    }
    else
    {
        success = false;
        return new Point(0,0);
    }

    return point;
}
```

你可能会说，在调用堆栈上面看不到 `PointUtil.ClientToRoot` 方法。但其实如果我们看一看 `MouseDevice.LocalHitTest` 的代码，会发现其实调用的是 `PointUtil.ClientToRoot` 方法。在调用堆栈上面看不到它是因为方法足够简单，被内联了。

```csharp
[SecurityCritical,SecurityTreatAsSafe]
public static Point ClientToRoot(Point point, PresentationSource presentationSource)
{
    bool success = true;
    return TryClientToRoot(point, presentationSource, true, out success);
}
```

### 求逆的矩阵

下面我们一步一步分析异常的原因。

我们先看看是什么代码在做矩阵求逆。下面截图中的方法是反编译的，就是上面我们在源代码中列出的 `TryApplyVisualTransform` 方法。

![矩阵求逆的调用](/static/posts/2019-09-02-09-51-48.png)

先获取了传入 `Visual` 对象的变换矩阵，然后根据参数 `inverse` 来对其求逆。如果矩阵可以求逆，即 `HasInverse` 属性返回 `true`，那么代码可以继续执行下去而不会出现异常。但如果 `HasInverse` 返回 `false`，则根据 `throwOnError` 来决定是否抛出异常，在需要抛出异常的情况下会真实求逆，也就是上面截图中我们看到的异常发生处的代码。

那么接下来我们需要验证三点：

1. 这个 `Visual` 是哪里来的；
1. 这个 `Visual` 的变换矩阵什么情况下不可求逆；
1. `throwOnError` 确定传入的是 `true` 吗。

于是我们继续往上层调用代码中查看。

![应用变换的调用 1](/static/posts/2019-09-02-10-00-12.png)

![应用变换的调用 2](/static/posts/2019-09-02-10-01-40.png)

可以很快验证上面需要验证的两个点：

1. `throwOnError` 传入的是 `true`；
2. `Visual` 是 `PresentationSource` 的 `RootVisual`。

而 `PresentationSource` 的 `RootVisual` 是什么呢？`PresentationSource` 是承载 WPF 可视化树的一个对象，对于窗口 `Window`，是通过 `HwndSource`（`PresentationSource` 的子类）承载的；对于跨线程 WPF UI，可以通过自定义的 `PresentationSource` 子类来完成。这部分可以参考我之前的一些博客：

- [WPF 同一窗口内的多线程 UI（VisualTarget）](/post/multi-thread-ui-using-visualtarget-in-wpf.html)
- [WPF 同一窗口内的多线程/多进程 UI（使用 SetParent 嵌入另一个窗口）](/post/embed-win32-window-using-csharp.html)
- [WPF 多线程 UI：设计一个异步加载 UI 的容器](/post/design-an-async-loading-view.html)
- [WPF 获取元素（Visual）相对于屏幕设备的缩放比例，可用于清晰显示图片](/post/get-wpf-visual-scaling-ratio-to-device.html)

不管怎么说，这个指的就是 WPF 可视化树的根：

- 如果你使用 `Window` 来显示 WPF 窗口，那么根就是 `Window` 类；
- 如果你是用 `Popup` 来承载一个弹出框，那么根就是 `PopupRoot` 类；
- 如果你使用了一些跨线程/跨进程 UI 的技术，那么根就是自己写的可视化树根元素。

对于绝大多数 WPF 开发者来说，只会碰到前面第一种情况，也就是仅仅有 `Window` 作为可视化树的根的情况。一般人很难直接给 `PopupRoot` 设置变换矩阵，一般 WPF 程序的代码也很少做跨线程或跨进程 UI。

于是我们几乎可以肯定，是有某处的代码让 `Window` 的变换矩阵不可逆了。

### 矩阵求逆

什么样的矩阵是不可逆的？

#### 异常代码

发生异常的代码是 WPF 中 `Matrix.Invert` 方法，其发生异常的代码如下：

![Matrix.Invert](/static/posts/2019-09-02-10-15-07.png)

首先判断矩阵的行列式 `Determinant` 是否为 `0`，如果为 `0` 则抛出矩阵不可逆的异常。

![Matrix.Determinant](/static/posts/2019-09-02-10-15-14.png)

#### 行列式

WPF 的 2D 变换矩阵 $$M$$ 是一个 $$3\times{3}$$ 的矩阵：

$$
\begin{bmatrix}
M11 & M12 & 0 \\
M21 & M22 & 0 \\
OffsetX & OffsetY & 1
\end{bmatrix}
$$

其行列式 $$det(M)$$ 是一个标量：

$$
\left | A \right | =
\begin{vmatrix}
M11 & M12 & 0 \\
M21 & M22 & 0 \\
OffsetX & OffsetY & 1
\end{vmatrix}
= M11 \times M22 - M12 \times M21
$$

因为矩阵求逆的时候，行列式的值会作为分母，于是会无法计算，所以行列式的值为 0 时，矩阵不可逆。

前面我们计算 WPF 的 2D 变换矩阵的行列式的值为 $$M11 \times M22 - M12 \times M21$$，因此，只要使这个式子的值为 0 即可。

那么 WPF 的 2D 变换的时候，如何使此值为 0 呢？

- 平移？平移只会修改 $$OffsetX$$ 和 $$OffsetY$$，因此对结果没有影响
- 缩放？缩放会将原矩阵点乘缩放矩阵
- 旋转？旋转会将旋转矩阵点乘旋转矩阵

其中，原矩阵在我们的场景下就是恒等的矩阵，即 `Matrix.Identity`：

$$
\begin{bmatrix}
1 & 0 & 0 \\
0 & 1 & 0 \\
0 & 0 & 1
\end{bmatrix}
$$

接下来缩放和旋转我们都不考虑变换中心的问题，因为变换中心的问题都可以等价为先进行缩放和旋转后，再单纯进行平移。由于平移对行列式的值没有影响，于是我们忽略。

#### 缩放矩阵

缩放矩阵。如果水平和垂直分量分别缩放 $$ScaleX$$ 和 $$ScaleY$$ 倍，则缩放矩阵为：

$$
\begin{bmatrix}
ScaleX & 0 & 0 \\
0 & ScaleY & 0 \\
0 & 0 & 1
\end{bmatrix}
$$

原矩阵点乘缩放矩阵结果为：

$$
\begin{bmatrix}
1 & 0 & 0 \\
0 & 1 & 0 \\
0 & 0 & 1
\end{bmatrix}
\cdot \begin{bmatrix}
ScaleX & 0 & 0 \\
0 & ScaleY & 0 \\
0 & 0 & 1
\end{bmatrix}
= \begin{bmatrix}
ScaleX & 0 & 0 \\
0 & ScaleY & 0 \\
0 & 0 & 1
\end{bmatrix}
$$

于是，只要 $$ScaleX$$ 和 $$ScaleY$$ 任何一个为 0 就可以导致新矩阵的行列式必定为 0。

#### 旋转矩阵

旋转矩阵。假设用户设置的旋转角度为 `angle`，那么换算成弧度为 `angle * (Math.PI/180.0)`，我们将弧度记为 $$\alpha$$，那么旋转矩阵为：

$$
\begin{bmatrix}
\cos{\alpha} & \sin{\alpha} & 0 \\
-\sin{\alpha} & \cos{\alpha} & 0 \\
0 & 0 & 1
\end{bmatrix}
$$

旋转矩阵点乘原矩阵的结果为：

$$
\begin{bmatrix}
\cos{\alpha} & \sin{\alpha} & 0 \\
-\sin{\alpha} & \cos{\alpha} & 0 \\
0 & 0 & 1
\end{bmatrix}
\cdot 
\begin{bmatrix}
1 & 0 & 0 \\
0 & 1 & 0 \\
0 & 0 & 1
\end{bmatrix}
= \begin{bmatrix}
\cos{\alpha} & \sin{\alpha} & 0 \\
-\sin{\alpha} & \cos{\alpha} & 0 \\
0 & 0 & 1
\end{bmatrix}
$$

对此矩阵的行列式求值：

$$\cos^{2}{\alpha} + \sin^{2}{\alpha} = 1$$

也就是说其行列式的值恒等于 1，因此其矩阵必然可求逆。

#### WPF 2D 变换矩阵求逆小结

对于 WPF 的 2D 变换矩阵：

1. 平移和旋转不可能导致矩阵不可逆；
1. 缩放，只要水平和垂直方向的任何一个分量缩放量为 0，矩阵就会不可逆。

### 寻找问题代码

现在，我们寻找问题的方向已经非常明确了：

- **找到设置了 `ScaleTransform` 的 `Window`，检查其是否给 `ScaleX` 或者 `ScaleY` 属性赋值为了 `0`。**

然而，真正写一个 demo 程序来验证这个问题的时候，就发现没有这么简单。因为：

![不能给 Window 设置变换矩阵](/static/posts/2019-09-02-11-40-39.png)

我们发现，不止是 `ScaleX` 和 `ScaleY` 属性不能设为 `0`，实际上设成 `0.5` 或者其他值也是不行的。

唯一合理值是 `1`。

那么为什么依然有异常呢？难道是 `ScaleTransform` 的值一开始正常，然后被修改？

编写 demo 验证，果然如此。而只有变换到 `0` 才会真的引发本文一开始我们提到的异常。一般会开始设为 `1` 而后设为 `0` 的代码通常是在做动画。

一定是有代码正在为窗口的 `ScaleTransform` 做动画。

结果全代码仓库搜索 `ScaleTransform` 真的找到了问题代码。

```xml
<Window x:Name="WalterlvDoubiWindow"
        x:Class="Walterlv.Exceptions.Unknown.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        mc:Ignorable="d"
        Title="MainWindow" Height="450" Width="800">
    <Window.RenderTransform>
        <ScaleTransform ScaleX="1" ScaleY="1" />
    </Window.RenderTransform>
    <Window.Resources>
        <Storyboard x:Key="Storyboard.Load">
            <DoubleAnimation Storyboard.TargetName="WalterlvDoubiWindow"
                             Storyboard.TargetProperty="(UIElement.RenderTransform).(ScaleTransform.ScaleX)"
                             From="0" To="1" />
            <DoubleAnimation Storyboard.TargetName="WalterlvDoubiWindow"
                             Storyboard.TargetProperty="(UIElement.RenderTransform).(ScaleTransform.ScaleY)"
                             From="0" To="1" />
        </Storyboard>
    </Window.Resources>
    <Grid>
        <!-- 省略的代码 -->
    </Grid>
</Window>
```

不过，这段代码并不会导致每次都出现异常，而是在非常多次尝试中偶尔能出现一次异常。

## 原因和解决方案

### 原因

1. `Window` 类是不可以设置 `RenderTransform` 属性的，但允许设置恒等（`Matrix.Identity`）的变换；
1. 如果让 `Window` 类缩放分量设置为 `0`，就会出现矩阵不可逆异常。

### 解决方案

不要给 `Window` 类设置变换，如果要做，请给 `Window` 内部的子元素设置。比如上面的例子中，我们给 `Grid` 设置就没有问题（而且可以做到类似的效果。
