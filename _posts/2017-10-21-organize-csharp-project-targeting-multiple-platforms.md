---
title: "如何组织一个同时面向 UWP/WPF/.Net Core 控制台的 C# 项目解决方案"
date: 2017-10-21 11:20:54 +0800
categories: dotnet dotnet-core dotnet-standard wpf uwp
description: 
---

希望写一个小型工具，给自己和需要的人。考虑到代码尽可能的复用，我准备采用 .Net Standard 来编写大多数核心代码，并基于 .Net Core 编写跨平台控制台入口，用 WPF 编写桌面端 UI 入口，用 UWP 作为可上架商店的 UI 入口，然后用 Shared Project 共享 WPF 和 UI 的多数 UI 入口代码。

阅读本文将了解到如何在尽可能复用代码的情况下组织这样的 C# 解决方案。

---

<div id="toc"></div>

### 工具型项目，选择了控制台

用 WPF 开发桌面 UI，因为其有强大的 .NET Framework 库在背后支持，外加方便而功能齐全的 XAML 开发环境，在用 C# 进行桌面应用程序开发的时候不失为一种优秀的选择。但微软却并不怎么重视 WPF，而一直投入较大资源在半死不活的 UWP 上，导致 WPF 现在有非常多的坑是在 UWP 上才解的。然而，微软却并没有好好运营 UWP，以至于其开发者急剧减少，再在上面投入太多精力投入产出比显得太低。

.NET Framework 是个优秀的框架，可是与 Windows 桌面端绑得太死，以至于在当下多平台发展得都不错的情况下失去了大多数的竞争力。但是 .NET Core 解决了这个问题。然而谈到 UI 的跨平台，就是一个巨大的投入和难以见底的坑，以至于基于 .NET Core 且跨平台的 UI 框架目前依然没有出现。

毕竟只是工具型项目，并不想去动用大型 UI 框架 Xamarin/Unity，以至于写一个 .NET Core 控制台程序成了小型工具型项目的最佳解决方案了。

工具型项目是任务导向的，能完成任务为最终目的。控制台与配置文件的配合不仅足以完成任务，还为自动化或其他工具集成提供了方便。这里提供 UI 只是为了方便此工具用户的初学使用和理解。

### 组织一个 C# 解决方案

我们总共涉及到的 Visual Studio 项目类型有这五个：
- 类库(.NET Standard)
- 共享项目
- 控制台应用(.NET Core)
- WPF 应用(.NET Framework)
- 空白应用(通用 Windows)

.NET Standard 和共享项目是默认就装上的，但其他三个却不是。需要在 Visual Studio 安装界面中额外勾选：
- 用于安装通用 Windows 项目，如果你对此不感兴趣，忽略即可  
![](/static/posts/2017-10-21-10-20-33.png)
- 用于安装 WPF 应用，如果你对此不感兴趣，忽略即可  
![](/static/posts/2017-10-21-10-21-35.png)
- 用于安装 .NET Core 项目，这是跨平台的重点，建议安装  
![](/static/posts/2017-10-21-10-22-40.png)

在 Visual Studio 中创建一个解决方案的时候依次添加这五种项目。
- 我们的主要逻辑代码全在 .NET Standard 项目中。这里包含了完整的功能实现，可以脱离其他四种实现完整功能。
- .NET Core 控制台项目仅仅作为入口，引用 .NET Standard 的项目，将用户输入的命令转为具体的函数调用。
- 共享项目的代码主要是 UI 或 UI 辅助代码，例如控制 UI 的逻辑和 ViewModel。
- UWP 和 WPF 项目仅包含 UI（XAML）和必要的不一致的 UI 控制逻辑，通过链接的方式将共享项目中的代码引入[如何链接？](/visualstudio/2016/08/01/share-code-with-add-as-link.html)。
- 其他的工具库当然也是需要的，但为了通用，建议优先选择 .NET Standard 的库。

这样，项目在 Visual Studio 中看起来大概是这样的：  
![](/static/posts/2017-10-21-11-19-16.png)
