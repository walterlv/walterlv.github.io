---
title: "理解 C# 项目 csproj 文件格式的本质"
date: 2018-05-07 19:24:05 +0800
categories: visualstudio
published: false
---

写了这么多个 C# 项目，是否对项目文件 csproj 有一些了解呢？Visual Studio 是怎么让 csproj 中的内容正确显示出来的呢？更深入的，我能够自己扩展 csproj 的功能吗？

本文将直接从 csproj 文件格式的本质来看以上这些问题。

---

阅读本文，你将：

- 可以通读 csproj 文件，并说出其中每一行的含义
- 可以手工修改 csproj 文件，以实现你希望达到的高级功能（更高级的，可以开始写个工具自动完成这样的工作了）
- 理解新旧 csproj 文件的差异，不至于写工具解析和修改 csproj 文件的时候出现不兼容的错误

<div id="toc"></div>

### csproj 里面是什么？

#### 总览 csproj 文件

相信你一定见过传统的 csproj 文件格式。就算你几乎从来没主动去看过里面的内容，在版本管理工具中解冲突时也在里面修改过内容。

不管你是新手还是老手，一定都会觉得这么长这么复杂的文件一定不是给人类阅读的。你说的是对的！传统 csproj 文件中有大量的重复或者相似内容，只为 msbuild 和 Visual Studio 能够识别整个项目的属性和结构，以便正确编译项目。

不过，既然这篇文字的目标便是理解 csproj 文件格式的本质，那我当然不会把这么复杂的文字直接给你去阅读。

我已经将整个文件结构进行了极度简化，然后用思维导图进行了分割。总结成了下图，如果先不关注文件的细节，是不是更容易看懂了呢？

![传统的 csproj 文件格式](/static/posts/2018-05-05-12-31-53.png)

如果你此前也阅读过我的其他博客，会发现我一直在试图推荐使用新的 csproj 格式：

- [将 WPF、UWP 以及其他各种类型的旧样式的 csproj 文件迁移成新样式的 csproj 文件](https://walterlv.github.io/post/introduce-new-style-csproj-into-net-framework.html)
- [让一个 csproj 项目指定多个开发框架](https://walterlv.github.io/post/configure-projects-to-target-multiple-platforms.html)

那么新格式和旧格式究竟有哪些不同使得新的格式如此简洁？

于是，我将新的 csproj 文件结构也进行简化，用思维导图进行了分割。总结成了下图：

![跨平台的 csproj 文件格式](/static/posts/2018-05-07-08-41-22.png)

比较两个思维导图之后，是不是发现其实两者本是相同的格式。如果忽略我在文字颜色上做的标记，其实两者的差异几乎只在文件开头是否有一个 xml 文件标记（`<?xml version="1.0" encoding="utf-8"?>`）。我在文字颜色上的标记代表着这部分的部件是否是可选的，白色代表必须，灰色代表可选；而更接近背景色的灰色代表一般情况下都是不需要的。

我把两个思维导图放到一起方便比较：

![新旧两种 csproj 文件格式的差异](/static/posts/2018-05-07-08-42-05.png)

会发现，传统格式中 `xml 声明`、`Project 节点`、`Import (props)`、`PropertyGroup`、`ItemGroup`、`Import (targets)` 都是必要的，而新格式中只有 `Project 节点` 和 `PropertyGroup` 是必要的。

是什么导致了这样的差异？在了解 csproj 文件中各个部件的作用之前，这似乎很难回答。

#### 了解 csproj 中的各个部件的作用

xml 声明部分完全没有在此解释的必要了，为兼容性提供了方便，详见：[XML - Wikipedia](https://en.wikipedia.org/wiki/XML#International_use)。

接下来，我们不会依照部件出现的顺序安排描述的顺序，而是按照关注程度排序。

##### PropertyGroup

`PropertyGroup` 是用来存放属性的地方，这与它的名字非常契合。那么里面放什么属性呢？答案是——什么都能放！

在这里写属性就像在代码中定义属性或变量一样，只要写了，就会生成一个指定名称的属性。

比如，我们写：

> ```xml
> <PropertyGroup>
>   <Foo>walterlv is a 逗比</Foo>
> <PropertyGroup>
> ```

那么，就会生成一个 `Foo` 属性，值为字符串 `walterlv is a 逗比`。至于这个属性有什么用，那就不归这里管了。

这些属性的含义完全是由外部来决定的，例如在旧的 csproj 格式中，编译过程中会使用 `TargetFrameworkVersion` 属性，以确定编译应该使用的 .NET Framework 目标框架的版本（是 v4.5 还是 v4.7）。在新的 csproj 格式中，编译过程会使用 `TargetFrameworks` 属性来决定编译应该使用的目标框架（是 net47 还是 netstandard2.0）。具体是编译过程中的哪个环节哪个组件使用了此属性，我们后面会说。

从这个角度来说，如果你没有任何地方用到了你定义的属性，那为什么还要定义它呢？是的——这只是浪费。

`PropertyGroup` 可以定义很多个，里面都可以同等地放属性。至于为什么会定义多个，原因无外乎两个：

1. 为了可读性——将一组相关的属性放在一起，便于阅读和理解意图（旧的 csproj 谈不上什么可读性）
1. 为了加条件——有的属性在 Debug 和 Release 下不一样（例如条件编译符 `DefineConstants`）

额外说一下，`Debug` 和 `Release` 这两个值其实是在某处一个名为 `Configuration` 的属性定义的，它们其实只是普通的字符串而已，没什么特殊的意义，只是有很多的 `PropertyGroup` 加上了 `Debug` `Release` 的判断条件才使得不同的 `Configuration` 具有不同的其他属性，最终表现为编译后的巨大差异。由于 `Configuration` 属性可以放任意字符串，所以甚至可以定义一个非 `Debug` 和 `Release` 的配置（例如用于性能专项测试）也是可以的。

##### ItemGroup

`ItemGroup` 是用来指定集合的地方，这与它的名字非常契合。那么这集合里面放什么项呢？答案是——什么都能放！

是不是觉得这句话跟前面的 `PropertyGroup` 句式一模一样？是的——就是一模一样！csproj 中的两个大头都这样不带语义，几乎可以说明 csproj 文件是不包含语义的，它能够用来做什么事情纯属由其他模块来指定；这为 csproj 文件强大的扩展性提供了格式基础。

既然什么都能放，那我们放这些吧：

> ```xml
> <ItemGroup>
>   <Foo>walterlv is a 逗比</Foo>
>   <Foo>walterlv is a 天才</Foo>
>   <Foo>天才向左，逗比向右</Foo>
>   <Foo>逗比属性额外加成</Foo>
> </ItemGroup>
> ```

于是我们就有 4 个类型为 `Foo` 的项了，至于这 4 个 `Foo` 项有什么作用，那就不归这里管了。

这些项的含义与 `PropertyGroup` 一样也是由外部来决定。具体是哪个外部，我们稍后会说。但是我们依然有一些常见的项可以先介绍介绍：

- `Reference` 引用某个程序集
- `PackageReference` 引用某个 NuGet 包
- `ProjectReference` 引用某个项目
- `Compile` 常规的 C# 编译
- `None` 没啥特别的编译选项，就为了执行一些通用的操作（或者是只是为了在 Visual Studio 列表中能够有一个显式）
- `Folder` 一个空的文件夹，也没啥用（不过标了这个文件夹，Visual Studio 中就能有一个文件夹的显式，即便实际上这个文件夹可能不存在）

`ItemGroup` 也可以放很多组，一样是为了提升可读性或者增加条件。

##### Import

你应该注意到在前面的思维导图中，无论是新 csproj 还是旧 csproj 文件，我都写了两个 `Import` 节点。其实它们本质上是完全一样的，只不过在含义上有不同。前面我们了解到 csproj 文件致力于脱离语义，所以分开两个地方写几乎只是为了可读性考虑。

那么前面那个 `Import` 和后面的 `Import` 在含义上有何区别？思维导图的括号中我已说明了含义。前面是为了导入属性（props），后面是为了导入 `Targets`。属性就是前面 `PropertyGroup` 中说的那些属性和 `ItemGroup` 里说的那些项；而 `Targets` 是新东西，这才是真正用来定义编译流程的关键，由于 `Targets` 是所有节点里面最复杂的部分，所以我们放到最后再说。

那么，被我们 `Import` 进来的那些文件是什么呢？用两种扩展名，定义属性的那一种是 `.props`，定义行为的那一种是 `.targets`。

这两种文件除了含义不同以外，内容的格式都是完全一样的——而且——就是 csproj 文件的那种格式！没错，也包含 `Project`、`Import`、`PropertyGroup`、`ItemGroup`、`Targets`。只不过，相比于对完整性有要求的 csproj 文件来说，这里可以省略更多的节点。由于有 `Import` 的存在，所以一层一层地嵌套 `props` 或者 `targets` 都是可能的。

说了这么多，让我们来看其中两个 .props 文件吧。

先看看旧格式 csproj 文件中第一行一定会 `Import` 的那个 `Microsoft.Common.props`。

```xml
<!-- 文件太长，做了大量删减 -->
<Project ToolsVersion="4.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <PropertyGroup>
    <ImportByWildcardBeforeMicrosoftCommonProps Condition="'$(ImportByWildcardBeforeMicrosoftCommonProps)' == ''">true</ImportByWildcardBeforeMicrosoftCommonProps>
    <ImportByWildcardAfterMicrosoftCommonProps Condition="'$(ImportByWildcardAfterMicrosoftCommonProps)' == ''">true</ImportByWildcardAfterMicrosoftCommonProps>
    <ImportUserLocationsByWildcardBeforeMicrosoftCommonProps Condition="'$(ImportUserLocationsByWildcardBeforeMicrosoftCommonProps)' == ''">true</ImportUserLocationsByWildcardBeforeMicrosoftCommonProps>
    <ImportUserLocationsByWildcardAfterMicrosoftCommonProps Condition="'$(ImportUserLocationsByWildcardAfterMicrosoftCommonProps)' == ''">true</ImportUserLocationsByWildcardAfterMicrosoftCommonProps>
    <ImportDirectoryBuildProps Condition="'$(ImportDirectoryBuildProps)' == ''">true</ImportDirectoryBuildProps>
  </PropertyGroup>
</Project>
<!-- 文件太长，做了大量删减 -->
```

文件太长，做了大量删减，但也可以看到文件格式与 csproj 几乎是一样的。此文件中，根据其他属性的值有条件地定义了另一些属性。

再看看另一个 MSTest 单元测试项目中被隐式 `Import` 进 csproj 文件中的 .props 文件。（*所谓隐式地 `Import`，只不过是被间接地引入，在 csproj 文件中看不到这个文件名而已。至于如何间接引入，因为涉及到 `Targets`，所以后面一起说明。*）

```xml
<?xml version="1.0" encoding="utf-8"?>
<Project ToolsVersion="12.0" xmlns="http://schemas.microsoft.com/developer/msbuild/2003">
  <ItemGroup>
    <Content Include="$(MSBuildThisFileDirectory)..\_common\Microsoft.VisualStudio.TestPlatform.MSTest.TestAdapter.dll">
      <Link>Microsoft.VisualStudio.TestPlatform.MSTest.TestAdapter.dll</Link>
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
      <Visible>False</Visible>
    </Content>
    <Content Include="$(MSBuildThisFileDirectory)..\_common\Microsoft.VisualStudio.TestPlatform.MSTestAdapter.PlatformServices.Interface.dll">
      <Link>Microsoft.VisualStudio.TestPlatform.MSTestAdapter.PlatformServices.Interface.dll</Link>
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
      <Visible>False</Visible>
    </Content>
	<Content Include="$(MSBuildThisFileDirectory)..\_common\Microsoft.VisualStudio.TestPlatform.MSTestAdapter.PlatformServices.dll">
      <Link>Microsoft.VisualStudio.TestPlatform.MSTestAdapter.PlatformServices.dll</Link>
      <CopyToOutputDirectory>PreserveNewest</CopyToOutputDirectory>
      <Visible>False</Visible>
    </Content>
  </ItemGroup>
</Project>
```

此文件中将三个 dll 文件从 MSTest 的 NuGet 包中以链接的形式包含到项目中，并且此文件在 Visual Studio 的解决方案列表中不可见。

可以看出，引入的 props 文件可以实现几乎与 csproj 文件中一样的功能。

那么，既然 csproj 文件中可以完全实现这样的功能，为何还要单独用 `props` 文件来存放呢？原因显而易见了——为了在多个项目中使用，**一处更新，到处生效**。所以有没有觉得很好玩——如果把版本号单独放到 props 文件中，就能做到一处更新版本号，到处更新版本号啦！

##### Project

所有的 csproj 文件都是以 `Project` 节点为根节点。对于传统的 csproj 格式来说

