---
title: "在编译期间使用 Roslyn/MSBuild 自带的方法/函数判断、计算和修改属性"
date: 2019-05-14 19:52:51 +0800
categories: msbuild visualstudio roslyn
position: knowledge
---

充分利用 MSBuild 自带的方法，可以在编译期间完成大多数常见的属性转换，而不再需要自己专门写库来完成。

本文介绍如何使用 MSBuild 自带的方法，并列举 MSBuild 中各种自带的方法。

---

<div id="toc"></div>

## 如何在编译期间使用 MSBuild 自带的方法

当然，在修改编译期间的代码的时候，你可能需要提前了解项目文件相关的知识：

- [理解 C# 项目 csproj 文件格式的本质和编译流程](/post/understand-the-csproj.html)

以下是使用 MSBuild 自带方法的最简单的一个例子，执行 `5-1` 的数学运算。

```xml
<Walterlv>$([MSBuild]::Subtract(5, 1))</Walterlv>
```

---

**参考资料**

- [Property Functions - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/property-functions)
