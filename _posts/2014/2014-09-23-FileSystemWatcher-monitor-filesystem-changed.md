---
layout: post
title:  "FileSystemWatcher 监视文件改变"
date:   2014-09-23 20:22:00 +0800
categories: dotnet
permalink: /dotnet/2014/09/23/FileSystemWatcher-monitor-filesystem-changed.html
---

要监视文件或文件夹的改变，可使用 `FileSystemWatcher`。

---

```csharp
FileSystemWatcher fileWatcher = new FileSystemWatcher
{
    Path = watchingFolder,
    NotifyFilter = NotifyFilters.Size | NotifyFilters.LastWrite,
    Filter = "*.log",
    EnableRaisingEvents = true,
};
_fileWatcher.Changed += FileWatcher_Changed;
```

```csharp
private void FileWatcher_Changed(object sender, FileSystemEventArgs e)
{
    if (e.ChangeType == WatcherChangeTypes.Changed)
    {
    }
}
```

需要注意的是，并不是按照以上这种写法就能立即收到改变通知。
有些程序写入文件是立即写入磁盘的（如记事本），在写入时能够通过以上方法立即获得通知；
但有一些不是立即写入磁盘（如 Log4Net），它会有一个缓冲区，程序写入到缓冲区时以上方法不会收到通知。

然而，只要有任何一个进程读取了这个文件（哪怕是只有一个字节），Windows 就会立刻将缓冲区写入磁盘，以上方法也就会收到改变通知了。
