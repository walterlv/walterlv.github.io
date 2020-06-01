---
title: "Compare four different file (folder) links on Windows (NTFS hard links, junction points, symbolic links, and well-known shortcuts)"
publishDate: 2020-05-03 14:30:43 +0800
date: 2020-05-21 00:31:28 +0800
categories: windows
position: knowledge
version:
  current: English
versions:
  - 中文: /post/ntfs-link-comparisons.html
  - English: #
---

It is well-known that `mklink` is a command to create a variety of links on NTFS disk. But if you don't know much about it or even never hear of it, it doesn't matter because you know shortcuts at least. This post help you to lean more about `mklink` and know the differences among the difference command options.

---

This post is written in **multiple languages**. Please select yours:

{% include post-version-selector.html %}

<div id="toc"></div>

## Different ways of linking

Windows Vista announced the NTFS symbolic links, Windows 2000 began to have NTFS Reparse Point, and earlier Windows 95 introduced the shortcut. Backing to Windows 3.5 There are hard links. All of them provide you the power to access a same folder or file in difference paths.

### `mklink`

Using `mklink` command, you can create a "hard link", "junction points" and "symbolic link".

```powershell
> mklink
Creates a symbolic link.

MKLINK [[/D] | [/H] | [/J]] Link Target

        /D      Creates a directory symbolic link.  Default is a file
                symbolic link.
        /H      Creates a hard link instead of a symbolic link.
        /J      Creates a Directory Junction.
        Link    Specifies the new symbolic link name.
        Target  Specifies the path (rel
```

e.g:

```powershell
mklink /J current %APPDATA%\walterlv\packages\1.0.0
```

That is to create a junction point linking to `%APPDATA%\walterlv\packages\1.0.0`.

### Shortcuts

Shortcuts is a Windows feature which is different to those introduced by the NTFS.

Shortcut is a file with a `lnk` file extension. This file contains the info indicates how to open the linking file or directory. Maybe most applications use this `lnk` file to execute their programs.

### Others

Reparse Point has been in the Windows operating system since NTFS v3.0 (introduced with Windows 2000). In addition to our previously mentioned three types of reparse points made by `mklink`, there are other types:

- Volume Mount Ppoints
- Distributed Link Tracking（DLT）
- Data Deduplication
- Hierarchical Storage Management（HSM）
- Native Structured Storage（NSS）
- Unix Doman Socket（socket）
- System Compression
- OneDrive

## Comparison

Reading those words above, you may know the usage of `mklink` but don't know the difference between them. Then I've post them below:

|                                          | Hard Link                                                    | Junction Point                                               | Symbolic Link                                                |
| ---------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------ | ------------------------------------------------------------ |
| Command                                  | `mklink /H Link Target`                                      | `mklink /J Link Target`                                      | `mklink /D Link Target`                                      |
| Description                              | Create an alias for a file so that different paths correspond to the data of the same file. |                                                              |                                                              |
| Linking to files                         | ✔️                                                            | ❌                                                            | ❌                                                            |
| Linking to directories                   | ❌                                                            | ✔️                                                            | ✔️                                                            |
| Nees to run as Administrator             | Yes                                                          | No                                                           | No                                                           |
| Supports linking across volumes          | ❌                                                            | ✔️(Local Machine only)                                        | ✔️(including remote path such as SMB)                         |
| Introduced since                         | Supports since Windows NT 3.1<br/>API supports since Windows 2000 by `CreateHardLink()`<br/>Supports since Windows NT 6.0 by command `mklink /H` | Windows 2000+                                                | Windows Vista+                                               |
| Supports targets which is not exist      | ❌                                                            | ✔️                                                            | ✔️                                                            |
| Link to relative directory               | ❌                                                            | ❌(You can create one with relative path but it will change to absolute path automatically.) | ✔️                                                            |
| How to remove                            | del                                                          | rd                                                           | rd / del                                                     |
| When the reparse point is removed        | Only after all hard links to the original file and the original file have been deleted will the file data be deleted. | The original folder is not affected after Windows Vista but is will be deleted in Windows 2000 / XP / 2003. | The original file/folder is not affected.                    |
| When the original file/folder is removed | The hard link can still access the data of the file normally. | Directory connection failed, pointing to a directory that does not exist. | The symbolic link is invalid and points to a directory that does not exist. |

## Extras

If you create shortcuts in your start menu, and the shortcuts are linking to files that are in junction points. All the shortcuts will disappear after a Windows 10 updates. I'm reporting this bug to Microsoft, but before Microsoft resolve this bug we have to work around to avoid this bug. See the bug in scoop below:

- [After the windows 10 updates, all shortcuts of scoop will disappear. · Issue #3941 · lukesampson/scoop](https://github.com/lukesampson/scoop/issues/3941)

---

**References**

- [NTFS reparse point - Wikipedia](https://en.wikipedia.org/wiki/NTFS_reparse_point)
- [windows - What is the difference between NTFS Junction Points and Symbolic Links? - Stack Overflow](https://stackoverflow.com/questions/9042542/what-is-the-difference-between-ntfs-junction-points-and-symbolic-links)
- [Hard link - Wikipedia](https://en.wikipedia.org/wiki/Hard_link)
