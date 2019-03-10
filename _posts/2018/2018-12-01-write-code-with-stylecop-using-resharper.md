---
title: "使用 ReSharper，输入即遵循 StyleCop 的代码格式化规范"
date: 2018-12-01 12:36:27 +0800
categories: visualstudio csharp dotnet
position: starter
---

StyleCop 可以帮助强制执行代码格式化规范，ReSharper 可以帮助你更高效地编写代码。把两者结合起来，你便能高效地编写符合团队强制格式化规范的代码来。

本文就介绍如何使用 ReSharper 来高效地遵循 StyleCop 的代码格式化规范。

---

<div id="toc"></div>

## 安装插件 StyleCop by JetBrains

StyleCop by JetBrains 插件的开发名称是 StyleCop.ReSharper，所以你也可以通过搜索 StyleCop.ReSharper 得到同样的插件。

![StyleCop by JetBrains](/static/posts/2018-12-01-09-42-41.png)  
▲ StyleCop by JetBrains 的图标

先安装 [StyleCop by JetBrains](https://resharper-plugins.jetbrains.com/packages/StyleCop.StyleCop/) 插件。注意这是 ReSharper 的插件，而不是 Visual Studio 的插件。你需要到 ReSharper 的 Extension Manager 中去下载。

![前往 ReSharper 的 Extension Manager](/static/posts/2018-12-01-09-23-40.png)  
▲ 前往 ReSharper 的 Extension Manager

在 ReSharper 自己的插件管理页面，搜索并安装 StyleCop by JetBrains 插件：

![搜索并安装 StyleCop by JetBrains](/static/posts/2018-12-01-09-35-52.png)  
▲ 搜索并安装 StyleCop by JetBrains

当你点击了窗口下面的那个“Install”按钮后，ReSharper 会弹出一个等待窗口一次性安装完毕。你需要等待，等待的时间取决于网速。

安装完之后，重启 Visual Studio 就会生效。如果你稍后见到了本节上面的图标，那么那实际上就是 StyleCop by JetBrains 插件的一部分。

## 修改 StyleCop by JetBrains 的规则

现在打开一个以前写的项目，你可能会发现大量的代码都已被波浪线入侵 😭 。

![代码已被波浪线入侵](/static/posts/2018-12-01-10-12-10.png)  
▲ 代码已被波浪线入侵，代码源自我的另一篇博客：[如何实现一个可以用 await 异步等待的 Awaiter](/post/write-custom-awaiter.html)。

如果你现在编写新的代码，你会发现新的代码已经开始使用 StyleCop 建议的规则了。不过，可能这个规则并不是你希望的规则，正如这张图所描述的那样：

> The documentation text within the param tag does not contain any whitespace between words, indicating that it most likely does not follow a proper grammatical structure required for documentation text. [StyleCp Rule: SA1630]

翻译过来：`param` 标记中的文档文本不包含任何单词之间的空格，表示它很可能不遵循文档文本所需的正确语法结构。`[StyleCp规则：SA1630]`。很明显，这一条 StyleCop 规则连中文都没有考虑过，中文文本怎么可能包含单词之间的空格呢 😂 。

所以，很明显我们需要定制我们自己的 StyleCop 规则。

在 ReSharper 的设置中找到 Code Inspection -> Inspection Serverity -> C# -> StyleCop。展开之后你就能看到 StyleCop by JetBrains 的规则定制了。

![定制规则](/static/posts/2018-12-01-11-52-48.png)  
▲ 定制规则

在这里，按照你的团队约定，将一项项的值设置为：

- 不遵守
- 提示
- 建议
- 警告
- 错误

![设置团队约定](/static/posts/2018-12-01-12-06-37.png)

## 不通用的 StyleCop by JetBrains 规则

实际上使用此插件生成的 StyleCop 规则并不是 StyleCop 的通用配置，而是生成了一个 DotSettings 的 ReSharper 配置。

如果需要使用到通用配置，请阅读 [在 Visual Studio 中使用 StyleCop 来约束团队代码规范](/post/introduce-stylecop-into-teams.html)。

---

**参考资料**

- [StyleCop code style settings and inspections - .NET Tools Blog.NET Tools Blog](https://blog.jetbrains.com/dotnet/2018/04/09/stylecop-code-style-settings-inspections/)
- [ReSharper Gallery - StyleCop by JetBrains](https://resharper-plugins.jetbrains.com/packages/StyleCop.StyleCop/)
