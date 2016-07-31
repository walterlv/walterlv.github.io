---
layout: post
title:  "让 Windows 桌面程序运行在 Windows 应用上面"
date:   2015-03-31 16:47:00 +0800
categories: Windows WPF
---

#### 修改 Manifest
```xml
<requestedExecutionLevel level="asInvoker" uiAccess="true" />
```

#### 修改窗口属性
```CSharp
ShowInTaskbar=true
TopMost=true
```

#### 为程序签名
[参见此处]({{ site.baseurl }}/windows/wpf/2015/03/31/sign-for-desktop-application.html)

#### 将程序放到受信任的目录下
```
C:\program files
C:\program files x86
C:\Windows\system32
```

#### 参考资料

How to make Windows 8 desktop apps shown in Metro UI (like Task Manager)?  
[http://stackoverflow.com/questions/12873323/how-to-make-windows-8-desktop-apps-shown-in-metro-ui-like-task-manager](http://stackoverflow.com/questions/12873323/how-to-make-windows-8-desktop-apps-shown-in-metro-ui-like-task-manager)

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
