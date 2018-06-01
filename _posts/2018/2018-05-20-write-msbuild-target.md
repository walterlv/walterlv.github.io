---
title: "如何编写基于 Microsoft.NET.Sdk 的跨平台的 MSBuild Target"
date: 2018-05-20 19:00:34 +0800
categories: visualstudio
---

我之前写过一篇 [理解 C# 项目 csproj 文件格式的本质和编译流程](/post/understand-the-csproj.html)，其中，`Target` 节点就是负责编译流程的最关键的节点。但因为篇幅限制，那篇文章不便详说。于是，我在本文说说 `Target` 节点。

---

<div id="toc"></div>

### Target 的节点结构

`<Target>` 内部几乎有着跟 `<Project>` 一样的节点结构，内部也可以放 `PropertyGroup` 和 `ItemGroup`，不过还能放更加厉害的 `Task`。按照惯例，我依然用思维导图将节点结构进行了总结：

![Target 的节点结构](/static/posts/2018-05-20-16-34-13.png)  
▲ 上面有绿线和蓝线区分，仅仅是因为出现了交叉，怕出现理解歧义

`<Hash>` 和 `<WriteCodeFragment>` 都是 `Task`。我们可以看到，`Task` 是多种多样的，它可以占用一个 xml 节点。而本例中，`WriteCodeFragment` Task 就是生成代码文件，并且将生成的文件作为一项 `Compile` 的 Item 和 `FileWrites` 的 Item。在 [理解 C# 项目 csproj 文件格式的本质和编译流程](/post/understand-the-csproj.html) 中我们提到 `ItemGroup` 的节点，其作用由 `Target` 指定。所有 `Compile` 会在名为 `CoreCompile` 的 `Target` 中使用，而 `FileWrites` 在 Microsoft.NET.Sdk 的多处都生成了这样的节点，不过目前从我查看到的全部 Microsoft.NET.Sdk 中，发现内部并没有使用它。

### Target 执行的时机和先后顺序

既然 `<Target>` 内部节点很大部分跟 `<Project>` 一样，那区别在哪里呢？`<Project>` 里的 `<PropertyGroup>` 和 `<ItemGroup>` 是静态的状态，如果使用 Visual Studio 打开项目，那么所有的状态将会直接在 Visual Studio 的项目文件列表和项目属性中显示；而 `<Target>` 内部的 `<PropertyGroup>` 和 `<ItemGroup>` 是在编译期间动态生成的，不会在 Visual Studio 中显示；不过，它为我们提供了一种在编译期间动态生成文件或属性的能力。

总结起来就是——**Target 是在编译期间执行的**。

不过，同样是编译期间，那么多个 `Target`，它们之间的执行时机是怎么确定的呢？

一共有五个属性决定了 Target 之间的执行顺序：

* Project 的属性
    - `InitialTargets` 项目初始化的时候应该执行的 Target
    - `DefaultTargets` 如果没有指定执行的 Target，那么这个属性将指定执行的 Target
* Target 的属性
    - `DependsOnTargets` 在执行此 Target 之前应该执行的另一个或多个 Target
    - `BeforeTargets` 这是 MSBuild 4.0 新增的，指定应该在另一个或多个 Target 之前执行
    - `AfterTargets` 这也是 MSBuild 4.0 新增的，指定应该在另一个或多个 Target 之后执行

通过指定这些属性，我们的 `Target` 能够被 MSBuild 自动选择合适的顺序进行执行。例如，当我们希望自定义版本号，那么就需要赶在我们此前提到的 `GenerateAssemblyInfo` 之前执行。

### Microsoft.NET.Sdk 为我们提供的现成可用的 Task

有 Microsoft.NET.Sdk 的帮助，我们可以很容易地编写自己的 Target，因为很多功能它都帮我们实现好了，我们排列组合一下就好。

- `Copy` 复制文件 [Copy Task](https://docs.microsoft.com/en-us/visualstudio/msbuild/copy-task)
- `Move` 移动文件 [Move Task](https://docs.microsoft.com/en-us/visualstudio/msbuild/move-task)
- `Delete` 删除文件
- `Message` 显示一个输出信息（我在 [如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包](/post/create-a-cross-platform-msbuild-task-based-nuget-tool.html) 中利用这个进行调试）
- `Warning` 显示一个警告信息
- `Error` 报错（这样，编译就会以错误结束）
- `CombinePath`, `ConvertToAbsolutePath` 拼接路径，转成绝对路径
- `CreateItem`, `CreateProperty` 创建项或者属性
- `Csc` 调用 csc.exe 编译 [Csc Task](https://docs.microsoft.com/en-us/visualstudio/msbuild/csc-task)
- `MSBuild` 编译一个项目 [MSBuild Task](https://docs.microsoft.com/en-us/visualstudio/msbuild/msbuild-task)
- `Exec` 执行一个外部命令（我在 [如何创建一个基于命令行工具的跨平台的 NuGet 工具包](/post/create-a-cross-platform-command-based-nuget-tool.html) 一文中利用到了这个 Task 执行命令）
- `WriteCodeFragment` 生成一段代码 [WriteCodeFragment Task](https://docs.microsoft.com/en-us/visualstudio/msbuild/writecodefragment-task)
- `WriteLinesToFile` 向文件中写文字 [WriteLinesToFile Task](https://docs.microsoft.com/en-us/visualstudio/msbuild/writelinestofile-task)

提供的 Task 还有更多，如果上面不够你写出想要的功能，可以移步至官方文档翻阅：[MSBuild Task Reference - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/msbuild-task-reference)。

### 使用自己写的 Task

我有另外的一篇文章来介绍[如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包 - 吕毅](/post/create-a-cross-platform-msbuild-task-based-nuget-tool.html)。如果希望自己写 Ta

### 差量编译

如果你认为自己写的 `Target` 执行比较耗时，那么就可以使用差量编译。我另写了一篇文章专门来说 Target 的差量编译：[每次都要重新编译？太慢！让跨平台的 MSBuild/dotnet build 的 Target 支持差量编译 - 吕毅](/post/msbuild-incremental-build.html)。

---

#### 参考资料

- [Target Build Order - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/target-build-order)
- [MSBuild Task Reference - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/msbuild-task-reference)
