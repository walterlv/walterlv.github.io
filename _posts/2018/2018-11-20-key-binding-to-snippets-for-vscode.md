---
title: "在 Visual Studio Code 中为代码片段（Code Snippets）添加快捷键"
publishDate: 2018-11-20 10:32:28 +0800
date: 2018-12-30 17:00:32 +0800
categories: vscode
---

Visual Studio Code 默认是关闭了 Markdown 的智能感知提示的（因为真的是不好用，尤其是其没有中文分词的情况下）。那么在没有智能感知提示的情况下如何快速插入代码片段呢？

可以使用快捷键！

本文介绍如何为代码片段绑定快捷键。

---

代码片段本没有快捷键相关的字段可供设置的，不过在快捷键设置中可以添加代码片段相关的设置。

首先，在 Visual Studio Code 中打开快捷键设置：

![打开快捷键设置](/static/posts/2018-11-20-09-59-06.png)

选择手工编辑快捷键配置文件：

![手工编辑快捷键配置文件](/static/posts/2018-11-20-10-00-45.png)

在配置文件中添加这些代码即可关联一个代码片段：

```json
[
  {
    "key": "alt+p",
    "command": "editor.action.insertSnippet",
    "when": "editorTextFocus",
    "args": {
      "langId": "markdown",
      "name": "Insert a post for walterlv.com"
    }
  }
]
```

在这个配置中，`alt+p` 是我指定的快捷键，`editor.action.insertSnippet` 表示执行命令插入代码片段，生效条件为 `editorTextFocus` 及文本编辑器获得焦点的期间。

`args` 字段指定了两个值，作为对一个现有代码片段的引用。`langId` 是生效的语言 Id，`name` 是代码片段的名称。这个名称是我在 [在 Visual Studio Code 中添加自定义的代码片段](/post/add-custom-code-snippet-for-vscode.html) 中做的代码片段的名称。

保存，现在按下 `alt+p` 后就会插入指定的代码片段了。

事实上，`args` 也可以不是引用，而直接是代码片段的内容：

```json
[
  {
    "key": "alt+p",
    "command": "editor.action.insertSnippet",
    "when": "editorTextFocus",
    "args": {
      "snippet": "@[TOC](walterlv 的博客目录)"
    }
  }
]
```

这样，也不需要事先定义代码片段了。

额外提及以下，Visual Studio Code 快捷键只能设置全局的而不能设置仅工作区生效，详情请看 [load keybindings.json from .vscode dir if there is any ? · Issue #10708 · Microsoft/vscode](https://github.com/Microsoft/vscode/issues/10708)。

---

#### 参考资料

- [Creating your own snippets in Visual Studio Code](https://code.visualstudio.com/docs/editor/userdefinedsnippets)
- [load keybindings.json from .vscode dir if there is any ? · Issue #10708 · Microsoft/vscode](https://github.com/Microsoft/vscode/issues/10708)
