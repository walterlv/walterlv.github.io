---
title: "Roslyn/MSBuild 在编译期间从当前文件开始查找父级文件夹，直到找到包含特定文件的文件夹"
date: 2019-05-15 21:16:11 +0800
tags: dotnet visualstudio msbuild roslyn
position: knowledge
permalink: /posts/msbuild-get-directory-name-of-file-above.html
---

大家在进行各种开发的时候，往往都不是写一个单纯项目就完了的，通常都会有一个解决方案，里面包含了多个项目甚至是大量的项目。我们经常会考虑输出一些文件或者处理一些文件，例如主项目的输出目录一般会选在仓库的根目录，文档文件夹一般会选在仓库的根目录。

然而，我们希望输出到这些目录或者读取这些目录的项目往往在很深的代码文件夹中。如果直接通过 `..\..\..` 来返回仓库根目录非常不安全，你会数不过来的。

---

现在，我们有了一个好用的 API：`GetDirectoryNameOfFileAbove`，可以直接找到仓库的根目录，无需再用数不清又容易改出问题的 `..\..\..` 了。

你只需要编写这样的代码，即可查找 Walterlv.DemoSolution.sln 文件所在的文件夹的完全路径了。

```xml
<PropertyGroup>
  <WalterlvSolutionRoot>$([MSBuild]::GetDirectoryNameOfFileAbove($(MSBuildThisFileDirectory), Walterlv.DemoSolution.sln))</BuildRoot>
</PropertyGroup>
```

而这段代码所在的文件，可能是这样的目录结构（里面的 Walterlv.DemoProject.csproj 文件）：

```
- D:\walterlv\root
    - \src
        - \Walterlv.DemoProject
            + \Walterlv.DemoProject.csproj
        - \Walterlv.DemoProject2
        + README.md
    - \docs
    - \bin
    + \Walterlv.DemoSolution.sln
        + README.md
```

这样，我们便可以找到 `D:\walterlv\root` 文件夹。

另外还有一个 API `GetPathOfFileAbove`，只传入一个参数，找到文件后，返回文件的完全路径：

```xml
<PropertyGroup>
  <WalterlvSolutionRoot>$([MSBuild]::GetPathOfFileAbove(Walterlv.DemoSolution.sln))</BuildRoot>
</PropertyGroup>
```

最终可以得到 `D:\walterlv\root\Walterlv.DemoSolution.sln` 路径。

需要注意的是：

1. 此方法**不支持**通配符，也就是说不能使用 `*.sln` 来找路径
1. 此方法**不支持**通过文件夹去找，也就是说不能使用我们熟知的 `.git` 等等文件夹去找路径
1. 此方法传入的文件**支持**使用路径，也就是说可以使用类似于 `\src\README.md` 的方式来查找路径

---

**参考资料**

- [Finding the Root Build Folder with MSBuild - Mode 13h](https://www.mode19.net/posts/msbuildbuildroot/)

