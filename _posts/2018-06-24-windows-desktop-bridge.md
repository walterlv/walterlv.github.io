---
title: "使用 Desktop App Converter (Desktop Bridge) 将 Win32 程序转制成 UWP"
date: 2018-06-24 09:48:01 +0800
categories: dotnet
published: false
---

能上架 Windows 应用商店的并不一定必须是 UWP 应用程序或者 PWA 程序，也可以是普通的 Win32 应用程序。典型的上架应用商店的应用有微信、Telegram、Snipaste 等。使用 Desktop Bridge，我们即可以为我们的普通 Win32 应用程序做一个 UWP 的包来。

---

<div id="toc"></div>

### 商店中那些转制的应用

如果你并没有感受到 Win32 转制的商店应用和原生的 UWP 或 PWA 应用有什么不同，可以尝试体验下面的三款转制应用。

- **微信 For Windows** <https://www.microsoft.com/store/productId/9NBLGGH4SLX7>
- **Telegram Desktop** <https://www.microsoft.com/store/productId/9NZTWSQNTD0S>
- **Snipaste** <https://www.microsoft.com/store/productId/9P1WXPKB68KX>

### Desktop Bridge

Desktop Bridge，可能还可以叫做“桌面桥”，它存在的目的便是将已有的 WPF 程序、Windows Forms 程序和其他 Win32 应用转换成应用商店应用。而桌面桥提供了一种与 UWP 一致的 Windows 应用包，使用这种 Windows 应用包，普通的 Win32 应用也能访问 UWP 的 API。

需要注意的是，Desktop Bridge 要求的 Windows 系统最低版本为 1607。也就是说，如果要选择 SDK 的版本，需要选择 10.0.14393 或以上版本。

当然，并不是所有的 Win32 应用程序都支持直接转制到 UWP，如果应用会动态加载不在安装包中的 dll 或者会试图修改系统文件和配置，那么必须去掉这些代码才能完成转制。如果希望了解更多不支持的类型，建议阅读官方文档：[Prepare to package an app (Desktop Bridge) - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/porting/desktop-to-uwp-prepare)。

### 转制前的准备

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

如果提示需要重启计算机，那么重启即可。

### 在 Visual Studio 中创建 Windows 应用打包工程

使用 Visual Studio 打开原来的 Win32 程序的解决方案，在解决方案中新建一个 Windows 应用程序包项目（Windows Application Packaging Project）。我们将使用这个项目为转制应用打包。

![Windows Application Packaging Project](/static/posts/2018-06-23-19-58-42.png)

在选择 SDK 时，目标版本我选择了 17134，但注意最低版本必须是 14393 或以上。

![选择 SDK 版本](/static/posts/2018-06-23-20-41-37.png)



![](/static/posts/2018-06-23-20-43-51.png)

---

#### 参考资料

- [Desktop Bridge - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/windows/uwp/porting/desktop-to-uwp-root)
