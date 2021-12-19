---
title: "在 Visual Studio Code 中添加自定义的代码片段"
publishDate: 2018-11-20 10:19:28 +0800
date: 2019-03-14 13:01:30 +0800
tags: vscode
coverImage: /static/posts/2018-11-19-20-57-16.png
permalink: /post/add-custom-code-snippet-for-vscode.html
---

无论是那个编辑器，如果能够添加一些自定义代码片段，能够大大提升代码的输入效率。

本文介绍如何在 Visual Studio Code 中添加自定义代码片段。

---

<div id="toc"></div>

## Visual Studio Code 的代码片段设置

你可以在 Visual Studio Code 的菜单中找到代码片段的设置入口，在 File -> Preferences -> User Snippets 中。

![打开用户代码片段设置](/static/posts/2018-11-19-20-57-16.png)  
▲ 打开用户代码片段设置

点开后，会让你选择做什么：

- 新建全局代码片段
- 新建适用于当前工作区的代码片段
- 新建特定于语言的全局代码片段

![选择代码片段范围](/static/posts/2018-11-19-21-03-44.png)

根据你的需要选择一个范围：

- 比如你需要在任何文件中都能够使用的代码片段，那么选择全局代码片段。
- 比如你需要仅在当前工作区生效的代码片段（*例如我写博客是才会用到的博客片段*），那么选择工作区代码片段。
- 如果是特定于语言的，那么选择自己需要的语言。

在新建全局代码片段和当前工作区的代码片段的时候，是需要自己指定名称的。

![指定代码片段的名称](/static/posts/2018-11-19-21-11-08.png)  
▲ 指定代码片段的名称

## 编写代码片段

无论你使用哪种方式新建代码片段，Visual Studio Code 都会帮你打开这个代码片段文件。整个文件一开始是被注释的状态，就像下面这样：

```json
{
	// Place your global snippets here. Each snippet is defined under a snippet name and has a scope, prefix, body and 
	// description. Add comma separated ids of the languages where the snippet is applicable in the scope field. If scope 
	// is left empty or omitted, the snippet gets applied to all languages. The prefix is what is 
	// used to trigger the snippet and the body will be expanded and inserted. Possible variables are: 
	// $1, $2 for tab stops, $0 for the final cursor position, and ${1:label}, ${2:another} for placeholders. 
	// Placeholders with the same ids are connected.
	// Example:
	// "Print to console": {
	// 	"scope": "javascript,typescript",
	// 	"prefix": "log",
	// 	"body": [
	// 		"console.log('$1');",
	// 		"$2"
	// 	],
	// 	"description": "Log output to console"
	// }
}
```

上面的注释，翻译一下是这样的：

可以将你的全局代码片段放到这里。每一个代码片段都由一个名称来定义，其值包含此代码片段的作用域(scope)、前缀(prefix)、代码片段的内容(body)与其描述信息(description)组成。
- scope 字段中填写以逗号分隔的作用域 Id，如果 scope 字段为空或根本没有设置，那么将适用于所有语言。
- prefix 是用于触发代码片段的一段文字，当你输入这个文字的时候，你将可以展开这个代码片段的内容并将其插入。
- body 你可以使用 $1 $2 来作为按下 Tab 时将切换的键盘焦点区域，$0 是插入完成后最终光标所在的位置。你也可以使用 ${1:label} 或 ${2:another} 这样的方式来增加占位符，同样 Id 的占位符将会自动关联起来。

例如，我通过以下代码片段来为我插入博客的目录：

```json
{
	"Add toc to post": {
		"scope": "markdown",
		"prefix": "toc",
		"body": [
			"@[TOC](${1:walterlv 的目录})",
			"$0"
		],
		"description": "添加 walterlv 的博客的目录"
	}
}
```

## 插入代码片段

那么现在按下 F1 打开快捷命令输入框进入 Insert Snippet 命令，输入 `toc` 可以看到我们刚刚加入的代码片段：

![插入代码片段](/static/posts/2018-11-20-08-01-22.png)

![toc 片段](/static/posts/2018-11-20-08-10-05.png)

或者，在带有智能感知提示的文件中，可以直接通过智能感知提示插入：

![通过智能感知提示插入](/static/posts/2018-11-20-08-12-39.png)

在插入的代码片段中，`${1:walterlv 的目录}` 会成为我们的第一个占位符，而且默认文字就是 `walterlv 的目录`。

![占位符效果](/static/posts/2018-11-20-08-03-55.png)

需要注意的是，Visual Studio Code 中 Markdown 默认是没有打开智能感知提示的。你需要在你的工作区或者全局打开它。

默认是这样的：

```json
{
  // Configure editor settings to be overridden for [markdown] language.
  "[markdown]": {
    "editor.wordWrap": "on",
    "editor.quickSuggestions": false
  }
}
```

你需要把 `editor.quickSuggestions` 设置为 `true`。

```json
{
  "[markdown]": {
      "editor.quickSuggestions": true
  }
}
```

## 一个更复杂的例子

现在，我们来做一个更复杂的例子，以便了解 Visual Studio Code 中代码片段定义的更多内容。

输入 `post` 以便插入 [blog.walterlv.com](/) 专用的博客模板：

![插入博客](/static/posts/2018-11-20-08-34-19.png)

在模板中，我们的的第一个焦点文字是标题，于是我们可以立刻输入博客标题：

![博客标题占位符](/static/posts/2018-11-20-08-54-35.png)  
▲ 博客标题占位符

当写完后按下 Tab 换到下一个占位符时，可以选择一些常用的选项：

![选择博客分类](/static/posts/2018-11-20-08-56-11.png)  
▲ 选择博客分类

而最后，焦点会落到博客摘要处：

![最后的焦点在博客摘要](/static/posts/2018-11-20-08-56-55.png)  
▲ 最后的焦点在博客摘要

顺便的，你可能没有注意到还有博客时间。就是那个 `date` 字段为空或根本没有设置，那么将适用于所有语言。

是的 **代码片段中可以插入时间** 和其他各种变量。

而这样的一个模板，配置文件是这样的：

```json
{
	"Insert a post for blog.walterlv.com": {
		"scope": "markdown",
		"prefix": "post",
		"body": [
			"---",
			"title: \"${1:在此处添加标题}\"",
			"date: ${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE} ${CURRENT_HOUR}:${CURRENT_MINUTE}:${CURRENT_SECOND} +0800",
			"tags: ${2|dotnet,csharp,uwp|}",
			"---",
			"",
			"${0:在此处编辑 blog.walterlv.com 的博客摘要}",
			"",
			"---",
			"",
			"@[TOC](本文内容)",
			"",
			"## 标题",
			"",
			"---",
			"",
			"**参考资料**"
		],
		"description": "使用 blog.walterlv.com 专用的博客模板"
	}
}
```

接下来我们就来说说这是怎么做出来的。

## 关于代码片段编写的更多细节

### 关于文件名称

在阅读前面的博客内容时，你可能注意到了：添加全局代码片段的时候，文件扩展名为 `.code-snippets`，例如 blog.code-snippets；添加语言特定的代码片段的时候，扩展名为 `.json`，如 markdown.json。这个规则无论在全局还是在工作区，都是一样适用的。

### 光标停留点（Tabstop）

使用 `$1` `$2` 这些可以作为按下 Tab 键时的光标停留位置，而 `$0` 无论出现在代码片段的哪个地方，都会是最后一个光标位置。

### 占位符

`${1:占位符 Id}` 可以表示一个占位符。当你插入此代码片段的时候，会出现 `占位符 Id` 字样，然后光标会选中这几个字以便你进行修改。

占位符可以嵌套，例如 `${1:walterlv 的 ${2:嵌套占位符}}`。这时，光标会首先选中所有的文字，随后按下 Tab 之后选中后面那一部分。

在前面那个比较复杂的博客代码片段中，`${1:在此处添加标题}` 就是一个占位符，而 `${0:在此处编辑 blog.walterlv.com 的博客摘要}` 就是光标的最终停留点。

### 下拉选项

使用 `${1|选项 1,选项 2,选项 3|}` 可以创建三个选项的下拉框。

在前面的博客代码片段中，`${2|dotnet,csharp,uwp|}` 就是一个下拉选框，帮助我选择常用的一些博客类别。

### 变量

使用 `$变量名` 或者 `${变量名:变量的默认值}` 可以创建变量。

在 Visual Studio Code 中，你有这些变量可以使用：

-`TM_SELECTED_TEXT`
	- 在插入代码片段的时刻选中的文本
-`TM_CURRENT_LINE`
	- 在插入代码片段的时刻光标所在的行
-`TM_CURRENT_WORD`
	- 在插入代码片段的时刻光标所在的词
-`TM_LINE_INDEX`
	- 在插入代码片段的时刻的行号（0 为首行）
-`TM_LINE_NUMBER`
	- 当前文档的总行数
-`TM_FILENAME`
	- 当前文档的文件名称
-`TM_FILENAME_BASE`
	- 当前文档不含扩展名的名称
-`TM_DIRECTORY`
	- 当前文档所在的文件夹
-`TM_FILEPATH`
	- 当前文档的完全路径
-`CLIPBOARD`
	- 剪贴板中的内容
-`CURRENT_YEAR`
	- 年
-`CURRENT_YEAR_SHORT`
	- 两位数字显示的年
-`CURRENT_MONTH`
	- 月，如 02
-`CURRENT_MONTH_NAME`
	- 月的英文名称，如 July
-`CURRENT_MONTH_NAME_SHORT`
	- 月的英文缩写，如 Jul
-`CURRENT_DATE`
	- 日
-`CURRENT_DAY_NAME`
	- 星期的英文名称，如 Monday
-`CURRENT_DAY_NAME_SHORT`
	- 星期的英文缩写，如 Mon
-`CURRENT_HOUR`
	- 24 小时制的时
-`CURRENT_MINUTE`
	- 分
-`CURRENT_SECOND`
	- 秒

所以在上面比较复杂的博客模板中，我们可以直接插入当前的时间 `${CURRENT_YEAR}-${CURRENT_MONTH}-${CURRENT_DATE} ${CURRENT_HOUR}:${CURRENT_MINUTE}:${CURRENT_SECOND} +0800`。

这个时间我之前也在输入法中调过：[常用输入法快速输入自定义格式的时间和日期（搜狗/QQ/微软拼音）](/post/ime-date-time-format)。

---

**参考资料**

- [Creating your own snippets in Visual Studio Code](https://code.visualstudio.com/docs/editor/userdefinedsnippets)


