---
title: "全局或为单独的项目添加自定义的 NuGet 源"
date: 2019-02-27 12:26:12 +0800
categories: nuget visualstudio
position: starter
---

本文介绍如何添加自定义的 NuGet 源。包括全局所有项目生效的 NuGet 源和仅在某些特定项目中生效的 NuGet 源。

---

你可以前往 [我收集的各种公有 NuGet 源](/post/public-nuget-sources.html) 以发现更多的 NuGet 源，然后使用本文的方法添加到你自己的配置中。

<div id="toc"></div>

### 使用命令行添加

在使用命令行之前，你需要先在 <https://www.nuget.org/downloads> 下载最新的 nuget.exe 然后加入到环境变量中。

现在，我们使用命令行来添加一个包含各种日构建版本的 NuGet 源 MyGet：

```powershell
nuget sources add -Name "MyGet" -Source "https://dotnet.myget.org/F/dotnet-core/api/v3/index.json"
```

如果你添加的只是一个镜像源（比如华为云 huaweicloud），那么其功能和官方源是重合的，可以禁用掉官方源：

```powershell
nuget sources Disable -Name "nuget.org"
nuget sources add -Name "huaweicloud" -Source "https://mirrors.huaweicloud.com/repository/nuget/v3/index.json"
```

### 在 Visual Studio 中添加

在 Visual Studio 中打开 `工具` -> `选项` -> `NuGet 包管理器` -> `包源`：

![管理包源](/static/posts/2019-02-27-11-58-37.png)

然后在界面上添加、删除、启用和禁用 NuGet 源。

值得注意的是：

1. 在 Visual Studio 中是不能禁用掉官方源 `nuget.org` 的，无论你如何取消勾选，实际都不会生效。
    - 如果要取消，你需要用命令行或者手工编辑配置文件。
1. 你可以添加一个本地路径作为本地 NuGet 源，而那个路径只要存在 *.nupkg 文件就够了。
    - 对于 .NET Core 项目，勾选编译后生成 NuGet 包则会在输出路径生成这样的文件，于是你可以本地调试。

### 直接修改配置文件

NuGet 的全局配置文件在 `%AppData\NuGet\NuGet.config`，例如：

```text
C:\Users\lvyi\AppData\Roaming\NuGet\NuGet.Config
```

直接修改这个文件的效果跟使用命令行和 Visual Studio 的界面配置是等价的。

```xml
<configuration>
  <packageSources>
    <add key="huaweicloud" value="https://repo.huaweicloud.com/repository/nuget/v3/index.json" />
    <add key="nuget.org" value="https://api.nuget.org/v3/index.json" protocolVersion="3" />
    <add key="Walterlv.Debug" value="C:\Users\lvyi\Debug\Walterlv.NuGet" />
    <add key="Microsoft Visual Studio Offline Packages" value="C:\Program Files (x86)\Microsoft SDKs\NuGetPackages\" />
    <add key="MyGet" value="https://dotnet.myget.org/F/dotnet-core/api/v3/index.json" />
  </packageSources>
  <disabledPackageSources>
    <add key="Microsoft Visual Studio Offline Packages" value="true" />
    <add key="Walterlv.Debug" value="true" />
    <add key="nuget.org" value="true" />
  </disabledPackageSources>
</configuration>
```

### 为单独的项目添加自定义的 NuGet 源

NuGet.config 文件是有优先级的。nuget.exe 会先把全局配置加载进来；然后从当前目录中寻找 NuGet.config 文件，如果没找到就去上一级目录找，一直找到驱动器的根目录；找到后添加到已经加载好的全局配置中成为一个合并的配置。

所以我们只需要在项目的根目录放一个 NuGet.config 文件并填写相比于全局 NuGet.config 新增的配置即可为单独的项目添加 NuGet 配置。

```xml
<?xml version="1.0" encoding="utf-8"?>
<configuration>
  <packageSources>
    <!-- 下一行的 clear 如果取消了注释，那么就会清除掉全局的 NuGet 源，而注释掉可以继承全局 NuGet 源，只是额外添加。 -->
    <!-- <clear /> -->
    <add key="MyGet" value="https://dotnet.myget.org/F/dotnet-core/api/v3/index.json" />
  </packageSources>
</configuration>
```
