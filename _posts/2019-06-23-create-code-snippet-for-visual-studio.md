---
title: "如何快速创建 Visual Studio 代码片段？"
date: 2019-06-23 12:03:35 +0800
categories: visualstudio dotnet csharp
position: starter
---

使用 Visual Studio 的代码片段功能，我们可以快速根据已有模板创建出大量常用的代码出来。ReSharper 已经自带了一份非常好用的代码片段工具，不过使用 ReSharper 创建出来的代码片段只能用在 ReSharper 插件中。如果团队当中有一些小伙伴没有 ReSharper（毕竟很贵），那么也可以使用到 Visual Studio 原生的代码片段。

Visual Studio 的官方文档有演示如何创建 Visual Studio 的代码片段，不过上手成本真的很高。本文介绍如何快速创建 Visual Studio 代码片段，并不需要那么麻烦。

---

<div id="toc"></div>

## Visual Studio 的代码片段管理器

Visual Studio 中代码片段管理器的入口在“工具”中。你可以参照下图找到代码片段管理器的入口。

![代码片段管理器入口](/static/posts/2019-06-23-11-06-48.png)

在打开代码片段管理器之后，你可以选择自己熟悉的语言。里面会列出当前语言中可以插入的各种代码片段的源。

不过，Visual Studio 并没有提供创建代码片段的方法。在这个管理器里面，你只能导入已经存在的代码片段，并不能直接进行编辑。

官方文档提供了创建代码片段的方法，就在这里：

- [Code snippets - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/ide/code-snippets)

你只需要看一看就知道这其实是非常繁琐的创建方式，你几乎在手工编写本来是给机器阅读的代码。

我们创建代码片段其实只是关注代码片段本身，那么有什么更快速的方法呢？

方法是安装插件。

## Snippet Designer 插件

请去 Visual Studio 的扩展管理器中安装插件，或者去 Visual Studio 的插件市场中下载安装插件：

- [Snippet Designer - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=vs-publisher-2795.SnippetDesigner)

![在扩展管理器中安装插件](/static/posts/2019-06-23-11-11-16.png)

在安装完插件之后（需要重新启动 Visual Studio 以完成安装），你就可以直接在 Visual Studio 中创建和编辑代码片段了。

## 创建代码片段

你需要去 Visual Studio 的“文件”->“新建”->“新建文件”中打开的模板选择列表中选择“Code Snippet”。

![新建代码片段文件](/static/posts/2019-06-23-11-14-44.png)

下面，我演示创建一个 `Debug.WriteLine` 代码片段的创建方法。

### 编写一段代码

我将一段最简单的代码编写到了代码编辑窗格中：

```csharp
Debug.WriteLine("[section] text");
```

### 插入占位符

实际上，这段代码中的 `section` 和 `text` 应该是占位符。那么如何插入占位符呢？

选中需要成为占位符的文本，在这里是 `section` ，然后鼠标右键，选择“Make Replacement”。

![插入占位符](/static/posts/2019-06-23-11-31-42.png)

这样，在下方的列表中就会出现一个新的占位符。

![列表中出现占位符](/static/posts/2019-06-23-11-33-15.png)

### 设置文本占位符

现在我们设置这个占位符的更多细节。比如在下图中，我设置了工具提示（即我们使用此代码片段的时候 Visual Studio 如何提示我们编写这个代码片段），设置了默认值（即没有写时应该是什么值）。设置了这只是一个文本文字，没有其他特别含义。设置这是可以编辑的。

![设置更多信息](/static/posts/2019-06-23-11-46-07.png)

用通常的方法，设置 `text` 也是一个占位符。

### 设置类型占位符

如果我们只是这样创建一个代码片段，而目标代码可能没有引用 `System.Diagnostics` 命名空间，那么插入完之后手动引用这个命名空间体验可不好。那么如何让 `Debug` 类可以带命名空间地插入呢？

我们需要将 `Debug` 也设置成占位符。

![将 Debug 也设置成占位符](/static/posts/2019-06-23-11-49-59.png)

但是这是可以自动生成的占位符，不需要用户输入，于是我们将其设置为不可编辑。同时，在“Function”一栏填写这是一个类型名称：

```csharp
SimpleTypeName(global::System.Diagnostics.Debug)
```

![设置 Debug 占位符](/static/posts/2019-06-23-11-51-05.png)

### 转义 `$` 符号

实际上用于调试的话，代码越简单功能越全越好。于是我希望 `Debug.WriteLine` 上能够有一个字符串内插符号 `$`。

那么问题来了，`$` 符号是表示代码片段中占位符的符号，那么如何输入呢？

方法是——写两遍 `$`。于是我们的代码片段现在是这样的：

```csharp
Debug.WriteLine($$"[$section$] $text$");
```

### 保存代码片段

你可以随时按下 Ctrl+S 保存这个新建的代码片段。插件一个很棒的设计是，默认所在的文件夹就是 Visual Studio 中用来存放代码片段的文件夹。于是，你刚刚保存完就可以立刻在 Visual Studio 中看到效果了。

![保存代码片段](/static/posts/2019-06-23-11-17-34.png)

## 导入代码片段

如果你将代码片段保存在插件给你的默认的位置，那么你根本不需要导入任何代码片段。但如果你曾经导出过代码片段或者保存在了其他的地方，那么就需要在代码片段管理器中导入这些代码片段文件了。

### 使用代码片段

如果你前面使用了默认的保存路径，那么现在直接就可以开始使用了。

使用我们在 Shortcut 中设置的字母组合可以插入代码片段：

![插入代码片段](/static/posts/2019-06-23-11-53-22.png)

在插入完成之后，我们注意到此类型可以使用导入的命名空间前缀 `System.Diagnostics`。如果没有导入此命名空间前缀，代码片段会自动加入。

按下 Tab 键可以在多个占位符之间跳转，而使用回车键可以确认这个代码片段。

![插入后编辑的代码片段](/static/posts/2019-06-23-12-03-08.png)

## 管理代码片段

在 Visual Studio 视图菜单的其他窗口中，可以找到“Snippet Explorer”，打开它可以管理已有的代码片段，包括 Visual Studio 中内置的那些片段。

![代码片段管理器](/static/posts/2019-06-23-11-40-05.png)

---

**参考资料**

- [Code snippets - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/ide/code-snippets)
- [Walkthrough: Create a code snippet - Visual Studio | Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/ide/walkthrough-creating-a-code-snippet)
- [Snippet Designer - Visual Studio Marketplace](https://marketplace.visualstudio.com/items?itemName=vs-publisher-2795.SnippetDesigner)
- [mmanela/SnippetDesigner: The Snippet Designer is a plugin which enhances the Visual Studio IDE to allow a richer and more productive code snippet experience.](https://github.com/mmanela/snippetdesigner)
