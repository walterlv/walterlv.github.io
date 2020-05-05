---
title: "Unity3D 入门：如何管理 Unity 项目中的 NuGet 包？使用第三方 NuGet 包管理器——NuGetForUnity"
publishDate: 2020-05-05 09:08:14 +0800
date: 2020-05-05 15:12:45 +0800
categories: unity
position: problem
---

Unity 项目虽然可使用 C# 项目作为脚本，却并没有提供一种类似 NuGet 的第一方包管理器。不过，还是有第三方包管理器可以用，为 C# 脚本应用现有的库提供方便。

---

<div id="toc"></div>

## NuGetForUnity

第三方适用于 Unity 的 NuGet 包管理器推荐：

- [GlitchEnzo/NuGetForUnity: A NuGet Package Manager for Unity](https://github.com/GlitchEnzo/NuGetForUnity)

去它的 [Release 页面](https://github.com/GlitchEnzo/NuGetForUnity/releases)，可以下载到 NuGetForUnity.2.0.0.unitypackage 的 Unity 包文件。

## 安装 NuGetForUnity

NuGetForUnity 是按项目安装的，所以你需要先打开一个项目（否则双击安装只会进到项目选择界面）。

打开了一个 Unity 的项目后，双击下载下来的 NuGetForUnity.2.0.0.unitypackage 文件，你会看到包导入界面：

![导入包](/static/posts/2020-05-05-14-56-18.png)

点击 Import 按钮即可将 NuGetForUnity 安装到你刚刚打开的项目中。

## 使用 NuGetForUnity

安装完 NuGetForUnity 后，你能在 Unity 编辑器的主菜单上面看到 NuGet 入口了。这很像是 Visual Studio 中自带的 NuGet 包管理器，不过这是适用于 Unity 的第三方 NuGet 包管理器。

![NuGetForUnity 的界面](/static/posts/2020-05-05-14-57-26.png)

### 安装 NuGet 包

就从上面所述的菜单那里打开，你可以进入 NuGet 包的搜索与安装界面。输入并找到你想安装的 NuGet 包，然后点击 Install 即可。

![搜索与安装 NuGet 包](/static/posts/2020-05-05-15-06-06.png)

### 还原 NuGet 包

正常情况下，你打开别人上传到版本管理中的仓库后，仅仅启动 Unity 编辑器就可以完成 NuGet 包的还原。因为 NuGetForUnity 是安装到项目当中的，Unity 编辑器启动的时候也会运行 NuGetForUnity，这时就会自动还原项目当中所安装过的 NuGet 包了。

## 还有没有其他包管理方案？

在微软的 <docs.microsoft.com> 文档中，描述 NuGet 包安装的方法是手工的，对于普通的没有依赖的 NuGet 包来说问题不大，不过如果 NuGet 包包含依赖的话，那手工处理的工作量就有点大了，尤其是依赖有嵌套，出现层层嵌套的依赖的时候，几乎可以不用考虑手工安装 NuGet 包的方式了。

关于手工安装 NuGet 包的方式，我在另一篇入门文档当中也有说到过：

- [Unity3D 入门：为 Unity 的 C# 项目添加 dll 引用或安装 NuGet 包 - walterlv](/post/unity-starter-reference-dlls-and-add-nuget-package-for-unity-csharp-projects.html)

---

**参考资料**

- [GlitchEnzo/NuGetForUnity: A NuGet Package Manager for Unity](https://github.com/GlitchEnzo/NuGetForUnity)
