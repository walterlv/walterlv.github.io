---
layout: post
title: "设置 .NET Native 运行时指令以支持反射（尤其适用于 UWP）"
date: 2017-09-21 00:38:17 +0800
categories: uwp
keywords: uwp dotnet native dynamic reflection
description: 如果你正在写 UWP 程序时发现 DEBUG 下可以反射获取到属性，但是 RELEASE 下获取不到，那么了解本文将有助于你解决问题。
---

我们经常会尝试用一用反射来解决一部分动态可执行代码的问题，不过这个问题在 UWP 中似乎并不那么轻松。也许你写了一句获取某个类所有属性的代码，结果发现 DEBUG 下跑得好好的，RELEASE 下居然拿不到！

---

### 尝试反射获取属性

你的代码可能是这样的：

```csharp
var properties = typeof(SomeType).GetProperties();
```

或者这样的：

```csharp
var properties = type.GetTypeInfo().DeclaredProperties;
```

但无论哪一种，DEBUG 下 `properties` 集合中有我们想要的属性集合，如下图：

![DEBUG 下拿到的属性](/assets/2017-09-20-23-55-48.png)

`type.GetTypeInfo().DeclaredProperties` 帮我们拿到了当前类的属性，`typeof(SomeType).GetProperties()` 帮我们拿到了当前类和其所有父类的属性。

然而，RELEASE 下的结果却是这样的：

![DEBUG 下拿到的属性](/assets/2017-09-21-00-00-12.png)

其中后者虽然有两个实例，却是：

![空和继承的属性](/assets/2017-09-21-00-02-54.png)

这就诡异了，DEBUG 和 RELEASE 下到底有什么区别呢？

### 设置 .NET 本机工具链编译选项

经过一番 Google，发现 RELEASE 下编译开启了 .NET 本机工具链选项，这使得 RELEASE 下生成的是静态的本机代码。

![RELEASE 下的 .NET 本机工具链编译选项](/assets/2017-09-20-23-40-39.png)

试着去掉这个选项，果然以上的反射代码能够得到期望的属性集合。然而这样就丢失了 .NET Native 带给我们棒棒的性能优势了啊！

### 设置 .NET Native 运行时指令

所以更推荐的做法是什么呢？微软为我们提供了设置 .NET Native 运行时指令的方法，展开解决方案项目的 Properties 文件夹，我们可以找到 `Default.rd.xml` 文件。

![Default.rd.xml](/assets/2017-09-21-00-11-31.png)

查看里面的内容，微软为我们写了很详细的注释：

```xml
<!--
    此文件包含 .NET Native 使用的运行时指令。此处的默认值适合大多数
    开发人员。但可通过修改这些参数来修改 .NET Native
    优化程序的行为。

    运行时指令记录在 https://go.microsoft.com/fwlink/?LinkID=391919

    完全启用对 App1.MyClass 及其所有公共/私有成员的反射
    <Type Name="App1.MyClass" Dynamic="Required All"/>

    通过 System.Int32 启用 AppClass<T> 的特定实例的动态创建
    <TypeInstantiation Name="App1.AppClass" Arguments="System.Int32" Activate="Required Public" />

    使用 Namespace 指令将反射策略应用于特定命名空间中的所有类型
    <Namespace Name="DataClasses.ViewModels" Serialize="All" />
-->
```

注意到微软其实已经直接在注释里告诉了我们此文件的目的和用法了。而且此文件几乎就是设计来解决反射问题的！于是，我们把我们测试用的类放进去试试看，如下：

```xml
<Directives xmlns="http://schemas.microsoft.com/netfx/2013/01/metadata">
  <Application>
    <!-- Name="*Application*" 的程序集元素将应用到应用程序包中的所有程序集。星号不是通配符。-->
    <Assembly Name="*Application*" Dynamic="Required All" />
    <!-- 在此处添加应用程序特定的运行时指令。-->
    <Type Name="ReflectionDemo.MainPage" Dynamic="Required All"/>
  </Application>
</Directives>
```

结果并没有得到任何改变……

但注意到微软同时还有一个注释，`*Application*" 的程序集元素将应用到应用程序包中的所有程序集。星号不是通配符。`这是说，我们自己项目中的所有程序包其实都是支持反射的，只是我们引用的微软库才不支持。于是将我们测试用的类 `MainPage` 的基类都放进去，为了简单，我按照微软的注释写成了命名空间。

```xml
<Directives xmlns="http://schemas.microsoft.com/netfx/2013/01/metadata">
  <Application>
    <!-- Name="*Application*" 的程序集元素将应用到应用程序包中的所有程序集。星号不是通配符。-->
    <Assembly Name="*Application*" Dynamic="Required All" />
    <!-- 在此处添加应用程序特定的运行时指令。-->
    <Namespace Name="Windows.UI.Xaml" Serialize="All"/>
  </Application>
</Directives>
```

再次运行，已经可以反射获取到所有的属性了。经过尝试，在写了 `Windows.UI.Xaml` 命名空间后，它的子命名空间 `Windows.UI.Xaml.Controls` 是可以不用写的。

#### 参考资料
- [c# - Type.GetProperties() doesn't work in Release - Stack Overflow](https://stackoverflow.com/questions/35359942/type-getproperties-doesnt-work-in-release/35361710)
- [c# - Adding runtime directives for generic types in UWP app - Stack Overflow](https://stackoverflow.com/questions/39365184/adding-runtime-directives-for-generic-types-in-uwp-app)
- [.NET Native Deep Dive: Dynamic Features in Static Code | .NET Blog](https://blogs.msdn.microsoft.com/dotnet/2014/05/20/net-native-deep-dive-dynamic-features-in-static-code/)
