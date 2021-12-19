---
title: "Visual Studio 通过修改项目的调试配置文件做到临时调试的时候不要编译（解决大项目编译缓慢问题）"
publishDate: 2019-04-26 08:50:05 +0800
date: 2019-04-26 12:22:57 +0800
tags: visualstudio dotnet csharp
position: problem
---

.NET 托管程序的编译速度比非托管程序要快非常多，即便是 .NET Core，只要不编译成 Native 程序，编译速度也是很快的。然而总是有一些逗比大项目编译速度非常缓慢（我指的是分钟级别的），而且还没做好差量编译；于是每一次编译都需要等待几十秒到数分钟。这显然是非常影响效率的。

在解决完项目的编译速度问题之前，如何能够临时进行快速调试改错呢？本文将介绍在 Visual Studio 中不进行编译就调试的方法。

---

我找到了两种临时调试而不用编译的方法：

- [在 Visual Studio 的设置界面设置启动前不编译](/post/debug-without-building-for-visual-studio-project)
- [通过修改项目调试配置文件（本文）](/post/debug-project-without-building-via-launch-settings)

新建一个普通的类库项目，右击项目，属性，打开属性设置页面。进入“调试”标签：

![调试标签](/static/posts/2019-04-25-19-29-31.png)

现在，将默认的启动从“项目”改为“可执行文件”，然后将我们本来调试时输出的程序路径贴上去。

现在，如果你不希望编译大项目而直接进行调试，那么将启动项目改为这个小项目即可。
