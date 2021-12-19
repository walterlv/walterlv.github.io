---
title: "用 WiX 制作安装包：创建一个简单的 exe 安装包"
publishDate: 2021-07-14 18:52:59 +0800
date: 2021-07-20 09:11:05 +0800
tags: dotnet msi wix
position: starter
coverImage: /static/posts/2021-07-14-17-55-51.png
permalink: /posts/getting-started-with-wix-toolset-exe-hello-world.html
---

本文是 [WiX Toolset 安装包制作入门教程](/post/getting-started-with-wix-toolset) 系列中的一篇，可前往阅读完整教程。

本文将带大家制作一个简单的 exe 安装包。

---

本文开始前，请确保你已经可以生成一个最简单的 msi 安装包了：

- [用 WiX 制作安装包：创建一个简单的 msi 安装包](/post/getting-started-with-wix-toolset-msi-hello-world)

由于 exe 格式的安装包自己带了 UI，所以 msi 中的 UI 怎么样都是可以不用管的（不用纠结 msi 做成了扫什么样，能像上文结尾一样正常安装就好）。

<div id="toc"></div>

## 创建 WiX EXE 项目

在解决方案上右键，“添加”->“新建项目...”，然后在“添加新项目”窗口中搜索“WiX”，找到“Bootstrapper Project for WiX v3”。按“下一步”取个名字，然后“创建”。

注意，选择的模板要注意这些要点：

1. 图标上标记了“wix”，标签上标记了“WiX”
2. 模板简介中说明这是在创建“EXE”文件

![创建 WiX EXE 项目](/static/posts/2021-07-14-17-55-51.png)

![取个名字](/static/posts/2021-07-14-17-57-21.png)

创建完后，记得去项目属性里改一下输出的文件名。例如可以改成主项目的名称，也可以改成“XXX_Setup”这些大家喜欢用的名称。

![更改输出文件的名称](/static/posts/2021-07-14-17-58-29.png)

## 引用 MSI 项目

我们现在的这个项目生成的是捆绑包（Bundle），是为了将多个安装包集合到一起进行安装的。

我们需要在这个捆绑包里面安装我们上一篇教程中创建的 MSI 安装包，所以我们需要引用这个创建 MSI 的项目。

![引用 MSI 项目](/static/posts/2021-07-14-18-28-19.png)

## 编辑 Bundle.wxs 文件

在 Bundle.wxs 文件中，找到放 MSI 文件的注释处，将其替换成我们想安装的 MSI 文件。

```diff
    <Chain>
--    <!-- TODO: Define the list of chained packages. -->
--    <!-- <MsiPackage SourceFile="path\to\your.msi" /> -->
++    <MsiPackage Compressed="yes"
++                SourceFile="$(var.Walterlv.Installer.Msi.TargetPath)"/>
    </Chain>
```

注意：

1. 这里的 Walterlv.Installer.Msi 是前一篇教程中引用的项目的名称，你可以改成你自己的生成 MSI 的项目的名称。
2. `Compressed="yes"` 表示此 MSI 包会被嵌入到最终生成的 exe 文件中（反之则会松散地放到外部文件中）。可选值为 `yes` `no` `default`，对于 MSI 文件会默认嵌入，所以也可以不指定。

### 编辑基本的安装包信息

与 MSI 包一样，不填写基本的安装信息也会报编译错误：

![缺少厂商信息](/static/posts/2021-07-14-18-39-24.png)  
▲ 缺少厂商信息

```diff
    <Product Id="*"
--           Name="Walterlv.Installer.Msi"
++           Name="Walterlv.Demo.MainApp"
             Language="1033"
             Version="1.0.0.0"
--           Manufacturer=""
++           Manufacturer="walterlv"
             UpgradeCode="2aeffe1a-8bb6-4b06-b1c0-feca18e17cf7">
--  <Bundle Name="Walterlv.Installer.Exe"
++  <Bundle Name="Walterlv.Demo.MainApp"
            Version="1.0.0.0"
--          Manufacturer=""
++          Manufacturer="walterlv"
--          UpgradeCode="528f80ca-a8f5-4bd4-8131-59fdcd69a411">
++          UpgradeCode="2aeffe1a-8bb6-4b06-b1c0-feca18e17cf7">
```

这里的 `UpgradeCode` 如果改成和之前的 MSI 文件的一样，那么无论是做成 MSI 还是 EXE 格式的安装包，他们都是可以互相被升级的。

当然，对于一个 Bundle 来说可以集合多个安装包。当要一次安装多个 MSI 包的时候，建议选不一样的 `UpgradeCode`。

关于设置 MSI 和 EXE 安装包的 `UpgradeCode` 的更多细节，可以阅读我的另一篇博客：

- [MSI 和 EXE 的 UpgradeCode 应该设置成相同还是不同？](/post/wix-toolset-should-the-upgrade-code-be-the-same-between-exe-and-msi)

## 测试效果

现在，我们完成了一个最简单的 EXE 安装包，测试安装一下。

前往 EXE 文件的输出目录（在项目目录的 bin\Debug 下）：

![前往 EXE 文件的输出目录](/static/posts/2021-07-14-18-47-40.png)  
▲ 前往 EXE 文件的输出目录

双击安装，可以出现默认的安装界面：

![默认的安装界面](/static/posts/2021-07-14-18-49-29.png)  
▲ 默认的安装界面

安装完后，可以在系统设置“应用和功能”以及“Program Files”目录中找到它：

![系统设置应用和功能](/static/posts/2021-07-14-18-50-47.png)  
▲ 系统设置应用和功能

测试完成后，记得及时卸载掉这个包。虽然这次没什么影响，但后续我们会学到的某个操作可能导致未及时卸载的包再也无法通过正常途径卸载，所以请保持良好的习惯。（虚拟机调试的小伙伴可无视）。

![卸载包](/static/posts/2021-07-14-18-51-47.png)  
▲ 卸载包

另外，觉得不错可以提交一下代码，方便后续章节的学习。

## 附源代码

附上必要的源码，避免你在阅读教程时因模板文件的版本差异造成一些意料之外的问题。

![必要的源码](/static/posts/2021-07-14-18-52-22.png)

### Bundle.wxs

`// 除了本文所说的改动外，本文件的其他内容均保持模板文件的原始模样。`

```xml
<?xml version="1.0" encoding="UTF-8"?>
<Wix xmlns="http://schemas.microsoft.com/wix/2006/wi">
  <Bundle Name="Walterlv.Demo.MainApp"
          Version="1.0.0.0"
          Manufacturer="walterlv"
          UpgradeCode="528f80ca-a8f5-4bd4-8131-59fdcd69a411">
    <BootstrapperApplicationRef Id="WixStandardBootstrapperApplication.RtfLicense" />

    <Chain>
      <MsiPackage Compressed="yes"
                  SourceFile="$(var.Walterlv.Installer.Msi.TargetPath)"/>
    </Chain>
  </Bundle>
</Wix>
```


