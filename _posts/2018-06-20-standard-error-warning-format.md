---
title: "如何在 MSBuild Target（Exec）中报告编译错误和编译警告"
date: 2018-06-20 13:17:32 +0800
categories: dotnet msbuild
---

我曾经写过一篇文章 [如何创建一个基于命令行工具的跨平台的 NuGet 工具包](/post/create-a-cross-platform-command-based-nuget-tool.html)，通过编写一个控制台程序来参与编译过程。但是，相比于 [基于 Task 的方式](/post/create-a-cross-platform-msbuild-task-based-nuget-tool.html)，可控制的因素还是太少了。

有没有什么办法能够让控制台程序也能与 MSBuild Target 之间发生更多的信息交换呢？比如报告编译错误和编译警告？答案是有的，通过格式化控制台输出。

---

<div id="toc"></div>

### 编译错误和编译警告

MSBuild 的 Exec 自带有错误和警告的标准格式，按照此格式输出，将被识别为编译错误和编译警告。

而格式只是简简单单的 `error:` 开头或者 `warning:` 开头。冒号前面也可以加上空格。

```csharp
using System;

namespace Walterlv.Demo
{
    internal class Program
    {
        private static void Main(string[] args)
        {
            Console.WriteLine("warning: walterlv 最好是一个逗比。");
            Console.WriteLine("error: walterlv 必须是一个逗比。");
        }
    }
}
```

对于这样一段在编译期间执行的程序，编译时将显示如下信息，并产生编译错误和编译警告。

![](/static/posts/2018-06-20-13-10-34.png)

当然，在这个例子中，我直接在编译完成后执行自己，产生了这样的编译错误。

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net47</TargetFramework>
  <Target Name="PostBuild" AfterTargets="PostBuildEvent">
    <Exec Command="$(OutputPath)$(AssemblyName).exe" />
  </Target>
</Project>
```

### 阻止编译错误和编译警告的格式化识别

当然，有可能你只是需要一个 `error:` 开头或者 `warning:` 开头的格式，并不希望真的产生编译错误或者编译警告，那么只需要在执行 `Exec` 的时候设置 `IgnoreStandardErrorWarningFormat="True"`。

```xml
<Exec IgnoreStandardErrorWarningFormat="True" Command="$(OutputPath)$(AssemblyName).exe" />
```

---

#### 参考资料

- [Exec task and "error :" in output](https://social.msdn.microsoft.com/Forums/vstudio/en-US/77eb8b02-8cd7-4d32-acad-3ab0dc308d78/exec-task-and-error-in-output?forum=msbuild)
