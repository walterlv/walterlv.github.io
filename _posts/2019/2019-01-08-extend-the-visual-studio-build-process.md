---
title: "通过重写预定义的 Target 来扩展 MSBuild / Visual Studio 的编译过程"
publishDate: 2019-01-08 19:19:58 +0800
date: 2019-03-04 22:15:06 +0800
categories: dotnet msbuild visualstudio
position: knowledge
---

MSBuild 的编译过程提供了一些可以被重写的 Target，通过重写这些 Target 可以扩展 MSBuild 的编译过程。

---

<div id="toc"></div>

## 重写预定义的 Target

有这些预定义的 Target 可以重写：

- `BeforeCompile`, `AfterCompile`
- `BeforeBuild`, `AfterBuild`
- `BeforeRebuild`, `AfterRebuild`
- `BeforeClean`, `AfterClean`
- `BeforePublish`, `AfterPublish`
- `BeforeResolveReference`, `AfterResolveReferences`
- `BeforeResGen`, `AfterResGen`

你可以[在 Microsoft.NET.Sdk 中找到各种富有创意的 Target 用来扩展](/post/read-microsoft-net-sdk.html)，以上这些也是 Microsoft.NET.Sdk 的一部分，在那个文件夹的 Microsoft.Common.targets 或者 Microsoft.Common.CurrentVersion.targets 中。

而写法是这样的：

```xml
<Project>
    ...
    <Target Name="BeforeResGen">
        <!-- 这里可以写在生成资源之前执行的 Task 或者修改属性和集合。 -->
    </Target>
    <Target Name="AfterCompile">
        <!-- 这里可以写在 C# 文件以及各种资源文件编译之后执行的 Task 或者修改属性和集合。 -->
    </Target>
</Project>
```

是的，相比于你全新定义一个 Target 来说，你不需要去写 BeforeTargets 或者 AfterTargets。

那么以上那些 Target 都是什么时机呢？

### `BeforeCompile`, `AfterCompile`

在 C# 文件以及各种资源文件被编译成 dll 的之前或之后执行。你可以在之前执行以便修改要编译的 C# 文件或者资源文件，你也可以在编译之后做一些其他的操作。

由于我们可以在 BeforeCompile 这个时机修改源码，所以我们很多关于代码级别的重新定义都可以在这个时机去完成。

### `BeforeBuild`, `AfterBuild`

在整个编译之前或者之后执行。对于普通的编译来说，一般来说不会有比 `BeforeBuild` 更前以及比 `AfterBuild` 更后的时机了，不过如果有其他 Import 进来的 Target 或者通过 NuGet 自动引入进来的其他 Target 也使用了类似这样的时机，那么你就不一定比他们更靠前或者靠后。

### `BeforeRebuild`, `AfterRebuild`

如果编译时采用了 `/t:Rebuild` 方案，也就是重新编译，那么 BeforeRebuild 和 AfterRebuild 就会被触发。一旦触发，会比前面更加提前和靠后。

执行顺序为：BeforeRebuild -> Clean -> Build -> AfterRebuild

### `BeforeClean`, `AfterClean`

在清理开始和结束时执行。如果是重新编译，那么也会有 Clean 的过程。顺序见上面。

### `BeforePublish`, `AfterPublish`

在发布之前执行和发布之后执行。对应到 Visual Studio 右键菜单中的发布按钮。

### `BeforeResolveReference`, `AfterResolveReferences`

在程序集的引用被解析之前和之后执行。你可以通过重写这两个时机的 Target 来修改程序集的引用关系或者利用引用执行一些其他操作。

### `BeforeResGen`, `AfterResGen`

在资源被生成之前和之后执行。

## 通过改写 DependsOn 的值扩展编译

有这些预定义的 DependsOn 可以改写：

- `BuildDependsOn`
- `CleanDependsOn`
- `CompileDependsOn`

这几个属性的时机跟上面是一样的，你可以直接通过阅读上面一节中对应名字的 Target 的解释来获得这几个属性所对应的时机。

而这几个属性影响编译过程的写法是这样的：

```xml
<PropertyGroup>
    <BuildDependsOn>WalterlvDemoTarget1;$(BuildDependsOn);WalterlvDemoTarget1</BuildDependsOn>
</PropertyGroup>
<Target Name="WalterlvDemoTarget1">  
    <Message Text="正在运行 WalterlvDemoTarget1……"/>  
</Target>  
<Target Name="WalterlvDemoTarget1">  
    <Message Text="正在运行 WalterlvDemoTarget2……"/>  
</Target>
```

更推荐使用 `DependsOn` 属性的改写而不是像本文第一节那样直接重写 Target，是因为一个 Target 的重写很容易被不同的开发小伙伴覆盖。比如一个小伙伴在一处代码里面写了一个 Target，但另一个小伙伴不知道，在另一个地方也写了相同名字的 Target，那么这两个 Target 也会相互覆盖，导致其中的一个失效。

虽然同名的属性跟 Target 一样的会被覆盖，但是我们可以通过在改写属性的值的时候同时获取这个属性之前设置的值，可以把以前的值保留下来。

正如上面的例子那样，我们通过写了两个新的 Target 的名字，分别叠加到 `$(BuildDependsOn)` 这个属性原有值的两边，使得我们可以在编译前后执行两个不同的 Target。如果有其他的小伙伴使用了相同的方式去改写这个属性的值，那么它获取原有值的时候就会把这里已经赋过的值放入到它新的值的中间。也就是说，一个也不会丢。

---

**参考资料**

- [Extend the build process - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/how-to-extend-the-visual-studio-build-process)
- [c# - Determine if MSBuild CoreCompile will run and call custom target - Stack Overflow](https://stackoverflow.com/questions/11667510/determine-if-msbuild-corecompile-will-run-and-call-custom-target)
