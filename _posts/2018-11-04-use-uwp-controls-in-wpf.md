---
title: "Windows Community Toolkit：在 WPF 中使用 UWP 的控件"
date: 2018-11-04 9:32:51 +0800
categories: uwp wpf dotnet
---

Windows Community Toolkit 再次更新到 5.0。以前可以在 WPF 中使用有限的 UWP 控件，而现在有了 WindowsXamlHost，则可以使用更多 UWP 原生控件了。

---

关于 Windows Community Toolkit 早期版本的 Xaml Bridge，可以参见：

- [WPF 使用 Edge 浏览器 - 林德熙](https://lindexi.gitee.io/post/WPF-%E4%BD%BF%E7%94%A8-Edge-%E6%B5%8F%E8%A7%88%E5%99%A8.html)

<div id="toc"></div>

### 安装 NuGet 包

你需要做的第一步，是在你的 WPF 项目中安装 Microsoft.Toolkit.Wpf.UI.XamlHost。建议直接在 项目的 NuGet 管理器中搜索并安装。

![安装 Microsoft.Toolkit.Wpf.UI.XamlHost](/static/posts/2018-11-04-09-34-39.png)

![安装好 NuGet 包后查看引用](/static/posts/2018-11-04-09-43-24.png)

### 配置 WPF 项目能访问 UWP 的类型

因为我们即将开始使用到 UWP 中的控件类型，所以需要配置项目能够访问到 Windows Runtime 的类型。

![添加引用](/static/posts/2018-11-04-09-56-19.png)  
▲ 添加引用

你需要在你的 WPF 项目中添加以下 6 个引用才能访问 UWP 的类型：

- C:\Program Files (x86)\Reference Assemblies\Microsoft\Framework\.NETCore\v4.5
    - 引用 System.Runtime.WindowsRuntime
    - 引用 System.Runtime.WindowsRuntime.UI.Xaml
    - 引用 System.Runtime.InteropServices.WindowsRuntime
- C:\Program Files (x86)\Windows Kits\10\UnionMetadata\Facade
    - 引用 Windows.winmd
- C:\Program Files (x86)\Windows Kits\10\References\
    - *在此目录下选择你的 SDK 版本（如 16299,17763 等）*
        - Windows.Foundation.UniversalApiContract\
            - *在此目录下选择你的 API 版本（如 4.0.0.0）*
                - 引用 Windows.Foundation.UniversalApiContract.winmd
        - Windows.Foundation.FoundationContract
            - *在此目录下选择你的 API 版本（如 3.0.0.0）*
                - 引用 Windows.Foundation.FoundationContract.winmd
                
在你添加完这些引用之后，还需要选中这些引用，右击属性，把所有的 “复制到本地” 选项设置为 “否”。

![不要复制到本地](/static/posts/2018-11-04-10-10-16.png)

![添加 Windows Runtime 的 .NET Framework 类型引用](/static/posts/2018-11-04-09-57-03.png)  
▲ 添加 Windows Runtime 的 .NET Framework 类型引用

![添加 Windows.WinMD 的引用](/static/posts/2018-11-04-09-57-44.png)  
▲ 添加 Windows.WinMD 的引用

![在添加引用时注意选择 SDK 的版本号](/static/posts/2018-11-04-09-58-07.png)  
▲ 在添加引用时注意选择 SDK 的版本号

![添加 Windows.Foundation.UniversalApiContract.winmd](/static/posts/2018-11-04-09-58-41.png)  
▲ 添加 Windows.Foundation.UniversalApiContract.winmd

![添加 Windows.Foundation.FoundationContract.winmd](/static/posts/2018-11-04-09-58-54.png)  
▲ 添加 Windows.Foundation.FoundationContract.winmd
