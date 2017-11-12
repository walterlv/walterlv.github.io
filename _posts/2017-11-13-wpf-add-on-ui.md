---
title: "WPF 跨应用程序域的插件与 UI"
date: 2017-11-13 00:36:28 +0800
categories: wpf
---

为自己写的程序添加插件真的是一个相当常见的功能，然而如果只是简单加载程序集然后去执行程序集中的代码，会让宿主应用程序暴露在非常危险的境地！因为只要插件能够运行任何一行代码，就能将宿主应用程序修改得天翻地覆哭爹喊娘；而根本原因，就在于暴露了整个托管堆和整个 UI 树。

本文将通过隔离宿主与插件到不同应用程序域中以解决这样的潜在安全性问题。使用本文的方法，不止支持跨域调用，还支持跨域 UI。

---

.NET Framework 自 3.5 以来推出了 `System.AddIn` 程序集，将宿主和插件隔离在不同的应用程序域中，避免插件对宿主造成不良影响。

相关资料较少，不过我在 GitHub 上找到了一个比较完善的例子程序 [ENikS/System.AddIn: Projects related to Microsoft System.AddIn](https://github.com/ENikS/System.AddIn)。

正在研究中，未完待续……

---

#### 参考资料

- [ENikS/System.AddIn: Projects related to Microsoft System.AddIn](https://github.com/ENikS/System.AddIn)
- [WPF Add-Ins Overview - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/wpf/app-development/wpf-add-ins-overview)
- [Walkthrough: Creating an Extensible Application - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/add-ins/walkthrough-create-extensible-app)
- [Add-ins and Extensibility - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/add-ins/)
