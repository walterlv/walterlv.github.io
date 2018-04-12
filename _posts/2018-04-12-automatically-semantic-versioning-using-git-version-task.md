---
title: "使用 GitVersion 在编译或持续构建时自动使用语义版本号（Semantic Versioning）"
date: 2018-04-12 21:45:03 +0800
categories: visualstudio nuget csharp dotnet
---

我们在之前谈过 [语义版本号（Semantic Versioning）](/post/semantic-version.html)，在项目中应用语义版本号能够帮助库的开发者在发布包时表明更多的语义信息。这是趋势，从微软的博客 [Versioning NuGet packages in a continuous delivery world](https://blogs.msdn.microsoft.com/devops/2016/05/03/versioning-nuget-packages-cd-1/) 三部曲中可以看出，从 NuGet 4.3.0 以及 Visual Studio 2017 15.3 以上版本开始支持语义版本号 2.0 也能看出。

本文将从持续集成的角度来说语义版本号，告诉大家如何自动生成包含语义的版本号，并在发布库时采用。

---

<div id="toc"></div>

### 安装 GitVersionTask

微软工程师在博客 [Versioning NuGet packages in a continuous delivery world: part 3 – Microsoft DevOps Blog](https://blogs.msdn.microsoft.com/devops/2016/05/26/versioning-nuget-packages-cd-3/) 中推荐的语义版本号生成工具是 GitVersion。从实际寻找来看，这似乎也是唯一一个能够让 NuGet 包支持语义版本号的工具。

去 [NuGet.org](https://www.nuget.org/) 上为我们的库项目安装 [GitVersionTask](https://www.nuget.org/packages/GitVersionTask) 即可开始我们的语义版本号。

**请特别注意**：

1. GitVersionTask 的**使用门槛有点高**，以上这个步骤只是开始（装完编译也不会让你看到任何变化的，甚至编译不通过）。
2. 目前只有 [GitVersionTask **4.0 以上**的版本](https://www.nuget.org/packages/GitVersionTask/4.0.0-beta0012)（目前都是 beta）才支持 .NET Core 那样新格式的 csproj。
3. 目前即便是最新测试版的 GitVersionTask 也**不支持使用基于 .NET Core 的** `dotnet build` 编译，原因和解决方案我已经提交给 GitTools 团队了（详见：[`dotnet build` command always fails with GitVersionTask 4.0.0-beta · Issue #1399 · GitTools/GitVersion](https://github.com/GitTools/GitVersion/issues/1399)），临时方案是使用 .NET Framework 版本的 `msbuild`。

### 配置 GitVersion

特别吐槽一下 GitVersion 的官方文档，完全是在得意洋洋地显摆自己多么强大，却忽视了最简单的入门教程。

（未完待续……*体现出阅读原文的好处了，可以及时得到更新*）

### 语义版本号使用教程

（未完待续……*体现出阅读原文的好处了，可以及时得到更新*）

---

#### 参考资料

- [Versioning NuGet packages in a continuous delivery world: part 1 – Microsoft DevOps Blog](https://blogs.msdn.microsoft.com/devops/2016/05/03/versioning-nuget-packages-cd-1/)
- [Versioning NuGet packages in a continuous delivery world: part 2 – Microsoft DevOps Blog](https://blogs.msdn.microsoft.com/devops/2016/05/18/versioning-nuget-packages-cd-2/)
- [Versioning NuGet packages in a continuous delivery world: part 3 – Microsoft DevOps Blog](https://blogs.msdn.microsoft.com/devops/2016/05/26/versioning-nuget-packages-cd-3/)
- [C#/.NET - How to generate and increase package version automatically especially via CI? - Stack Overflow](https://stackoverflow.com/questions/49765756/c-net-how-to-generate-and-increase-package-version-automatically-especially)
- [GitTools/GitVersion: Easy Semantic Versioning (http://semver.org) for projects using Git](https://github.com/GitTools/GitVersion)
- [GitVersion](http://gitversion.readthedocs.io/en/latest/)
- [Gitversion Task for VS2017-style csproj · Issue #1349 · GitTools/GitVersion](https://github.com/GitTools/GitVersion/issues/1349)
- [Change Assembly Version - Jenkins - Jenkins Wiki](https://wiki.jenkins.io/display/JENKINS/Change+Assembly+Version)
- [Not working in .NET Core v2.0 project · Issue #15 · jeffkl/RoslynCodeTaskFactory](https://github.com/jeffkl/RoslynCodeTaskFactory/issues/15)
- [NuGet Gallery - RoslynCodeTaskFactory 1.2.1](https://www.nuget.org/packages/RoslynCodeTaskFactory/1.2.1)
- [`dotnet build` command always fails with GitVersionTask 4.0.0-beta · Issue #1399 · GitTools/GitVersion](https://github.com/GitTools/GitVersion/issues/1399)
- [.NET Core MSBuild cannot load tasks built against MSBuild 4.0 · Issue #2111 · Microsoft/msbuild](https://github.com/Microsoft/msbuild/issues/2111)
- [Should the SDK include Microsoft.Build.Utilities.v4.0? · Issue #1870 · dotnet/sdk](https://github.com/dotnet/sdk/issues/1870)
