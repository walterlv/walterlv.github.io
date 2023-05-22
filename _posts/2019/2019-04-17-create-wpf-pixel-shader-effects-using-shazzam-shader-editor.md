---
title: "WPF 像素着色器入门：使用 Shazzam Shader Editor 编写 HLSL 像素着色器代码"
publishDate: 2019-04-17 12:00:55 +0800
date: 2023-05-22 22:06:04 +0800
tags: dotnet csharp wpf directx
position: starter
coverImage: /static/posts/2019-04-17-10-48-18.png
permalink: /post/create-wpf-pixel-shader-effects-using-shazzam-shader-editor.html
---

HLSL，High Level Shader Language，高级着色器语言，是 Direct3D 着色器模型所必须的语言。WPF 支持 Direct3D 9，也支持使用 HLSL 来编写着色器。你可以使用任何一款编辑器来编写 HLSL，但 Shazzam Shader Editor 则是专门为 WPF 实现像素着色器而设计的一款编辑器，使用它来编写像素着色器，可以省去像素着色器接入到 WPF 所需的各种手工操作。

本文是 WPF 编写 HLSL 的入门文章，带大家使用 Shazzam Shader Editor 来编写最简单的像素着色器代码。

---

<div id="toc"></div>

## 下载安装

实际上 Shazzam Shader Editor 有一段时间没有维护了，不过在 WPF 下依然是一个不错的编写 HLSL 的工具。

- 于是去我的镜像地址下载：<https://github.com/walterlv/download/raw/master/Shazzam/Shazzam_v1.5.Setup.exe>
- 已经没有官网了：shazzam-tool.com

下载完成之后安装到你的电脑上即可。

Shazzam 是开源的，但是官方开源在 CodePlex 上，<https://archive.codeplex.com/?p=shazzam>，而 CodePlex 已经关闭。JohanLarsson 将其 Fork 到了 GitHub 上，<https://github.com/JohanLarsson/Shazzam>，不过几乎只有代码查看功能而不提供维护。

## Shazzam Shader Editor

### 主界面

![Shazzam 的主界面](/static/posts/2019-04-17-10-48-18.png)

打开 Shazzam，左侧会默认选中 Sample Shaders 即着色器示例，对于不了解像素着色器能够做到什么效果的小伙伴来说，仅浏览这里面的特效就能够学到很多好玩的东西。

旁边是 Tutorial 教程，这里的教程是配合 [HLSL and Pixel Shaders for XAML Developers](https://www.amazon.com/HLSL-Pixel-Shaders-XAML-Developers/dp/144931984X) 这本书来食用的，所以如果希望能够系统地学习 HLSL，那么读一读这本书跟着学习里面的代码吧！

左边的另一个标签是 Your Folder，可以放平时学习 HLSL 时的各种代码，也可以是你的项目代码，这里会过滤出 `.fx` 文件用于编写 HLSL 代码。

如果你打开关于界面，你可以看到这款软件很用心地在关于窗口背后使用了 [TelescopicBlur](https://affirmaconsulting.wordpress.com/2010/12/30/tool-for-developing-hlsl-pixel-shaders-for-wpf-and-silverlight/) 特效，这是一个 PS_3 特效，后面会解释其含义。

![加了特效的关于界面](/static/posts/2019-04-17-10-52-23.png)

### 公共设置

依然在左侧，可以选择 Settings 设置。

![Shazzam 设置](/static/posts/2019-04-17-11-11-41.png)

#### 目标框架 Target Framework

WPF 自 .NET Framework 4.0 开始支持 PS_3，当然也包括现在的 .NET Core 3.x 和后续的全版本 .NET。

PS_3 带来了比 PS_2 更多的功能，但需要注意，不是所有的显卡设备都支持 PS_3，这其中就包括了至今仍在广泛使用的 Windows 远程桌面（RDP）。

![Windows 远程桌面上无法使用 PS_3](/static/posts/2023-05-22-22-03-17.png)

所以，如果希望让你的着色器代码能在目前所有设备上正常运行，建议使用 PS_2；如果不在乎这一点，或者你有其他低性能的方法（例如用 CPU 画位图）来替代 PS_3，那么还是可以继续用的。

如果你正在写的 HLSL 代码指令数刚好超过 PS_2 的限制（64 条指令）不太多，可以参考我在另一篇博客中的优化方式：

关于 PS_3 相比于此前带来的更新可以查看微软的官方文档了解：[ps_3_0 - Windows applications - Microsoft Docs](https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/dx9-graphics-reference-asm-ps-3-0)。

#### 生成的命名空间 Generated Namespace

默认是 Shazzam，实际上在接入到你的项目的时候，这个命名空间肯定是要改的，所以建议改成你项目中需要使用到的命名空间。比如我的是 `Walterlv.Effects`。

改好之后，如果你编译你的 `.fx` 文件，也就是编写了 HLSL 代码的文件，那么顺便也会生成一份使用 `Walterlv.Effects` 命名空间的 C# 代码便于你将此特效接入到你的 WPF 应用程序中。

#### 缩进 Indentation

默认的缩进是 Tab，非常不清真，建议改成四个空格。

#### 默认动画时长 Default Animation Length

如果你的特效是为了制作动画（实际上在 Shazzam 中编写的 HLSL，任何一个寄存器（变量）都可以拿来做动画），那么此值将给动画设置一个默认的时长。

相比于前面的所有设置，这个设置不会影响到你的任何代码，只是决定你预览动画效果时的时长，所以设置多少都没有影响。

## 编写 HLSL 代码

### HLSL 代码窗格

实际上本文不会教你编写任何 HLSL 代码，也不会进行任何语法入门之类的，我们只需要了解 Shazzam 是如何帮助我们为 WPF 程序编写像素着色器代码的。

将你的视线移至下方富含代码的窗格，这里标记着 XXX.fx 的标签就是 HLSL 代码了。大致浏览一下，你会觉得这风格就是 C 系列的语言风格，所以从学校里出来的各位应该很有亲切感，上手难度不高。

按下 F5，即可立即编译你的 HLSL 代码，并在界面上方看到预览效果。别说你没有 HLSL 代码，前面我们可是打开了那么多个示例教程呀。

### 预览调节窗格

确保你刚刚使用 F5 编译了你的 HLSL 代码。这样，你就能在这个窗格看到各种预览调节选项。

![预览调节](/static/posts/2019-04-17-11-22-28.png)

你可以直接拉动拉杆调节参数范围，也可以直接开启一个动画预览各种值的连续变化效果。

### 生成的 C# 代码

继续切换一个标签，你可以看到 Shazzam 为你生成的 C# 代码。实际上稍后你就可以直接使用这份代码驱动起你刚刚编写的特效。

代码风格使用了我们刚刚设置的一些全局参数。

![生成的 C# 代码](/static/posts/2019-04-17-11-24-40.png)

## 将像素着色器放到 WPF 项目中

将像素着色器放到 WPF 项目中需要经过两个步骤：

1. 找到生成的像素着色器文件，并放入 WPF 工程中；
1. 修改像素着色器的生成方式。

### 将特效放入到你的 WPF 项目中

我们需要将两个文件加入到你的 WPF 程序中：

1. 一个 `.ps` 文件，即刚刚的 `.fx` 文件编译后的像素着色器文件；
1. 一份用于驱动此像素着色器的 C# 代码。

这些文件都可以使用以下方法找到：

1. 请前往 `%LocalAppData%\Shazzam\GeneratedShaders` 文件夹；
1. 根据名称变化规则找到对应的文件夹：
    - 注意命名，如果你的 `.fx` 文件命名为 `walterlv.fx`，那么生成的文件就会在 `WalterlvEffect` 文件夹下
1. 进入刚刚找到的 XxxEffect 文件夹，里面有你需要的所有文件：
    - 一个 `.ps` 文件
    - 一个 C# 文件（以及 VB 文件）

随后，将这两份文件一并加入到你的 WPF 项目工程文件中。

但是，请特别注意路径！留意你的 C# 代码，里面是编写了像素着色器的路径的：

1. 如果你的程序集名称是其他名称，需要修改下面 `Walterlv.Effects` 的部分改成你的程序集名称；
1. 如果你放到了其他的子文件夹中，你也需要在下面 `/WalterlvEffect.ps` 的前面加上子文件夹。

```csharp
// 记得修改程序集名称，以及 .ps 文件所在的文件夹路径！切记！
pixelShader.UriSource = new Uri("/Walterlv.Effects;component/WalterlvEffect.ps", UriKind.Relative);
```

### 修改像素着色器的生成方式

需要使用 `Resource` 方式编译此 `.ps` 文件到 WPF 项目中。

如果你使用的是旧的项目格式，则右键此 `.ps` 文件的时候选择属性，你可以在 Visual Studio 的属性窗格的生成操作中将其设置为 `Resource`。

![右键属性](/static/posts/2019-04-17-11-51-09.png)

![使用 Resource 编译](/static/posts/2019-04-17-11-55-28.png)

如果你使用的是 Sdk 风格的新项目格式，则在属性窗格中无法将其设置为 `Resource`，这个时候请直接修改 .csproj 文件，加上下面一行：

```xml
<Resource Include="**\*.ps" />
```

如果不知道怎么放，我可以多贴一些 csproj 的代码，用于指示其位置：

```xml
<Project Sdk="Microsoft.NET.Sdk.WindowsDesktop">

  <PropertyGroup>
    <OutputType>WinExe</OutputType>
    <TargetFramework>netcoreapp3.0</TargetFramework>
    <UseWPF>true</UseWPF>
    <AssemblyName>Walterlv.Demo</AssemblyName>
  </PropertyGroup>

  <ItemGroup>
    <Resource Include="**\*.ps" />
  </ItemGroup>

</Project>
```

## 在 WPF 程序中使用这个特效

要在 WPF 程序中使用这个特效，则设置控件的 `Effect` 属性，将我们刚刚生成的像素着色器对应 C# 代码的类名写进去即可。当然，需要在前面引入 XAML 命名空间。

```xml
<Window x:Class="Walterlv.CloudTyping.MainWindow"
        xmlns="http://schemas.microsoft.com/winfx/2006/xaml/presentation"
        xmlns:x="http://schemas.microsoft.com/winfx/2006/xaml"
        xmlns:d="http://schemas.microsoft.com/expression/blend/2008"
        xmlns:mc="http://schemas.openxmlformats.org/markup-compatibility/2006"
        xmlns:effects="clr-namespace:Walterlv.Effects"
        Title="walterlv">
    <Grid>
        <Grid.Effect>
            <effects:WalterlvEffect />
        </Grid.Effect>
        <!-- 省略了界面上的各种代码 -->
    </Grid>
</Window>
```

下面是我将 Underwater 特效加入到我的云键盘窗口中，给整个窗口带来的视觉效果。

![云键盘的水下特效](/static/posts/2019-04-17-11-46-35.png)

## 入门总结

本文毕竟是一篇入门文章，没有涉及到任何的技术细节。你可以按照以下问题检查是否入门成功：

1. 你能否成功安装并打开 Shazzam Shader Editor 软件？
1. 你能否找到并打开一个示例像素着色器代码，并完成编译预览效果？
1. 知道如何设置像素着色器使用 PS_3 版本吗？
1. 尝试将一个示例像素着色器编译完并放入到你的 WPF 项目中。
1. 尝试将特效应用到你的一个 WPF 控件中查看其效果。

---

**参考资料**

- [shazzam-tool.com](http://shazzam-tool.com/)
- [Shazzam Shader Editor - CodePlex Archive](https://archive.codeplex.com/?p=shazzam)
- [JohanLarsson/Shazzam: A fork of https://shazzam.codeplex.com/](https://github.com/JohanLarsson/Shazzam)
- [Shazzam - A Tool for Creating WPF Pixel Shader Effects - The Continuum Show - Channel 9](https://channel9.msdn.com/Shows/Continuum/Shazzam)
- [ps_3_0 - Windows applications - Microsoft Docs](https://learn.microsoft.com/en-us/windows/win32/direct3dhlsl/dx9-graphics-reference-asm-ps-3-0)
- [ps_3_0 Registers - Windows applications - Microsoft Docs](https://docs.microsoft.com/en-us/windows/desktop/direct3dhlsl/dx9-graphics-reference-asm-ps-registers-ps-3-0)
- [WPF Custom Effect disappears when using Remote Desktop - Stack Overflow](https://stackoverflow.com/a/30622575/6233938)
