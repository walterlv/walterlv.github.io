---
title: "在 WPF 中使用 x:Reference"
publishDate: 2018-10-13 22:24:02 +0800
date: 2018-12-14 09:54:00 +0800
tags: dotnet wpf
permalink: /posts/wpf-x-reference.html
---

x:Reference 是 XAML 2009 中引入的功能，也算是比较早的功能了；ElementName 是 XAML 一开始出现便开始有的功能。二者在使用时在感觉上是比较相似的，但多数情况下都更有优势。

本文将解释 x:Reference。

---

典型的使用 `x:Reference` 的例子是：

```xml
<object property="{x:Reference instancexName}" .../>
```

其中，`instancexName` 是另一个用 `x:Name` 指定名称的元素。

`x:Reference` 前面带了一个 `x` 命名空间前缀，所以可想而知这是与 `x:Name` 类似的 XAML 编译相关的标记。

在微软官方文档中描述为：

> In WPF and XAML 2006, element references are addressed by the framework-level feature of ElementName binding. For most WPF applications and scenarios, ElementName binding should still be used. Exceptions to this general guidance might include cases where there are data context or other scoping considerations that make data binding impractical and where markup compilation is not involved.

用中文来描述就是说：以前在 XAML 2006 的时候，使用 ElementName 在绑定中获得对应到元素的绑定源，而这能适用于大多数情况。不过，如果绑定上下文中拥有不同的命名边界，那么这时使用 ElementName 可能无法找到绑定源。这时可以使用 x:Reference 替代。

你可以阅读 [WPF 的 ElementName 在 ContextMenu 中无法绑定成功？试试使用 x:Reference！ - walterlv](/post/fix-wpf-binding-issues-in-context-menu) 了解 x:Reference 替代 ElementName 解决绑定中命名边界的问题。

另外，`ElementName` 是在运行时通过查找可视化树或逻辑树来确定名称边界（NameScope）的，所以一定程度上性能也不那么好。

---

**参考资料**

- [x:Reference Markup Extension - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/xaml-services/x-reference-markup-extension?wt.mc_id=MVP)
- [wpf - What is the difference between x:Reference and ElementName? - Stack Overflow](https://stackoverflow.com/q/19244111/6233938)
- [binding - When is x:Reference in WPF resolved and why does XAML element order affect it? - Stack Overflow](https://stackoverflow.com/q/14644924/6233938)
- [wpf – x：Reference和ElementName之间有什么区别？ - 代码日志](https://codeday.me/bug/20170930/78263.html)

