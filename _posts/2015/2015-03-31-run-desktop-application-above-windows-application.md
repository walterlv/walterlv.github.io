---
layout: post
title:  "让 Windows 桌面程序运行在 Windows 应用上面"
date:   2015-03-31 16:47:00 +0800
categories: wpf
permalink: /wpf/2015/03/31/run-desktop-application-above-windows-application.html
---

启动系统自带的放大镜程序，我们会发现即便进了 Windows 8 或 Windows 10 的开始屏幕，它也依然显示在最顶层，而其他程序早已不见踪影。如果你为任务管理器开启置顶效果，你会发现它也能显示到开始屏幕的顶层。这是怎么做到的呢？

---

顺便解释下“桌面应用程序”，指的是传统 Win32 应用程序。解释下“Windows 应用”，指的是开始屏幕/开始菜单/UAP/UWP 甚至是锁屏界面这些。

做到这些，需要四个步骤，缺一不可：

### 修改 Manifest
```xml
<requestedExecutionLevel level="asInvoker" uiAccess="true" />
```

### 修改窗口属性
```csharp
ShowInTaskbar=true
TopMost=true
```

### 为程序签名
[参见此处](/windows/wpf/2015/03/31/sign-for-desktop-application.html)

### 将程序放到受信任的目录下
```
C:\program files
C:\program files x86
C:\Windows\system32
```

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
