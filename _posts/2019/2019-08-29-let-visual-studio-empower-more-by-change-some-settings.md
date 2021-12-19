---
title: "通过设置启用 Visual Studio 默认关闭的大量强大的功能提升开发效率"
date: 2019-08-29 21:54:47 +0800
tags: visualstudio csharp
position: starter
coverImage: /static/posts/2019-08-29-20-31-44.png
---

使用 Visual Studio 开发 C#/.NET 应用程序，以前有 ReSharper 来不足其各项功能短板，后来不断将 ReSharper 的功能一点点搬过来稍微好了一些。不过直到 Visual Studio 2019，才开始渐渐可以和 ReSharper 拼一下了。

如果你使用 Visual Studio 2019，那么像本文这样配置一下，可以大大提升你的开发效率。

---

<div id="toc"></div>

## 工具选项

打开菜单 “工具” -> “选项”，然后你就打开了 Visual Studio 的选项窗口。接下来本文的所有内容都会在这里进行。

![打开选项窗口](/static/posts/2019-08-29-20-31-44.png)

## 文本编辑器

在 “文本编辑器” -> “常规” 分类中，我们关心这些设置：

- `使鼠标单击可执行转到定义` *这样按住 Ctrl 键点击标识符的时候可以转到定义（开启此选项之后，后面有其他选项可以转到反编译后的源码）*

![文本编辑器 -> 常规](/static/posts/2019-08-29-20-35-06.png)

当然也有其他可以打开玩的：

- `查看空白` *专治强迫症，可以把空白字符都显示出来，这样你可以轻易看到对齐问题以及多于的空格了*

## C#

在 “文本编辑器” -> “C#” -> “IntelliSense” 分类中，我们关心这些设置：

- `键入字符后显示完成列表` `删除字符后显示完成列表` `突出显示完成列表项的匹配部分` `显示完成项筛选器` *打开这些选项可以让智能感知列表更容易显示出来，而我们也知道智能感知列表的强大*
- **推荐** `显示 unimported 命名空间中的项(实验)` *这一项默认不会勾选，但强烈建议勾选上；它可以帮助我们直接输入没有 using 的命名空间中的类型，这可以避免记住大量记不住的类名*

![IntelliSense](/static/posts/2019-08-29-21-04-52.png)

## C# 高级

在 “文本编辑器” -> “C#” -> “高级” 分类中，我们关心大量设置：

- `支持导航到反编译源(实验)` *前面我们说可以 Ctrl + 鼠标导航到定义，如果打开了这个就可以看反编译后的源码了*
- `启用可为 null 的引用分析 IDE 功能` *这个功能可能还没有完成，暂时还是无法开启的*

![高级](/static/posts/2019-08-29-21-09-20.png)

当然也有其他可以打开玩的：

- `启用完成解决方案分析` *这是基于 Roslyn 的分析，Visual Studio 的大量重构功能都依赖于它；默认关闭也可以用，只是仅分析当前正在编辑的文件；如果打开则分析整个解决方案，你会在错误列表中看到大量的编译警告*

## 代码样式

在 “文本编辑器” -> “C#” -> “代码样式” 分类，如果你关心代码的书写风格，那么这个分类底下的每一个子类别都可以考虑一个个检查一下。

![代码样式](/static/posts/2019-08-29-21-23-37.png)

## 人工智能 IntelliCode

Visual Studio 2019 默认安装了 IntelliCode 可以充分利用微软使用 GitHub 上开源项目训练出来的模型来帮助编写代码。这些强烈建议开启。

- `C# 基础模型` *微软利用 GitHub 开源项目训练的基础模型*
- `XAML 基础模型` *微软利用 GitHub 开源项目训练的基础模型*
- `C# 参数完成`
- `C# 自定义模型` *如果针对单个项目训练出来了模型，那么可以使用专门针对此项目训练的模型*
- `EditorConfig 推理` *可以根据项目推断生成 EditorConfig 文件* 可以参见[在 Visual Studio 中使用 EditorConfig 统一代码风格](/post/editor-config-for-visual-studio)
- `自定义模型训练提示` *如果开启，那么每个项目的规模如果达到一定程度就会提示训练一个自定义模型出来*

![IntelliCode](/static/posts/2019-08-29-21-26-01.png)

![IntelliCode English](https://docs.microsoft.com/en-us/visualstudio/intellicode/media/intellicode-options.png)

训练模型会上传一部分数据到 IntelliCode 服务器，你可以去 `%TEMP%\Visual Studio IntelliCode` 目录来查看到底上传了哪些数据。

## 快捷键

当然，设置好快捷键也是高效编码的重要一步，可以参考：

- [如何快速自定义 Visual Studio 中部分功能的快捷键](/post/customizing-keyboard-shortcuts-in-visual-studio)
- [提高使用 Visual Studio 开发效率的键盘快捷键](/post/keyboard-shortcuts-to-improve-the-efficiency-of-visual-studio)

## 自动完成

在你点击 “确定” 关闭了以上窗口之后，我们还需要设置一项。

确保下图中的这个按钮处于 “非选中” 状态：

![建议完成模式](/static/posts/2019-08-29-21-49-58.png)

这样，当出现智能感知列表的时候，我们直接就可以按下回车键输入这个选项了；否则你还需要按上下选中再回车。

![建议完成和标准完成](/static/posts/2019-08-29-21-53-51.png)

