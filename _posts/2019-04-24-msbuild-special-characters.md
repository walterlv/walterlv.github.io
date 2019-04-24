---
title: "MSBuild 中的特殊字符（$ @ % 等）：含义、用法以及转义"
date: 2019-04-24 20:47:36 +0800
categories: msbuild visualstudio dotnet
position: knowledge
---

在 MSBuild 中有一些特殊字符，如 `$` `@` `%` `'` 等，本文介绍他们的含义，如何使用他们，以及你真的需要这些字符的时候如何编写他们。

---

<div id="toc"></div>

## 特殊字符

MSBuild 中有这些特殊字符：

- `$`
- `@`
- `%`
- `'`
- `;`
- `?`
- `*`

## 含义和用法

### `$`

引用一个属性或者环境变量。

```xml
<Project>
  <ItemGroup>
    <TargetFramework>netcoreapp3.0</TargetFramework>
    <OutputPath>bin\$(Configuration)</OutputPath>
  </ItemGroup>
</Project>
```

比如以下两篇博客列出了一些最典型的使用场景。

- [如何更精准地设置 C# / .NET Core 项目的输出路径？（包括添加和删除各种前后缀）](/post/the-properties-that-affetcs-project-output-path.html)
- [在 csproj 文件中使用系统环境变量的值（示例将 dll 生成到 AppData 目录下）](/post/environment-variables-in-csproj.html)

### `@`

引用一个集合。

```xml
<Target Name="WalterlvDemoTarget" BeforeTargets="CoreCompile">
    <Message Text="References:" />
    <Message Text="@(Reference)" />
</Target>
```

比如以下两篇博客列出了一些最典型的使用场景：

- [在 Target 中获取项目引用的所有依赖（dll/NuGet/Project）的路径](/post/resolve-project-references-using-target.html)
- [在制作跨平台的 NuGet 工具包时，如何将工具（exe/dll）的所有依赖一并放入包中](/post/include-dependencies-into-nuget-tool-package.html)

### `%`

引用集合中某一个项的某个属性。

```xml
<Target Name="Xxx" AfterTargets="AfterBuild">
    <ItemGroup>
        <Walterlv Include="@(Compile)=%(Compile.CopyToOutputDirectory)" />
    </ItemGroup>
    <Warning Text="@(Walterlv)" />
</Target>
```

比如下面两篇博客列出了此字符的一些使用：

- [在项目文件 csproj 中或者 MSBuild 的 Target 中使用 % 引用集合中每一项的属性](/post/msbuild-referencing-metadata.html)

### `'`

在形成一个字符串的时候，会使用到此字符。

下面这篇博客列出了此字符的一些使用：

- [MSBuild 如何编写带条件的属性、集合和任务 Condition？](/post/how-to-write-msbuild-conditions.html)

### `;`

如果存在分号，那么在形成一个集合的时候，会被识别为集合中的各个项之间的分隔符。

有时候你真的需要分号而不是作为分隔符的时候，需要进行转义：

- [Roslyn how to use WriteLinesToFile to write the semicolons to file - 林德熙](https://blog.lindexi.com/post/roslyn-how-to-use-writelinestofile-to-write-the-semicolons-to-file)

### `?` 和 `*`

作为通配符使用。一个 `*` 表示文件或者文件夹通配符，而 `**` 则表示任意层级的文件或文件夹。

下面这篇博客虽然古老，却也说明了其用法：

- [为 Visual Studio 使用通配符批量添加项目文件](/post/vs/2017/09/26/wildcards-in-vs-projects.html)

## 转义

在 MSBuild 中，由于这些特殊字符其实非常常见，所以与一些已有的值很容易冲突，所以需要转义。

转义可以使用 ASCII 编码：

- `$` - `%24`
- `@` - `%40`
- `%` - `%25`
- `'` - `%27`
- `;` - `%3B`
- `?` - `%3F`
- `*` - `%2A`

转义方法一：

```xml
<Compile Include="Walterlv1%3BWalterlv2.cs"/>
```

这样得到的将是一个名字为 `Walterlv1;Walterlv2.cs` 的文件，而不是两个文件。

转义方法二：

```xml
<Compile Include="$([MSBuild]::Escape('Walterlv1;Walterlv2.cs'))" />
```

---

**参考资料**

- [MSBuild Special Characters - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/msbuild-special-characters?view=vs-2019)
- [How to: Escape Special Characters in MSBuild - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/how-to-escape-special-characters-in-msbuild?view=vs-2019)
