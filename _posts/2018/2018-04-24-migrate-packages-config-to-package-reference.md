---
title: "自动将 NuGet 包的引用方式从 packages.config 升级为 PackageReference"
date: 2018-04-24 18:03:20 +0800
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

### 解决升级后的编译错误

最可能出现的编译问题是 NuGet 包引用的版本冲突。

`packages.config` 方式的包引用要求在 csproj 文件中显式指定一个依赖的包的版本，于是无论依赖使用了哪个版本，最终都由显式指定的版本来指定。

而 `PackageReference` 的引用方式是自动管理依赖版本的，只要每个包都在允许的版本范围之内，就自动选择版本，并显示在解决方案的引用中。

`PackageReference` 出现依赖冲突的提示通常是这样的：

```
Version conflict detected for NuGet.Versioning. Reference the package directly from the project to resolve this issue.
NuGet.Packaging 3.5.0 -> NuGet.Versioning (= 3.5.0)
NuGet.Configuration 4.0.0 -> NuGet.Versioning (= 4.0.0)
```

也就是说，引用的两个不同的包要求依赖相同包的不同版本，于是 `PackageReference` 无法隐式推断依赖包的版本。这时需要将项目的依赖方式改为之前的方式。

当然，在制作和发布 NuGet 包时，尽量使用非特定版本的依赖包，能够极大地避免这种问题带来的影响。关于如何指定非特定版本的依赖包，可以阅读 [Version ranges and wildcards 版本范围和通配符](https://docs.microsoft.com/en-us/nuget/reference/package-versioning#version-ranges-and-wildcards)。

---

#### 参考资料

- [Migrating from package.config to PackageReference formats - Microsoft Docs](https://docs.microsoft.com/en-us/nuget/reference/migrate-packages-config-to-package-reference)
- [packages.config (PC) to PackageReference (PR) Migrator · NuGet/Home Wiki](https://github.com/NuGet/Home/wiki/packages.config-(PC)-to-PackageReference-(PR)-Migrator)
