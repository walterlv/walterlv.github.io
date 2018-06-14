---
title: "Windows 10 四月更新，文件夹名称也能区分大小写？"
date: 2018-06-14 08:02:24 +0800
categories: windows
---

Windows 向来是不区分文件和文件夹大小写的，但是从 NTFS 开始却又支持区分文件夹大小写。而 Linux/Mac OS 一向都是区分文件和文件夹大小写的。

本文将推荐 Windows 10 四月更新带来的新特性——让文件夹名称也能区分大小写。

---

本来文件系统是否区分大小写只是单纯风格上的差异，并没有孰优孰劣，但这可让那些跨平台的文件系统难以抉择了。典型的例子就是 Git。

我曾经就遭遇过 Git 操作上的大小写敏感性问题，写了一篇博客：[解决 Git 重命名时遇到的大小写不敏感的问题](/post/case-insensitive-in-git-rename.html)。

由于 Windows 文件系统对大小写不敏感，所以上面的问题才变得尤其难办，竟然需要通过至少两次提交，并且丢掉单线的 Git 历史记录的方式才能真正完成任务。而单纯让 Git 在仓库中区分大小写竟然会产生两份文件（却无法在 Windows 系统中观察到）。

于是，Windows 10 四月更新终于带来了文件夹区分大小写的支持！

```powershell
fsutil.exe file SetCaseSensitiveInfo C:\Users\walterlv\GitDemo enable
```

是的，就是上面这一段非常简单而容易理解的命令即可开启**单个文件夹**的名称区分大小写功能。只是单个文件夹！如果需要开启其他文件夹，需要多次执行这样的命令。

而如果需要关闭对此文件夹的大小写支持，只需要将 `enable` 改为 `disable`。

```powershell
fsutil.exe file SetCaseSensitiveInfo C:\Users\walterlv\GitDemo disable
```

![](/static/posts/2018-06-14-07-55-53.png)

看！以上就是在 Windows 10 系统级开启了大小写敏感的我的一个 Git 仓库，这下可以让跨平台的 Git 工作起来在各个系统都一样了。

---

### 附

`fsutil file` 支持的命令：

```powershell
 ⚡ lvyi@walterlv.github.io> fsutil.exe file
---- FILE Commands Supported ----

createNew                Creates a new file of a specified size
findBySID                Find a file by security identifier
layout                   Query all the information available about the file
optimizeMetadata         Optimize metadata for a file
queryAllocRanges         Query the allocated ranges for a file
queryCaseSensitiveInfo   Query the case sensitive information for a directory
queryExtents             Query the extents for a file
queryExtentsAndRefCounts Query the extents and their corresponding refcounts for a file
queryFileID              Queries the file ID of the specified file
queryFileNameById        Displays a random link name for the file ID
queryOptimizeMetadata    Query the optimize metadata state for a file
queryValidData           Queries the valid data length for a file
setCaseSensitiveInfo     Set the case sensitive information for a directory
setShortName             Set the short name for a file
setValidData             Set the valid data length for a file
setZeroData              Set the zero data for a file
setEOF                   Sets the end of file for an existing file
setStrictlySequential    Sets ReFS SMR file as strictly sequential
```

fsutil 支持的命令：

```powershell
 ⚡ lvyi@walterlv.github.io> fsutil.exe
---- Commands Supported ----

8dot3name       8dot3name management
behavior        Control file system behavior
dax             Dax volume management
dirty           Manage volume dirty bit
file            File specific commands
fsInfo          File system information
hardlink        Hardlink management
objectID        Object ID management
quota           Quota management
repair          Self healing management
reparsePoint    Reparse point management
resource        Transactional Resource Manager management
sparse          Sparse file control
tiering         Storage tiering property management
transaction     Transaction management
usn             USN management
volume          Volume management
wim             Transparent wim hosting management
```
