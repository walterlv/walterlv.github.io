---
title: "各个版本 Windows 11 / Windows 10 的名称、完整版本号、开发代号和系统自带的 .NET Framework 版本"
publishDate: 2017-10-17 10:49:40 +0800
date: 2021-11-08 16:51:50 +0800
tags: windows dotnet
permalink: /post/embeded-dotnet-version-in-all-windows.html
---

自 Windows 10 (1903) 版本开始，自带的 .NET Framework 版本一直保持为 4.8 并且不再允许手动安装。如果 .NET Framework 出了问题，基本只能重装系统；而 Windows Update 就有可能把 .NET Framework 搞坏。

---

## Windows 11

| Windows 11 名称 | 构建版本   | 产品版本 | 开发代号 | 自带的 .NET Framework 版本 |
| :-------------- | :--------- | :------- | :------- | :------------------------- |
| Windows 11      | 10.0.22000 | 21H2     | 太阳谷   | .NET Framework 4.8         |

## Windows 10

| Windows 10 名称                 | 构建版本   | 产品版本 | 开发代号 | 自带的 .NET Framework 版本 |
| :------------------------------ | :--------- | :------- | :------- | :------------------------- |
| November 2021 Update            | 10.0.19044 | 21H2     | 21H2     | .NET Framework 4.8         |
| May 2021 Update                 | 10.0.19043 | 21H1     | 21H1     | .NET Framework 4.8         |
| October 2020 Update             | 10.0.19042 | 20H2     | 20H2     | .NET Framework 4.8         |
| May 2020 Update                 | 10.0.19041 | 2004     | 20H1     | .NET Framework 4.8         |
| November 2019 Update            | 10.0.18363 | 1909     | 19H2     | .NET Framework 4.8         |
| Windows 10 May 2019 Update      | 10.0.18362 | 1903     | 19H1     | .NET Framework 4.8         |
| Windows 10 October 2018 Update  | 10.0.17763 | 1809     | RS5      | .NET Framework 4.7.2       |
| Windows 10 April 2018 Update    | 10.0.17134 | 1803     | RS4      | .NET Framework 4.7.2       |
| Windows 10 Fall Creators Update | 10.0.16299 | 1709     | RS3      | .NET Framework 4.7.1       |
| Windows 10 Creators Update      | 10.0.15063 | 1703     | RS2      | .NET Framework 4.7         |
| Windows 10 Anniversary Update   | 10.0.14393 | 1607     | RS1      | .NET Framework 4.6.2       |
| Windows 10 November Update      | 10.0.10586 | 1511     | TH2      | .NET Framework 4.6.1       |
| Windows 10                      | 10.0.10240 | 1507     | TH1      | .NET Framework 4.6         |

## Windows Server

| Windows Server 名称 | 自带的 .NET Framework 版本 |
| :------------------ | -------------------------- |
| Windows Server 1803 | .NET Framework 4.7.2       |
| Windows Server 1709 | .NET Framework 4.7.1       |
| Windows Server 2016 | .NET Framework 4.6.2       |

---

**参考资料**

- [How to: Determine which .NET Framework versions are installed -Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/framework/migration-guide/how-to-determine-which-versions-are-installed?wt.mc_id=MVP)
- [Windows 10 release information - current branch, build history](https://technet.microsoft.com/en-us/windows/release-info.aspx)
- [Windows 10 version history - Wikipedia](https://en.wikipedia.org/wiki/Windows_10_version_history)
- [Builds • The Collection Book](https://www.thecollectionbook.info/builds/windows)

