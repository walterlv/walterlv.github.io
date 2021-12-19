---
title: "使用各种工具查找文件被占用的原因（标题待定）"
date: 2019-01-06 18:53:14 +0800
tags: windows
position: problem
published: false
coverImage: /static/posts/2019-01-04-10-12-22.png
---

在此处编辑 walterlv.com 的博客摘要

---

<div id="toc"></div>

## 问题



## 调查

![输入法模块在进程中的调用堆栈](/static/posts/2019-01-04-10-12-22.png)

![出现 SHARING VIOLATION 错误 1](/static/posts/2019-01-04-10-13-01.png)

![出现 SHARING VIOLATION 错误 2](/static/posts/2019-01-04-10-14-31.png)

![在出现 SHARING VIOLATION 错误之后的更多错误](/static/posts/2019-01-04-10-14-58.png)


---

**参考资料**

- [Process Monitor - Windows Sysinternals - Microsoft Docs](https://docs.microsoft.com/en-us/sysinternals/downloads/procmon)
- [windows - Understanding a sharing violation using procmon - Stack Overflow](https://stackoverflow.com/questions/39208073/understanding-a-sharing-violation-using-procmon)
- [c++ - CreateFile fails because of SHARIN_VIOLATION because some other OS process is using it - Stack Overflow](https://stackoverflow.com/questions/52813820/createfile-fails-because-of-sharin-violation-because-some-other-os-process-is-us)
- [Windows 2008 R2 - Kernel (System Process PID=4) is locking files and folders - Stack Overflow](https://stackoverflow.com/questions/4378192/windows-2008-r2-kernel-system-process-pid-4-is-locking-files-and-folders)
- [Solved: Encountered a sharing violation while accessing - Revit issue - Autodesk Community](https://forums.autodesk.com/t5/revit-mep-forum/encountered-a-sharing-violation-while-accessing-revit-issue/td-p/5847295)
- [What is the cause of FAST I/O DISALLOWED errors? (Causing Outlook to open attachments really slowly) - Server Fault](https://serverfault.com/questions/104966/what-is-the-cause-of-fast-i-o-disallowed-errors-causing-outlook-to-open-attach)
- [windows - False 'Sharing Violation' Xcopy error message - Stack Overflow](https://stackoverflow.com/questions/20154980/false-sharing-violation-xcopy-error-message)
- [A sharing violation occurred while accessing filename.](https://msdn.microsoft.com/en-us/library/ms831574.aspx?f=255&MSPPError=-2147217396)

