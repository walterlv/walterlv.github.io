---
title: "使用 .editorconfig 配置 .NET/C# 项目的代码分析规则的严重程度"
date: 2019-10-12 11:35:04 +0800
categories: dotnet csharp
position: knowledge
---

随着 Visual Studio 2019 更新，在 Visual Studio 中编写代码的时候也带来了基于 Roslyn 的代码质量分析。有一些代码分析严重程度可能与团队约定的不一致，这时就需要配置规则的严重程度。另外如果是个人使用插件安装了分析器，也可以配置一些严重程度满足个人的喜好。

本文介绍使用 .editorconfig 文件来配置 .NET/C# 项目中，代码分析规则的严重性。可以是全局的，也可以每个项目有自己的配置。

---

<div id="toc"></div>

## 生效范围与继承

.editorconfig 文件可以在你的项目中的任何地方，甚至是代码仓库之外。是按照文件夹结构来继承生效的。

比如我的项目结构是这样：

```powershell
+ Walterlv.Demo
    + Core
        - .editorconfig
        - Foo.cs
    - .editorconfig
    - Program.cs
```

![项目结构](/static/posts/2019-10-12-11-14-12.png)

那么 Foo.cs 文件的规则严重性将受 Core 文件夹中的 .editorconfig 文件管理，如果有些规则不在此文件夹的 .editorconfig 里面，就会受外层 .editorconfig 管理。

另外，你甚至可以在整个代码仓库的外部文件夹放一个 .editorconfig 文件，这样，如果项目中没有对应的规则，那么外面文件夹中的 .editorconfig 规则就会生效，这相当于间接做了一个全局生效的规则集。

## .editorconfig 中的内容

.editorconfig 中的分析器严重性内容就像下面这样：

```ini
[*.cs]

# CC0097: You have missing/unexistent parameters in Xml Docs
dotnet_diagnostic.CC0097.severity = error

# CA1031: Do not catch general exception types
dotnet_diagnostic.CA1031.severity = suggestion

# IDE0051: 删除未使用的私有成员
dotnet_diagnostic.IDE0051.severity = none
```

对于 C# 语言的规则，在 [*.cs] 区，每个规则格式是 `dotnet_diagnostic.{DiagnosticId}.severity = {Severity}`。

当然，我们不需要手工书写这个文件，了解它的格式只是为了出问题的时候不至于一脸懵逼。

## 配置严重程度

使用 Visual Studio 2019，配置规则严重性非常简单。当然，16.3 以上版本才这么简单，之前的版本步骤多一点。

![配置规则严重性](/static/posts/2019-10-12-11-32-25.png)

在提示有问题的代码上按下重构快捷键（默认是 `Ctrl + .`），可以出现重构菜单，其中就有配置规则严重性的选项，直接选择即可自动添加到 .editorconfig 文件中。如果项目中没有 .editorconfig 文件，则会自动在解决方案同目录下创建一个新的。

对这部分快捷键不了解的话可以阅读：[提高使用 Visual Studio 开发效率的键盘快捷键 - walterlv](https://blog.walterlv.com/post/keyboard-shortcuts-to-improve-the-efficiency-of-visual-studio.html)。
