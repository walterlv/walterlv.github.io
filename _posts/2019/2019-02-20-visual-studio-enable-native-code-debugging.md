---
title: "在 Visual Studio 新旧不同的 csproj 项目格式中启用混合模式调试程序（开启本机代码调试）"
publishDate: 2019-02-20 22:40:43 +0800
date: 2019-04-12 09:40:06 +0800
categories: visualstudio dotnet csharp
position: problem
---

因为我使用 Visual Studio 主要用来编写 .NET 托管程序，所以平时调试的时候是仅限托管代码的。不过有时需要在托管代码中混合调试本机代码，那么就需要额外在项目中开启本机代码调试。

本文介绍如何开启本机代码调试。

---

<div id="toc"></div>

本文涉及到新旧 csproj 项目格式，不懂这个也不影响你完成开启本机代码调试。不过如果你希望了解，可以阅读：[将 WPF、UWP 以及其他各种类型的旧 csproj 迁移成 Sdk 风格的 csproj - walterlv](/post/introduce-new-style-csproj-into-net-framework)。

## 在旧格式的项目中开启

旧格式指的是 Visual Studio 2015 及以前版本的 Visual Studio 使用的项目格式。目前 Visual Studio 2017 和 2019 对这种格式的支持还是很完善的。

在项目上右键 -> 属性 -> Debug，这时你可以在底部的调试引擎中发现 `Enable native code debugging` 选项，开启它你就开启了本机代码调试，于是也就可以使用混合模式调试程序。

![在旧格式中开启本机代码调试](/static/posts/2019-02-20-22-25-48.png)

## 在新格式的项目中开启

如果你在你项目属性的 Debug 标签下没有找到上面那个选项，那么有可能你的项目格式是新格式的。

![新格式中没有开启本机代码调试的选项](/static/posts/2019-02-20-22-31-27.png)

这个时候，你需要在 *lauchsettings.json* 文件中设置。这个文件在你项目的 Properties 文件夹下。

如果你没有找到这个文件，那么随便在上图那个框框中写点什么（比如在启动参数一栏中写 *吕毅是逗比*），然后保存。我们就能得到一个 *lauchsettings.json* 文件。

![launchsettings.json 文件](/static/posts/2019-02-20-22-34-23.png)

打开它，然后删掉刚刚的逗比行为，添加 `"nativeDebugging": true`。这时，你的 *lauchsettings.json*  文件影响像下面这样：

```json
{
  "profiles": {
    "Walterlv.Debugging": {
      "commandName": "Project",
      "nativeDebugging": true
    }
  }
}
```

这时你就可以开启本机代码调试了。当然，新的项目格式支持设置多个这样的启动项，于是你可以分别配置本机和非本机的多种配置：

```json
{
  "profiles": {
    "Walterlv.Debugging": {
      "commandName": "Project"
    },
    "本机调试": {
      "commandName": "Project",
      "nativeDebugging": true
    }
  }
}
```

现在，你可以选择你项目的启动方式了，其中一个是开启了本机代码调试的方式。

![选择项目的启动方式](/static/posts/2019-02-20-22-38-55.png)

关于这些配置的更多博客，你可以阅读：[VisualStudio 使用多个环境进行调试 - 林德熙](https://lindexi.gitee.io/post/VisualStudio-%E4%BD%BF%E7%94%A8%E5%A4%9A%E4%B8%AA%E7%8E%AF%E5%A2%83%E8%BF%9B%E8%A1%8C%E8%B0%83%E8%AF%95.html)。

---

**参考资料**

- [How to: Debug in Mixed Mode - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/debugger/how-to-debug-in-mixed-mode?view=vs-2017)
- [Tutorial: Debug C# and C++ code (mixed mode) - Visual Studio - Microsoft Docs](https://docs.microsoft.com/en-us/visualstudio/debugger/how-to-debug-managed-and-native-code?view=vs-2017)
