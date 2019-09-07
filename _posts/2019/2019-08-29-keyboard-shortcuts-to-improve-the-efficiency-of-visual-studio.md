---
title: "提高使用 Visual Studio 开发效率的键盘快捷键"
publishDate: 2019-08-29 23:09:33 +0800
date: 2019-09-07 10:05:07 +0800
categories: visualstudio csharp
position: knowledge
---

Visual Studio 的功能可谓真是丰富，再配合各种各样神奇强大的插件，Visual Studio 作为太阳系最强大的 IDE 名副其实。

如果你能充分利用起 Visual Studio 启用这些功能的快捷键，那么效率也会很高。

---

<div id="toc"></div>
## 建议记住

| 功能             | 快捷键               | 建议修改成    |
| ---------------- | -------------------- | ------------- |
| 重构             | `Ctrl + .`           | `Alt + Enter` |
| 转到所有         | `Ctrl + ,`           | `Ctrl + N`    |
| 重命名           | `F2`                 |               |
| 打开智能感知列表 | `Ctrl + J`           | `Alt + 右`    |
| 注释             | `Ctrl + K, Ctrl + C` |               |
| 取消注释         | `Ctrl + K, Ctrl + U` |               |
| 保存全部文档     | `Ctrl + K, S`        |               |
| 折叠成大纲       | `Ctrl + M, Ctrl + O` |               |
| 展开所有大纲     | `Ctrl + M, Ctrl + P` |               |
| 加入书签         | `Ctrl + K, Ctrl + K` |               |
| 上一书签         | `Ctrl + K, Ctrl + P` |               |
| 下一书签         | `Ctrl + K, Ctrl + N` |               |
| 切换自动换行     | `Alt + Z`            |               |

## 万能重构

你可以不记住本文的其他任何快捷键，但这个你一定要记住，那就是：

![Ctrl + .](/static/posts/2019-08-29-19-03-27.png)

当然，因为中文输入法会占用这个快捷键，所以我更喜欢将这个快捷键修改一下，改成：

![Alt + Enter](/static/posts/2019-08-29-19-05-30.png)

修改方法可以参见：[如何快速自定义 Visual Studio 中部分功能的快捷键](/post/customizing-keyboard-shortcuts-in-visual-studio.html)。

它的功能是“快速操作和重构”。你几乎可以在任何代码上使用这个快捷键来快速修改你的代码。

比如修改命名空间：

![修改命名空间](/static/posts/2019-08-29-19-07-26.png)

比如提取常量或变量：

![提取常量](/static/posts/2019-08-29-19-11-16.png)

比如添加参数判空代码：

![参数判空](/static/posts/2019-08-29-20-18-16.png)

还有更多功能都可以使用此快捷键。而且因为 Roslyn 优秀的 API，有更多扩展可以使用此快捷键生效，详见：[基于 Roslyn 同时为 Visual Studio 插件和 NuGet 包开发 .NET/C# 源代码分析器 Analyzer 和修改器 CodeFixProvider](/post/develop-a-code-analyzer-for-both-nuget-and-visual-studio-extension.html)。

## 转到所有

不能每次都去解决方案里面一个个找文件，对吧！所以一个快速搜索文件和符号的快捷键也是非常能够提升效率的。

`Ctrl + ,` 转到所有（go to all）

不过我建议将其改成：

`Ctrl + N` 这是 ReSharper 默认的转到所有（Goto Everything）的快捷键

这可以帮助你快速找到整个解决方案中的所有文件或符号，看下图：

![转到所有](/static/posts/2019-09-07-09-07-22.png)

修改方法可以参见：[如何快速自定义 Visual Studio 中部分功能的快捷键](/post/customizing-keyboard-shortcuts-in-visual-studio.html)，下图是此功能的命令名称 `编辑.转到所有`（`Edit.GoToAll`）：

![编辑.转到所有](/static/posts/2019-09-07-10-04-24.png)

有一些小技巧：

- 你可以无需拼写完整个单词就找到你想要的符号
    - 例如输入 `mw` 就可以找到 `MainWindow`
- 对于两个以上单词拼成的符号，建议将每个单词的首字母输入成大写，这样可以提高目标优先级，更容易找到
    - 例如 `PrivateTokenManager`，如果希望干扰少一些，建议输入 `PTM` 而不是 `ptm`；当然想要更少的干扰，可以打更多的字母，例如 `priToM` 等等

注意到上面的界面里面右上角有一些过滤器吗？这些过滤器有单独的快捷键。这样就直接搜索特定类型的符号，而不是所有了，可以提高查找效率。

`Ctrl + O` 查找当前文件中的所有成员（只搜一个文件，这可以大大提高命中率）
`Ctrl + T` 转到符号（只搜类型名称、成员名称）
`Ctrl + G` 查找当前文件的行号（比如你在代码审查中看到一行有问题的代码，得知行号，可以迅速跳转到这一行）

## 重构

### 重命名

`F2`

![重命名](/static/posts/2019-08-29-22-03-48.png)

如果你在一个标识符上直接重新输入改了名字，也可以通过 `Ctrl + .` 或者 `Alt + Enter` 完成重命名。

### 其他

这些都可以被最上面的 `Ctrl + .` 或者 `Alt + Enter` 替代，因此都可以忘记。

`Ctrl + R, Ctrl + E` 封装字段  
`Ctrl + R, Ctrl + I` 提取接口  
`Ctrl + R, Ctrl + V` 删除参数  
`Ctrl + R, Ctrl + O` 重新排列参数  

## IntelliSense 自动完成列表

### 智能感知

IntelliSense 以前有个漂亮的中文名字，叫做“智能感知”，不过现在大多数的翻译已经与以前的另一个平淡无奇的功能结合到了一起，叫做“自动完成列表”。Visual Studio 默认只会让智能感知列表发挥非常少量的功能，如果你不进行一些配置，使用起来会“要什么没什么”，想显示却不显示。

请通过另一篇博客中的内容把 Visual Studio 的智能感知列表功能好好配置一下，然后我们才可以再次感受到它的强大（记得要翻到最后哦）：

- [通过设置启用 Visual Studio 默认关闭的大量强大的功能提升开发效率](/post/let-visual-studio-empower-more-by-change-some-settings.html)

如果还有一些时机没有打开智能感知列表，可以配置一个快捷键打开它，我这边配置的快捷键是 `Alt + 右`。

![设置打开智能感知的快捷键](/static/posts/2019-08-29-20-23-29.png)

### 参数信息

`Ctrl + Shift + 空格`

显示方法的参数信息。

![显示参数信息](/static/posts/2019-08-29-21-58-48.png)

默认在输入参数的时候就已经会显示了；如果错过了，可以在输入 `,` 的时候继续出现；如果还错过了，可以使用此快捷键出现。

## 编写

### 代码格式化

`Ctrl + K, Ctrl + E` 全文代码清理（包含全文代码格式化以及其他功能）
`Shift + Alt + F` 全文代码格式化
`Ctrl + K, Ctrl + F` 格式化选定的代码

关于代码清理，你可以配置做哪些事情：

![配置代码清理](/static/posts/2019-08-29-22-14-15.png)

![配置代码清理](/static/posts/2019-08-29-22-15-06.png)

### 其他

`Ctrl + K, Ctrl + /` 将当前行注释或取消注释  
`Ctrl + K, Ctrl + C` 将选中的代码注释掉  
`Ctrl + K, Ctrl + U` 或 `Ctrl + Shift + /` 将选定的内容取消注释  

`Ctrl + U` 将当前选中的所有文字转换为小写（请记得配合 F2 重命名功能使用避免编译不通过）  
`Ctrl + ]` 增加行缩进  
`Ctrl + [` 减少行缩进  

`Ctrl + S` 保存文档
`Ctrl + K, S` 保存全部文档（注意按键，是按下 `Ctrl + K` 之后所有按键松开，然后单按一个 `S`）

## 导航

`Ctrl + F` 打开搜索面板开始强大的搜索功能  
`Ctrl + H` 打开替换面板，或展开搜索面板为替换面板  
`Ctrl + I` 渐进式搜索（就像 Ctrl + F 一样，不过不会抢焦点，搜索完按回车键即完成搜索，适合键盘党操作）  
`Ctrl + Shift + F` 打开搜索窗口（与 Ctrl + F 虽然功能重合，但两者互不影响，意味着你可以充分这两套搜索来执行两套不同的搜索配置）  
`Ctrl + Shift + H` 打开替换窗口（与 Ctrl + H 虽然功能重合，但两者互不影响，意味着你可以充分这两套替换来执行两套不同的替换配置）  
`Alt + 下` 在当前文件中，将光标定位到下一个方法  
`Alt + 上` 在当前文件中，将光标定位到上一个方法  

`Ctrl + M, Ctrl + M` 将光标当前所在的类/方法切换大纲的展开或折叠  
`Ctrl + M, Ctrl + L` 将全文切换大纲的展开或折叠（如果当前有任何大纲折叠了则全部展开，否则全部折叠）  
`Ctrl + M, Ctrl + P` 将全文的大纲全部展开  
`Ctrl + M, Ctrl + U` 将光标当前所在的类/方法大纲展开  
`Ctrl + M, Ctrl + O` 将全文的大纲都折叠到定义那一层  

`Ctrl + D` 查找下一个相同的标识符，然后放一个新的[脱字号][Caret]（*或者称作输入光标*）（多次点按可以在相同字符串上出很多光标，可以一起编辑，如下图）
`Ctrl + Insert` 查找所有相同的标识符，然后全部放置[脱字号][Caret]（如下图）

![多个脱字号](/static/posts/2019-08-29-22-40-42.png)

[脱字号][Caret] 是 Visual Studio 中对于输入光标的称呼，对应英文的 Caret。

## 书签

`Ctrl + K, Ctrl + K` 为当前行加入到书签或从书签中删除
`Ctrl + K, Ctrl + P` 切换到上一个书签
`Ctrl + K, Ctrl + N` 切换到下一个书签
`Ctrl + K, Ctrl + L` 删除所有书签（会有对话框提示的，不怕误按）

如果配合书签面板，那么可以在调查问题的时候很方便在找到的各种关键代码处跳转，避免每次都寻找。

![配合书签面板](/static/posts/2019-08-29-22-48-30.png)

另外，还有个任务列表，跟书签列表差不多的功能：

`Ctrl + K, Ctrl + H` 将当前代码加入到任务列表中或者从列表中删除（效果类似编写 `// TODO`）

![任务列表](/static/posts/2019-08-29-22-54-41.png)

## 显示

`Ctrl + R, Ctrl + W` 显示空白字符  
`Alt + Z` 切换自动换行和单行模式  

![显示空白字符](/static/posts/2019-08-29-22-18-57.png)

[Caret]: https://zh.wikipedia.org/zh/%E8%84%B1%E5%AD%97%E7%AC%A6
