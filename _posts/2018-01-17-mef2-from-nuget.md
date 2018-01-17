---
title: ".NET Core 和 .NET Framework 中的 MEF2"
date: 2018-01-17 23:41:00 +0800
categories: visualstudio dotnet
---

MEF，Managed Extensibility Framework，现在已经发布了三个版本了，它们是 MEF 和 MEF2。

等等！3 去哪儿了？本文将教大家完成基于 MEF2 的开发。

---

<div id="toc"></div>

### MEF 和 MEF2

其实微软发布了四个版本的 MEF：

- 随着 .NET Framework 4.0 发布，微软称之为 MEF
- 随着 .NET Framework 4.5 发布，微软让它更好用了，微软称之为 MEF2，但因为接口兼容，也直接称之为 MEF
- .NET 开发团队觉得 MEF 第一代性能太差，于是通过 NuGet 为移动设备发布了可移植类库，是个轻量级版本，只移植了 .NET Framework 中 MEF2 里 2 的部分；随后 .NET Core 中也加入了 MEF2，也是 .NET Framework 中 MEF2 里 2 的部分
- Visual Studio 开发团队觉得 .NET Framework 里的 MEF2 性能太差，NuGet 版的 MEF2 功能太少，于是自己又写了一个，微软称之为 VS-MEF

对于第一代的 MEF，我们这里就完全不说了，性能又差功能又少，没有利用价值。

对于 .NET Framework 4.5 里引入的 MEF2，性能上没能改进多少，倒是使用起来功能更多。详细资料和使用方法请参考微软官方的文档：

- [Managed Extensibility Framework (MEF) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/mef/)
- [Attributed Programming Model Overview (MEF) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/mef/attributed-programming-model-overview-mef)

而本文主要说的 MEF2 是微软后来以 NuGet 包形式发布的 MEF2；适用于 .NET Framework 4.5 及以上、.NET Core 和各种 .NET 移动平台。它的接口相比于 .NET Framework 中原生带的已经变了，中文和英文的参考资料很少，几乎都是参考微软官方发布的文档才能使用。所以本文将为大家提供其中文的使用方法指导。

至于性能提升程度，我没有进行定量测试，所以直接从 [IoC Container Benchmark - Performance comparison - www.palmmedia.de](http://www.palmmedia.de/blog/2011/8/30/ioc-container-benchmark-performance-comparison) 一文中搬运了性能测试结果，如下：

![性能报告](/static/posts/2018-01-17-08-49-22.png)

### 安装 MEF2

.NET Framework 中自带的 MEF 在程序集 System.ComponentModel.Composition.dll 中，命名空间为 `System.ComponentModel.Composition`。MEF2 随 NuGet 包发布，其 NuGet 包名是 Microsoft.Composition，命名空间为 `System.Composition`。

![Microsoft.Composition](/static/posts/2018-01-17-23-10-07.png)

所以，在需要使用 MEF2 的项目中安装以上 NuGet 包即可完成安装。

### 使用 MEF2 开发

MEF 完全使用特性来管理容器中的依赖，微软称之为 Attributed Programming Model，并辅以广告——不需要配置文件的依赖注入容器。所以，使用特性来标记依赖关系就成了 MEF 的招牌依赖管理方式。

使用方法我将分为两个部分来讲，最容易的是业务代码，给开发团队中所有成员使用的代码。比较难的是框架代码，给开发团队中写框架的那一部分成员。

#### 业务代码

业务代码的写法其实取决于框架开发者怎么去定义框架。但是，为了方便大家理解，在这一节我将只说 MEF2 最原生的使用方法。框架那一节我才会说明如何自定义业务代码的写法。

最原生的使用方法其实只有两个——`[Import]` 和 `[Export]`，其它都是变种！具体说来，标记了 `Export` 的类将导出给其它类使用；标记了 `Import` 的属性/字段/方法参数等将接收来自 `Export` 的那些类/属性/字段的实例。

##### Import/Export

未完待续……

##### IEnumerable/Lazy

未完待续……

#### 框架代码

框架代码也分为两个部分：一个部分是初始化，初始化后可以创建一个依赖注入容器；另一个部分是管理依赖，将使用之前初始化好的依赖注入容器进行管理。

初始化的最简代码如下：

```csharp
var compositionHost = new ContainerConfiguration().CreateContainer();
```

那么，得到的 compositionHost 变量将是用来管理依赖的容器，你可以将它储存在字段中用于随后管理依赖。

但是，只是这么初始化将得不到任何对象。所以，我们需要额外添加配置代码，以便将一些程序集中的对象添加到容器中：

```csharp
var compositionHost = new ContainerConfiguration().WithAssemblies(new []
{
    typeof(A).Assembly,
    typeof(B).Assembly,
    typeof(C).Assembly,
    typeof(D).Assembly,
}).CreateContainer();
```

这样，A/B/C/D 这四个类分别所在的程序集中，直接或间接加了 `[Export]` 特性的类都将被此依赖容器管理。

未完待续……

MEF2 之所以为 2，因为它除了能通过 `[Export]` 特性导出，还能直接在框架中发现而不必由业务开发者手动指定。比如我们可以将所有的 ViewModel 导出：

```csharp
// 使用 ConventionBuilder 自动导出所有的 ViewModel。
var convention = new ConventionBuilder();

// 将所有继承自 ViewModelBase 的类导出，并共享一个实例（即注入到多个属性中的都是同一个实例）。
convention.ForTypesDerivedFrom<ViewModelBase>().Export().Shared();

// 使用这些配置创建依赖注入容器。
var compositionHost = new ContainerConfiguration().WithAssemblies(new []
{
    typeof(A).Assembly,
    typeof(B).Assembly,
    typeof(C).Assembly,
    typeof(D).Assembly,
}).WithDefaultConventions(convention).CreateContainer();;
```

未完待续……

---

#### 参考资料

- [MEF in .NET 4.5 - CodeProject](https://www.codeproject.com/Tips/488513/MEF-in-NET)
- [Managed Extensibility Framework(MEF) 2 框架新特性介绍 - PetterLiu - 博客园](http://www.cnblogs.com/wintersun/archive/2013/01/16/2863405.html)
- [Is MEF or MEF2 baked into the .NET Framework? - Stack Overflow](https://stackoverflow.com/questions/33484403/is-mef-or-mef2-baked-into-the-net-framework)
- [vs-mef/why.md at master · Microsoft/vs-mef](https://github.com/Microsoft/vs-mef/blob/master/doc/why.md)
- [mef/Home.md at master · MicrosoftArchive/mef](https://github.com/MicrosoftArchive/mef/blob/master/Wiki/Home.md)