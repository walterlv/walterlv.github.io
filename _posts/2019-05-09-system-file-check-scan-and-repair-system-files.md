---
title: "使用 System File Check (SFC) 工具检查并修复 Windows 系统文件"
date: 2019-05-09 21:02:40 +0800
categories: windows
position: knowledge
---

sfc.exe 这个程序的名称指的是 System File Check，用于做系统文件检查。本文介绍使用此命令检查并修复 Windows 系统文件。

---

<div id="toc"></div>

## 系统要求

Windows Vista 及以上的操作系统才具有 sfc.exe 工具。 *相比于 Windows 7 开始提供 dism 工具。*

当然，虽然系统要求如此，但如果你使用的是 Windows 8/8.1 或者 Windows 10，那么便建议使用 DISM。可以阅读：

- [使用 DISM 工具检查并修复 Windows 系统文件](/post/dism-restore-health.html)

## 使用方法

使用管理员权限启动 CMD，然后输入命令：

```cmd
sfc /scannow
```

接下来等待命令执行完成即可。

![sfc /scannow](/static/posts/2019-05-09-18-44-35.png)

## 命令结果

如果以上命令可以正常完成，那么你可能会遇到三种不同的提示（以下为中英双语版本）

- Windows Resource Protection did not find any integrity violations.
    - Windows 资源保护找不到任何完整性冲突。
- Windows Resource Protection could not perform the requested operation.
    - Windows 资源保护无法执行请求的操作。
- Windows Resource Protection found corrupt files and successfully repaired them. Details are included in the CBS.Log %WinDir%\Logs\CBS\CBS.log.
    - Windows 资源保护找到了损坏的文件并已成功将其修复。 详细信息包含在 CBS.Log（路径为 %WinDir%\Logs\CBS\CBS.log）中。
- Windows Resource Protection found corrupt files but was unable to fix some of them. Details are included in the CBS.Log %WinDir%\Logs\CBS\CBS.log.
    - Windows 资源保护找到了损坏的文件但无法修复其中的某些文件。 详细信息包含在 CBS.Log（路径为 %WinDir%\Logs\CBS\CBS.log）中。

出现第一种提示，则说明没有任何丢失或损坏的系统文件。如果系统存在其他问题，则需要找其他方法来修复。

出现第二种提示，你需要确保 %WinDir%\WinSxS\Temp 下存在 PendingDeletes 和 PendingRenames 文件夹；然后去安全模式中重新尝试此命令。

出现第三种提示，则已经修复了损坏的文件。

而出现第四种提示的话，你可以多次尝试执行此命令。可能多次执行后逐渐修复了所有的文件，也可能毫无作用。这个时候需要考虑其他的方法来修复系统了。

## 此工具的其他命令

可以只做检查而不用尝试修复。

```cmd
sfc /verifyonly
```

---

**参考资料**

- [System file check (SFC) Scan and Repair System Files - Microsoft Community](https://answers.microsoft.com/en-us/windows/forum/windows_10-update/system-file-check-sfc-scan-and-repair-system-files/bc609315-da1f-4775-812c-695b60477a93?auth=1)
- [Use the System File Checker tool to repair missing or corrupted system files](https://support.microsoft.com/en-us/help/929833/use-the-system-file-checker-tool-to-repair-missing-or-corrupted-system)
