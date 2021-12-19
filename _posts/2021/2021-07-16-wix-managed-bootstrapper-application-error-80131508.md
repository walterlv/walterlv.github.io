---
title: "用 WiX Burn 制作托管安装包：出现 0x80131508 错误"
date: 2021-07-16 14:24:33 +0800
tags: dotnet msi wix
position: problem
---

使用 WiX 的 Burn 引擎制作自定义托管引导程序的 exe 安装包时，双击生成的安装包没有反应。如果查看日志可以发现有 `0x80131508` 错误。本文介绍其调查和解决方法。

---

<div id="toc"></div>

## 现象

双击制作的自定义引导程序的 exe 安装包没有反应，通过[查看 Burn 引擎的输出日志](https://blog.walterlv.com/post/how-to-view-wix-burn-installer-logs.html)可以发现如下关键的错误码：

```plaintext
...
[BCD8:B4DC][2021-07-16T11:47:32]i000: Loading managed bootstrapper application.
[BCD8:B4DC][2021-07-16T11:47:32]e000: Error 0x80131508: Failed to create the managed bootstrapper application.
[BCD8:B4DC][2021-07-16T11:47:32]e000: Error 0x80131508: Failed to create UX.
[BCD8:B4DC][2021-07-16T11:47:32]e000: Error 0x80131508: Failed to load UX.
[BCD8:B4DC][2021-07-16T11:47:32]e000: Error 0x80131508: Failed while running 
...
[BCD8:B4DC][2021-07-16T11:47:32]e000: Error 0x80131508: Failed to run per-user mode.
[BCD8:B4DC][2021-07-16T11:47:32]i007: Exit code: 0x80131508, restarting: No
```

## 调查

通过[查询 HRESULT 错误码](https://blog.walterlv.com/post/hresult-in-windows.html) `0x80131508` 可以得知它代表的意思是“INDEXOUTOFRANGE”。啊这……说明是 Burn 引擎出现了内部因为某些原因出现了错误，并且没有正确把错误原因标记出来。

然而对我们简单的托管安装包界面来说，更可能是我们自己的某些配置或代码不正确，导致 Burn 引擎内部代码炸掉的。

## 解决

这样的错误几乎不具有可调试性。因此，我直接将我偶然发现的原因和解决办法贴出来。

参考[这篇入门教程](https://blog.walterlv.com/post/getting-started-with-wix-toolset-create-a-wpf-installer-ui)中的代码，如果 AssemblyInfo.cs 文件中缺少标记 `BootstrapperApplication` 类型的特性，那么就会出现此错误。

```diff
...
++  using Microsoft.Tools.WindowsInstallerXml.Bootstrapper;

++  using Walterlv.InstallerUI;

++  [assembly: BootstrapperApplication(typeof(Program))]
...
```

然而呀，官方在教大家写托管引导程序的时候，翻遍了整个文档都没有提醒过要写这个特性！所以特别容易被官方文档带偏，这里记录此文章避免大家踩坑。
