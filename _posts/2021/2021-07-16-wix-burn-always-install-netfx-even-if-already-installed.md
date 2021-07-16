---
title: "用 WiX 制作安装包：设置的 .NET Framework 前置会始终安装，即使目标电脑已经自带或装好"
date: 2021-07-16 12:08:39 +0800
categories: dotnet msi wix
position: problem
---

使用 WiX 的 Burn 引擎制作自定义托管引导程序的 exe 安装包时，你可能会遇到这种情况：明明目标电脑上已经装好了 .NET Framework，但无论如何就是会提示安装，始终不启动自定义的安装界面。

---

<div id="toc"></div>

## 现象

即使是在开发机上（.NET Framework 已经装好），双击制作的 exe 安装包也依然会提示安装 .NET Framework：

![提示安装 .NET Framework](/static/posts/2021-07-16-11-04-09.png)

如果强行安装，装完也依然不会启动自定义的引导程序。

> **小提示**
>
> 这个错误其实非常有误导性！
>
> 看起来不断提示要安装 .NET Framework，会让人误以为是 .NET Framework 的安装判断条件写出了问题，然后朝着 Product.wxs 中的 `Condition`、Bundle.wxs 中的 `InstallCondition`、`DetectCondition` 去调查。然而这是捆绑包中的判断，与 Product.wxs 无关；我们默认用的是 WixNetFxExtension.dll 中的判断，这很靠谱，也不会出问题，所以也与 `InstallCondition` 和`DetectCondition` 无关。
>
> 正确的调查方法是去看错误日志，看真实的错误原因是什么。

当停留在这个“安装 .NET Framework”的界面时，[查看 Burn 引擎的输出日志](https://blog.walterlv.com/post/how-to-view-wix-burn-installer-logs.html)：

```plaintext
[14A4:9F04][2021-07-16T11:13:57]i001: Burn v3.11.2.4516, Windows v10.0 (Build 22000: Service Pack 0), path: C:\Users\lvyi\AppData\Local\Temp\{4310ECA0-6A28-4BE6-922D-570EAA81C0CD}\.cr\Walterlv.Demo.MainApp.exe
[14A4:9F04][2021-07-16T11:13:57]i009: Command Line: '-burn.clean.room=D:\WIP\Desktop\Walterlv.WixInstallerDemo\Walterlv.Installer.Exe\bin\Debug\Walterlv.Demo.MainApp.exe -burn.filehandle.attached=464 -burn.filehandle.self=460 -l debug.log'
[14A4:9F04][2021-07-16T11:13:57]i000: Setting string variable 'WixBundleOriginalSource' to value 'D:\WIP\Desktop\Walterlv.WixInstallerDemo\Walterlv.Installer.Exe\bin\Debug\Walterlv.Demo.MainApp.exe'
[14A4:9F04][2021-07-16T11:13:57]i000: Setting string variable 'WixBundleOriginalSourceFolder' to value 'D:\WIP\Desktop\Walterlv.WixInstallerDemo\Walterlv.Installer.Exe\bin\Debug\'
[14A4:9F04][2021-07-16T11:13:57]i000: Setting string variable 'WixBundleLog' to value 'D:\WIP\Desktop\Walterlv.WixInstallerDemo\Walterlv.Installer.Exe\bin\Debug\debug.log'
[14A4:9F04][2021-07-16T11:13:57]i000: Setting string variable 'WixBundleName' to value 'Walterlv.Demo.MainApp'
[14A4:9F04][2021-07-16T11:13:57]i000: Setting string variable 'WixBundleManufacturer' to value 'walterlv'
[14A4:9F04][2021-07-16T11:13:57]i000: Loading prerequisite bootstrapper application because managed host could not be loaded, error: 0x80070490.
[14A4:A444][2021-07-16T11:13:58]i000: Setting numeric variable 'WixStdBALanguageId' to value 2052
[14A4:A444][2021-07-16T11:13:58]i000: Setting version variable 'WixBundleFileVersion' to value '1.0.0.0'
[14A4:9F04][2021-07-16T11:13:58]i100: Detect begin, 2 packages
[14A4:9F04][2021-07-16T11:13:58]i000: Setting string variable 'NETFRAMEWORK45' to value '528449'
[14A4:9F04][2021-07-16T11:13:58]i052: Condition 'NETFRAMEWORK45 >= 394802' evaluates to true.
[14A4:9F04][2021-07-16T11:13:58]i101: Detected package: NetFx462Web, state: Present, cached: None
[14A4:9F04][2021-07-16T11:13:58]i101: Detected package: Walterlv.Demo.MainApp.msi, state: Absent, cached: None
[14A4:9F04][2021-07-16T11:13:58]i199: Detect complete, result: 0x0
```

## 调查

可以注意到唯一的一行错误：

```plaintext
Loading prerequisite bootstrapper application because managed host could not be loaded, error: 0x80070490.
```

加载安装前置的引导程序，因为托管宿主无法被加载，错误代码 `0x80070490`。所以导致弹出 .NET Framework 安装界面的原因是**引导程序无法加载我们的自定义界面，误认为前置没有装好，所以弹出了前置安装界面**。

[查询一下错误码](https://blog.walterlv.com/post/hresult-in-windows.html)：

```powershell
❯ err 80070490
# No results found for hex 0x4c5c75a / decimal 80070490
# for hex 0x80070490 / decimal -2147023728
  PEER_E_NOT_FOUND                                               p2p.h
  E_PROP_ID_UNSUPPORTED                                          vfwmsgs.h
# The specified property ID is not supported for the
# specified property set.%0
  WER_E_NOT_FOUND                                                werapi.h
  DRM_E_NOT_FOUND                                                windowsplayready.h
# as an HRESULT: Severity: FAILURE (1), FACILITY_WIN32 (0x7), Code 0x490
# for hex 0x490 / decimal 1168
  ERROR_NOT_FOUND                                                winerror.h
# Element not found.
# 5 matches found for "80070490"
```

“Not Found”，并不能给我们带来什么有价值的信息。

虽然错误码无法给我们带来有价值的信息，但那句提示至少可以让我们知道问题出在“无法加载托管宿主”这个范围。

这可能是两个范围：

1. 我们自定义的 `BootstrapperApplication` 的第一行代码 `Run` 之**前**
1. 我们自定义的 `BootstrapperApplication` 的第一行代码 `Run` 之**后**

这很好区分，在 `Run` 的第一句加上一个 "Debugger.Launch()"，看看再启动安装包的时候是否会弹出调试器选择框即可。

```diff
    protected override void Run()
    {
++      Debugger.Launch();
    }
```

我们就这样试一下，可以发现不会弹出调试器选择框。所以以上的两个范围只能是范围 1。

> **小提示**
>
> 实际上按目前的日志输出，已经足以确定是范围 1 了，不过这需要一些先验知识，即托管引导程序能捕获 `Run` 方法中的所有异常。也就是说无论你的代码怎么写，托管引导程序都能把你引导起来，而不会出现此日志中输出的那样“无法加载托管宿主”。前面这个调查模拟没有此先验知识的情况，你可以从中学习到更多的 Burn MBA（Managed Bootstrapper Application）调试技巧。

有哪些东西会在 `Run` 之前？

1. BootstrapperCore.config 文件的配置
2. 程序集元数据

对于 1，如果你能看出来 BootstrapperCore.config 配置出现了哪些问题更好，看不出来的话可以把现成的例子拿出来对比（例如[我在入门教程里写的 DEMO 程序](https://github.com/walterlv/Walterlv.WixInstallerDemo/tree/1b6600bb694c593894fc20cea76154b61ccf0c1f)，记得要改项目名）。确保里面的 `assemblyName` 和 `supportedRuntime` 属性赋值正确（可参见[我入门教程中写的配置和可用值说明](/post/getting-started-with-wix-toolset-create-a-wpf-installer-ui)）。

对于 2，通过实验可以得知程序集元数据出现错误时的错误码不是这个（参见：[`0x80131508` 错误](/post/wix-managed-bootstrapper-application-error-80131508)）。

于是我们也能得出问题出在 BootstrapperCore.config 配置里。

## 解决

可按下面的配置作为参考，将你的配置改到正确（参见我的 WiX 入门教程）：

```xml
<?xml version="1.0" encoding="utf-8" ?>
<configuration>
  <configSections>
    <sectionGroup name="wix.bootstrapper" type="Microsoft.Tools.WindowsInstallerXml.Bootstrapper.BootstrapperSectionGroup, BootstrapperCore">
      <section name="host" type="Microsoft.Tools.WindowsInstallerXml.Bootstrapper.HostSection, BootstrapperCore" />
    </sectionGroup>
  </configSections>
  <wix.bootstrapper>
    <host assemblyName="Walterlv.InstallerUI">
      <supportedFramework version="v4\Full" />
    </host>
  </wix.bootstrapper>
</configuration>
```

另外多说一句，官方文档对 BootstrapperCore.config 的描述非常具有误导性：

- [How To: Install the .NET Framework Using Burn](https://wixtoolset.org/documentation/manual/v3/howtos/redistributables_and_install_checks/install_dotnet.html)
- [奇葩史的奇葩事 - [译]：WiX Toolset使用技巧——使用Burn引擎安装.NET Framework](https://www.shisujie.com/blog/Install-the-dotNet-Framework-Using-Burn)

官方文档示例的注释中要大家改 `host/@assemblyName`，但实际上按官方文档的改法改好了就会出现本文所述的错误。

---

**参考资料**

- [installation - Wix ExePackage always installs regardless of DetectCondition, InstallCondition, on install, or uninstall - Stack Overflow](https://stackoverflow.com/q/46322994/6233938)
