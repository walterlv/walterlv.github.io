---
title: "自动将 NuGet 包的引用方式从 packages.config 升级为 PackageReference"
date: 2018-04-24 17:29:30 +0800
categories: dotnet visualstudio nuget
---

在前段时间我写了一篇迁移 csproj 格式的博客 [将 WPF、UWP 以及其他各种类型的旧样式的 csproj 文件迁移成新样式的 csproj 文件](/post/introduce-new-style-csproj-into-net-framework.html)，不过全过程是手工进行的，而且到最后处理 XAML 问题也非常头疼。

现在，我们可以利用工具自动地完成这个过程。当然，工具并不将 csproj 格式进行迁移，而是在不迁移格式的情况下，使用到 `PackageReference` 方式 NuGet 引用带来的好处。

---

<div id="toc"></div>

### 自动升级

下载安装 Visual Studio 插件 [NuGet PackageReference Upgrader](https://marketplace.visualstudio.com/items?itemName=CloudNimble.NuGetPackageReferenceUpgrader)。在安装完成之后，再次启动 Visual Studio，则可以开始迁移。

**只有一个步骤**：在 `packages.config` 文件上点击右键，选择 `Upgrade to PackageReference`。

![Upgrade to PackageReference](/static/posts/2018-04-24-16-03-17.png)

紧接着，稍微等待一下，即可完成一个项目的迁移。如果有多个项目，则每个项目都这么操作即可。

相比于之前写的手工迁移，自动迁移方式没有改变 csproj 的格式，而只是将 NuGet 的引用方式改成了 `PackageReference`。具体有哪些好处，可以阅读 [将 WPF、UWP 以及其他各种类型的旧样式的 csproj 文件迁移成新样式的 csproj 文件](/post/introduce-new-style-csproj-into-net-framework.html)。

### 检查升级后的兼容性问题

`packages.config` 的 NuGet 包的管理方式有些功能是 `PackageReference` 没有的。当然，没有这些功能是因为“不需要”，而不是“还没支持”；所以大部分的迁移都不会发生问题（除非发布包使用的是特别老旧的 nuget.exe，或者发布者利用了一些丧心病狂的黑科技）。

#### install.ps1 脚本将失效

使用 `PackageReference` 后，在安装和写在的过程中 `install.ps1` 脚本将不再执行。如果有一些行为依赖于此脚本，那么这个 NuGet 包的行为可能不正常。

但是，不用担心！`install.ps1` 的存在是因为 `packages.config` 不支持 `PackageReference` 中的一些新特性（例如 NuGet 包中新的目录结构，例如包中自带的 msbuild targets）。所以，如果 NuGet 包在发布时满足目录要求，那么即便 `install.ps1` 不用执行也能保证包的行为正常。

#### 使用 content 方式指定的内容资产将失效

`PackageReference` 使用 `contentFiles` 来管理内容资产，这样可以更好地在多个依赖包之间传递和共享。而此前 `content` 指定的资产将失效。

建议检查所有依赖的 NuGet 包，如果你有权限修改部分依赖包，那么请使用 `contentFiles` 来替代 `content`。

#### XDT 变换将失效

使用 `PackageReference` 后，在安装和写在的过程中 XDT 转换将不会执行，并且会忽略 .xdt 文件。

在 Web 应用开发中会更留意这个问题。

#### lib 根目录中的程序集将被忽略

lib 文件夹内的程序集都应该按照目标框架建立子文件夹，例如 net45、netstandard2.0、netcoreapp2.0。`PackageReference` 要求只能引用在某个目标框架下的程序集。

如果是使用默认的方式创建的 NuGet 包，基本上不会遇到这样的问题。除非你在创建 NuGet 包时有自定义操作在根目录放了程序集。

---

#### 参考资料

- [Migrating from package.config to PackageReference formats - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/reference/migrate-packages-config-to-package-reference)
- [packages.config (PC) to PackageReference (PR) Migrator · NuGet/Home Wiki](https://github.com/NuGet/Home/wiki/packages.config-(PC)-to-PackageReference-(PR)-Migrator)
