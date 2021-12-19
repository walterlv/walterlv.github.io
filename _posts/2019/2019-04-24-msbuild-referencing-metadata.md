---
title: "在项目文件 csproj 中或者 MSBuild 的 Target 中使用 % 引用集合中每一项的属性"
date: 2019-04-24 20:35:25 +0800
tags: msbuild visualstudio dotnet
position: knowledge
coverImage: /static/posts/2019-04-24-20-20-01.png
permalink: /post/msbuild-referencing-metadata.html
---

在编写项目文件或者 MSBuild Target 文件的时候，我们经常会使用 `<Foo Include="Identity" />` 来定义集合中的一项。在定义的同时，我们也会额外指定一些属性。

然而这些属性如何拿到并且使用呢？本文将介绍使用方法。

---

将下面的代码放到你项目文件的末尾，最后一个 `</Project>` 的前面，可以在编译的时候看到两个新的警告。

```xml
<Target Name="Xxx" AfterTargets="AfterBuild">
    <ItemGroup>
        <WalterlvX Include="@(Compile)" />
        <WalterlvY Include="%(Compile.FileName)" />
    </ItemGroup>
    <Warning Text="@(WalterlvX)" />
    <Warning Text="@(WalterlvY)" />
</Target>
```

![新增的警告](/static/posts/2019-04-24-20-20-01.png)

在定义 `WalterlvX` 集合的时候，我们使用了 `@(Compile)` 来获取所有需要编译的文件。

在定义 `WalterlvY` 集合的时候，我们使用了 `%(Compile.FileName)` 来获取编译文件的文件名。

于是，你在警告信息中看到的两个警告信息里面，一个输出了 `Compile` 集合中每一项的标识符（通常是相对于项目文件的路径），另一个输出了每一个 `Compile` 项中的 `FileName` 属性。`FileName` 属性是 `Compile` 会被 Microsoft.NET.Sdk 自动填充。

需要注意，如果 `%` 得到的项中某个属性为空，那么这一项在最终形成的新集合中是不存在的。

所以，如果存在可能不存在的属性，那么建议先进行拼接再统一处理拼接后的值：

```xml
<Target Name="Xxx" AfterTargets="AfterBuild">
    <ItemGroup>
        <Walterlv Include="@(Compile)=%(Compile.CopyToOutputDirectory)" />
    </ItemGroup>
    <Warning Text="@(Walterlv)" />
</Target>
```

这里的 `CopyToOutputDirectory` 不是一个总是会设置的属性。


