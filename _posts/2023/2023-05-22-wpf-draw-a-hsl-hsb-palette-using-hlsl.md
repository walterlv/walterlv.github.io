---
title: "WPF 像素着色器进阶：使用 HLSL 编写一个高性能的实时变化的 HSL/HSV/HSB 调色盘"
publishDate: 2023-05-22 22:43:37 +0800
date: 2023-05-25 16:33:06 +0800
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

### 版本一：初步实现

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

### 版本二：精简指令

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

### 版本三：带有完整功能的精简指令

既然可以把指令精简到如此程度，那么我们把前面删除的 `BackColor` 功能加回来能否继续保证在 64 指令数以内呢？

既然 GPT-4 那么强大，那么就劳烦一下它吧，经过反复询问以及我的调试下，HSL 调色盘和 HSV/HSB 调色盘的精简指令全功能版本就出来啦，代码如下，大家可复制参考。

至于全功能是哪写全功能呢？

1. 支持使用 HueInitialAngle 参数控制色相的旋转角度
2. 支持设置 HSL 中的 L（Lightness）或 HSV/HSB 中的 B（Brighness）
3. 支持 Gamma 校正（设置为 1.0 则不校正，如果希望用户看起来更自然一些，可以设置为 2.2）
4. 支持 OutsideColor 参数设置调色盘圆外的颜色，且支持设置半透明色

如下图是这四个参数的设置效果，其中圆外设置成了半透明黑色。

![全功能的 HSB 调色盘](/static/posts/2023-05-25-16-32-16.png)  
▲ 全功能的 HSB 调色盘

HSL 调色盘：

```csharp
sampler2D input : register(s0);

/// <summary>Hue Initial Angle</summary>
/// <type>Single</type>
/// <minValue>0</minValue>
/// <maxValue>360</maxValue>
/// <defaultValue>0</defaultValue>
float HueInitialAngle : register(C1);

/// <summary>Lightness</summary>
/// <type>Single</type>
/// <minValue>0</minValue>
/// <maxValue>1</maxValue>
/// <defaultValue>0.5</defaultValue>
float Lightness : register(C2);

/// <summary>Gamma Correction</summary>
/// <type>Single</type>
/// <minValue>1.0</minValue>
/// <maxValue>2.4</maxValue>
/// <defaultValue>1.0</defaultValue>
float Gamma : register(C3);

/// <summary>Background Color outside of the Circle</summary>
/// <type>Color</type>
/// <minValue>0,0,0,1</minValue>
/// <maxValue>1,1,1,1</maxValue>
/// <defaultValue>1,1,1,1</defaultValue>
float4 OutsideColor : register(C4);

float3 HUEtoRGB(float H)
{
    float R = abs(H * 6 - 3) - 1;
    float G = 2 - abs(H * 6 - 2);
    float B = 2 - abs(H * 6 - 4);
    return saturate(float3(R,G,B));
}

float3 HSLtoRGB(in float3 HSL)
{
    float3 RGB = HUEtoRGB(HSL.x);
    float C = (1 - abs(2 * HSL.z - 1)) * HSL.y;
    return (RGB - 0.5) * C + HSL.z;
}

float4 main(float2 uv : TEXCOORD) : COLOR
{
    float2 pos = uv * 2.0f - 1.0f;
    float dist = length(pos);
    dist = pow(dist, Gamma);

    float h = (atan2(pos.y, pos.x) / (2.0f * 3.1415926f) + 1.0f + HueInitialAngle / 360.0f) % 1.0f;
    float s = dist;
    float l = Lightness;
    float3 hsl = float3(h, s, l);
    float3 color = HSLtoRGB(hsl);
    float4 finalColor = float4(color, 1.0f);

    if(dist > 1.0f)
        finalColor = float4(OutsideColor.rgb, 1.0f) * OutsideColor.a + finalColor * (1 - OutsideColor.a);

    return finalColor;
}
```

HSV/HSB 调色盘：

```csharp
sampler2D input : register(s0);

/// <summary>Hue Initial Angle</summary>
/// <type>Single</type>
/// <minValue>0</minValue>
/// <maxValue>360</maxValue>
/// <defaultValue>0</defaultValue>
float HueInitialAngle : register(C0);

/// <summary>Brightness</summary>
/// <type>Single</type>
/// <minValue>0</minValue>
/// <maxValue>1</maxValue>
/// <defaultValue>1</defaultValue>
float Brightness : register(C1);

/// <summary>Gamma Correction</summary>
/// <type>Single</type>
/// <minValue>1.0</minValue>
/// <maxValue>2.4</maxValue>
/// <defaultValue>2.2</defaultValue>
float Gamma : register(C2);

/// <summary>Color outside of the Circle</summary>
/// <type>Color</type>
/// <minValue>0,0,0,1</minValue>
/// <maxValue>1,1,1,1</maxValue>
/// <defaultValue>1,1,1,1</defaultValue>
float4 OutsideColor : register(C3);

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
    dist = pow(dist, Gamma);

    float h = (atan2(pos.y, pos.x) / (2.0f * 3.1415926f) + HueInitialAngle / 360.0f) % 1.0f;
    float s = dist;
    float b = Brightness;
    float3 hsb = float3(h, s, b);
    float3 color = HSBToRGB(hsb);
    float4 finalColor = float4(color, 1.0f);

    if(dist > 1.0f)
        finalColor = float4(OutsideColor.rgb, 1.0f) * OutsideColor.a + finalColor * (1 - OutsideColor.a);

    return finalColor;
}
```

## 附：GPT-4 提示词

考虑到有些小伙伴可能对我的 GPT-4 提示词感兴趣，那么我就把我的询问过程贴出来。

![GPT-4 对 HLSL 代码精简指令数](/static/posts/2023-05-22-22-35-52.png)

![GPT-4 编写调色盘全功能版本](/static/posts/2023-05-25-16-19-27.png)

---

**参考资料**

- [HSL and HSV - Wikipedia](https://en.wikipedia.org/wiki/HSL_and_HSV)

