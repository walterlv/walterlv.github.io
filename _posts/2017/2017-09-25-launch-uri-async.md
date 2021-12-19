---
title: "UWP 中的 LaunchUriAsync，使用默认浏览器或其他应用打开链接"
publishDate: 2017-09-25 00:39:53 +0800
date: 2018-12-14 09:54:33 +0800
tags: uwp
permalink: /uwp/2017/09/25/launch-uri-async.html
keywords: uwp LaunchUriAsync windows 10
description: 在 UWP 中使用默认的应用或浏览器打开链接，当然也可以指定用哪个应用打开。
coverImage: /static/posts/2017-09-25-00-18-22.png
---

古老的 Win32 应用启动其他程序太过方便，以至于一部分开发者都已经不记得 Windows 能通过关联协议（参见 [桌面应用程序关联协议](/windows/2015/07/07/associate-with-file-or-protocol.html)）的方式通过统一资源定位符（URI）来启动应用程序了。

转到 UWP 后，使用 URI 启动应用似乎成为了最推荐的方式。于是一句 `LaunchUriAsync` 就能解决大多数问题。

---

## 常用的 Windows 10 内置协议

URI 协议|启动
-|-
http:|默认网页浏览器
mailto:|默认电子邮件
ms-settings:|设置
ms-store:|应用商店

于是，只要 URI 带这些协议头，就能够用表格中的那些应用打开相应的功能了。

如果想知道 `ms-settings` 里有哪些可用，请参见：[启动 Windows 设置应用 - UWP app developer](https://docs.microsoft.com/zh-cn/windows/uwp/launch-resume/launch-settings-app)；想知道 `ms-store` 可以如何帮助我们前往商店的具体页面，请参见：[启动 Windows 应用商店应用 - UWP app developer](https://docs.microsoft.com/zh-cn/windows/uwp/launch-resume/launch-store-app?wt.mc_id=MVP)。

## LaunchUriAsync

要想简单地在代码中使用，一句足以：

```csharp
await Launcher.LaunchUriAsync(new Uri(@"{{ site.url }}"));
```

如果你希望在调用成功或失败后执行一些操作，则可以多写一些：

```csharp
   var myblog = new Uri(@"{{ site.url }}/blog");
   var success = await Launcher.LaunchUriAsync(myblog);

   if (success)
   {
      // 如果你感兴趣，可以在成功启动后在这里执行一些操作。
   }
   else
   {
      // 如果你感兴趣，可以在这里处理启动失败的一些情况。
   }
}
```

然而，UWP 还提供了更多的选项：`LauncherOptions`。

## LauncherOptions

在写以上代码时不难发现，`LaunchUriAsync` 提供了重载传入 `LauncherOptions` 参数，这个参数似乎是指定启动时的一些选项。查看注释后，可以发现这些选项：

```csharp
/// <summary>获取或设置指示启动与文件或 URI 关联的应用程序时系统是否应显示文件或 URI 可能会不安全的警告的值。</summary>
/// <returns>如果应显示警告，则为 true；否则为 false。</returns>
public bool TreatAsUntrusted { get; set; }
/// <summary>获取或设置一个值，该值指示每当调用关联启动 API 时是否要显示**打开方式**对话框。</summary>
/// <returns>如果应始终显示**打开方式**对话框，则为 true；否则为 false。</returns>
public bool DisplayApplicationPicker { get; set; }
/// <summary>在启动默认应用程序时获取用户界面 (UI) 选项。</summary>
/// <returns>UI 选项。</returns>
public LauncherUIOptions UI { get; }
/// <summary>获取或设置表示没有处理文件类型或 URI 的应用程序时，用户应安装的应用程序在存储区中的包系列名称的值。</summary>
/// <returns>应用的程序包系列名称。</returns>
public string PreferredApplicationPackageFamilyName { get; set; }
/// <summary>获取或设置一个值，该值表示没有处理文件类型或 URI 的应用程序时，用户应安装的应用程序在存储区中的显示名称。</summary>
/// <returns>应用程序的显示名称。</returns>
public string PreferredApplicationDisplayName { get; set; }
/// <summary>获取或设置表示没有处理文件类型或 URI 的应用程序时，用户应转到的浏览器中的 URI 的值。</summary>
/// <returns>用户应转到的浏览器中的 URI。</returns>
public global::System.Uri FallbackUri { get; set; }
/// <summary>获取或设置与表示网络上文件的 URI 相关的内容类型。</summary>
/// <returns>URL 的内容类型。</returns>
public string ContentType { get; set; }
/// <summary>启动目标应用程序，并通过与目标应用程序平分空间或占用比目标应用程序更多或更少的空间，让当前运行的源应用程序保留在屏幕上。</summary>
/// <returns>Windows.UI.ViewManagement.ViewSizePreference 类型的值，指定应用程序所需的视图大小。</returns>
public ViewSizePreference DesiredRemainingView { get; set; }
/// <summary>启动文件或 URI 时应使用的目标包的包系列名称。 此属性是可选的。</summary>
/// <returns>启动文件或 URI 时应使用的目标包的包系列名称。 此属性是可选的。</returns>
public string TargetApplicationPackageFamilyName { get; set; }
/// <summary>让应用能访问与用于激活应用的文件相关的文件。</summary>
/// <returns>包含相关文件列表的查询。</returns>
public StorageFileQueryResult NeighboringFilesQuery { get; set; }
/// <summary>指示是否忽略可以处理 http(s) 方案（如浏览器）的处理程序。 相反，启动将回退到默认浏览器。</summary>
/// <returns>**true** 指示可以处理 http(s) 方案的应用程序将被忽略，而是在默认浏览器中打开该 URI；否则为 **false**。</returns>
public bool IgnoreAppUriHandlers { get; set; }
/// <summary>获取或设置是否将启动器的选取器限制为当前应用程序及其相关联的 URI 处理程序。</summary>
/// <returns>如果启动器应将选取器限制为当前应用程序及其相关联的 URI 处理程序，则为 true；否则为 false。</returns>
public bool LimitPickerToCurrentAppAndAppUriHandlers { get; set; }
```

比如其中 `TreatAsUntrusted` 表示标记此次打开是不受信任的。

如果打开程序自己内置的链接，通常置为 false，以便能直接打开。但有时程序需要处理用户输入的数据，这时就不一定真的是期望打开了。于是标记为不安全后，Windows 10 会为我们弹出一个提示框，告诉我们是否真的要切换应用。

![Did you mean to switch apps](/static/posts/2017-09-25-00-18-22.png)

截图中的 MarkdownMail 是我的一个开源项目，可以前往 [markdown-mail @ github](https://github.com/walterlv/markdown-mail) 多多支持。

我们还可以指定推荐用哪个应用打开（设置 `PreferredApplicationPackageFamilyName`），指定期望显示的窗口大小（设置 `DesiredRemainingView`，不过不是具体的大小，而是几种选项），指定只打开自己当前这款应用（设置 `LimitPickerToCurrentAppAndAppUriHandlers`）。具体查看注释是能够了解的。

**参考资料**
- [启动 URI 的默认应用 - UWP app developer](https://docs.microsoft.com/zh-cn/windows/uwp/launch-resume/launch-default-app?wt.mc_id=MVP)
- [启动 Windows 设置应用 - UWP app developer](https://docs.microsoft.com/zh-cn/windows/uwp/launch-resume/launch-settings-app?wt.mc_id=MVP)
- [启动 Windows 应用商店应用 - UWP app developer](https://docs.microsoft.com/zh-cn/windows/uwp/launch-resume/launch-store-app?wt.mc_id=MVP)

