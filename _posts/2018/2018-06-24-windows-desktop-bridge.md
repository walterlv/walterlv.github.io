---
title: "签署 Centennial Program Addendum，使用 Desktop Bridge 将 Win32 应用转制成 UWP"
publishDate: 2018-06-24 14:39:10 +0800
date: 2019-01-08 18:01:14 +0800
tags: dotnet
---

能上架 Windows 应用商店的并不一定必须是 UWP 应用程序或者 PWA 程序，也可以是普通的 Win32 应用程序。典型的上架应用商店的应用有微信、Telegram、Snipaste 等。使用 Desktop Bridge，我们即可以为我们的普通 Win32 应用程序做一个 UWP 的包来。

---

<div id="toc"></div>

## 商店中那些转制的应用

如果你并没有感受到 Win32 转制的商店应用和原生的 UWP 或 PWA 应用有什么不同，可以尝试体验下面的三款转制应用。

- **微信 For Windows** <https://www.microsoft.com/store/productId/9NBLGGH4SLX7>
- **Telegram Desktop** <https://www.microsoft.com/store/productId/9NZTWSQNTD0S>
- **Snipaste** <https://www.microsoft.com/store/productId/9P1WXPKB68KX>

## 了解 Desktop Bridge

Desktop Bridge，可能还可以叫做“桌面桥”，它存在的目的便是将已有的 WPF 程序、Windows Forms 程序和其他 Win32 应用转换成应用商店应用。而桌面桥提供了一种与 UWP 一致的 Windows 应用包，使用这种 Windows 应用包，普通的 Win32 应用也能访问 UWP 的 API。

需要注意的是，Desktop Bridge 要求的 Windows 系统最低版本为 1607。也就是说，如果要选择 SDK 的版本，需要选择 10.0.14393 或以上版本。

当然，并不是所有的 Win32 应用程序都支持直接转制到 UWP，如果应用会动态加载不在安装包中的 dll 或者会试图修改系统文件和配置，那么必须去掉这些代码才能完成转制。如果希望了解更多不支持的类型，建议阅读官方文档：[Prepare to package an app (Desktop Bridge) - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/porting/desktop-to-uwp-prepare?wt.mc_id=MVP)。

<!-- ### 转制前的准备

我们需要提前下载好转制工具和 SDK：

- [Desktop App Converter](https://aka.ms/converter)
- [Desktop App Converter 基础系统镜像](https://aka.ms/converterimages)

Desktop App Converter 会从应用商店安装，安装好后可以在开始菜单中找到。不用着急去运行它，因为我们稍后会通过 Powershell 并以管理员权限运行。

![](/static/posts/2018-06-23-19-43-16.png)

Desktop App Converter 基础系统镜像下载完后随便放到某个地方，稍后我们能够通过命令行找到即可。

待一切下载完毕，我们以管理员权限运行 PowerShell，然后开始运行命令：

```powershell
> Set-ExecutionPolicy bypass
```

如果中途提示脚本的安全性问题，选择 `[Y] Yes` 或 `[A] Yes to All` 都是可以的。

紧接着运行 DesktopAppConverter.exe 并将 `.\BaseImage-1XXXX.wim` 部分改成前面下载的基础系统镜像的路径。

```powershell
> DesktopAppConverter.exe -Setup -BaseImage .\BaseImage-1XXXX.wim -Verbose
```

如果提示需要重启计算机，那么重启即可。 -->

## 在 Visual Studio 中创建 Windows 应用打包工程

使用 Visual Studio 打开原来的 Win32 程序的解决方案，在解决方案中新建一个 Windows 应用程序包项目（Windows Application Packaging Project）。我们将使用这个项目为转制应用打包。

![Windows Application Packaging Project](/static/posts/2018-06-23-19-58-42.png)

在选择 SDK 时，目标版本我选择了 17134，但注意最低版本必须是 14393 或以上。

![选择 SDK 版本](/static/posts/2018-06-24-10-04-34.png)

稍等片刻，我们便能看到 Visual Studio 已经为我们准备好的应用程序包工程。

![Whitman.Package 工程](/static/posts/2018-06-24-10-07-51.png)

在 Applications（应用程序）一栏我们右击选择添加引用。

![添加引用](/static/posts/2018-06-23-20-43-51.png)

![选择我们此前的程序](/static/posts/2018-06-24-10-09-49.png)

随后展开 Applications（应用程序）一栏，将我们的 Win32 程序右击设为入口点。

![设置入口点](/static/posts/2018-06-24-10-10-40.png)

编译刚刚设置好的打包项目。如果之前的项目能够编译通过，那么这个新的打包项目理论上也是能编译通过的。

![调试部署的 Whitman](/static/posts/2018-06-24-10-37-43.png)

将这个新项目设置为启动项目，启动它即可进行正常的调试，能够正常断点、单步等等。

## 修改包清单并发布应用

### 各种元数据

另外，转制的应用和原生的 UWP 应用一样，发布之前也需要为应用设计图标，设置应用显示名称、包名称、关联应用商店。

![](/static/posts/2018-06-24-13-42-36.png)

不得不说，为商店应用设计图标是一件非常繁杂的工作，不过，最终的效果确实非常喜人的。

![](/static/posts/2018-06-24-13-41-05.png)

需要注意，在 <https://dev.windows.com> 上发布应用时，由于我们是转制的应用，所以 runFullTrust 是必选项。如果你在提交应用时遇到了以下提示框，微软的官方文档提示无需写明理由。

> This capability is also required for any desktop application that is delivered as an appx package (as with the Desktop Bridge), and it will automatically appear in your manifest when packaging these apps using the Desktop App Converter (DAC) or Visual Studio. You won’t need to request approval to use this capability if you already received permission using our form.

![](/static/posts/2018-06-24-14-36-50.png)

建议在给审核人员的提示中，写明我们是转制应用，以引起审核人员的注意。

![](/static/posts/2018-08-04-07-04-03.png)

### 通过认证

如果没有接受 Centennial Program Addendum，那么提交是不被允许的，并且在上传 appxupload 的时候会有警告开始提示了：

> Package acceptance validation warning: You must contact <partnerops@microsoft.com> and get approval before you can submit this app.

当然，你可以忽略这样的警告继续提交，但那样的话最终认证会失败，并提示：

> **Notes To Developer**
> 
> Your developer account has not been approved to submit apps converted with the Desktop Bridge as you have not yet accepted the Centennial Program Addendum. Please resubmit your request for approval.

如果无视警告，那么下次提交提示就会变成错误而不是警告了：

> Package acceptance validation error: You need to accept the [Centennial Program Addendum](https://go.microsoft.com/fwlink/?linkid=873135) before you can submit this app.

![Centennial Program Addendum](/static/posts/2018-07-12-16-26-57.png)  
▲ You need to accept the Centennial Program Addendum before you can submit this app.

提示要求我们必须同意 Centennial Program Addendum 协议，然而我们在 <https://partner.microsoft.com/en-us/dashboard/windows/overview> 的设置中点进去 Agreements 是找不到这项协议的。

![Agreements](/static/posts/2018-08-04-06-59-21.png)

![已签署协议](/static/posts/2018-08-04-07-01-01.png)

**以下划重点**！！！

你需要先提交应用，并时常关注 <https://partner.microsoft.com/en-us/dashboard/account/agreements> 中是否会新增一项协议提示，就是下图这个：

![Centennial Program Addendum 协议](/static/posts/2018-08-04-06-58-13.png)

当出现时，点击接受即可。**这项协议在微软商店发给你的三天之内才会出现，超过三天还没有同意，这项协议就会自动移除**。在我的实际提交中，等待邮件通知之时，三天基本上都过完了，所以稍微不及时收邮件，这项协议就点不开了，就只能看到下面这张图片感叹一声 —— 又要重来！

![Page Not Found](/static/posts/2018-07-13-08-32-31.png)

在同意了协议之后，你的协议列表中就会额外出现 Centennial Program Addendum 协议了。以后你可以继续提交转制应用。

![签署的开发者协议](/static/posts/2018-08-04-07-08-31.png)

---

**参考资料**

- [Desktop Bridge - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/porting/desktop-to-uwp-root?wt.mc_id=MVP)
- [App capability declarations - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/packaging/app-capability-declarations?wt.mc_id=MVP)
- [“Package acceptance validation error” when you submit a UWP + Desktop Bridge app on the Store – App Consult Team](https://blogs.msdn.microsoft.com/appconsult/2018/02/20/package-acceptance-validation-error-when-you-submit-a-uwp-desktop-bridge-app-on-the-store/)
- [Preparing a Desktop Bridge application for the Store submission – App Consult Team](https://blogs.msdn.microsoft.com/appconsult/2017/09/25/preparing-a-desktop-bridge-application-for-the-store-submission/)
- [Publish your packaged desktop app to a Windows store or sideload it onto one or more devices. - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/porting/desktop-to-uwp-distribute?wt.mc_id=MVP)
