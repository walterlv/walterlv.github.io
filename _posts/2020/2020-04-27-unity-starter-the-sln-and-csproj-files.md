---
title: "Unity3D 入门：使用 Visual Studio 开发 Unity C# 脚本，说说根目录的那些 sln 和 csproj 文件"
date: 2020-04-27 21:04:09 +0800
tags: unity csharp
position: starter
---

本文介绍 Unity3D 项目根目录的 sln 和 csproj 文件，你将知道如何正确理解和使用它们。

---

对于传统 .NET/C# 的开发者来说，在解决方案中管理 NuGet 包，在 C# 项目中引用 dll 或 NuGet 包是家常便饭。但在 Unity 项目里面，你可能要改变这一观念——因为 Unity 项目里面实际上并不存在 sln 和 csproj 文件。

等等！那我们在根目录看到的那些 sln 和 csproj 文件是什么？

![Unity 项目根目录下的 sln 和 csproj 文件](/static/posts/2020-04-27-19-52-25.png)

那只是 Unity 编辑器为了让你方便写 C# 代码临时生成给你用的。

默认 Unity 不指定外部脚本编辑器时，会单纯打开 .cs 文件而已。而如果指定了 Visual Studio 作为外部脚本编辑器，那么再从 Unity 中打开 C# 项目时，将会生成 sln 和 csproj 文件，然后调用 Visual Studio 打开生成的 sln 和 csproj 文件。

![打开 C# 项目](/static/posts/2020-04-26-11-38-09.png)

![设置外部工具](/static/posts/2020-04-26-11-26-06.png)

这里就需要特别注意了：**每次点击 Open C# Project 打开 C# 项目时，都会重新生成 sln 和 csproj 文件**，所以实际上你对 sln 和 csproj 所做的任何改动都是无效的！

这样的设计，有好处也有坏处：

1. 有了 sln 和 csproj，Visual Studio 将能充分运行代码分析器，可以在类与其他符号之间跳转，可以有智能感知提示，可以实时发现编写中的代码错误（甚至是引用错误）。
1. 但让 Visual Studio 的各种功能激活后就会让我们这样的入门开发者产生误会，认为这其实就是 C# 项目，会尝试真的对这些项目进行可能超出 Unity 功能范围的修改。

真正在编译完成放到游戏中运行的，是 Assets 文件夹中的文件。而外面的 sln 和 csproj 文件，应该加入到 .gitignore 文件中，从版本管理中忽略掉。
