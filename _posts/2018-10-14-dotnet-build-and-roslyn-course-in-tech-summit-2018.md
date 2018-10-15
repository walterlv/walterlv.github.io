---
title: "预编译框架，开发高性能应用 - 课程 - 微软技术暨生态大会 2018"
publishDate: 2018-10-14 21:16:48 +0800
date: 2018-10-15 08:39:08 +0800
categories: dotnet csharp msbuild roslyn visualstudio nuget
---

微软技术暨生态大会（Tech Summit），2018 年在上海世博中心召开。这是最后一次的 Tech Summit 了；明年开始，中国大陆地区就要和其他国家和地区一样，进行全球 Ignite Tour 了。

我也有幸成为分会场讲师团队的一员，课程是《预编译框架 - 开发高性能应用》。内容就是我博客中与 MSBuild / Roslyn / dotnet / NuGet 相关的内容；我们将利用这些知识打造一个高性能客户端应用。

---

[![微软技术暨生态大会](/static/posts/2018-10-14-20-08-21.png)](https://www.microsoft.com/china/techsummit/2018/)

进入 [微软技术暨生态大会](https://www.microsoft.com/china/techsummit/2018/) 官网可以了解更多内容。如果你和我一样对微软技术富有热情，那么也欢迎你 [买票](http://www.mstechsummit.cn/Ticket/BuyTicket) 一起去上海。

### 关于课程《预编译框架 - 开发高性能应用》

利用 Roslyn 在编译期间提前完成收集和修改所需的各种信息，我们能将 .NET 的反射耗时降低到近乎为 0！
当前大多数的框架都离不开反射的支持，但是 .NET 的反射很伤性能，而不用反射又很难支撑大型应用；基于 Roslyn 的预编译框架旨在解决这些性能问题。

本次讲题能学到什么？

1. 体验预编译框架的强大性能
2. 理解 dotnet build 的编译过程
3. 使用 Roslyn 分析和修改项目源代码
4. 如何开发自己的预编译框架
5. 制作源代码引用 NuGet 包（而不是 dll 引用 NuGet 包）

其实此课程的计划课程内容有 2.5 小时，毕竟博客都有好几十篇了呢。算上跟我一起研究这项技术的 [林德熙的与 Roslyn 相关的博客](https://lindexi.gitee.io/lindexi/post/roslyn.html)，那就更多了，而且还在持续增加中。

不过实际分会场课程中内容众多，留给每个讲师的时间只有 20 分钟或者 45 分钟。我有幸获得了 45 分钟时长的课程，所以虽然已经算长的了，却也必须减少和压缩课程内容。

于是，实际课程会以入门为主，进阶内容将作为资料线下学习。注意：即便是“入门”，难度也依然是 300（难度范围为 0-400），所以你必须拥有一定的 .NET 开发知识和一些应用开发经验才会理解课程内容。如果你的经验更偏客户端应用开发，那么更能体会本课程内容的目的。

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

---

### 相关链接

#### SourceYard 源码包

- [将 .NET Core 项目打一个最简单的 NuGet 源码包，安装此包就像直接把源码放进项目一样 - 吕毅](https://walterlv.com/post/the-simplest-way-to-pack-a-source-code-nuget-package.html)
- [Roslyn 如何基于 Microsoft.NET.Sdk 制作源代码包 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E5%A6%82%E4%BD%95%E5%9F%BA%E4%BA%8E-Microsoft.NET.Sdk-%E5%88%B6%E4%BD%9C%E6%BA%90%E4%BB%A3%E7%A0%81%E5%8C%85.html)

#### SourceFusion 预编译框架

- [理解 C# 项目 csproj 文件格式的本质和编译流程 - 吕毅](https://walterlv.com/post/understand-the-csproj.html)
- [将 WPF、UWP 以及其他各种类型的旧 csproj 迁移成基于 Microsoft.NET.Sdk 的新 csproj - 吕毅](https://walterlv.com/post/introduce-new-style-csproj-into-net-framework.html)
- [新 csproj 对 WPF/UWP 支持不太好？有第三方 SDK 可以用！MSBuild.Sdk.Extras - 吕毅](https://walterlv.com/post/use-msbuild-sdk-extras-for-wpf-and-uwp.html)
- [如何使用 MSBuild Target（Exec）中的控制台输出 - 吕毅](https://walterlv.com/post/exec-task-of-msbuild-target.html)
- [如何在 MSBuild Target（Exec）中报告编译错误和编译警告 - 吕毅](https://walterlv.com/post/standard-error-warning-format.html)
- [在制作跨平台的 NuGet 工具包时，如何将工具（exe/dll）的所有依赖一并放入包中 - 吕毅](https://walterlv.com/post/include-dependencies-into-nuget-tool-package.html)
- [如何编写基于 Microsoft.NET.Sdk 的跨平台的 MSBuild Target（附各种自带的 Task） - 吕毅](https://walterlv.com/post/write-msbuild-target.html)
- [Roslyn 如何使用 MSBuild Copy 复制文件 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E5%A6%82%E4%BD%95%E4%BD%BF%E7%94%A8-MSBuild-Copy-%E5%A4%8D%E5%88%B6%E6%96%87%E4%BB%B6.html)
- [每次都要重新编译？太慢！让跨平台的 MSBuild/dotnet build 的 Target 支持差量编译 - 吕毅](https://walterlv.com/post/msbuild-incremental-build.html)
- [解读 Microsoft.NET.Sdk 的源码，你能定制各种奇怪而富有创意的编译过程 - 吕毅](https://walterlv.com/post/read-microsoft-net-sdk.html)
- [帮助官方 NuGet 解掉 Bug，制作绝对不会传递依赖的 NuGet 包 - 吕毅](https://walterlv.com/post/prevent-nuget-package-been-depended.html)
- [项目文件中的已知属性（知道了这些，就不会随便在 csproj 中写死常量啦） - 吕毅](https://walterlv.com/post/known-properties-in-csproj.html)
- [项目文件中的已知 NuGet 属性（使用这些属性，创建 NuGet 包就可以不需要 nuspec 文件啦） - 吕毅](https://walterlv.com/post/known-nuget-properties-in-csproj.html)
- [如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包 - 吕毅](https://walterlv.com/post/create-a-cross-platform-msbuild-task-based-nuget-tool.html)
- [如何创建一个基于命令行工具的跨平台的 NuGet 工具包 - 吕毅](https://walterlv.com/post/create-a-cross-platform-command-based-nuget-tool.html)
- [Roslyn 通过 Target 修改编译的文件 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E9%80%9A%E8%BF%87-Target-%E4%BF%AE%E6%94%B9%E7%BC%96%E8%AF%91%E7%9A%84%E6%96%87%E4%BB%B6.html)
- [Roslyn 使用 WriteLinesToFile 解决参数过长无法传入 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E4%BD%BF%E7%94%A8-WriteLinesToFile-%E8%A7%A3%E5%86%B3%E5%8F%82%E6%95%B0%E8%BF%87%E9%95%BF%E6%97%A0%E6%B3%95%E4%BC%A0%E5%85%A5.html)
- [Roslyn 如何在 Target 引用 xaml 防止文件没有编译 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E5%A6%82%E4%BD%95%E5%9C%A8-Target-%E5%BC%95%E7%94%A8-xaml-%E9%98%B2%E6%AD%A2%E6%96%87%E4%BB%B6%E6%B2%A1%E6%9C%89%E7%BC%96%E8%AF%91.html)
- [Roslyn 通过 nuget 统一管理信息 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E9%80%9A%E8%BF%87-nuget-%E7%BB%9F%E4%B8%80%E7%AE%A1%E7%90%86%E4%BF%A1%E6%81%AF.html)
- [Roslyn 使用 Target 替换占位符方式生成 nuget 打包 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E4%BD%BF%E7%94%A8-Target-%E6%9B%BF%E6%8D%A2%E5%8D%A0%E4%BD%8D%E7%AC%A6%E6%96%B9%E5%BC%8F%E7%94%9F%E6%88%90-nuget-%E6%89%93%E5%8C%85.html)
- [MSBuild/Roslyn 和 NuGet 的 100 个坑 - 吕毅](https://walterlv.com/post/problems-of-msbuild-and-nuget.html)
- [Roslyn 通过 Nuget 引用源代码 在 VS 智能提示正常但是无法编译 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E9%80%9A%E8%BF%87-Nuget-%E5%BC%95%E7%94%A8%E6%BA%90%E4%BB%A3%E7%A0%81-%E5%9C%A8-VS-%E6%99%BA%E8%83%BD%E6%8F%90%E7%A4%BA%E6%AD%A3%E5%B8%B8%E4%BD%86%E6%98%AF%E6%97%A0%E6%B3%95%E7%BC%96%E8%AF%91.html)
- [都是用 DllImport？有没有考虑过自己写一个 extern 方法？ - 吕毅](https://walterlv.com/post/write-your-own-extern-method.html)
- [.NET/C# 中你可以在代码中写多个 Main 函数，然后按需要随时切换 - 吕毅](https://walterlv.com/post/write-multiple-main-and-related-startup-codes.html)
- [Roslyn 入门：使用 Visual Studio 的语法可视化（Syntax Visualizer）窗格查看和了解代码的语法树 - 吕毅](https://walterlv.com/post/roslyn-syntax-visualizer.html)
- [Roslyn 静态分析 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E9%9D%99%E6%80%81%E5%88%86%E6%9E%90.html)
- [Roslyn 入门：使用 Roslyn 静态分析现有项目中的代码 - 吕毅](https://walterlv.com/post/analysis-code-of-existed-projects-using-roslyn.html)
- [Roslyn 入门：使用 .NET Core 版本的 Roslyn 编译并执行跨平台的静态的源码 - 吕毅](https://walterlv.com/post/compile-and-invoke-code-using-roslyn.html)
- [Roslyn 语法树中的各种语法节点及每个节点的含义 - 吕毅](https://walterlv.com/post/roslyn-syntax-tree-nodes.html)
- [Roslyn 通过 Nuget 管理公司配置 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E9%80%9A%E8%BF%87-Nuget-%E7%AE%A1%E7%90%86%E5%85%AC%E5%8F%B8%E9%85%8D%E7%BD%AE.html)
- [Roslyn 在项目文件使用条件判断 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E5%9C%A8%E9%A1%B9%E7%9B%AE%E6%96%87%E4%BB%B6%E4%BD%BF%E7%94%A8%E6%9D%A1%E4%BB%B6%E5%88%A4%E6%96%AD.html)

#### 更多 MSBuild / Roslyn / dotnet / NuGet 相关的知识

- [理解 Roslyn 中的红绿树（Red-Green Trees） - 吕毅](https://walterlv.com/post/the-red-green-tree-of-roslyn.html)
- [Roslyn 的确定性构建 - 吕毅](https://walterlv.com/post/deterministic-builds-in-roslyn.html)
- [Roslyn 节点的 Span 和 FullSpan 有什么区别 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E8%8A%82%E7%82%B9%E7%9A%84-Span-%E5%92%8C-FullSpan-%E6%9C%89%E4%BB%80%E4%B9%88%E5%8C%BA%E5%88%AB.html)
- [Roslyn NameSyntax 的 ToString 和 ToFullString 的区别 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-NameSyntax-%E7%9A%84-ToString-%E5%92%8C-ToFullString-%E7%9A%84%E5%8C%BA%E5%88%AB.html)
- [自动将 NuGet 包的引用方式从 packages.config 升级为 PackageReference - 吕毅](https://walterlv.com/post/migrate-packages-config-to-package-reference.html)
- [如何最快速地将旧的 NuGet 包 (2.x, packages.config) 升级成新的 NuGet 包 (4.x, PackageReference) - 吕毅](https://walterlv.com/post/migrate-nuget-package-from-powershell-to-props-and-targets.html)
- [阻止某个 NuGet 包意外升级 - 吕毅](https://walterlv.com/post/prevent-nuget-package-upgrade.html)
- [语义版本号（Semantic Versioning） - 吕毅](https://walterlv.com/post/semantic-version.html)
- [使用 MSBuild 响应文件 (rsp) 来指定 dotnet build 命令行编译时的大量参数 - 吕毅](https://walterlv.com/post/msbuild-response-files.html)
- [Roslyn 使用 Directory.Build.props 管理多个项目配置 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E4%BD%BF%E7%94%A8-Directory.Build.props-%E7%AE%A1%E7%90%86%E5%A4%9A%E4%B8%AA%E9%A1%B9%E7%9B%AE%E9%85%8D%E7%BD%AE.html)
- [Roslyn 使用 Directory.Build.props 文件定义编译 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E4%BD%BF%E7%94%A8-Directory.Build.props-%E6%96%87%E4%BB%B6%E5%AE%9A%E4%B9%89%E7%BC%96%E8%AF%91.html)
- [在 Visual Studio 的解决方案资源管理器中隐藏一些文件 - 吕毅](https://walterlv.com/post/make-items-invisible-in-vs-solution-explorer.html)
- [使用链接共享 Visual Studio 中的代码文件 - 吕毅](https://walterlv.com/visualstudio/2016/08/01/share-code-with-add-as-link.html)
- [为 Visual Studio 使用通配符批量添加项目文件 - 吕毅](https://walterlv.com/post/vs/2017/09/26/wildcards-in-vs-projects.html)
- [(1/2) 为了理解 UWP 的启动流程，我从零开始创建了一个 UWP 程序 - 吕毅](https://walterlv.com/post/create-uwp-app-from-zero-0.html)
- [dotnet core 通过修改文件头的方式隐藏控制台窗口 - 林德熙](https://lindexi.gitee.io/lindexi/post/dotnet-core-%E9%80%9A%E8%BF%87%E4%BF%AE%E6%94%B9%E6%96%87%E4%BB%B6%E5%A4%B4%E7%9A%84%E6%96%B9%E5%BC%8F%E9%9A%90%E8%97%8F%E6%8E%A7%E5%88%B6%E5%8F%B0%E7%AA%97%E5%8F%A3.html)
- [使用 GitVersion 在编译或持续构建时自动使用语义版本号（Semantic Versioning） - 吕毅](https://walterlv.com/post/automatically-semantic-versioning-using-git-version-task.html)
- [Automatically increase the semantic version using GitVersion - 吕毅](https://walterlv.com/post/automatically-semantic-versioning-using-git-version-task.en.html)
- [Reading the Source Code of Microsoft.NET.Sdk, Writing the Creative Extension of Compiling - 吕毅](https://walterlv.com/post/read-microsoft-net-sdk-en.html)
