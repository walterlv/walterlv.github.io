---
title: "如何使用 MSBuild Target（Exec）中的控制台输出"
publishDate: 2018-06-13 08:08:06 +0800
date: 2018-12-14 09:54:00 +0800
categories: dotnet msbuild
---

我曾经写过一篇文章 [如何创建一个基于命令行工具的跨平台的 NuGet 工具包](/post/create-a-cross-platform-command-based-nuget-tool.html)，通过编写一个控制台程序来参与编译过程。但是，相比于 [基于 Task 的方式](/post/create-a-cross-platform-msbuild-task-based-nuget-tool.html)，可控制的因素还是太少了。

有没有什么办法能够让控制台程序也能与 MSBuild Target 之间发生更多的信息交换呢？答案是有的，通过捕获控制台的输出！

---

<div id="toc"></div>

## 捕获控制台输出

如果你喜爱阅读文档，那么答案已经不陌生了，在微软的官方文档 [Exec Task](https://docs.microsoft.com/en-us/visualstudio/msbuild/exec-task?wt.mc_id=MVP) 中就已经提及了属性 `ConsoleToMSBuild`。将此属性设置为 `True`，将能够捕获控制台输出到 MSBuild 中。（*不过据说典型的程序员是不爱看文档的*）

那么，捕获的输出去了哪里呢？

我在 [如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包](/post/create-a-cross-platform-msbuild-task-based-nuget-tool.html) 中提到了使用 `Output` 来将 `Task` 中的参数输出出来。而 `Exec` 也是这么做的。我们将 `ConsoleOutput` 输出出来即可。由于这个属性不是 `ITaskItem[]` 类型的，所以我们只能得到字符串属性，于是只能通过 `PropertyName` 来接收这样的输出。

```xml
<Exec ConsoleToMSBuild="True" Command="&quot;$(NuGetWalterlvToolPath)&quot;">
  <Output TaskParameter="ConsoleOutput" PropertyName="OutputOfTheCommand" />
</Exec>
```

## PropertyGroup 转 ItemGroup

如果你需要的只是一个字符串，那看完上一节就已经够了。但如果你希望得到的是一组值（例如新增了一组需要编译的文件），那么需要得到的是 `ItemGroup` 中的多个值，而不是 `PropertyGroup` 中的单个值。（如果不太明白 `ItemGroup` 和 `PropertyGroup` 之间的差别，不要紧，可以阅读 [理解 C# 项目 csproj 文件格式的本质和编译流程](/post/understand-the-csproj.html)。）

MSBuild 还自带了一个 `Task`，名为 `CreateItem`，就是从一段字符串创建一组 `Item`。通过下面这段代码，我们能将上一节捕获到的属性转换成项的集合。

```xml
<CreateItem Include="$(OutputOfTheCommand)">
  <Output TaskParameter="Include" ItemName="AdditionalCompile" />
</CreateItem>
```

这样，我们便能够

更加完整的代码可能更具有参考意义，所以我贴在了下面：

```xml
<Project>
  <Target Name="GenerateAdditionalCode" BeforeTargets="CoreCompile">
    <Exec ConsoleToMSBuild="True" Command="&quot;$(NuGetWalterlvToolPath)&quot;">
      <Output TaskParameter="ConsoleOutput" PropertyName="OutputOfTheCommand" />
    </Exec>
  </Target>
  <Target Name="_IncludeGeneratedAdditionalCode" AfterTargets="GenerateAdditionalCode">
    <CreateItem Include="$(OutputOfTheCommand)">
      <Output TaskParameter="Include" ItemName="AdditionalCompile" />
    </CreateItem>
    <ItemGroup>
      <Compile Include="@(AdditionalCompile)" />
    </ItemGroup>
    <Message Text="额外添加的编译文件：@(AdditionalCompile)" />
  </Target>
</Project>
```

## CreateItem 的转换分隔符

`CreateItem` 从属性或字符串转到项是根据分隔符来区分的。由于使用 `@(Item)` 来获取项时，会得到一个用 `;` 分隔的字符串，所以不难想到我们控制台输出的字符串使用 `;` 分隔即能满足我们的转换需求。**但事实上这是不行的！**

因为控制台的转换，每行是有缓冲区限制的，也就是说单行字数不能过多，否则会自动加换行符——这可能导致我们转换成的某一项或者多项中间带了换行符，从而导致错误。

于是，建议直接在控制台程序中使用换行符本身作为分隔符，这样便可以去除这样的限制。因为 `CreateItem` 也是支持换行符分隔的。

---

**参考资料**

- [How get exec task output with msbuild - Stack Overflow](https://stackoverflow.com/q/8938679/6233938)
- [Exec Task - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/exec-task?wt.mc_id=MVP)
- [Empty an MSBuild ItemGroup - Stack Overflow](https://stackoverflow.com/q/7909825/6233938)
- [What's New in MSBuild 15 - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/what-s-new-in-msbuild-15-0#updates?wt.mc_id=MVP)
- [Item Element (MSBuild) - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/item-element-msbuild?wt.mc_id=MVP)
