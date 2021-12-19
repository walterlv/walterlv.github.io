---
title: "Visual Studio 如何能够不进行编译就调试 .NET/C# 项目（用于解决大项目编译缓慢的问题）"
publishDate: 2019-02-26 20:40:15 +0800
date: 2019-04-26 08:11:44 +0800
tags: dotnet csharp visualstudio
position: problem
coverImage: /static/posts/2019-02-26-20-08-51.png
permalink: /post/debug-without-building-for-visual-studio-project.html
---

.NET 托管程序的编译速度比非托管程序要快非常多，即便是 .NET Core，只要不编译成 Native 程序，编译速度也是很快的。然而总是有一些逗比大项目编译速度非常缓慢（我指的是分钟级别的），而且还没做好差量编译；于是每一次编译都需要等待几十秒到数分钟。这显然是非常影响效率的。

在解决完项目的编译速度问题之前，如何能够临时进行快速调试改错呢？本文将介绍在 Visual Studio 中不进行编译就调试的方法。

---

我找到了两种临时调试而不用编译的方法：

- [在 Visual Studio 的设置界面设置启动前不编译（本文）](/post/debug-without-building-for-visual-studio-project)
- [通过修改项目调试配置文件](/post/debug-project-without-building-via-launch-settings)

## 不编译直接调试

有时候只是为了定位 Bug 不断重复运行以调试程序，并没有修改代码。然而如果 Visual Studio 的差量编译因为逗比项目失效的话，就需要手动告诉 Visual Studio 不需要进行编译，直接进行调试。

## 在 Visual Studio 中设置编译选项

进入 `工具` -> `选项` -> `项目和解决方案` -> `生成并运行`。

![打开选项](/static/posts/2019-02-26-20-08-51.png)

![生成并运行](/static/posts/2019-02-26-20-34-12.png)

“当项目过期时”，选择“从不生成”。

顺便附中文版截图：

![中文版生成并运行](/static/posts/2019-02-26-20-39-51.png)

这时，你再点击运行你的项目的时候，就不会再编译了，而是直接进入调试状态。

这特别适合用来定位 Bug，因为这时基本不改什么代码，都是在尝试复现问题以及查看各种程序的中间状态。


