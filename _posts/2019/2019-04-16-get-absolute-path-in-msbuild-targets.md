---
title: "如何在 MSBuild 的项目文件 csproj 中获取绝对路径"
date: 2019-04-16 18:16:07 +0800
categories: msbuild
position: problem
---

通常我们能够在 csproj 文件中仅仅使用相对路径就完成大多数的编译任务。但是有些外部命令的执行需要用到绝对路径，或者对此外部工具来说，相对路径具有不同的含义。这个时候，就需要将相对路径在 csproj 中转换为绝对路径来使用。

本文介绍如何在项目文件 csproj 中将一个相对路径转换为绝对路径。

---

在 MSBuild 4.0 中，可以在 csproj 中编写调用 PowerShell 脚本的代码，于是获取一个路径的绝对路径就非常简单：

```powershell
[System.IO.Path]::GetFullPath('$(WalterlvRelativePath)')
```

具体到 csproj 的代码中，是这样的：

```xml
<Project>
    <PropertyGroup>
        <WalterlvRelativePath>$(OutputPath)</WalterlvRelativePath>
        <_WalterlvAbsolutePath>$([System.IO.Path]::GetFullPath($(WalterlvRelativePath)))</_WalterlvAbsolutePath>
    </PropertyGroup>
</Project>
```

这样，就可以使用 `$(_WalterlvAbsolutePath)` 属性来获取绝对路径。

你可以阅读我的其他篇博客了解到 `$(OutputPath)` 其实最终都会是相对路径：

- [项目文件中的已知属性（知道了这些，就不会随便在 csproj 中写死常量啦） - walterlv](https://blog.walterlv.com/post/known-properties-in-csproj.html)
- [如何更精准地设置 C# / .NET Core 项目的输出路径？（包括添加和删除各种前后缀） - walterlv](https://blog.walterlv.com/post/the-properties-that-affetcs-project-output-path.html)

---

**参考资料**

- [How can I get MSBUILD to evaluate and print the full path when given a relative path? - Stack Overflow](https://stackoverflow.com/a/1251198/6233938)
- [Demonstrates how you can convert a relative path to an absolute path in MSBuild](https://gist.github.com/sayedihashimi/4366619)
