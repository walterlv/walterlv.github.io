---
title: "Windows 无法删除文件夹 —— 访问被拒绝 / 因为目录不是空的"
publishDate: 2018-08-13 17:21:04 +0800
date: 2018-09-01 08:14:59 +0800
tags: windows
coverImage: /static/posts/2018-08-13-15-38-13.png
---

在日常使用 Windows 10 时，有时会遇到删除很普通的文件夹时提示“访问被拒绝”，以管理员权限重试后依然提示没有权限。如果使用命令行删除，则会提示“无法删除文件夹 XXX，目录不是空的。”。

本文将介绍其原因并提供解决方案。

---

<div id="toc"></div>

## 删除文件夹遭到拒绝

有时我们在删除一个很普通的文件夹时，会提示需要提升权限才能删除。

![需要提升权限](/static/posts/2018-08-13-15-38-13.png)  
▲ 需要提升权限

其实按照经验，这种问题与权限并没有什么关系。尤其是以上这种 NuGet 缓存目录下的文件夹，和权限更是扯不上关系。

所以其实点了“继续”也并没有什么左右，依然是没完没了的错误。

![需要访问权限](/static/posts/2018-08-13-15-40-53.png)  
▲ 需要访问权限

如果我 **一层层进入到文件夹的里面**，然后 **先删除文件**，再一层层 **退出来删掉文件夹**，那么这个文件夹就能被正常删除掉。

这至少能说明，**并没有文件或文件夹处于被占用的状态**！！！

所以这个时候我考虑使用命令行删除：

![使用命令行删除](/static/posts/2018-08-13-16-06-01.png)  
▲ 使用命令行删除

命令行删除时，给了一个错误提示：

> rd : Directory C:\Users\lvyi\.nuget\packages\walterlv.package.demo\12
> .0.27-alpha\src\Demo_\MagicalDemo_\Magical_ cannot be removed
> because it is not empty.

意思是说，命令行在删除其中一个子文件夹的时候出错，原因是：“目录不是空的。”

如果继续翻看下面的错误提示，发现这是一个按文件夹递归的提示。

## 解决方案

在网上搜索“目录不是空的”能得到不少结果，而且提供了不少解决方案：

- [windows - Batch - Getting "The directory is not empty" on rmdir command - Stack Overflow](https://stackoverflow.com/q/22948189/6233938)
- [powershell - Cannot remove item. The directory is not empty - Stack Overflow](https://stackoverflow.com/q/38141528/6233938)
- 还有更多……

然而，无论敲入什么样的命令，都没有用。这时我抱着试一试的心态去搜索框（小娜）中搜索“资源监视器”或直接输入 resmon 命令打开资源监视器。在“关联的句柄”中我输入了无法删除的文件夹名称，才终于找到了根本原因：

![资源监视器](/static/posts/2018-08-13-16-51-43.png)  
▲ 资源监视器

结束掉可能用到了这个版本 NuGet 包的 Visual Studio 后，文件夹可以被正常删除掉了。

![删除文件夹](/static/posts/2018-08-13-16-58-19.png)  
▲ 因为删除太快，好不容易抓到的一张图

所以什么“需要管理员权限”啊，什么“目录不是空的”，都是假的！！！真正的原因还是文件夹被占用。

