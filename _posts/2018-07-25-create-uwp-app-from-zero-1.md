---
title: "(2/2) 为了理解 UWP 的启动流程，我从零开始创建了一个 UWP 程序"
date: 2018-07-25 09:17:57 +0800
categories: uwp
---

每次使用 Visual Studio 的模板创建一个 UWP 程序，我们会在项目中发现大量的项目文件、配置、应用启动流程代码和界面代码。然而这些文件在 UWP 程序中到底是如何工作起来的？

我从零开始创建了一个 UWP 程序，用于探索这些文件的用途，了解 UWP 程序的启动流程。

---

本文分为两个部分：

- [从零开始创建一个 UWP 项目并完成部署](/post/create-uwp-app-from-zero-0.html)
- [从零开始编写一个 UWP 应用程序和窗口](/post/create-uwp-app-from-zero-1.html)

本文将从 Main 函数开始，一步步跑起来一个应用程序，显示一个窗口，并在窗口中显示一些内容。重点在了解在 UWP 中运行应用程序，并显示窗口。

<div id="toc"></div>

