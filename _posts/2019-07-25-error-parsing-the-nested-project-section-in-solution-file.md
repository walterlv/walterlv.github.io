---
title: "编译 .NET 解决方案的时候出现错误：调用的目标发生了异常。Error parsing the nested project section in solution file."
date: 2019-07-25 08:24:30 +0800
categories: msbuild visualstudio dotnet
position: problem
published: false
---

我这里使用 Visual Studio 2019 能好好编译的一个项目，发现在另一个小伙伴那里却编译不通过，报告错误：

> 调用的目标发生了异常。Error parsing the nested project section in solution file.

本文介绍如何解决这样的问题。

---

<div id="toc"></div>

## 方法一：添加命令行选项



---

**参考资料**

- [Nested project issues · Issue #7040 · dotnet/corefx](https://github.com/dotnet/corefx/issues/7040)
- [Fixed nested project issues in msbuild by svick · Pull Request #7041 · dotnet/corefx](https://github.com/dotnet/corefx/pull/7041/files)
