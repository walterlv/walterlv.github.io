---
title: "通过 AppSwitch 禁用 WPF 内置的触摸让 WPF 程序可以处理 Windows 触摸消息"
date: 2019-08-01 20:56:16 +0800
tags: wpf windows dotnet csharp
position: knowledge
coverImage: /static/posts/2019-08-01-19-08-18.png
permalink: /post/wpf-disable-stylus-and-touch-support.html
---

WPF 框架自己实现了一套触摸机制，但同一窗口只能支持一套触摸机制，于是这会禁用系统的触摸消息（`WM_TOUCH`）。这能够很大程度提升 WPF 程序的触摸响应速度，但是很多时候又会产生一些 Bug。

如果你有需要，可以考虑禁用 WPF 的内置的实时触摸（RealTimeStylus）。本文介绍禁用方法，使用 AppSwitch，而不是网上广为流传的反射方法。

---

<div id="toc"></div>

## 如何设置 AppSwitch

在你的应用程序的 app.config 文件中加入 `Switch.System.Windows.Input.Stylus.DisableStylusAndTouchSupport=true` 开关，即可关闭 WPF 内置的实时触摸，而改用 Windows 触摸消息（`WM_TOUCH`）。

```xml
<configuration>
  <runtime>
    <AppContextSwitchOverrides value="Switch.System.Windows.Input.Stylus.DisableStylusAndTouchSupport=true" />
  </runtime>
</configuration>
```

如果你的解决方案中没有找到 app.config 文件，可以创建一个：

![新建文件](/static/posts/2019-08-01-19-08-18.png)

![应用程序配置文件](/static/posts/2019-08-01-19-08-50.png)

然后，把上面的代码拷贝进去即可。

## 反射禁用的方法

微软的官方文档也有提到使用放射禁用的方法，但一般不推荐这种调用内部 API 的方式，比较容易在 .NET 的版本更新中出现问题：

- [Disable the RealTimeStylus for WPF Applications - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/wpf/advanced/disable-the-realtimestylus-for-wpf-applications)
- [WPF 禁用实时触摸 - 林德熙](https://blog.lindexi.com/post/wpf-%E7%A6%81%E7%94%A8%E5%AE%9E%E6%97%B6%E8%A7%A6%E6%91%B8)

## 此方法可以解决的问题一览

### 拖拽窗口或者调整窗口大小时不能实时跟随的问题

- [Why all my WPF applications fail to drag outside of their windows since Windows 10 (1809/1903) such as resizing the window or do drag drop? - Stack Overflow](https://stackoverflow.com/questions/56354510/why-all-my-wpf-applications-fail-to-drag-outside-of-their-windows-since-windows)
- [All WPF applications fail to drag outside of their windows since Windows 10 (1809/1903) such as resizing the window or do drag drop · Issue #1323 · dotnet/wpf](https://github.com/dotnet/wpf/issues/1323)

![](https://i.stack.imgur.com/LZA4h.gif)

### 在部分设备上启动即崩溃

- [.NET 4.7 - WPF - Touch Enabled Devices Crash Applications · Issue #480 · microsoft/dotnet](https://github.com/Microsoft/dotnet/issues/480)
- [Visual Studio may freeze or crash when running on a pen-enabled machine - Developer Community](https://developercommunity.visualstudio.com/content/problem/55303/visual-studio-may-terminate-unexpectedly-when-runn.html)

### 在透明窗口上触摸会挡住 UWP 程序

- [c# - On Windows 10 (1803), all applications lost touch or stylus if a WPF transparent window covers on them - Stack Overflow](https://stackoverflow.com/questions/50382605/on-windows-10-1803-all-applications-lost-touch-or-stylus-if-a-wpf-transparent)

---

**参考资料**

- [Disable the RealTimeStylus for WPF Applications - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/wpf/advanced/disable-the-realtimestylus-for-wpf-applications)
- [WPF-Samples/runtimeconfig.template.json at master · microsoft/WPF-Samples](https://github.com/microsoft/WPF-Samples/blob/master/Compatibility/runtimeconfig.template.json)
- [All WPF applications fail to drag outside of their windows since Windows 10 (1809/1903) such as resizing the window or do drag drop · Issue #1323 · dotnet/wpf](https://github.com/dotnet/wpf/issues/1323)


