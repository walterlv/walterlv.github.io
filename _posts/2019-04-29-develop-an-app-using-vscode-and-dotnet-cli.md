---
title: "使用 dotnet 命令行配合 vscode 完成一个完整 .NET 解决方案的编写和调试"
date: 2019-04-29 11:09:50 +0800
categories: dotnet vscode csharp
position: starter
---

如果你是开发个人项目，那就直接用 Visual Studio Community 版本吧，对个人免费，对小团体免费，不需要这么折腾。

如果你是 Mac / Linux 用户，不想用 Visual Studio for Mac 版；或者不想用 Visual Studio for Windows 版那么重磅的 IDE 来开发简单的 .NET Core 程序；或者你就是想像我这么折腾，那我们就开始吧！

---

<div id="toc"></div>

## 安装必要的软件和插件

1. [点击这里下载正式或者预览版的 .NET Core](https://dotnet.microsoft.com/download) 然后安装
2. [点击这里下载 Visual Studio Code](https://code.visualstudio.com/download) 然后安装
3. 在 Visual Studio Code 里安装 C# for Visual Studio Code 插件（步骤如下图所示）

![安装 C# for Visual Studio Code 插件](/static/posts/2019-03-14-20-01-52.png)

搜索的时候，推荐使用 `OmniSharp` 关键字，因为这可以得到唯一的结果，你不会弄混淆。*如果你使用 C# 作为关键字，那需要小心，你得找到名字只有 C#，点开之后是 C# for Visual Studio Code 的那款插件。因为可能装错，所以我不推荐这么做。*

对于新版的 Visual Studio Code，装完会自动启用，所以你不用担心。我们可以后续步骤了。

## 创建一个 .NET Core 控制台项目

准备一个空的文件夹，这个文件夹将会成为我们解决方案所在的文件夹，也就是 sln 文件所在的文件夹。在这个空的文件夹中打开 VSCode，然后打开 VSCode 的终端。

在 VSCode 中的终端中输入：

```powershell
> dotnet new console -o Walterlv.Demo
```

这样会在当前的文件夹中创建一个 `Walterlv.Demo` 的子文件夹，并且在此文件夹中新建一个名为 `Walterlv.Demo` 的控制台项目。

![创建一个控制台项目](/static/posts/2019-04-29-09-53-28.png)

如果你观察我们刚刚创建的项目，你会发现里面有一个 csproj 文件和一个 Program.cs 文件。csproj 文件是 Sdk 风格的项目文件，而 Program.cs 里面包含最简单的 `Hello World` 代码：

```csharp
using System;

namespace Walterlv.Demo
{
    class Program
    {
        static void Main(string[] args)
        {
            Console.WriteLine("Hello World!");
        }
    }
}
```

我们会考虑在一个子文件夹中创建项目，是因为我们会一步步创建一个比较复杂的解决方案，用以演示比较完整的使用 VSCode 开发 .NET 程序的过程。

## 添加一个解决方案

我们现在创建一个在 Visual Studio 会特别熟悉的解决方案，sln 文件。

使用以下命令创建一个解决方案文件：

```powershell
> dotnet new sln
```

现在，这个解决方案文件还是空的，不包含任何项目，于是我们把我们一开始创建的 `Walterlv.Demo` 项目加入到此 sln 文件中。

使用以下命令添加：

```powershell
> dotnet sln add .\Walterlv.Demo\Walterlv.Demo.csproj
```

于是，我们的解决方案中，就存在一个可以运行的控制台项目了。

## 开始调试最简单的程序

理论上，你按下 F5，选择 .NET Core 后就能自动生成调试所需的 launch.json 和 tasks.json 文件：

- [让你的 VSCode 具备调试 C# 语言 .NET Core 程序的能力](/post/equip-vscode-for-dotnet-core-app-debugging.html)

如果不能生成所需的文件，你可以使用以下博客中的方法，手动添加这两个文件：

- [手工编辑 tasks.json 和 launch.json，让你的 VSCode 具备调试 .NET Core 程序的能力](/post/equip-vscode-manually-for-dotnet-core-app-debugging.html)

在经过以上两篇博客中的方法之后，你将可以跑起来你的程序。

如果遇到了编译错误……呃这么简单的程序怎么可能遇到编译错误呢？一定是因为之前的操作有问题。可以考虑删除 `bin` 和 `obj` 文件夹，然后输入以下命令自行编译：

```powershell
> dotnet build
```

这个命令会还原 NuGet 包，然后使用 .NET Core 版本的 MSBuild 编译你的解决方案。在此之后，你并不需要总是输入此命令，只需要像 Visual Studio 一样按下 F5 即可调试。

## 引用项目

现在我们演示如何引用项目。

首先使用以下命令创建一个类库项目：

```powershell
> dotnet new classlib -o Walterlv.Library
```

将其添加到 sln 中。

```powershell
> dotnet sln add .\Walterlv.Library\Walterlv.Library.csproj
```

于是我们的目录结构现在是这样的（稍微改了一点代码）。

![目录结构](/static/posts/2019-04-29-10-32-29.png)

然后让我们的 `Walterlv.Demo` 项目引用这个刚刚创建的项目：

```powershell
> dotnet add Walterlv.Demo reference .\Walterlv.Library\
```

现在，我们即可在 Program.cs 中使用到刚刚 Class1.cs 中编写的方法（见上面截图中写的方法）。

不过，当你写下 `Class1` 后，会没有此名称，但有快速操作提示可以自动添加命名空间（就像没有装 ReSharper 的 Visual Studio 的效果一样）。

![有快速操作提示](/static/posts/2019-04-29-10-39-02.png)

![可添加命名空间](/static/posts/2019-04-29-10-40-14.png)

![有智能感知提示](/static/posts/2019-04-29-10-41-13.png)

这时再按下 F5 运行，可以看到多输出了一个 `walterlv is a 逗比` 这样的提示，我们成功使用到了刚刚引用的类。

![运行的结果](/static/posts/2019-04-29-10-37-30.png)

## 引用 NuGet 包

接下来介绍如何引用 NuGet 包。

```powershell
> dotnet add Walterlv.Demo package Newtonsoft.Json
```

这样可以给 `Walterlv.Demo` 项目引用 `Newtonsoft.Json` 包。

接下来就像前面一节我们所描述的那样使用这个包里面的类就好了。
