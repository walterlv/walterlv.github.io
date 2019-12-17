---
title: "使用 MSBuild Target 复制文件的时候如何保持文件夹结构不变"
date: 2019-12-17 16:36:39 +0800
categories: msbuild dotnet
position: knowledge
---

使用 MSBuild 中的 `Copy` 这个编译目标可以在 .NET 项目编译期间复制一些文件。不过使用默认的参数复制的时候文件夹结构会丢失，所有的文件会保留在同一级文件夹下。

那么如何在复制文件的时候保持文件夹结构与原文件夹结构一样呢？

---

<div id="toc"></div>

## Copy

下面是一个典型的使用 MSBuild 在编译期间复制文件的一个编译目标。

```xml
<Target Name="_WalterlvCopyDemo" AfterTargets="AfterBuild">
  <ItemGroup>
    <_WalterlvToCopyFile Include="$(OutputPath)**" />
  </ItemGroup>
  <Copy SourceFiles="@(_WalterlvToCopyFile)" DestinationFolder="bin\Debug\Test" SkipUnchangedFiles="True" />
</Target>
```

这样复制的文件是不会保留文件夹结构的。

![在同一层级](/static/posts/2019-12-17-16-13-21.png)

复制之后，所有的文件夹将不存在，所有文件覆盖地到同一层级。

## RecursiveDir

如果希望保留文件夹层级，可以在 `DestinationFolder` 中使用文件路径来替代文件夹路径。

```diff
  <Target Name="_WalterlvCopyDemo" AfterTargets="AfterBuild">
    <ItemGroup>
      <_WalterlvToCopyFile Include="$(OutputPath)**" />
    </ItemGroup>
-   <Copy SourceFiles="@(_WalterlvToCopyFile)" DestinationFolder="bin\Debug\Test" SkipUnchangedFiles="True" />
+   <Copy SourceFiles="@(_WalterlvToCopyFile)" DestinationFolder="bin\Debug\Test\%(RecursiveDir)" SkipUnchangedFiles="True" />
  </Target>
```

![保留了文件夹层次结构](/static/posts/2019-12-17-16-14-27.png)
