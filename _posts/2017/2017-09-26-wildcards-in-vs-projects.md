---
layout: post
title: "为 Visual Studio 使用通配符批量添加项目文件"
date_published: 2017-09-26 21:12:15 +0800
date: 2018-01-15 23:52:36 +0800
categories: visualstudio msbuild
permalink: /post/vs/2017/09/26/wildcards-in-vs-projects.html
keywords: visual studio wildcards
description: Visual Studio 的项目文件其实是支持使用通配符的，尤其适合添加大量资源文件。
---

通常大家都不会关心 Visual Studio 的项目文件里是如何记录这个项目所包含的所有文件的，因为各位开发者们早已经习惯于右键添加文件或者拖拽文件进项目了。但如果你在某一个文件夹中放了大量的文件（尤其是图片等资源文件），那么这时会卡很久才能拖进去，拖完之后如果还要批量修改生成操作，那真的是痛不欲生。

但是，Visual Studio 提供的项目文件（*.csproj）其实是支持通配符的。

---

比如，我们通常的项目文件的片段是这样的：

```xml
<ItemGroup>
  <Content Include="Properties\Default.rd.xml" />
  <Content Include="Assets\LockScreenLogo.scale-200.png" />
  <Content Include="Assets\SplashScreen.scale-200.png" />
  <Content Include="Assets\Square150x150Logo.scale-200.png" />
  <Content Include="Assets\Square44x44Logo.scale-200.png" />
  <Content Include="Assets\Square44x44Logo.targetsize-24_altform-unplated.png" />
  <Content Include="Assets\StoreLogo.png" />
  <Content Include="Assets\Wide310x150Logo.scale-200.png" />
</ItemGroup>
```

但是，改成这样的话，以后新添加的 `*.png` 文件也会加入：

```xml
<ItemGroup>
  <Content Include="Properties\Default.rd.xml" />
  <Content Include="Assets\*.png" />
</ItemGroup>
```

而且，如果你想改生成方式，也很简单：

```xml
<ItemGroup>
  <None Include="Properties\Default.rd.xml" />
  <None Include="Assets\*.png" />
</ItemGroup>
```

但是，小心有坑，因为如果你的目录下是多个文件夹嵌套的话，需要用两个星号来表示可能出现多层文件夹：

```xml
<ItemGroup>
  <Content Include="Properties\Default.rd.xml" />
  <Content Include="Assets\*.png" />
  <Content Include="Assets\**\*.png" />
</ItemGroup>
```

---

#### 参考资料

- [How to: Select the Files to Build - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/msbuild/how-to-select-the-files-to-build)
