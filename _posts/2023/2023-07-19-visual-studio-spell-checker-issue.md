---
title: "如何正确调教 Visual Studio 自带的拼写检查功能"
date: 2023-07-19 16:11:24 +0800
categories: visualstudio
position: problem
coverImage: /static/posts/2023-07-19-15-42-10.png
---

Visual Studio 2022 (17.6 Preview 2) 带来了拼写检查功能，此功能一出大家纷纷吐槽各种问题。不过团队中确实时不时会出现单词拼写错误的情况，所以有时又觉得非常需要它。

如果你打算在 Visual Studio 中好好使用这个自带的功能，那么可以阅读本文。对它有更多的了解之后，也许可以逐渐趋利避害。

---

<div id="toc"></div>

## 开启拼写检查功能

目前，拼写检查器功能仍然是预览功能，所以需要在 Visual Studio 的“工具”->“选项”菜单中找到“环境”->“预览功能”选项卡，然后找到“拼写检查器”功能，把它打开。

![拼写检查器功能开关](/static/posts/2023-07-19-15-42-10.png)

## 拼写检查和忽略单词

开启了 Visual Studio 拼写检查器功能后，如果再在代码中写出了错误的单词，则会视时给出下划线提醒。不过注意，这个提醒只是 IDE 的提醒，不会出现在项目编译过程的警告或信息中。

下图是对 embedding 单词的错误拼写进行了纠正。

![embedding 单词纠正](/static/posts/2023-07-19-15-41-44.png)

Visual Studio 的拼写检查器是基于字典的，这意味着必然存在一些专有/私有词汇会被误认为不正确。例如，我的名字“walterlv”。

这时，我们应该忽略这个拼写。在单词旁边的小灯泡上点击（使用重构快捷键可打开），然后选择“拼写：忽略"walterlv"”即可忽略这个单词的拼写。

![忽略 walterlv 的拼写](/static/posts/2023-07-19-15-43-05.png)

## 调教拼写检查器

### 全局忽略文件

Visual Studio 拼写检查器忽略功能的优点是，这个忽略是全局生效的，对所有已经打开的项目和未来打开的项目都生效；而缺点也同样是这个。（我其实比较期待有个全局忽略列表的前提下，可以在项目内增加一个项目特定的忽略列表。）

这个全局的忽略列表存在这个地方：

```plaintext
%LocalAppData%\Microsoft\VisualStudio\17.0_14b1edd8\exclusion.dic
```

如果你打开这个文件会发现很奇怪，每个单词的前面都有一个不可识别的字符。在 Visual Studio 和 Visual Studio Code 中打开这个文件可以发现这一点。

![在 Visual Studio 中发现每个单词前都有不可识别字符](/static/posts/2023-07-19-16-04-50.png)

具体这个字符是什么，我们可以使用十六进制查看工具查看：

![使用十六进制工具查看](/static/posts/2023-07-19-16-06-50.png)

可以注意到这个文件的：

- 每个单词前都有一段 `EF BB BF`，而这个是 UTF-8 的 BOM 头
- 每个单词后都有一个 `0D 0A`，而这个是 Windows 的换行符，对应 `\r\n`
- 文件的开头有两个 UTF-8 BOM 头

这几乎可以肯定是 Visual Studio 拼写检查器的 bug！！！在这个功能刚发布的时候，忽略单词并不会生效，可能与这个 bug 有关，不过好在后面即使有不符合预期的 BOM 头出现，也不会导致忽略单词不生效。

如果你是一个强迫症，那么可以把这个词典文件删除，新的 Visual Studio 生成的忽略文件已经不会再有 UTF-8 BOM 头了（包括文件开头的 BOM 头）。如果这个文件一直保留，那么新的 Visual Studio 写新的忽略单词也会包含这个 BOM 头。如果你不想删除，那么可以使用 Visual Studio Code 编辑手动去掉这些 BOM 头之后，保存为无 BOM 的 UTF-8 文件即可。

---

**参考资料**

- [Improving the Spell Checker - Visual Studio Blog](https://devblogs.microsoft.com/visualstudio/improving-the-spell-checker/)
- [Learn about the Spell Checker - Visual Studio (Windows) - Microsoft Learn](https://learn.microsoft.com/en-us/visualstudio/ide/text-spell-checker?view=vs-2022)

