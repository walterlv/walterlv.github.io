---
title: "理解 Visual Studio 解决方案文件格式（.sln）"
publishDate: 2019-07-24 15:34:53 +0800
date: 2020-06-18 08:34:02 +0800
categories: visualstudio dotnet
position: knowledge
---

一般情况下我们并不需要关心 Visual Studio 解决方案文件格式（.sln），因为 Visual Studio 对解决方案文件的自动修复能力是非常强的。但是如果遇到自动解冲突错误或者编译不通过了，那么此文件还是需要手工修改的。

本文介绍 Visual Studio 解决方案（.sln）文件的格式。

---

<div id="toc"></div>

## 基本概念

Visual Studio 的解决方案文件由这三个部分组成：

- 版本信息
    - `Microsoft Visual Studio Solution File, Format Version 12.00`
    - `# Visual Studio Version 16`
    - `VisualStudioVersion = 16.0.28606.126`
    - `MinimumVisualStudioVersion = 10.0.40219.1`
- 项目信息
    - `Project`
    - `EndProject`
- 全局信息
    - `Global`
    - `EndGlobal`

虽然看起来是三个独立的部分，但其实除了版本号之外，项目信息和全局信息还是有挺多耦合部分的。

比如我们来看一个 sln 文件的例子，是一个最简单的只有一个项目的 sln 文件：

![只有一个项目的 sln 文件](/static/posts/2019-07-24-10-47-00.png)

```
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 16
VisualStudioVersion = 16.0.29102.190
MinimumVisualStudioVersion = 10.0.40219.1
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Walterlv.Demo", "Walterlv.Demo\Walterlv.Demo.csproj", "{DC0B1D44-5DF4-4590-BBFE-072183677A78}"
EndProject
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Release|Any CPU = Release|Any CPU
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution
		{DC0B1D44-5DF4-4590-BBFE-072183677A78}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{DC0B1D44-5DF4-4590-BBFE-072183677A78}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{DC0B1D44-5DF4-4590-BBFE-072183677A78}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{DC0B1D44-5DF4-4590-BBFE-072183677A78}.Release|Any CPU.Build.0 = Release|Any CPU
	EndGlobalSection
	GlobalSection(SolutionProperties) = preSolution
		HideSolutionNode = FALSE
	EndGlobalSection
	GlobalSection(ExtensibilityGlobals) = postSolution
		SolutionGuid = {F2F1AD1B-207B-4731-ABEB-92882F89B155}
	EndGlobalSection
EndGlobal
```

下面我们来一一说明。

## 结构

### 版本信息

```
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 16
VisualStudioVersion = 16.0.29102.190
MinimumVisualStudioVersion = 10.0.40219.1
```

记录文件的格式版本是 12.0。使用 Visual Studio 2019 编辑/创建。

这里有一个小技巧，这里的 VisualStudioVersion 版本号设置为 15.0 会使得打开 sln 文件的时候默认使用 Visual Studio 2017，而设置为 16.0 会使得打开 sln 文件的时候默认使用 Visual Studio 2019。

### 项目信息

#### Project

```
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Walterlv.Demo", "Walterlv.Demo\Walterlv.Demo.csproj", "{DC0B1D44-5DF4-4590-BBFE-072183677A78}"
EndProject
```

项目信息至少由两行组成，第一行标记项目信息开始，而最后一行表示信息结束。

其格式为：

```
Project("{项目类型}") = "项目名称", "项目路径", "项目 Id"
EndProject
```

你可以在我的另一篇博客中找到项目类型：

- [解决方案文件 sln 中的项目类型 GUID](/post/a-list-of-project-type-guids)

但是本文列举几个 .NET/C# 项目中的常见类型：

- `9A19103F-16F7-4668-BE54-9A1E7A4F7556` SDK 风格的 C# 项目文件
- `FAE04EC0-301F-11D3-BF4B-00C04F79EFBC` 传统风格的 C# 项目文件
- `2150E333-8FDC-42A3-9474-1A3956D46DE8` 解决方案文件夹

关于 SDK 风格的项目文件，可以阅读我的另一篇博客：

- [将 WPF、UWP 以及其他各种类型的旧 csproj 迁移成 Sdk 风格的 csproj - walterlv](/post/introduce-new-style-csproj-into-net-framework)

项目名称和项目路径不必多说，都知道。对于文件夹而言，项目名称就是文件夹的名称，而项目路径也是文件夹的名称。

项目 Id 是在解决方案创建项目的过程中生成的一个新的 GUID，每个项目都不一样。对于 SDK 风格的 C# 项目文件，csproj 中可以指定项目依赖，而如果没有直接的项目依赖，而只是解决方案编译级别的依赖，那么也可以靠 sln 文件中的项目 Id 来指定项目的依赖关系。另外，也通过项目 Id 来对项目做一些编译上的解决方案级别的配置。

#### ProjectSection

`Project` 和 `EndProject` 的内部还可以放 `ProjectSection`。

比如对于解决方案文件夹，可以包含解决方案文件：

```
Project("{2150E333-8FDC-42A3-9474-1A3956D46DE8}") = "Solution Items", "Solution Items", "{B002382D-4C9E-4F08-85E5-F12E2C061F5A}"
	ProjectSection(SolutionItems) = preProject
		.gitattributes = .gitattributes
		.gitignore = .gitignore
		README.md = README.md
		build\Version.props = build\Version.props
	EndProjectSection
EndProject
```

这个解决方案文件夹中包含了四个文件，其路径分别记录在了 `ProjectSection` 节点里面。

`ProjectSection` 还可以记录项目依赖关系（非项目之间的真实依赖，而是解决方案级别的编译依赖）：

```
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Walterlv.Demo", "Walterlv.Demo\Walterlv.Demo.csproj", "{DC0B1D44-5DF4-4590-BBFE-072183677A78}"
	ProjectSection(ProjectDependencies) = postProject
		{98FF9756-B95A-4FDB-9858-5106F486FBF3} = {98FF9756-B95A-4FDB-9858-5106F486FBF3}
	EndProjectSection
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Walterlv.Demo2", "Walterlv.Demo2\Walterlv.Demo2.csproj", "{98FF9756-B95A-4FDB-9858-5106F486FBF3}"
EndProject
```

在这一段节点里面，我们的 `Walterlv.Demo` 项目依赖于另外一个 `Walterlv.Demo2` 项目。依赖是以 `项目 Id = 项目 Id` 的方式写出来的；如果有多个依赖，那么就写多行。不用吐槽为什么一样还要写两遍，因为这是一个固定的格式，后面我们会介绍一些全局配置里面会有两个不一样的。

关于设置项目依赖关系的方法，除了 sln 文件里面的设置之外，还有通过设置项目依赖属性的方式，详情可以阅读：

- [三种方法设置 .NET/C# 项目的编译顺序，而不影响项目之间的引用](/post/affects-project-building-order)

### 全局信息

一个全局信息的例子如下：

```
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Release|Any CPU = Release|Any CPU
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution
		{DC0B1D44-5DF4-4590-BBFE-072183677A78}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{DC0B1D44-5DF4-4590-BBFE-072183677A78}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{DC0B1D44-5DF4-4590-BBFE-072183677A78}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{DC0B1D44-5DF4-4590-BBFE-072183677A78}.Release|Any CPU.Build.0 = Release|Any CPU
		{98FF9756-B95A-4FDB-9858-5106F486FBF3}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{98FF9756-B95A-4FDB-9858-5106F486FBF3}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{98FF9756-B95A-4FDB-9858-5106F486FBF3}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{98FF9756-B95A-4FDB-9858-5106F486FBF3}.Release|Any CPU.Build.0 = Release|Any CPU
	EndGlobalSection
	GlobalSection(SolutionProperties) = preSolution
		HideSolutionNode = FALSE
	EndGlobalSection
	GlobalSection(ExtensibilityGlobals) = postSolution
		SolutionGuid = {F2F1AD1B-207B-4731-ABEB-92882F89B155}
	EndGlobalSection
EndGlobal
```

在这个全局信息的例子中，为解决方案指定了两个配置（Configuration），`Debug` 和 `Release`，平台都是 `Any CPU`。同时也为每个项目指定了单独的配置种类，可供选择，每一行都是 `项目的配置 = 解决方案的配置` 表示此项目的此种配置在解决方案的某个全局配置之下。

如果我们将这两个项目放到文件夹中，那么我们可以额外看到一个新的全局配置 `NestedProjects` 字面意思是说 `{DC0B1D44-5DF4-4590-BBFE-072183677A78}` 和 `{98FF9756-B95A-4FDB-9858-5106F486FBF3}` 两个项目在 `{20B61509-640C-492B-8B33-FB472CCF1391}` 项目中嵌套，实际意义代表 `Walterlv.Demo` 和 `Walterlv.Demo2` 两个项目在 `Folder` 文件夹下。

```
GlobalSection(NestedProjects) = preSolution
    {DC0B1D44-5DF4-4590-BBFE-072183677A78} = {20B61509-640C-492B-8B33-FB472CCF1391}
    {98FF9756-B95A-4FDB-9858-5106F486FBF3} = {20B61509-640C-492B-8B33-FB472CCF1391}
EndGlobalSection
```

![在同一个文件夹下](/static/posts/2019-07-24-15-34-02.png)

上图解决方案下的整个解决方案全部内容如下：

```
Microsoft Visual Studio Solution File, Format Version 12.00
# Visual Studio Version 16
VisualStudioVersion = 16.0.29102.190
MinimumVisualStudioVersion = 10.0.40219.1
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Walterlv.Demo", "Walterlv.Demo\Walterlv.Demo.csproj", "{DC0B1D44-5DF4-4590-BBFE-072183677A78}"
	ProjectSection(ProjectDependencies) = postProject
		{98FF9756-B95A-4FDB-9858-5106F486FBF3} = {98FF9756-B95A-4FDB-9858-5106F486FBF3}
	EndProjectSection
EndProject
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Walterlv.Demo2", "Walterlv.Demo2\Walterlv.Demo2.csproj", "{98FF9756-B95A-4FDB-9858-5106F486FBF3}"
EndProject
Project("{2150E333-8FDC-42A3-9474-1A3956D46DE8}") = "Folder", "Folder", "{20B61509-640C-492B-8B33-FB472CCF1391}"
EndProject
Global
	GlobalSection(SolutionConfigurationPlatforms) = preSolution
		Debug|Any CPU = Debug|Any CPU
		Release|Any CPU = Release|Any CPU
	EndGlobalSection
	GlobalSection(ProjectConfigurationPlatforms) = postSolution
		{DC0B1D44-5DF4-4590-BBFE-072183677A78}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{DC0B1D44-5DF4-4590-BBFE-072183677A78}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{DC0B1D44-5DF4-4590-BBFE-072183677A78}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{DC0B1D44-5DF4-4590-BBFE-072183677A78}.Release|Any CPU.Build.0 = Release|Any CPU
		{98FF9756-B95A-4FDB-9858-5106F486FBF3}.Debug|Any CPU.ActiveCfg = Debug|Any CPU
		{98FF9756-B95A-4FDB-9858-5106F486FBF3}.Debug|Any CPU.Build.0 = Debug|Any CPU
		{98FF9756-B95A-4FDB-9858-5106F486FBF3}.Release|Any CPU.ActiveCfg = Release|Any CPU
		{98FF9756-B95A-4FDB-9858-5106F486FBF3}.Release|Any CPU.Build.0 = Release|Any CPU
	EndGlobalSection
	GlobalSection(SolutionProperties) = preSolution
		HideSolutionNode = FALSE
	EndGlobalSection
	GlobalSection(NestedProjects) = preSolution
		{DC0B1D44-5DF4-4590-BBFE-072183677A78} = {20B61509-640C-492B-8B33-FB472CCF1391}
		{98FF9756-B95A-4FDB-9858-5106F486FBF3} = {20B61509-640C-492B-8B33-FB472CCF1391}
	EndGlobalSection
	GlobalSection(ExtensibilityGlobals) = postSolution
		SolutionGuid = {F2F1AD1B-207B-4731-ABEB-92882F89B155}
	EndGlobalSection
EndGlobal
```
