---
title: "UWP 中的各种文件路径（用户、缓存、漫游、安装……）"
date: 2018-09-23 14:02:59 +0800
categories: dotnet uwp
published: false
---

UWP 提供了多种不同文件路径访问方式，对应到不同的文件路径中。可能我们只是简单用 `ApplicationData.Current` 获取一下可以读写的路径便能应付我们应用日常所需的各种文件读写需求，不过，UWP 还提供了更多的路径选项。

本文将和你一起总结 UWP 中的各种各样的路径。

---

<div id="toc"></div>

### UWP 中的路径种类

UWP 中可访问的路径有这些：

- [ApplicationData](https://docs.microsoft.com/en-us/uwp/api/windows.storage.applicationdata)
    - 用于储存应用的各种数据
- [Package.InstalledLocation](https://docs.microsoft.com/en-us/uwp/api/windows.applicationmodel.package.installedlocation#Windows_ApplicationModel_Package_InstalledLocation)
    - 提供对应用程序包中各种文件的访问
- [特殊文件夹](https://docs.microsoft.com/en-us/uwp/api/windows.storage.appdatapaths)
    - 提供用户文档、用户收藏夹等特殊文件夹的访问

### ApplicationData

ApplicationData 提供应用程序自己创建的数据的读写能力。它包含这些文件夹：

- Local: 储存在设备上，可被云端备份，在更新之后此数据保留
- LocalCache: 储存在当前设备上，不备份，在更新后此数据保留
- SharedLocal: 储存在设备上，为所有用户共享
- Roaming: 对于同一个用户，会存在于安装了此应用的所用设备中
- Temporary: 允许操作系统在任何时刻删除的临时文件


