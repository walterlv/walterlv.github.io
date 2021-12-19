---
title: "如何查看用 WiX 制作的安装包的日志"
date: 2021-07-15 20:18:52 +0800
tags: dotnet msi wix
position: starter
permalink: /posts/how-to-view-wix-burn-installer-logs.html
---

如果你使用 WiX 制作安装包，并且遇到了问题，一定需要一个趁手的调试方案。本文介绍如何查看 WiX 制作的安装包的日志。

---

WiX 使用 Burn 引擎来制作 exe 捆绑包，默认情况下 Burn 引擎使用自带的安装界面来执行安装。Burn 引擎提供了自定义引导程序的功能，于是你可以利用 Burn 引擎做出自己的 UI 来。比如 [用 WPF 来制作安装包界面](https://blog.walterlv.com/post/getting-started-with-wix-toolset-create-a-wpf-installer-ui)。

因此，我们有通用的方法来查看安装日志，只需要在启动安装程序时传入参数：

```powershell
> .\Walterlv.Demo.MainApp.exe -l "debug.log"
```

其中，`Walterlv.Demo.MainApp.exe` 是我在 WiX 入门教程系列中使用的安装包名。`-l "debug.log"` 表示在当前目录下使用“debug.log”文件记录日志。

以下是一个成功运行的自定义捆绑包的日志：

```plaintext
[476C:2F20][2021-07-15T19:35:43]i001: Burn v3.11.2.4516, Windows v10.0 (Build 22000: Service Pack 0), path: C:\Users\lvyi\AppData\Local\Temp\{AC43FA57-2BC7-45FA-8A6C-B8ADABB376C7}\.cr\Walterlv.Demo.MainApp.exe
[476C:2F20][2021-07-15T19:35:44]i009: Command Line: '-burn.clean.room=D:\WIP\Desktop\Walterlv.WixInstallerDemo\Walterlv.Installer.Exe\bin\Debug\Walterlv.Demo.MainApp.exe -burn.filehandle.attached=684 -burn.filehandle.self=692 -l debug.log'
[476C:2F20][2021-07-15T19:35:44]i000: Setting string variable 'WixBundleOriginalSource' to value 'D:\WIP\Desktop\Walterlv.WixInstallerDemo\Walterlv.Installer.Exe\bin\Debug\Walterlv.Demo.MainApp.exe'
[476C:2F20][2021-07-15T19:35:44]i000: Setting string variable 'WixBundleOriginalSourceFolder' to value 'D:\WIP\Desktop\Walterlv.WixInstallerDemo\Walterlv.Installer.Exe\bin\Debug\'
[476C:2F20][2021-07-15T19:35:44]i000: Setting string variable 'WixBundleLog' to value 'D:\WIP\Desktop\Walterlv.WixInstallerDemo\Walterlv.Installer.Exe\bin\Debug\debug.log'
[476C:2F20][2021-07-15T19:35:44]i000: Setting string variable 'WixBundleName' to value 'Walterlv.Demo.MainApp'
[476C:2F20][2021-07-15T19:35:44]i000: Setting string variable 'WixBundleManufacturer' to value 'walterlv'
[476C:2F20][2021-07-15T19:35:44]i000: Loading managed bootstrapper application.
[476C:2F20][2021-07-15T19:35:44]i000: Creating BA thread to run asynchronously.
[476C:A250][2021-07-15T19:35:44]i000: Running the Walterlv.InstallerUI.
[476C:A250][2021-07-15T19:35:59]i000: Exiting the Walterlv.InstallerUI.
[476C:A250][2021-07-15T19:35:59]i000: The Walterlv.InstallerUI has exited.
[476C:2F20][2021-07-15T19:35:59]i500: Shutting down, exit code: 0x0
[476C:2F20][2021-07-15T19:35:59]i410: Variable: WixBundleAction = 5
[476C:2F20][2021-07-15T19:35:59]i410: Variable: WixBundleElevated = 0
[476C:2F20][2021-07-15T19:35:59]i410: Variable: WixBundleLog = D:\WIP\Desktop\Walterlv.WixInstallerDemo\Walterlv.Installer.Exe\bin\Debug\debug.log
[476C:2F20][2021-07-15T19:35:59]i410: Variable: WixBundleManufacturer = walterlv
[476C:2F20][2021-07-15T19:35:59]i410: Variable: WixBundleName = Walterlv.Demo.MainApp
[476C:2F20][2021-07-15T19:35:59]i410: Variable: WixBundleOriginalSource = D:\WIP\Desktop\Walterlv.WixInstallerDemo\Walterlv.Installer.Exe\bin\Debug\Walterlv.Demo.MainApp.exe
[476C:2F20][2021-07-15T19:35:59]i410: Variable: WixBundleOriginalSourceFolder = D:\WIP\Desktop\Walterlv.WixInstallerDemo\Walterlv.Installer.Exe\bin\Debug\
[476C:2F20][2021-07-15T19:35:59]i410: Variable: WixBundleProviderKey = {87942d31-3870-42ca-8100-4e381772c7d6}
[476C:2F20][2021-07-15T19:35:59]i410: Variable: WixBundleSourceProcessFolder = D:\WIP\Desktop\Walterlv.WixInstallerDemo\Walterlv.Installer.Exe\bin\Debug\
[476C:2F20][2021-07-15T19:35:59]i410: Variable: WixBundleSourceProcessPath = D:\WIP\Desktop\Walterlv.WixInstallerDemo\Walterlv.Installer.Exe\bin\Debug\Walterlv.Demo.MainApp.exe
[476C:2F20][2021-07-15T19:35:59]i410: Variable: WixBundleTag = 
[476C:2F20][2021-07-15T19:35:59]i410: Variable: WixBundleUILevel = 4
[476C:2F20][2021-07-15T19:35:59]i410: Variable: WixBundleVersion = 1.0.0.0
[476C:2F20][2021-07-15T19:35:59]i007: Exit code: 0x0, restarting: No
```

