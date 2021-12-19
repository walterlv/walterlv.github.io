---
layout: post
title:  "Windows DPI Awareness for WPF"
date:   2014-09-20 16:56:00 +0800
tags: windows
permalink: /windows/2014/09/20/windows-dpi-awareness-for-wpf.html
---

对于 WPF 程序，要控制程序的 DPI 感知程度，可在 App.manifest 中添加如下代码。

---

本文知识已经陈旧，你可以阅读这两篇文章来了解更新的 Windows DPI 应用知识：

- [Windows 下的高 DPI 应用开发（UWP / WPF / Windows Forms / Win32） - walterlv](/post/windows-high-dpi-development)
- [支持 Windows 10 最新 PerMonitorV2 特性的 WPF 高 DPI 应用开发 - walterlv](/post/windows-high-dpi-development-for-wpf)

---

原文内容：

```xml
 <asmv3:application xmlns:asmv3="urn:schemas-microsoft-com:asm.v3">
    <asmv3:windowsSettings xmlns="http://schemas.microsoft.com/SMI/2005/WindowsSettings">
      <!-- 此应用程序将使用以下 DPI 感知级别。（默认情况下是系统 DPI 感知级别。）-->
      
      <!-- 应用程序不对 DPI 感知，将由 DWM （Desktop Window Manager）进行 DPI 缩放控制。 -->
      <!--<dpiAware>False</dpiAware>-->

      <!-- 应用程序具有系统级别的 DPI 感知能力。 -->
      <!--<dpiAware>True</dpiAware>-->

      <!-- 应用程序对每个显示器的 DPI 都具备感知能力。 -->
      <dpiAware>True/PM</dpiAware>
    </asmv3:windowsSettings>
  </asmv3:application>
```