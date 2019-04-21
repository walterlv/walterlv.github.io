---
title: "如何快速自定义 Visual Studio 中部分功能的快捷键"
date: 2019-04-21 12:31:19 +0800
categories: visualstudio
position: starter
---

Visual Studio 中有些自带的快捷键与现有软件有冲突，那么如何修改这些快捷键让这些功能正常工作起来呢？

---

<div id="toc"></div>

## 打开快捷键设置界面

在 Visual Studio 中打开 “工具 -> 选项”，打开选项设置界面。在其中找到 “环境 -> 键盘” 项。我们设置快捷键的地方就在这里。

![工具 -> 选项 -> 环境 -> 键盘](/static/posts/2019-04-20-18-50-04.png)

## 修改一个现有功能的快捷键

默认情况下，在 Visual Studio 2019 中快速重构的快捷键是 `Ctrl+.`。然而，使用中文输入法的各位应该非常清楚，`Ctrl+.` 是输入法切换中英文符号的快捷键。

于是，当使用中文输入法的时候，实际上是无法通过按下 `Ctrl+.` 来完成快速重构的。我们需要修改快捷键来避免这样的冲突。

![使用 Ctrl+. 来进行快速重构](/static/posts/2019-04-21-11-46-21.png)

在“新快捷键”那个框框中，按下 `Ctrl+.`，正常会在“快捷键的当前使用对象”框中出现此快捷键的功能。不过，如果快捷键已经与输入法冲突，则不会出现，你需要先切换至英文输入法以避免此冲突。

![显示此快捷键的当前功能](/static/posts/2019-04-21-12-20-03.png)

通过“快捷键的当前使用对象”下拉框，我们可以得知功能的名称，下拉框中的每一项都是此快捷键的功能。

![快捷键的当前使用对象](/static/posts/2019-04-21-12-22-27.png)

我们需要做的是，搜索这些功能，并为这些功能分配新的快捷键。每一个我们关心的功能都这么设置：

![设置快捷键](/static/posts/2019-04-21-12-29-16.png)

于是新快捷键就设置好了。

![新分配的快捷键](/static/posts/2019-04-21-12-26-49.png)

现在，可以使用新的快捷键来操作这些功能了。

---

**参考资料**

- [Identify and customize keyboard shortcuts - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/ide/identifying-and-customizing-keyboard-shortcuts-in-visual-studio?view=vs-2019)
