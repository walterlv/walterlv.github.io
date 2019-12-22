---
title: "Automatically increase the semantic version using GitVersion"
publishDate: 2018-04-18 20:51:39 +0800
date: 2018-09-01 08:11:36 +0800
categories: visualstudio nuget csharp dotnet
version:
  current: English
versions:
  - 中文: /post/automatically-semantic-versioning-using-git-version-task.html
  - English: #
---

I wrote another post talking about [Semantic Versioning](/post/semantic-version) before (*but it is not in English*). Introducing the semantic version to a project can give library users more semantic information when library developers publishing packages. From the Microsoft blog [Versioning NuGet packages in a continuous delivery world](https://blogs.msdn.microsoft.com/devops/2016/05/03/versioning-nuget-packages-cd-1/) we could find that semantic versioning is the trend.

This article will refer to the semantic versioning from the perspective of continuous integration, telling you how to automatically generate a version that contains semantic, and use it when publishing the library.

---

This post is written in **multiple languages**. Please select yours:

{% include post-version-selector.html %}

<div id="toc"></div>

## Install the GitVersionTask

A Microsoft engineer recommend a semantic versioning tools named `GitVersion` on his blog [Versioning NuGet packages in a continuous delivery world: part 3 – Microsoft DevOps Blog](https://blogs.msdn.microsoft.com/devops/2016/05/26/versioning-nuget-packages-cd-3/). I tried to find more tools but unfortunately the GitVersion seems to be the only one that can add semantic version to a nuget package.

Go to [NuGet.org](https://www.nuget.org/) to install [GitVersionTask](https://www.nuget.org/packages/GitVersionTask) for our library project and then we will start our semantic versioning.

**Attention**:

1. Only [GitVersionTask **4.0 or later**](https://www.nuget.org/packages/GitVersionTask/4.0.0-beta0012) (currently beta) supports new csproj format which is introduced from .NET Core.
1. Currently even the latest beta version of GitVersionTask does not support the .NET Core-based compilation - `dotnet build`. I've submitted an issue to the GitTools team to explain the reason and the solution. (see: [`dotnet build` command always fails with GitVersionTask 4.0.0-beta · Issue #1399 · GitTools/GitVersion](https://github.com/GitTools/GitVersion/issues/1399)) The temporary fallback is to use a full .NET Framework version - `msbuild`.

## GitVersion Configuration

GitVersion official documentation is not easy to read. I cannot find even detailed meaning of each configuration keys and values. But I read it's source code, and these are the meanings below.

```yml
next-version: 1.0
mode: ContinuousDelivery
increment: Inherit
tag-prefix: '[vV]'
source-branches: ['master', 'develop', 'hotfix']
ignore:
  sha: []
  commits-before: 2018-01-01T00:00:00
branches:
  master:
    regex: master$
    mode: ContinuousDelivery
    tag: ''
    increment: Patch
    prevent-increment-of-merged-branch-version: true
    track-merge-target: false
    tracks-release-branches: false
    is-release-branch: true
  release:
    regex: r(elease$|(eleases)?[-/])
    mode: ContinuousDelivery
    tag: beta
    increment: Patch
    prevent-increment-of-merged-branch-version: true
    track-merge-target: false
    tracks-release-branches: false
    is-release-branch: true
  feature:
    regex: f(eatures)?[-/]
    mode: ContinuousDeployment
    tag: alpha
    increment: Minor
    prevent-increment-of-merged-branch-version: false
    track-merge-target: false
    tracks-release-branches: false
    is-release-branch: false
```

▲ It's long, but the official one is longer.

// TODO: **Translation is interrupted and I'll translate below later.**

好了不开玩笑了，这配置文件分两部分来看：1. `branches` 之前；2. `branches` 之后。

写在 `branches` 之前的为全局配置，写在 `branches` 之后的是按分支分类的配置；它们的配置键值其实都是一样的。分支里的配置优先级高于全局配置。也就是说，如果编译打包的分支名能被 `regex` 正则表达式匹配上，那么就使用匹配的分支配置，否则使用全局配置。

举例，假设我们现在的版本库是这样的：

![版本库](/static/posts/2018-04-13-15-34-08.png)

### 分支名称匹配 `regex`

那么当我们在 `release` 分支的 `f` 提交上编译，使用的配置将是 `release` 分支的配置。

由于我将 `release` 分支的正则表达式写成了 `r(elease$|(eleases)?[-/])`（注意，我们不需要加行首标记 `^`，因为 GitVersionTask 里会为我们在最前面加一个），所以类似这样的分支名也是使用 `release` 分支的配置：

- `r/1.2.0`
- `releases/1.2.0`
- `release`

但是，这样的分支名将采用默认的全局配置（因为不符合正则表达式）：

- `r`
- `releases`

以上配置中我只列举了三组分支，但其实在 [一个成功的 Git 分支流模型](http://nvie.com/posts/a-successful-git-branching-model/) 中，还有 `hotfix` `develop` 这样更多的分支。如果你的项目足够大，建议自己参考其他分支写出这两个分支的配置出来。

### 预发布标签 `tag`

我们的 release 配置中，会为版本号加一个 `beta` 预发布标签，所以可能打出 `2.0.0-beta` 这样的包出来，或者 `2.0.0-beta+3`。但在全局配置下，默认打出的包会加一个以分支名命名的预发布标签；像这样 `2.0.0-r`（在 `r` 分支），或者 `2.0.0-temp-walterlv-custombranch`（在 `temp/walterlv/custombranch` 分支）。

继续看以上的配置，在 `f/blog` 或 `features/new` 分支上将采用 `alpha` 预发布标签。

我们在 `master` 分支的配置上

### 版本号递增规则 `increment`

`increment` 这一项的可选值有 `Major`、`Minor`、`Patch`、`None` 和 `Inherit` 五种。

- `Major` 如果此前在 Git 仓库此分支前有一个 1.2.0 的 Tag，那么现在将打出 2.0.0 的包来（无论此分支当前距离那个 Tag 有多少个提交，都只加 1）
- `Minor` 如果此前在 Git 仓库此分支前有一个 1.2.0 的 Tag，那么现在将打出 1.3.0 的包来（无论此分支当前距离那个 Tag 有多少个提交，都只加 1）
- `Patch` 如果此前在 Git 仓库此分支前有一个 1.2.0 的 Tag，那么现在将打出 1.2.1 的包来（无论此分支当前距离那个 Tag 有多少个提交，都只加 1）
- `None` 如果此前在 Git 仓库此分支前有一个 1.2.0 的 Tag，那么现在将打出 1.2.0 的包来
- `Inherit` 如果此分支上没有发现能够确认版本号的线索（例如一个 Tag），那么将自动寻找此分支的来源分支，继承来源分支的版本号递增规则。注意我在全局配置中加了一个 `source-branches` 配置，用于指定如果要自动寻找来源分支，请去这个集合中指定的分支名称里找。

下图是 release 分支上打包的版本号。

![](/static/posts/2018-04-13-16-27-11.png)

### 版本号递增的方式 `mode`

`mode` 可选的值有三种：

- `continuous-delivery` 持续交付，临近产品发布时使用，详细信息可阅读[Continous delivery - GitVersion](http://gitversion.readthedocs.io/en/stable/reference/continuous-delivery/)
- `continuous-deployment` 持续部署，日常使用，详细信息可阅读[Continuous deployment - GitVersion](http://gitversion.readthedocs.io/en/stable/reference/continuous-deployment/)
- `Mainline` 传统的（官方文档没有说明，代码中没有注释，但阅读代码发现其策略是从上一个 Tag 递增版本号）

## 语义版本号使用教程

在了解了以上的配置之后，使用 GitVersionTask 才不会显得版本号的规则诡异。

我们从简单的使用开始，逐步向难演进。学习规则为：单个 master 分支 -> Git 分支流与预发布版本

### 单个 master 分支

如果我们只在 `master` 上开发，那么上手就非常容易了。

如果我们刚开始接触 GitVersionTask，那么我们在上一个发布包的提交上新建一个标签（Tag），命名为 v1.2.0，那么此标签之后的版本号打包将自动变为 1.2.1。Git 提交每次增多，那么构建号将加 1。下图中的版本号是 1.2.1+3。（注意：加号是语义版本号 2.0 的新特性，重申需要 NuGet 4.3.0 以及 Visual Studio 2017 15.3 以上版本。）

![](/static/posts/2018-04-13-17-15-09.png)

### Git 分支流与预发布版本

当使用 Git 分支流时，版本号的递增方式其实与前面配置章节和单个 master 章节讲的时一致的。如下图。

![](/static/posts/2018-04-13-17-25-20.png)

但是，我们需要学习如何充分利用这样的分支流，以便让语义版本号充分发挥它的作用。

假设：*我们最近发布了 1.1.0 正式版。*

1. 如果我们正在为库添加新功能，则新建一个 `feature` 分支，一直开发，直到认为开发完毕（功能实现完成，单元测试全绿）
1. 如果此时有打包需求临时内测，则直接在 `feature` 分支打包，这样能打出 `1.2.0-alpha` 的包（后面的 + 取决于相对于此前发布多了多少个提交）
1. 如果内测差不多了，则合并到 `develop` 分支确认这个内侧包
1. 如果准备发布这个功能了，那么从 `develop` 分到 `release` 分支
1. 这时如果有打包需求，则应该在打包之前**新建一个标签**（Tag）`v1.2-beta`，这样能打出 `1.2` 的 `beta` 包（而不是 `1.1` 的）
1. 如果在此 `beta` 的基础上出现持续打包，那么需要持续新建标签（因为自动新建的标签只会增加一次 Patch 号）
1. 如果确认可正式发布，则 `release` 合并到 `master`，新建 `v1.2` 标签

---

### References

- [Versioning NuGet packages in a continuous delivery world: part 1 – Microsoft DevOps Blog](https://blogs.msdn.microsoft.com/devops/2016/05/03/versioning-nuget-packages-cd-1/)
- [Versioning NuGet packages in a continuous delivery world: part 2 – Microsoft DevOps Blog](https://blogs.msdn.microsoft.com/devops/2016/05/18/versioning-nuget-packages-cd-2/)
- [Versioning NuGet packages in a continuous delivery world: part 3 – Microsoft DevOps Blog](https://blogs.msdn.microsoft.com/devops/2016/05/26/versioning-nuget-packages-cd-3/)
- [C#/.NET - How to generate and increase package version automatically especially via CI? - Stack Overflow](https://stackoverflow.com/q/49765756/6233938)
- [GitTools/GitVersion: Easy Semantic Versioning (http://semver.org) for projects using Git](https://github.com/GitTools/GitVersion)
- [GitVersion](http://gitversion.readthedocs.io/en/latest/)
- [Gitversion Task for VS2017-style csproj · Issue #1349 · GitTools/GitVersion](https://github.com/GitTools/GitVersion/issues/1349)
- [Change Assembly Version - Jenkins - Jenkins Wiki](https://wiki.jenkins.io/display/JENKINS/Change+Assembly+Version)
- [Not working in .NET Core v2.0 project · Issue #15 · jeffkl/RoslynCodeTaskFactory](https://github.com/jeffkl/RoslynCodeTaskFactory/issues/15)
- [NuGet Gallery - RoslynCodeTaskFactory 1.2.1](https://www.nuget.org/packages/RoslynCodeTaskFactory/1.2.1)
- [`dotnet build` command always fails with GitVersionTask 4.0.0-beta · Issue #1399 · GitTools/GitVersion](https://github.com/GitTools/GitVersion/issues/1399)
- [.NET Core MSBuild cannot load tasks built against MSBuild 4.0 · Issue #2111 · Microsoft/msbuild](https://github.com/Microsoft/msbuild/issues/2111)
- [Should the SDK include Microsoft.Build.Utilities.v4.0? · Issue #1870 · dotnet/sdk](https://github.com/dotnet/sdk/issues/1870)
