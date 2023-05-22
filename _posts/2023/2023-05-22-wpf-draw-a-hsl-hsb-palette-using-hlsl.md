---
title: "WPF 像素着色器进阶：使用 HLSL 编写一个高性能的实时变化的 HSL/HSV/HSB 调色盘"
date: 2023-05-22 22:43:37 +0800
categories: wpf dotnet windows
position: problem
coverImage: /static/posts/2023-05-22-22-21-30.png
---

要在代码里画一个 HSL/HSV/HSB 调色盘非常容易，不过如果这个调色盘需要实时变化，那么频繁绘制需要在 CPU 上大量创建或者修改位图，性能不太好。本文将使用 HLSL 来完成这一任务。

---

<div id="toc"></div>

## HLSL 入门

如果你对 WPF 使用像素着色器还不太了解，那么可以阅读入门文章：

- [WPF 像素着色器入门：使用 Shazzam Shader Editor 编写 HLSL 像素着色器代码](/post/create-wpf-pixel-shader-effects-using-shazzam-shader-editor.html)

## HSL/HSV/HSB

为了让后面的代码容易看懂，我们需要先简单了解一下 HSL/HSV/HSB。

HSL：hue 色相, saturation 饱和度, lightness 亮度
HSV/HSB：hue 色相, saturation 饱和度, value/brighness 明度

这是两个不同但类似的，符合人眼感知的颜色表示方法，其中后两者只是名称不同，实际上是完全相同的意思。

关于 HSL 和 HSV/HSB 的更多资料，可以参考 [HSL and HSV - Wikipedia](https://en.wikipedia.org/wiki/HSL_and_HSV)

![HSL](/static/posts/2023-05-22-22-21-30.png)  
▲ HSL

![HSV](/static/posts/2023-05-22-22-21-41.png)  
▲ HSV

## HSL 和 HSV/HSB 的 HLSL 代码

由于 HSL 和 HSV/HSB 到 RGB 的转换是非常广泛被使用的，所以网上的代码非常丰富，我们只需要让 GPT-4 帮我们生成一个就可以了：

这是 HSL 调色盘的代码：

```csharp
sampler2D input : register(s0);

/// <summary>Background Color outside of the Circle</summary>
/// <type>Color</type>
/// <minValue>0,0,0,1</minValue>
/// <maxValue>1,1,1,1</maxValue>
/// <defaultValue>1,1,1,1</defaultValue>
float4 BackColor : register(C0);

/// <summary>Hue Initial Angle</summary>
/// <minValue>0</minValue>
/// <maxValue>360</maxValue>
/// <defaultValue>0</defaultValue>
float HueInitialAngle : register(C1);

/// <summary>Lightness</summary>
/// <minValue>0</minValue>
/// <maxValue>1</maxValue>
/// <defaultValue>0.5</defaultValue>
float Lightness : register(C2);

float3 HSLtoRGB(float H, float S, float L)
{
    float C = (1.0f - abs(2.0f * L - 1.0f)) * S;
    float X = C * (1.0f - abs(fmod(H / 60.0f, 2.0f) - 1.0f));
    float m = L - C / 2.0f;
    float3 RGB;

    if (0 <= H && H < 60)
        RGB = float3(C, X, 0);
    else if (60 <= H && H < 120)
        RGB = float3(X, C, 0);
    else if (120 <= H && H < 180)
        RGB = float3(0, C, X);
    else if (180 <= H && H < 240)
        RGB = float3(0, X, C);
    else if (240 <= H && H < 300)
        RGB = float3(X, 0, C);
    else
        RGB = float3(C, 0, X);

    return RGB + m;
}

float4 main(float2 uv : TEXCOORD) : COLOR
{
    float2 pos = uv * 2.0f - 1.0f;
    float dist = length(pos);

    if(dist > 1.0f)
        return BackColor;

    float h = atan2(pos.y, pos.x) * (180.0f / 3.1415926f) + HueInitialAngle;
    if(h < 0)
        h += 360;
    else if(h > 360)
        h -= 360;
    float s = dist;
    float l = Lightness;
    float3 color = HSLtoRGB(h, s, l);

    return float4(color, 1.0f);
}
```

这是 HSB 调色盘的代码：

```csharp
﻿sampler2D input : register(s0);

/// <summary>Background Color outside of the Circle</summary>
/// <type>Color</type>
/// <minValue>0,0,0,1</minValue>
/// <maxValue>1,1,1,1</maxValue>
/// <defaultValue>1,1,1,1</defaultValue>
float4 BackColor : register(C0);

/// <summary>Hue Initial Angle</summary>
/// <minValue>0</minValue>
/// <maxValue>360</maxValue>
/// <defaultValue>0</defaultValue>
float HueInitialAngle : register(C1);

/// <summary>Brightness</summary>
/// <minValue>0</minValue>
/// <maxValue>1</maxValue>
/// <defaultValue>1</defaultValue>
float Brightness : register(C2);

float3 HSBtoRGB(float H, float S, float B)
{
    float C = B * S;
    float X = C * (1.0f - abs(fmod(H / 60.0f, 2.0f) - 1.0f));
    float m = B - C;
    float3 RGB;

    if (0 <= H && H < 60)
        RGB = float3(C, X, 0);
    else if (60 <= H && H < 120)
        RGB = float3(X, C, 0);
    else if (120 <= H && H < 180)
        RGB = float3(0, C, X);
    else if (180 <= H && H < 240)
        RGB = float3(0, X, C);
    else if (240 <= H && H < 300)
        RGB = float3(X, 0, C);
    else
        RGB = float3(C, 0, X);

    return RGB + m;
}

float4 main(float2 uv : TEXCOORD) : COLOR
{
    float2 pos = uv * 2.0f - 1.0f;
    float dist = length(pos);

    if(dist > 1.0f)
        return BackColor;

    float h = atan2(pos.y, pos.x) * (180.0f / 3.1415926f) + HueInitialAngle;
    if (h < 0)
        h += 360;
    else if (h > 360)
        h -= 360;
    float s = dist;
    float b = Brightness;
    float3 color = HSBtoRGB(h, s, b);

    return float4(color, 1.0f);
}
```

这两个调色盘都支持三个参数：

1. 背景色，用于指定显示圆盘外面显示什么颜色
2. 色相旋转角度，用于按照你的需要将起始的色相转到对应的位置（右、上等）
3. 亮度或明度，当指定这个值时，整个调色盘的最大亮度或明度就被限制到了这个值

通常，1 和 2 直接在代码中设好就可以了，3 则通常是在界面中额外显示一个滑块了整体调节。

![HSL/HSV/HSB 调色](/static/posts/2023-05-22-22-43-27.png)

## 精简指令

需要注意的是，上述代码都是超过了 PS_2 的最大 64 条指令的，也就是说只能以 PS_3 作为目标框架。不过，PS_3 不支持部分显卡（例如 Windows 远程桌面 RDP 所虚拟的显卡）。所以，如果你希望上述像素着色器能够在这样的情况下工作，则需要放弃 PS_3 转而使用 PS_2，或者在不满足要求的情况下自己用其他方式进行软渲染。

那么，上述代码能将指令数优化到 64 以内吗？我们去问问 GPT-4。

被 GPT-4 精简后的代码如下，现在已经可以完全在 PS_2 的目标框架下完成编译并使用了。

```csharp
sampler2D input : register(s0);

/// <summary>Hue Initial Angle</summary>
/// <minValue>0</minValue>
/// <maxValue>360</maxValue>
/// <defaultValue>0</defaultValue>
float HueInitialAngle : register(C0);

/// <summary>Brightness</summary>
/// <minValue>0</minValue>
/// <maxValue>1</maxValue>
/// <defaultValue>1</defaultValue>
float Brightness : register(C1);

float3 HSBToRGB(float3 hsb)
{
    float4 K = float4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    float3 p = abs(frac(hsb.xxx + K.xyz) * 6.0 - K.www);
    return hsb.z * lerp(K.xxx, clamp(p - K.xxx, 0.0, 1.0), hsb.y);
}

float4 main(float2 uv : TEXCOORD) : COLOR
{
    float2 pos = uv * 2.0f - 1.0f;
    float dist = length(pos);

    float h = (atan2(pos.y, pos.x) / (2.0f * 3.1415926f) + HueInitialAngle / 360.0f) % 1.0f;
    float s = dist;
    float b = Brightness;
    float3 hsb = float3(h, s, b);
    float3 color = HSBToRGB(hsb);

    return float4(color, 1.0f);
}
```

考虑到有些小伙伴可能对我的 GPT-4 提示词感兴趣，那么我就把我的询问过程贴出来：

![GPT-4 对 HLSL 代码精简指令数](/static/posts/2023-05-22-22-35-52.png)

---

**参考资料**

- [HSL and HSV - Wikipedia](https://en.wikipedia.org/wiki/HSL_and_HSV)

