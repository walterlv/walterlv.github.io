---
title: "Unity3D 入门：安装 Unity3D 并配置与 Visual Studio 的协作开发环境"
date: 2020-04-26 11:44:20 +0800
categories: unity csharp visualstudio
position: starter
---

实际上本文不看也罢，因为整个过程除了网速之外基本没啥坑。不过装完可能有一些配置，所以如果不知道的话可以参考本文。

---

<div id="toc"></div>

## 安装

我们共需要安装两款应用：

- Visual Studio 2019 及 Unity 编辑器组件
- Unity Hub

这两款应用安装不分先后，不过建议全部都安装完后再启动，避免单独启动无法运行使用的问题。

### 安装 Visual Studio 2019 的 Unity 编辑器组件。

Visual Studio 2019 的安装包自带 Unity 编辑器的安装入口。在你的开始菜单中搜索并打开“Visual Studio Installer”。如果你没有安装 Visual Studio 的话，那么还是建议去下载安装一下的。

![Visual Studio Installer](/static/posts/2020-04-26-10-43-44.png)

启动完 Visual Studio Installer 之后，选择“修改”：

![修改 Visual Studio Installer 的组件](/static/posts/2020-04-26-10-48-28.png)

在“单个组件”里面勾选两个：

- Unity 64 位编辑器
- Visual Studio Tools for Unity

![勾选 Unity 组件](/static/posts/2020-04-26-10-51-08.png)

点击右下角的“修改”后就等待。（可能部分运营商的速度会过慢，这时你可能需要考虑梯子。）

### 安装 Unity Hub

下载安装地址：

- [Download - Unity](https://unity3d.com/get-unity/download)

## 获得授权

如果没有 Unity 的授权，那么你将无法使用 Unity 编辑器，而 Unity 的授权在 Unity Hub 的应用中才能进行（这也是为什么一定要下一个 Unity Hub 的原因）。

启动 Unity Hub。如果你没有许可证的话，那么打开 Unity Hub 的第一个界面就是 Unity Hub 的许可证的授权界面。如果没有打开这个界面，那么点击右上角的设置->许可证管理可以进来。

![激活许可证](/static/posts/2020-04-26-11-18-09.png)

点击“激活新许可证”，然后按照你自己的需要选择许可证即可。我出于个人学习 Unity 的需要安装的 Unity，所以选择了个人授权。个人授权免费，不过有效期只有一天，过期需要手工再操作一次。

## 配置 Visual Studio 集成

### 使用 Visual Studio 解决方案

在 Unity Hub 中新建一个项目，输入名称选择路径，你就可以开始使用 Unity 来制作你的程序了。

![新建项目](/static/posts/2020-04-26-11-20-53.png)

新建或打开 Unity 的项目后，会启动 Visual Studio 2019 安装过程中安装的那个 Unity 编辑器。

选择“Edit->Preference...”打开 Unity 的设置。

![Preference](/static/posts/2020-04-26-11-24-34.png)

在设置中，打开 External Tools，然后在 External ScriptEditor 中选择“Browse...”，找到 Visual Studio 2019 的主程序确定，这时，这里就会变成“Visual Studio 2019”。下面是否勾选 Generate all .csproj files 的区别是生成的 Visual Studio 解决方案中是否包含其他所有的项目（后面会介绍）。

Visual Studio 一般在这种地方：

- `C:\Program Files (x86)\Microsoft Visual Studio\2019\Community\Common7\IDE`
- `C:\Program Files (x86)\Microsoft Visual Studio\2019\Professional\Common7\IDE`
- `C:\Program Files (x86)\Microsoft Visual Studio\2019\Enterprise\Common7\IDE`

![设置外部工具](/static/posts/2020-04-26-11-26-06.png)

设置完成之后，点击“打开 C# 项目”可以在 Visual Studio 中打开此项目的解决方案，你就可以在里面编写 C# 脚本了。

![打开 C# 项目](/static/posts/2020-04-26-11-38-09.png)

后话，其实你什么都不配也依然能使用 Visual Studio 完成开发，不过配完后你将获得这些好处：

1. 获得完整的 Visual Studio 项目，可以用 C#/.NET 的语法分析，可以管理项目（否则你只能以单纯的 C# 单个文件编辑代码）；
1. 可以直接在 Visual Studio 中调试 Unity 程序，获得比较完整的 Visual Studio 的调试体验。

如果你在前面勾选了“生成所有的 .csproj 文件”，那么在 Visual Studio 的解决方案中将可以看到所有的 Unity 辅助项目可供编辑。否则只有 `Assembly-CSharp` 一个项目。

![所有的 Unity 项目](/static/posts/2020-04-26-11-32-36.png)

### 在 Visual Studio 中调试 Unity 程序

正常你可以直接在项目原本的“启动”或“调试”按钮处看到“附加到 Unity”按钮，点击即可调试 Unity 程序。

![附加到 Unity](/static/posts/2020-04-26-11-35-57.png)

当然，Unity 编辑器这边也要运行起来才可以在 Visual Studio 里面进入断点：

![需要运行 Unity](/static/posts/2020-04-26-11-40-20.png)

如果你没有找到“附加到 Unity”按钮，那么可以在 Visual Studio 的“调试”菜单中找到“附加 Unity 调试程序”。点击后可以自动查找当前正在运行的 Unity 编辑器，选择你希望调试的那一个即可开始调试。

![附加 Unity 调试程序](/static/posts/2020-04-26-11-42-15.png)

## 完成

至此，Unity 的安装和基本配置已全部完成。
