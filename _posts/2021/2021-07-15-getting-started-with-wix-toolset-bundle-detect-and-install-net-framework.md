---
title: "用 WiX 制作安装包：为 WiX 制作的 exe 安装包添加 .NET Framework 前置的安装步骤"
date: 2021-07-15 19:46:34 +0800
categories: dotnet msi wix
position: starter
---

本文是 [WiX Toolset 安装包制作入门教程](/post/getting-started-with-wix-toolset) 系列中的一篇，可前往阅读完整教程。

前面我们制作完成了一个简单的 exe 安装包。如果我们要安装的程序运行需要 .NET Framework 环境，那么可以检查 .NET Framework 是否安装，如果未安装则可将其装上。

---

> 小提示
>
> Bundle（exe 格式）的判断方法和 Product（msi 格式）的不一样，因此 [为 WiX 制作的 msi 安装包添加 .NET Framework 环境检查](/post/getting-started-with-wix-toolset-msi-detect-net-framework) 一文中所编写的代码对本文没有任何影响。因此即使跳过了那篇文章也丝毫不影响本文的学习。

<div id="toc"></div>

本文基于前一篇文章已经建好的项目继续：

- [用 WiX 制作安装包：创建一个简单的 exe 安装包](/post/getting-started-with-wix-toolset-exe-hello-world)

## 背景知识

在开始给我们的 exe 安装包增加 .NET Framework 环境检查之前，我们先了解一点背景知识，以便后续步骤可以使用更专业的词汇来准确描述我们正在做的事情。

注意到我们解决方案里面的两个 wxs 文件了吗？他们分别是用来打 msi 包的 Product.wxs 和用来打 exe 包的 Bundle.wxs。这两个文件的结构分别像这样：

```xml
<!-- Product.wxs -->
<Wix>
  <Product>
    <Package />
    <!-- 其他元素 -->
  </Product>
</Wix>
```

```xml
<!-- Bundle.wxs -->
<Wix>
  <Bundle>
    <BootstrapperApplicationRef />
    <!-- 其他元素 -->
  </Product>
</Wix>
```

这里引入了两个很重要的概念：产品（Product）和捆绑包（Bundle）。`<Product>` 元素负责定义如何安装一个产品，而 `<Bundle>` 元素负责定义如何安装一组包。在 wxs 文件中，他们分别是 `<Wix>` 元素的直接子级，彼此拥有不同的元素特性（Attribute）和子级（Child）——相互之间不可通用。也就是说，如果哪天你在网上某处扒出来某份 WiX 安装包代码，你需要清楚到底应该把这份代码放到哪个文件中。

WiX 的官方文档中明确说明了这两个元素分别具有的不同特性和子级：

- [Product Element](https://wixtoolset.org/documentation/manual/v3/xsd/wix/product.html)
- [Bundle Element](https://wixtoolset.org/documentation/manual/v3/xsd/wix/bundle.html)

## 添加 WixNetFxExtension 引用

1. 在 exe 安装包项目的“Reference”上右键，“添加引用...”；
2. 在打开的“Add Reference”窗口中确保选中的是“浏览”标签，然后在查找范围中找到 Wix Toolset 的安装目录（如果没改，那么应该在 `C:\Program Files (x86)\WiX Toolset v3.11\bin` 这样的地方）；
3. 在文件列表中找到“WixNetFxExtension.dll”；
4. 点击“添加”；
5. 点击“确定”。

![添加 WixNetFxExtension.dll 引用](/static/posts/2021-07-15-14-31-16.png)

与之前添加引用一样，虽然我们选的路径是绝对路径，但实际上写入到 wixproj 文件中的是一个属性引用，所以不会存在团队协作和跨版本迁移问题。

上次我们添加 WixNetFxExtension.dll 的引用是为了引用一个属性。而这次，我们是为了引用一个 .NET Framework 的安装包。

## 编辑 Bundle.wxs

现在，我们需要编辑 Bundle.wxs 文件。做两件事情：

1. 将 .NET Framework 的安装加入到捆绑包的安装过程中；
2. 将 .NET Framework 的安装包文件嵌入到捆绑包中或随包放到单独的文件中（可选）。

### 将 .NET Framework 的安装加入到捆绑包的安装过程中

WixNetFxExtension.dll 中已经自带好了各种版本的 .NET Framework 安装方法，其中每个版本都含在线安装和离线安装两种方法。

对于小型项目，我们可以考虑在线安装 .NET Framework。于是，我们在 Bundle.wxs 文件中添加一行：

```diff
    <Chain>
++    <PackageGroupRef Id="NetFx462Web"/>
      <MsiPackage Compressed="yes"
                  SourceFile="$(var.Walterlv.Installer.Msi.TargetPath)"/>
    </Chain>
```

对于面向大量用户的产品，我们可能需要考虑本地安装 .NET Framework。于是，我们在 Bundle.wxs 文件中添加另一行：

```diff
    <Chain>
++    <PackageGroupRef Id="NetFx462Redist"/>
      <MsiPackage Compressed="yes"
                  SourceFile="$(var.Walterlv.Installer.Msi.TargetPath)"/>
    </Chain>
```

以上两种方式选择一种即可，看你的需要。

WiX 已开源，其中 wix3 的代码在这里：

- [wixtoolset/wix3: WiX Toolset v3.x](https://github.com/wixtoolset/wix3)

在 `/src/ext/NetFxExtension/wixlib` 目录下有已定义好的各种 .NET Framework 版本的安装逻辑。我整理成下表，方便大家根据自己的需要查阅：

| .NET Framework 版本 | 在线安装           | 本地安装              |
| ------------------- | ------------------ | --------------------- |
| 4.8                 | `NetFx48Web`       | `NetFx48Redist`       |
| 4.7.2               | 无                 | `NetFx472Redist`      |
| 4.7.1               | 无                 | 无                    |
| 4.7                 | 无                 | 无                    |
| 4.6.2               | `NetFx462Web`      | `NetFx462Redist`      |
| 4.6.1               | `NetFx461Web`      | `NetFx461Redist`      |
| 4.6                 | `NetFx46Web`       | `NetFx46Redist`       |
| 4.5.2               | `NetFx452Web`      | `NetFx452Redist`      |
| 4.5.1               | `NetFx451Web`      | `NetFx451Redist`      |
| 4.5                 | `NetFx45Web`       | `NetFx45Redist`       |
| 4 Full              | `NetFx40Web`       | `NetFx40Redist`       |
| 4 Client Profile    | `NetFx40ClientWeb` | `NetFx40ClientRedist` |

其他版本未提供安装逻辑，如果需要，你得自己写。鉴于这部分需要用到更多代码，所以我不在本入门教程内说明。如果需要的话，我单独写一篇。

### 将 .NET Framework 的安装包文件嵌入到捆绑包中

如果你在前一个步骤中选择的是通过 Web 的方式来安装 .NET Framework，那么此步骤就不需要了。而如果你打算将 .NET Framework 的安装包嵌入到捆绑包中或者随包放到单独的文件中，那么请继续操作。

根据 [WiX 3 已开源的源码](https://github.com/wixtoolset/wix3)我们可以得知，本地安装 .NET Framework 时选取的目录为 `redist\`。对于 Bundle 捆绑包来说，这个目录指代了两种意思：

1. 跟捆绑包的 exe 同一目录下的“redist”文件夹中；
2. 捆绑包打包后包内的虚拟目录“redist”中。

这对应了两种本地安装时，.NET Framework 安装包的两种再分发（redistribute）方法。

来看看怎么做：

1. 下载 .NET Framework 的离线安装包（[官方下载地址（含各种版本）](https://dotnet.microsoft.com/download/dotnet-framework)；
1. 将下载好的 .NET Framework 安装包拖入到 exe 安装包项目中的根目录或任一文件夹下（也可以通过右键添加文件的方式添加）；
1. 编辑 Bundle.wxs 文件，在 `<BootstrapperApplicationRef>` 内加入负载；
1. 编辑 Bundle.wxs 文件，把 `NetFx462Web` 改成 `NetFx462Redist`。

![下载 .NET Framework](/static/posts/2021-07-15-15-12-27.png)  
▲ 下载 .NET Framework

```diff
--  <BootstrapperApplicationRef Id="WixStandardBootstrapperApplication.RtfLicense" />
++  <BootstrapperApplicationRef Id="WixStandardBootstrapperApplication.RtfLicense">
++    <Payload Name="redist\NDP462-KB3151800-x86-x64-AllOS-ENU.exe"
++             SourceFile="Assets\ndp462-kb3151800-x86-x64-allos-enu.exe"/>
    </BootstrapperApplicationRef>
```

```diff
--    <PackageGroupRef Id="NetFx462Web"/>
++    <PackageGroupRef Id="NetFx462Redist"/>
```

以上四个步骤完成后，你的解决方案应该像下面这样：

![添加了 .NET Framework 负载的解决方案](/static/posts/2021-07-15-15-23-17.png)

解释一下：

1. 我创建了一个“Assets”文件夹用于存放刚下载好的 .NET Framework 的离线安装包（为了避免读者在概念上产生混淆，我刻意避开使用 `redist` 这个名字，以示说明解决方案内的文件夹结构仅为开发文件夹结构，不代表最终捆绑包内的虚拟目录结构）。
2. 我在 `<BootstrapperApplicationRef>` 元素内新建了一个子元素 `<Payload>`（负载），其中 `Name` 设为 `redist\NDP462-KB3151800-x86-x64-AllOS-ENU.exe`（这个对应的就是最终捆绑包的虚拟目录结构），`SourceFile` 设为 `Assets\ndp462-kb3151800-x86-x64-allos-enu.exe`（这个对应的是开发时项目中的文件结构）。
3. 每个 .NET Framework 版本都有自己对应的文件名称，如果还想继续用 WixNetFxExtension.dll 中提供的安装 .NET Framework 的功能，那么从官网下载文件后就不能改名字（WiX 中定义这些文件名是全大写的，下载下来的是全小写的，虽然实际上大小写并不影响）。

编译这个项目，去输出目录下插件，可以发现几百 KB 的安装包现在变成了 59.6MB。很明显，.NET Framework 已经嵌入到了捆绑包中。

![已嵌入了 .NET Framework 捆绑包的 exe 安装包](/static/posts/2021-07-15-15-24-33.png)

而如果你跳过前面加 `<Payload>` 的步骤，那么最终生成的的 exe 将不含 .NET Framework 的安装包。如果用户此时双击这个 exe 安装文件并且当前的 .NET Framework 版本不满足要求，则会弹出一个文件选择对话框，要求用户选择正确的 .NET Framework 安装文件以继续安装过程。如果你希望避免用户选择文件，那么就需要把安装包放到 exe 文件同级目录下的 `redist` 文件夹中。

![不嵌入 .NET Framework 时的目录结构](/static/posts/2021-07-15-15-45-07.png)

<!-- 此方法在 WiX 3 中不生效 -->
<!-- ![不嵌入 .NET Framework 而是随包附带单独文件的方法](/static/posts/2021-07-15-15-37-43.png) -->

## 测试效果

现在，编译 MSI 项目，然后去没有 .NET Framework 4.6.2 的电脑上运行输出目录下的 exe 文件，可以看到已经在安装 .NET Framework 了。

![正在安装 .NET Framework](/static/posts/2021-07-15-15-44-25.png)

## 附源代码

附上必要的源码，避免你在阅读教程时因模板文件的版本差异造成一些意料之外的问题。

![必要的源码](/static/posts/2021-07-15-16-08-11.png)

### Bundle.wxs

`// 除了本文所说的改动外，本文件的其他内容均保持模板文件的原始模样。`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Bundle Name="Walterlv.Demo.MainApp"
          Version="1.0.0.0"
          Manufacturer="walterlv"
          UpgradeCode="528f80ca-a8f5-4bd4-8131-59fdcd69a411">
    <BootstrapperApplicationRef Id="WixStandardBootstrapperApplication.RtfLicense">
      <Payload Name="redist\NDP462-KB3151800-x86-x64-AllOS-ENU.exe"
               SourceFile="Assets\ndp462-kb3151800-x86-x64-allos-enu.exe"/>
    </BootstrapperApplicationRef>

    <Chain>
      <PackageGroupRef Id="NetFx462Redist"/>
      <MsiPackage Compressed="yes"
                  SourceFile="$(var.Walterlv.Installer.Msi.TargetPath)"/>
    </Chain>
  </Bundle>
</Wix>
```
