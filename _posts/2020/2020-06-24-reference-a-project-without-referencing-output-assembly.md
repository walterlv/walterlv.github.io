---
title: "通过 ReferenceOutputAssembly=False 在引用项目时，不额外引入依赖文件"
date: 2020-06-24 08:42:26 +0800
tags: visualstudio dotnet
position: problem
coverImage: /static/posts/2019-07-24-12-04-50.png
permalink: /posts/reference-a-project-without-referencing-output-assembly.html
---

正常当两个 .NET 项目有引用的时候，会将一个的输出拷贝到另一个的输出目录下。但有时我们只是希望通过引用建立一个依赖关系而已，最终两个项目的输出是独立的。

通过本文的方法，你可以在 A 项目编译时，确保 B 项目已经编译，而无需引用 B。

---

<div id="toc"></div>

## ReferenceOutputAssembly=False

依然在项目中使用往常习惯的方法设置项目引用：

![设置项目引用](/static/posts/2019-07-24-12-04-50.png)

但是，在项目引用设置完成之后，需要打开项目的项目文件（.csproj）给 `ProjectReference` 节点加上 `ReferenceOutputAssembly` 的属性设置，将其值设置为 `false`。这表示仅仅是项目引用，而不将项目的任何输出程序集作为此项目的依赖。

```xml
<ItemGroup>
  <ProjectReference Include="..\Walterlv.Demo.Analyzer\Walterlv.Demo.Analyzer.csproj" ReferenceOutputAssembly="false" />
  <ProjectReference Include="..\Walterlv.Demo.Build\Walterlv.Demo.Build.csproj" ReferenceOutputAssembly="false" />
</ItemGroup>
```

上面的 `ProjectReference` 是 Sdk 风格的 csproj 文件中的项目引用。即便不是 Sdk 风格，也是一样的加这个属性。

当然，你写多行也是可以的：

```xml
<ItemGroup>
  <ProjectReference Include="..\Walterlv.Demo.Analyzer\Walterlv.Demo.Analyzer.csproj">
    <ReferenceOutputAssembly>false</ReferenceOutputAssembly>
  </ProjectReference>
  <ProjectReference Include="..\Walterlv.Demo.Build\Walterlv.Demo.Build.csproj">
    <ReferenceOutputAssembly>false</ReferenceOutputAssembly>
  </ProjectReference>
</ItemGroup>
```

这种做法有两个非常棒的用途：

1. 生成代码
    - 依赖的项目（如上面的 Walterlv.Demo.Build）编译完成之后会生成一个可执行程序，它的作用是为我们当前的项目生成新的代码的。
    - 于是我们仅仅需要在编译当前项目之前先把这个依赖项目编译好就行，并不需要生成运行时的依赖。
1. NuGet 包中附带其他文件
    - 如果要生成 NuGet 包，我们有时需要多个项目生成的文件来共同组成一个 NuGet 包，这个时候我们需要的仅仅是把其他项目生成的文件放到 NuGet 包中，而不是真的需要在 NuGet 包级别建立对此项目的依赖。
    - 当使用 `ReferenceOutputAssembly` 来引用项目，最终生成的 NuGet 包中就不会生成对这些项目的依赖。

## 其他方法

本文的方法已加入到此类型解法的方法列表中，详情请看：

- [三种方法设置 .NET/C# 项目的编译顺序，而不影响项目之间的引用 - walterlv](https://blog.walterlv.com/post/affects-project-building-order.html)


