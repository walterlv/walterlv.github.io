---
layout: post
title: "试图在 Windows 10 上安装 .NET Framework 3.5 时提示错误 0x800F081F"
date: 2017-09-23 00:15:46 +0800
categories: dotnet
permalink: /dotnet/2017/09/23/install-dotnet35-on-windows-10.html
keywords: dotnet 0x800F081F windows 10
description: 如果在 Windows 10 上在线安装 .NET Framework 3.5 时提示错误 0x800F081F，可以考虑修复 Windows Update 服务后重试。
---

说到在 Windows 10 上安装 .NET Framework 3.5，想必已经没什么可以多说的了，直接去“启用或关闭 Windows 功能”界面给“.NET Framework 3.5”打个勾就好了。

但今天帮助一位朋友安装时却在上述步骤之后出现了错误：0x800F081F。

---

正常安装步骤：

![在 Windows 10 上安装 .NET Framework 3.5](/static/posts/2017-09-22-23-53-09.png)

错误：

![错误代码：0x800F081F](/static/posts/2017-09-22-23-55-50.png)

这不能忍啊！迅速在网上搜索错误码，然而得到的回答要么是换命令行，要么是重置系统。命令行的方案以前其实尝试过，需要一个本地的安装镜像，然而突然间哪里那么方便找一个安装镜像呢！重置系统损失太大还是算了。

虽然命令行我们不用，但还是贴出来参考：

```shell
DISM /Online /Enable-Feature /FeatureName:NetFx3 /All /LimitAccess /Source:E:\sources\sxs
```

其中，E 盘是系统镜像盘。命令不区分大小写。

然而，微软官方其实对此问题是有说明的，在 [.NET Framework 3.5 installation error: 0x800F0906, 0x800F081F, 0x800F0907](https://support.microsoft.com/en-us/help/2734782/net-framework-3-5-installation-error-0x800f0906--0x800f081f--0x800f09) 里。

> The source files could not be found.  
> Use the "Source" option to specify the location of the files that are required to restore the feature. For more information on specifying a source location, see http://go.microsoft.com/fwlink/?LinkId=243077.  
> The DISM log file can be found at C:\Windows\Logs\DISM\dism.log

也就是说，此错误吗意味着文件没有找到。然而我们选择的安装方式是在线安装，找不到文件意味着根本没有下载下来。再回过头来看看之前安装的最后一个步骤，文案是“从 Windows 更新下载文件”。莫非是 Windows 更新的锅？

虽说是我帮助我的朋友安装，但他非常聪明，根据此猜测直接从 Cortana 搜索“服务”进入到服务管理界面，将“Windows Update”服务的启动方式从禁用改为手动。于是再重复本文一开始的步骤，成功啦！

---

总结：
- 0x800F081F 错误代表用于安装的文件缺失
- 如果是在线安装，则需要修复 Windows Update 服务


#### 参考资料
- [How to instal .NET Framework 3.5 on Windows 10 - Microsoft Community](https://answers.microsoft.com/en-us/insider/forum/insider_wintp-insider_install/how-to-instal-net-framework-35-on-windows-10/450b3ba6-4d19-45ae-840e-78519f36d7a4)
- [.NET Framework 3.5 installation error: 0x800F0906, 0x800F081F, 0x800F0907](https://support.microsoft.com/en-us/help/2734782/net-framework-3-5-installation-error-0x800f0906--0x800f081f--0x800f09)
- [Net 3.5 framework, cannot install 0x800F081F. Solved - Windows 10 Forums](https://www.tenforums.com/software-apps/16594-net-3-5-framework-cannot-install-0x800f081f.html)
