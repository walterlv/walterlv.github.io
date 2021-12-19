---
title:  "让你的程序置顶到比系统界面都更上层，就像任务管理器/放大镜一样绝对置顶"
publishDate: 2015-03-31 16:47:00 +0800
date: 2020-04-25 11:50:18 +0800
tags: wpf
position: knowledge
coverImage: /static/posts/2020-04-25-11-48-26.png
permalink: /posts/run-desktop-application-above-windows-application.html
---

启动系统自带的放大镜程序，我们会发现即便进了 Windows 8 的开始屏幕，或打开了 Windows 10 的开始菜单和消息中心，它也依然显示在最顶层。如果你为任务管理器开启置顶效果，你会发现它也能显示到开始屏幕的顶层。这是怎么做到的呢？

---

顺便解释下“桌面应用程序”，指的是传统 Win32 应用程序。解释下“Windows 应用”，指的是开始屏幕/开始菜单/UAP/UWP 甚至是锁屏界面这些。

## 方法

做到这些，需要四个步骤，缺一不可：

### 第一步：修改 Manifest

前往你程序的 App.Manifest 文件，设置 `requestedExecutionLevel`。

```xml
<requestedExecutionLevel level="asInvoker" uiAccess="true" />
```

### 第二步：修改窗口属性

这两个属性是必须设置的，否则无法达到目的。

```csharp
ShowInTaskbar=true
TopMost=true
```

### 第三步：为程序签名

[参见此处 - 为程序签名](/windows/2015/03/31/sign-for-desktop-application.html)

### 第四步：将程序放到受信任的目录下

```
C:\program files
C:\program files x86
C:\Windows\system32
```

## 可能遇到的问题

### 从服务器返回了一个参照

A referral was returned from the server.

![从服务器返回了一个参照](/static/posts/2020-04-25-11-48-26.png)

感谢 [胡承](https://huchengv5.github.io/) 提供的错误和解决方法！

你可能会在按照以上步骤操作后，在执行程序时遇到这样的错误，解决方法是“以管理员权限启动此程序”。

---

**参考资料**

How to make Windows 8 desktop apps shown in Metro UI (like Task Manager)?  
[https://stackoverflow.com/questions/12873323/how-to-make-windows-8-desktop-apps-shown-in-metro-ui-like-task-manager](https://stackoverflow.com/questions/12873323/how-to-make-windows-8-desktop-apps-shown-in-metro-ui-like-task-manager)

Code Signing Notes  
[http://techsupt.winbatch.com/webcgi/webbatch.exe?techsupt/nftechsupt.web+WinBatch/Manifest+Manifest~Faqs.txt](http://techsupt.winbatch.com/webcgi/webbatch.exe?techsupt/nftechsupt.web+WinBatch/Manifest+Manifest~Faqs.txt
)

UIAccess in Manifest Files  
[https://social.msdn.microsoft.com/Forums/windowsdesktop/en-US/4d2e1358-af95-4f4f-b239-68ec7e2525a9/uiaccess-in-manifest-files](https://social.msdn.microsoft.com/Forums/windowsdesktop/en-US/4d2e1358-af95-4f4f-b239-68ec7e2525a9/uiaccess-in-manifest-files
)

Debug Applications with uiAccess Set to “True”  
[http://blogs.techsmith.com/inside-techsmith/devcorner-debug-uiaccess/](http://blogs.techsmith.com/inside-techsmith/devcorner-debug-uiaccess/
)

Debugging with uiAccess=true  
[https://social.msdn.microsoft.com/forums/windowsdesktop/en-us/7a42efab-5ce8-456f-8a58-dfedbc2cefcb/debugging-with-uiaccesstrue](https://social.msdn.microsoft.com/forums/windowsdesktop/en-us/7a42efab-5ce8-456f-8a58-dfedbc2cefcb/debugging-with-uiaccesstrue
)


