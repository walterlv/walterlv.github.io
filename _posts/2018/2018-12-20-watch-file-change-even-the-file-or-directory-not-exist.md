---
title: "文件和文件夹不存在的时候，FileSystemWatcher 监听不到文件的改变？如果递归地监听就可以了"
date: 2018-12-20 10:05:38 +0800
tags: dotnet windows
position: problem
permalink: /post/watch-file-change-even-the-file-or-directory-not-exist.html
---

当你需要监视文件或文件夹的改变的时候，使用 `FileSystemWatcher` 便可以完成。不过，`FileSystemWatcher` 对文件夹的监视要求文件夹必须存在，否则会产生错误“无效路径”。

那么，如果文件或文件夹不存在的时候可以怎么监视文件的改变呢？更麻烦的是如果顶层很多级文件夹都不存在，怎么能监视呢？本文将告诉你方法。

本文的代码适用于 .NET Framework 和 .NET Core，同时不需要任何第三方依赖。

---

<div id="toc"></div>

## 方法一：创建文件夹（在逃避问题，但也不失为一种解决思路）

如果文件夹不存在，把它创建出来就可以监视了嘛！这其实是在逃避问题。不过我把它写出来是因为如果我不说，可能有些小伙伴原本简单的问题就会变得复杂化。

```csharp
public void Watch(string file)
{
    path = Path.GetFullPath(file);
    var directory = Path.GetDirectoryName(path);
    var file = Path.GetFileName(path);

    // 如果文件夹不存在，则创建文件夹。
    if (!Directory.Exists(directory))
    {
        Directory.CreateDirectory(directory);
    }

    // 监视 directory 文件夹下的 file 文件的改变
    var watcher = new FileSystemWatcher(directory, file)
    {
        EnableRaisingEvents = true,
        NotifyFilter = NotifyFilters.LastWrite,
    };
    watcher.Changed += FinalFile_Changed;
    // 使用 watcher 做其他的事情。
}

private void FinalFile_Changed(object sender, FileSystemEventArgs e)
{
    // 当文件改变的时候，这里的代码会执行。
}
```

以上代码的含义是：

1. 将文件路径取出来，分为文件夹部分和文件部分；
1. 判断文件夹是否存在，如果不存在，则创建文件夹；
1. 监视文件夹中此文件的改变。

需要说明的是，`FileSystemWatcher` 原本是监视文件夹的，第一个参数是监视的文件夹的路径，而第二个参数是监视文件或文件夹的过滤通配符。

不过，官方文档的说明是：

> To watch a specific file, set the Filter property to the file name. For example, to watch for changes in the file MyDoc.txt, set the Filter property to "MyDoc.txt".

如果你需要监听一个特定的文件，那么直接将后面的过滤器设定为文件名，那么就会直接监视到对应的文件。

如果你的业务当中，反正始终都是要创建这个文件的，那么一开始创建了这个文件夹就能避免不少的麻烦。这也是我把这个方法放到这里作为首选方法的原因。虽然实际上这是在逃避问题，但真的是一个好方法。

## 方法二：递归监视文件夹

这种方法适用于如果文件或者文件夹不存在时，你不能创建这个文件夹的情况。也许是你的业务需要，也许因为你正在写库，库作为最为通用的业务，不希望改变用户的环境。

这时，我们可以考虑的思路是 —— **递归地监视文件或文件夹**。

例如，我们有这样的文件夹结构：

> C:\a\b\x.txt

希望监听 x.txt 的改变。

那么，如果 b 文件夹不存在，就监听 a 文件夹，如果 a 文件夹也不存在，那么就监听 C: 驱动器。实际上，我们不需要再去考虑 C: 驱动器也不存在的情况了（当你真的遇到的时候，考虑业务上规避吧……）。

### 代码实现

既然需要递归监视，那么我们需要查找第一次监视的时候，需要到哪一层。

这里，我们可以用一个 `while` 循环来进行，一层一层查找文件夹。直到能够找到一层，文件夹存在而子文件夹不存在的情况。这时我们便能够监视子文件夹的创建了。

我写了一个函数，用于返回这时存在的那个文件夹，和不存在的那个子文件夹或者文件。

当然有特殊情况，就是文件直接就已经存在的情况下，也是返回文件所在的文件夹和此文件名的。

```csharp
private (string directory, string file) FindWatchableLevel()
{
    var path = _file.FullName;

    // 如果文件存在，就返回文件所在的文件夹和文件本身。
    if (File.Exists(path))
    {
        return (Path.GetDirectoryName(path), Path.GetFileName(path));
    }

    // 如果文件不存在，但文件夹存在，也是返回文件夹和文件本身。
    // 这一点在下面的第一层循环中体现。

    // 对于每一层循环。
    while (true)
    {
        var directory = Path.GetDirectoryName(path);
        var file = Path.GetFileName(path);

        // 检查文件夹是否存在，只要文件夹存在，那么就可以返回。
        if (Directory.Exists(directory))
        {
            return (directory, file);
        }

        // 如果连文件夹都不存在，那么就需要查找上一层文件夹。
        path = directory;
    }
}
```

接下来，根据得到的文件夹和文件，判断其存在与否，决定是监视这个文件的改变，还是监视文件/文件夹结构的改变。如果文件/文件夹的结构改变，那么就需要重新调用这个方法再查找应该监视的文件夹了。

```csharp
public void Watch()
{
    var (directory, file) = FindWatchableLevel();
    if (File.Exists(_file.FullName))
    {
        // 如果文件存在，说明这是最终的文件。
        // 注意使用 File.Exists 判断已存在的同名文件夹时会返回 false。
        _watcher = new FileSystemWatcher(directory, file)
        {
            EnableRaisingEvents = true,
            NotifyFilter = NotifyFilters.LastWrite,
        };
        _watcher.Changed += FinalFile_Changed;
        _watcher.Deleted += FileOrDirectory_CreatedOrDeleted;
    }
    else
    {
        // 注意这里的 file 可能是文件也可能是文件夹。
        _watcher = new FileSystemWatcher(directory, file)
        {
            EnableRaisingEvents = true,
        };
        _watcher.Created += FileOrDirectory_CreatedOrDeleted;
        _watcher.Renamed += FileOrDirectory_CreatedOrDeleted;
        _watcher.Deleted += FileOrDirectory_CreatedOrDeleted;
    }
}
```

我们通过 `File.Exists(_file.FullName)` 来判断最终的文件是否存在，用以区分是在监视最终的文件改变，还是监视文件夹结构的改变。

```csharp
private void FileOrDirectory_CreatedOrDeleted(object sender, FileSystemEventArgs e)
{
    // 在文件/文件夹结构发生改变的时候，重新监视。
    _watcher?.Dispose();
    Watch();
}

private void FinalFile_Changed(object sender, FileSystemEventArgs e)
{
    // 这里就是最终文件改变的地方了。
}
```

### 完整的代码和使用方法

由于代码还是有一点点多。如果放到你原有的业务当中，对你的业务代码确实是一种污染。所以我封装了一个类 `FileWatcher`。它不需要依赖任何就可以使用，你可以将它拷贝到你的项目当中。

代码可以阅读本文文末，或者前往 gist 查看：[FileWatcher that helps you to watch a single file change even if the file or it's owner folders does not exists.](https://gist.github.com/walterlv/cffec6dd951780ea946feb2ea96f302a)。

使用方法与 `FileSystemWatcher` 类似，但是更简单：

```csharp
_watcher = new FileWatcher(@"C:\Users\walterlv\Desktop\demo.txt");
_watcher.Changed += OnFileChanged;
_watcher.Watch();
```

```csharp
private void OnFileChanged(object sender, EventArgs e)
{
    // 最纯粹的文件改变事件，仅在文件的内容真的改变的时候触发。
}
```

### 此方法的特点，优势和不足

实际上，`FileSystemWatcher` 的监视也是有一些空洞的。如果你只是监视一级文件夹而不是递归监视子文件夹（通过设置 `IncludeSubdirectories` 属性来指定），那么就会存在一些情况是监视不到的。然而如果你真的递归监视子文件夹，又会监听到大量的事件需要过滤。

那么此方法可以支持和不支持的情况有哪些呢？

依然假设监视的文件是：*C:\a\b\x.txt* 。

支持这些情况：

1. 一开始文件 x.txt 不存在，而后创建。
1. 一开始 b\x.txt 不存在，而后依次创建。
1. 从 y.txt 文件重命名到 x.txt。
1. 一开始文件 x.txt 存在，而后删除，再然后重新创建。

不支持这些情况：

1. 一开始文件存在，但你直接删除了 a 或者 b 文件夹，而不是先删除了 x.txt。
1. 一开始文件存在，但直接将 b\x.txt 连文件带文件夹一起移走，然后删除文件或文件夹。
1. 一开始 b\x.txt 都不存在，但现在保持文件夹结构连文件带文件夹一起移入到 a 文件夹中。

当然，也有一些意外的发现：

1. 一开始文件存在，但直接将 b\x.txt 连文件带文件夹一起移走，这时依然能监听到 x.txt 文件的改变，但它已经不在原来的目录了。

### 附所有源码

如果看不到，请访问：[FileWatcher that helps you to watch a single file change even if the file or it's owner folers does not exists.](https://gist.github.com/walterlv/cffec6dd951780ea946feb2ea96f302a)。

<script src="https://gist.github.com/walterlv/cffec6dd951780ea946feb2ea96f302a.js"></script>

---

**参考资料**

- [FileSystemWatcher Class (System.IO) - Microsoft Docs](https://docs.microsoft.com/en-us/dotnet/api/system.io.filesystemwatcher?view=netframework-4.7.2)
- [c# - How can i use FileSystemWatcher to watch directory if directory not exist? - Stack Overflow](https://stackoverflow.com/a/29602014/6233938)
- [FileSystemWatcher - Pure Chaos (Part 1 of 2) - CodeProject](https://www.codeproject.com/Articles/58740/FileSystemWatcher-Pure-Chaos-Part-1-of-2)
- [FileSystemWatcher - Pure Chaos (Part 2 of 2) - CodeProject](https://www.codeproject.com/Articles/58741/FileSystemWatcher-Pure-Chaos-Part-2-of-2)
- [Recursive Directory Watch - CodeProject](https://www.codeproject.com/Articles/3251/Recursive-Directory-Watch)
- [How does Read File watch for changes? - Grasshopper](https://www.grasshopper3d.com/forum/topics/how-does-read-file-watch-for-changes)
- [c# - Reading file after writing it - Stack Overflow](https://stackoverflow.com/questions/17719905/reading-file-after-writing-it)

