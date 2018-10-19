---
title: "从零开始学习 dotnet 编译过程和 Roslyn 源码分析"
date: 2018-10-19 13:27:48 +0800
categories: dotnet csharp msbuild roslyn visualstudio nuget
---

本文整理我和 [林德熙](https://lindexi.gitee.io/) 学习的 dotnet 编译知识、Roslyn 源码分析知识，NuGet 知识。通过阅读本文可以从零散的碎片化博客中得到从零开始学习的轨迹。

本文服务于 [微软技术暨生态大会 2018 课程](https://walterlv.com/post/dotnet-build-and-roslyn-course-in-tech-summit-2018.html)，你可以学习预编译框架相关的技术原理。

---

### SourceYard 性能数据

SourceYard 通过将公共组件的源代码和产品源代码合并来提升性能。

以下是这部分的性能数据：

- [C# 程序集数量对软件启动性能的影响](https://lindexi.gitee.io/lindexi/post/C-%E7%A8%8B%E5%BA%8F%E9%9B%86%E6%95%B0%E9%87%8F%E5%AF%B9%E8%BD%AF%E4%BB%B6%E5%90%AF%E5%8A%A8%E6%80%A7%E8%83%BD%E7%9A%84%E5%BD%B1%E5%93%8D.html)

不过，程序集中的类的数量对启动性能没有影响：

- [C# 直接创建多个类和使用反射创建类的性能](https://lindexi.gitee.io/lindexi/post/C-%E7%9B%B4%E6%8E%A5%E5%88%9B%E5%BB%BA%E5%A4%9A%E4%B8%AA%E7%B1%BB%E5%92%8C%E4%BD%BF%E7%94%A8%E5%8F%8D%E5%B0%84%E5%88%9B%E5%BB%BA%E7%B1%BB%E7%9A%84%E6%80%A7%E8%83%BD.html)

### SourceFusion 性能数据

SourceFusion 的其中一个用途是收集原本会通过反射收集的类型信息。

以下是这部分的性能数据：

- [C# 性能分析 反射 VS 配置文件 VS 预编译](https://lindexi.gitee.io/lindexi/post/C-%E6%80%A7%E8%83%BD%E5%88%86%E6%9E%90-%E5%8F%8D%E5%B0%84-VS-%E9%85%8D%E7%BD%AE%E6%96%87%E4%BB%B6-VS-%E9%A2%84%E7%BC%96%E8%AF%91.html)

额外的，如果不是收集而单单只是使用的话，这里是性能数据：

- [C# 直接创建多个类和使用反射创建类的性能](https://lindexi.gitee.io/lindexi/post/C-%E7%9B%B4%E6%8E%A5%E5%88%9B%E5%BB%BA%E5%A4%9A%E4%B8%AA%E7%B1%BB%E5%92%8C%E4%BD%BF%E7%94%A8%E5%8F%8D%E5%B0%84%E5%88%9B%E5%BB%BA%E7%B1%BB%E7%9A%84%E6%80%A7%E8%83%BD.html)

### dotnet build 基础

你需要先了解 csproj 文件的结构，以便进行后续的学习：

- [理解 C# 项目 csproj 文件格式的本质和编译流程 - 吕毅](https://walterlv.com/post/understand-the-csproj.html)
- [项目文件中的已知属性（知道了这些，就不会随便在 csproj 中写死常量啦） - 吕毅](https://walterlv.com/post/known-properties-in-csproj.html)
- [Roslyn 在项目文件使用条件判断 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E5%9C%A8%E9%A1%B9%E7%9B%AE%E6%96%87%E4%BB%B6%E4%BD%BF%E7%94%A8%E6%9D%A1%E4%BB%B6%E5%88%A4%E6%96%AD.html)

在了解到 csproj 文件结构之后，你可以通过迁移一些项目，并确保他们编译通过来练习：

- [将 WPF、UWP 以及其他各种类型的旧 csproj 迁移成基于 Microsoft.NET.Sdk 的新 csproj - 吕毅](https://walterlv.com/post/introduce-new-style-csproj-into-net-framework.html)
- [新 csproj 对 WPF/UWP 支持不太好？有第三方 SDK 可以用！MSBuild.Sdk.Extras - 吕毅](https://walterlv.com/post/use-msbuild-sdk-extras-for-wpf-and-uwp.html)

接着，csproj 中的重要内容 Target 对理解编译过程非常重要，因为它决定了如何编译这个项目：

- [Roslyn 如何使用 MSBuild Copy 复制文件 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E5%A6%82%E4%BD%95%E4%BD%BF%E7%94%A8-MSBuild-Copy-%E5%A4%8D%E5%88%B6%E6%96%87%E4%BB%B6.html)
- [如何使用 MSBuild Target（Exec）中的控制台输出 - 吕毅](https://walterlv.com/post/exec-task-of-msbuild-target.html)
- [如何在 MSBuild Target（Exec）中报告编译错误和编译警告 - 吕毅](https://walterlv.com/post/standard-error-warning-format.html)

更高级的 Target 用法：

- [如何编写基于 Microsoft.NET.Sdk 的跨平台的 MSBuild Target（附各种自带的 Task） - 吕毅](https://walterlv.com/post/write-msbuild-target.html)
- [Roslyn 使用 WriteLinesToFile 解决参数过长无法传入 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E4%BD%BF%E7%94%A8-WriteLinesToFile-%E8%A7%A3%E5%86%B3%E5%8F%82%E6%95%B0%E8%BF%87%E9%95%BF%E6%97%A0%E6%B3%95%E4%BC%A0%E5%85%A5.html)
- [每次都要重新编译？太慢！让跨平台的 MSBuild/dotnet build 的 Target 支持差量编译 - 吕毅](https://walterlv.com/post/msbuild-incremental-build.html)

基于 Target 的一些应用：

- [Roslyn 如何在 Target 引用 xaml 防止文件没有编译 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E5%A6%82%E4%BD%95%E5%9C%A8-Target-%E5%BC%95%E7%94%A8-xaml-%E9%98%B2%E6%AD%A2%E6%96%87%E4%BB%B6%E6%B2%A1%E6%9C%89%E7%BC%96%E8%AF%91.html)

当现有的知识和文档不足以帮助你完成现有功能的时候，也许你该考虑阅读官方源码了：

- [解读 Microsoft.NET.Sdk 的源码，你能定制各种奇怪而富有创意的编译过程 - 吕毅](https://walterlv.com/post/read-microsoft-net-sdk.html)
- [Reading the Source Code of Microsoft.NET.Sdk, Writing the Creative Extension of Compiling - 吕毅](https://walterlv.com/post/read-microsoft-net-sdk-en.html)

还有一些 csproj 特性的使用：

- [.NET/C# 中你可以在代码中写多个 Main 函数，然后按需要随时切换 - 吕毅](https://walterlv.com/post/write-multiple-main-and-related-startup-codes.html)
- [在 Visual Studio 的解决方案资源管理器中隐藏一些文件 - 吕毅](https://walterlv.com/post/make-items-invisible-in-vs-solution-explorer.html)
- [使用链接共享 Visual Studio 中的代码文件 - 吕毅](https://walterlv.com/visualstudio/2016/08/01/share-code-with-add-as-link.html)
- [为 Visual Studio 使用通配符批量添加项目文件 - 吕毅](https://walterlv.com/post/vs/2017/09/26/wildcards-in-vs-projects.html)
- [Roslyn 使用 Directory.Build.props 管理多个项目配置 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E4%BD%BF%E7%94%A8-Directory.Build.props-%E7%AE%A1%E7%90%86%E5%A4%9A%E4%B8%AA%E9%A1%B9%E7%9B%AE%E9%85%8D%E7%BD%AE.html)
- [Roslyn 使用 Directory.Build.props 文件定义编译 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E4%BD%BF%E7%94%A8-Directory.Build.props-%E6%96%87%E4%BB%B6%E5%AE%9A%E4%B9%89%E7%BC%96%E8%AF%91.html)
- [使用 MSBuild 响应文件 (rsp) 来指定 dotnet build 命令行编译时的大量参数 - 吕毅](https://walterlv.com/post/msbuild-response-files.html)

### NuGet 基础

- [项目文件中的已知 NuGet 属性（使用这些属性，创建 NuGet 包就可以不需要 nuspec 文件啦） - 吕毅](https://walterlv.com/post/known-nuget-properties-in-csproj.html)

可以使用 NuGet 做一些不是传统 dll 引用的功能：

- [Roslyn 通过 nuget 统一管理信息 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E9%80%9A%E8%BF%87-nuget-%E7%BB%9F%E4%B8%80%E7%AE%A1%E7%90%86%E4%BF%A1%E6%81%AF.html)
- [Roslyn 通过 Nuget 管理公司配置 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E9%80%9A%E8%BF%87-Nuget-%E7%AE%A1%E7%90%86%E5%85%AC%E5%8F%B8%E9%85%8D%E7%BD%AE.html)

现在，我们需要真的使用 NuGet 做一个自己的工具了：

- [如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包 - 吕毅](https://walterlv.com/post/create-a-cross-platform-msbuild-task-based-nuget-tool.html)
- [如何创建一个基于命令行工具的跨平台的 NuGet 工具包 - 吕毅](https://walterlv.com/post/create-a-cross-platform-command-based-nuget-tool.html)
- [在制作跨平台的 NuGet 工具包时，如何将工具（exe/dll）的所有依赖一并放入包中 - 吕毅](https://walterlv.com/post/include-dependencies-into-nuget-tool-package.html)

NuGet 的坑很多，有些可以解，有些需要规避：

- [帮助官方 NuGet 解掉 Bug，制作绝对不会传递依赖的 NuGet 包 - 吕毅](https://walterlv.com/post/prevent-nuget-package-been-depended.html)
- [MSBuild/Roslyn 和 NuGet 的 100 个坑 - 吕毅](https://walterlv.com/post/problems-of-msbuild-and-nuget.html)
- [Roslyn 通过 Nuget 引用源代码 在 VS 智能提示正常但是无法编译 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E9%80%9A%E8%BF%87-Nuget-%E5%BC%95%E7%94%A8%E6%BA%90%E4%BB%A3%E7%A0%81-%E5%9C%A8-VS-%E6%99%BA%E8%83%BD%E6%8F%90%E7%A4%BA%E6%AD%A3%E5%B8%B8%E4%BD%86%E6%98%AF%E6%97%A0%E6%B3%95%E7%BC%96%E8%AF%91.html)

如果你的 NuGet 格式是旧的，或者说引用方式是旧的，推荐升级：

- [自动将 NuGet 包的引用方式从 packages.config 升级为 PackageReference - 吕毅](https://walterlv.com/post/migrate-packages-config-to-package-reference.html)
- [如何最快速地将旧的 NuGet 包 (2.x, packages.config) 升级成新的 NuGet 包 (4.x, PackageReference) - 吕毅](https://walterlv.com/post/migrate-nuget-package-from-powershell-to-props-and-targets.html)

学会这些 NuGet 技能之后的一些应用：

- [阻止某个 NuGet 包意外升级 - 吕毅](https://walterlv.com/post/prevent-nuget-package-upgrade.html)

### SourceYard 原理

SourceYard 利用 NuGet 自动 Import 的 Target 来执行我们的代码：

- [Roslyn 使用 Target 替换占位符方式生成 nuget 打包 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E4%BD%BF%E7%94%A8-Target-%E6%9B%BF%E6%8D%A2%E5%8D%A0%E4%BD%8D%E7%AC%A6%E6%96%B9%E5%BC%8F%E7%94%9F%E6%88%90-nuget-%E6%89%93%E5%8C%85.html)
- [Roslyn 通过 Target 修改编译的文件 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E9%80%9A%E8%BF%87-Target-%E4%BF%AE%E6%94%B9%E7%BC%96%E8%AF%91%E7%9A%84%E6%96%87%E4%BB%B6.html)
- [将 .NET Core 项目打一个最简单的 NuGet 源码包，安装此包就像直接把源码放进项目一样 - 吕毅](https://walterlv.com/post/the-simplest-way-to-pack-a-source-code-nuget-package.html)
- [Roslyn 如何基于 Microsoft.NET.Sdk 制作源代码包 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E5%A6%82%E4%BD%95%E5%9F%BA%E4%BA%8E-Microsoft.NET.Sdk-%E5%88%B6%E4%BD%9C%E6%BA%90%E4%BB%A3%E7%A0%81%E5%8C%85.html)

### Roslyn 基础

Roslyn 由于其丰富且易用的 API，所以入门是比较容易的。推荐的入门文章有：

- [Roslyn 入门：使用 Visual Studio 的语法可视化（Syntax Visualizer）窗格查看和了解代码的语法树 - 吕毅](https://walterlv.com/post/roslyn-syntax-visualizer.html)
- [Roslyn 静态分析 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E9%9D%99%E6%80%81%E5%88%86%E6%9E%90.html)
- [Roslyn 入门：使用 Roslyn 静态分析现有项目中的代码 - 吕毅](https://walterlv.com/post/analysis-code-of-existed-projects-using-roslyn.html)
- [Roslyn 入门：使用 .NET Core 版本的 Roslyn 编译并执行跨平台的静态的源码 - 吕毅](https://walterlv.com/post/compile-and-invoke-code-using-roslyn.html)

额外的，你可以阅读更多 Roslyn 的资料以便快速应用于你的项目：

- [Roslyn 语法树中的各种语法节点及每个节点的含义 - 吕毅](https://walterlv.com/post/roslyn-syntax-tree-nodes.html)
- [Roslyn 节点的 Span 和 FullSpan 有什么区别 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-%E8%8A%82%E7%82%B9%E7%9A%84-Span-%E5%92%8C-FullSpan-%E6%9C%89%E4%BB%80%E4%B9%88%E5%8C%BA%E5%88%AB.html)
- [Roslyn NameSyntax 的 ToString 和 ToFullString 的区别 - 林德熙](https://lindexi.gitee.io/lindexi/post/Roslyn-NameSyntax-%E7%9A%84-ToString-%E5%92%8C-ToFullString-%E7%9A%84%E5%8C%BA%E5%88%AB.html)

Roslyn 为何能够在提供如此友好的 API 的情况下依然有如此高的性能？

- [理解 Roslyn 中的红绿树（Red-Green Trees） - 吕毅](https://walterlv.com/post/the-red-green-tree-of-roslyn.html)

一些 Roslyn 的额外功能：

- [Roslyn 的确定性构建 - 吕毅](https://walterlv.com/post/deterministic-builds-in-roslyn.html)

### SourceFusion 预编译框架

关于预编译框架的博客没有那么多，只有一些基本的使用：

- [都是用 DllImport？有没有考虑过自己写一个 extern 方法？ - 吕毅](https://walterlv.com/post/write-your-own-extern-method.html)

### 扩展阅读

这里是是用到了 csproj / NuGet 等的额外博客：

- [语义版本号（Semantic Versioning） - 吕毅](https://walterlv.com/post/semantic-version.html)
- [(1/2) 为了理解 UWP 的启动流程，我从零开始创建了一个 UWP 程序 - 吕毅](https://walterlv.com/post/create-uwp-app-from-zero-0.html)
- [dotnet core 通过修改文件头的方式隐藏控制台窗口 - 林德熙](https://lindexi.gitee.io/lindexi/post/dotnet-core-%E9%80%9A%E8%BF%87%E4%BF%AE%E6%94%B9%E6%96%87%E4%BB%B6%E5%A4%B4%E7%9A%84%E6%96%B9%E5%BC%8F%E9%9A%90%E8%97%8F%E6%8E%A7%E5%88%B6%E5%8F%B0%E7%AA%97%E5%8F%A3.html)
- [使用 GitVersion 在编译或持续构建时自动使用语义版本号（Semantic Versioning） - 吕毅](https://walterlv.com/post/automatically-semantic-versioning-using-git-version-task.html)
- [Automatically increase the semantic version using GitVersion - 吕毅](https://walterlv.com/post/automatically-semantic-versioning-using-git-version-task.en.html)
