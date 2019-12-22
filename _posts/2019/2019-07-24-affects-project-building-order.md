---
title: "两种方法设置 .NET/C# 项目的编译顺序，而不影响项目之间的引用"
date: 2019-07-24 12:22:37 +0800
categories: visualstudio msbuild dotnet
position: knowledge
---

当 A 项目引用 B 项目，那么使用 Visual Studio 或者 MSBuild 编译 A 项目之前就会确保 B 项目已经编译完毕。通常我们指定这种引用是因为 A 项目确实在运行期间需要 B 项目生成的程序集。

但是，现在 B 项目可能仅仅只是一个工具项目，或者说 A 项目编译之后的程序集并不需要 B，仅仅只是将 B 打到一个包中，那么我们其实需要的仅仅是 B 项目先编译而已。

本文介绍如何影响项目的编译顺序，而不带来项目实际引用。

---

<div id="toc"></div>

## 方法一：设置 ReferenceOutputAssembly

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

## 方法二：设置解决方案级别的项目依赖

此方法可能会是更加常用的方法，但兼容性不那么好，可能在部分旧版本的 Visual Studio 或者 .NET Core 版本的 `dotnet build` 命令下不容易工作起来。

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

## 使用哪一种？

使用 `ReferenceOutputAssembly` 属性设置的方式是将项目的编译顺序指定到项目文件中的，这意味着如果使用命令行单独编译这个项目，也是能获得提前编译目标项目的效果的，而不需要打开对应的解决方案编译才可以获得改变编译顺序的效果。

不过使用 `ReferenceOutputAssembly` 的一个缺陷是，必须要求目标框架能够匹配。比如 .NET Core 2.1 的项目就不能引用 .NET Core 3.0 或者 .NET Framework 4.8 的项目。

而在解决方案级别设置项目依赖则没有框架上的限制。无论你的项目是什么框架，都可以在编译之前先编译好依赖的项目。只是旧版本的 MSBuild 工具和 `dotnet build` 不支持 `ProjectDependencies` 这样的解决方案节点，会导致要么不识别这样的项目依赖（从而实际上并没有影响编译顺序）或者无法完成编译（例如出现 [Error parsing the nested project section in solution file.](/post/error-parsing-the-nested-project-section-in-solution-file) 错误）。

---

**参考资料**

- [Question about Visual Studio *.sln file format - Stack Overflow](https://stackoverflow.com/a/5774449/6233938)
