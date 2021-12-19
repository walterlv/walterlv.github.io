---
title: "谨慎使用 FileInfo.Exists 实例方法，而是使用 File.Exists 静态方法替代"
date: 2018-12-30 16:41:21 +0800
tags: dotnet windows
position: problem
permalink: /post/file-exists-vs-fileinfo-exists.html
---

如果你在代码中使用了 `FileInfo.Exists` 实例方法来判断一个文件是否存在，也许会发现此方法可能错误地判断来一个文件是否真的存在。这是一个坑。

本文将介绍坑的原因，并提供填坑的办法。

---

<div id="toc"></div>

## 问题代码

我们使用两种不同的方式判断文件是否存在：

- `FileInfo.Exists` 实例方法
- `File.Exists` 静态方法

```csharp
static async Task Main(string[] args)
{
    var filePath = @"C:\Users\lvyi\Desktop\walterlv.log";
    var fileInfo = new FileInfo(filePath);
    while (true)
    {
        Console.WriteLine($"FileInfo.Exists = {fileInfo.Exists}");
        Console.WriteLine($"    File.Exists = {File.Exists(filePath)}");
        Console.WriteLine("----");
        await Task.Delay(1000);
    }
}
```

现在运行这个程序，我们会发现，中途删除了 walterlv.log 文件之后，`FileInfo.Exists` 依然返回了 `true`，而 `File.Exists` 已经开始返回 `false` 了。

![以上代码在的运行结果](/static/posts/2018-12-30-named-mutex-demo.gif)

## 原因分析

实际翻阅代码可以发现，`FileInfo.Exists` 和 `File.Exists` 方法最终都是使用相同的方法来完成文件存在与否的判断。

这是 `FileInfo.Exists` 的判断：

```csharp
public override bool Exists
{
    [SecuritySafeCritical] get
    {
        try
        {
            if (this._dataInitialised == -1)
                this.Refresh();
            if (this._dataInitialised != 0)
                return false;
            return (this._data.fileAttributes & 16) == 0;
        }
        catch
        {
            return false;
        }
    }
}
```

这是 `File.Exists` 的最终判断：

```csharp
public static bool FileExists(string fullPath)
{
    Interop.Kernel32.WIN32_FILE_ATTRIBUTE_DATA data = new Interop.Kernel32.WIN32_FILE_ATTRIBUTE_DATA();
    int errorCode = FillAttributeInfo(fullPath, ref data, returnErrorOnNotFound: true);

    return (errorCode == 0) && (data.dwFileAttributes != -1)
            && ((data.dwFileAttributes & Interop.Kernel32.FileAttributes.FILE_ATTRIBUTE_DIRECTORY) == 0);
}
```

只不过，`FileInfo.Exists` 只会在没有初始化的时候初始化一次，而 `File.Exists` 是没有缓存的，每次都是直接去获取文件的属性（这就涉及到 IO）。

## 解决办法

所以，如果你正在处理的文件在不同的时间可能存在也可能不存在，那么最好使用 `File.Exists` 来判断文件存在与否，而不是使用 `FileInfo.Exists` 来判断。

不过，如果你需要一次性判断文件的非常多的信息（而不只是文件存在与否），那么依然建议使用 `FileInfo`，只不过在使用之前需要调用 `Refresh` 进行一次刷新。

