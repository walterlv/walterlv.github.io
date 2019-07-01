---
title: "如果不用 ReSharper，那么 Visual Studio 2019 能还原 ReSharper 多少功能呢？"
date: 2019-06-24 08:00:38 +0800
categories: visualstudio dotnet csharp
position: knowledge
---

本文只谈论 ReSharper 的那些常用功能中，Visual Studio 2019 能还原多少，主要提供给那些正在考虑不使用 ReSharper 插件的 Visual Studio 用户作为参考。毕竟 ReSharper 如此强大的功能是建立在每年缴纳不少的费用以及噩梦般占用 Visual Studio 性能的基础之上的。然而使用 Visual Studio 2019 社区版不搭配 ReSharper 则可以免费为开源社区做贡献。

---

<div id="toc"></div>

本文的内容分为三个部分：

1. Visual Studio 能完全还原的 ReSharper 的功能
    - 可能 Visual Studio 在此功能上已经追赶上了 ReSharper
    - 可能 Visual Studio 在此功能上虽然依然不如 ReSharper 完善，但缺少的部分几乎不影响体验
    - 可能 Visual Studio 此功能比 ReSharper 更胜一筹
1. Visual Studio 能部分还原 ReSharper 的功能
    - 可能在多数场景中 Visual Studio 能获得 ReSharper 的此功能效果，在少数场景下不如 ReSharper
    - 可能对多数人来说 Visual Studio 能获得 ReSharper 的此功能效果，对另一部分人来说无法替代 ReSharper
    - 有可能 Visual Studio 在此功能上另辟蹊径比 ReSharper 更厉害，但综合效果不如 ReSharper
    - Visual Studio 此功能依然很弱，但可以通过安装免费的插件的方式补足
1. Visual Studio 此功能依然比不上 ReSharper
    - 可能是 Visual Studio 没有此功能
    - 可能是 Visual Studio 此功能的实现方式上不如 ReSharper 快速、高效、简单

## 完美还原

### 无处不在的智能感知提示

默认情况下，Visual Studio 只在你刚开始打字或者输入 `.` 和 `(` 的时候才出现智能感知提示，但是如果你使用 ReSharper 开发，你会发现智能感知提示无处不在（所以那么卡？）。

实际上你也可以配置 Visual Studio 的智能感知在更多的情况下出现，请打开下面“工具”->“选项”->“文本编辑器”->“C#”->“IntelliSense”：

![打开更多的智能感知提示时机](/static/posts/2019-06-24-07-56-52.png)

打开“键入字符后显示完成列表”和“删除字符后显示完成列表”。这样，你只要正在编辑，都会显示智能感知提示。

### 在输入时即自动导入需要的命名空间

ReSharper 的智能感知提示包含所依赖的各种程序集中的类型，然而 Visual Studio 的智能感知则没有包含那些，只有顶部写了 `using` 的几个命名空间中的类型。

Visual Studio 2019 中可以设置智能感知提示中“显示未导入命名空间中的项”。默认是没有开启的，当开启后，你将直接能在智能感知提示中看到原本 ReSharper 中才能有的编写任何类型的体验。

![智能感知中包含尚未导入的类型](/static/posts/2019-06-23-14-16-33.png)

默认情况下输入未知类型时只能完整输入类名然后使用重构快捷键将命名空间导入：

![只能通过重构导入命名空间](/static/posts/2019-06-23-14-21-06.png)

但开启了此选项后，只需要输入类名的一部分，哪怕此类型还没有写 `using` 将其导入，也能在智能感知提示中看到并且完成输入。

![可以导入命名空间的智能感知提示](/static/posts/2019-06-23-14-22-28.png)

## 可以还原

正在填坑……

## 依然不足

### 提取局部变量

在 ReSharper 中，选中一段代码，如果这段代码可以返回一个值，那么可以使用重构快捷键（默认 Alt+Enter）生成一个局部变量。如果同样带代码块在此方法体中有多处，那么可以同时将多处代码一并提取出来成为一个布局变量。

然而在 Visual Studio 中执行同样的操作，使用重构快捷键（默认 Ctrl+. 可以改为 Alt+Enter）则只能提取方法。
