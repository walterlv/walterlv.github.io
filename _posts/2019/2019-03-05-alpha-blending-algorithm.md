---
title: "透明度叠加算法：如何计算半透明像素叠加到另一个像素上的实际可见像素值（附 WPF 和 HLSL 的实现）"
date: 2019-03-05 15:01:55 +0800
tags: algorithm dotnet wpf uwp
position: knowledge
coverImage: /static/posts/2019-03-05-14-30-00.png
---

本文介绍透明度叠加算法（Alpha Blending Algorithm），并用 C#/WPF 的代码，以及像素着色器的代码 HLSL 来实现它。

---

<div id="toc"></div>

## 算法

对于算法，我只是搬运工，可以随意搜索到。算法详情请查看：[Alpha compositing - Wikipedia](https://en.wikipedia.org/wiki/Alpha_compositing)。

对于完全不透明的背景和带有透明度的前景，合并算法为：

```
float r = (foreground.r * alpha) + (background.r * (1.0 - alpha));
```

这是红色。然后绿色 `g` 和蓝色 `b` 通道进行一样的计算。最终合成图像的透明通道始终设置为 1。

## 在 C# 代码中实现

多数 UI 框架对于颜色值的处理都是用一个 `byte` 赛表单个通道的一个像素。于是计算会采用 0xff 即 255。

```csharp
for (int i = 0; i + 4 < length; i = i + 4)
{
    var backB = background[i];
    var backG = background[i + 1];
    var backR = background[i + 2];
    var foreB = foreground[i];
    var foreG = foreground[i + 1];
    var foreR = foreground[i + 2];
    double alpha = foreground[i + 3];

    blue = 0;

    output[i] = (foreB * alpha) + (backB * (1.0 - alpha));
    output[i + 1] = (foreG * alpha) + (backG * (1.0 - alpha));
    output[i + 2] = (foreR * alpha) + (backR * (1.0 - alpha));
    output[i + 3] = 1.0;
}
```

这段代码当然是跑不起来的，因为是下面两篇博客的魔改代码。你需要阅读以下两篇博客了解如何在 WPF 中按像素修改图像，然后应用上面的透明度叠加代码。

- [WPF 修改图片颜色](https://lindexi.gitee.io/post/WPF-%E4%BF%AE%E6%94%B9%E5%9B%BE%E7%89%87%E9%A2%9C%E8%89%B2.html?nsukey=3TnZtVDUa%2BAnFMJeDMHwZ4cjmTsA4717d6Ze0gKK9BGnAOIN6KFqtb9%2BS67a2fBbYovvCCLci%2FLCroDOBgYN1jPFIlS1r2yxW8qNZV3SWEQntwVj5PXycG0qkrfmXgcibPr8OUsqrNSzzHTjWRam0%2FgjmHiOCIpqccEk3UEcjlNmuv8N9Jn6klOC8GZ%2FeizvB0JAy9o824%2BxM%2Bzf%2BH3Egw%3D%3D)
- [WPF 通过位处理合并图片](https://lindexi.gitee.io/post/WPF-%E9%80%9A%E8%BF%87%E4%BD%8D%E5%A4%84%E7%90%86%E5%90%88%E5%B9%B6%E5%9B%BE%E7%89%87.html?nsukey=ak1Q2mctZhk%2BL1VqK8fq6O05g7K4kQpAlgOWzv8UkoBwH6YHbJMncmmUMCEFCoJH1nuxZuIoTRZ0UB89uHOAzWZxs3MbPH1Lnjyp527FWdN%2FOJaP93QxT0VxIKz5TZYrvLboSjnvEH27Bj9i2WXP556mZBC4WOAlc93mfYOR3aJKBe%2F78uEVBbVMsyWrdGIS8sFxbXebypVQFibs24lzXw%3D%3D)

话说，一般 UI 框架都自带有透明度叠加，为什么还要自己写一份呢？

当然是因为某些场景下我们无法使用到 UI 框架的透明度叠加特性的时候。例如使用 HLSL 编写像素着色器的一个实现。

下面使用像素着色器的实现是我曾经写过的一个特效的一个小部分，我把透明度叠加的部分单独摘取出来。

## 在像素着色器中实现

以下是 HLSL 代码的实现。Background 是从采样寄存器 0 取到的颜色采样，Foreground 是从采样寄存器 1 取到的颜色采样。

这里的计算中，背景是不带透明度的，而前景是带有透明度的。

```csharp
/// <description>透明度叠加效果。</description>

sampler2D Background : register(s0);
sampler2D Foreground : register(s1);

float4 main(float2 uv : TEXCOORD) : COlOR
{
    float4 background = tex2D(Background, uv);
    float4 foreground = tex2D(Foreground, uv);
    float alpha = foreground.a;

    float r = (foreground.r * alpha) + (background.r * (1.0 - alpha));
    float g = (foreground.g * alpha) + (background.g * (1.0 - alpha));
    float b = (foreground.b * alpha) + (background.b * (1.0 - alpha));
    float a = 1.0;
    
    return float4(r, g, b, a);
}
```

![叠加了一个带有透明度的图片](/static/posts/2019-03-05-14-30-00.png)

如果要测试的图片都是不带透明度的，那么可以通过自己设一个透明度来模拟，传入透明度值 Alpha。

```csharp
/// <description>透明度叠加效果。</description>

/// <type>Double</type>
/// <summary>采样 2 的叠加透明度。</summary>
/// <minValue>0.0</minValue>
/// <maxValue>1.0</maxValue>
/// <defaultValue>0.75</defaultValue>
float Alpha : register(C0);

sampler2D Background : register(s0);
sampler2D Foreground : register(s1);

float4 main(float2 uv : TEXCOORD) : COlOR
{
    float4 background = tex2D(Background, uv);
    float4 foreground = tex2D(Foreground, uv);
    float alpha = Alpha;

    float r = (foreground.r * alpha) + (background.r * (1.0 - alpha));
    float g = (foreground.g * alpha) + (background.g * (1.0 - alpha));
    float b = (foreground.b * alpha) + (background.b * (1.0 - alpha));
    float a = 1.0;
    
    return float4(r, g, b, a);
}
```

![为第二张采样设定透明度](/static/posts/2019-03-05-alpha-blending.gif)

---

**参考资料**

- [Alpha compositing - Wikipedia](https://en.wikipedia.org/wiki/Alpha_compositing)
- [algorithm - Manually alpha blending an RGBA pixel with an RGB pixel - Stack Overflow](https://stackoverflow.com/a/9014763/6233938)

