---
title: "用 WiX 制作安装包：为 WiX 制作的 msi 安装包添加 .NET Framework 环境检查"
publishDate: 2021-07-15 11:55:30 +0800
date: 2021-07-15 19:46:48 +0800
tags: dotnet msi wix
position: starter
coverImage: /static/posts/2021-07-15-10-08-48.png
permalink: /post/getting-started-with-wix-toolset-msi-detect-net-framework.html
---

本文是 [WiX Toolset 安装包制作入门教程](/post/getting-started-with-wix-toolset) 系列中的一篇，可前往阅读完整教程。

前面我们制作完成了一个简单的 msi 安装包。如果我们要安装的程序运行需要 .NET Framework 环境，那么也可以先进行 .NET Framework 版本检查。

本文将指导你在 msi 安装前检查 .NET Framework 的版本。

---

本文基于前一篇文章已经建好的项目继续：

- [用 WiX 制作安装包：创建一个简单的 msi 安装包](/post/getting-started-with-wix-toolset-msi-hello-world)

<div id="toc"></div>

## 添加 WixNetFxExtension 引用

1. 在 msi 安装包项目的“Reference”上右键，“添加引用...”；
2. 在打开的“Add Reference”窗口中确保选中的是“浏览”标签，然后在查找范围中找到 Wix Toolset 的安装目录（如果没改，那么应该在 `C:\Program Files (x86)\WiX Toolset v3.11\bin` 这样的地方）；
3. 在文件列表中找到“WixNetFxExtension.dll”；
4. 点击“添加”；
5. 点击“确定”。

![添加 WixNetFxExtension.dll 引用](/static/posts/2021-07-15-10-08-48.png)

> **小提示**
>
> 你不用担心绝对路径问题。
>
> 虽然我们前面选择的 `C:\Program Files (x86)\WiX Toolset v3.11\bin` 看起来是个绝对路径，但实际上在 wixproj 项目里记录的是一个属性引用，因此可以很容易在团队成员之间共享和跨版本迁移。
>
> 如下是 Walterlv.Installer.Msi.wixproj 项目文件中对 WixNetFxExtension 的引用代码：
>
> ```xml
> <WixExtension Include="WixNetFxExtension">
>   <HintPath>$(WixExtDir)\WixNetFxExtension.dll</HintPath>
>   <Name>WixNetFxExtension</Name>
> </WixExtension>
> ```

添加完 WixNetFxExtension 的引用后，还需要把它的命名空间添加到 Product.wxs 中。打开 Product.wxs 文件，在里面添加一行：

```diff
--  <Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
++  <Wix xmlns="http://schemas.microsoft.com/wix/2006/wi"
         xmlns:netfx="http://schemas.microsoft.com/wix/NetFxExtension">
```

注意，添加此命名空间不是必要操作，因为本教程后续没有用到此命名空间。

## 编辑 Product.wxs

现在，我们需要编辑 Product.wxs 文件。做两件事情：

1. 得知当前系统环境是否已具备 .NET Framework 某版本；
2. 根据判断结果决定此 MSI 包是否能被安装。

> **小提示**
>
> MSI 包只能判断 .NET Framework 是否存在，无法在不存在时执行 .NET Framework 的安装操作。如果需要安装 .NET Framework，你需要继续阅读本教程系列的 exe 打包部分。

### 判断 .NET Framework 是否已满足要求

因为我们已经引用了 WixNetFxExtension.dll，那里面已经写好了 .NET Framework 各版本是否存在的判断逻辑，所以我们只需要引用一下它的判断结果就好了。

在 WiX 的配置文件 wxs 里，引用一个属性的方法是使用 `<PropertyRef>` 元素。所以，我们在 Product.wxs 里添加这样的一行：

```diff
    <Package InstallerVersion="200" Compressed="yes" InstallScope="perMachine" />

++  <PropertyRef Id="WIX_IS_NETFRAMEWORK_462_OR_LATER_INSTALLED"/>
++
    <MajorUpgrade DowngradeErrorMessage="A newer version of [ProductName] is already installed." />
```

注意：

1. `<PropertyRef>` 元素必须是 `<Product>` 元素的直接子级；
2. `<Package>` 元素必须是 `<Product>` 元素的第一个子级（也就是说，`<PropertyRef>` 必须在 `<Package>` 的后面）。

### 决定此 MSI 包是否能被安装

紧接在刚刚那句的后面，我们再添加一句：

```diff
    <PropertyRef Id="WIX_IS_NETFRAMEWORK_462_OR_LATER_INSTALLED"/>

++  <Condition Message="This application requires .NET Framework 4.6.2. Please install the .NET Framework then run this installer again.">
++      <![CDATA[WIX_IS_NETFRAMEWORK_462_OR_LATER_INSTALLED]]>
++  </Condition>
++
    <MajorUpgrade DowngradeErrorMessage="A newer version of [ProductName] is already installed." />
```

这句话的意思是：

1. 此 MSI 包安装需要满足指定条件
2. 中间的判断条件我们用了 `<![CDATA[` 和 `]]>` 包裹起来了，避免判断条件中出现了一些会破坏 XML 语法的字符（如 `<` `>` 等）出现导致意外的问题（但实际上在本例中，我们只用了字母和下划线，所以你也可以直接写 `WIX_IS_NETFRAMEWORK_462_OR_LATER_INSTALLED`）；
3. 如果不满足指定条件，则弹出提示信息，在 `Message` 属性中指定不满足条件时要弹出的信息。

不过，考虑到在卸载程序时无需检查 .NET Framework（反正也不会再运行了），所以我们可以在判断条件里加上 `OR`：

```diff
    <Condition Message="This application requires .NET Framework 4.6.2. Please install the .NET Framework then run this installer again.">
--      <![CDATA[WIX_IS_NETFRAMEWORK_462_OR_LATER_INSTALLED]]>
++      Installed OR WIX_IS_NETFRAMEWORK_462_OR_LATER_INSTALLED
    </Condition>
```

因为我们的判断条件里没有使用到 XML 特殊字符，所以我刻意删掉了 `<![CDATA[` 和 `]]>` 以提升可读性。有的团队为避免出错要求强制加上此包裹，有的团队为了提升可读性建议如无必要则不要加上包裹。你也可以定义你的团队规范。

`Installed` 属性表示当前此产品是否已安装。也就是说新的判断条件的意思是：如果当前产品已安装，或者 .NET Framework 已安装有 4.6.2 或更高版本，则满足安装条件，准许安装，否则弹出错误提示。

### 可供判断的 .NET Framework 版本

WiX 已开源，其中 wix3 的代码在这里：

- [wixtoolset/wix3: WiX Toolset v3.x](https://github.com/wixtoolset/wix3)

在 `/src/ext/NetFxExtension/wixlib` 目录下有已定义好的各种 .NET Framework 版本的判断逻辑。我整理成下表，方便大家根据自己的需要查阅：

| .NET Framework 版本 | 对应判断属性                                 |
| ------------------- | -------------------------------------------- |
| 4.8                 | `WIX_IS_NETFRAMEWORK_48_OR_LATER_INSTALLED`  |
| 4.7.2               | `WIX_IS_NETFRAMEWORK_472_OR_LATER_INSTALLED` |
| 4.7.1               | `WIX_IS_NETFRAMEWORK_471_OR_LATER_INSTALLED` |
| 4.7                 | `WIX_IS_NETFRAMEWORK_47_OR_LATER_INSTALLED`  |
| 4.6.2               | `WIX_IS_NETFRAMEWORK_462_OR_LATER_INSTALLED` |
| 4.6.1               | `WIX_IS_NETFRAMEWORK_461_OR_LATER_INSTALLED` |
| 4.6                 | `WIX_IS_NETFRAMEWORK_46_OR_LATER_INSTALLED`  |
| 4.5.2               | `WIX_IS_NETFRAMEWORK_452_OR_LATER_INSTALLED` |
| 4.5.1               | `WIX_IS_NETFRAMEWORK_451_OR_LATER_INSTALLED` |
| 4.5                 | `WIX_IS_NETFRAMEWORK_45_OR_LATER_INSTALLED`  |
| 4                   | `WIX_IS_NETFRAMEWORK_40_OR_LATER_INSTALLED`  |

更低版本的 .NET Framework 没有直接的“是否安装”判断方法，需要根据版本号比较来判断，所以我不在此入门教程中列出。

WiX 3 不支持 .NET Core 3.x、.NET 5 以及 .NET 6 的判断。如需检查这些环境，要么需要自己写判断方法（不属于此新手教程内容），要么需要升级到 WiX 4（本教程基于 WiX 3）。见：[Support .NET Standard and/or .NET Core custom Bootstrapper · Issue #6108 · wixtoolset/issues](https://github.com/wixtoolset/issues/issues/6108)。

## 测试效果

现在，编译 MSI 项目，然后运行输出目录下的 msi 文件，你会……呃……看不到任何效果……因为我们的开发机上具备 .NET Framework 4.8 的环境，可完美运行 .NET Framework 4.6.2 需求的应用。

下图是我魔改了 DEMO 后在 Windows 11 上的截图（放上来就是为了平衡美感的）：

![假 .NET Framework 需求](/static/posts/2021-07-15-10-45-38.png)

不过为了真实性，我还是找了台 Windows 7 纯净系统来测试：

![.NET Framework 需求](/static/posts/2021-07-15-10-55-07.png)

如果点击“OK”，安装程序将直接退出，不会执行任何安装操作。

## 附源代码

附上必要的源码，避免你在阅读教程时因模板文件的版本差异造成一些意料之外的问题。

![必要的源码](/static/posts/2021-07-15-11-50-39.png)

### Product.wxs

`// 除了本文所说的改动外，本文件的其他内容均保持模板文件的原始模样。`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi"
     xmlns:netfx="http://schemas.microsoft.com/wix/NetFxExtension">
  <Product Id="*"
           Name="Walterlv.Demo.MainApp"
           Language="1033"
           Version="1.0.0.0"
           Manufacturer="walterlv"
           UpgradeCode="2aeffe1a-8bb6-4b06-b1c0-feca18e17cf7">
    <Package InstallerVersion="200" Compressed="yes" InstallScope="perMachine" />

    <PropertyRef Id="WIX_IS_NETFRAMEWORK_462_OR_LATER_INSTALLED"/>

    <Condition Message="This application requires .NET Framework 4.6.2. Please install the .NET Framework then run this installer again.">
      <![CDATA[WIX_IS_NETFRAMEWORK_462_OR_LATER_INSTALLED]]>
    </Condition>

    <MajorUpgrade DowngradeErrorMessage="A newer version of [ProductName] is already installed." />
    <MediaTemplate />

    <Feature Id="ProductFeature" Title="Walterlv.Installer.Msi" Level="1">
      <ComponentGroupRef Id="ProductComponents" />
    </Feature>
  </Product>

  <Fragment>
    <Directory Id="TARGETDIR" Name="SourceDir">
      <Directory Id="ProgramFilesFolder">
        <Directory Id="INSTALLFOLDER" Name="Walterlv.Installer.Msi" />
      </Directory>
    </Directory>
  </Fragment>

  <Fragment>
    <ComponentGroup Id="ProductComponents" Directory="INSTALLFOLDER">
      <Component Id="ProductComponent">
        <File Source="$(var.Walterlv.Demo.MainApp.TargetPath)" />
      </Component>
    </ComponentGroup>
  </Fragment>
</Wix>
```

---

**参考资料**

- [How To: Check for .NET Framework Versions](https://wixtoolset.org/documentation/manual/v3/howtos/redistributables_and_install_checks/check_for_dotnet.html)
- [Expression Syntax](https://www.firegiant.com/wix/tutorial/com-expression-syntax-miscellanea/expression-syntax/)


