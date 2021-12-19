---
title: "使用 WPF 做一个可以逼真地照亮你桌面的高性能阳光"
date: 2021-08-05 17:20:04 +0800
tags: wpf dotnet
position: problem
coverImage: /static/posts/2021-08-05-16-51-03.png
permalink: /post/create-a-realistic-sunshine-on-your-desktop-using-wpf.html
---

本文想要做的，可不是随便弄一点阳光的半透明形状，然后简单地放到桌面上，**而是真真正正地要照亮桌面上的窗口元素**！并且，全程使用 GPU 加速，而且代码超简单。

---

<div id="toc"></div>

## 效果预览

先放上两张动图看看效果，GIF 比较大，如果博客里看不到可以点击下面的小标题下载下来看。

[阳光扫过云层](/static/posts/2021-08-05-sunshine-over-cloud.gif)：

![阳光扫过云层](/static/posts/2021-08-05-sunshine-over-cloud.gif)

[阳光扫过 Visual Studio](/static/posts/2021-08-05-sunshine-over-visual-studio.gif)：

![阳光扫过 Visual Studio](/static/posts/2021-08-05-sunshine-over-visual-studio.gif)

可以看到，阳光经过云层时，强烈的光芒与云层的光光部分叠加起来了，让人感觉云层的照亮部分十分刺眼。阳光经过 Visual Studio 的界面时，纯色部分可以看出阳光的外形，高饱和度部分在阳光的照耀下显得格外亮眼。

## 代码实现

实现本文效果的代码其实很少，只有以下几步：

1. 制作一个全透明窗口
2. 编写一个像素着色器
3. 画一个简单的阳光形状

不过在开始之前，我们先创建一个空白的 WPF 项目吧：

![创建一个空白的 WPF 窗口程序](/static/posts/2021-08-05-16-51-03.png)

### 第一步：制作一个全透明窗口

网上广为流传的 `AllowsTransparency="True"` 的方式就可以，不过我个人不喜欢，因为性能不好。我更推荐大家使用我另一篇博客里推荐的高性能透明窗口的实现方案：[WPF 制作高性能的透明背景异形窗口](/post/wpf-transparent-window-without-allows-transparency)

如果现在不想看的，我可以直接把 MainWindow.xaml.cs 的代码贴出来（放心，其他地方不需要写代码）：

```xml
<Window x:Class="Walterlv.DesktopSunshine.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        xmlns:local="clr-namespace:Walterlv.DesktopSunshine"
        mc:Ignorable="d" Title="Walterlv.DesktopSunshine" Width="240" Height="240"
        Background="Transparent" WindowStyle="None" ResizeMode="NoResize">
    <WindowChrome.WindowChrome>
        <WindowChrome GlassFrameThickness="-1" ResizeBorderThickness="0" CornerRadius="0" CaptionHeight="240" />
    </WindowChrome.WindowChrome>
    <Grid>
    </Grid>
</Window>
```

最重要的，是 `Background="Transparent"`、`WindowStyle="None"`、`ResizeMode="NoResize"` 和 `GlassFrameThickness="-1"` 这四个属性。

其他的代码，我只是在做一个普通的窗口而已。大小 240 是为了容纳一个太阳的大小。

### 第二步：编写一个像素着色器

想了解怎么写像素着色器的，可以阅读我的另一篇博客：[WPF 像素着色器入门：使用 Shazzam Shader Editor 编写 HLSL 像素着色器代码](/post/create-wpf-pixel-shader-effects-using-shazzam-shader-editor)。

需要在像素着色器里编写此代码（不想学像素着色器的可以忽略此代码直接往后看）：

```csharp
sampler2D  inputSampler : register(S0);
float Threshold : register(C0);

float4 main(float2 uv : TEXCOORD) : COLOR
{
    float4 color = tex2D(inputSampler, uv);
    float a = color.a;

    if(a < Threshold)
    {
   	    color.a  = 0;
    }
    else
    {
        color.a  = 1;
    }

    return color;
}
```

如果不想自己编写并编译像素着色器，可以直接下载我已经编译好的 .ps 文件：

- [BinaryAlphaEffect.ps](/static/attachments/BinaryAlphaEffect.ps)

下载下来的文件（或者你自己编译出来的文件）放到解决方案中的任意位置（本示例中放到了 Assets 文件夹中）：

![在解决方案中的位置](/static/posts/2021-08-05-17-00-45.png)

**重要：**接着，将 .ps 文件加入到编译。请双击项目（Walterlv.DesktopSunshine）以编辑其项目文件（.csproj）。需要增加的行我已经在下面高亮出来了。

```diff
    <Project Sdk="Microsoft.NET.Sdk">

      <PropertyGroup>
        <OutputType>WinExe</OutputType>
        <TargetFramework>net6.0-windows</TargetFramework>
        <Nullable>enable</Nullable>
        <UseWPF>true</UseWPF>
      </PropertyGroup>

++    <ItemGroup>
++      <Resource Include="Assets\**\*.ps" />
++    </ItemGroup>

    </Project>
```

然后，编写一个使用此 .ps 文件的 C# 类型。我取名为 BinaryAlphaEffect.cs。

```csharp
using System;
using System.Windows;
using System.Windows.Media;
using System.Windows.Media.Effects;

namespace Walterlv.DesktopSunshine
{
    public class BinaryAlphaEffect : ShaderEffect
    {
        public static readonly DependencyProperty InputProperty = RegisterPixelShaderSamplerProperty(
            "Input", typeof(BinaryAlphaEffect), 0);

        public static readonly DependencyProperty ThresholdProperty = DependencyProperty.Register(
            "Threshold", typeof(double), typeof(BinaryAlphaEffect),
            new UIPropertyMetadata(1.0d, PixelShaderConstantCallback(0)));

        public BinaryAlphaEffect()
        {
            PixelShader = new PixelShader
            {
                UriSource = new Uri("/Assets/BinaryAlphaEffect.ps", UriKind.Relative),
            };

            UpdateShaderValue(InputProperty);
            UpdateShaderValue(ThresholdProperty);
        }

        public Brush Input
        {
            get => (Brush)GetValue(InputProperty);
            set => SetValue(InputProperty, value);
        }

        public double Threshold
        {
            get => (double)GetValue(ThresholdProperty);
            set => SetValue(ThresholdProperty, value);
        }
    }
}
```

这个 `Threshold` 是个二值化的阈值，可用来调阳光效果。我把默认值设为了 1，这样阳光效果最强烈。（实际上其他值的效果惨不忍睹。因为这段代码我本来编写的目的不是在做阳光，只是中间不小心做出了阳光效果，觉得很有意思就教大家一下。）

## 第三步：画一个简单的阳光形状

我只画一个圆来表示阳光的形状（想用其他形状的，自己发挥创意）。于是在 MainWindow.xaml 里添加一点点代码：

```diff
        </WindowChrome.WindowChrome>
++      <Border>
++          <Ellipse Fill="White" Width="160" Height="160">
++              <UIElement.Effect>
++                  <BlurEffect Radius="40" />
++              </UIElement.Effect>
++          </Ellipse>
++      </Border>
    </Window>
```

这里，给圆加了一些模糊效果，这是必要的。

然后，把我们在第二步里写的像素着色器用上：

```diff
    <Border>
++      <UIElement.Effect>
++          <local:BinaryAlphaEffect />
++      </UIElement.Effect>
        <Ellipse Fill="White" Width="160" Height="160">
            <UIElement.Effect>
                <BlurEffect Radius="40" />
            </UIElement.Effect>
        </Ellipse>
    </Border>
```

那么至此，所有代码已经完成。

总结一下，我们写了这些代码：

1. 一个新创建的 WPF 项目模板（包含模板自带的 App.xaml App.xaml.cs MainWindow.xaml MainWindow.xaml.cs AssemblyInfo.cs）
1. 下载或编译的 BinaryAlphaEffect.ps 像素着色器文件，和用来使用它的 BinaryAlphaEffect.cs 文件
1. 使用 BinaryAlphaEffect 类的 MainWindow.xaml 中的几个 Border 和 Ellipse

是不是代码量非常少？接下来，就是见证奇迹的时刻。

## 效果与性能

[阳光扫过 Windows 11 自带壁纸](/static/posts/2021-08-05-sunshine-over-forest.gif)。在太阳附近，与太阳融为一体；在森林中，阳光被树叶遮挡；在水面，阳光跟随着波光闪耀；在岩石上，阳光把岩石照得通亮。

![阳光扫过云层](/static/posts/2021-08-05-sunshine-over-forest.gif)

你可以把这个阳光放到任何地方，就算是正在播放的视频前面也依然在每帧中都有实时效果。

最重要的是——它几乎不消耗性能！因为它在图形渲染管线的像素着色器部分运行，其所有代码都在 GPU 中并行执行，且每次执行仅需不到 10 条指令。你可以看到任务管理器中，它的 CPU 和 GPU 消耗都是 0。

![性能占用非常低](/static/posts/2021-08-05-17-19-52.png)


