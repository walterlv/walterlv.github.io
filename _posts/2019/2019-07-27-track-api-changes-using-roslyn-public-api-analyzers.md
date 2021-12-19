---
title: "使用基于 Roslyn 的 Microsoft.CodeAnalysis.PublicApiAnalyzers 来追踪项目的 API 改动，帮助保持库的 API 兼容性"
date: 2019-07-27 16:54:26 +0800
tags: dotnet csharp visualstudio nuget roslyn
position: knowledge
---

做库的时候，需要一定程度上保持 API 的兼容性

---

<div id="toc"></div>

## 第一步：安装 NuGet 包

首先打开你的库项目，或者如果你希望从零开始也可以直接新建一个项目。这里为了博客阅读的简单，我创建一个全新的项目来演示。

![打开一个项目](/static/posts/2019-07-27-15-58-05.png)

然后，为主要的库项目安装 NuGet 包：

- [NuGet Gallery - Microsoft.CodeAnalysis.PublicApiAnalyzers](https://www.nuget.org/packages/Microsoft.CodeAnalysis.PublicApiAnalyzers)

![安装 NuGet 包](/static/posts/2019-07-27-15-59-10.png)

安装完成之后，你的项目文件（.csproj）可能类似于下面这样：

```xml
<Project Sdk="Microsoft.NET.Sdk">

  <PropertyGroup>
    <TargetFramework>netstandard2.0</TargetFramework>
  </PropertyGroup>

  <ItemGroup>
    <PackageReference Include="Microsoft.CodeAnalysis.PublicApiAnalyzers" Version="2.9.3" />
  </ItemGroup>

</Project>
```

## 第二步：创建 API 记录文件

在你的项目内创建两个文件：

- PublicAPI.Shipped.txt
- PublicAPI.Unshipped.txt

![创建 API 记录文件](/static/posts/2019-07-27-16-01-09.png)

这就是两个普通的文本文件。创建纯文本文件的方法是在项目上右键 -> `添加` -> `新建项...`，然后在打开的模板中选择 `文本文件`，使用上面指定的名称即可（要创建两个）。

然后，编辑项目文件，我们需要将这两个文件加入到项目中来。

![编辑项目文件](/static/posts/2019-07-27-16-13-59.png)

如果你看不到上图中的“编辑项目文件”选项，则需要升级项目文件到 SDK 风格，详见：

- [将 WPF、UWP 以及其他各种类型的旧 csproj 迁移成 Sdk 风格的 csproj - walterlv](/post/introduce-new-style-csproj-into-net-framework)

然后，将这两个文件添加为 `AdditionalFiles`：

```diff
  <Project Sdk="Microsoft.NET.Sdk">

    <PropertyGroup>
      <TargetFramework>netstandard2.0</TargetFramework>
    </PropertyGroup>

    <ItemGroup>
      <PackageReference Include="Microsoft.CodeAnalysis.PublicApiAnalyzers" Version="2.9.3" />
    </ItemGroup>

+   <ItemGroup>
+     <AdditionalFiles Include="PublicAPI.Shipped.txt" />
+     <AdditionalFiles Include="PublicAPI.Unshipped.txt" />
+   </ItemGroup>

  </Project>
```

如果你把这两个文件放到了其他的路径，那么上面也需要改成对应的路径。

这时，这两个文件内容还是空的。

## 第三步：添加 API 记录

这个时候，你会看到库中的 `public` 类、方法、属性等都会发出修改建议，说此符号并不是已声明 API 的一部分。

![类型](/static/posts/2019-07-27-16-27-38.png)

![属性](/static/posts/2019-07-27-16-28-51.png)

点击小灯泡，即可将点击所在的 API 加入到 `PublicAPI.Unshipped.txt` 中。

我将两个 API 都添加之后，`PublicAPI.Unshipped.txt` 文件中现在是这样的（注意有一个隐式构造函数哦）：

```
Walterlv.PackageDemo.ApiTracking.Class1
Walterlv.PackageDemo.ApiTracking.Class1.Class1() -> void
Walterlv.PackageDemo.ApiTracking.Class1.Foo.get -> string
```

## 体验 API 的追踪

现在，我们将 Foo 属性改名成 Foo2 属性，于是就会出现编译警告：

![编译警告](/static/posts/2019-07-27-16-45-51.png)

> RS0016 Symbol 'Foo2.get' is not part of the declared API.  
> RS0017 Symbol 'Walterlv.PackageDemo.ApiTracking.Class1.Foo.get -> string' is part of the declared API, but is either not public or could not be found

提示 `Foo2` 属性不是已声明 API 的一部分，而 `Foo` 属性虽然是已声明 API 的一部分，但已经找不到了。

这种提示对于保持库的兼容性是非常有帮助的。

## 将警告变成错误

在分析器的规则上面右键，可以为某项规则设置严重性。

![将警告设置为错误](/static/posts/2019-07-27-16-44-27.png)

这时，再编译即会报告编译错误。

![编译错误](/static/posts/2019-07-27-16-49-28.png)

项目中也会多一个规则集文件：

```diff
  <Project Sdk="Microsoft.NET.Sdk">

    <PropertyGroup>
      <TargetFramework>netstandard2.0</TargetFramework>
+     <CodeAnalysisRuleSet>Walterlv.PackageDemo.ApiTracking.ruleset</CodeAnalysisRuleSet>
    </PropertyGroup>

    <ItemGroup>
      <PackageReference Include="Microsoft.CodeAnalysis.PublicApiAnalyzers" Version="2.9.3" />
    </ItemGroup>

    <ItemGroup>
      <AdditionalFiles Include="PublicAPI.Shipped.txt" />
      <AdditionalFiles Include="PublicAPI.Unshipped.txt" />
    </ItemGroup>

  </Project>
```

## 第四步：将 API 打包

前面我们都是在 `PublicAPI.Unshipped.txt` 文件中追踪 API。但是如果我们的库需要发布一个版本的时候，我们就需要跟上一个版本比较 API 的差异。

上一个发布版本的 API 就记录在 `PublicAPI.Shipped.txt` 文件中，这两个文件的差异即是这两个版本的 API 差异。在一个新的版本发布后，就需要将 API 归档到 `PublicAPI.Shipped.txt` 文件中。

---

**参考资料**

- [roslyn-analyzers/Microsoft.CodeAnalysis.PublicApiAnalyzers.md at master · dotnet/roslyn-analyzers](https://github.com/dotnet/roslyn-analyzers/blob/master/src/PublicApiAnalyzers/Microsoft.CodeAnalysis.PublicApiAnalyzers.md)
