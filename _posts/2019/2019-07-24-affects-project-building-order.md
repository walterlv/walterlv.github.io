---
title: "三种方法设置 .NET/C# 项目的编译顺序，而不影响项目之间的引用"
publishDate: 2019-07-24 12:22:37 +0800
date: 2020-06-24 09:40:36 +0800
tags: visualstudio msbuild dotnet
position: knowledge
---

当 A 项目引用 B 项目，那么使用 Visual Studio 或者 MSBuild 编译 A 项目之前就会确保 B 项目已经编译完毕。通常我们指定这种引用是因为 A 项目确实在运行期间需要 B 项目生成的程序集。

但是，现在 B 项目可能仅仅只是一个工具项目，或者说 A 项目编译之后的程序集并不需要 B，仅仅只是将 B 打到一个包中，那么我们其实需要的仅仅是 B 项目先编译而已。

本文介绍如何影响项目的编译顺序，而不带来项目实际引用。

---

<div id="toc"></div>

## 方法一：设置 ReferenceOutputAssembly

```xml
<ItemGroup>
  <ProjectReference Include="..\Walterlv.Demo.Analyzer\Walterlv.Demo.Analyzer.csproj" ReferenceOutputAssembly="false" />
  <ProjectReference Include="..\Walterlv.Demo.Build\Walterlv.Demo.Build.csproj" ReferenceOutputAssembly="false" />
</ItemGroup>
```

详见 [通过 ReferenceOutputAssembly=False 在引用项目时，不额外引入依赖文件 - walterlv](/post/reference-a-project-without-referencing-output-assembly)。

## 方法二：设置解决方案级别的项目依赖

此方法可能会是更加常用的方法，但兼容性不那么好，可能在部分旧版本的 Visual Studio 或者 .NET Core 版本的 `dotnet build` 命令下不容易工作起来。

在解决方案上右键，然后选择“设置项目依赖”：

![设置项目依赖](/static/posts/2019-07-24-12-17-34.png)

然后在弹出的项目依赖对话框中选择一个项目的依赖：

![选择项目依赖](/static/posts/2019-07-24-12-18-39.png)

详见：[通过设置 sln 解决方案依赖，确保不引用的两个项目之间有明确的编译顺序 - walterlv](/post/setup-project-dependencies-in-the-solution-file)。

## 方法三：使用 MSBuild 编译任务来编译其他项目

```xml
<Project Sdk="Microsoft.NET.Sdk">

    <PropertyGroup>
        <TargetFramework>net48</TargetFramework>
    </PropertyGroup>

    <Target Name="BuildTheCompilerProject" BeforeTargets="BeforeBuild">
        <MSBuild Projects="..\Walterlv.Packages.Compiler\Walterlv.Packages.Compiler.csproj" Targets="Build" Properties="Configuration=$(Configuration);Platform=$(Platform)" />
    </Target>

</Project>
```

详见 [Visual Studio 在编译 A 项目时，确保 B 项目已编译 - walterlv](/post/msbuild-another-project-in-msbuild-targets)。

## 使用哪一种？

|                                      | ReferenceOutputAssembly                                      | 解决方案依赖                          | MSBuild 编译任务                                             |
| ------------------------------------ | ------------------------------------------------------------ | ------------------------------------- | ------------------------------------------------------------ |
| 位置                                 | 项目文件（csproj）或<br/>编译文件（`*.props` / `*.targets`） | 解决方案文件（sln）                   | 项目文件（csproj）或<br/>编译文件（`*.props` / `*.targets`） |
| 编译项目                             | ✔️生效                                                        | ❌无效                                 | ✔️生效                                                        |
| 编译解决方案                         | ✔️生效                                                        | ✔️生效                                 | ✔️生效                                                        |
| 拷贝依赖项目的输出文件               | 否                                                           | ⚠是                                   | 否                                                           |
| 要求匹配目标框架<br/>TargetFramework | ⚠是                                                          | 否                                    | 否                                                           |
| 占用一个编译时机                     | 否                                                           | 否                                    | ⚠是                                                          |
| 兼容性                               | ✔️                                                            | ⚠早期版本的<br/>`dotnet build` 不支持 | ✔️                                                            |

✔️优势  
❌劣势  
⚠可能优可能劣（但在本文场景是劣势）

位置：代码可以写到哪些文件中  
编译项目：使用 `dotnet build` 或者 `msbuild` 命令来编译时，传入项目文件  
编译解决方案：使用 `dotnet build` 或者 `msbuild` 命令来编译时，传入解决方案文件  
拷贝依赖项目的输出文件：如果 A 项目引用 B 项目，那么 B 项目的输出文件会被自动拷贝到 A 项目的输出目录中  
要求匹配目标框架：必须匹配的框架才能引用，例如 net48 能引用 net45，netcoreapp3.1 能引用 netstandard2.0，但 net45 不能引用 netcoreapp3.1  
占用一个编译时机：在此编译时机之前的依赖是无效的（详见：[Visual Studio 在编译 A 项目时，确保 B 项目已编译](/post/msbuild-another-project-in-msbuild-targets)）

---

**参考资料**

- [Question about Visual Studio *.sln file format - Stack Overflow](https://stackoverflow.com/a/5774449/6233938)
