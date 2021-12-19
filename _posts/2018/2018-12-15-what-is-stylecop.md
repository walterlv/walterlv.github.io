---
title: "StyleCop 是什么，可以帮助团队带来什么价值？"
date: 2018-12-15 16:14:38 +0800
tags: dotnet csharp visualstudio
position: knowledge
permalink: /post/what-is-stylecop.html
---

StyleCop 本质上是一个 C# 源代码规则分析器，可以帮助团队成员强制执行一组代码样式和一致性规则。

本文将简述 StyleCop 以及它能为团队带来的价值。

---

<div id="toc"></div>

## StyleCop 是什么？

StyleCop 本质上是一个 C# 源代码规则分析器，可以帮助团队成员强制执行一组代码样式和一致性规则。

划重点 —— “**强制**”。只要你愿意，你甚至可以让多写了一个空格的小伙伴无法成功编译项目！！！

## StyleCop 能做什么，不能做什么？

实际在团队中使用的时候，StyleCop 有三种不同的方式为我们所用：

1. 作为静态检查工具检查代码格式化规范；
1. 作为编写代码时的自动格式化规则；
1. 作为 API 扩展自定义的源代码检查的规则。

不过，StyleCop 没有原生提供可以帮助辅助编写符合 StyleCop 规则的代码的工具或插件。也就是说，如果你希望编写出符合 StyleCop 规范的代码，那么你可能需要手工编写，调整格式。

如果你的团队所有成员都是用 ReSharper，那么可以将 StyleCop 的规则也配置一遍到 ReSharper 中，这样编写时便可以符合 StyleCop 中定义的规范。

关于使用 ReSharper 编写符合 StyleCop 规范的代码，可以参见：[使用 ReSharper，输入即遵循 StyleCop 的代码格式化规范](/post/write-code-with-stylecop-using-resharper)。

## StyleCop 的优势和价值

StyleCop 的最大优势在于其“**强制性**”。无论你使用哪种 IDE 进行开发，由于其检查过程可以嵌入到编译过程中，所以如果你开发出不符合 StyleCop 规范要求的代码，直接可以无法成功编译项目。对于格式或其他代码风格要求非常高的项目，可以持续保持项目的一致性。

