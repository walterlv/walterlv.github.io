---
title: "(2/2) 为了理解 UWP 的启动流程，我从零开始创建了一个 UWP 程序"
date: 2018-07-25 14:15:24 +0800
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

### 启动应用

在上一篇文章中的末尾，我们成功启动了程序并进入了 Main 函数的断点，但实际上运行会报错；提示进程已启动，但应用尚未运行。

> The Walterlv.Demo.ZeroUwp.exe process started, but the activation request failed with error 'The app didn't start'.

是的，我们只有一个什么都没做的 Main 函数，进程当然能够成功启动；但我们需要能够启动应用。那么 UWP 的应用是什么呢？是 CoreApplication。

所以我们使用 `CoreApplication` 类型执行 `Run` 静态方法。

![CoreApplication.Run](/static/posts/2018-07-25-10-24-17.png)

此方法要求传入一个 `IFrameworkViewSource`。事实上 UWP 已经有一个 `IFrameworkViewSource` 的实现了，是 `FrameworkViewSource`。不过，我希望自己写一个，了解其原理。

所以，就用 ReSharper 生成了 `IFrameworkViewSource` 的一个实现：

```csharp
using Windows.ApplicationModel.Core;

namespace Walterlv.Demo.ZeroUwp
{
    internal sealed class WalterlvViewSource : IFrameworkViewSource
    {
        public IFrameworkView CreateView()
        {
            throw new System.NotImplementedException();
        }
    }
}
```

`IFrameworkViewSource` 接口中只有一个方法 `CreateView`，返回一个新的 `IFrameworkView` 的实例。

### 启动窗口

只是写一个 `NotImplementedException` 的异常，当然是跑不起来的，得返回一个真的 `IFrameworkView` 的实例。UWP 自带的实现为 `FrameworkView`，那么我也自己实现一个。

这次需要实现的函数会多一些：

```csharp
using Windows.ApplicationModel.Core;
using Windows.UI.Core;

namespace Walterlv.Demo.ZeroUwp
{
    internal sealed class WalterlvFrameworkView : IFrameworkView
    {
        public void Initialize(CoreApplicationView applicationView)
        {
            throw new System.NotImplementedException();
        }

        public void SetWindow(CoreWindow window)
        {
            throw new System.NotImplementedException();
        }

        public void Load(string entryPoint)
        {
            throw new System.NotImplementedException();
        }

        public void Run()
        {
            throw new System.NotImplementedException();
        }

        public void Uninitialize()
        {
            throw new System.NotImplementedException();
        }
    }
}
```
