---
title: "如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包"
date: 2018-05-10 09:06:43 +0800
categories: visualstudio
published: false
---

MSBuild 的 Task 为我们扩展项目的编译过程提供了强大的扩展性，而且这是可以用 C# 语言编写的扩展；利用这种扩展性，我们可以为我们的项目定制一部分的编译细节。NuGet 为我们提供了一种自动导入 .props 和 .targets 的方法，同时还是一个 .NET 的包平台；我们可以利用 NuGet 发布我们的工具并自动启用这样的工具。

本文更偏向于入门，只在帮助你一步一步地制作一个最简单的 NuGet 工具包，以体验和学习这个过程。然后我会在另一篇博客中完善其功能，做一个完整可用的 NuGet 工具。

---

<div id="toc"></div>

### 前置条件

### 第一步：创建一个项目，用来写 Task

### 第二步：组织 NuGet 目录

### 第三步：编写 Target

### 第四部：打包成 NuGet

### 第五步：调试与发布

---

#### 参考资料

- [NuGet pack and restore as MSBuild targets - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/reference/msbuild-targets)
- [Bundling .NET build tools in NuGet](https://www.natemcmaster.com/blog/2017/11/11/build-tools-in-nuget/)
- [Shipping a cross-platform MSBuild task in a NuGet package](https://www.natemcmaster.com/blog/2017/07/05/msbuild-task-in-nuget/)
- [MSBuild Reserved and Well-Known Properties](https://msdn.microsoft.com/en-us/library/ms164309.aspx)
- [build process - How does MSBuild check whether a target is up to date or not? - Stack Overflow](https://stackoverflow.com/questions/6982372/how-does-msbuild-check-whether-a-target-is-up-to-date-or-not?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa)
- [How to: Build Incrementally](https://msdn.microsoft.com/en-us/library/ms171483.aspx)
- [How To: Implementing Custom Tasks – Part I – MSBuild Team Blog](https://blogs.msdn.microsoft.com/msbuild/2006/01/21/how-to-implementing-custom-tasks-part-i/)
- [Overwrite properties with MSBuild - Stack Overflow](https://stackoverflow.com/questions/1366840/overwrite-properties-with-msbuild?utm_medium=organic&utm_source=google_rich_qa&utm_campaign=google_rich_qa)
- [How to Access MSBuild properties inside custom task](https://social.msdn.microsoft.com/Forums/vstudio/en-US/4ba7e9a0-76e6-4b1c-8536-fd76a5b96c79/how-to-access-msbuild-properties-inside-custom-task?forum=vsx)
- [visual studio - How to get property value of a project file using msbuild - Stack Overflow](https://stackoverflow.com/questions/39732729/how-to-get-property-value-of-a-project-file-using-msbuild)
- [davidfowl/NuGetPowerTools: A bunch of powershell modules that make it even easier to work with nuget](https://github.com/davidfowl/NuGetPowerTools)
