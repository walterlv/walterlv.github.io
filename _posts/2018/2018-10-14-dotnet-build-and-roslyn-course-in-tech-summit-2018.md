---
title: "课程 预编译框架，开发高性能应用 - 微软技术暨生态大会 2018"
publishDate: 2018-10-14 21:16:48 +0800
date: 2018-10-19 13:24:10 +0800
categories: dotnet csharp msbuild roslyn visualstudio nuget
---

微软技术暨生态大会（Tech Summit），2018 年在上海世博中心召开。这是最后一次的 Tech Summit 了；明年开始，中国大陆地区就要和其他国家和地区一样，进行全球 Ignite Tour 了。

我也有幸成为分会场讲师团队的一员，课程是《预编译框架 - 开发高性能应用》。内容就是我博客中与 MSBuild / Roslyn / dotnet / NuGet 相关的内容；我们将利用这些知识打造一个高性能客户端应用。

---

[![微软技术暨生态大会](/static/posts/2018-10-14-20-08-21.png)](https://www.microsoft.com/china/techsummit/2018/)

进入 [微软技术暨生态大会](https://www.microsoft.com/china/techsummit/2018/) 官网可以了解更多内容。如果你和我一样对微软技术富有热情，那么也欢迎你 [买票](http://www.mstechsummit.cn/Ticket/BuyTicket) 一起去上海。

### 关于课程《预编译框架 - 开发高性能应用》

时间：2018 年 10 月 27 日 11:00-11:45
代号：DEV306
难度：L300

利用 Roslyn 在编译期间提前完成收集和修改所需的各种信息，我们能将 .NET 的反射耗时降低到近乎为 0！
当前大多数的框架都离不开反射的支持，但是 .NET 的反射很伤性能，而不用反射又很难支撑大型应用；基于 Roslyn 的预编译框架旨在解决这些性能问题。

本次讲题能学到什么？

1. 体验预编译框架的强大性能
2. 理解 dotnet build 的编译过程
3. 使用 Roslyn 分析和修改项目源代码
4. 如何开发自己的预编译框架
5. 制作源代码引用 NuGet 包（而不是 dll 引用 NuGet 包）

其实此课程的计划课程内容有 2.5 小时，毕竟博客都有好几十篇了呢。算上跟我一起研究这项技术的 [林德熙的与 Roslyn 相关的博客](https://blog.lindexi.com/post/roslyn.html)，那就更多了，而且还在持续增加中。不过实际分会场课程中内容众多，留给每个讲师的时间只有 45 分钟，必须减少和压缩课程内容。

于是，实际课程会以入门为主，进阶内容将作为资料线下学习。注意：即便是“入门”，难度也依然是 L300（难度范围为 L100-L400），所以你必须拥有一定的 .NET 开发知识和一些应用开发经验才会理解课程内容。如果你的经验更偏客户端应用开发，那么更能体会本课程内容的目的。

额外的，彩排在 26 号 9:40-10:00。

### 课程大纲

课程大纲是为 2 小时的课程而设计的。所以实际上我只会讲大部分内容，以下所有动手实验和演示的地方都会略过，代之以提前运行和编写的结果。

*实际课程中会略过的部分以斜体表示*。

- 引入
    - 一批性能数据
        - 收集：反射 VS 配置文件 VS 预编译
        - 调用：直接调用 VS 最快反射 VS 预编译
        - 程序集个数：1 个 VS ……
- 概览
    - 目录
        - 了解源码包 SourceYard 和预编译框架 SourceFusion
        - 学会编写编译期代码以提升应用性能
    - 预编译框架的原理
    - 多个 API 的展示
        - 源码包
        - *编译期类*
        - 类模板
        - *扩展*
- 教学
    - 目标：学会使用编译期代码代替反射以提升应用的执行性能
    - 教学目录
        - 理解 dotnet build 的编译过程
            - 理解 csproj 文件格式
            - 理解编译过程
            - 理解 NuGet 打包原理
        - *动手实验：SourceYard 源码包简化版*
            - *编译期间执行一个 exe 程序*
            - *在 exe 程序中接收参数并干预编译结果*
        - 学习使用 Roslyn 分析源代码
            - 语法可视化窗格
            - 分析 C# 语法树
            - 在编译期间执行代码
        - *动手实验：SourceFusion 预编译框架简化版*
            - *在编译期间收集程序集中具有特定标记的所有类型*
            - *生成代码以快速访问这些类型的特定方法*
- 回顾
    - 回顾 dotnet build 的编译过程和 Roslyn 分析源码
    - SourceYard 和 SourceFusion 的开源仓库，欢迎加入

### 关于讲师 —— 吕毅

你可以进入 [微软技术暨生态大会 - 大会日程](https://www.mstechsummit.cn/SpeakerSession/Index) 页面，然后点击 “演讲嘉宾”。

![演讲嘉宾](/static/posts/2018-10-14-20-25-57.png)

在这里，你可以看到主题演讲、分会场课程以及动手实验室的各位讲师，可以去了解每一位讲师以及他们的课程。当然，你也可以看到我。

![讲师页面](/static/posts/2018-10-14-20-24-49.png)

### 欢迎你的加入

最后，欢迎你一起参加微软技术暨生态大会，我们一起去与微软大咖，各位微软 MVP，社区技术牛人交流技术。

- [购票](http://www.mstechsummit.cn/Ticket/BuyTicket)
- [微软粉丝之夜报名（目前名额已满）](https://forms.office.com/Pages/ResponsePage.aspx?id=-mDpt2weQ0S0nX_yMOmiFX9DC0n9uYxEjysPXp0Mf7tURjBRVllaWklWU1NTU1NaVUs0TTdOR1VFTC4u&from=groupmessage&isappinstalled=0)

课程课件使用 [希沃白板 5](https://easinote.seewo.com/) 制作，这是一款专门针对教学场景设计的互动课件工具。

![希沃白板 5](/static/posts/2018-10-14-20-33-17.png)

### 相关链接

由于相关文章太多，所以重新整理到以下新的文章中：

- [从零开始学习 dotnet 编译过程和 Roslyn 源码分析 - 吕毅](/post/posts-for-learning-dotnet-build-nuget-roslyn.html)

### 更多课程

- [Microsoft Tech Summit 2018 课程简述：利用 Windows 新特性开发出更好的手绘视频应用 - shaomeng - 博客园](http://www.cnblogs.com/shaomeng/p/9769270.html)
    - 时间：2018 年 10 月 27 日 17:00-17:45
    - 讲师：邵猛
    - 代号：NUE204
