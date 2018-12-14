---
title: "让一个 csproj 项目指定多个开发框架"
publishDate: 2018-01-21 11:28:55 +0800
date: 2018-12-14 09:54:00 +0800
categories: visualstudio
---

可移植类库、共享项目、.NET Standard 项目都能够帮我们完成跨多个 .NET SDK 的单一项目开发，但它们的跨 SDK 开发都有些限制。现在，我们又有新的方式能够跨多个 .NET SDK 开发了，这就是使用新的 csproj 文件格式。

---

看看拥有多个开发框架的项目长什么样吧！

![多 SDK 的项目](/static/posts/2018-02-12-15-17-26.png)  
▲ 多 SDK 项目

这个是我和 [erdao](https://github.com/erdao) 在 GitHub 上开源项目 [dotnet-campus/MSTestEnhancer](https://github.com/dotnet-campus/MSTestEnhancer) 的项目依赖截图。是不是很激动？

<p id="toc"></p>

### 新 csproj 文件

在 [如何组织一个同时面向 UWP/WPF/.Net Core 控制台的 C# 项目解决方案 - walterlv](/post/organize-csharp-project-targeting-multiple-platforms.html) 一文中我讲了 .NET Standard 的方式，这种方式优势非常明显，跟普通的开发方式一样，也是我最推荐的方式。但缺点是要求目标 SDK 支持对应的 .NET Standard 版本。

使用**共享项目**的方式则是直接共享了源码，只要在目标项目中指定了条件编译符，那么源码便能针对各种不同的目标框架进行分别编译。但缺点是对扩展插件的支持较差（可能是因为扩展插件难以判断项目的真实开发框架），而且 Visual Studio 本身对它的支持也有 BUG（例如切换编写文件所属的项目经常会失败）。

新的 csproj 文件能够指定多个开发框架。这样，我们便能同时编写适用于 .NET Framework 4.5 的和 .NET Standard 2.0 的代码，同时还能够得到 Visual Studio 和扩展插件较好的支持。

.NET Standard 和 .NET Core 项目在创建之时就已经是新的 csproj 格式了，但 .NET Framework 项目、UWP/WPF 项目依然使用旧风格的 csproj 文件。对于 .NET Framework 项目，可以通过 [将 WPF、UWP 以及其他各种类型的旧 csproj 迁移成基于 Microsoft.NET.Sdk 的新 csproj - walterlv](/post/introduce-new-style-csproj-into-net-framework.html) 一文进行迁移。不过**对于 WPF/UWP 项目，根本就没有跨多个 SDK 的必要，就不要改了**……

如果是新开项目——强烈建议先按照 .NET Standard 项目类型建好，再修改成多开发框架。

### 如何指定多个开发框架

只要是新 csproj 文件，指定多个开发框架真的是相当的简单。

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFrameworks>net45;netstandard2.0</TargetFrameworks>
  </PropertyGroup>
  <!-- 这个文件里的其他内容 -->
</Project>
```

请**特别注意**！！！`TargetFramework` 从单数形式变为了复数形式 `TargetFrameworks`！！！这个时候，`TargetFramework` 是编译时自动指定的。

如果是对以上多框架的项目进行单元测试，考虑到编译的目标平台是多个的，单元测试项目也需要指定多个目标框架。

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFrameworks>net471;netcoreapp2.0</TargetFrameworks>
    <IsPackable>false</IsPackable>
  </PropertyGroup>
  <!-- 这个文件里的其他内容 -->
</Project>
```

### 多框架项目的坑以及如何避坑

微软的官方文档 [How to: Configure Projects to Target Multiple Platforms - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/ide/how-to-configure-projects-to-target-multiple-platforms?wt.mc_id=MVP) 中只说了如何指定多个目标框架，并没有提及指定了多框架以后的坑。

如果多开发框架中包含了低版本的 .NET Framework，例如 4.0/4.5 等，那么这些坑才比较容易凸显——因为这些版本的 .NET Framework 与 .NET Standard 的第三方库差异较大。所以，我们需要有方法来解决其第三方库引用的差异。这时需要在 csproj 文件中指定包含条件。例如：

```xml
<Project Sdk="Microsoft.NET.Sdk">
  <PropertyGroup>
    <TargetFrameworks>net471;netcoreapp2.0</TargetFrameworks>
    <OutputType Condition="'$(TargetFramework)'!='netcoreapp2.0'">Exe</OutputType>
    <IsPackable>false</IsPackable>
  </PropertyGroup>

  <!-- 这里的引用是二者共有的 -->
  <ItemGroup>
    <PackageReference Include="MSTest.TestAdapter" Version="1.2.0" />
    <PackageReference Include="MSTest.TestFramework" Version="1.2.0" />
  </ItemGroup>

  <!-- 这里的引用用于非 .NET Core 框架 -->
  <ItemGroup Condition="'$(TargetFramework)'!='netcoreapp2.0'">
    <PackageReference Include="Xxx" Version="1.0.*" />
  </ItemGroup>

  <!-- 这里的引用用于 .NET Core 框架 -->
  <ItemGroup Condition="'$(TargetFramework)'=='netcoreapp2.0'">
    <PackageReference Include="Yyy" Version="1.0.*" />
  </ItemGroup>

</Project>
```

在 [dotnet-campus/MSTestEnhancer](https://github.com/dotnet-campus/MSTestEnhancer) 项目中，只有 .NET Framework 4.5 才需要引用 `System.ValueTuple`，于是加上了 `net45` 条件判断：

```xml
<!--EXTERNAL_PROPERTIES: TargetFramework-->
<ItemGroup Condition="'$(TargetFramework)'=='net45'">
  <PackageReference Include="System.ValueTuple" Version="4.4.0" />
</ItemGroup>
```

那段注释的作用是告诉代码分析工具 `TargetFramework` 是外部属性，上下文环境中找不到这个属性是正常的。

---

#### 参考资料

- [impromptu-interface/ImpromptuInterface.csproj at master · ekonbenefits/impromptu-interface](https://github.com/ekonbenefits/impromptu-interface/blob/master/ImpromptuInterface/ImpromptuInterface.csproj)
- [How to: Configure Projects to Target Multiple Platforms - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/ide/how-to-configure-projects-to-target-multiple-platforms?wt.mc_id=MVP)
