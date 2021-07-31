---
title: "路径标记语法（Path Markup Syntax）完全教程"
publishDate: 2021-07-29 17:31:08 +0800
date: 2021-07-30 08:50:07 +0800
categories: wpf dotnet
position: knowledge
---

无论是 WPF、UWP 还是 Xamarin、MAUI、WinUI，都有可以绘制任意形状的 `Geometry` 类型，它支持一种路径标记语法，可以拟合各种形状。同时，SVG 格式使用的也是完全相同的路径语法，你用文本编辑器打开一个 SVG 格式时也会看到这样的字符串。

你只需要阅读本文，即可从零开始了解并最终学会路径标记语法。

---

<div id="toc"></div>

## 示例

一开始，我们用一张 SVG 图来看看一个典型的路径字符串是什么样子的：

[![SVG 图](/static/posts/2021-07-29-svg-image.svg)](/static/posts/2021-07-29-svg-image.svg)

你可以点击上面这张图以单独打开它，然后查看网页源代码来观察它的字符串内容。我这里也贴一份：

```xml
<?xml version="1.0" encoding="UTF-8" standalone="no"?><!DOCTYPE svg PUBLIC "-//W3C//DTD SVG 1.1//EN" "http://www.w3.org/Graphics/SVG/1.1/DTD/svg11.dtd">
<svg width="100%" height="100%" viewBox="0 0 20 20" version="1.1"
    xmlns="http://www.w3.org/2000/svg"
    xmlns:xlink="http://www.w3.org/1999/xlink" xml:space="preserve"
    xmlns:serif="http://www.serif.com/" style="fill-rule:evenodd;clip-rule:evenodd;stroke-linejoin:round;stroke-miterlimit:2;">
    <g id="控件">
        <g id="ic-备课端-主窗口-工具栏-文字" serif:id="ic/备课端/主窗口/工具栏/文字">
            <g>
                <rect id="bounds" x="0" y="0" width="20" height="20" style="fill:#f00;fill-opacity:0;"/>
                <path id="形状结合" d="M17,11c-1.342,-0 -3.872,1.385 -4.872,2.385c0.958,1.151 1.381,2.186 1.872,3.615l3,-0l0,-6Zm-5,6c-1.568,-3.869 -4.674,-6 -9,-6l0,6l9,-0Zm-9,-8c4,0 6,1 8,3c2,-2 4,-3 6,-3l0,-5l0.206,0c0.439,0 0.794,0.366 0.794,0.818l-0,12.364c-0.003,0.45 -0.356,0.814 -0.794,0.818l-14.412,0c-0.439,-0 -0.794,-0.366 -0.794,-0.818l-0,-12.364c0.003,-0.45 0.356,-0.814 0.794,-0.818l14.206,-0l0,1l-14,-0l0,4Zm10,-1c-0.663,-0 -1,-0.318 -1,-1c0,-0.682 0.337,-1 1,-1c0.663,-0 1,0.318 1,1c0,0.682 -0.337,1 -1,1Z" style="fill:#666;fill-opacity:0.8;fill-rule:nonzero;"/>
            </g>
        </g>
    </g>
</svg>
```

这里，`path/@d` 里的，就是我们即将学习的路径标记字符串。

XAML 系的路径标记语法与之只有一点点不同。

## 名称

在 SVG 的[解释文档](https://www.w3.org/TR/SVG/paths.html)中，对此语法的称呼为“SVG Path Syntax”（SVG 路径语法）。在 XAML 系语言中，称其为“Path Markup Syntax”（路径标记语法），官方也称其为“Mini-Language”。

由于 SVG 和 XAML 的路径语法几乎一样，所以学会本文可以直接学会两者的语法。

## 语法（Syntax）

路径标记语法从前往后写下来，遵循“命令-参数-命令-参数-命令-参数-……”这样的要求。让我们再来一个更简单的例子：

```xml
M 10,100 C 10,300 300,-200 300,100
```

把解释放进这个字符串的话，是这样：`M（命令）10,100（点坐标） C（命令）10,300 300,-200 300,100（三个点坐标）`。

在 SVG 路径语法中，一共有如下命令可以使用：

`M` `m` `L` `l` `H` `h` `V` `v` `C` `c` `Q` `q` `S` `s` `T` `t` `A` `a` `Z` `z`

额外的，XAML 系的路径标记语法还有一个 `F`。

看起来很多，但实际上我们可以做一个分类，这样理解起来会更容易一些：

1. 起点
    - `M` `m`
1. 直线
    - `L` `l`、`H` `h`、`V` `v`
1. 贝塞尔曲线
    - `C` `c`、`Q` `q`、`S` `s`、`T` `t`
1. 椭圆弧
    - `A` `a`
1. 封闭
    - `Z` `z`

先来说说一些共性的知识：

1. 一个路径可以由多段组成，用 `M` `m` 来指定一个新段的开始
1. 大写字母后面跟的参数中，点坐标是绝对坐标；小写字母后面跟的参数中，点坐标是相对坐标
1. 如果连续几段都是相同的命令，那么后续可以只写参数而省略命令
1. 字符串中间的空格 ` ` 和逗号 `,` 是用来分隔参数和点的 X、Y 坐标的，可以混用也可以多写

下面，我们一个一个说：

### `F`

相比于 SVG 来说，`F` 是 XAML 系路径标记语法唯一一个特有的语法。

带上参数一起，`F` 只有三种写法：

1. 省略不写
1. `F0` 表示 `EvenOdd`
1. `F1` 表示 `Nonzero`

省略不写和 `F0` 是相同的含义，即 `EvenOdd`。

SVG 中如果要实现相同的效果，需要设置 `path/@style` 属性，即`style="fill-rule:nonzero;"`。

### 起点和终点

#### `M` `m` 移动命令

`M` `m`（Move，移动）

* 含义：开始一段新的路径，然后将起点移到 `M` `m` 后面的参数中
* 参数：`startPoint`（起点坐标）
* 示例：`M10,100`

`M` 后面的 `startPoint` 参数是绝对点坐标，而 `m` 后面的 `startPoint` 参数是相对上一个命令中端点坐标的相对点坐标。

#### `L` `l` `H` `h` `V` `v` 直线命令

`L` `l`（Line，直线）

* 含义：从上一个点开始，连一条直线到此命令的端点
* 参数：`endPoint`（端点坐标）
* 示例：`L100,200`

`H` `h`（Horizontal Line，水平线）

* 含义：从上一个点开始，连一条水平直线到此命令的横坐标
* 参数：`x`（横坐标）
* 示例：`H100`

`V` `v`（Vertical Line，垂直线）

* 含义：从上一个点开始，连一条垂直直线到此命令的纵坐标
* 参数：`y`（纵坐标）
* 示例：`V200`

与前面一样，大写字符后面的坐标和数值是绝对坐标，小写字符后面的坐标和数值是相对坐标。

#### `C` `c`、`Q` `q`、`S` `s`、`T` `t` 贝塞尔曲线命令

`C` `c`（Cubic Bezier Curve，三次贝塞尔曲线）

* 含义：从上一个点开始，连一条**三次贝塞尔曲线**到此命令的端点
* 参数：`controlPoint1` `controlPoint2` `endPoint`（控制点坐标1 控制点坐标2 端点坐标）
* 示例：`C10,300 300,-200 300,100`

`Q` `q`（Quadratic Bezier Curve，二次贝塞尔曲线）

* 含义：从上一个点开始，连一条**二次贝塞尔曲线**到此命令的端点
* 参数：`controlPoint` `endPoint`（控制点坐标 端点坐标）
* 示例：`Q300,-200 300,100`

`S` `s`（Smooth Cubic Bezier Curve，平滑三次贝塞尔曲线）

* 含义：从上一个点开始，连一条平滑的**三次贝塞尔曲线**到此命令的端点，确保在上一个点的曲线是连续的
* 参数：`controlPoint2` `endPoint`（控制点坐标2 端点坐标）
* 示例：`S300,-200 300,100`

所谓“平滑”，即保证曲线在上一个端点处的的曲线连续而没有突变（一次可导）。而平滑的方法，便是将上一个命令在端点处的贝塞尔控制点相对上一个点进行一次镜像。

下面这张图可以说明是如何做到平滑的：

![将控制点镜像](/static/posts/2021-07-29-17-19-10.png)

你也可以注意到一个有趣的事情，`S` `s` 的参数中只有 `controlPoint2` 和 `endPoint`，这是因为 `controlPoint` 完全是根据上一个点的控制点的镜像来计算得到的，无需传入。

`T` `t`（Smooth Quadratic Bezier Curve，平滑二次贝塞尔曲线）

* 含义：从上一个点开始，连一条平滑的**二次贝塞尔曲线**到此命令的端点，确保在上一个点的曲线是连续的
* 参数：`endPoint`（端点坐标）
* 示例：`T300,100`

与 `S` `s` 一样，`T` `t` 也是确保在上一个点处平滑。控制点的计算方法也是一样对上一个点的控制点进行镜像。由于二次贝塞尔曲线只有一个控制点，所以它是无需传入控制点的，完全是算出来的。

### `A` `a` 椭圆弧命令

`A` `a`（Elliptical Arc，椭圆弧）

* 含义：在上一个点和此命令的端点之间，连一条椭圆弧
* 参数：`size` `rotationAngle` `isLargeArcFlag` `sweepDirectionFlag` `endPoint`（包含宽高两个值的尺寸 以度数计量的角度值 大于平角或小于平角标识 顺时针或逆时针标识 端点坐标）
* 示例：`A18.621,18.621,0,0,1,18.621,0.000`

`isLargeArcFlag` 标识，如果角度大于 180° 则为 1，否则为 0；`sweepDirectionFlag` 标识，如果顺时针则为 1，如果逆时针则为 0。

### `Z` `z` 闭合命令

* 含义：如果有此命令，那么图形将闭合形成填充区域；如果没有此命令，那么图形将只有线而不填充
* 没有参数
* 示例：`z`

此命令不区分大小写。

## 解析

在这里挖一个坑，稍后贴出我用“访问者”模式编写的高性能高扩展性的路径语法解析代码。

---

**参考资料**

- [Path Markup Syntax - WPF .NET Framework - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/desktop/wpf/graphics-multimedia/path-markup-syntax)
- [Paths — SVG 2](https://www.w3.org/TR/SVG/paths.html)
- [Paths – SVG 1.1 (Second Edition)](https://www.w3.org/TR/SVG11/paths.html)
