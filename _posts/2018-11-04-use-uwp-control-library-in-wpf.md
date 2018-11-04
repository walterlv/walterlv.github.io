---
title: "WindowsXamlHost：在 WPF 中使用 UWP 控件库中的控件"
date: 2018-11-04 11:55:49 +0800
categories: uwp wpf dotnet
---

在 [WindowsXamlHost：在 WPF 中使用 UWP 的控件（Windows Community Toolkit）](https://walterlv.com/post/use-uwp-controls-in-wpf.html) 一文中，我们说到了在 WPF 中引入简单的 UWP 控件以及相关的注意事项。不过，通常更有实际价值的是更复杂的 UWP 控件的引入，通常是一整个 Page。

本文将介绍如何在 WPF 项目中引用 UWP 的控件库。

---

<div id="toc"></div>

### 创建一个 UWP 控件库

建议专门为你复杂的 UWP 控件创建一个 UWP 控件库。在这个控件库中的开发就像普通 UWP 应用一样。这样比较容易创建出更复杂的 UWP 控件出来，而不会与 WPF 项目产生太多的影响。

![创建一个 UWP 控件库](/static/posts/2018-11-04-11-05-48.png)  
▲ 创建一个 UWP 控件库

![选择 SDK 版本](/static/posts/2018-11-04-11-06-45.png)  
▲ 选择 SDK 版本

### 对 WPF 项目的准备工作

你依然需要阅读 [WindowsXamlHost：在 WPF 中使用 UWP 的控件（Windows Community Toolkit）](https://walterlv.com/post/use-uwp-controls-in-wpf.html) 一文，以便将你的 WPF 项目改造成可以访问 UWP 类型的项目。

### 不方便的引入方式

你如果直接让 WPF 项目添加 UWP 项目的引用，将会得到一个错误提示：

![不能引用](/static/posts/2018-11-04-11-49-27.png)

也就是说并不能直接完成这样的引用。

也许将来 WPF 项目格式更新或者 Visual Studio 的更新能为我们带来这样更直接此引用方式。不过现在来看，还不能如此方便地使用。

### 编辑 UWP 项目文件

是的，你需要手工编写 UWP 的项目文件。

如果你阅读过 [(1/2) 为了理解 UWP 的启动流程，我从零开始创建了一个 UWP 程序](https://walterlv.com/post/create-uwp-app-from-zero-0.html) 这篇文章，或者已经 [理解了 C# 项目 csproj 文件格式的本质和编译流程](https://walterlv.com/post/understand-the-csproj.html)，那么对这里 csproj 文件的编辑应该不会感觉到陌生或者害怕。当然，即便你没有编辑过或者不理解 csproj 也不用担心，你只需要按照本文要求进行操作即可。

现在，右击卸载项目，再右击编辑项目文件：

![编辑项目文件](/static/posts/2018-11-04-11-08-09.png)  
▲ 编辑项目文件

找到 `Import` targets 的哪一行，你需要在那一行前面的任意位置添加以下特别标注为新增的几行：

```diff
++  <PropertyGroup>
++    <EnableTypeInfoReflection>false</EnableTypeInfoReflection>
++    <EnableXBindDiagnostics>false</EnableXBindDiagnostics>
++  </PropertyGroup>
    <Import Project="$(MSBuildExtensionsPath)\Microsoft\WindowsXaml\v$(VisualStudioVersion)\Microsoft.Windows.UI.Xaml.CSharp.targets" />
```

随后，还要在以上 targets 之后再添加以下代码：

```xml
<PropertyGroup>
  <!-- 这里需要填写你的 WPF 项目的路径 -->
  <HostFrameworkProjectFolder>$(ProjectDir)..\Whitman.Wpf</HostFrameworkProjectFolder>
  <ObjPath>obj\$(Platform)\$(Configuration)\</ObjPath>
</PropertyGroup>
<PropertyGroup Condition=" '$(Platform)' == 'AnyCPU' ">
  <ObjPath>obj\$(Configuration)\</ObjPath>
</PropertyGroup>
<PropertyGroup>
  <!-- 把此项目的输出文件都拷贝到 WPF 项目的生成路径下 -->
  <PostBuildEvent>
    md $(HostFrameworkProjectFolder)\$(ProjectName)
    md $(HostFrameworkProjectFolder)\bin\$(Configuration)\$(ProjectName)
    copy $(TargetDir)*.xbf            $(HostFrameworkProjectFolder)\bin\$(Configuration)\$(ProjectName)
    copy $(ProjectDir)*.xaml          $(HostFrameworkProjectFolder)\bin\$(Configuration)\$(ProjectName)
    copy $(ProjectDir)*.xaml.cs       $(HostFrameworkProjectFolder)\$(ProjectName)
    copy $(ProjectDir)$(ObjPath)*.g.* $(HostFrameworkProjectFolder)\$(ProjectName)
  </PostBuildEvent>
</PropertyGroup>
```

需要注意：

- 一定要在 targets 之后添加这些代码，因为 `$(TargetDir)`、`$(ProjectName)` 等属性是在那里的 targets 执行完后才生成的。
- 你的 UWP 项目中需要有 xaml，比如可以添加一个 MainPage.xaml 和 MainPage.xaml.cs，不然编译的时候可能会出现错误。

### 重新加载项目并编译

现在，重新加载那个 UWP 控件库，将其编译，以便将 UWP 项目的生成文件复制到 WPF 目录下。

![生成的文件已复制到 WPF 目录下](/static/posts/2018-11-04-11-38-28.png)  
▲ 生成的文件已复制到 WPF 目录下

### 在 WPF 项目中间接引用 UWP 控件库

现在，在 WPF 项目中开启所有文件夹的显示，然后将 UWP 项目中生成的文件添加到 WPF 项目中：

![在 WPF 项目中添加 UWP 的控件库](/static/posts/2018-11-04-11-39-36.png)  
▲ 在 WPF 的项目中添加 UWP 的控件库

为了能够在每次编译 WPF 项目的时候确保 UWP 项目先编译，需要为 WPF 项目设置项目依赖。在依赖对话框中将 UWP 项目设为依赖。

![添加项目依赖](/static/posts/2018-11-04-11-41-19.png)  
▲ 添加项目依赖

现在，编译 WPF 项目的时候，会将 UWP 项目编译后的源码也一起编译到 WPF 项目中；相当于间接使用了 UWP 的控件库。

---

#### 参考资料

- [WindowsXAMLHost control - Windows Community Toolkit - Microsoft Docs](https://docs.microsoft.com/en-us/windows/communitytoolkit/controls/wpf-winforms/windowsxamlhost)
- [Enhance your desktop application for Windows 10 - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/porting/desktop-to-uwp-enhance#first-set-up-your-project)
