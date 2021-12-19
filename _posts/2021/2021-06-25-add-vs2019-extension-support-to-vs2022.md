---
title: "Visual Studio 2022 出来啦！教你如何将 VS2019 的 VSIX 扩展/插件项目迁移到 VS2022"
date: 2021-06-25 14:05:52 +0800
tags: visualstudio dotnet
position: problem
---

从 Visual Studio 2022 开始，Visual Studio 正式启用了 amd64 架构。为了确保扩展的兼容性，Visual Studio 2022 不会启用以前编译过的扩展，即使以前编译过的扩展把支持的 Visual Studio 版本号加到了 17.0（对应 VS2022）也不行。毕竟 x64 的进程真加载一个 x86 的程序集时，会炸得体无完肤。

因为保证安全，Visual Studio 2022 仅加载专门为它开发和编译过的插件。

如果你正好有一个为 Visual Studio 2019（或更早）开发的插件，那么可以通过阅读本文完成对插件项目的升级，以支持 Visual Studio 2022。

---

<div id="toc"></div>

## TL;DR 最简改法

如果你赶时间，只想马上把项目改好，那么阅读这一小节就够了。

首先我们确认一下，你原来的项目至少是这样的结构：

1. 是一个 Visual Studio 扩展项目
1. 有一个 Visual Studio 扩展清单文件 source.extension.vsixmanifest

![项目结构](/static/posts/2021-06-25-13-39-38.png)

在此基础上，你需要修改两个文件。

source.extension.vsixmanifest：

请将原来的安装目标改成 17.0 以前和以后两个，以前的用 x86 架构，以后的用 amd64 架构。

```diff
    <Installation>
--    <InstallationTarget Id="Microsoft.VisualStudio.Community" Version="[16.0,)" />
++    <InstallationTarget Id="Microsoft.VisualStudio.Community" Version="[16.0, 17.0)">
++      <ProductArchitecture>x86</ProductArchitecture>
++    </InstallationTarget>
++    <InstallationTarget Id="Microsoft.VisualStudio.Community" Version="[17.0, 18.0)">
++      <ProductArchitecture>amd64</ProductArchitecture>
++    </InstallationTarget>
    </Installation>
```

*.csproj 文件：

必须将 VS 构建工具升级到 17.0 或以上版本。

```diff
--  <PackageReference Include="Microsoft.VSSDK.BuildTools" Version="16.9.1050" />
++  <PackageReference Include="Microsoft.VSSDK.BuildTools" Version="17.0.2140-preview2" />
```

如果你还有引用其他的 VS 构建工具，请一并升级到 17.0 或以上版本。升级时，此 VSIX 项目引用的其他项目（例如基于 .NET Standard 的分析器项目）无需升级 NuGet 包。

至此，你再编译这个 Visual Studio 扩展项目，即可正常在旧的 Visual Studio 2019 和新的 Visual Studio 2022 上安装：

![支持两个 VS 版本的 VSIX](/static/posts/2021-06-25-13-46-19.png)

## 完整改法

如果你比较强迫症，我还是建议你完整改完整个项目。完整改完后，你将获得如下好处：

1. 在 Visual Studio 2022 里双击 source.extension.vsixmanifest 后能打开专属的清单编辑器，避免手写容易出现明显错误
1. csproj 项目文件里不会有之前版本为了解决一些特定的 bug 而额外写的 bugfix 代码

完整改法，即使用 Visual Studio 2022 来创建新的 VSIX 扩展项目。

### 第一步：请确保已安装 SDK

在开始菜单找到并启动 Visual Studio Installer，然后确保勾选 Visual Studio 扩展开发的工作负载，并将右边的 .NET Compiler Platform SDK 勾选。前者提供编写和调试扩展的能力，而后者提供了新建模板和 Roslyn 相关工具。

![安装工作负载](/static/posts/2021-06-25-13-55-18.png)

### 第二步：重新创建 VSIX 项目

新建一个 VSIX 项目：

![重建 VSIX 项目](/static/posts/2021-06-25-13-58-41.png)

### 第三步：复制并替换整个扩展文件

你可以把新创建项目的 csproj 文件和 source.extension.vsixmanifest 文件替换掉原项目的这两个文件，然后保留原项目。也可以考虑反过来操作，将原项目里的代码（如果有的话）放到新项目里来，然后保留新项目。

合并这两个项目时，记得 source.extension.vsixmanifest 文件里的清单信息要与原来的保持一致，这样才能对原来的扩展进行升级（而不会创建出新的扩展来）。

如果需要一个修改示例，你可以看我的一个 Pull Request（拉取请求）：

- [为插件添加 Visual Studio 2022 的支持 by walterlv · Pull Request #28 · walterlv/Walterlv.Packages](https://github.com/walterlv/Walterlv.Packages/pull/28)

## 重新上传扩展到市场

前往 Visual Studio 扩展市场的管理界面 <https://marketplace.visualstudio.com/manage>，需要登录。

在你需要升级的扩展旁边的“…”里点“Edit”编辑。重新上传你新编译出来的 VSIX 文件，等待审核即可。

![重新上传扩展](/static/posts/2021-06-25-14-04-59.png)

---

**参考资料**

- [visualstudio-docs/update-visual-studio-extension.md at master · MicrosoftDocs/visualstudio-docs](https://github.com/MicrosoftDocs/visualstudio-docs/blob/177db460a2dbd7de2876e2ad564795294dd1c80a/docs/extensibility/migration/update-visual-studio-extension.md)
