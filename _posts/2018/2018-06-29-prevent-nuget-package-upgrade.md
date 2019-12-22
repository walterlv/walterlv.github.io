---
title: "阻止某个 NuGet 包意外升级"
publishDate: 2018-06-29 17:59:00 +0800
date: 2019-04-12 09:38:45 +0800
categories: dotnet visualstudio nuget
---

出于兼容性考虑，我们可能不再更新某个项目的 NuGet 包。典型的情况是软件版本进行了大规模的不兼容的升级，需要对旧格式的数据进行读取，以便迁移到新格式的数据。

然而，团队开发的软件可能因为某个小伙伴不知道这样的历史问题，从而手抖将某个不应该更新的 NuGet 包更新了，于是迁移就挂了。

本文提供了一种方法来避免某些特定 NuGet 包的升级。

---

如果你只关心结果，请直接前往[最后一节：终极解决方案](#%E6%9C%80%E7%BB%88%E8%A7%A3%E5%86%B3)

## 准备工作

本文提供的方法仅适用于使用了 Sdk 风格的 csproj 项目文件。（当然并不是说旧的 csproj 不能使用这种方法，只是写法上会有差别，我没有去研究如何编写。）

如果你的项目还在使用旧的 csproj 格式，推荐阅读 [将 WPF、UWP 以及其他各种类型的旧 csproj 迁移成 Sdk 风格的 csproj](/post/introduce-new-style-csproj-into-net-framework) 迁移成新格式之后再开始。

作为例子，假设我们的项目文件是这样的：

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net47</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <PackageReference Include="LiteDB" Version="2.0.2" />
    <PackageReference Include="Newtonsoft.Json" Version="11.0.2" />
  </ItemGroup>
</Project>
```

![不一致的 LiteDB 版本](/static/posts/2018-06-29-17-02-09.png)

LiteDB 是一个不应该被升级的 NuGet 包，但是最新版本已经是 4.1.4 了，很容易被团队中的其他小伙伴误升级。

![包管理器](/static/posts/2018-06-29-17-04-14.png)  
▲ 当小伙伴打开包管理器的时候，会发现包版本不一致，然后就不小心升级了

## 思路

NuGet 使用 `PackageReference` 来管理所有的包引用，于是我试图通过隐藏 LiteDB 的 `PackageReference` 节点来达到目的。

而一个典型的隐藏方法便是使用 `Target`。不在 `Target` 里面的属性和项是提前计算好的，而 `Target` 里面的属性和项是编译时才计算的。

可以通过阅读 [如何编写基于 Microsoft.NET.Sdk 的跨平台的 MSBuild Target](/post/write-msbuild-target) 了解更多 Target 的知识。

所以，我写了这样的 `Target`，然后去掉前面的 `PackageReference`。

```xml
<!-- 其实这种改法并没有作用，可谁知道呢！ -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net47</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
  <!-- 在这里把之前的 LiteDB 去掉了。 -->
    <PackageReference Include="Newtonsoft.Json" Version="11.0.2" />
  </ItemGroup>
  <!-- 这是新写的 Target，用来在编译期间引用 LiteDB。不过我不知道应该在什么时机执行。 -->
  <Target Name="ReferenceStaticLegacyPackage" BeforeTargets="???">
    <ItemGroup>
      <PackageReference Include="LiteDB" Version="2.0.2" />
    </ItemGroup>
  </Target>
</Project>
```

还留了一个 `BeforeTargets` 没有填，因为并不知道应该填什么。于是我打开了 `Microsoft.NET.Sdk` 的文件夹 `C:\Program Files\dotnet\sdk\2.1.300\Sdks`，试图寻找时机。

搜索 `@(PackageReference)` 发现有很多的 `Target` 都依赖于一个名为 `CollectPackageReferences` 的 `Target`。

```xml
<Target Name="CollectResolvedSDKReferencesDesignTime"
        Returns="@(_ResolvedSDKReference)"
        DependsOnTargets="ResolveSDKReferencesDesignTime;CollectPackageReferences">
    <!-- 省略 -->
</Target>
```

从名称上可以猜测这是用来收集 `PackageReference` 的 `Target`。

于是我可以将我们的 `BeforeTargets` 指定为 `CollectPackageReferences`。

不过我发现在这种情况下，NuGet 包管理器的界面中能够发现这个项目使用了旧版本。并且在安装了新版本的包后，将因为多次引用不同版本而导致编译不通过。

所以，方案否决。

## 最终解决

既然无法阻止发现这个 NuGet 包，那思路就换成无论如何更新，都无效好了。

于是，通过 `Remove` 和重新 `Include` 固定版本来解决。

下面是项目的最终解决源码：

```xml
<!-- 其实这种改法并没有作用，可谁知道呢！ -->
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFramework>net47</TargetFramework>
  </PropertyGroup>
  <ItemGroup>
    <!-- 无论这里版本填写多少，都不会有效。 -->
    <PackageReference Include="LiteDB" Version="4.1.4" />
    <PackageReference Include="Newtonsoft.Json" Version="11.0.2" />
  </ItemGroup>
  <!-- 通过移除正常的引用并替换成固定版本的引用，达到无论如何更新都无法生效的目的。 -->
  <Target Name="ReferenceStaticLegacyPackage" BeforeTargets="CollectPackageReferences">
    <ItemGroup>
      <PackageReference Remove="LiteDB" />
      <PackageReference Include="LiteDB" Version="2.0.2" />
    </ItemGroup>
  </Target>
</Project>
```

在这种 `Target` 的帮助下，无论如何更新 LiteDB 的 NuGet 版本，都能更新成功，但无法生效。
