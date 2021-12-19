---
title: "通过设置 sln 解决方案依赖，确保不引用的两个项目之间有明确的编译顺序"
date: 2020-06-24 09:04:14 +0800
tags: visualstudio dotnet
position: problem
coverImage: /static/posts/2019-07-24-12-17-34.png
---

有时在编译解决方案的时候，希望两个项目有明确的编译顺序，而不是自动决定，或者在并行编译的时候同时编译。

本文介绍通过设置 sln 解决方案依赖来解决编译顺序问题。

---

<div id="toc"></div>

## 设置解决方案级别的项目依赖

在解决方案上右键，然后选择“设置项目依赖”：

![设置项目依赖](/static/posts/2019-07-24-12-17-34.png)

然后在弹出的项目依赖对话框中选择一个项目的依赖：

![选择项目依赖](/static/posts/2019-07-24-12-18-39.png)

这时，如果看看解决方案文件（.sln）则可以看到多出了 `ProjectDependencies` 区：

```
Project("{FAE04EC0-301F-11D3-BF4B-00C04F79EFBC}") = "Walterlv.Demo", "Walterlv.Demo\Walterlv.Demo.csproj", "{DC0B1D44-5DF4-4590-BBFE-072183677A78}"
	ProjectSection(ProjectDependencies) = postProject
		{98FF9756-B95A-4FDB-9858-5106F486FBF3} = {98FF9756-B95A-4FDB-9858-5106F486FBF3}
	EndProjectSection
EndProject
```

更多关于 sln 文件的理解，可以阅读我的另一篇博客：

- [理解 Visual Studio 解决方案文件格式（.sln）](/post/understand-the-sln-file)

## 其他方法

本文的方法已加入到此类型解法的方法列表中，详情请看：

- [三种方法设置 .NET/C# 项目的编译顺序，而不影响项目之间的引用 - walterlv](https://blog.walterlv.com/post/affects-project-building-order.html)

