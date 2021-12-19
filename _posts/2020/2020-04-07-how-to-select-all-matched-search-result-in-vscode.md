---
title: "VSCode：当匹配到结果时，如何一次性全部选中操作（复制/删除）？"
publishDate: 2020-04-07 11:09:54 +0800
date: 2020-04-07 20:48:11 +0800
tags: vscode
position: knowledge
coverImage: /static/posts/2020-04-07-11-04-56.png
permalink: /post/how-to-select-all-matched-search-result-in-vscode.html
---

最近需要处理几十万行的文字，然后提取出数千行（嗯，我在做输入法词库）。在 VSCode 里我用正则匹配到了想要的结果后，如何能够快速把这些行提取出来呢？

---

其实非常简单，Alt + Enter 即可选中所有已经匹配到的文字。

来，我们看这个具体的例子：

这里有一个几十万行的词库，我需要将其中的英文部分提取出来做成单独的词库。于是我使用正则表达式，匹配到所有英文词。

![匹配文字](/static/posts/2020-04-07-11-04-56.png)

接着，按下 Alt + Enter 我就可以复制出所有的已匹配的词。将其粘贴出来即形成新的纯英文词库。

![已选中文字](/static/posts/2020-04-07-11-08-48.png)

![新的词库文件](/static/posts/2020-04-07-11-09-39.png)


