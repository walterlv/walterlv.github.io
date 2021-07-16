---
title: "用 WiX Burn 制作托管安装包：出现 0x80070002 错误"
date: 2021-07-16 10:48:59 +0800
categories: dotnet msi wix
position: problem
---

使用 WiX 的 Burn 引擎制作自定义托管引导程序的 exe 安装包时，双击生成的安装包没有反应。如果查看日志可以发现有 `0x80070002` 错误。本文介绍其调查和解决方法。

---

<div id="toc"></div>

## 现象

双击制作的自定义引导程序的 exe 安装包没有反应，通过[查看 Burn 引擎的输出日志](https://blog.walterlv.com/post/how-to-view-wix-burn-installer-logs.html)可以发现如下关键的错误码：

```plaintext
...
[1874:8D8C][2021-07-15T19:28:29]i000: Loading managed bootstrapper application.
[1874:8D8C][2021-07-15T19:28:29]e000: Error 0x80070002: Failed to create the managed bootstrapper application.
[1874:8D8C][2021-07-15T19:28:29]e000: Error 0x80070002: Failed to create UX.
[1874:8D8C][2021-07-15T19:28:29]e000: Error 0x80070002: Failed to load UX.
[1874:8D8C][2021-07-15T19:28:29]e000: Error 0x80070002: Failed while running 
...
[1874:8D8C][2021-07-15T19:28:29]e000: Error 0x80070002: Failed to run per-user mode.
[1874:8D8C][2021-07-15T19:28:29]i007: Exit code: 0x80070002, restarting: No
```

## 调查

通过[查询 HRESULT 错误码](https://blog.walterlv.com/post/hresult-in-windows.html) `0x80070002` 可以得知它代表的意思是“文件不存在”。

```powershell
❯ err 0x80070002
# for hex 0x80070002 / decimal -2147024894
  COR_E_FILENOTFOUND                                             corerror.h
  DIERR_NOTFOUND                                                 dinput.h
  DIERR_OBJECTNOTFOUND                                           dinput.h
  STIERR_OBJECTNOTFOUND                                          stierr.h
  DRM_E_WIN32_FILE_NOT_FOUND                                     windowsplayready.h
  E_FILE_NOT_FOUND                                               wpc.h
# as an HRESULT: Severity: FAILURE (1), FACILITY_NTWIN32 (0x7), Code 0x2
# for hex 0x2 / decimal 2
  STATUS_WAIT_2                                                  ntstatus.h
# as an HRESULT: Severity: FAILURE (1), FACILITY_WIN32 (0x7), Code 0x2
  ERROR_FILE_NOT_FOUND                                           winerror.h
# The system cannot find the file specified.
# 8 matches found for "0x80070002"
```

所以到底是什么不存在呢？

[这篇入门教程](https://blog.walterlv.com/post/getting-started-with-wix-toolset-create-a-wpf-installer-ui)中，涉及到找不到托管引导程序（WiX 官方喜欢称之为 MBA，Managed Bootstrapper Application）的地方可能有这些：

1. Bundle.wxs 文件中将托管引导程序加入到负载的地方
2. BootstrapperCore.config 文件中，设置的 `assemblyName` 属性

对于 1，如果加入到负载时文件不存在，那么这个 Bundle.wxs 所在的项目都无法编译通过，所以 1 原因可以排除。那么只剩下原因 2 了，如果发现其名称与实际程序集名称不一样（例如改了项目名，或者从教程中复制了代码却没有对应改成自己项目中的名字），那么原因就是这个了。

## 解决

修改 BootstrapperCore.config 文件（在[这篇教程](https://blog.walterlv.com/post/getting-started-with-wix-toolset-create-a-wpf-installer-ui)中是 App.config 文件），将 `assemblyName` 的值改为正确的托管引导程序（MBA）的名字。
