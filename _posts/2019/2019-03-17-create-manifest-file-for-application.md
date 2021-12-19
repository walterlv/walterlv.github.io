---
title: "如何创建应用程序清单文件 App.Manifest，如何创建不带清单的应用程序"
date: 2019-03-17 17:34:18 +0800
tags: windows dotnet csharp wpf
position: starter
coverImage: /static/posts/2019-03-17-15-40-41.png
permalink: /post/create-manifest-file-for-application.html
---

如果你的程序对 Windows 运行权限有要求，那么需要设置应用程序清单。本文介绍如何添加应用程序清单，并解释其中各项权限设置的实际效果。

---

<div id="toc"></div>

## 嵌入带默认设置的清单

对于 WPF 和 Windows Forms 程序，如果你什么都不做，那么就已经嵌入了一个带有默认设置的清单。

下图可以在 Visual Studio 中的项目上右键属性插件。

![嵌入带默认设置的清单](/static/posts/2019-03-17-15-40-41.png)

## 新建一个自定义的清单文件

在项目上右键，添加，新建项。可以在新建模板中找到“应用程序清单文件”。确认后即添加了一个新的清单文件。这时，项目属性页中的清单也会自动设置为刚刚添加的清单文件。

![按照清单模板新建清单](/static/posts/2019-03-17-15-42-37.png)

默认的清单中，包含 UAC 清单选项、系统兼容性选项、DPI 感知级别选项和 Windows 公共控件和对话框的主题选项。

- 关于 UAC 清单选项，你可以阅读 [应用程序清单 Manifest 中各种 UAC 权限级别的含义和效果](/post/requested-execution-level-of-application-manifest) 了解更多。
- 关于 DPI 感知级别选项，你可以阅读 [Windows 下的高 DPI 应用开发（UWP / WPF / Windows Forms / Win32） - walterlv](/post/windows-high-dpi-development) 和 [支持 Windows 10 最新 PerMonitorV2 特性的 WPF 多屏高 DPI 应用开发 - walterlv](/post/windows-high-dpi-development-for-wpf) 了解更多。

```xml
<?xml version="1.0" encoding="utf-8"?>
<assembly manifestVersion="1.0" xmlns="urn:schemas-microsoft-com:asm.v1">
  <assemblyIdentity version="1.0.0.0" name="MyApplication.app"/>
  <trustInfo xmlns="urn:schemas-microsoft-com:asm.v2">
    <security>
      <requestedPrivileges xmlns="urn:schemas-microsoft-com:asm.v3">
        <!-- UAC 清单选项
             如果想要更改 Windows 用户帐户控制级别，请使用
             以下节点之一替换 requestedExecutionLevel 节点。n
        <requestedExecutionLevel  level="asInvoker" uiAccess="false" />
        <requestedExecutionLevel  level="requireAdministrator" uiAccess="false" />
        <requestedExecutionLevel  level="highestAvailable" uiAccess="false" />

            指定 requestedExecutionLevel 元素将禁用文件和注册表虚拟化。
            如果你的应用程序需要此虚拟化来实现向后兼容性，则删除此
            元素。
        -->
        <requestedExecutionLevel level="asInvoker" uiAccess="false" />
      </requestedPrivileges>
    </security>
  </trustInfo>

  <compatibility xmlns="urn:schemas-microsoft-com:compatibility.v1">
    <application>
      <!-- 设计此应用程序与其一起工作且已针对此应用程序进行测试的
           Windows 版本的列表。取消评论适当的元素，
           Windows 将自动选择最兼容的环境。 -->

      <!-- Windows Vista -->
      <!--<supportedOS Id="{e2011457-1546-43c5-a5fe-008deee3d3f0}" />-->

      <!-- Windows 7 -->
      <!--<supportedOS Id="{35138b9a-5d96-4fbd-8e2d-a2440225f93a}" />-->

      <!-- Windows 8 -->
      <!--<supportedOS Id="{4a2f28e3-53b9-4441-ba9c-d69d4a4a6e38}" />-->

      <!-- Windows 8.1 -->
      <!--<supportedOS Id="{1f676c76-80e1-4239-95bb-83d0f6d0da78}" />-->

      <!-- Windows 10 -->
      <!--<supportedOS Id="{8e0f7a12-bfb3-4fe8-b9a5-48fd50a15a9a}" />-->

    </application>
  </compatibility>

  <!-- 指示该应用程序可以感知 DPI 且 Windows 在 DPI 较高时将不会对其进行
       自动缩放。Windows Presentation Foundation (WPF)应用程序自动感知 DPI，无需
       选择加入。选择加入此设置的 Windows 窗体应用程序(目标设定为 .NET Framework 4.6 )还应
       在其 app.config 中将 "EnableWindowsFormsHighDpiAutoResizing" 设置设置为 "true"。-->
  <!--
  <application xmlns="urn:schemas-microsoft-com:asm.v3">
    <windowsSettings>
      <dpiAware xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">true</dpiAware>
    </windowsSettings>
  </application>
  -->

  <!-- 启用 Windows 公共控件和对话框的主题(Windows XP 和更高版本) -->
  <!--
  <dependency>
    <dependentAssembly>
      <assemblyIdentity
          type="win32"
          name="Microsoft.Windows.Common-Controls"
          version="6.0.0.0"
          processorArchitecture="*"
          publicKeyToken="6595b64144ccf1df"
          language="*"
        />
    </dependentAssembly>
  </dependency>
  -->

</assembly>
```

## 创建不带清单的应用程序

你也可以创建一个不带应用程序清单的应用程序。方法是在属性页中将清单设置为“创建不带清单的应用程序”。

![创建不带清单的应用程序](/static/posts/2019-03-17-15-48-41.png)


