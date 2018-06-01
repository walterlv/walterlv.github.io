---
title: "每次都要重新编译？太慢！让跨平台的 MSBuild/dotnet build 的 Target 支持差量编译"
date: 2018-05-14 15:46:50 +0800
categories: visualstudio
---

如果你干预到了项目的编译过程，可能就需要考虑到差量编译了。不然——当你的项目大起来的时候，就会感受到每次都重新编译时，每次重复调试的过程都要进行漫长等待时的绝望和无奈。

如果你正遭遇差量编译失效，每次都要重新编译的问题，那么阅读本文应该能够帮助你解决问题。

---

`msbuild.exe` 和 `dotnet build` 编译项目的方式是一样的，只不过前者使用完整的 .NET Framework，而后者使用 .NET Core。所以后面我们说到 Target 的差量编译的时候，就不再区分这两者了。

<div id="toc"></div>

### 一个差量编译的例子

先看一个 `Target` 的例子，这里例子来源于我的另一篇文章[如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包 - 吕毅](/post/create-a-cross-platform-msbuild-task-based-nuget-tool.html)。在例子中，我没有加入任何的差量编译支持。

```xml
<Target Name="WalterlvDemo" BeforeTargets="CoreCompile">
  <DemoTool IntermediateOutputPath="$(IntermediateOutputPath)">
    <Output TaskParameter="AdditionalCompileFile" PropertyName="WalterlvDemo_AdditionalCompileFile" />
  </DemoTool>

  <ItemGroup>
    <Compile Include="$(WalterlvDemo_AdditionalCompileFile)" />
  </ItemGroup>
</Target>
```

上述例子的作用是在编译期间执行一个名为 `DemoTool` 的 `Task`，在 `Task` 执行结束之后，将生成的临时文件 `$(WalterlvDemo_AdditionalCompileFile)` 加入编译。

如果你觉得上面的写法非常陌生，或者说不清楚那个 `Target` 节点的作用，建议先阅读：

- [理解 C# 项目 csproj 文件格式的本质和编译流程 - 吕毅](/post/understand-the-csproj.html)
- [如何创建一个基于 MSBuild Task 的跨平台的 NuGet 工具包 - 吕毅](/post/create-a-cross-platform-msbuild-task-based-nuget-tool.html)

### 差量编译的关键

每一个 `Target` 都有 `Inputs` 和 `Outputs` 属性，可以设置，也可以不用设置。

当没有指定时，MSBuild 会认定为此 `Target` 在每次编译时都会执行；当指定时，MSBuild 会认定为此 `Target` 需要进行差量执行。不存在只指定其中一个而不指定另一个的情况——MSBuild 直接会提示此 Target 没有正确指定 `Inputs` 和 `Outputs`

`Inputs` 和 `Outputs` 的格式都是一组用 `;` 分隔的字符串，每一项都是一个文件的路径。不过不用特别考虑如何使用 `;` 拼接，因为当我们使用 `@` 符号时，收集到的每一项便是使用 `;` 分隔的。例如 `@(Compile)` 表示在 `<ItemGroup>` 中每一个 `Compile` 类型的节点。如果不清楚 `<ItemGroup>` 和 `<Compile>` 的作用，建议建议先阅读[理解 C# 项目 csproj 文件格式的本质和编译流程 - 吕毅](/post/understand-the-csproj.html)。

假设我们指定 `Inputs` 为 `@(Compile)`，`Outputs` 指定为某个 xxx.exe 生成的临时文件的位置（在 [如何创建一个基于命令行工具的跨平台的 NuGet 工具包](/post/create-a-cross-platform-command-based-nuget-tool.html) 一文中，我假定为了 `$(IntermediateOutputPath)Doubi.cs`），那么 MSBuild 就会在执行此 Target 之前检查所有这些输入输出文件。如果所有 `<Compile>` 节点中对应的文件都没有改变，而且 `$(IntermediateOutputPath)Doubi.cs` 存在且没改变，那么此 `Target` 将不需要执行。任何一个文件不满足此条件，则 `Target` 都将重新执行。

现在，回到我们刚开始的例子，你觉得如何设置 `Inputs` 和 `Outputs` 可以获得最佳的差量编译效果呢？答案是——`Inputs` 设置为空字符串（因为我们没有输入文件），`Outputs` 设置为 `$(WalterlvDemo_AdditionalCompileFile)` 应该有的值（特别注意：我指的是这个属性对应的值，而不是属性本身——因为此属性的值在编译之前不能确认，也就无法进行差量分析）。

### 不是所有的 Target 都适合差量编译

注意！**不是所有的 `Target` 都适合设置 `Inputs` 和 `Outputs` 属性**！

在本文前面的例子中，我们的 `Target` 是有明确的输入和输出文件的；然而有些 `Target` 是没有输入输出文件的——他们的输出依赖于其他 Target 的输出。

例如我们有另一个 `<Target>`，它的作用是生成一个属性的值，或者一组文件的名字；而另外一个 `<Target>` 使用这个属性的值和这组文件。典型的例子如我在[如何创建一个基于命令行工具的跨平台的 NuGet 工具包](/post/create-a-cross-platform-command-based-nuget-tool.html) 中写的那个 NuGet 工具。

```xml
<Target Name="WalterlvDemo" BeforeTargets="CoreCompile">
  <Exec Command="dotnet $(NuGetWalterlvToolPath) -i $(IntermediateOutputPath)Doubi.cs" />
</Target>

<Target Name="WalterlvDemoUseResult" AfterTargets="WalterlvDemo" BeforeTargets="CoreCompile">
  <ItemGroup>
    <Compile Include="$(IntermediateOutputPath)Doubi.cs" />
  </ItemGroup>
</Target>
```

`WalterlvDemo` 生成文件，而 `WalterlvDemoUseResult` 使用文件。这时，`WalterlvDemo` 适合使用差量编译，而 `WalterlvDemoUseResult` 却不适合！

因为前者已经生成了文件，如果不执行，文件依然存在；但后者一旦不执行，那么我们就会少一个编译的文件。这将导致后续名为 `CoreCompile` 的 Target 执行时，发现少了一个文件，将重新执行编译。

所以前者的 `Inputs` 指定为空字符串，`Outputs` 指定为 `$(IntermediateOutputPath)Doubi.cs`；但是后者不应该指定 `Inputs` 和 `Outputs`。
