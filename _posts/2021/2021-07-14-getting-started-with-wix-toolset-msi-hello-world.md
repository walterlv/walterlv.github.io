---
title: "用 WiX 制作安装包：创建一个简单的 msi 安装包"
publishDate: 2021-07-14 17:54:13 +0800
date: 2021-07-15 19:46:48 +0800
categories: dotnet msi wix
position: starter
---

本文是 [WiX Toolset 安装包制作入门教程](/post/getting-started-with-wix-toolset) 系列中的一篇，可前往阅读完整教程。

本文将带大家制作一个简单的 msi 安装包。

---

本文操作基于系列教程中的一个最简项目，见 [准备一个用于学习 WiX 安装包制作的 Visual Studio 解决方案](/post/getting-started-with-wix-toolset-create-a-new-learning-vs-solution.md)。如果你没准备这样的项目，拿一个现成的项目也行，毕竟打包对目标程序的形式没有任何要求，只要是一个能跑起来的程序即可。

<div id="toc"></div>

## 创建 WiX MSI 项目

在解决方案上右键，“添加”->“新建项目...”，然后在“添加新项目”窗口中搜索“WiX”，找到“Setup Project for WiX v3”。按“下一步”取个名字，然后“创建”。

注意，选择的模板要注意这些要点：

1. 图标上标记了“wix”，标签上标记了“WiX”
2. 模板简介中说明这是在创建“MSI”文件

![创建 WiX MSI 项目](/static/posts/2021-07-14-15-28-01.png)

![取个名字](/static/posts/2021-07-14-15-34-44.png)

## 引用目标项目

1. 在 WiX MSI 项目（在本教程中，我取的名字为 Walterlv.Installer.Msi）的“References”上右键，选“添加引用...”；
2. 在打开的“Add Reference”窗口中选择“项目”标签；
3. 选中希望打包的项目；
4. 点“添加”；
5. 点“确定”。

![引用目标项目](/static/posts/2021-07-14-15-41-41.png)

## 编辑 Product.wxs 文件

### 添加要打包的文件

在 Product.wxs 文件中，找到提示你放文件、注册表项和其他资源的注释“`<!-- TODO: Insert files, registry keys, and other resources here. -->`”：

1. 把周围的“Component”解除注释（因为我们真的要加打包的文件了）；
2. 删除“TODO”注释（本教程会继续教你如何完成打包，不需要 TODO 提示了）；
3. 在“Component”块中添加一行 `<File Source="$(var.Walterlv.Demo.MainApp.TargetPath)" />`。

```diff
   <Fragment>
     <ComponentGroup Id="ProductComponents" Directory="INSTALLFOLDER">
--     <!-- TODO: Remove the comments around this Component element and the ComponentRef below in order to add resources to this installer. -->
--     <!-- <Component Id="ProductComponent"> -->
++     <Component Id="ProductComponent">
--       <!-- TODO: Insert files, registry keys, and other resources here. -->
++       <File Source="$(var.Walterlv.Demo.MainApp.TargetPath)" />
--     <!-- </Component> -->
++     </Component>
     </ComponentGroup>
   </Fragment>
```

注意：

1. 这里的 Walterlv.Demo.MainApp 是上一个步骤中引用的项目的名称（不是程序集或 exe 的名称）！如果你有自己的项目名，则在此改成你自己的项目名称。
2. 本例的目标程序只有一个文件，因此我们只放了一行，如果你要打包多个文件，可返回本教程目录页查阅其他文章。

### 编辑基本的安装包信息

此时，我们距离完成 msi 打包只剩最后一步了，就是填写基本的安装包信息。因为如果你不填，编译会报错：

![缺少厂商信息](/static/posts/2021-07-14-16-05-32.png)  
▲ 缺少厂商信息

这个信息在 `Product` 标签的特性上更改：

```diff
    <Product Id="*"
--           Name="Walterlv.Installer.Msi"
++           Name="Walterlv.Demo.MainApp"
             Language="1033"
             Version="1.0.0.0"
--           Manufacturer=""
++           Manufacturer="walterlv"
             UpgradeCode="2aeffe1a-8bb6-4b06-b1c0-feca18e17cf7">
```

除了改了厂商（`Manufacturer`）之外，我还额外改了一下 `Name`，这个名字是最终出现在系统设置“应用和功能”中的名字，当然也是控制面板“卸载程序”中的名字。毕竟谁也不希望系统“应用和功能”里显示的名字不是真正的产品名吧……

另外，其他属性的值也值得留意。但在你明白他们的真实含义之前，不建议修改其值。

关于这些值的含义，你可以阅读我的另一篇博客：

- [Windows 安装包制作最佳实践：ProductCode、UpgradeCode、PackageCode 应该怎么设置？](/post/windows-installer-using-wix-best-practice-product-id-and-upgrade-code)

### 修改输出文件名

以上 Product.wxs 修改的是安装包的信息。如果希望更改 MSI 安装包的文件名，则需要去项目的属性页里去修改，如下图：

![修改 MSI 安装包文件名](/static/posts/2021-07-14-16-21-35.png)

## 测试效果

现在，我们完成了一个最简单的 MSI 安装包，测试安装一下。

前往 MSI 文件的输出目录（在项目目录的 bin\Debug 下）：

![前往 MSI 文件的输出目录](/static/posts/2021-07-14-16-24-31.png)  
▲ 前往 MSI 文件的输出目录

安装完后，可以在系统设置“应用和功能”以及“Program Files”目录中找到它：

![系统设置应用和功能](/static/posts/2021-07-14-16-24-10.png)  
▲ 系统设置应用和功能

![Program Files 文件夹](/static/posts/2021-07-14-16-39-38.png)  
▲ Program Files 文件夹

测试完成后，记得及时卸载掉这个包。虽然这次没什么影响，但后续我们会学到的某个操作可能导致未及时卸载的包再也无法通过正常途径卸载，所以请保持良好的习惯。（虚拟机调试的小伙伴可无视）。

另外，觉得不错可以提交一下代码，方便后续章节的学习。

## 附源代码

附上必要的源码，避免你在阅读教程时因模板文件的版本差异造成一些意料之外的问题。

![必要的源码](/static/posts/2021-07-14-17-43-34.png)

### Product.wxs

`// 除了本文所说的改动外，本文件的其他内容均保持模板文件的原始模样。`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Product Id="*"
           Name="Walterlv.Demo.MainApp"
           Language="1033"
           Version="1.0.0.0"
           Manufacturer="walterlv"
           UpgradeCode="2aeffe1a-8bb6-4b06-b1c0-feca18e17cf7">
    <Package InstallerVersion="200" Compressed="yes" InstallScope="perMachine" />

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
