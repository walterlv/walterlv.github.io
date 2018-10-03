---
title: "UWP 中的各种文件路径（用户、缓存、漫游、安装……）"
date: 2018-09-23 20:01:28 +0800
categories: dotnet uwp
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

在智能感知提示的帮助下，你也可以找到对应的这几个文件夹：

![ApplicationData 的智能感知提示](/static/posts/2018-09-23-14-55-08.png)  
▲ ApplicationData 的智能感知提示

这些不同的文件夹有着不同建议的用途。Local 文件夹，用来储存用户产生的数据（例如用户创建的文档等）；这部分数据在进行备份的时候会被备份下来。相比之下，LocalCache 和 Temporary 是不受备份影响的。

额外的，

### Package.InstalledLocation

应用程序可以访问安装后程序包所在的路径，使用 `Package.Current.InstalledLocation` 即可获取到应用程序包所在路径。

当然，这部分的路径有更多的快捷访问方式，比如 Uri 以 `/` 开头，就是访问程序包所在路径：

```csharp
var uri = new Windows.Foundation.Uri("/samples/logo.png");
```

还可以以 `ms-appx:///` 协议开头：

```csharp
var uri = new Windows.Foundation.Uri("ms-appx:///samples/logo.png");
var file = Windows.Storage.StorageFile.GetFileFromApplicationUriAsync(uri);
```

### 特殊文件夹

特殊文件夹可以通过 `KnownFolders` 类型获取，可以获取到照片、图片、音乐、视频等文件夹。

- [KnownFolders Class (Windows.Storage) - UWP app developer - Microsoft Docs](https://docs.microsoft.com/en-us/uwp/api/windows.storage.knownfolders)
